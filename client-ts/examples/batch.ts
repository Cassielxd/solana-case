// ============================================================================
// 批量操作示例 - 演示如何批量执行交易
// ============================================================================
//
// 这个示例展示：
// - 串行执行多个交易
// - 批量查询账户
// - 性能测试
//
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProject } from "../../target/types/my_project";
import { Keypair } from "@solana/web3.js";
import { createProvider } from "../utils";

async function main() {
  console.log("🔄 批量操作示例");
  console.log("========================================\n");

  // 设置
  const provider = createProvider();
  anchor.setProvider(provider);
  const program = anchor.workspace.myProject as Program<MyProject>;

  // 创建计数器
  const counter = Keypair.generate();
  console.log(`计数器地址: ${counter.publicKey.toBase58()}\n`);

  try {
    // 初始化
    console.log("📦 初始化计数器...");
    await program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([counter])
      .rpc();
    console.log("✅ 初始化完成\n");

    // 批量增加（串行执行）
    const batchSize = 5;
    console.log(`🚀 批量增加计数器 ${batchSize} 次（串行）`);
    const startTime = Date.now();

    for (let i = 0; i < batchSize; i++) {
      const tx = await program.methods
        .increment()
        .accounts({
          counter: counter.publicKey,
        })
        .rpc();

      console.log(`  ${i + 1}/${batchSize} - 交易: ${tx.slice(0, 8)}...`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  总耗时: ${duration}ms`);
    console.log(`⏱️  平均耗时: ${(duration / batchSize).toFixed(2)}ms/交易\n`);

    // 查询最终状态
    console.log("📊 查询最终状态");
    const account = await program.account.counter.fetch(counter.publicKey);
    console.log(`  计数值: ${account.count.toString()}`);
    console.log(`  预期值: ${batchSize}`);
    console.log(`  ${account.count.toString() === batchSize.toString() ? "✅" : "❌"} 验证${account.count.toString() === batchSize.toString() ? "通过" : "失败"}\n`);

    // 批量减少
    console.log(`🔄 批量减少计数器 ${batchSize} 次`);
    for (let i = 0; i < batchSize; i++) {
      await program.methods
        .decrement()
        .accounts({
          counter: counter.publicKey,
        })
        .rpc();

      // 不打印详细信息，仅显示进度
      process.stdout.write(`\r  进度: ${i + 1}/${batchSize}`);
    }
    console.log();

    // 验证最终计数为 0
    const finalAccount = await program.account.counter.fetch(counter.publicKey);
    console.log(`\n📊 最终计数值: ${finalAccount.count.toString()}`);
    console.log(`  ${finalAccount.count.toString() === "0" ? "✅" : "❌"} 验证${finalAccount.count.toString() === "0" ? "通过" : "失败"}\n`);

    console.log("✅ 批量操作完成！");

  } catch (error: any) {
    console.error("❌ 错误:", error.message || error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
