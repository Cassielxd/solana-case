// ============================================================================
// Token Vault Program - 代币金库程序
// ============================================================================
//
// 功能：
// - 创建金库账户
// - 存入 SOL
// - 提取 SOL
// - 查询余额
// - 权限控制
//
// ============================================================================

use anchor_lang::prelude::*;

// 声明程序 ID（部署时由 Anchor 自动生成）
declare_id!("FukTyMfW3YnifZmVD66Y26nXECk68HNbpQ4DfifU16wZ");

#[program]
pub mod token_vault {
    use super::*;

    /// 初始化金库
    ///
    /// # 功能
    /// - 创建一个新的金库账户
    /// - 设置金库所有者和原始创建者
    /// - 初始化统计数据（存款、提款记录）
    ///
    /// # 参数
    /// - `vault_name`: 金库名称（最多 32 字符，用于 PDA 计算和标识）
    ///
    /// # 权限
    /// - 任何人都可以调用，但创建的金库属于调用者
    ///
    /// # 返回
    /// - `Ok(())`: 成功
    /// - `Err(VaultError::NameTooLong)`: 名称超过 32 字符
    pub fn initialize(ctx: Context<Initialize>, vault_name: String) -> Result<()> {
        // 验证：金库名称不能超过 32 字符
        require!(vault_name.len() <= 32, VaultError::NameTooLong);

        // 获取金库账户的可变引用
        let vault = &mut ctx.accounts.vault;

        // 设置当前所有者（可以通过 transfer_authority 转移）
        vault.authority = ctx.accounts.authority.key();

        // 设置原始创建者（永不改变，用于 PDA seeds 计算）
        vault.original_authority = ctx.accounts.authority.key();

        // 设置金库名称
        vault.vault_name = vault_name.clone();

        // 初始化统计数据：总存款金额
        vault.total_deposits = 0;

        // 初始化统计数据：总提款金额
        vault.total_withdrawals = 0;

        // 保存 PDA bump seed（用于后续签名）
        vault.bump = ctx.bumps.vault;

        // 记录日志：金库创建成功
        msg!("✅ Vault '{}' initialized", vault_name);
        msg!("   Authority: {}", vault.authority);
        msg!("   Vault PDA: {}", ctx.accounts.vault.key());

        Ok(())
    }

    /// 存款
    ///
    /// # 功能
    /// - 将 SOL 从存款人账户转入金库
    /// - 更新金库的总存款统计
    ///
    /// # 参数
    /// - `amount`: 存款金额（单位：lamports，1 SOL = 10^9 lamports）
    ///
    /// # 权限
    /// - 任何人都可以向金库存款（不仅限于所有者）
    ///
    /// # 安全性
    /// - 使用 checked_add 防止数值溢出
    ///
    /// # 返回
    /// - `Ok(())`: 存款成功
    /// - `Err(VaultError::InvalidAmount)`: 金额必须大于 0
    /// - `Err(VaultError::Overflow)`: 累计存款金额溢出
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // 验证：存款金额必须大于 0
        require!(amount > 0, VaultError::InvalidAmount);

        // 通过 CPI (跨程序调用) 将 SOL 从存款人转到金库
        // CPI 是 Solana 程序之间调用的标准方式
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(), // 来源：存款人
                to: ctx.accounts.vault.to_account_info(),       // 目标：金库 PDA
            },
        );
        // 执行转账
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        // 更新金库的总存款统计
        let vault = &mut ctx.accounts.vault;

        // 使用 checked_add 安全地累加，防止溢出攻击
        vault.total_deposits = vault.total_deposits.checked_add(amount)
            .ok_or(VaultError::Overflow)?;

        // 获取金库当前余额（用于日志记录）
        let vault_balance = vault.get_lamports();

        // 记录日志
        msg!("💰 Deposited {} lamports", amount);
        msg!("   Total deposits: {}", vault.total_deposits);
        msg!("   Vault balance: {}", vault_balance);

        Ok(())
    }

    /// 提款
    ///
    /// # 功能
    /// - 从金库提取 SOL 到指定接收者
    /// - 更新金库的总提款统计
    /// - 自动保留租金豁免所需的最低余额
    ///
    /// # 参数
    /// - `amount`: 提款金额（单位：lamports）
    ///
    /// # 权限
    /// - **只有金库所有者**可以调用（通过 has_one = authority 约束验证）
    ///
    /// # 安全性
    /// - 自动计算并保留租金豁免最低余额，防止账户被清除
    /// - 使用 checked_add 防止数值溢出
    ///
    /// # 返回
    /// - `Ok(())`: 提款成功
    /// - `Err(VaultError::InvalidAmount)`: 金额必须大于 0
    /// - `Err(VaultError::InsufficientFunds)`: 可用余额不足
    /// - `Err(VaultError::Overflow)`: 累计提款金额溢出
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // 验证：提款金额必须大于 0
        require!(amount > 0, VaultError::InvalidAmount);

        // 获取金库当前余额
        let vault_balance = ctx.accounts.vault.get_lamports();

        // 计算租金豁免所需的最低余额
        // 在 Solana 中，账户必须保留足够的余额才能免除租金
        let rent = Rent::get()?;
        let min_balance = rent.minimum_balance(ctx.accounts.vault.to_account_info().data_len());

        // 计算可用余额 = 总余额 - 最低保留余额
        // saturating_sub 确保不会下溢（结果最小为 0）
        let available_balance = vault_balance.saturating_sub(min_balance);

        // 验证：可用余额必须大于等于提款金额
        require!(available_balance >= amount, VaultError::InsufficientFunds);

        // 直接修改账户的 lamports（底层操作）
        // 从金库减少 amount
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        // 给接收者增加 amount
        **ctx.accounts.receiver.to_account_info().try_borrow_mut_lamports()? += amount;

        // 更新金库的总提款统计
        let vault = &mut ctx.accounts.vault;

        // 使用 checked_add 安全地累加，防止溢出
        vault.total_withdrawals = vault.total_withdrawals.checked_add(amount)
            .ok_or(VaultError::Overflow)?;

        // 获取提款后的剩余余额（用于日志）
        let remaining_balance = vault.get_lamports();

        // 记录日志
        msg!("💸 Withdrew {} lamports", amount);
        msg!("   Total withdrawals: {}", vault.total_withdrawals);
        msg!("   Remaining balance: {}", remaining_balance);

        Ok(())
    }

    /// 转移金库所有权
    ///
    /// # 功能
    /// - 将金库的控制权转移给新的所有者
    /// - 新所有者将拥有提款和再次转移的权限
    ///
    /// # 参数
    /// - `new_authority`: 新的所有者公钥
    ///
    /// # 权限
    /// - **只有当前所有者**可以调用（通过 has_one = authority 约束验证）
    ///
    /// # 重要说明
    /// - `authority` 字段会改变（当前所有者）
    /// - `original_authority` 字段**不会**改变（用于 PDA seeds）
    /// - PDA 地址始终不变，因为使用 original_authority 计算
    ///
    /// # 返回
    /// - `Ok(())`: 转移成功
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        // 保存旧所有者（用于日志）
        let old_authority = vault.authority;

        // 更新为新所有者
        vault.authority = new_authority;

        // 记录日志
        msg!("🔑 Authority transferred");
        msg!("   From: {}", old_authority);
        msg!("   To: {}", new_authority);

        Ok(())
    }

    /// 关闭金库并取回所有 SOL
    ///
    /// # 功能
    /// - 关闭金库账户
    /// - 将金库中所有剩余的 SOL 转给所有者
    /// - 释放账户占用的空间
    ///
    /// # 权限
    /// - **只有当前所有者**可以调用（通过 has_one = authority 约束验证）
    ///
    /// # 重要说明
    /// - 关闭后金库账户将不复存在
    /// - 所有余额（包括租金）都会转给所有者
    /// - 此操作不可逆
    ///
    /// # 返回
    /// - `Ok(())`: 关闭成功
    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        let vault = &ctx.accounts.vault;

        // 记录日志：显示金库最终统计
        msg!("🔒 Closing vault '{}'", vault.vault_name);
        msg!("   Total deposits: {}", vault.total_deposits);
        msg!("   Total withdrawals: {}", vault.total_withdrawals);
        msg!("   Final balance will be transferred to authority");

        // Anchor 会自动执行以下操作（通过 #[account(close = authority)] 约束）：
        // 1. 将金库账户的所有 lamports 转给 authority
        // 2. 清空账户数据
        // 3. 将账户所有者设置为 System Program

        Ok(())
    }
}

// ============================================================================
// 账户验证结构
// ============================================================================
// 以下结构定义了每个指令需要的账户及其约束条件
// Anchor 会在运行时自动验证这些约束

/// 初始化金库指令的账户验证
///
/// # 账户说明
/// - `vault`: 要创建的金库 PDA 账户
/// - `authority`: 金库所有者（签名者，支付创建费用）
/// - `system_program`: Solana 系统程序（用于创建账户）
#[derive(Accounts)]
#[instruction(vault_name: String)]  // 声明指令参数，用于约束中
pub struct Initialize<'info> {
    /// 金库账户（PDA）
    #[account(
        init,                           // 初始化新账户
        payer = authority,              // 由 authority 支付账户创建费用
        space = 8 + Vault::INIT_SPACE,  // 账户空间：8 字节判别器 + 数据大小
        seeds = [                       // PDA seeds（用于派生地址）
            b"vault",                   // 固定前缀
            authority.key().as_ref(),   // 所有者公钥
            vault_name.as_bytes()       // 金库名称
        ],
        bump                            // PDA bump seed（Anchor 自动查找）
    )]
    pub vault: Account<'info, Vault>,

    /// 金库所有者（必须签名，支付租金）
    #[account(mut)]  // mut: 因为要扣除创建账户的费用
    pub authority: Signer<'info>,

    /// Solana 系统程序（用于创建账户）
    pub system_program: Program<'info, System>,
}

/// 存款指令的账户验证
///
/// # 账户说明
/// - `vault`: 金库账户（接收存款）
/// - `depositor`: 存款人（签名者，支付存款）
/// - `system_program`: 系统程序（用于转账）
///
/// # 权限
/// - 任何人都可以向金库存款，不需要是所有者
#[derive(Accounts)]
pub struct Deposit<'info> {
    /// 金库账户（PDA，可变因为余额会增加）
    #[account(
        mut,                            // 可变：余额和统计数据会更新
        seeds = [                       // 验证 PDA
            b"vault",
            vault.original_authority.as_ref(),  // 使用原始创建者（不变）
            vault.vault_name.as_bytes()
        ],
        bump = vault.bump               // 使用存储的 bump
    )]
    pub vault: Account<'info, Vault>,

    /// 存款人（必须签名）
    #[account(mut)]  // mut: 因为要扣除存款金额
    pub depositor: Signer<'info>,

    /// 系统程序（用于 SOL 转账）
    pub system_program: Program<'info, System>,
}

/// 提款指令的账户验证
///
/// # 账户说明
/// - `vault`: 金库账户（发送提款）
/// - `authority`: 金库所有者（必须签名）
/// - `receiver`: 接收者（可以是任何账户）
/// - `system_program`: 系统程序
///
/// # 权限
/// - **只有所有者**可以提款（通过 has_one 约束）
#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// 金库账户（PDA，可变因为余额会减少）
    #[account(
        mut,                            // 可变：余额和统计数据会更新
        has_one = authority,            // 验证：vault.authority 必须等于 authority 账户
        seeds = [                       // 验证 PDA
            b"vault",
            vault.original_authority.as_ref(),  // 使用原始创建者
            vault.vault_name.as_bytes()
        ],
        bump = vault.bump               // 使用存储的 bump
    )]
    pub vault: Account<'info, Vault>,

    /// 金库所有者（必须签名才能提款）
    pub authority: Signer<'info>,

    /// 接收者（可以是任何账户，不需要签名）
    /// CHECK: 此账户可以是任何地址，由所有者指定
    #[account(mut)]  // mut: 因为会增加余额
    pub receiver: AccountInfo<'info>,

    /// 系统程序（实际未使用，但保留以保持一致性）
    pub system_program: Program<'info, System>,
}

/// 转移所有权指令的账户验证
///
/// # 账户说明
/// - `vault`: 金库账户
/// - `authority`: 当前所有者（必须签名）
///
/// # 权限
/// - **只有当前所有者**可以转移所有权
#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    /// 金库账户（PDA，可变因为 authority 会改变）
    #[account(
        mut,                            // 可变：authority 字段会更新
        has_one = authority,            // 验证：必须是当前所有者
        seeds = [                       // 验证 PDA
            b"vault",
            vault.original_authority.as_ref(),  // 使用原始创建者（永不改变）
            vault.vault_name.as_bytes()
        ],
        bump = vault.bump               // 使用存储的 bump
    )]
    pub vault: Account<'info, Vault>,

    /// 当前所有者（必须签名）
    pub authority: Signer<'info>,
}

/// 关闭金库指令的账户验证
///
/// # 账户说明
/// - `vault`: 金库账户（将被关闭）
/// - `authority`: 金库所有者（接收剩余余额）
///
/// # 权限
/// - **只有当前所有者**可以关闭金库
///
/// # 效果
/// - 金库账户被删除
/// - 所有余额转给所有者
#[derive(Accounts)]
pub struct CloseVault<'info> {
    /// 金库账户（PDA，将被关闭）
    #[account(
        mut,                            // 可变：账户会被关闭
        has_one = authority,            // 验证：必须是当前所有者
        close = authority,              // 关闭账户，余额转给 authority
        seeds = [                       // 验证 PDA
            b"vault",
            vault.original_authority.as_ref(),  // 使用原始创建者
            vault.vault_name.as_bytes()
        ],
        bump = vault.bump               // 使用存储的 bump
    )]
    pub vault: Account<'info, Vault>,

    /// 金库所有者（必须签名，接收剩余余额）
    #[account(mut)]  // mut: 因为会接收余额
    pub authority: Signer<'info>,
}

// ============================================================================
// 数据结构
// ============================================================================

/// 金库账户数据结构
///
/// # 字段说明
/// - `authority`: 当前所有者（可以通过 transfer_authority 改变）
/// - `original_authority`: 原始创建者（永不改变，用于 PDA 计算）
/// - `vault_name`: 金库名称（用于标识和 PDA 计算）
/// - `total_deposits`: 累计存款金额（只增不减）
/// - `total_withdrawals`: 累计提款金额（只增不减）
/// - `bump`: PDA bump seed（用于签名）
///
/// # 存储空间
/// ```
/// 8 字节   - Anchor 账户判别器（account discriminator）
/// 32 字节  - authority (Pubkey)
/// 32 字节  - original_authority (Pubkey)
/// 36 字节  - vault_name (4 字节长度 + 最多 32 字节 UTF-8)
/// 8 字节   - total_deposits (u64)
/// 8 字节   - total_withdrawals (u64)
/// 1 字节   - bump (u8)
/// --------
/// 125 字节 总计
/// ```
///
/// # 为什么需要 original_authority？
/// - PDA 地址由 seeds 决定：[b"vault", authority, vault_name]
/// - 如果使用 authority 作为 seed，转移所有权后地址会改变
/// - 使用 original_authority 确保 PDA 地址永不改变
/// - 这样所有权可以转移，但金库地址保持不变
#[account]
#[derive(InitSpace)]
pub struct Vault {
    /// 当前所有者（可以被转移）
    /// 拥有提款、转移所有权、关闭金库的权限
    pub authority: Pubkey,

    /// 原始创建者（永不改变）
    /// 用于 PDA seeds 计算，确保金库地址不变
    pub original_authority: Pubkey,

    /// 金库名称（最多 32 字符）
    /// 用于标识金库和 PDA seeds 计算
    /// 同一用户可以创建多个不同名称的金库
    #[max_len(32)]
    pub vault_name: String,

    /// 累计总存款金额（lamports）
    /// 只会增加，记录历史存款总额
    pub total_deposits: u64,

    /// 累计总提款金额（lamports）
    /// 只会增加，记录历史提款总额
    pub total_withdrawals: u64,

    /// PDA bump seed
    /// 用于程序签名时生成有效的 PDA
    pub bump: u8,
}

// ============================================================================
// 错误定义
// ============================================================================

/// 程序自定义错误
///
/// Anchor 会自动为这些错误分配错误代码：
/// - NameTooLong: 6000
/// - InvalidAmount: 6001
/// - InsufficientFunds: 6002
/// - Overflow: 6003
#[error_code]
pub enum VaultError {
    /// 金库名称超过 32 字符限制
    #[msg("金库名称太长（最多 32 字符）")]
    NameTooLong,

    /// 存款或提款金额为 0 或负数
    #[msg("金额必须大于 0")]
    InvalidAmount,

    /// 金库余额不足以完成提款
    /// （扣除租金豁免最低余额后）
    #[msg("余额不足")]
    InsufficientFunds,

    /// 累计金额计算时发生溢出
    /// （例如 total_deposits 或 total_withdrawals 超过 u64::MAX）
    #[msg("数值溢出")]
    Overflow,
}
