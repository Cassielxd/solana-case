# User Profile 客户端（集中式管理员模式）

用户资料管理程序的 TypeScript 客户端实现 - 集中式管理员模式。

## 📋 程序信息

- **程序名称**: user-profile
- **程序 ID**: `3cSw9RozRy2bUVsB5PhBGKFHoy4CYCReEB99FmW1eUHL`
- **功能**: 第三方系统用户资料管理，支持创建、更新、删除用户信息
- **架构模式**: 集中式管理员模式（一个管理员钱包负责所有支付）

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
- ✅ 创建用户资料（管理员为第三方用户创建）
- ✅ 查询用户资料
- ✅ 部分更新（只更新部分字段）
- ✅ 全量更新（更新所有字段）
- ✅ 创建多个用户资料（演示集中式管理）
- ✅ 删除用户资料
- ✅ 验证删除

## 💻 代码示例

### 初始化

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

// 3. 管理员钱包（系统统一的钱包）
const admin = provider.wallet.publicKey;
```

### 创建用户资料

```typescript
// 第三方系统的用户 ID（业务系统中的唯一标识）
const userId = "user_12345";

// 1. 计算用户资料 PDA
const [userProfilePda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user-profile"),  // 固定前缀
    admin.toBuffer(),              // 管理员钱包
    Buffer.from(userId)            // 第三方用户 ID
  ],
  program.programId
);

// 2. 创建用户资料（管理员签名并支付租金）
await program.methods
  .createProfile(
    userId,                      // 第三方用户 ID（必须）
    "alice_web3",                // 用户名
    "alice@solana.com",          // 邮箱
    25,                          // 年龄
    "Web3 developer"             // 个人简介
  )
  .accountsPartial({
    userProfile: userProfilePda,  // 用户资料 PDA
    admin: admin,                 // 管理员（签名者、支付者）
  })
  .rpc();
```

### 查询用户资料

```typescript
const profile = await program.account.userProfile.fetch(userProfilePda);

console.log("用户 ID:", profile.userId);
console.log("管理员:", profile.admin.toBase58());
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
// 必须由管理员钱包签名
await program.methods
  .updateProfile(
    null,                             // 用户名：不更新（传 null）
    null,                             // 邮箱：不更新
    26,                               // 年龄：更新为 26
    "Senior Web3 developer"           // 简介：更新
  )
  .accountsPartial({
    userProfile: userProfilePda,
    admin: admin,                     // 管理员（签名者）
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
    admin: admin,
  })
  .rpc();
```

### 删除用户资料

```typescript
// 管理员删除用户资料，租金退还给管理员
await program.methods
  .deleteProfile()
  .accountsPartial({
    userProfile: userProfilePda,
    admin: admin,
  })
  .rpc();
```

### 创建多个用户资料

```typescript
// 为第一个用户创建资料
const userId1 = "user_001";
const [pda1] = PublicKey.findProgramAddressSync(
  [Buffer.from("user-profile"), admin.toBuffer(), Buffer.from(userId1)],
  program.programId
);
await program.methods
  .createProfile(userId1, "alice", "alice@example.com", 25, "User 1")
  .accountsPartial({ userProfile: pda1, admin: admin })
  .rpc();

// 为第二个用户创建资料
const userId2 = "user_002";
const [pda2] = PublicKey.findProgramAddressSync(
  [Buffer.from("user-profile"), admin.toBuffer(), Buffer.from(userId2)],
  program.programId
);
await program.methods
  .createProfile(userId2, "bob", "bob@example.com", 30, "User 2")
  .accountsPartial({ userProfile: pda2, admin: admin })
  .rpc();
```

## 🔐 安全特性

- 🔒 **唯一性保证**: 每个 user_id 只能有一个用户资料
- 🔒 **权限控制**: 只有管理员可以创建、更新和删除所有用户资料
- 🔒 **数据验证**: 自动验证字段长度和非空
- 🔒 **PDA 验证**: 使用程序派生地址确保安全

## 🏗️ 架构说明

### 集中式管理员模式

本程序采用集中式管理员模式，与传统的去中心化模式有以下区别：

| 特性 | 集中式（本程序） | 去中心化 |
|------|----------------|---------|
| **签名者** | 管理员 | 每个用户 |
| **支付者** | 管理员 | 每个用户 |
| **PDA Seeds** | `[prefix, admin, user_id]` | `[prefix, user_wallet]` |
| **适用场景** | 第三方系统集成、SaaS 平台 | Web3 原生应用 |
| **权限模型** | 集中式控制 | 用户自主控制 |
| **成本** | 集中支付，成本可控 | 分散支付，用户承担 |

### PDA 设计

```
seeds = [
    b"user-profile",    // 固定前缀
    admin.key(),        // 管理员钱包地址（固定）
    user_id             // 第三方用户 ID（唯一）
]
```

**设计说明**:
- `admin.key()`: 系统管理员钱包，所有用户资料都由此钱包管理
- `user_id`: 第三方系统的用户 ID（如数据库 ID、OAuth ID 等）
- 这样设计确保了每个 user_id 只能有一个资料，且由同一管理员管理

## 📖 使用场景

### 1. 第三方应用集成

将业务系统的用户数据存储到 Solana 链上：

```typescript
// 业务系统：数据库中有用户记录
const dbUserId = "db_user_12345";

// 链上存储：同步用户信息到链上
await createProfile(dbUserId, username, email, age, bio);

// 后续查询：通过 user_id 快速获取链上数据
const [pda] = getPdaFromUserId(dbUserId);
const profile = await fetchProfile(pda);
```

### 2. 中心化服务的链上扩展

后端服务作为管理员，代理用户进行链上操作：

```typescript
// API 端点：POST /api/users/:userId/profile
async function createUserProfile(req, res) {
  const { userId } = req.params;
  const { username, email, age, bio } = req.body;

  // 后端使用管理员钱包签名
  const tx = await program.methods
    .createProfile(userId, username, email, age, bio)
    .accountsPartial({ userProfile: pda, admin: adminWallet })
    .rpc();

  res.json({ success: true, tx });
}
```

### 3. 链上游戏玩家系统

游戏服务器管理所有玩家的链上资料：

```typescript
// 玩家注册
await createProfile("player_12345", "DragonSlayer", "player@game.com", 0, "Level 1");

// 玩家升级
await updateProfile(null, null, null, "Level 50 - 1000 battles won");
```

### 4. SaaS 平台用户管理

SaaS 平台为企业客户管理用户资料：

```typescript
await createProfile("employee_001", "Alice", "alice@company.com", 25, "Manager");
await createProfile("employee_002", "Bob", "bob@company.com", 30, "Tech Lead");
```

## 🎯 最佳实践

### 1. 管理员钱包安全

```typescript
// ❌ 不要这样做
const admin = Keypair.fromSecretKey(hardcodedSecret);

// ✅ 推荐做法
// - 使用环境变量存储私钥
// - 后端服务器使用加密存储
// - 考虑使用硬件钱包
// - 实施多签机制（需要额外开发）
```

### 2. User ID 管理

```typescript
// ✅ 使用业务系统的唯一标识
const userId = user.databaseId.toString();
const userId = user.oauthId;
const userId = user.uuid;

// ❌ 避免使用可变的标识
const userId = user.email; // 邮箱可能会变
const userId = user.username; // 用户名可能会变
```

### 3. 批量操作

```typescript
// ✅ 批量创建用户资料
const users = await getUsers();
for (const user of users) {
  const [pda] = getPdaFromUserId(user.id);
  await program.methods
    .createProfile(user.id, user.name, user.email, user.age, user.bio)
    .accountsPartial({ userProfile: pda, admin: admin })
    .rpc();

  // 避免过快发送交易
  await sleep(100);
}
```

### 4. 错误处理

```typescript
try {
  await program.methods
    .createProfile(userId, username, email, age, bio)
    .rpc();
} catch (error: any) {
  if (error.message.includes("already in use")) {
    console.log("用户资料已存在，尝试更新");
    await program.methods.updateProfile(...).rpc();
  } else {
    console.error("创建失败:", error.message);
  }
}
```

## 🔗 相关资源

- [智能合约代码](../../programs/user-profile/src/lib.rs)
- [程序文档](../../programs/user-profile/README.md)
- [程序测试](../../tests/user-profile.ts)
- [工具函数库](../shared/utils.ts)

## ⚠️ 注意事项

1. **管理员权限**: 所有操作都必须由管理员钱包签名
2. **成本控制**: 所有租金由管理员账户支付，需确保余额充足
3. **User ID 唯一性**: 一旦创建，user_id 不可变更
4. **数据验证**: 确保输入数据符合长度限制
5. **密钥安全**: 妥善保管管理员钱包私钥

## 🚧 未来扩展

- [ ] 添加批量操作 API
- [ ] 实现用户资料查询接口
- [ ] 添加数据导入/导出功能
- [ ] 支持管理员转移
- [ ] 实现多签管理员

---

[返回上级目录](../README.md)
