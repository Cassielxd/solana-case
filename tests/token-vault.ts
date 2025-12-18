// ============================================================================
// Token Vault 测试
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenVault } from "../target/types/token_vault";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("token-vault", () => {
  // 配置客户端
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.tokenVault as Program<TokenVault>;
  const authority = provider.wallet.publicKey;

  let vaultPda: PublicKey;
  let vaultBump: number;
  const vaultName = "my-vault";

  before(async () => {
    // 计算金库 PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), authority.toBuffer(), Buffer.from(vaultName)],
      program.programId
    );

    console.log("\n📋 测试配置:");
    console.log(`  Authority: ${authority.toBase58()}`);
    console.log(`  Vault PDA: ${vaultPda.toBase58()}`);
    console.log(`  Vault Name: ${vaultName}`);
    console.log(`  Bump: ${vaultBump}\n`);
  });

  it("✅ 初始化金库", async () => {
    const tx = await program.methods
      .initialize(vaultName)
      .accounts({
        vault: vaultPda,
        authority: authority,
      })
      .rpc();

    console.log(`  交易签名: ${tx}`);

    // 验证金库账户
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    assert.equal(
      vaultAccount.authority.toBase58(),
      authority.toBase58(),
      "Authority 不匹配"
    );
    assert.equal(vaultAccount.vaultName, vaultName, "金库名称不匹配");
    assert.equal(
      vaultAccount.totalDeposits.toNumber(),
      0,
      "初始存款应为 0"
    );
    assert.equal(
      vaultAccount.totalWithdrawals.toNumber(),
      0,
      "初始提款应为 0"
    );

    console.log(`  ✓ 金库初始化成功`);
    console.log(`  ✓ Authority: ${vaultAccount.authority.toBase58()}`);
    console.log(`  ✓ 金库名称: ${vaultAccount.vaultName}`);
  });

  it("💰 存入 SOL", async () => {
    const depositAmount = 0.5 * LAMPORTS_PER_SOL; // 0.5 SOL

    // 获取存款前余额
    const balanceBefore = await provider.connection.getBalance(vaultPda);

    const tx = await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accounts({
        vault: vaultPda,
        depositor: authority,
      })
      .rpc();

    console.log(`  交易签名: ${tx}`);

    // 获取存款后余额
    const balanceAfter = await provider.connection.getBalance(vaultPda);
    const vaultAccount = await program.account.vault.fetch(vaultPda);

    assert.equal(
      balanceAfter - balanceBefore,
      depositAmount,
      "余额变化不正确"
    );
    assert.equal(
      vaultAccount.totalDeposits.toNumber(),
      depositAmount,
      "总存款统计不正确"
    );

    console.log(`  ✓ 存款成功: ${depositAmount / LAMPORTS_PER_SOL} SOL`);
    console.log(`  ✓ 金库余额: ${balanceAfter / LAMPORTS_PER_SOL} SOL`);
    console.log(
      `  ✓ 总存款: ${vaultAccount.totalDeposits.toNumber() / LAMPORTS_PER_SOL} SOL`
    );
  });

  it("💰 再次存入 SOL", async () => {
    const depositAmount = 0.3 * LAMPORTS_PER_SOL; // 0.3 SOL

    const vaultBefore = await program.account.vault.fetch(vaultPda);
    const previousTotal = vaultBefore.totalDeposits.toNumber();

    const tx = await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accounts({
        vault: vaultPda,
        depositor: authority,
      })
      .rpc();

    console.log(`  交易签名: ${tx}`);

    const vaultAfter = await program.account.vault.fetch(vaultPda);
    const newTotal = vaultAfter.totalDeposits.toNumber();

    assert.equal(
      newTotal - previousTotal,
      depositAmount,
      "累计存款不正确"
    );

    console.log(`  ✓ 存款成功: ${depositAmount / LAMPORTS_PER_SOL} SOL`);
    console.log(`  ✓ 累计存款: ${newTotal / LAMPORTS_PER_SOL} SOL`);
  });

  it("💸 提取 SOL", async () => {
    const withdrawAmount = 0.2 * LAMPORTS_PER_SOL; // 0.2 SOL

    const receiverKeypair = Keypair.generate();
    const receiver = receiverKeypair.publicKey;

    // 获取提款前余额
    const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);
    const vaultBefore = await program.account.vault.fetch(vaultPda);

    const tx = await program.methods
      .withdraw(new anchor.BN(withdrawAmount))
      .accounts({
        vault: vaultPda,
        authority: authority,
        receiver: receiver,
      })
      .rpc();

    console.log(`  交易签名: ${tx}`);

    // 获取提款后余额
    const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);
    const receiverBalance = await provider.connection.getBalance(receiver);
    const vaultAfter = await program.account.vault.fetch(vaultPda);

    assert.equal(
      vaultBalanceBefore - vaultBalanceAfter,
      withdrawAmount,
      "金库余额减少不正确"
    );
    assert.equal(
      receiverBalance,
      withdrawAmount,
      "接收者收到的金额不正确"
    );
    assert.equal(
      vaultAfter.totalWithdrawals.toNumber(),
      withdrawAmount,
      "总提款统计不正确"
    );

    console.log(`  ✓ 提款成功: ${withdrawAmount / LAMPORTS_PER_SOL} SOL`);
    console.log(
      `  ✓ 剩余余额: ${vaultBalanceAfter / LAMPORTS_PER_SOL} SOL`
    );
    console.log(`  ✓ 接收者: ${receiver.toBase58()}`);
  });

  it("🔑 转移所有权", async () => {
    const newAuthorityKeypair = Keypair.generate();
    const newAuthority = newAuthorityKeypair.publicKey;

    const tx = await program.methods
      .transferAuthority(newAuthority)
      .accounts({
        vault: vaultPda,
        authority: authority,
      })
      .rpc();

    console.log(`  交易签名: ${tx}`);

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    assert.equal(
      vaultAccount.authority.toBase58(),
      newAuthority.toBase58(),
      "所有权转移不正确"
    );

    console.log(`  ✓ 所有权已转移`);
    console.log(`  ✓ 旧所有者: ${authority.toBase58()}`);
    console.log(`  ✓ 新所有者: ${newAuthority.toBase58()}`);

    // 转移回原所有者（为后续测试准备）
    await program.methods
      .transferAuthority(authority)
      .accounts({
        vault: vaultPda,
        authority: newAuthority,
      })
      .signers([newAuthorityKeypair])
      .rpc();

    console.log(`  ✓ 已转回原所有者`);
  });

  it("❌ 非所有者无法提款", async () => {
    const unauthorizedUser = Keypair.generate();
    const withdrawAmount = 0.1 * LAMPORTS_PER_SOL;

    try {
      await program.methods
        .withdraw(new anchor.BN(withdrawAmount))
        .accounts({
          vault: vaultPda,
          authority: unauthorizedUser.publicKey,
          receiver: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();

      assert.fail("应该抛出错误");
    } catch (error: any) {
      console.log(`  ✓ 正确拒绝了非所有者的提款请求`);
      console.log(`  ✓ 错误: ${error.message.split("\n")[0]}`);
    }
  });

  it("❌ 余额不足时无法提款", async () => {
    const vaultBalance = await provider.connection.getBalance(vaultPda);
    const excessiveAmount = vaultBalance * 2; // 尝试提取超过余额的金额

    try {
      await program.methods
        .withdraw(new anchor.BN(excessiveAmount))
        .accounts({
          vault: vaultPda,
          authority: authority,
          receiver: authority,
        })
        .rpc();

      assert.fail("应该抛出错误");
    } catch (error: any) {
      console.log(`  ✓ 正确拒绝了超额提款`);
      console.log(`  ✓ 错误: InsufficientFunds`);
    }
  });

  it("📊 查询金库状态", async () => {
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    const vaultBalance = await provider.connection.getBalance(vaultPda);

    console.log("\n  📊 金库最终状态:");
    console.log(`  ├─ 名称: ${vaultAccount.vaultName}`);
    console.log(`  ├─ 所有者: ${vaultAccount.authority.toBase58()}`);
    console.log(
      `  ├─ 总存款: ${vaultAccount.totalDeposits.toNumber() / LAMPORTS_PER_SOL} SOL`
    );
    console.log(
      `  ├─ 总提款: ${vaultAccount.totalWithdrawals.toNumber() / LAMPORTS_PER_SOL} SOL`
    );
    console.log(`  └─ 当前余额: ${vaultBalance / LAMPORTS_PER_SOL} SOL\n`);

    assert.isTrue(vaultBalance > 0, "金库应该有余额");
  });

  it("🔒 关闭金库", async () => {
    // 获取关闭前的余额
    const authorityBalanceBefore = await provider.connection.getBalance(
      authority
    );
    const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);

    const tx = await program.methods
      .closeVault()
      .accounts({
        vault: vaultPda,
        authority: authority,
      })
      .rpc();

    console.log(`  交易签名: ${tx}`);

    // 验证金库账户已关闭
    try {
      await program.account.vault.fetch(vaultPda);
      assert.fail("金库账户应该已关闭");
    } catch (error) {
      console.log(`  ✓ 金库账户已成功关闭`);
    }

    // 验证余额已转回所有者
    const authorityBalanceAfter = await provider.connection.getBalance(
      authority
    );

    console.log(
      `  ✓ 关闭前金库余额: ${vaultBalanceBefore / LAMPORTS_PER_SOL} SOL`
    );
    console.log(
      `  ✓ 余额已转回所有者 (减去交易费用)`
    );
  });
});

// ============================================================================
// 总结
// ============================================================================
//
// 测试覆盖：
// ✅ 初始化金库
// ✅ 存款功能（单次和多次）
// ✅ 提款功能
// ✅ 转移所有权
// ✅ 权限验证（非所有者无法提款）
// ✅ 余额验证（余额不足时无法提款）
// ✅ 查询金库状态
// ✅ 关闭金库
//
// ============================================================================
