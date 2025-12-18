# My Counter 客户端

计数器程序的 TypeScript 客户端实现。

## 📋 程序信息

- **程序名称**: my-project (Counter)
- **程序 ID**: `MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj`
- **功能**: 简单的计数器，支持初始化、增加、减少

## 📁 文件列表

```
my-counter/
├── index.ts                    # 主示例（完整功能演示）
├── examples/
│   ├── basic.ts                # 基础示例
│   ├── batch.ts                # 批量操作示例
│   ├── error-handling.ts       # 错误处理示例
│   └── README.md               # 示例说明
└── README.md                   # 本文件
```

## 🚀 使用方法

### 运行主示例

```bash
npx ts-node client-ts/my-counter/index.ts
```

**功能演示**:
- ✅ 初始化计数器
- ✅ 批量增加（10次）
- ✅ 减少计数
- ✅ 错误处理演示
- ✅ 查询状态

### 运行基础示例

```bash
npx ts-node client-ts/my-counter/examples/basic.ts
```

最简单的使用方式，适合初学者。

### 运行批量操作示例

```bash
npx ts-node client-ts/my-counter/examples/batch.ts
```

演示如何批量执行交易和性能测试。

### 运行错误处理示例

```bash
npx ts-node client-ts/my-counter/examples/error-handling.ts
```

演示各种错误场景的处理方式。

## 💻 代码示例

### 初始化计数器

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProject } from "../../target/types/my_project";
import { Keypair } from "@solana/web3.js";
import { createProvider } from "../shared/utils";

// 1. 创建 Provider
const provider = createProvider();
anchor.setProvider(provider);

// 2. 加载程序
const program = anchor.workspace.myProject as Program<MyProject>;

// 3. 生成计数器
const counter = Keypair.generate();

// 4. 初始化
await program.methods
  .initialize()
  .accounts({
    counter: counter.publicKey,
    user: provider.wallet.publicKey,
  })
  .signers([counter])
  .rpc();
```

### 增加计数

```typescript
await program.methods
  .increment()
  .accounts({
    counter: counter.publicKey,
  })
  .rpc();
```

### 查询状态

```typescript
const counterAccount = await program.account.counter.fetch(counter.publicKey);
console.log("Count:", counterAccount.count.toString());
console.log("Authority:", counterAccount.authority.toBase58());
```

## 📖 学习路径

1. **basic.ts** - 学习基础操作
2. **batch.ts** - 学习批量操作
3. **error-handling.ts** - 学习错误处理
4. **index.ts** - 综合应用

## 🔗 相关资源

- [智能合约代码](../../programs/my-project/src/lib.rs)
- [程序测试](../../tests/my-project.ts)
- [工具函数库](../shared/utils.ts)
- [客户端文档](../shared/README.md)

---

[返回上级目录](../README.md)
