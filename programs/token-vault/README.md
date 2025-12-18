# Token Vault - SOL 金库程序

一个安全的 SOL 金库智能合约，支持存款、提款和权限管理。

## 🎯 功能特性

### 核心功能

- ✅ **创建金库**: 使用 PDA 创建个人金库
- ✅ **存入 SOL**: 任何人都可以向金库存款
- ✅ **提取 SOL**: 只有所有者可以提款
- ✅ **转移所有权**: 将金库转让给其他人
- ✅ **关闭金库**: 关闭金库并取回所有 SOL
- ✅ **统计数据**: 跟踪总存款和总提款

### 安全特性

- 🔒 **权限控制**: 只有所有者可以提款和转移所有权
- 🔒 **余额保护**: 自动保留租金豁免所需的最低余额
- 🔒 **溢出检查**: 所有数值计算使用 `checked_*` 方法
- 🔒 **PDA 验证**: 使用 Program Derived Address 确保安全性

## 📦 程序结构

### 指令列表

| 指令 | 参数 | 权限 | 说明 |
|-----|------|------|------|
| `initialize` | `vault_name: String` | 任何人 | 创建新金库 |
| `deposit` | `amount: u64` | 任何人 | 存入 SOL |
| `withdraw` | `amount: u64` | 仅所有者 | 提取 SOL |
| `transfer_authority` | `new_authority: Pubkey` | 仅所有者 | 转移所有权 |
| `close_vault` | - | 仅所有者 | 关闭金库 |

### 账户结构

```rust
pub struct Vault {
    pub authority: Pubkey,        // 32 字节 - 所有者公钥
    pub vault_name: String,       // 4 + 32 字节 - 金库名称（最多32字符）
    pub total_deposits: u64,      // 8 字节 - 总存款
    pub total_withdrawals: u64,   // 8 字节 - 总提款
    pub bump: u8,                 // 1 字节 - PDA bump seed
}

// 总大小: 8 (discriminator) + 32 + 36 + 8 + 8 + 1 = 93 字节
```

## 🚀 快速开始

### 1. 构建和部署

```bash
# 构建程序
anchor build

# 部署程序
anchor deploy --program-name token-vault

# 查看程序 ID
solana address -k target/deploy/token_vault-keypair.json
```

### 2. 运行测试

```bash
# 运行所有测试
anchor test

# 只测试 token-vault
anchor test tests/token-vault.ts
```

### 3. 运行客户端示例

```bash
# 启动测试网络（新终端）
solana-test-validator

# 运行 TypeScript 客户端
npx ts-node client-ts/token-vault-example.ts
```

## 💻 使用示例

### TypeScript 客户端

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenVault } from "../target/types/token_vault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// 1. 加载程序
const program = anchor.workspace.tokenVault as Program<TokenVault>;

// 2. 计算金库 PDA
const [vaultPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("vault"),
    authority.toBuffer(),
    Buffer.from("my-vault")
  ],
  program.programId
);

// 3. 初始化金库
await program.methods
  .initialize("my-vault")
  .accounts({
    vault: vaultPda,
    authority: authority,
  })
  .rpc();

// 4. 存款
await program.methods
  .deposit(new anchor.BN(0.5 * LAMPORTS_PER_SOL))
  .accounts({
    vault: vaultPda,
    depositor: authority,
  })
  .rpc();

// 5. 提款
await program.methods
  .withdraw(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
  .accounts({
    vault: vaultPda,
    authority: authority,
    receiver: receiverPubkey,
  })
  .rpc();

// 6. 查询金库
const vault = await program.account.vault.fetch(vaultPda);
console.log("Total deposits:", vault.totalDeposits.toString());
console.log("Total withdrawals:", vault.totalWithdrawals.toString());
```

### Rust 客户端（CPI）

```rust
use anchor_lang::prelude::*;
use token_vault::cpi::accounts::Deposit;
use token_vault::program::TokenVault;

// 在其他程序中调用 token-vault
pub fn deposit_to_vault(ctx: Context<DepositToVault>) -> Result<()> {
    let cpi_program = ctx.accounts.token_vault_program.to_account_info();
    let cpi_accounts = Deposit {
        vault: ctx.accounts.vault.to_account_info(),
        depositor: ctx.accounts.depositor.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token_vault::cpi::deposit(cpi_ctx, 1_000_000)?;  // 存入 1M lamports

    Ok(())
}
```

## 🔧 PDA 地址计算

金库使用 PDA (Program Derived Address) 来确保安全性和唯一性：

```
seeds = [
    b"vault",           // 固定前缀
    authority,          // 所有者公钥
    vault_name          // 金库名称
]
```

**特性**：
- 每个用户可以创建多个金库（使用不同的名称）
- 金库地址是确定性的（可以从参数计算）
- 不需要单独的密钥对
- 程序拥有金库账户的签名权限

## 📊 使用场景

### 1. 个人储蓄金库

```typescript
// 创建储蓄金库
await program.methods.initialize("savings").accounts({...}).rpc();

// 定期存款
await program.methods.deposit(amount).accounts({...}).rpc();

// 需要时提款
await program.methods.withdraw(amount).accounts({...}).rpc();
```

### 2. 多签名托管

```typescript
// 创建托管金库
await program.methods.initialize("escrow").accounts({...}).rpc();

// 买家存入资金
await program.methods.deposit(price).accounts({...}).rpc();

// 条件满足后，卖家提取
await program.methods.withdraw(price).accounts({...}).rpc();
```

### 3. 团队金库

```typescript
// 创建团队金库
await program.methods.initialize("team-fund").accounts({...}).rpc();

// 成员捐款
await program.methods.deposit(contribution).accounts({...}).rpc();

// 团队负责人管理提款
await program.methods.withdraw(expense).accounts({...}).rpc();
```

## ⚠️ 安全注意事项

### 1. 权限管理

- ✅ 只有 `authority` 可以提款
- ✅ 只有 `authority` 可以转移所有权
- ✅ 任何人都可以存款（但无法取回，除非是所有者）

### 2. 余额保护

```rust
// 程序会自动保留租金豁免所需的最低余额
let rent = Rent::get()?;
let min_balance = rent.minimum_balance(vault.to_account_info().data_len());
let available_balance = vault_balance.saturating_sub(min_balance);
```

### 3. 溢出保护

```rust
// 所有数值操作使用 checked_* 方法
vault.total_deposits = vault.total_deposits
    .checked_add(amount)
    .ok_or(VaultError::Overflow)?;
```

### 4. PDA 验证

```rust
// Anchor 自动验证 PDA
#[account(
    mut,
    seeds = [b"vault", vault.authority.as_ref(), vault.vault_name.as_bytes()],
    bump = vault.bump
)]
pub vault: Account<'info, Vault>,
```

## 🐛 错误代码

| 错误 | 代码 | 说明 |
|-----|------|------|
| `NameTooLong` | 6000 | 金库名称超过 32 字符 |
| `InvalidAmount` | 6001 | 金额必须大于 0 |
| `InsufficientFunds` | 6002 | 余额不足 |
| `Overflow` | 6003 | 数值溢出 |

## 📝 测试覆盖

测试文件：`tests/token-vault.ts`

- ✅ 初始化金库
- ✅ 存款功能（单次和多次）
- ✅ 提款功能
- ✅ 转移所有权
- ✅ 权限验证（非所有者无法提款）
- ✅ 余额验证（余额不足时无法提款）
- ✅ 查询金库状态
- ✅ 关闭金库

## 🔍 常见问题

### Q: 如何计算金库地址？

```typescript
const [vaultPda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("vault"),
    authority.toBuffer(),
    Buffer.from(vaultName)
  ],
  program.programId
);
```

### Q: 可以创建多个金库吗？

可以！每个用户可以使用不同的 `vault_name` 创建多个金库。

### Q: 如何查询金库余额？

```typescript
// 链上余额
const balance = await connection.getBalance(vaultPda);

// 账户数据
const vault = await program.account.vault.fetch(vaultPda);
console.log("Total deposits:", vault.totalDeposits.toString());
```

### Q: 可以存入代币吗？

当前版本只支持 SOL。要支持 SPL 代币，需要添加额外的功能。

### Q: 提款时的最低余额是多少？

程序会自动保留租金豁免所需的最低余额（约 0.00089088 SOL for 93 bytes）。

## 🚧 扩展功能（待实现）

- [ ] 支持 SPL 代币
- [ ] 多签名支持
- [ ] 定时锁定（time lock）
- [ ] 自动复利
- [ ] 白名单/黑名单
- [ ] 提款限额
- [ ] 事件通知

## 📚 相关资源

- [Anchor 官方文档](https://www.anchor-lang.com/)
- [Solana PDA 指南](https://solanacookbook.com/core-concepts/pdas.html)
- [项目主 README](../../README.md)
- [多程序开发指南](../../MULTI_PROGRAM_GUIDE.md)

## 📄 许可证

ISC

---

**注意**: 这是一个教学项目，在生产环境使用前请进行完整的安全审计。
