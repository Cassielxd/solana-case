# Solana 智能合约开发项目

一个完整的 Solana 多程序开发项目，展示如何使用 Anchor 框架构建链上程序，包含详细的中文注释和多种客户端实现。

## 📚 项目简介

这是一个教学项目，包含**两个完整的 Solana 智能合约**，覆盖不同的应用场景：

### 🔢 程序 1: My Counter（计数器）
- ✅ **功能**: 简单的计数器，支持增加和减少
- ✅ **学习重点**: Anchor 基础、账户管理、权限控制
- ✅ **客户端**: Rust 和 TypeScript 双实现
- 📖 [查看详细文档](programs/my-project/README.md)

### 💰 程序 2: Token Vault（代币金库）
- ✅ **功能**: SOL 金库，支持存款、提款、转移所有权
- ✅ **学习重点**: PDA、CPI、租金管理、所有权转移
- ✅ **特色**: 完整的中文代码注释（500+ 行）
- 📖 [查看详细文档](programs/token-vault/README.md)

### 项目特点

- 🎓 **适合学习**: 完整的中文注释，循序渐进的示例
- 🏗️ **多程序架构**: 演示如何在一个项目中管理多个程序
- 🔧 **生产就绪**: 包含错误处理、测试、最佳实践
- 📖 **文档完善**: README、示例、对比文档一应俱全
- 🚀 **开箱即用**: 一键部署和运行

## 🎯 快速导航

### 程序文档

| 程序 | 功能 | 程序 ID | 文档 |
|------|------|---------|------|
| **my-counter** | 计数器 | `MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj` | [README](programs/my-project/README.md) |
| **token-vault** | SOL 金库 | `FukTyMfW3YnifZmVD66Y26nXECk68HNbpQ4DfifU16wZ` | [README](programs/token-vault/README.md) |

### 客户端文档

| 客户端 | 支持程序 | 文档 |
|--------|---------|------|
| **TypeScript** ⭐ | 全部 | [my-counter](client-ts/my-counter/README.md) · [token-vault](client-ts/token-vault/README.md) |
| **Rust** | my-counter | [README](client/README.md) |

### 开发指南

- 📘 [多程序开发指南](MULTI_PROGRAM_GUIDE.md) - 如何在一个项目中管理多个程序
- 📘 [客户端对比](client-ts/shared/COMPARISON.md) - Rust vs TypeScript 客户端

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
# 构建所有程序
anchor build

# 部署所有程序到本地网络
anchor deploy

# 或部署特定程序
anchor deploy --program-name token-vault
anchor deploy --program-name my-project
```

#### 3. 运行客户端示例

**💰 Token Vault（SOL 金库）**

```bash
# 运行完整示例（推荐从这个开始）
npx ts-node client-ts/token-vault/index.ts
```

**🔢 My Counter（计数器）**

```bash
# 运行主示例
npx ts-node client-ts/my-counter/index.ts

# 运行基础示例
npx ts-node client-ts/my-counter/examples/basic.ts

# 运行批量操作示例
npx ts-node client-ts/my-counter/examples/batch.ts

# 运行错误处理示例
npx ts-node client-ts/my-counter/examples/error-handling.ts
```

**🦀 Rust 客户端（仅支持 my-counter）**

```bash
cd client
cargo run
```

#### 4. 运行测试

```bash
# 运行所有测试
anchor test

# 运行特定程序的测试
anchor test tests/token-vault.ts
anchor test tests/my-project.ts
```

## 📁 项目结构

```
my-project/
├── programs/                      # 智能合约（多个程序）
│   ├── my-project/                # 程序 1: 计数器
│   │   ├── src/
│   │   │   └── lib.rs             # 程序代码
│   │   ├── Cargo.toml
│   │   └── README.md
│   │
│   └── token-vault/               # 程序 2: 代币金库 ⭐
│       ├── src/
│       │   └── lib.rs             # 程序代码（含详细中文注释）
│       ├── Cargo.toml
│       └── README.md
│
├── client/                        # Rust 客户端（仅支持 my-counter）
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   ├── README.md
│   ├── CODE_EXPLAINED.md
│   └── COMPARISON.md
│
├── client-ts/                     # TypeScript 客户端（推荐）⭐
│   ├── my-counter/                # my-counter 客户端
│   │   ├── index.ts
│   │   ├── examples/
│   │   └── README.md
│   │
│   ├── token-vault/               # token-vault 客户端 ⭐
│   │   ├── index.ts               # 含详细中文注释
│   │   └── README.md
│   │
│   └── shared/                    # 共享工具
│       ├── utils.ts
│       ├── COMPARISON.md
│       └── README.md
│
├── tests/                         # 测试文件
│   ├── my-project.ts
│   └── token-vault.ts
│
├── target/                        # 编译输出
│   ├── deploy/                    # 部署文件
│   │   ├── my_project.so
│   │   ├── my_project-keypair.json
│   │   ├── token_vault.so
│   │   └── token_vault-keypair.json
│   ├── idl/                       # IDL 文件
│   │   ├── my_project.json
│   │   └── token_vault.json
│   └── types/                     # TypeScript 类型定义
│       ├── my_project.ts
│       └── token_vault.ts
│
├── Anchor.toml                    # Anchor 配置（多程序）
├── Cargo.toml                     # Workspace 配置
├── package.json                   # Node.js 依赖
├── tsconfig.json                  # TypeScript 配置
├── MULTI_PROGRAM_GUIDE.md         # 多程序开发指南 📘
└── README.md                      # 本文件
```

## 📖 学习路径

### 🎓 推荐学习顺序

#### 初学者路线（从简单到复杂）

1. **第一步**: 阅读本 README，了解项目概况
2. **第二步**: 学习 **My Counter** 程序
   - 查看 [programs/my-project/src/lib.rs](programs/my-project/src/lib.rs)
   - 运行 [client-ts/my-counter/examples/basic.ts](client-ts/my-counter/examples/basic.ts)
   - 理解 Anchor 基础概念
3. **第三步**: 学习 **Token Vault** 程序 ⭐
   - 查看 [programs/token-vault/src/lib.rs](programs/token-vault/src/lib.rs)（含详细中文注释）
   - 查看 [client-ts/token-vault/index.ts](client-ts/token-vault/index.ts)（含详细中文注释）
   - 运行完整示例，理解 PDA、CPI 等高级概念
4. **第四步**: 阅读 [多程序开发指南](MULTI_PROGRAM_GUIDE.md)
5. **第五步**: 修改代码进行实验

#### 快速上手路线（直接看完整示例）

1. 运行 Token Vault 示例：`npx ts-node client-ts/token-vault/index.ts`
2. 查看代码中的详细中文注释
3. 根据需要深入学习特定功能

## 💡 程序功能对比

| 功能 | My Counter | Token Vault |
|------|-----------|-------------|
| **难度** | ⭐ 入门 | ⭐⭐⭐ 中级 |
| **核心概念** | 账户、指令 | PDA、CPI、Rent |
| **账户类型** | 普通账户 | PDA 账户 |
| **权限控制** | ✅ 基础 | ✅ 高级（所有权转移） |
| **跨程序调用** | ❌ | ✅ 支持 CPI |
| **中文注释** | 部分 | ✅ 完整（500+ 行）|
| **适合场景** | 学习基础 | 实际应用开发 |

## 🔧 开发指南

### 多程序管理

查看 [MULTI_PROGRAM_GUIDE.md](MULTI_PROGRAM_GUIDE.md) 了解如何：
- 添加新程序
- 构建特定程序
- 部署特定程序
- 跨程序调用（CPI）

### 修改智能合约

```bash
# 1. 编辑代码
vim programs/token-vault/src/lib.rs

# 2. 重新构建
anchor build

# 3. 重新部署
anchor deploy --program-name token-vault

# 4. 测试
anchor test tests/token-vault.ts
```

### 添加新指令

参考现有代码，在 `lib.rs` 中添加新函数即可。TypeScript 客户端会自动获得类型支持。

## 🌐 网络配置

### 本地网络（默认）

```bash
solana-test-validator
anchor deploy
```

### 开发网（Devnet）

```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2
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
# 实时查看所有日志
solana logs

# 查看特定程序日志
solana logs <PROGRAM_ID>

# 或使用 Anchor
anchor logs
```

### 查看账户信息

```bash
# 查看账户详情
solana account <ACCOUNT_ADDRESS>

# 查看账户余额
solana balance <ACCOUNT_ADDRESS>

# 查看程序信息
solana program show <PROGRAM_ID>
```

### 常见问题

#### 1. "insufficient funds" 错误

```bash
solana airdrop 2
solana balance
```

#### 2. "program not deployed" 错误

```bash
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

## 📊 推荐客户端

| 场景 | 推荐客户端 | 理由 |
|-----|----------|------|
| **学习 Solana** | TypeScript | 代码简洁，上手快，有详细注释 |
| **前端开发** | TypeScript | 完美集成 React/Vue/Next.js |
| **后端服务** | TypeScript (Node.js) | 开发效率高 |
| **高性能后端** | Rust Client | 性能更好（但差异很小） |
| **理解底层** | Rust (原生 SDK) | 了解 Solana 工作原理 |

**结论**: 除非有特殊需求，否则强烈推荐使用 **TypeScript 客户端** ✅

详细对比请查看：[client-ts/shared/COMPARISON.md](client-ts/shared/COMPARISON.md)

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

**🔥 特别推荐**: [Token Vault 程序](programs/token-vault/) - 包含 500+ 行详细中文注释！

</div>
