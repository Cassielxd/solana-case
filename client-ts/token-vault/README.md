# Token Vault 客户端

金库程序的 TypeScript 客户端实现。

## 📋 程序信息

- **程序名称**: token-vault
- **程序 ID**: `FukTyMfW3YnifZmVD66Y26nXECk68HNbpQ4DfifU16wZ`
- **功能**: SOL 金库，支持存款、提款、权限管理

## 📁 文件列表

```
token-vault/
├── index.ts          # 主示例（完整功能演示）
├── examples/         # (待添加更多示例)
└── README.md         # 本文件
```

## 🚀 使用方法

### 运行主示例

```bash
npx ts-node client-ts/token-vault/index.ts
```

**功能演示**:
- ✅ 创建金库
- ✅ 存入 SOL（多次）
- ✅ 提取 SOL
- ✅ 转移所有权
- ✅ 关闭金库
- ✅ 查询状态

## 💻 代码示例

### 创建金库

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenVault } from "../../target/types/token_vault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createProvider } from "../shared/utils";

// 1. 创建 Provider
const provider = createProvider();
anchor.setProvider(provider);

// 2. 加载程序
const program = anchor.workspace.tokenVault as Program<TokenVault>;

// 3. 计算金库 PDA
const vaultName = "my-vault";
const [vaultPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("vault"),
    provider.wallet.publicKey.toBuffer(),
    Buffer.from(vaultName)
  ],
  program.programId
);

// 4. 初始化金库
await program.methods
  .initialize(vaultName)
  .accounts({
    vault: vaultPda,
    authority: provider.wallet.publicKey,
  })
  .rpc();
```

### 存款

```typescript
await program.methods
  .deposit(new anchor.BN(0.5 * LAMPORTS_PER_SOL))
  .accounts({
    vault: vaultPda,
    depositor: provider.wallet.publicKey,
  })
  .rpc();
```

### 提款

```typescript
await program.methods
  .withdraw(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
  .accounts({
    vault: vaultPda,
    authority: provider.wallet.publicKey,
    receiver: receiverPubkey,
  })
  .rpc();
```

### 查询金库

```typescript
const vault = await program.account.vault.fetch(vaultPda);
console.log("Name:", vault.vaultName);
console.log("Authority:", vault.authority.toBase58());
console.log("Total deposits:", vault.totalDeposits.toString());
console.log("Total withdrawals:", vault.totalWithdrawals.toString());

// 查询余额
const balance = await provider.connection.getBalance(vaultPda);
console.log("Current balance:", balance / LAMPORTS_PER_SOL, "SOL");
```

## 🔐 安全特性

- 🔒 **权限控制**: 只有所有者可以提款
- 🔒 **余额保护**: 自动保留租金豁免所需的最低余额
- 🔒 **PDA 验证**: 使用程序派生地址确保安全
- 🔒 **溢出检查**: 所有数值操作使用 `checked_*` 方法

## 📖 使用场景

1. **个人储蓄**: 创建个人金库存储 SOL
2. **托管服务**: 用于第三方托管
3. **团队金库**: 团队资金管理
4. **定期存款**: 配合时间锁定功能（待实现）

## 🔗 相关资源

- [智能合约代码](../../programs/token-vault/src/lib.rs)
- [程序文档](../../programs/token-vault/README.md)
- [程序测试](../../tests/token-vault.ts)
- [工具函数库](../shared/utils.ts)
- [客户端文档](../shared/README.md)

---

[返回上级目录](../README.md)
