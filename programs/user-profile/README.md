# User Profile - 用户资料管理程序（集中式管理员模式）

一个用于存储第三方系统用户信息的 Solana 智能合约，采用集中式管理员模式，支持创建、更新和删除用户资料。

## 🎯 功能特性

### 核心功能

- ✅ **创建用户资料**: 管理员为第三方用户创建资料（user_id + 用户信息）
- ✅ **更新用户资料**: 管理员更新用户资料，支持部分更新或全量更新
- ✅ **删除用户资料**: 管理员删除用户资料，回收租金
- ✅ **查询用户资料**: 通过 user_id 获取链上用户数据
- ✅ **时间戳追踪**: 自动记录创建和更新时间

### 安全特性

- 🔒 **唯一性保证**: 每个 user_id 只能有一个用户资料（通过 PDA 实现）
- 🔒 **集中式管理**: 只有管理员可以创建、更新和删除所有用户资料
- 🔒 **数据验证**: 字段长度限制和非空检查
- 🔒 **时间戳验证**: 自动记录创建和更新时间，不可篡改

### 设计特点

- 👨‍💼 **集中式支付**: 一个管理员钱包负责所有支付，降低成本
- 🆔 **第三方集成**: 使用业务系统的 user_id 作为唯一标识
- 📝 **多用户支持**: 可为无限数量的第三方用户创建资料
- 🔑 **统一管理**: 后端服务可以统一管理所有用户资料

## 📦 数据结构

### UserProfile 结构

```rust
pub struct UserProfile {
    pub admin: Pubkey,         // 管理员钱包地址（系统统一的钱包）
    pub user_id: String,       // 第三方用户 ID（业务系统中的用户标识）
    pub username: String,      // 用户名（最多 32 字符）
    pub email: String,         // 邮箱（最多 64 字符）
    pub age: u8,               // 年龄（0-255）
    pub bio: String,           // 个人简介（最多 256 字符）
    pub created_at: i64,       // 创建时间（Unix 时间戳）
    pub updated_at: i64,       // 更新时间（Unix 时间戳）
    pub bump: u8,              // PDA bump seed
}
```

### 存储空间

- **总空间**: 458 字节
- **租金**: 约 0.0033 SOL（可回收）

| 字段 | 大小 | 说明 |
|------|------|------|
| discriminator | 8 字节 | Anchor 账户判别器 |
| admin | 32 字节 | Pubkey |
| user_id | 36 字节 | 4 (长度) + 32 (内容) |
| username | 36 字节 | 4 (长度) + 32 (内容) |
| email | 68 字节 | 4 (长度) + 64 (内容) |
| age | 1 字节 | u8 |
| bio | 260 字节 | 4 (长度) + 256 (内容) |
| created_at | 8 字节 | i64 |
| updated_at | 8 字节 | i64 |
| bump | 1 字节 | u8 |

## 🚀 指令列表

| 指令 | 参数 | 权限 | 说明 |
|-----|------|------|------|
| `create_profile` | `user_id, username, email, age, bio` | 仅管理员 | 为第三方用户创建资料 |
| `update_profile` | `username?, email?, age?, bio?` | 仅管理员 | 更新用户资料（可选字段）|
| `delete_profile` | - | 仅管理员 | 删除用户资料 |

**注意**:
- 所有指令只能由管理员执行
- `update_profile` 中的所有参数都是可选的（`Option<T>`），传 `null` 表示不更新该字段
- `user_id` 和 `admin` 在创建后不可变

## 💻 使用示例

### TypeScript 客户端

#### 创建用户资料

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UserProfile } from "../target/types/user_profile";
import { PublicKey } from "@solana/web3.js";

const program = anchor.workspace.UserProfile as Program<UserProfile>;
const admin = provider.wallet.publicKey; // 管理员钱包

// 第三方系统的用户 ID
const userId = "user_12345";

// 1. 计算用户资料 PDA
const [userProfilePda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user-profile"),
    admin.toBuffer(),
    Buffer.from(userId)
  ],
  program.programId
);

// 2. 创建用户资料（管理员签名并支付）
await program.methods
  .createProfile(
    userId,                      // 第三方用户 ID
    "alice_web3",                // 用户名
    "alice@solana.com",          // 邮箱
    25,                          // 年龄
    "Web3 developer"             // 个人简介
  )
  .accountsPartial({
    userProfile: userProfilePda,
    admin: admin,                // 管理员（签名者、支付者）
  })
  .rpc();
```

#### 查询用户资料

```typescript
const profile = await program.account.userProfile.fetch(userProfilePda);

console.log("用户 ID:", profile.userId);
console.log("管理员:", profile.admin.toBase58());
console.log("用户名:", profile.username);
console.log("邮箱:", profile.email);
console.log("年龄:", profile.age);
console.log("个人简介:", profile.bio);
console.log("创建时间:", new Date(profile.createdAt.toNumber() * 1000));
console.log("更新时间:", new Date(profile.updatedAt.toNumber() * 1000));
```

#### 更新用户资料（部分更新）

```typescript
// 只更新年龄和简介，其他字段保持不变
// 必须由管理员签名
await program.methods
  .updateProfile(
    null,                             // 用户名：不更新
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

#### 更新用户资料（全量更新）

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

#### 删除用户资料

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

#### 为多个用户创建资料

```typescript
// 为第一个用户创建资料
const userId1 = "user_001";
const [pda1] = PublicKey.findProgramAddressSync(
  [Buffer.from("user-profile"), admin.toBuffer(), Buffer.from(userId1)],
  program.programId
);
await program.methods
  .createProfile(userId1, "alice", "alice@example.com", 25, "User 1 bio")
  .accountsPartial({ userProfile: pda1, admin: admin })
  .rpc();

// 为第二个用户创建资料
const userId2 = "user_002";
const [pda2] = PublicKey.findProgramAddressSync(
  [Buffer.from("user-profile"), admin.toBuffer(), Buffer.from(userId2)],
  program.programId
);
await program.methods
  .createProfile(userId2, "bob", "bob@example.com", 30, "User 2 bio")
  .accountsPartial({ userProfile: pda2, admin: admin })
  .rpc();
```

## 🔧 PDA 地址计算

用户资料使用 PDA (Program Derived Address) 来确保唯一性：

```
seeds = [
    b"user-profile",    // 固定前缀
    admin.key(),        // 管理员钱包地址
    user_id.as_bytes()  // 第三方用户 ID
]
```

**特性**：
- 每个 user_id 只能有一个用户资料
- 所有用户资料由同一个管理员管理
- 地址是确定性的（可以从 admin + user_id 计算）
- 不需要单独的密钥对
- 程序拥有账户的签名权限

## 📊 使用场景

### 1. 第三方应用集成

```typescript
// 业务系统：数据库中有用户记录，user_id = "db_user_12345"
// 链上存储：将用户信息同步到 Solana 链上
await createProfile("db_user_12345", username, email, age, bio);

// 后续可以通过 user_id 快速查询链上数据
const [pda] = getPdaFromUserId("db_user_12345");
const profile = await fetchProfile(pda);
```

### 2. 中心化服务的链上扩展

```typescript
// 后端服务作为管理员，统一管理所有用户的链上资料
// 用户通过 API 请求创建/更新资料，后端代理执行链上操作

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

```typescript
// 游戏服务器作为管理员，为玩家创建链上资料
// 玩家 ID：游戏内的唯一 ID

// 玩家注册
await createProfile("player_12345", "DragonSlayer", "player@game.com", 0, "Level 1 Warrior");

// 玩家升级时更新资料
await updateProfile(null, null, null, "Level 50 Warrior - 1000 battles won");
```

### 4. SaaS 平台的用户管理

```typescript
// SaaS 平台管理员为企业客户创建用户资料
// user_id：企业内部的员工 ID

await createProfile("employee_001", "Alice", "alice@company.com", 25, "Marketing Manager");
await createProfile("employee_002", "Bob", "bob@company.com", 30, "Tech Lead");
```

## ⚠️ 数据验证

程序会自动验证以下内容：

| 验证项 | 限制 | 错误代码 |
|--------|---------|---------|
| 用户 ID 长度 | ≤ 32 字符 | `UserIdTooLong` (6005) |
| 用户名长度 | ≤ 32 字符 | `UsernameTooLong` (6000) |
| 邮箱长度 | ≤ 64 字符 | `EmailTooLong` (6001) |
| 简介长度 | ≤ 256 字符 | `BioTooLong` (6002) |
| 用户 ID 非空 | 必须有内容 | `UserIdEmpty` (6006) |
| 用户名非空 | 必须有内容 | `UsernameEmpty` (6003) |
| 邮箱非空 | 必须有内容 | `EmailEmpty` (6004) |

## 🐛 错误处理

### 常见错误

#### 1. 用户 ID 过长

```typescript
try {
  await program.methods
    .createProfile("a".repeat(33), ...) // 33 个字符
    .rpc();
} catch (error) {
  // Error: 用户 ID 太长（最多 32 字符）
}
```

#### 2. 重复创建（相同 user_id）

```typescript
try {
  await program.methods
    .createProfile("user_001", ...)
    .rpc();

  // 再次使用相同的 user_id 创建
  await program.methods
    .createProfile("user_001", ...)
    .rpc();
} catch (error) {
  // Error: Account already in use
}
```

#### 3. 非管理员操作

```typescript
// 只有管理员可以创建、更新和删除
// 其他钱包调用会因为签名验证失败而报错
```

## 📝 测试

### 运行测试

```bash
# 运行所有测试
anchor test

# 只运行 user-profile 测试
anchor test tests/user-profile.ts
```

### 测试覆盖

- ✅ 创建用户资料
- ✅ 查询用户资料
- ✅ 部分更新
- ✅ 全量更新
- ✅ 创建多个用户资料
- ✅ 删除用户资料
- ✅ 数据验证（长度限制）
- ✅ PDA 唯一性验证
- ✅ 时间戳验证
- ✅ 权限验证（仅管理员）

## 🔍 常见问题

### Q: 可以为同一个 user_id 创建多个资料吗？

不可以。每个 user_id 只能创建一个用户资料。这是通过 PDA 的 seeds 设计实现的。

### Q: 普通用户可以创建/更新自己的资料吗？

不可以。本程序采用集中式管理员模式，所有操作都必须由管理员执行。如果需要去中心化模式（每个用户管理自己的资料），需要修改 PDA seeds 设计。

### Q: 如何查询其他用户的资料？

```typescript
// 如果知道其他用户的 user_id
const userId = "user_12345";
const [userProfilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("user-profile"), admin.toBuffer(), Buffer.from(userId)],
  program.programId
);

const profile = await program.account.userProfile.fetch(userProfilePda);
```

### Q: 删除后可以重新创建吗？

可以。删除后账户被完全清除，可以使用相同的 user_id 重新创建。

### Q: 如何只更新部分字段？

使用 `null` 表示不更新：

```typescript
await updateProfile(
  null,         // 不更新用户名
  null,         // 不更新邮箱
  newAge,       // 更新年龄
  null          // 不更新简介
);
```

### Q: 管理员钱包如何管理？

管理员钱包需要妥善保管，建议：
- 使用硬件钱包存储私钥
- 后端服务器使用加密存储
- 实施多签机制（需要额外开发）
- 定期轮换密钥（需要迁移所有用户资料）

### Q: 与去中心化模式有什么区别？

| 特性 | 集中式（本程序） | 去中心化 |
|------|----------------|---------|
| 签名者 | 管理员 | 每个用户 |
| 支付者 | 管理员 | 每个用户 |
| PDA Seeds | [prefix, admin, user_id] | [prefix, user_wallet] |
| 适用场景 | 第三方系统集成、SaaS 平台 | Web3 原生应用 |
| 权限模型 | 集中式控制 | 用户自主控制 |
| 成本 | 集中支付，成本可控 | 分散支付，用户承担 |

## 🚧 未来扩展

- [ ] 添加管理员转移功能
- [ ] 添加多签管理员支持
- [ ] 支持批量操作（批量创建/更新/删除）
- [ ] 添加头像 URL 字段
- [ ] 支持社交媒体链接（Twitter、Discord 等）
- [ ] 添加标签系统（兴趣、技能等）
- [ ] 添加隐私设置（公开/私密字段）
- [ ] 添加验证徽章（邮箱验证、身份验证等）
- [ ] 支持分页查询（获取所有用户列表）

## 📚 相关资源

- [程序源代码](src/lib.rs)
- [TypeScript 客户端](../../client-ts/user-profile/index.ts)
- [客户端文档](../../client-ts/user-profile/README.md)
- [测试代码](../../tests/user-profile.ts)
- [Anchor 文档](https://www.anchor-lang.com/)
- [Solana PDA 指南](https://solanacookbook.com/core-concepts/pdas.html)

## 📄 许可证

ISC

---

**注意**: 这是一个教学项目，演示集中式管理员模式的用户资料管理。在生产环境使用前请：
- 进行完整的安全审计
- 评估是否适合您的业务场景
- 考虑是否需要去中心化模式
- 实施适当的密钥管理策略
