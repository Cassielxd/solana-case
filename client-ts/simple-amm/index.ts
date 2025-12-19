// ============================================================================
// Simple AMM 客户端示例
// ============================================================================
//
// 这个示例演示了 Simple AMM 程序的完整功能：
// 1. 初始化流动性池
// 2. 添加流动性（获得 LP 代币）
// 3. 代币交换（A -> B 和 B -> A）
// 4. 移除流动性（销毁 LP 代币）
//
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SimpleAmm } from "../../target/types/simple_amm";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { createProvider } from "../shared/utils";

async function main() {
  console.log("🏦 Simple AMM 客户端示例");
  console.log("================================\n");

  // ============================================================================
  // 步骤 1: 初始化 Provider 和程序
  // ============================================================================

  const provider = createProvider();
  anchor.setProvider(provider);

  const program = anchor.workspace.simpleAmm as Program<SimpleAmm>;
  const payer = provider.wallet as anchor.Wallet;

  console.log("📡 RPC 端点:", provider.connection.rpcEndpoint);
  console.log("👛 钱包地址:", provider.wallet.publicKey.toBase58());
  console.log("📦 程序 ID:", program.programId.toBase58());
  console.log();

  // ============================================================================
  // 步骤 2: 创建测试代币
  // ============================================================================
  console.log("=== 1️⃣ 创建测试代币 ===");

  // 创建 Token A (例如: USDC)
  console.log("创建 Token A...");
  const tokenAMint = await createMint(
    provider.connection,
    payer.payer,
    payer.publicKey,
    null,
    6 // 6 decimals
  );
  console.log("✅ Token A Mint:", tokenAMint.toBase58());

  // 创建 Token B (例如: SOL wrapped)
  console.log("创建 Token B...");
  const tokenBMint = await createMint(
    provider.connection,
    payer.payer,
    payer.publicKey,
    null,
    6 // 6 decimals
  );
  console.log("✅ Token B Mint:", tokenBMint.toBase58());
  console.log();

  // ============================================================================
  // 步骤 3: 创建用户代币账户并铸造代币
  // ============================================================================
  console.log("=== 2️⃣ 创建用户代币账户 ===");

  const INITIAL_AMOUNT = 1000 * 1e6; // 1000 tokens

  // 创建 Token A 账户
  const userTokenAAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer.payer,
    tokenAMint,
    payer.publicKey
  );
  console.log("User Token A:", userTokenAAccount.address.toBase58());

  // 铸造 Token A
  await mintTo(
    provider.connection,
    payer.payer,
    tokenAMint,
    userTokenAAccount.address,
    payer.publicKey,
    INITIAL_AMOUNT
  );
  console.log(`✅ 铸造 ${INITIAL_AMOUNT / 1e6} Token A`);

  // 创建 Token B 账户
  const userTokenBAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer.payer,
    tokenBMint,
    payer.publicKey
  );
  console.log("User Token B:", userTokenBAccount.address.toBase58());

  // 铸造 Token B
  await mintTo(
    provider.connection,
    payer.payer,
    tokenBMint,
    userTokenBAccount.address,
    payer.publicKey,
    INITIAL_AMOUNT
  );
  console.log(`✅ 铸造 ${INITIAL_AMOUNT / 1e6} Token B`);
  console.log();

  // ============================================================================
  // 步骤 4: 计算 PDA 地址
  // ============================================================================
  console.log("=== 3️⃣ 计算 PDA 地址 ===");

  // Pool PDA
  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), tokenAMint.toBuffer(), tokenBMint.toBuffer()],
    program.programId
  );
  console.log("Pool PDA:", poolPda.toBase58());

  // LP Mint PDA
  const [lpMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp_mint"), tokenAMint.toBuffer(), tokenBMint.toBuffer()],
    program.programId
  );
  console.log("LP Mint PDA:", lpMintPda.toBase58());

  // Pool Token A PDA
  const [poolTokenAPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_token_a"), poolPda.toBuffer()],
    program.programId
  );
  console.log("Pool Token A PDA:", poolTokenAPda.toBase58());

  // Pool Token B PDA
  const [poolTokenBPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_token_b"), poolPda.toBuffer()],
    program.programId
  );
  console.log("Pool Token B PDA:", poolTokenBPda.toBase58());
  console.log();

  // ============================================================================
  // 步骤 5: 初始化流动性池
  // ============================================================================
  console.log("=== 4️⃣ 初始化流动性池 ===");

  try {
    const initTx = await program.methods
      .initializePool()
      .accountsPartial({
        pool: poolPda,
        lpMint: lpMintPda,
        tokenAMint: tokenAMint,
        tokenBMint: tokenBMint,
        poolTokenA: poolTokenAPda,
        poolTokenB: poolTokenBPda,
        payer: payer.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("✅ 流动性池已创建");
    console.log("  交易:", initTx);

    // 查询池状态
    const pool = await program.account.pool.fetch(poolPda);
    console.log("\n📊 池信息:");
    console.log("  Token A Mint:", pool.tokenAMint.toBase58());
    console.log("  Token B Mint:", pool.tokenBMint.toBase58());
    console.log("  LP Mint:", pool.lpMint.toBase58());
    console.log("  Total LP Supply:", pool.totalLpSupply.toString());
    console.log();
  } catch (error: any) {
    console.log("⚠️  池可能已存在，继续...\n");
  }

  // ============================================================================
  // 步骤 6: 创建用户 LP 代币账户
  // ============================================================================
  console.log("=== 5️⃣ 创建 LP 代币账户 ===");

  const userLpTokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer.payer,
    lpMintPda,
    payer.publicKey,
    true // allowOwnerOffCurve for PDA mint
  );
  console.log("✅ User LP Token:", userLpTokenAccount.address.toBase58());
  console.log();

  // ============================================================================
  // 步骤 7: 添加流动性
  // ============================================================================
  console.log("=== 6️⃣ 添加流动性 ===");

  const depositAmountA = new anchor.BN(100 * 1e6); // 100 tokens
  const depositAmountB = new anchor.BN(200 * 1e6); // 200 tokens
  const minLpTokens = new anchor.BN(0);

  console.log(`存入 ${depositAmountA.toNumber() / 1e6} Token A`);
  console.log(`存入 ${depositAmountB.toNumber() / 1e6} Token B`);

  const depositTx = await program.methods
    .depositLiquidity(depositAmountA, depositAmountB, minLpTokens)
    .accountsPartial({
      pool: poolPda,
      lpMint: lpMintPda,
      poolTokenA: poolTokenAPda,
      poolTokenB: poolTokenBPda,
      userTokenA: userTokenAAccount.address,
      userTokenB: userTokenBAccount.address,
      userLpToken: userLpTokenAccount.address,
      user: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("✅ 流动性已添加");
  console.log("  交易:", depositTx);

  // 查询 LP 代币余额
  const userLpBalance = await getAccount(
    provider.connection,
    userLpTokenAccount.address
  );
  console.log(
    `  获得 LP 代币: ${Number(userLpBalance.amount) / 1e6}`
  );

  // 查询池储备
  const poolTokenA = await getAccount(provider.connection, poolTokenAPda);
  const poolTokenB = await getAccount(provider.connection, poolTokenBPda);
  console.log("\n📊 池储备:");
  console.log(`  Token A: ${Number(poolTokenA.amount) / 1e6}`);
  console.log(`  Token B: ${Number(poolTokenB.amount) / 1e6}`);
  console.log(
    `  价格比率 (B/A): ${
      Number(poolTokenB.amount) / Number(poolTokenA.amount)
    }`
  );
  console.log();

  // ============================================================================
  // 步骤 8: 代币交换 (A -> B)
  // ============================================================================
  console.log("=== 7️⃣ 代币交换 (A -> B) ===");

  const swapAmountA = new anchor.BN(10 * 1e6); // 10 tokens
  const minAmountOut = new anchor.BN(0);

  // 获取交换前余额
  const userTokenABefore = await getAccount(
    provider.connection,
    userTokenAAccount.address
  );
  const userTokenBBefore = await getAccount(
    provider.connection,
    userTokenBAccount.address
  );

  console.log(`交换 ${swapAmountA.toNumber() / 1e6} Token A -> Token B`);
  console.log(
    `  Token A 余额: ${Number(userTokenABefore.amount) / 1e6}`
  );
  console.log(
    `  Token B 余额: ${Number(userTokenBBefore.amount) / 1e6}`
  );

  const swapTx1 = await program.methods
    .swap(swapAmountA, minAmountOut, true) // true = A to B
    .accountsPartial({
      pool: poolPda,
      poolTokenA: poolTokenAPda,
      poolTokenB: poolTokenBPda,
      userTokenA: userTokenAAccount.address,
      userTokenB: userTokenBAccount.address,
      user: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("✅ 交换完成");
  console.log("  交易:", swapTx1);

  // 获取交换后余额
  const userTokenAAfter1 = await getAccount(
    provider.connection,
    userTokenAAccount.address
  );
  const userTokenBAfter1 = await getAccount(
    provider.connection,
    userTokenBAccount.address
  );

  const tokenASpent =
    Number(userTokenABefore.amount) - Number(userTokenAAfter1.amount);
  const tokenBReceived =
    Number(userTokenBAfter1.amount) - Number(userTokenBBefore.amount);

  console.log("\n交换结果:");
  console.log(`  花费 Token A: ${tokenASpent / 1e6}`);
  console.log(`  获得 Token B: ${tokenBReceived / 1e6}`);
  console.log(
    `  实际汇率: ${(tokenBReceived / tokenASpent).toFixed(4)}`
  );
  console.log();

  // ============================================================================
  // 步骤 9: 代币交换 (B -> A)
  // ============================================================================
  console.log("=== 8️⃣ 代币交换 (B -> A) ===");

  const swapAmountB = new anchor.BN(20 * 1e6); // 20 tokens

  console.log(`交换 ${swapAmountB.toNumber() / 1e6} Token B -> Token A`);
  console.log(
    `  Token A 余额: ${Number(userTokenAAfter1.amount) / 1e6}`
  );
  console.log(
    `  Token B 余额: ${Number(userTokenBAfter1.amount) / 1e6}`
  );

  const swapTx2 = await program.methods
    .swap(swapAmountB, minAmountOut, false) // false = B to A
    .accountsPartial({
      pool: poolPda,
      poolTokenA: poolTokenAPda,
      poolTokenB: poolTokenBPda,
      userTokenA: userTokenAAccount.address,
      userTokenB: userTokenBAccount.address,
      user: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("✅ 交换完成");
  console.log("  交易:", swapTx2);

  // 获取交换后余额
  const userTokenAAfter2 = await getAccount(
    provider.connection,
    userTokenAAccount.address
  );
  const userTokenBAfter2 = await getAccount(
    provider.connection,
    userTokenBAccount.address
  );

  const tokenBSpent =
    Number(userTokenBAfter1.amount) - Number(userTokenBAfter2.amount);
  const tokenAReceived =
    Number(userTokenAAfter2.amount) - Number(userTokenAAfter1.amount);

  console.log("\n交换结果:");
  console.log(`  花费 Token B: ${tokenBSpent / 1e6}`);
  console.log(`  获得 Token A: ${tokenAReceived / 1e6}`);
  console.log(
    `  实际汇率: ${(tokenAReceived / tokenBSpent).toFixed(4)}`
  );
  console.log();

  // ============================================================================
  // 步骤 10: 移除部分流动性
  // ============================================================================
  console.log("=== 9️⃣ 移除流动性 ===");

  // 获取当前 LP 余额
  const currentLpBalance = await getAccount(
    provider.connection,
    userLpTokenAccount.address
  );
  const lpToWithdraw = new anchor.BN(Number(currentLpBalance.amount) / 2); // 移除一半

  console.log(
    `移除 ${lpToWithdraw.toNumber() / 1e6} LP 代币 (总量的 50%)`
  );

  const withdrawTx = await program.methods
    .withdrawLiquidity(lpToWithdraw, new anchor.BN(0), new anchor.BN(0))
    .accountsPartial({
      pool: poolPda,
      lpMint: lpMintPda,
      poolTokenA: poolTokenAPda,
      poolTokenB: poolTokenBPda,
      userTokenA: userTokenAAccount.address,
      userTokenB: userTokenBAccount.address,
      userLpToken: userLpTokenAccount.address,
      user: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("✅ 流动性已移除");
  console.log("  交易:", withdrawTx);

  // 获取最终余额
  const finalTokenA = await getAccount(
    provider.connection,
    userTokenAAccount.address
  );
  const finalTokenB = await getAccount(
    provider.connection,
    userTokenBAccount.address
  );
  const finalLp = await getAccount(
    provider.connection,
    userLpTokenAccount.address
  );

  const tokenAWithdrawn =
    Number(finalTokenA.amount) - Number(userTokenAAfter2.amount);
  const tokenBWithdrawn =
    Number(finalTokenB.amount) - Number(userTokenBAfter2.amount);

  console.log("\n移除结果:");
  console.log(`  获得 Token A: ${tokenAWithdrawn / 1e6}`);
  console.log(`  获得 Token B: ${tokenBWithdrawn / 1e6}`);
  console.log(`  剩余 LP 代币: ${Number(finalLp.amount) / 1e6}`);
  console.log();

  // ============================================================================
  // 步骤 11: 显示最终状态
  // ============================================================================
  console.log("=== 🎯 最终状态 ===");

  const finalPool = await program.account.pool.fetch(poolPda);
  const finalPoolTokenA = await getAccount(provider.connection, poolTokenAPda);
  const finalPoolTokenB = await getAccount(provider.connection, poolTokenBPda);

  console.log("\n📊 池状态:");
  console.log(`  Token A 储备: ${Number(finalPoolTokenA.amount) / 1e6}`);
  console.log(`  Token B 储备: ${Number(finalPoolTokenB.amount) / 1e6}`);
  console.log(
    `  总 LP 供应: ${finalPool.totalLpSupply.toNumber() / 1e6}`
  );
  console.log(
    `  恒定乘积 (k): ${
      (Number(finalPoolTokenA.amount) * Number(finalPoolTokenB.amount)) / 1e12
    }`
  );

  console.log("\n👛 用户余额:");
  console.log(`  Token A: ${Number(finalTokenA.amount) / 1e6}`);
  console.log(`  Token B: ${Number(finalTokenB.amount) / 1e6}`);
  console.log(`  LP 代币: ${Number(finalLp.amount) / 1e6}`);

  console.log("\n✅ 所有操作完成！");
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
//    npx ts-node client-ts/simple-amm/index.ts
//
// ## 功能演示
// ✅ 创建测试代币（Token A 和 Token B）
// ✅ 初始化流动性池
// ✅ 添加流动性（获得 LP 代币）
// ✅ 代币交换（A -> B）
// ✅ 代币交换（B -> A）
// ✅ 移除流动性（销毁 LP 代币）
//
// ## 关键概念
// - AMM (Automated Market Maker): 自动做市商
// - Constant Product Formula: x * y = k
// - LP Tokens: 流动性提供者代币
// - Slippage: 滑点保护
// - Trading Fee: 0.3% 交易手续费
//
// ============================================================================
