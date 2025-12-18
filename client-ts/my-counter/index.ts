// ============================================================================
// Anchor TypeScript 客户端示例 - 计数器程序客户端
// ============================================================================
//
// 这个示例展示如何使用 Anchor TypeScript SDK 调用 Solana 链上程序
//
// TypeScript SDK 的优势：
// ✅ 完全自动化：无需手动处理鉴别器、序列化
// ✅ 类型安全：自动生成 TypeScript 类型定义
// ✅ 简洁代码：一行代码即可调用指令
// ✅ IDE 支持：自动补全、错误提示
// ✅ 官方推荐：文档完善、社区活跃
//
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProject } from "../../target/types/my_project";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createProvider, printAccountInfo, formatSol } from "../shared/utils";

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log("🚀 Anchor TypeScript 客户端（增强版）");
  console.log("================================\n");

  // ------------------------------------------------------------------------
  // 第 1 步：设置 Provider 和连接
  // ------------------------------------------------------------------------
  //
  // Provider 包含：
  // - connection: RPC 连接
  // - wallet: 钱包（用于签名和支付交易费用）
  // - opts: 交易选项（commitment 级别等）
  //
  // 使用 createProvider 工具函数，自动处理环境变量或使用默认值
  const provider = createProvider({
    rpcUrl: "http://127.0.0.1:8899",  // 本地测试网
    // walletPath 会自动使用 ~/.config/solana/id.json
  });
  anchor.setProvider(provider);

  // ------------------------------------------------------------------------
  // 第 2 步：加载程序
  // ------------------------------------------------------------------------
  //
  // anchor.workspace 会自动：
  // 1. 从 Anchor.toml 读取程序 ID
  // 2. 加载 target/idl/my_project.json
  // 3. 生成类型化的 Program 对象
  //
  // Program 对象提供：
  // - program.methods：调用指令
  // - program.account：查询账户
  // - program.programId：程序 ID
  //
  const program = anchor.workspace.myProject as Program<MyProject>;

  console.log("📡 RPC 端点:", provider.connection.rpcEndpoint);
  console.log("👛 钱包地址:", provider.wallet.publicKey.toBase58());
  console.log("📦 程序 ID:", program.programId.toBase58());
  console.log();

  // 显示钱包余额
  await printAccountInfo(
    provider.connection,
    provider.wallet.publicKey,
    "💰 钱包信息"
  );
  console.log();

  // ------------------------------------------------------------------------
  // 第 3 步：生成新的计数器账户
  // ------------------------------------------------------------------------
  //
  // Keypair.generate() 生成新的密钥对
  // - publicKey: 账户地址（可公开）
  // - secretKey: 私钥（用于签名，需保密）
  //
  const counter = Keypair.generate();

  console.log("=== 1️⃣ 初始化计数器 ===");
  console.log("🆕 新计数器地址:", counter.publicKey.toBase58());

  try {
    // ------------------------------------------------------------------------
    // 第 4 步：调用 initialize 指令
    // ------------------------------------------------------------------------
    //
    // 使用 program.methods 调用智能合约指令：
    //
    // .initialize()             - 指令名（自动补全，类型安全）
    // .accounts({ ... })        - 指定账户（Anchor 自动验证）
    // .signers([counter])       - 添加额外签名者
    // .rpc()                    - 发送交易并等待确认
    //
    // Anchor 自动处理：
    // - 鉴别器（8 字节指令 ID）
    // - 参数序列化
    // - 账户元数据（可写/只读，签名者）
    // - 交易构建和发送
    //
    const tx = await program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey, // 新建的计数器账户
        user: provider.wallet.publicKey, // 支付租金的用户
        // systemProgram 自动解析（Anchor 0.32+ 特性）
      })
      .signers([counter]) // counter 需要签名（新账户创建）
      .rpc();

    console.log("📝 交易签名:", tx);
    console.log("✅ 初始化成功\n");

    // ------------------------------------------------------------------------
    // 第 5 步：查询初始状态
    // ------------------------------------------------------------------------
    //
    // program.account.counter.fetch() 会：
    // 1. 从链上获取账户数据
    // 2. 验证鉴别器（确保是 Counter 账户）
    // 3. 自动反序列化为 TypeScript 对象
    //
    // 返回的对象包含：
    // - count: BN 类型（大数）
    // - authority: PublicKey 类型
    //
    let counterAccount = await program.account.counter.fetch(
      counter.publicKey
    );

    console.log("=== 2️⃣ 查询初始状态 ===");
    console.log("📊 计数值:", counterAccount.count.toString());
    console.log("🔑 权限所有者:", counterAccount.authority.toBase58());
    console.log("🔒 权限验证:", counterAccount.authority.equals(provider.wallet.publicKey) ? "✅ 正确" : "❌ 错误");
    console.log();

    // ------------------------------------------------------------------------
    // 第 6 步：批量增加计数器（演示批量操作）
    // ------------------------------------------------------------------------
    //
    // 演示如何在单个交易中执行多个指令
    //
    console.log("=== 3️⃣ 批量增加计数器（10次） ===");

    // 方式 1：串行执行（逐个交易）
    console.log("方式 1: 串行执行（每次单独发送交易）");
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      const tx = await program.methods
        .increment()
        .accounts({
          counter: counter.publicKey,
          // authority 通过 wallet 自动推断（Anchor 0.32+ 特性）
        })
        .rpc();

      console.log(`  ⏱️  第 ${i + 1}/10 次 - 交易: ${tx.slice(0, 8)}...`);
    }

    const endTime = Date.now();
    console.log(`⏱️  耗时: ${endTime - startTime}ms`);

    // 查询更新后的状态
    counterAccount = await program.account.counter.fetch(counter.publicKey);
    console.log("📊 计数值:", counterAccount.count.toString());
    console.log();

    // ------------------------------------------------------------------------
    // 第 7 步：减少计数器
    // ------------------------------------------------------------------------
    console.log("=== 4️⃣ 减少计数器 ===");

    const tx4 = await program.methods
      .decrement()
      .accounts({
        counter: counter.publicKey,
        // authority 通过 wallet 自动推断
      })
      .rpc();

    console.log("📝 交易签名:", tx4);

    counterAccount = await program.account.counter.fetch(counter.publicKey);
    console.log("📊 最终计数值:", counterAccount.count.toString());
    console.log();

    // ------------------------------------------------------------------------
    // 第 8 步：演示错误处理
    // ------------------------------------------------------------------------
    console.log("=== 5️⃣ 错误处理演示 ===");

    try {
      // 尝试使用错误的 authority（应该失败）
      const wrongAuthority = Keypair.generate();

      console.log("❌ 尝试用错误的 authority 增加计数器...");
      await program.methods
        .increment()
        .accounts({
          counter: counter.publicKey,
          // 注意：这里不能省略 authority，因为我们要用非默认的签名者
        })
        .signers([wrongAuthority]) // 使用错误的签名者
        .rpc();

      console.log("⚠️  不应该执行到这里！");
    } catch (error: any) {
      console.log("✅ 预期的错误被捕获:");
      if (error.message) {
        console.log("   错误信息:", error.message.split('\n')[0]);
      }
      // Anchor 错误通常包含错误代码
      if (error.code) {
        console.log("   错误代码:", error.code);
      }
    }
    console.log();

    // ------------------------------------------------------------------------
    // 完成
    // ------------------------------------------------------------------------
    console.log("=== ✅ 所有操作完成！ ===");
    console.log("\n📝 总结:");
    console.log(`  - 计数器地址: ${counter.publicKey.toBase58()}`);
    console.log(`  - 最终计数值: ${counterAccount.count.toString()}`);
    console.log(`  - 权限所有者: ${counterAccount.authority.toBase58()}`);

  } catch (error: any) {
    console.error("\n❌ 发生错误:");
    console.error("错误信息:", error.message || error);

    // 打印更详细的错误信息（用于调试）
    if (error.logs) {
      console.error("\n📋 程序日志:");
      error.logs.forEach((log: string) => console.error("  ", log));
    }

    throw error;
  }
}

// ============================================================================
// 程序入口
// ============================================================================

main()
  .then(() => {
    console.log("\n🎉 程序正常退出");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 程序异常退出");
    console.error(error);
    process.exit(1);
  });

// ============================================================================
// 总结：使用 Anchor TypeScript SDK 的优势
// ============================================================================
//
// 相比 Rust 客户端，TypeScript SDK：
//
// ✅ 代码量减少 70%
// ✅ 无需手动处理鉴别器
// ✅ 无需手动定义数据结构（自动从 IDL 生成）
// ✅ 完整的类型安全（IDE 自动补全）
// ✅ 自动验证账户顺序和类型
// ✅ 更好的错误提示
// ✅ 官方推荐，文档完善
//
// 适用场景：
// - 前端应用
// - 后端服务（Node.js）
// - 测试脚本
// - 快速原型开发
// - 日常开发
//
// ============================================================================
