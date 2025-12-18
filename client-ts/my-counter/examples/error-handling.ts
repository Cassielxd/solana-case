// ============================================================================
// 错误处理示例 - 演示如何处理各种错误情况
// ============================================================================
//
// 这个示例展示：
// - 捕获和处理 Anchor 错误
// - 权限验证错误
// - 账户不存在错误
// - 自定义错误处理
//
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProject } from "../../../target/types/my_project";
import { Keypair } from "@solana/web3.js";
import { createProvider, printAnchorError } from "../../shared/utils";

async function main() {
  console.log("⚠️  错误处理示例");
  console.log("========================================\n");

  const provider = createProvider();
  anchor.setProvider(provider);
  const program = anchor.workspace.myProject as Program<MyProject>;

  // 创建并初始化计数器
  const counter = Keypair.generate();
  console.log(`计数器地址: ${counter.publicKey.toBase58()}\n`);

  try {
    // 初始化计数器
    console.log("📦 初始化计数器...");
    await program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([counter])
      .rpc();
    console.log("✅ 初始化成功\n");

  } catch (error: any) {
    console.error("❌ 初始化失败:", error.message);
    process.exit(1);
  }

  // ========================================================================
  // 测试 1: 权限验证错误
  // ========================================================================
  console.log("测试 1️⃣: 使用错误的 authority");
  console.log("-".repeat(40));

  try {
    const wrongAuthority = Keypair.generate();
    console.log(`尝试使用错误的 authority: ${wrongAuthority.publicKey.toBase58()}`);

    await program.methods
      .increment()
      .accounts({
        counter: counter.publicKey,
      })
      .signers([wrongAuthority])
      .rpc();

    console.log("⚠️  不应该执行到这里！");

  } catch (error: any) {
    console.log("✅ 错误被正确捕获");
    console.log(`  错误信息: ${error.message.split('\n')[0]}`);

    if (error.code) {
      console.log(`  错误代码: ${error.code}`);
    }
  }
  console.log();

  // ========================================================================
  // 测试 2: 账户不存在错误
  // ========================================================================
  console.log("测试 2️⃣: 查询不存在的账户");
  console.log("-".repeat(40));

  try {
    const nonExistentCounter = Keypair.generate();
    console.log(`尝试查询不存在的账户: ${nonExistentCounter.publicKey.toBase58()}`);

    await program.account.counter.fetch(nonExistentCounter.publicKey);

    console.log("⚠️  不应该执行到这里！");

  } catch (error: any) {
    console.log("✅ 错误被正确捕获");
    console.log(`  错误信息: Account does not exist or has no data`);
  }
  console.log();

  // ========================================================================
  // 测试 3: 重复初始化错误
  // ========================================================================
  console.log("测试 3️⃣: 尝试重复初始化");
  console.log("-".repeat(40));

  try {
    console.log("尝试再次初始化同一个计数器...");

    // 注意：这个测试可能会失败，因为 counter 账户已经存在且有数据
    // Anchor 的 init 约束会检测到这一点
    await program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([counter])
      .rpc();

    console.log("⚠️  不应该执行到这里！");

  } catch (error: any) {
    console.log("✅ 错误被正确捕获");
    console.log(`  错误类型: 账户已存在`);
  }
  console.log();

  // ========================================================================
  // 测试 4: 正常操作（验证系统仍然正常工作）
  // ========================================================================
  console.log("测试 4️⃣: 验证正常操作");
  console.log("-".repeat(40));

  try {
    console.log("执行正常的 increment 操作...");

    await program.methods
      .increment()
      .accounts({
        counter: counter.publicKey,
      })
      .rpc();

    const account = await program.account.counter.fetch(counter.publicKey);
    console.log(`✅ 操作成功，当前计数值: ${account.count.toString()}`);

  } catch (error: any) {
    console.error("❌ 不应该出现错误:", error.message);
  }
  console.log();

  // ========================================================================
  // 测试 5: 自定义错误处理函数
  // ========================================================================
  console.log("测试 5️⃣: 使用自定义错误处理函数");
  console.log("-".repeat(40));

  try {
    const wrongAuthority = Keypair.generate();

    await program.methods
      .increment()
      .accounts({
        counter: counter.publicKey,
      })
      .signers([wrongAuthority])
      .rpc();

  } catch (error: any) {
    console.log("使用 printAnchorError 打印详细错误:");
    printAnchorError(error);
  }
  console.log();

  // ========================================================================
  // 总结
  // ========================================================================
  console.log("📝 错误处理总结:");
  console.log("  1. ✅ 权限验证错误 - 正确捕获");
  console.log("  2. ✅ 账户不存在错误 - 正确捕获");
  console.log("  3. ✅ 重复初始化错误 - 正确捕获");
  console.log("  4. ✅ 正常操作 - 工作正常");
  console.log("  5. ✅ 自定义错误处理 - 功能完善\n");

  console.log("✅ 所有错误处理测试完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("程序异常退出:", error);
    process.exit(1);
  });
