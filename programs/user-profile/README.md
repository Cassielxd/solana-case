# User Profile - 用户资料管理程序

一个用于存储第三方系统用户信息的 Solana 智能合约，支持创建、更新和删除用户资料。

## 🎯 功能特性

### 核心功能

- ✅ **创建用户资料**: 存储用户名、邮箱、年龄、个人简介
- ✅ **更新用户资料**: 支持部分更新或全量更新
- ✅ **删除用户资料**: 关闭账户并回收租金
- ✅ **查询用户资料**: 获取链上用户数据
- ✅ **时间戳追踪**: 自动记录创建和更新时间

### 安全特性

- 🔒 **唯一性保证**: 每个钱包地址只能有一个用户资料（通过 PDA 实现）
- 🔒 **权限控制**: 只有所有者可以更新和删除自己的资料
- 🔒 **数据验证**: 字段长度限制和非空检查
- 🔒 **时间戳验证**: 自动记录创建和更新时间，不可篡改

## 📦 数据结构

### UserProfile 结构

```rust
pub struct UserProfile {
    pub authority: Pubkey,     // 所有者钱包地址
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

- **总空间**: 422 字节
- **租金**: 约 0.003 SOL（可回收）

| 字段 | 大小 | 说明 |
|------|------|------|
| discriminator | 8 字节 | Anchor 账户判别器 |
| authority | 32 字节 | Pubkey |
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
| `create_profile` | `username, email, age, bio` | 任何人 | 创建新用户资料 |
| `update_profile` | `username?, email?, age?, bio?` | 仅所有者 | 更新用户资料（可选字段）|
| `delete_profile` | - | 仅所有者 | 删除用户资料 |

**注意**: `update_profile` 中的所有参数都是可选的（`Option<T>`），传 `null` 表示不更新该字段。

## 💻 使用示例

### TypeScript 客户端

#### 创建用户资料

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UserProfile } from "../target/types/user_profile";
import { PublicKey } from "@solana/web3.js";

const program = anchor.workspace.UserProfile as Program<UserProfile>;
const authority = provider.wallet.publicKey;

// 1. 计算用户资料 PDA
const [userProfilePda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user-profile"),
    authority.toBuffer()
  ],
  program.programId
);

// 2. 创建用户资料
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

#### 查询用户资料

```typescript
const profile = await program.account.userProfile.fetch(userProfilePda);

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
await program.methods
  .updateProfile(
    null,                             // 用户名：不更新
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
    authority: authority,
  })
  .rpc();
```

#### 删除用户资料

```typescript
await program.methods
  .deleteProfile()
  .accountsPartial({
    userProfile: userProfilePda,
    authority: authority,
  })
  .rpc();
```

## 🔧 PDA 地址计算

用户资料使用 PDA (Program Derived Address) 来确保唯一性：

```
seeds = [
    b"user-profile",    // 固定前缀
    authority           // 用户钱包地址
]
```

**特性**：
- 每个钱包地址只能有一个用户资料
- 地址是确定性的（可以从钱包地址计算）
- 不需要单独的密钥对
- 程序拥有账户的签名权限

## 📊 使用场景

### 1. Web3 社交应用

```typescript
// 用户注册
await createProfile("alice", "alice@web3.social", 25, "NFT collector");

// 更新个人信息
await updateProfile(null, null, 26, "NFT collector & DeFi enthusiast");
```

### 2. 链上游戏

```typescript
// 创建玩家资料
await createProfile("player123", "player@game.com", 18, "Level 1 Warrior");

// 升级后更新
await updateProfile(null, null, 18, "Level 50 Warrior - 1000 battles won");
```

### 3. 去中心化论坛

```typescript
// 新用户注册
await createProfile("crypto_expert", "expert@forum.com", 30, "Blockchain researcher");

// 更新签名
await updateProfile(null, null, null, "Blockchain researcher | Solana validator");
```

## ⚠️ 数据验证

程序会自动验证以下内容：

| 验证项 | 限制 | 错误代码 |
|--------|------|---------|
| 用户名长度 | ≤ 32 字符 | `UsernameTooLong` (6000) |
| 邮箱长度 | ≤ 64 字符 | `EmailTooLong` (6001) |
| 简介长度 | ≤ 256 字符 | `BioTooLong` (6002) |
| 用户名非空 | 必须有内容 | `UsernameEmpty` (6003) |
| 邮箱非空 | 必须有内容 | `EmailEmpty` (6004) |

## 🐛 错误处理

### 常见错误

#### 1. 用户名过长

```typescript
try {
  await program.methods
    .createProfile("a".repeat(33), ...) // 33 个字符
    .rpc();
} catch (error) {
  // Error: 用户名太长（最多 32 字符）
}
```

#### 2. 重复创建

```typescript
try {
  await program.methods
    .createProfile(...)
    .rpc();

  // 再次创建
  await program.methods
    .createProfile(...)
    .rpc();
} catch (error) {
  // Error: Account already in use
}
```

#### 3. 非所有者更新

```typescript
// 只有所有者可以更新和删除
// 其他人调用会失败
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
- ✅ 删除用户资料
- ✅ 数据验证（长度限制）
- ✅ 权限验证

## 🔍 常见问题

### Q: 可以创建多个用户资料吗？

不可以。每个钱包地址只能创建一个用户资料。这是通过 PDA 的 seeds 设计实现的。

### Q: 如何查询其他用户的资料？

```typescript
// 如果知道其他用户的钱包地址
const otherUser = new PublicKey("...");
const [otherProfilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("user-profile"), otherUser.toBuffer()],
  program.programId
);

const profile = await program.account.userProfile.fetch(otherProfilePda);
```

### Q: 删除后可以重新创建吗？

可以。删除后账户被完全清除，可以使用相同的 PDA 重新创建。

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

## 🚧 未来扩展

- [ ] 添加头像 URL 字段
- [ ] 支持社交媒体链接（Twitter、Discord 等）
- [ ] 添加标签系统（兴趣、技能等）
- [ ] 添加隐私设置（公开/私密字段）
- [ ] 支持用户关注/粉丝系统
- [ ] 添加验证徽章（邮箱验证、身份验证等）

## 📚 相关资源

- [程序源代码](src/lib.rs)
- [TypeScript 客户端](../../client-ts/user-profile/index.ts)
- [测试代码](../../tests/user-profile.ts)
- [Anchor 文档](https://www.anchor-lang.com/)
- [Solana PDA 指南](https://solanacookbook.com/core-concepts/pdas.html)

## 📄 许可证

ISC

---

**注意**: 这是一个教学项目，在生产环境使用前请进行完整的安全审计。
