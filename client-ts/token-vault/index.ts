// ============================================================================
// Token Vault 客户端示例
// ============================================================================
//
// 这个示例演示了 Token Vault 程序的完整功能：
// 1. 初始化金库
// 2. 存入 SOL（多次）
// 3. 提取 SOL
// 4. 转移所有权（双向）
// 5. 关闭金库
//
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenVault } from "../../target/types/token_vault";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createProvider } from "../shared/utils";

async function main() {
  console.log("🏦 Token Vault 客户端示例");
  console.log("================================\n");

  // ============================================================================
  // 步骤 1: 初始化 Provider 和程序
  // ============================================================================

  // 创建 Provider（包含连接、钱包等配置）
  const provider = createProvider();
  // 设置全局 Provider
  anchor.setProvider(provider);

  // 加载已部署的 token-vault 程序
  // anchor.workspace 会自动从 Anchor.toml 读取程序配置
  const program = anchor.workspace.tokenVault as Program<TokenVault>;

  // 打印连接信息
  console.log("📡 RPC 端点:", provider.connection.rpcEndpoint);
  console.log("👛 钱包地址:", provider.wallet.publicKey.toBase58());
  console.log("📦 程序 ID:", program.programId.toBase58());
  console.log();

  // ============================================================================
  // 步骤 2: 配置金库参数
  // ============================================================================

  // 金库名称（最多 32 字符）
  const vaultName = "my-savings";
  // 金库所有者（当前钱包）
  const authority = provider.wallet.publicKey;

  // ============================================================================
  // 步骤 3: 计算金库 PDA 地址
  // ============================================================================

  // PDA (Program Derived Address) 是由程序派生的地址
  // 它由以下部分确定性地生成：
  // - seeds: ["vault", authority, vaultName]
  // - programId: token-vault 程序 ID
  // - bump: 使地址落在 ed25519 曲线之外的值
  const [vaultPda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault"),      // 固定前缀（区分不同类型的 PDA）
      authority.toBuffer(),      // 所有者公钥（每个用户有独立的金库）
      Buffer.from(vaultName)     // 金库名称（同一用户可创建多个金库）
    ],
    program.programId            // 程序 ID
  );

  console.log("📋 金库配置:");
  console.log(`  名称: ${vaultName}`);
  console.log(`  PDA: ${vaultPda.toBase58()}`);
  console.log(`  Bump: ${bump}`);
  console.log();

  try {
    // ========================================================================
    // 步骤 4: 初始化金库
    // ========================================================================
    console.log("=== 1️⃣ 初始化金库 ===");

    // 调用程序的 initialize 指令
    // program.methods.initialize() 会自动：
    // 1. 序列化参数（vaultName）
    // 2. 构建交易指令
    // 3. 发送并确认交易
    const initTx = await program.methods
      .initialize(vaultName)           // 传入金库名称参数
      .accountsPartial({               // 指定需要的账户
        vault: vaultPda,               // 金库 PDA（会被创建）
        authority: authority,          // 所有者（签名者，支付租金）
        // systemProgram 会自动添加
      })
      .rpc();                          // 发送交易并等待确认

    console.log("✅ 金库已创建");
    console.log(`  交易: ${initTx}`);
    console.log();

    // ========================================================================
    // 查询金库账户数据
    // ========================================================================

    // 从链上获取金库账户数据
    // Anchor 会自动反序列化账户数据为 TypeScript 对象
    let vault = await program.account.vault.fetch(vaultPda);
    console.log("📊 金库信息:");
    console.log(`  名称: ${vault.vaultName}`);
    console.log(`  所有者: ${vault.authority.toBase58()}`);
    console.log(`  总存款: ${vault.totalDeposits.toNumber()} lamports`);
    console.log(`  总提款: ${vault.totalWithdrawals.toNumber()} lamports`);
    console.log();

    // ========================================================================
    // 步骤 5: 存入 SOL（第一次）
    // ========================================================================
    console.log("=== 2️⃣ 存入 SOL ===");

    // 定义存款金额：0.5 SOL
    // LAMPORTS_PER_SOL = 10^9（1 SOL = 1,000,000,000 lamports）
    const depositAmount1 = 0.5 * LAMPORTS_PER_SOL;

    // 调用 deposit 指令
    // anchor.BN 是大数类型，用于处理 u64
    const depositTx1 = await program.methods
      .deposit(new anchor.BN(depositAmount1))  // 存款金额
      .accountsPartial({
        vault: vaultPda,                       // 金库账户
        depositor: authority,                  // 存款人（签名者）
        // systemProgram 会自动添加
      })
      .rpc();

    console.log(`✅ 存入 ${depositAmount1 / LAMPORTS_PER_SOL} SOL`);
    console.log(`  交易: ${depositTx1}`);

    // 查询金库的链上余额（包括租金）
    let balance = await provider.connection.getBalance(vaultPda);
    console.log(`  金库余额: ${balance / LAMPORTS_PER_SOL} SOL`);
    console.log();

    // ========================================================================
    // 步骤 6: 再次存入 SOL（演示多次存款）
    // ========================================================================
    console.log("=== 3️⃣ 再次存入 SOL ===");

    // 第二次存款：0.3 SOL
    const depositAmount2 = 0.3 * LAMPORTS_PER_SOL;

    const depositTx2 = await program.methods
      .deposit(new anchor.BN(depositAmount2))
      .accountsPartial({
        vault: vaultPda,
        depositor: authority,
      })
      .rpc();

    console.log(`✅ 存入 ${depositAmount2 / LAMPORTS_PER_SOL} SOL`);
    console.log(`  交易: ${depositTx2}`);

    // 查询更新后的余额和统计数据
    balance = await provider.connection.getBalance(vaultPda);
    vault = await program.account.vault.fetch(vaultPda);
    console.log(`  金库余额: ${balance / LAMPORTS_PER_SOL} SOL`);
    console.log(`  累计存款: ${vault.totalDeposits.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log();

    // ========================================================================
    // 步骤 7: 提取 SOL
    // ========================================================================
    console.log("=== 4️⃣ 提取 SOL ===");

    // 提款金额：0.2 SOL
    const withdrawAmount = 0.2 * LAMPORTS_PER_SOL;

    // 生成一个新的接收者地址（模拟提款到其他账户）
    const receiver = Keypair.generate().publicKey;

    // 调用 withdraw 指令
    // 注意：只有金库所有者才能提款
    const withdrawTx = await program.methods
      .withdraw(new anchor.BN(withdrawAmount))   // 提款金额
      .accountsPartial({
        vault: vaultPda,                         // 金库账户
        authority: authority,                    // 所有者（必须签名）
        receiver: receiver,                      // 接收者地址
        // systemProgram 会自动添加
      })
      .rpc();

    console.log(`✅ 提取 ${withdrawAmount / LAMPORTS_PER_SOL} SOL`);
    console.log(`  交易: ${withdrawTx}`);
    console.log(`  接收者: ${receiver.toBase58()}`);

    // 查询提款后的状态
    balance = await provider.connection.getBalance(vaultPda);
    const receiverBalance = await provider.connection.getBalance(receiver);
    vault = await program.account.vault.fetch(vaultPda);

    console.log(`  金库剩余: ${balance / LAMPORTS_PER_SOL} SOL`);
    console.log(`  接收者余额: ${receiverBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`  累计提款: ${vault.totalWithdrawals.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log();

    // ========================================================================
    // 步骤 8: 查询中间状态
    // ========================================================================
    console.log("=== 5️⃣ 最终状态 ===");

    // 查询金库数据和余额
    vault = await program.account.vault.fetch(vaultPda);
    balance = await provider.connection.getBalance(vaultPda);

    // 显示完整的金库统计信息
    console.log("📊 金库统计:");
    console.log(`  ├─ 名称: ${vault.vaultName}`);
    console.log(`  ├─ 所有者: ${vault.authority.toBase58()}`);
    console.log(`  ├─ 总存款: ${vault.totalDeposits.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`  ├─ 总提款: ${vault.totalWithdrawals.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`  ├─ 净存款: ${(vault.totalDeposits.toNumber() - vault.totalWithdrawals.toNumber()) / LAMPORTS_PER_SOL} SOL`);
    console.log(`  └─ 当前余额: ${balance / LAMPORTS_PER_SOL} SOL`);
    console.log();

    // ========================================================================
    // 步骤 9: 转移所有权（演示双向转移）
    // ========================================================================
    console.log("=== 6️⃣ 转移所有权（演示） ===");

    // 生成新的所有者密钥对
    const newAuthorityKeypair = Keypair.generate();
    const newAuthority = newAuthorityKeypair.publicKey;

    // 第一次转移：从当前所有者转给新所有者
    const transferTx = await program.methods
      .transferAuthority(newAuthority)         // 新所有者地址
      .accountsPartial({
        vault: vaultPda,                       // 金库账户
        authority: authority,                  // 当前所有者（必须签名）
      })
      .rpc();

    console.log(`✅ 所有权已转移`);
    console.log(`  交易: ${transferTx}`);
    console.log(`  新所有者: ${newAuthority.toBase58()}`);
    console.log();

    // ========================================================================
    // 转回原所有者（演示所有权可以多次转移）
    // ========================================================================

    // 第二次转移：从新所有者转回原所有者
    // 注意：现在需要新所有者签名
    const transferBackTx = await program.methods
      .transferAuthority(authority)            // 转回原所有者
      .accountsPartial({
        vault: vaultPda,                       // 金库 PDA（地址不变！）
        authority: newAuthority,               // 当前所有者（新所有者）
      })
      .signers([newAuthorityKeypair])          // 新所有者签名
      .rpc();

    console.log(`✅ 已转回原所有者`);
    console.log(`  交易: ${transferBackTx}`);
    console.log();

    // ========================================================================
    // 步骤 10: 关闭金库
    // ========================================================================
    console.log("=== 7️⃣ 关闭金库 ===");

    // 调用 close_vault 指令
    // 这会：
    // 1. 将金库中所有 SOL（包括租金）转给所有者
    // 2. 清空账户数据
    // 3. 将账户标记为已关闭
    const closeTx = await program.methods
      .closeVault()
      .accountsPartial({
        vault: vaultPda,           // 要关闭的金库
        authority: authority,      // 所有者（必须签名，接收余额）
      })
      .rpc();

    console.log(`✅ 金库已关闭`);
    console.log(`  交易: ${closeTx}`);
    console.log(`  剩余 SOL 已转回所有者`);
    console.log();

    // ========================================================================
    // 验证金库账户已被删除
    // ========================================================================

    try {
      // 尝试获取金库数据
      await program.account.vault.fetch(vaultPda);
      console.log("⚠️  金库仍然存在");
    } catch (error) {
      // 如果获取失败，说明账户已被删除
      console.log("✅ 金库账户已成功关闭");
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
//    npx ts-node client-ts/token-vault/index.ts
//
// ## 功能演示
// ✅ 创建金库（使用 PDA）
// ✅ 存入 SOL（多次，任何人都可以）
// ✅ 提取 SOL（只有所有者）
// ✅ 转移所有权（双向演示）
// ✅ 关闭金库（回收租金）
//
// ## 关键概念
// - PDA (Program Derived Address): 程序派生地址
// - Seeds: PDA 计算的种子（vault + authority + name）
// - Bump: 使地址有效的调整值
// - CPI (Cross-Program Invocation): 跨程序调用
// - Rent: 账户租金（余额不足会被清除）
// - Signer: 交易签名者（验证权限）
//
// ============================================================================
