// ============================================================================
// User Profile - 用户资料管理程序（第三方系统版本）
// ============================================================================
//
// 设计说明：
// - 系统有一个统一的管理员钱包（admin）
// - 为第三方系统的用户创建链上资料（通过 user_id 标识）
// - 所有费用由系统管理员钱包支付
// - PDA seeds: [b"user-profile", admin.key(), user_id]
//
// 功能：
// - 创建用户资料（管理员为第三方用户创建）
// - 更新用户资料（管理员更新）
// - 删除用户资料（管理员删除）
// - 查询用户资料
//
// 使用场景：
// - Web2 应用的链上数据存储
// - 中心化管理的 DApp 后端
// - 第三方系统集成 Solana
//
// ============================================================================

use anchor_lang::prelude::*;

// 声明程序 ID（由 Anchor 自动生成）
declare_id!("3cSw9RozRy2bUVsB5PhBGKFHoy4CYCReEB99FmW1eUHL");

#[program]
pub mod user_profile {
    use super::*;

    /// 创建用户资料
    ///
    /// # 功能
    /// - 系统管理员为第三方用户创建链上资料
    /// - 使用 user_id 作为唯一标识符
    /// - 所有费用由管理员钱包支付
    /// - 使用 PDA 确保每个 user_id 只能有一个资料
    ///
    /// # 参数
    /// - `user_id`: 第三方系统的用户 ID（最多 32 字符，如 "user123", "alice@example.com"）
    /// - `username`: 用户名（最多 32 字符）
    /// - `email`: 邮箱地址（最多 64 字符）
    /// - `age`: 年龄（0-255）
    /// - `bio`: 个人简介（最多 256 字符）
    ///
    /// # 权限
    /// - 只有系统管理员可以创建
    /// - 每个 user_id 只能创建一个资料
    ///
    /// # 返回
    /// - `Ok(())`: 创建成功
    /// - `Err(ProfileError::*)`: 相应的验证错误
    pub fn create_profile(
        ctx: Context<CreateProfile>,
        user_id: String,
        username: String,
        email: String,
        age: u8,
        bio: String,
    ) -> Result<()> {
        // 验证：user_id 长度
        require!(user_id.len() <= 32, ProfileError::UserIdTooLong);
        // 验证：user_id 不能为空
        require!(!user_id.is_empty(), ProfileError::UserIdEmpty);
        // 验证：用户名长度
        require!(username.len() <= 32, ProfileError::UsernameTooLong);
        // 验证：邮箱长度
        require!(email.len() <= 64, ProfileError::EmailTooLong);
        // 验证：个人简介长度
        require!(bio.len() <= 256, ProfileError::BioTooLong);
        // 验证：用户名不能为空
        require!(!username.is_empty(), ProfileError::UsernameEmpty);
        // 验证：邮箱不能为空
        require!(!email.is_empty(), ProfileError::EmailEmpty);

        // 获取当前时间戳（Unix 时间戳，秒）
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        // 获取用户资料账户的可变引用
        let profile = &mut ctx.accounts.user_profile;

        // 设置用户资料字段
        profile.admin = ctx.accounts.admin.key();   // 系统管理员公钥
        profile.user_id = user_id.clone();          // 第三方用户 ID
        profile.username = username.clone();        // 用户名
        profile.email = email.clone();              // 邮箱
        profile.age = age;                          // 年龄
        profile.bio = bio.clone();                  // 个人简介
        profile.created_at = current_time;          // 创建时间
        profile.updated_at = current_time;          // 更新时间
        profile.bump = ctx.bumps.user_profile;      // PDA bump

        // 记录日志
        msg!("✅ User profile created successfully");
        msg!("   User ID: {}", user_id);
        msg!("   Username: {}", username);
        msg!("   Email: {}", email);
        msg!("   Age: {}", age);
        msg!("   Created at: {}", current_time);

        Ok(())
    }

    /// 更新用户资料
    ///
    /// # 功能
    /// - 系统管理员更新用户资料
    /// - 自动更新 updated_at 时间戳
    /// - 支持部分更新（可选字段）
    ///
    /// # 参数
    /// - `user_id`: 第三方用户 ID（用于查找资料）
    /// - `username`: 新的用户名（可选，传 None 保持不变）
    /// - `email`: 新的邮箱（可选）
    /// - `age`: 新的年龄（可选）
    /// - `bio`: 新的个人简介（可选）
    ///
    /// # 权限
    /// - **只有系统管理员**可以更新
    ///
    /// # 返回
    /// - `Ok(())`: 更新成功
    /// - 相应的验证错误
    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        _user_id: String,  // 用于 PDA 派生，函数体内不使用
        username: Option<String>,
        email: Option<String>,
        age: Option<u8>,
        bio: Option<String>,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;

        // 更新用户名（如果提供）
        if let Some(new_username) = username {
            require!(new_username.len() <= 32, ProfileError::UsernameTooLong);
            require!(!new_username.is_empty(), ProfileError::UsernameEmpty);
            profile.username = new_username;
            msg!("📝 Username updated");
        }

        // 更新邮箱（如果提供）
        if let Some(new_email) = email {
            require!(new_email.len() <= 64, ProfileError::EmailTooLong);
            require!(!new_email.is_empty(), ProfileError::EmailEmpty);
            profile.email = new_email;
            msg!("📝 Email updated");
        }

        // 更新年龄（如果提供）
        if let Some(new_age) = age {
            profile.age = new_age;
            msg!("📝 Age updated to: {}", new_age);
        }

        // 更新个人简介（如果提供）
        if let Some(new_bio) = bio {
            require!(new_bio.len() <= 256, ProfileError::BioTooLong);
            profile.bio = new_bio;
            msg!("📝 Bio updated");
        }

        // 更新时间戳
        let clock = Clock::get()?;
        profile.updated_at = clock.unix_timestamp;

        msg!("✅ Profile updated successfully");
        msg!("   User ID: {}", profile.user_id);
        msg!("   Updated at: {}", profile.updated_at);

        Ok(())
    }

    /// 删除用户资料
    ///
    /// # 功能
    /// - 系统管理员删除用户资料
    /// - 将账户中的 SOL 退还给管理员
    /// - 释放账户占用的存储空间
    ///
    /// # 参数
    /// - `user_id`: 第三方用户 ID（用于查找资料）
    ///
    /// # 权限
    /// - **只有系统管理员**可以删除
    ///
    /// # 返回
    /// - `Ok(())`: 删除成功
    pub fn delete_profile(ctx: Context<DeleteProfile>, _user_id: String) -> Result<()> {
        let profile = &ctx.accounts.user_profile;

        // 记录日志
        msg!("🗑️  Deleting user profile");
        msg!("   User ID: {}", profile.user_id);
        msg!("   Username: {}", profile.username);
        msg!("   Created at: {}", profile.created_at);

        // Anchor 会自动执行以下操作（通过 #[account(close = admin)] 约束）：
        // 1. 将账户中的所有 lamports 转给 admin
        // 2. 清空账户数据
        // 3. 将账户标记为已关闭

        msg!("✅ Profile deleted successfully");

        Ok(())
    }
}

// ============================================================================
// 账户验证结构
// ============================================================================

/// 创建用户资料的账户验证
///
/// # 账户说明
/// - `user_profile`: 要创建的用户资料 PDA 账户
/// - `admin`: 系统管理员（签名者，支付租金）
/// - `system_program`: 系统程序
///
/// # PDA Seeds
/// - `[b"user-profile", admin.key().as_ref(), user_id.as_bytes()]`
/// - admin: 系统管理员钱包地址（固定）
/// - user_id: 第三方用户 ID（变化）
/// - 确保每个 user_id 只能有一个资料
#[derive(Accounts)]
#[instruction(user_id: String)]  // 声明指令参数，用于 PDA seeds
pub struct CreateProfile<'info> {
    /// 用户资料账户（PDA）
    #[account(
        init,                                  // 初始化新账户
        payer = admin,                         // 由系统管理员支付租金
        space = 8 + UserProfile::INIT_SPACE,   // 账户空间
        seeds = [                              // PDA seeds
            b"user-profile",                   // 固定前缀
            admin.key().as_ref(),              // 系统管理员钱包地址
            user_id.as_bytes()                 // 第三方用户 ID
        ],
        bump                                   // PDA bump（自动计算）
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// 系统管理员（必须签名，支付租金）
    #[account(mut)]  // mut: 因为要支付租金
    pub admin: Signer<'info>,

    /// 系统程序
    pub system_program: Program<'info, System>,
}

/// 更新用户资料的账户验证
///
/// # 账户说明
/// - `user_profile`: 要更新的用户资料账户
/// - `admin`: 系统管理员（必须签名）
///
/// # 权限验证
/// - `has_one = admin`: 验证 user_profile.admin == admin
#[derive(Accounts)]
#[instruction(user_id: String)]  // 声明指令参数，用于 PDA seeds
pub struct UpdateProfile<'info> {
    /// 用户资料账户（PDA，可变）
    #[account(
        mut,                                   // 可变：数据会更新
        has_one = admin,                       // 验证：必须是系统管理员
        seeds = [                              // 验证 PDA
            b"user-profile",
            admin.key().as_ref(),              // 系统管理员钱包地址
            user_id.as_bytes()                 // 第三方用户 ID
        ],
        bump = user_profile.bump               // 使用存储的 bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// 系统管理员（必须签名）
    pub admin: Signer<'info>,
}

/// 删除用户资料的账户验证
///
/// # 账户说明
/// - `user_profile`: 要删除的用户资料账户
/// - `admin`: 系统管理员（接收退还的 SOL）
///
/// # 效果
/// - 账户被关闭，SOL 退还给管理员
#[derive(Accounts)]
#[instruction(user_id: String)]  // 声明指令参数，用于 PDA seeds
pub struct DeleteProfile<'info> {
    /// 用户资料账户（PDA，将被关闭）
    #[account(
        mut,                                   // 可变：账户会被关闭
        has_one = admin,                       // 验证：必须是系统管理员
        close = admin,                         // 关闭账户，SOL 退还给管理员
        seeds = [                              // 验证 PDA
            b"user-profile",
            admin.key().as_ref(),              // 系统管理员钱包地址
            user_id.as_bytes()                 // 第三方用户 ID
        ],
        bump = user_profile.bump               // 使用存储的 bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// 系统管理员（必须签名，接收退还的 SOL）
    #[account(mut)]  // mut: 因为会接收 SOL
    pub admin: Signer<'info>,
}

// ============================================================================
// 数据结构
// ============================================================================

/// 用户资料数据结构（第三方系统版本）
///
/// # 字段说明
/// - `admin`: 系统管理员钱包地址（固定，所有资料共享）
/// - `user_id`: 第三方系统的用户 ID（唯一标识，如 "user123"）
/// - `username`: 用户名（最多 32 字符）
/// - `email`: 邮箱地址（最多 64 字符）
/// - `age`: 年龄（0-255）
/// - `bio`: 个人简介（最多 256 字符）
/// - `created_at`: 创建时间（Unix 时间戳）
/// - `updated_at`: 最后更新时间（Unix 时间戳）
/// - `bump`: PDA bump seed
///
/// # 存储空间
/// ```
/// 8 字节    - Anchor 账户判别器
/// 32 字节   - admin (Pubkey)
/// 36 字节   - user_id (4 + 32)
/// 36 字节   - username (4 + 32)
/// 68 字节   - email (4 + 64)
/// 1 字节    - age (u8)
/// 260 字节  - bio (4 + 256)
/// 8 字节    - created_at (i64)
/// 8 字节    - updated_at (i64)
/// 1 字节    - bump (u8)
/// ---------
/// 458 字节  总计
/// ```
///
/// # 使用场景
/// - Web2 应用的链上数据存储
/// - 第三方系统集成 Solana
/// - 中心化管理的 DApp 后端
/// - 游戏服务器的玩家数据
///
/// # 设计说明
/// - admin: 系统统一管理员（只有一个）
/// - user_id: 第三方用户标识（可以是任何字符串）
/// - PDA seeds: [b"user-profile", admin, user_id]
/// - 管理员负责所有费用（创建、更新、删除）
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    /// 系统管理员钱包地址
    /// 所有用户资料共享同一个管理员
    /// 管理员负责支付所有费用
    pub admin: Pubkey,

    /// 第三方系统的用户 ID（最多 32 字符）
    /// 例如: "user_12345", "alice@company.com", "discord:123456"
    /// 用于唯一标识用户，也是 PDA seeds 的一部分
    #[max_len(32)]
    pub user_id: String,

    /// 用户名（最多 32 字符）
    /// 例如: "alice", "bob123"
    #[max_len(32)]
    pub username: String,

    /// 邮箱地址（最多 64 字符）
    /// 例如: "alice@example.com"
    #[max_len(64)]
    pub email: String,

    /// 年龄（0-255）
    pub age: u8,

    /// 个人简介（最多 256 字符）
    /// 例如: "Web3 developer & NFT collector"
    #[max_len(256)]
    pub bio: String,

    /// 创建时间（Unix 时间戳，秒）
    pub created_at: i64,

    /// 最后更新时间（Unix 时间戳，秒）
    pub updated_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

// ============================================================================
// 错误定义
// ============================================================================

/// 程序自定义错误
///
/// Anchor 会自动为这些错误分配错误代码：
/// - UserIdTooLong: 6000
/// - UserIdEmpty: 6001
/// - UsernameTooLong: 6002
/// - EmailTooLong: 6003
/// - BioTooLong: 6004
/// - UsernameEmpty: 6005
/// - EmailEmpty: 6006
#[error_code]
pub enum ProfileError {
    /// 用户 ID 超过 32 字符限制
    #[msg("用户 ID 太长（最多 32 字符）")]
    UserIdTooLong,

    /// 用户 ID 不能为空
    #[msg("用户 ID 不能为空")]
    UserIdEmpty,

    /// 用户名超过 32 字符限制
    #[msg("用户名太长（最多 32 字符）")]
    UsernameTooLong,

    /// 邮箱超过 64 字符限制
    #[msg("邮箱地址太长（最多 64 字符）")]
    EmailTooLong,

    /// 个人简介超过 256 字符限制
    #[msg("个人简介太长（最多 256 字符）")]
    BioTooLong,

    /// 用户名不能为空
    #[msg("用户名不能为空")]
    UsernameEmpty,

    /// 邮箱不能为空
    #[msg("邮箱地址不能为空")]
    EmailEmpty,
}
