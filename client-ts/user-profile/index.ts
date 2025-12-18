// ============================================================================
// User Profile 客户端示例 - 集中式管理员模式
// ============================================================================
//
// 这个示例演示了第三方系统用户资料管理程序的完整功能：
// 1. 创建用户资料（管理员为第三方系统用户创建）
// 2. 查询用户资料
// 3. 更新用户资料（部分字段）
// 4. 删除用户资料
//
// 关键特性：
// - 集中式管理：一个管理员钱包负责所有支付
// - 第三方用户 ID：使用业务系统的用户 ID（user_id）
// - PDA 设计：[b"user-profile", admin.key(), user_id]
//
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UserProfile } from "../../target/types/user_profile";
import { PublicKey } from "@solana/web3.js";
import { createProvider } from "../shared/utils";

async function main() {
  console.log("👤 User Profile 客户端示例（集中式管理员模式）");
  console.log("================================================\n");

  // ============================================================================
  // 步骤 1: 初始化 Provider 和程序
  // ============================================================================

  // 创建 Provider（包含连接、钱包等配置）
  const provider = createProvider();
  // 设置全局 Provider
  anchor.setProvider(provider);

  // 加载已部署的 user-profile 程序
  // anchor.workspace 会自动从 Anchor.toml 读取程序配置
  const program = anchor.workspace.userProfile as Program<UserProfile>;

  // 管理员钱包（系统统一的钱包，负责所有支付）
  const admin = provider.wallet.publicKey;

  // 打印连接信息
  console.log("📡 RPC 端点:", provider.connection.rpcEndpoint);
  console.log("👨‍💼 管理员钱包:", admin.toBase58());
  console.log("📦 程序 ID:", program.programId.toBase58());
  console.log();

  // ============================================================================
  // 步骤 2: 计算用户资料 PDA 地址
  // ============================================================================

  // 第三方系统的用户 ID（业务系统中的用户标识）
  // 例如：数据库中的用户 ID、OAuth 用户 ID 等
  const userId = "user_12345";

  // PDA (Program Derived Address) 是由程序派生的地址
  // Seeds: [b"user-profile", admin.key(), user_id]
  //
  // 设计说明：
  // - b"user-profile": 固定前缀，标识这是用户资料账户
  // - admin.key(): 管理员钱包地址（系统统一的钱包）
  // - user_id: 第三方系统的用户 ID（每个用户唯一）
  //
  // 这样设计的好处：
  // 1. 所有用户资料由同一个管理员钱包管理
  // 2. 可以通过 user_id 快速定位用户资料
  // 3. 支持为任意第三方用户创建资料
  const [userProfilePda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user-profile"),  // 固定前缀
      admin.toBuffer(),              // 管理员钱包地址
      Buffer.from(userId)            // 第三方用户 ID
    ],
    program.programId
  );

  console.log("📋 用户资料配置:");
  console.log(`  用户 ID: ${userId}`);
  console.log(`  PDA: ${userProfilePda.toBase58()}`);
  console.log(`  Bump: ${bump}`);
  console.log();

  try {
    // ========================================================================
    // 步骤 3: 创建用户资料
    // ========================================================================
    console.log("=== 1️⃣ 创建用户资料 ===");

    // 用户信息（从第三方系统获取）
    const username = "alice_web3";
    const email = "alice@solana.com";
    const age = 25;
    const bio = "Web3 developer passionate about blockchain technology. Building the future of decentralized applications.";

    // 调用 create_profile 指令
    // 注意：管理员钱包签名并支付租金
    const createTx = await program.methods
      .createProfile(
        userId,     // 第三方用户 ID（必须）
        username,   // 用户名
        email,      // 邮箱
        age,        // 年龄
        bio         // 个人简介
      )
      .accountsPartial({
        userProfile: userProfilePda,  // 用户资料 PDA
        admin: admin,                 // 管理员（签名者、支付者）
        // systemProgram 会自动添加
      })
      .rpc();

    console.log("✅ 用户资料创建成功");
    console.log(`  交易: ${createTx}`);
    console.log(`  用户 ID: ${userId}`);
    console.log(`  管理员: ${admin.toBase58()}`);
    console.log();

    // ========================================================================
    // 步骤 4: 查询用户资料
    // ========================================================================
    console.log("=== 2️⃣ 查询用户资料 ===");

    // 从链上获取用户资料数据
    let profile = await program.account.userProfile.fetch(userProfilePda);

    console.log("📊 用户资料信息:");
    console.log(`  ├─ 用户 ID: ${profile.userId}`);
    console.log(`  ├─ 管理员: ${profile.admin.toBase58()}`);
    console.log(`  ├─ 用户名: ${profile.username}`);
    console.log(`  ├─ 邮箱: ${profile.email}`);
    console.log(`  ├─ 年龄: ${profile.age}`);
    console.log(`  ├─ 个人简介: ${profile.bio}`);
    console.log(`  ├─ 创建时间: ${new Date(profile.createdAt.toNumber() * 1000).toLocaleString()}`);
    console.log(`  └─ 更新时间: ${new Date(profile.updatedAt.toNumber() * 1000).toLocaleString()}`);
    console.log();

    // ========================================================================
    // 步骤 5: 更新用户资料（只更新部分字段）
    // ========================================================================
    console.log("=== 3️⃣ 更新用户资料（部分更新） ===");

    // 等待 2 秒，确保时间戳不同
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 只更新年龄和个人简介，其他字段保持不变
    // 注意：必须由管理员钱包签名
    const updateTx = await program.methods
      .updateProfile(
        null,                    // username: 不更新（传 null）
        null,                    // email: 不更新
        26,                      // age: 更新为 26
        "Updated bio: Senior Web3 developer with 3+ years experience in Solana ecosystem."  // bio: 更新
      )
      .accountsPartial({
        userProfile: userProfilePda,  // 用户资料 PDA
        admin: admin,                 // 管理员（签名者）
      })
      .rpc();

    console.log("✅ 用户资料更新成功");
    console.log(`  交易: ${updateTx}`);
    console.log(`  更新字段: age, bio`);
    console.log();

    // ========================================================================
    // 步骤 6: 查询更新后的资料
    // ========================================================================
    console.log("=== 4️⃣ 查询更新后的资料 ===");

    profile = await program.account.userProfile.fetch(userProfilePda);

    console.log("📊 更新后的用户资料:");
    console.log(`  ├─ 用户 ID: ${profile.userId} (不可变)`);
    console.log(`  ├─ 管理员: ${profile.admin.toBase58()} (不可变)`);
    console.log(`  ├─ 用户名: ${profile.username} (未更新)`);
    console.log(`  ├─ 邮箱: ${profile.email} (未更新)`);
    console.log(`  ├─ 年龄: ${profile.age} ⬆️ 已更新`);
    console.log(`  ├─ 个人简介: ${profile.bio} ⬆️ 已更新`);
    console.log(`  ├─ 创建时间: ${new Date(profile.createdAt.toNumber() * 1000).toLocaleString()}`);
    console.log(`  └─ 更新时间: ${new Date(profile.updatedAt.toNumber() * 1000).toLocaleString()} ⬆️`);
    console.log();

    // ========================================================================
    // 步骤 7: 全量更新示例
    // ========================================================================
    console.log("=== 5️⃣ 全量更新示例 ===");

    await new Promise(resolve => setTimeout(resolve, 2000));

    const fullUpdateTx = await program.methods
      .updateProfile(
        "alice_solana",                      // 更新用户名
        "alice.solana@example.com",         // 更新邮箱
        27,                                  // 更新年龄
        "Full-stack Web3 developer. Rust & TypeScript expert."  // 更新简介
      )
      .accountsPartial({
        userProfile: userProfilePda,
        admin: admin,
      })
      .rpc();

    console.log("✅ 全量更新成功");
    console.log(`  交易: ${fullUpdateTx}`);
    console.log(`  更新字段: username, email, age, bio`);
    console.log();

    // 查询最终状态
    profile = await program.account.userProfile.fetch(userProfilePda);
    console.log("📊 最终用户资料:");
    console.log(`  ├─ 用户 ID: ${profile.userId}`);
    console.log(`  ├─ 管理员: ${profile.admin.toBase58()}`);
    console.log(`  ├─ 用户名: ${profile.username}`);
    console.log(`  ├─ 邮箱: ${profile.email}`);
    console.log(`  ├─ 年龄: ${profile.age}`);
    console.log(`  ├─ 个人简介: ${profile.bio}`);
    console.log(`  └─ 更新时间: ${new Date(profile.updatedAt.toNumber() * 1000).toLocaleString()}`);
    console.log();

    // ========================================================================
    // 步骤 8: 创建第二个用户资料
    // ========================================================================
    console.log("=== 6️⃣ 创建第二个用户资料 ===");

    // 另一个第三方用户的 ID
    const userId2 = "user_67890";

    // 计算第二个用户的 PDA
    const [userProfilePda2] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-profile"),
        admin.toBuffer(),
        Buffer.from(userId2)
      ],
      program.programId
    );

    // 创建第二个用户资料
    const createTx2 = await program.methods
      .createProfile(
        userId2,
        "bob_defi",
        "bob@defi.com",
        30,
        "DeFi enthusiast and liquidity provider."
      )
      .accountsPartial({
        userProfile: userProfilePda2,
        admin: admin,
      })
      .rpc();

    console.log("✅ 第二个用户资料创建成功");
    console.log(`  交易: ${createTx2}`);
    console.log(`  用户 ID: ${userId2}`);
    console.log(`  PDA: ${userProfilePda2.toBase58()}`);
    console.log();

    // 查询第二个用户资料
    const profile2 = await program.account.userProfile.fetch(userProfilePda2);
    console.log("📊 第二个用户资料:");
    console.log(`  ├─ 用户 ID: ${profile2.userId}`);
    console.log(`  ├─ 用户名: ${profile2.username}`);
    console.log(`  └─ 管理员: ${profile2.admin.toBase58()}`);
    console.log();

    // ========================================================================
    // 步骤 9: 删除用户资料
    // ========================================================================
    console.log("=== 7️⃣ 删除用户资料 ===");

    // 删除第一个用户资料
    const deleteTx = await program.methods
      .deleteProfile()
      .accountsPartial({
        userProfile: userProfilePda,
        admin: admin,
      })
      .rpc();

    console.log("✅ 用户资料已删除");
    console.log(`  交易: ${deleteTx}`);
    console.log(`  用户 ID: ${userId}`);
    console.log(`  剩余 SOL 已退还给管理员`);
    console.log();

    // 删除第二个用户资料
    const deleteTx2 = await program.methods
      .deleteProfile()
      .accountsPartial({
        userProfile: userProfilePda2,
        admin: admin,
      })
      .rpc();

    console.log("✅ 第二个用户资料已删除");
    console.log(`  交易: ${deleteTx2}`);
    console.log(`  用户 ID: ${userId2}`);
    console.log();

    // ========================================================================
    // 步骤 10: 验证资料已删除
    // ========================================================================
    console.log("=== 8️⃣ 验证删除 ===");

    try {
      await program.account.userProfile.fetch(userProfilePda);
      console.log("⚠️  资料 1 仍然存在");
    } catch (error) {
      console.log("✅ 资料 1 账户已成功删除");
    }

    try {
      await program.account.userProfile.fetch(userProfilePda2);
      console.log("⚠️  资料 2 仍然存在");
    } catch (error) {
      console.log("✅ 资料 2 账户已成功删除");
    }

    console.log("\n✅ 所有操作完成！");

  } catch (error: any) {
    // ========================================================================
    // 错误处理
    // ========================================================================
    console.error("\n❌ 发生错误:");
    console.error("错误信息:", error.message || error);

    // 如果有程序日志，显示详细信息
    if (error.logs) {
      console.error("\n📋 程序日志:");
      error.logs.forEach((log: string) => console.error("  ", log));
    }

    // 重新抛出错误，让程序退出
    throw error;
  }
}

// ============================================================================
// 程序入口
// ============================================================================

// 运行主函数
main()
  .then(() => {
    // 成功完成所有操作
    console.log("\n🎉 程序正常退出");
    process.exit(0);  // 退出码 0 表示成功
  })
  .catch((error) => {
    // 发生错误
    console.error("\n💥 程序异常退出");
    console.error(error);
    process.exit(1);  // 退出码 1 表示失败
  });

// ============================================================================
// 使用说明
// ============================================================================
//
// ## 前置要求
// 1. 安装依赖：npm install
// 2. 配置 Solana CLI：solana config set --url localhost
// 3. 确保有足够的 SOL：solana airdrop 2
//
// ## 运行步骤
// 1. 启动本地验证器（新终端）：
//    solana-test-validator
//
// 2. 构建并部署程序：
//    anchor build
//    anchor deploy
//
// 3. 运行客户端示例：
//    npx ts-node client-ts/user-profile/index.ts
//
// ## 功能演示
// ✅ 创建用户资料（管理员为第三方用户创建）
// ✅ 查询用户资料（获取链上数据）
// ✅ 部分更新（只更新特定字段）
// ✅ 全量更新（更新所有字段）
// ✅ 创建多个用户资料（演示集中式管理）
// ✅ 删除用户资料（回收租金）
// ✅ 验证删除（确认账户已关闭）
//
// ## 关键特性（集中式管理员模式）
// - 👨‍💼 集中式管理：一个管理员钱包负责所有用户资料的创建、更新、删除
// - 🆔 第三方用户 ID：使用业务系统的 user_id 作为唯一标识
// - 📝 多用户支持：可以为任意数量的第三方用户创建资料
// - 🔒 权限控制：只有管理员可以操作所有用户资料
// - ⏰ 自动时间戳：记录创建时间和更新时间
// - 🔄 部分更新：支持可选字段更新（Option<T>）
// - ✅ 数据验证：完整的长度和非空检查
//
// ## 架构说明
//
// ### PDA 设计
// Seeds: [b"user-profile", admin.key(), user_id]
//
// - admin.key(): 系统管理员钱包（固定）
// - user_id: 第三方系统用户 ID（唯一）
//
// ### 适用场景
// - 第三方应用集成：将用户数据存储在链上
// - 中心化服务：由后端服务统一管理用户资料
// - 批量操作：管理员可以批量创建/更新用户资料
// - 成本控制：所有租金由单一管理员账户支付
//
// ### 与去中心化模式的区别
//
// | 特性 | 集中式（本程序） | 去中心化 |
// |------|-----------------|---------|
// | 签名者 | 管理员 | 每个用户 |
// | 支付者 | 管理员 | 每个用户 |
// | PDA Seeds | [prefix, admin, user_id] | [prefix, user_wallet] |
// | 适用场景 | 第三方系统集成 | Web3 原生应用 |
// | 权限模型 | 集中式 | 去中心化 |
//
// ============================================================================
