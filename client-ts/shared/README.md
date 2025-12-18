# Solana 计数器 TypeScript 客户端

这是一个使用 Anchor TypeScript SDK 编写的客户端程序，演示如何调用部署在 Solana 链上的计数器智能合约。

## ✨ 特性

这个客户端展示了如何：
1. 连接到 Solana 网络
2. 使用 Anchor Provider 管理钱包和连接
3. 调用智能合约的指令（initialize、increment、decrement）
4. 查询链上账户状态
5. 处理错误和异常情况
6. 批量执行交易

## 🚀 快速开始

### 前置要求

- Node.js 16+
- Yarn 或 npm
- Solana CLI 工具
- Anchor CLI

### 安装依赖

```bash
# 在项目根目录
yarn install
```

### 使用步骤

#### 1. 启动本地 Solana 测试网络

```bash
# 在一个终端窗口中启动
solana-test-validator
```

#### 2. 部署智能合约

```bash
# 在项目根目录
anchor build
anchor deploy
```

#### 3. 运行客户端

```bash
# 方式 1: 使用 ts-node
npx ts-node client-ts/index.ts

# 方式 2: 使用 Anchor 测试框架（推荐）
anchor test --skip-local-validator

# 方式 3: 编译后运行
npx tsc client-ts/index.ts
node client-ts/index.js
```

## 📖 核心概念

### 1. Provider（提供者）

Provider 封装了与 Solana 网络交互所需的所有配置：

```typescript
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
```

Provider 包含：
- **connection**: RPC 连接（用于查询链上数据）
- **wallet**: 钱包（用于签名和支付交易费用）
- **opts**: 选项（如 commitment 级别）

### 2. Program（程序对象）

Program 对象提供类型安全的 API 来调用智能合约：

```typescript
const program = anchor.workspace.myProject as Program<MyProject>;
```

Program 对象提供：
- `program.methods`: 调用指令
- `program.account`: 查询账户
- `program.programId`: 程序 ID

### 3. 调用指令

使用 `program.methods` 调用智能合约指令：

```typescript
const tx = await program.methods
  .increment()                          // 指令名（自动补全）
  .accounts({                           // 账户（类型检查）
    counter: counterPubkey,
  })
  .rpc();                               // 发送交易
```

Anchor 自动处理：
- ✅ 指令鉴别器（8 字节 ID）
- ✅ 参数序列化
- ✅ 账户元数据
- ✅ 交易构建和发送
- ✅ 已知账户（如 systemProgram、authority）自动推断

### 4. 查询账户

使用 `program.account` 查询账户状态：

```typescript
const counterAccount = await program.account.counter.fetch(counterPubkey);

console.log("计数值:", counterAccount.count.toString());
console.log("权限:", counterAccount.authority.toBase58());
```

Anchor 自动：
- ✅ 验证账户鉴别器
- ✅ 反序列化数据
- ✅ 提供类型化对象

## 📚 代码结构

```
client-ts/
├── index.ts           # 主示例（完整功能演示）
├── utils.ts           # 工具函数库
├── examples/          # 更多示例
│   ├── basic.ts       # 基础示例
│   ├── batch.ts       # 批量操作示例
│   └── error.ts       # 错误处理示例
├── README.md          # 本文档
└── COMPARISON.md      # 与 Rust 客户端对比
```

## 💡 代码示例

### 初始化计数器

```typescript
// 1. 生成新的计数器账户
const counter = Keypair.generate();

// 2. 调用 initialize 指令
const tx = await program.methods
  .initialize()
  .accounts({
    counter: counter.publicKey,
    user: provider.wallet.publicKey,
    // systemProgram 自动解析（Anchor 0.32+）
  })
  .signers([counter])  // counter 需要签名（新账户）
  .rpc();

console.log("交易签名:", tx);
```

### 增加计数器

```typescript
const tx = await program.methods
  .increment()
  .accounts({
    counter: counter.publicKey,
    // authority 通过 wallet 自动推断
  })
  .rpc();
```

### 查询状态

```typescript
const account = await program.account.counter.fetch(counter.publicKey);

console.log("计数值:", account.count.toString());
console.log("权限所有者:", account.authority.toBase58());
```

### 批量操作

```typescript
// 串行执行（逐个交易）
for (let i = 0; i < 10; i++) {
  await program.methods
    .increment()
    .accounts({ counter: counter.publicKey })
    .rpc();
}
```

### 错误处理

```typescript
try {
  const wrongAuthority = Keypair.generate();

  await program.methods
    .increment()
    .accounts({
      counter: counter.publicKey,
    })
    .signers([wrongAuthority])  // 错误的签名者
    .rpc();
} catch (error) {
  console.error("错误:", error.message);

  // 查看程序日志
  if (error.logs) {
    error.logs.forEach(log => console.log(log));
  }
}
```

## 🔧 配置

### 切换网络

修改环境变量或 Anchor.toml：

```toml
[provider]
cluster = "localnet"  # localnet | devnet | testnet | mainnet-beta
wallet = "~/.config/solana/id.json"
```

或使用环境变量：

```bash
# 本地网络
export ANCHOR_PROVIDER_URL=http://127.0.0.1:8899

# 开发网
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com

# 钱包路径
export ANCHOR_WALLET=~/.config/solana/id.json
```

### 交易确认级别

```typescript
const provider = new anchor.AnchorProvider(
  connection,
  wallet,
  {
    commitment: "confirmed",  // processed | confirmed | finalized
    preflightCommitment: "confirmed"
  }
);
```

## 🆚 TypeScript vs Rust 客户端

| 特性 | TypeScript SDK | Rust SDK |
|------|---------------|----------|
| **代码量** | 😊 少 | 😰 多 |
| **鉴别器处理** | ✅ 自动 | ❌ 手动 |
| **类型安全** | ✅ 完全 | ⚠️ 部分 |
| **学习曲线** | 😊 平缓 | 😐 中等 |
| **IDE 支持** | ✅ 优秀 | ✅ 优秀 |
| **开发效率** | ✅ 高 | ⚠️ 中等 |
| **适用场景** | 前端、测试、原型 | 后端服务、高性能 |

详细对比请参阅 [COMPARISON.md](./COMPARISON.md)

## 📝 最佳实践

### 1. 始终处理错误

```typescript
try {
  const tx = await program.methods.increment()
    .accounts({ counter: counter.publicKey })
    .rpc();
  // 等待确认
  await provider.connection.confirmTransaction(tx);
} catch (error) {
  console.error("交易失败:", error);
  // 检查错误类型并相应处理
}
```

### 2. 使用类型安全

```typescript
// ✅ 好 - 使用类型化的 Program
const program = anchor.workspace.myProject as Program<MyProject>;

// ❌ 不好 - 失去类型安全
const program = anchor.workspace.myProject;
```

### 3. 正确管理密钥对

```typescript
// ✅ 好 - 生产环境从安全位置加载
const wallet = anchor.web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("./wallet.json", "utf-8")))
);

// ❌ 不好 - 不要硬编码私钥
const wallet = anchor.web3.Keypair.fromSecretKey([1, 2, 3, ...]);
```

### 4. 利用 Anchor 0.32+ 的自动账户解析

```typescript
// ✅ 好 - 让 Anchor 自动推断已知账户
await program.methods
  .increment()
  .accounts({
    counter: counter.publicKey,
    // authority 和 systemProgram 自动解析
  })
  .rpc();

// ❌ 旧方式 - 手动指定所有账户（Anchor 0.30 及更早版本）
await program.methods
  .increment()
  .accounts({
    counter: counter.publicKey,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## 🐛 调试技巧

### 查看程序日志

```bash
# 在另一个终端
solana logs
```

### 查看账户信息

```bash
solana account <COUNTER_ADDRESS>
```

### 查看交易详情

```bash
solana confirm -v <TRANSACTION_SIGNATURE>
```

### 在代码中打印日志

```typescript
// 打印交易详情
const tx = await program.methods.increment()
  .accounts({ counter: counter.publicKey })
  .rpc();

const txDetails = await provider.connection.getTransaction(tx, {
  commitment: "confirmed"
});
console.log("交易详情:", JSON.stringify(txDetails, null, 2));
```

## 🔗 相关资源

- [Anchor 官方文档](https://www.anchor-lang.com/)
- [Anchor TypeScript Client 文档](https://www.anchor-lang.com/docs/typescript-client)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Web3.js 文档](https://solana-labs.github.io/solana-web3.js/)
- [Anchor 示例代码](https://github.com/coral-xyz/anchor/tree/master/examples)

## ❓ 常见问题

### Q: 如何获取程序 ID？

从 `Anchor.toml` 或智能合约的 `declare_id!` 宏获取：

```typescript
console.log("程序 ID:", program.programId.toBase58());
```

### Q: 为什么账户类型不匹配？

确保你的类型定义与智能合约一致。重新构建项目会更新类型：

```bash
anchor build
```

### Q: Anchor 0.32+ 中哪些账户会自动解析？

- 具有固定地址的账户（如 `systemProgram`）
- 签名者账户（如 `authority`）在某些情况下会从 wallet 推断
- 使用 PDA 推导的账户

### Q: 如何在前端使用？

```typescript
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./idl/my_project.json";

// 使用浏览器钱包（如 Phantom）
const connection = new Connection("https://api.devnet.solana.com");
const wallet = window.solana;  // Phantom wallet

const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(idl, programId, provider);
```

### Q: 交易失败怎么办？

1. 检查错误消息和日志
2. 确认账户地址正确
3. 确认钱包有足够 SOL
4. 检查程序是否正确部署
5. 使用 `solana logs` 查看实时日志

## 📄 许可证

ISC

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**提示**: 这个客户端是学习 Anchor TypeScript SDK 的完整示例。建议先阅读代码注释，然后运行程序观察输出，最后尝试修改代码进行实验。
