# Solana 计数器项目

一个完整的 Solana 智能合约项目，展示如何使用 Anchor 框架构建链上程序，并提供多种客户端实现方式。

## 📚 项目简介

这是一个教学项目，实现了一个简单但完整的计数器智能合约，包含：
- ✅ **智能合约**: 使用 Anchor 框架编写的链上程序
- ✅ **Rust 客户端**: 原生 Solana SDK 和 Anchor Client 实现
- ✅ **TypeScript 客户端**: Anchor TypeScript SDK 实现（推荐）
- ✅ **完整文档**: 详细的代码注释和使用说明
- ✅ **多个示例**: 覆盖各种使用场景

### 项目特点

- 🎓 **适合学习**: 完整的中文注释，循序渐进的示例
- 🔧 **生产就绪**: 包含错误处理、测试、最佳实践
- 📖 **文档完善**: README、对比文档、示例说明一应俱全
- 🚀 **开箱即用**: 一键部署和运行

## 🎯 功能说明

### 智能合约功能

计数器程序支持以下操作：

1. **initialize**: 创建新的计数器账户，初始值为 0
2. **increment**: 计数器 +1
3. **decrement**: 计数器 -1

### 账户结构

```rust
pub struct Counter {
    pub count: u64,        // 计数值
    pub authority: Pubkey, // 权限所有者（只有他能修改）
}
```

## 🚀 快速开始

### 前置要求

确保已安装以下工具：

```bash
# Rust 和 Cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Node.js 和 Yarn
# 访问 https://nodejs.org/ 安装 Node.js
npm install -g yarn
```

### 安装依赖

```bash
# 克隆项目
git clone <your-repo-url>
cd my-project

# 安装 Node.js 依赖
yarn install

# （可选）编译 Rust 客户端
cd client
cargo build --release
cd ..
```

### 部署和运行

#### 1. 启动本地测试网络

```bash
# 在一个终端窗口中启动
solana-test-validator
```

#### 2. 部署智能合约

```bash
# 构建程序
anchor build

# 部署到本地网络
anchor deploy

# 查看程序 ID
solana address -k target/deploy/my_project-keypair.json
```

#### 3. 运行客户端

**方式 A: TypeScript 客户端（推荐）**

```bash
# 运行主示例
npx ts-node client-ts/index.ts

# 运行基础示例
npx ts-node client-ts/examples/basic.ts

# 运行批量操作示例
npx ts-node client-ts/examples/batch.ts

# 运行错误处理示例
npx ts-node client-ts/examples/error-handling.ts
```

**方式 B: Rust 客户端**

```bash
# 进入 Rust 客户端目录
cd client

# 运行 Anchor Rust Client
cargo run

# 或运行原生 SDK 版本（如果有）
cargo run --bin native
```

**方式 C: Anchor 测试框架**

```bash
# 运行测试（会自动启动测试网络）
anchor test
```

## 📁 项目结构

```
my-project/
├── programs/                  # 智能合约
│   └── my-project/
│       ├── src/
│       │   └── lib.rs        # 主程序代码
│       ├── Cargo.toml
│       └── Xargo.toml
│
├── client/                    # Rust 客户端
│   ├── src/
│   │   └── main.rs           # Anchor Rust Client
│   ├── Cargo.toml
│   ├── README.md             # Rust 客户端文档
│   ├── CODE_EXPLAINED.md     # 代码详解
│   └── COMPARISON.md         # 实现方式对比
│
├── client-ts/                 # TypeScript 客户端（推荐）⭐
│   ├── index.ts              # 主示例（完整功能）
│   ├── utils.ts              # 工具函数库
│   ├── examples/             # 多个示例
│   │   ├── basic.ts          # 基础示例
│   │   ├── batch.ts          # 批量操作
│   │   ├── error-handling.ts # 错误处理
│   │   └── README.md         # 示例说明
│   ├── README.md             # TypeScript 客户端文档
│   └── COMPARISON.md         # 与 Rust 客户端对比
│
├── tests/                     # 测试文件
│   └── my-project.ts         # Anchor 测试
│
├── target/                    # 编译输出
│   ├── deploy/               # 部署文件
│   ├── idl/                  # IDL 文件
│   └── types/                # TypeScript 类型定义
│
├── Anchor.toml               # Anchor 配置
├── Cargo.toml                # Workspace 配置
├── package.json              # Node.js 依赖
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 本文件
```

## 📖 文档导航

### 智能合约

- 主程序代码: [`programs/my-project/src/lib.rs`](programs/my-project/src/lib.rs)
- 程序 ID: 在 `Anchor.toml` 或部署后查看

### Rust 客户端

- 📄 [README](client/README.md) - 使用说明
- 📄 [CODE_EXPLAINED](client/CODE_EXPLAINED.md) - 代码详解
- 📄 [COMPARISON](client/COMPARISON.md) - 实现方式对比

### TypeScript 客户端（推荐）⭐

- 📄 [README](client-ts/README.md) - 使用说明
- 📄 [COMPARISON](client-ts/COMPARISON.md) - 与 Rust 对比
- 📁 [examples/](client-ts/examples/) - 多个示例
  - [basic.ts](client-ts/examples/basic.ts) - 基础示例
  - [batch.ts](client-ts/examples/batch.ts) - 批量操作
  - [error-handling.ts](client-ts/examples/error-handling.ts) - 错误处理

## 💡 使用建议

### 学习路径

1. **第一步**: 阅读本 README，了解项目概况
2. **第二步**: 查看智能合约代码 `programs/my-project/src/lib.rs`
3. **第三步**: 阅读 TypeScript 客户端文档 [`client-ts/README.md`](client-ts/README.md)
4. **第四步**: 运行示例代码，观察输出
5. **第五步**: 修改代码进行实验

### 推荐客户端

| 场景 | 推荐客户端 | 理由 |
|-----|----------|------|
| **学习 Solana** | TypeScript | 代码简洁，上手快 |
| **前端开发** | TypeScript | 完美集成 React/Vue/Next.js |
| **后端服务** | TypeScript (Node.js) | 开发效率高 |
| **高性能后端** | Rust Client | 性能更好（但差异很小） |
| **理解底层** | Rust (原生 SDK) | 了解 Solana 工作原理 |

**结论**: 除非有特殊需求，否则强烈推荐使用 **TypeScript 客户端** ✅

详细对比请查看：[client-ts/COMPARISON.md](client-ts/COMPARISON.md)

## 🔧 开发指南

### 修改智能合约

1. 编辑 `programs/my-project/src/lib.rs`
2. 重新构建和部署：
   ```bash
   anchor build
   anchor deploy
   ```
3. 测试修改：
   ```bash
   anchor test
   ```

### 添加新指令

在智能合约中添加新函数：

```rust
// 在 programs/my-project/src/lib.rs 中
pub fn reset(ctx: Context<Update>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = 0;
    msg!("Counter reset to: {}", counter.count);
    Ok(())
}
```

TypeScript 客户端会自动获得类型支持：

```typescript
// 自动补全，无需手动更新
await program.methods
  .reset()  // ✅ 自动识别新指令
  .accounts({ counter: counter.publicKey })
  .rpc();
```

### 运行测试

```bash
# 运行所有测试
anchor test

# 跳过本地验证器（如果已经运行）
anchor test --skip-local-validator

# 查看详细日志
anchor test -- --nocapture
```

## 🌐 网络配置

### 本地网络（默认）

```toml
# Anchor.toml
[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"
```

### 开发网（Devnet）

```bash
# 设置网络
solana config set --url https://api.devnet.solana.com

# 获取测试 SOL
solana airdrop 2

# 部署
anchor build
anchor deploy --provider.cluster devnet
```

### 测试网（Testnet）

```bash
solana config set --url https://api.testnet.solana.com
anchor deploy --provider.cluster testnet
```

### 主网（Mainnet）⚠️

```bash
solana config set --url https://api.mainnet-beta.solana.com
anchor deploy --provider.cluster mainnet
```

**警告**: 主网部署需要真实的 SOL，请谨慎操作！

## 🐛 调试技巧

### 查看程序日志

```bash
# 在另一个终端运行
solana logs

# 或使用 Anchor
anchor logs
```

### 查看账户信息

```bash
# 查看账户详情
solana account <ACCOUNT_ADDRESS>

# 查看账户余额
solana balance <ACCOUNT_ADDRESS>
```

### 查看交易详情

```bash
# 查看交易
solana confirm -v <TRANSACTION_SIGNATURE>
```

### 常见问题

#### 1. "insufficient funds" 错误

```bash
# 请求空投（本地/devnet）
solana airdrop 2

# 查看余额
solana balance
```

#### 2. "program not deployed" 错误

```bash
# 重新部署
anchor build
anchor deploy
```

#### 3. TypeScript 类型错误

```bash
# 重新生成 IDL 和类型
anchor build
```

#### 4. "Account does not exist" 错误

- 确保已初始化账户
- 检查账户地址是否正确
- 查看账户是否在正确的网络上

## 📊 性能优化

### 减少交易费用

- 优化账户大小
- 使用 PDA 代替普通账户
- 批量操作减少交易数量

### 提高交易速度

- 使用正确的 commitment 级别
- 并行发送独立交易
- 使用交易优先费

## 🔐 安全注意事项

### 生产环境检查清单

- [ ] 权限控制已正确实现
- [ ] 所有数值操作使用 `checked_*` 方法
- [ ] 账户所有权已验证
- [ ] PDA 推导已验证
- [ ] 没有硬编码的密钥
- [ ] 错误处理已完善
- [ ] 已进行安全审计（生产环境必需）

### 密钥管理

```bash
# 生产环境：使用硬件钱包或多签
# 测试环境：使用独立的测试密钥

# 创建新密钥
solana-keygen new -o ~/my-project-keypair.json

# 永远不要提交密钥到 Git
echo "*.json" >> .gitignore
```

## 📚 学习资源

### 官方文档

- [Solana 文档](https://docs.solana.com/)
- [Anchor 文档](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor 示例](https://github.com/coral-xyz/anchor/tree/master/examples)

### 教程

- [Solana 开发课程](https://www.soldev.app/)
- [Anchor 教程](https://book.anchor-lang.com/)
- [Solana 程序库](https://spl.solana.com/)

### 社区

- [Solana Discord](https://discord.gg/solana)
- [Anchor Discord](https://discord.gg/anchor)
- [Solana Stack Exchange](https://solana.stackexchange.com/)

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

### 贡献方式

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- Rust: 使用 `cargo fmt` 格式化
- TypeScript: 使用 `prettier` 格式化
- 添加必要的注释和文档
- 确保所有测试通过

## 📄 许可证

ISC

## 🙏 致谢

- [Solana Labs](https://solana.com/) - Solana 区块链
- [Coral](https://github.com/coral-xyz) - Anchor 框架
- Solana 社区的所有贡献者

---

## 📞 联系方式

如有问题或建议，请：
- 提交 GitHub Issue
- 加入 Solana Discord 社区
- 查看 [Solana Stack Exchange](https://solana.stackexchange.com/)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个 Star！**

Made with ❤️ for the Solana community

</div>
