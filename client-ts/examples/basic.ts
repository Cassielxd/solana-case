// ============================================================================
// 基础示例 - 最简单的客户端使用方式
// ============================================================================
//
// 这个示例展示 Anchor TypeScript SDK 的基本用法：
// - 初始化计数器
// - 增加计数器
// - 查询状态
//
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProject } from "../../target/types/my_project";
import { Keypair } from "@solana/web3.js";
import { createProvider } from "../utils";

async function main() {
  console.log("📝 基础示例 - Anchor TypeScript 客户端");
  console.log("========================================\n");

  // 1. 创建 Provider
  const provider = createProvider();
  anchor.setProvider(provider);

  // 2. 加载程序
  const program = anchor.workspace.myProject as Program<MyProject>;

  console.log("连接信息:");
  console.log(`  RPC: ${provider.connection.rpcEndpoint}`);
  console.log(`  钱包: ${provider.wallet.publicKey.toBase58()}`);
  console.log(`  程序 ID: ${program.programId.toBase58()}\n`);

  // 3. 生成新的计数器账户
  const counter = Keypair.generate();
  console.log(`计数器地址: ${counter.publicKey.toBase58()}\n`);

  try {
    // 4. 初始化计数器
    console.log("步骤 1: 初始化计数器");
    const initTx = await program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([counter])
      .rpc();
    console.log(`  ✅ 交易: ${initTx}\n`);

    // 5. 查询状态
    console.log("步骤 2: 查询初始状态");
    let account = await program.account.counter.fetch(counter.publicKey);
    console.log(`  计数值: ${account.count.toString()}`);
    console.log(`  权限: ${account.authority.toBase58()}\n`);

    // 6. 增加计数器
    console.log("步骤 3: 增加计数器");
    const incTx = await program.methods
      .increment()
      .accounts({
        counter: counter.publicKey,
      })
      .rpc();
    console.log(`  ✅ 交易: ${incTx}\n`);

    // 7. 查询更新后的状态
    console.log("步骤 4: 查询更新后的状态");
    account = await program.account.counter.fetch(counter.publicKey);
    console.log(`  计数值: ${account.count.toString()}\n`);

    console.log("✅ 完成！");

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
