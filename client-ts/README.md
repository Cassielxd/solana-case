# TypeScript 客户端

多程序 TypeScript 客户端集合，包含完整的示例和共享工具库。

## 📁 目录结构

```
client-ts/
├── my-counter/          # 计数器程序客户端
│   ├── index.ts         # 主示例（完整功能演示）
│   └── examples/        # 多个使用场景
│       ├── basic.ts     # 基础示例
│       ├── batch.ts     # 批量操作
│       ├── error-handling.ts  # 错误处理
│       └── README.md    # 示例说明
│
├── token-vault/         # 金库程序客户端
│   ├── index.ts         # 主示例
│   └── examples/        # (待添加)
│
├── shared/              # 共享资源
│   ├── utils.ts         # 工具函数库
│   ├── README.md        # 客户端文档
│   └── COMPARISON.md    # 与 Rust 客户端对比
│
└── README.md            # 本文件
```

## 🚀 快速开始

### 运行计数器客户端

```bash
# 主示例（完整功能）
npx ts-node client-ts/my-counter/index.ts

# 基础示例
npx ts-node client-ts/my-counter/examples/basic.ts

# 批量操作示例
npx ts-node client-ts/my-counter/examples/batch.ts

# 错误处理示例
npx ts-node client-ts/my-counter/examples/error-handling.ts
```

### 运行金库客户端

```bash
# 主示例
npx ts-node client-ts/token-vault/index.ts
```

## 📚 文档

- [客户端使用文档](shared/README.md) - TypeScript 客户端详细说明
- [对比文档](shared/COMPARISON.md) - 与 Rust 客户端对比
- [工具函数库](shared/utils.ts) - 共享工具函数

## 💡 程序说明

### My Counter (计数器)

简单的计数器程序，演示基础的 Solana 程序开发。

**功能**:
- initialize - 初始化计数器
- increment - 增加计数
- decrement - 减少计数

**程序 ID**: `MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj`

### Token Vault (金库)

安全的 SOL 金库程序，支持存款、提款和权限管理。

**功能**:
- initialize - 创建金库
- deposit - 存入 SOL
- withdraw - 提取 SOL
- transfer_authority - 转移所有权
- close_vault - 关闭金库

**程序 ID**: `FukTyMfW3YnifZmVD66Y26nXECk68HNbpQ4DfifU16wZ`

## 🔧 共享工具

所有客户端都可以使用 `shared/utils.ts` 中的工具函数：

```typescript
import { createProvider, printAccountInfo, formatSol } from "../shared/utils";

// 创建 Provider
const provider = createProvider();

// 打印账户信息
await printAccountInfo(connection, publicKey, "账户名称");

// 格式化 SOL 数量
const solAmount = formatSol(lamports);
```

## 📖 使用示例

### 基础模板

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProject } from "../../target/types/my_project";
import { createProvider } from "../shared/utils";

async function main() {
  // 1. 创建 Provider
  const provider = createProvider();
  anchor.setProvider(provider);

  // 2. 加载程序
  const program = anchor.workspace.myProject as Program<MyProject>;

  // 3. 调用指令
  await program.methods
    .initialize()
    .accounts({ /* ... */ })
    .rpc();
}

main().catch(console.error);
```

## 🆚 为什么选择 TypeScript？

| 特性 | TypeScript | Rust |
|-----|-----------|------|
| 代码量 | 😊 少（~30 行） | 😰 多（~150 行） |
| 学习曲线 | 😊 平缓 | 😐 中等 |
| 开发效率 | ✅ 高 | ⚠️ 中等 |
| IDE 支持 | ✅ 完整 | ✅ 完整 |
| 自动化程度 | ✅ 完全自动 | ⚠️ 部分手动 |

详细对比请查看 [COMPARISON.md](shared/COMPARISON.md)

## 🎓 学习路径

1. **入门** (30分钟)
   - 阅读 [shared/README.md](shared/README.md)
   - 运行 `my-counter/examples/basic.ts`

2. **进阶** (1小时)
   - 运行所有示例
   - 阅读 [COMPARISON.md](shared/COMPARISON.md)
   - 查看 `shared/utils.ts`

3. **实践** (2+小时)
   - 修改示例代码
   - 编写自己的客户端
   - 集成到应用中

## 📝 添加新程序客户端

当你添加新程序时，创建对应的客户端目录：

```bash
# 创建新程序的客户端目录
mkdir -p client-ts/my-new-program/examples

# 创建主文件
touch client-ts/my-new-program/index.ts
touch client-ts/my-new-program/examples/basic.ts
```

## 🤝 贡献

欢迎贡献新的示例和工具函数！

## 📄 许可证

ISC

---

**提示**: 所有客户端共享 `utils.ts` 工具库，避免代码重复。
