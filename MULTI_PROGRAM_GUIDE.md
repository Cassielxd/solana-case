# 多程序开发指南

本项目支持在一个 workspace 中管理多个 Solana 程序（Monorepo 架构）。

## 📦 当前程序

| 程序名 | 程序 ID | 功能 |
|-------|---------|------|
| **my-project** | `MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj` | 计数器程序 |
| **token-vault** | `FukTyMfW3YnifZmVD66Y26nXECk68HNbpQ4DfifU16wZ` | 代币金库程序 |

## 🆕 添加新程序

### 方法 1: 使用 Anchor CLI（推荐）

```bash
# 在项目根目录运行
anchor new <program-name>

# 例如：创建 NFT 市场程序
anchor new nft-marketplace
```

Anchor 会自动：
- ✅ 创建 `programs/<program-name>/` 目录
- ✅ 生成基础代码 `src/lib.rs`
- ✅ 创建 `Cargo.toml`
- ✅ 更新 `Anchor.toml` 配置
- ✅ 生成新的程序 ID

### 方法 2: 手动创建（不推荐）

如果需要手动创建：

```bash
# 1. 创建目录
mkdir -p programs/my-new-program/src

# 2. 创建文件（参考现有程序）
cp programs/my-project/Cargo.toml programs/my-new-program/
cp programs/my-project/src/lib.rs programs/my-new-program/src/

# 3. 手动更新 Anchor.toml
# 4. 生成新的密钥对
solana-keygen new -o target/deploy/my_new_program-keypair.json
```

## 🔧 多程序开发命令

### 构建

```bash
# 构建所有程序
anchor build

# 只构建特定程序
anchor build --program-name my-project
anchor build --program-name token-vault

# 清理构建产物
anchor clean
```

### 部署

```bash
# 部署所有程序
anchor deploy

# 只部署特定程序
anchor deploy --program-name token-vault

# 部署到特定网络
anchor deploy --provider.cluster devnet
```

### 测试

```bash
# 运行所有测试
anchor test

# 运行特定测试文件
anchor test tests/my-project.ts
anchor test tests/token-vault.ts

# 跳过本地验证器（如果已经在运行）
anchor test --skip-local-validator
```

### 获取程序信息

```bash
# 查看程序 ID
anchor keys list

# 查看特定程序的密钥
solana address -k target/deploy/my_project-keypair.json
solana address -k target/deploy/token_vault-keypair.json

# 查看链上程序信息
solana program show <PROGRAM_ID>
```

## 📁 项目结构

```
my-project/
├── programs/
│   ├── my-project/              # 程序 1: 计数器
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   ├── token-vault/             # 程序 2: 代币金库
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   └── nft-marketplace/         # 程序 3: NFT 市场（示例）
│       ├── src/
│       │   └── lib.rs
│       └── Cargo.toml
│
├── tests/                       # 测试文件
│   ├── my-project.ts
│   ├── token-vault.ts
│   └── nft-marketplace.ts
│
├── client-ts/                   # TypeScript 客户端
│   ├── my-project/              # 程序 1 的客户端
│   ├── token-vault/             # 程序 2 的客户端
│   └── shared/                  # 共享工具
│
├── target/
│   ├── deploy/                  # 部署文件
│   │   ├── my_project-keypair.json
│   │   ├── token_vault-keypair.json
│   │   └── nft_marketplace-keypair.json
│   ├── idl/                     # IDL 文件
│   │   ├── my_project.json
│   │   ├── token_vault.json
│   │   └── nft_marketplace.json
│   └── types/                   # TypeScript 类型
│       ├── my_project.ts
│       ├── token_vault.ts
│       └── nft_marketplace.ts
│
├── Anchor.toml                  # 所有程序的配置
└── Cargo.toml                   # Workspace 配置
```

## 💻 TypeScript 客户端调用

### 调用单个程序

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProject } from "../target/types/my_project";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

// 加载程序
const myProject = anchor.workspace.myProject as Program<MyProject>;

// 调用指令
await myProject.methods.increment()
  .accounts({ counter: counterPubkey })
  .rpc();
```

### 调用多个程序

```typescript
import { MyProject } from "../target/types/my_project";
import { TokenVault } from "../target/types/token_vault";

// 加载多个程序
const counterProgram = anchor.workspace.myProject as Program<MyProject>;
const vaultProgram = anchor.workspace.tokenVault as Program<TokenVault>;

// 同时使用多个程序
await counterProgram.methods.increment()...rpc();
await vaultProgram.methods.deposit(amount)...rpc();
```

### 跨程序调用（CPI）

如果需要程序之间互相调用：

```rust
// 在 token-vault/src/lib.rs 中
use anchor_lang::prelude::*;

#[program]
pub mod token_vault {
    use super::*;

    pub fn deposit_and_increment(ctx: Context<DepositAndIncrement>) -> Result<()> {
        // 调用 my-project 程序的 increment 指令
        let cpi_program = ctx.accounts.counter_program.to_account_info();
        let cpi_accounts = my_project::cpi::accounts::Increment {
            counter: ctx.accounts.counter.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        my_project::cpi::increment(cpi_ctx)?;

        // 执行本程序的存款逻辑
        // ...

        Ok(())
    }
}
```

## 📝 配置文件说明

### Anchor.toml

```toml
[programs.localnet]
my_project = "MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj"
token-vault = "FukTyMfW3YnifZmVD66Y26nXECk68HNbpQ4DfifU16wZ"

[programs.devnet]
my_project = "另一个程序ID"
token-vault = "另一个程序ID"

[provider]
cluster = "localnet"  # 或 devnet, testnet, mainnet-beta
wallet = "~/.config/solana/id.json"
```

### Cargo.toml (Workspace)

```toml
[workspace]
members = [
    "programs/*",    # 自动包含所有程序
    "client"         # Rust 客户端
]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
```

## 🎯 最佳实践

### 1. 程序命名规范

- 使用 kebab-case: `token-vault`, `nft-marketplace`
- Rust 模块名使用 snake_case: `token_vault`, `nft_marketplace`
- 保持名称简洁且描述性强

### 2. 代码组织

```
programs/my-program/
├── src/
│   ├── lib.rs           # 程序入口
│   ├── state.rs         # 状态定义
│   ├── instructions/    # 指令模块
│   │   ├── mod.rs
│   │   ├── initialize.rs
│   │   └── transfer.rs
│   ├── errors.rs        # 错误定义
│   └── constants.rs     # 常量定义
└── Cargo.toml
```

### 3. 测试策略

```typescript
// tests/integration.ts
describe("Multi-Program Integration", () => {
  it("Programs work together", async () => {
    // 测试多个程序的协作
    await counterProgram.methods.initialize()...rpc();
    await vaultProgram.methods.initialize()...rpc();

    // 测试跨程序调用
    await vaultProgram.methods.depositAndIncrement()...rpc();
  });
});
```

### 4. 依赖管理

如果程序之间有依赖：

```toml
# programs/token-vault/Cargo.toml
[dependencies]
anchor-lang = "0.32.1"
my-project = { path = "../my-project", features = ["cpi"] }
```

```rust
// 启用 CPI 功能
#[cfg(feature = "cpi")]
pub mod cpi {
    // CPI 相关代码
}
```

## 🚀 部署策略

### 开发环境

```bash
# 部署到本地测试网
solana-test-validator
anchor deploy
```

### 测试环境

```bash
# 部署到 devnet
anchor deploy --provider.cluster devnet
```

### 生产环境

```bash
# 部署到 mainnet（谨慎！）
anchor deploy --provider.cluster mainnet
```

## 📊 监控和维护

### 查看程序状态

```bash
# 查看程序账户
solana program show <PROGRAM_ID>

# 查看程序日志
solana logs <PROGRAM_ID>

# 查看程序大小
ls -lh target/deploy/*.so
```

### 升级程序

```bash
# 构建新版本
anchor build

# 升级程序
anchor upgrade target/deploy/my_project.so --program-id <PROGRAM_ID>
```

## ❓ 常见问题

### Q: 如何删除程序？

```bash
# 1. 从 programs/ 目录删除
rm -rf programs/old-program

# 2. 从 Anchor.toml 删除配置
# 手动编辑 Anchor.toml

# 3. 清理构建
anchor clean
anchor build
```

### Q: 程序 ID 冲突怎么办？

```bash
# 重新生成密钥对
solana-keygen new -o target/deploy/my_program-keypair.json --force

# 更新 lib.rs 中的 declare_id!
# 重新构建和部署
anchor build
anchor deploy
```

### Q: 如何共享代码？

创建共享库：

```toml
# Cargo.toml
[workspace]
members = [
    "programs/*",
    "shared"  # 共享代码库
]
```

## 📚 相关资源

- [Anchor 多程序文档](https://www.anchor-lang.com/docs/workspace)
- [Solana 程序示例](https://github.com/solana-labs/solana-program-library)
- [跨程序调用 (CPI)](https://www.anchor-lang.com/docs/cross-program-invocations)

---

**提示**: 多程序架构适合复杂的 DApp，可以将不同功能模块化，提高代码可维护性和可重用性。
