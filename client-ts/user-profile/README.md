# User Profile 客户端

用户资料管理程序的 TypeScript 客户端实现。

## 📋 程序信息

- **程序名称**: user-profile
- **程序 ID**: `3cSw9RozRy2bUVsB5PhBGKFHoy4CYCReEB99FmW1eUHL`
- **功能**: 用户资料管理，支持创建、更新、删除用户信息

## 📁 文件列表

```
user-profile/
├── index.ts          # 主示例（完整功能演示）
└── README.md         # 本文件
```

## 🚀 使用方法

### 运行主示例

```bash
npx ts-node client-ts/user-profile/index.ts
```

**功能演示**:
- ✅ 创建用户资料
- ✅ 查询用户资料
- ✅ 部分更新（只更新部分字段）
- ✅ 全量更新（更新所有字段）
- ✅ 删除用户资料
- ✅ 验证删除

## 💻 代码示例

### 创建用户资料

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UserProfile } from "../../target/types/user_profile";
import { PublicKey } from "@solana/web3.js";
import { createProvider } from "../shared/utils";

// 1. 创建 Provider
const provider = createProvider();
anchor.setProvider(provider);

// 2. 加载程序
const program = anchor.workspace.userProfile as Program<UserProfile>;

// 3. 计算用户资料 PDA
const authority = provider.wallet.publicKey;
const [userProfilePda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user-profile"),
    authority.toBuffer()
  ],
  program.programId
);

// 4. 创建用户资料
await program.methods
  .createProfile(
    "alice_web3",                    // 用户名
    "alice@solana.com",              // 邮箱
    25,                               // 年龄
    "Web3 developer"                  // 个人简介
  )
  .accountsPartial({
    userProfile: userProfilePda,
    authority: authority,
  })
  .rpc();
```

### 查询用户资料

```typescript
const profile = await program.account.userProfile.fetch(userProfilePda);

console.log("用户名:", profile.username);
console.log("邮箱:", profile.email);
console.log("年龄:", profile.age);
console.log("个人简介:", profile.bio);
console.log("创建时间:", new Date(profile.createdAt.toNumber() * 1000).toLocaleString());
console.log("更新时间:", new Date(profile.updatedAt.toNumber() * 1000).toLocaleString());
```

### 部分更新

```typescript
// 只更新年龄和个人简介，其他字段保持不变
await program.methods
  .updateProfile(
    null,                             // 用户名：不更新（传 null）
    null,                             // 邮箱：不更新
    26,                               // 年龄：更新为 26
    "Senior Web3 developer"           // 简介：更新
  )
  .accountsPartial({
    userProfile: userProfilePda,
    authority: authority,
  })
  .rpc();
```

### 全量更新

```typescript
// 更新所有字段
await program.methods
  .updateProfile(
    "alice_solana",                   // 更新用户名
    "alice.solana@example.com",      // 更新邮箱
    27,                               // 更新年龄
    "Full-stack Web3 developer"       // 更新简介
  )
  .accountsPartial({
    userProfile: userProfilePda,
    authority: authority,
  })
  .rpc();
```

### 删除用户资料

```typescript
await program.methods
  .deleteProfile()
  .accountsPartial({
    userProfile: userProfilePda,
    authority: authority,
  })
  .rpc();
```

## 🔐 安全特性

- 🔒 **唯一性保证**: 每个钱包地址只能有一个用户资料
- 🔒 **权限控制**: 只有所有者可以更新和删除
- 🔒 **数据验证**: 自动验证字段长度和非空
- 🔒 **PDA 验证**: 使用程序派生地址确保安全

## 📖 使用场景

1. **Web3 社交应用**: 用户身份信息管理
2. **链上游戏**: 玩家资料存储
3. **去中心化论坛**: 用户信息展示
4. **DApp 用户系统**: 链上用户数据

## 🔗 相关资源

- [智能合约代码](../../programs/user-profile/src/lib.rs)
- [程序文档](../../programs/user-profile/README.md)
- [程序测试](../../tests/user-profile.ts)
- [工具函数库](../shared/utils.ts)

---

[返回上级目录](../README.md)
