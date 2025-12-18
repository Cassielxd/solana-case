// ============================================================================
// User Profile - 用户资料管理程序
// ============================================================================
//
// 功能：
// - 创建用户资料（用户名、邮箱、年龄、个人简介）
// - 更新用户资料
// - 删除用户资料
// - 存储第三方系统的用户信息
//
// 使用场景：
// - Web3 应用的用户身份管理
// - 链上社交媒体资料
// - DApp 用户数据存储
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
    /// - 创建一个新的用户资料账户
    /// - 存储用户的基本信息（用户名、邮箱、年龄、个人简介）
    /// - 记录创建时间和更新时间
    /// - 使用 PDA 确保每个钱包只能有一个资料
    ///
    /// # 参数
    /// - `username`: 用户名（最多 32 字符）
    /// - `email`: 邮箱地址（最多 64 字符）
    /// - `age`: 年龄（0-255）
    /// - `bio`: 个人简介（最多 256 字符）
    ///
    /// # 权限
    /// - 任何人都可以为自己创建资料
    /// - 每个钱包地址只能创建一个资料
    ///
    /// # 返回
    /// - `Ok(())`: 创建成功
    /// - `Err(ProfileError::UsernameTooLong)`: 用户名超过 32 字符
    /// - `Err(ProfileError::EmailTooLong)`: 邮箱超过 64 字符
    /// - `Err(ProfileError::BioTooLong)`: 个人简介超过 256 字符
    pub fn create_profile(
        ctx: Context<CreateProfile>,
        username: String,
        email: String,
        age: u8,
        bio: String,
    ) -> Result<()> {
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
        profile.authority = ctx.accounts.authority.key(); // 所有者公钥
        profile.username = username.clone();              // 用户名
        profile.email = email.clone();                    // 邮箱
        profile.age = age;                                // 年龄
        profile.bio = bio.clone();                        // 个人简介
        profile.created_at = current_time;                // 创建时间
        profile.updated_at = current_time;                // 更新时间
        profile.bump = ctx.bumps.user_profile;            // PDA bump

        // 记录日志
        msg!("✅ User profile created successfully");
        msg!("   Username: {}", username);
        msg!("   Email: {}", email);
        msg!("   Age: {}", age);
        msg!("   Created at: {}", current_time);

        Ok(())
    }

    /// 更新用户资料
    ///
    /// # 功能
    /// - 更新用户的基本信息
    /// - 自动更新 updated_at 时间戳
    /// - 只有资料所有者可以更新
    ///
    /// # 参数
    /// - `username`: 新的用户名（可选，传 None 保持不变）
    /// - `email`: 新的邮箱（可选）
    /// - `age`: 新的年龄（可选）
    /// - `bio`: 新的个人简介（可选）
    ///
    /// # 权限
    /// - **只有资料所有者**可以更新（通过 has_one 约束验证）
    ///
    /// # 返回
    /// - `Ok(())`: 更新成功
    /// - 相应的验证错误
    pub fn update_profile(
        ctx: Context<UpdateProfile>,
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
        msg!("   Updated at: {}", profile.updated_at);

        Ok(())
    }

    /// 删除用户资料
    ///
    /// # 功能
    /// - 删除用户资料账户
    /// - 将账户中的 SOL 退还给所有者
    /// - 释放账户占用的存储空间
    ///
    /// # 权限
    /// - **只有资料所有者**可以删除
    ///
    /// # 返回
    /// - `Ok(())`: 删除成功
    pub fn delete_profile(ctx: Context<DeleteProfile>) -> Result<()> {
        let profile = &ctx.accounts.user_profile;

        // 记录日志
        msg!("🗑️  Deleting user profile");
        msg!("   Username: {}", profile.username);
        msg!("   Created at: {}", profile.created_at);

        // Anchor 会自动执行以下操作（通过 #[account(close = authority)] 约束）：
        // 1. 将账户中的所有 lamports 转给 authority
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
/// - `authority`: 用户钱包（签名者，支付租金）
/// - `system_program`: 系统程序
///
/// # PDA Seeds
/// - `[b"user-profile", authority.key().as_ref()]`
/// - 确保每个钱包地址只能有一个用户资料
#[derive(Accounts)]
pub struct CreateProfile<'info> {
    /// 用户资料账户（PDA）
    #[account(
        init,                                  // 初始化新账户
        payer = authority,                     // 由 authority 支付租金
        space = 8 + UserProfile::INIT_SPACE,   // 账户空间
        seeds = [                              // PDA seeds
            b"user-profile",                   // 固定前缀
            authority.key().as_ref()           // 用户钱包地址
        ],
        bump                                   // PDA bump（自动计算）
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// 用户钱包（所有者，必须签名）
    #[account(mut)]  // mut: 因为要支付租金
    pub authority: Signer<'info>,

    /// 系统程序
    pub system_program: Program<'info, System>,
}

/// 更新用户资料的账户验证
///
/// # 账户说明
/// - `user_profile`: 要更新的用户资料账户
/// - `authority`: 资料所有者（必须签名）
///
/// # 权限验证
/// - `has_one = authority`: 验证 user_profile.authority == authority
#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    /// 用户资料账户（PDA，可变）
    #[account(
        mut,                                   // 可变：数据会更新
        has_one = authority,                   // 验证：必须是所有者
        seeds = [                              // 验证 PDA
            b"user-profile",
            authority.key().as_ref()
        ],
        bump = user_profile.bump               // 使用存储的 bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// 资料所有者（必须签名）
    pub authority: Signer<'info>,
}

/// 删除用户资料的账户验证
///
/// # 账户说明
/// - `user_profile`: 要删除的用户资料账户
/// - `authority`: 资料所有者（接收退还的 SOL）
///
/// # 效果
/// - 账户被关闭，SOL 退还给 authority
#[derive(Accounts)]
pub struct DeleteProfile<'info> {
    /// 用户资料账户（PDA，将被关闭）
    #[account(
        mut,                                   // 可变：账户会被关闭
        has_one = authority,                   // 验证：必须是所有者
        close = authority,                     // 关闭账户，SOL 退还给 authority
        seeds = [                              // 验证 PDA
            b"user-profile",
            authority.key().as_ref()
        ],
        bump = user_profile.bump               // 使用存储的 bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// 资料所有者（必须签名，接收退还的 SOL）
    #[account(mut)]  // mut: 因为会接收 SOL
    pub authority: Signer<'info>,
}

// ============================================================================
// 数据结构
// ============================================================================

/// 用户资料数据结构
///
/// # 字段说明
/// - `authority`: 资料所有者（钱包地址）
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
/// 32 字节   - authority (Pubkey)
/// 36 字节   - username (4 + 32)
/// 68 字节   - email (4 + 64)
/// 1 字节    - age (u8)
/// 260 字节  - bio (4 + 256)
/// 8 字节    - created_at (i64)
/// 8 字节    - updated_at (i64)
/// 1 字节    - bump (u8)
/// ---------
/// 422 字节  总计
/// ```
///
/// # 使用场景
/// - 社交 DApp 的用户资料
/// - Web3 应用的身份信息
/// - 链上游戏的玩家数据
/// - 去中心化论坛的用户信息
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    /// 资料所有者（钱包地址）
    pub authority: Pubkey,

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
/// - UsernameTooLong: 6000
/// - EmailTooLong: 6001
/// - BioTooLong: 6002
/// - UsernameEmpty: 6003
/// - EmailEmpty: 6004
#[error_code]
pub enum ProfileError {
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
