// ============================================================================
// User Profile 客户端示例
// ============================================================================
//
// 这个示例演示了用户资料管理程序的完整功能：
// 1. 创建用户资料
// 2. 查询用户资料
// 3. 更新用户资料（部分字段）
// 4. 删除用户资料
//
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UserProfile } from "../../target/types/user_profile";
import { PublicKey } from "@solana/web3.js";
import { createProvider } from "../shared/utils";

async function main() {
  console.log("👤 User Profile 客户端示例");
  console.log("================================\n");

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

  // 打印连接信息
  console.log("📡 RPC 端点:", provider.connection.rpcEndpoint);
  console.log("👛 钱包地址:", provider.wallet.publicKey.toBase58());
  console.log("📦 程序 ID:", program.programId.toBase58());
  console.log();

  // ============================================================================
  // 步骤 2: 计算用户资料 PDA 地址
  // ============================================================================

  // PDA (Program Derived Address) 是由程序派生的地址
  // Seeds: ["user-profile", authority]
  // 确保每个钱包地址只能有一个用户资料
  const authority = provider.wallet.publicKey;
  const [userProfilePda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user-profile"),  // 固定前缀
      authority.toBuffer()           // 用户钱包地址
    ],
    program.programId
  );

  console.log("📋 用户资料配置:");
  console.log(`  PDA: ${userProfilePda.toBase58()}`);
  console.log(`  Bump: ${bump}`);
  console.log();

  try {
    // ========================================================================
    // 步骤 3: 创建用户资料
    // ========================================================================
    console.log("=== 1️⃣ 创建用户资料 ===");

    // 用户信息
    const username = "alice_web3";
    const email = "alice@solana.com";
    const age = 25;
    const bio = "Web3 developer passionate about blockchain technology. Building the future of decentralized applications.";

    // 调用 create_profile 指令
    const createTx = await program.methods
      .createProfile(
        username,  // 用户名
        email,     // 邮箱
        age,       // 年龄
        bio        // 个人简介
      )
      .accountsPartial({
        userProfile: userProfilePda,  // 用户资料 PDA
        authority: authority,         // 所有者（签名者）
        // systemProgram 会自动添加
      })
      .rpc();

    console.log("✅ 用户资料创建成功");
    console.log(`  交易: ${createTx}`);
    console.log();

    // ========================================================================
    // 步骤 4: 查询用户资料
    // ========================================================================
    console.log("=== 2️⃣ 查询用户资料 ===");

    // 从链上获取用户资料数据
    let profile = await program.account.userProfile.fetch(userProfilePda);

    console.log("📊 用户资料信息:");
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
    console.log("=== 3️⃣ 更新用户资料 ===");

    // 等待 2 秒，确保时间戳不同
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 只更新年龄和个人简介，其他字段保持不变
    const updateTx = await program.methods
      .updateProfile(
        null,                    // username: 不更新（传 null）
        null,                    // email: 不更新
        26,                      // age: 更新为 26
        "Updated bio: Senior Web3 developer with 3+ years experience in Solana ecosystem."  // bio: 更新
      )
      .accountsPartial({
        userProfile: userProfilePda,
        authority: authority,
      })
      .rpc();

    console.log("✅ 用户资料更新成功");
    console.log(`  交易: ${updateTx}`);
    console.log();

    // ========================================================================
    // 步骤 6: 查询更新后的资料
    // ========================================================================
    console.log("=== 4️⃣ 查询更新后的资料 ===");

    profile = await program.account.userProfile.fetch(userProfilePda);

    console.log("📊 更新后的用户资料:");
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
        authority: authority,
      })
      .rpc();

    console.log("✅ 全量更新成功");
    console.log(`  交易: ${fullUpdateTx}`);
    console.log();

    // 查询最终状态
    profile = await program.account.userProfile.fetch(userProfilePda);
    console.log("📊 最终用户资料:");
    console.log(`  ├─ 用户名: ${profile.username}`);
    console.log(`  ├─ 邮箱: ${profile.email}`);
    console.log(`  ├─ 年龄: ${profile.age}`);
    console.log(`  ├─ 个人简介: ${profile.bio}`);
    console.log(`  └─ 更新时间: ${new Date(profile.updatedAt.toNumber() * 1000).toLocaleString()}`);
    console.log();

    // ========================================================================
    // 步骤 8: 删除用户资料
    // ========================================================================
    console.log("=== 6️⃣ 删除用户资料 ===");

    const deleteTx = await program.methods
      .deleteProfile()
      .accountsPartial({
        userProfile: userProfilePda,
        authority: authority,
      })
      .rpc();

    console.log("✅ 用户资料已删除");
    console.log(`  交易: ${deleteTx}`);
    console.log(`  剩余 SOL 已退还给所有者`);
    console.log();

    // ========================================================================
    // 步骤 9: 验证资料已删除
    // ========================================================================
    console.log("=== 7️⃣ 验证删除 ===");

    try {
      await program.account.userProfile.fetch(userProfilePda);
      console.log("⚠️  资料仍然存在");
    } catch (error) {
      console.log("✅ 资料账户已成功删除");
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
// ✅ 创建用户资料（用户名、邮箱、年龄、个人简介）
// ✅ 查询用户资料（获取链上数据）
// ✅ 部分更新（只更新特定字段）
// ✅ 全量更新（更新所有字段）
// ✅ 删除用户资料（回收租金）
// ✅ 验证删除（确认账户已关闭）
//
// ## 关键特性
// - 📝 每个钱包地址只能有一个用户资料（通过 PDA 实现）
// - 🔒 只有所有者可以更新和删除自己的资料
// - ⏰ 自动记录创建时间和更新时间
// - 🔄 支持部分更新（可选字段）
// - ✅ 完整的数据验证（长度、非空检查）
//
// ============================================================================
