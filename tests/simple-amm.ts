import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SimpleAmm } from "../target/types/simple_amm";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("simple-amm", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.simpleAmm as Program<SimpleAmm>;
  const payer = provider.wallet as anchor.Wallet;

  // Test tokens
  let tokenAMint: PublicKey;
  let tokenBMint: PublicKey;

  // Pool accounts
  let poolPda: PublicKey;
  let lpMintPda: PublicKey;
  let poolTokenAPda: PublicKey;
  let poolTokenBPda: PublicKey;

  // User token accounts
  let userTokenA: PublicKey;
  let userTokenB: PublicKey;
  let userLpToken: PublicKey;

  // Test amounts
  const INITIAL_MINT_AMOUNT = 1000 * 1e6; // 1000 tokens with 6 decimals
  const DEPOSIT_AMOUNT_A = 100 * 1e6; // 100 tokens
  const DEPOSIT_AMOUNT_B = 200 * 1e6; // 200 tokens

  before(async () => {
    console.log("\n🚀 Setting up test environment...\n");

    // Create token A
    console.log("Creating Token A...");
    tokenAMint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      6 // 6 decimals
    );
    console.log("Token A Mint:", tokenAMint.toBase58());

    // Create token B
    console.log("Creating Token B...");
    tokenBMint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      6 // 6 decimals
    );
    console.log("Token B Mint:", tokenBMint.toBase58());

    // Create user token accounts
    console.log("\nCreating user token accounts...");
    const userTokenAAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      tokenAMint,
      payer.publicKey
    );
    userTokenA = userTokenAAccount.address;
    console.log("User Token A:", userTokenA.toBase58());

    const userTokenBAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      tokenBMint,
      payer.publicKey
    );
    userTokenB = userTokenBAccount.address;
    console.log("User Token B:", userTokenB.toBase58());

    // Mint tokens to user
    console.log("\nMinting tokens to user...");
    await mintTo(
      provider.connection,
      payer.payer,
      tokenAMint,
      userTokenA,
      payer.publicKey,
      INITIAL_MINT_AMOUNT
    );
    console.log(`Minted ${INITIAL_MINT_AMOUNT / 1e6} Token A`);

    await mintTo(
      provider.connection,
      payer.payer,
      tokenBMint,
      userTokenB,
      payer.publicKey,
      INITIAL_MINT_AMOUNT
    );
    console.log(`Minted ${INITIAL_MINT_AMOUNT / 1e6} Token B`);

    // Derive PDAs
    console.log("\nDeriving PDAs...");
    [poolPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        tokenAMint.toBuffer(),
        tokenBMint.toBuffer(),
      ],
      program.programId
    );
    console.log("Pool PDA:", poolPda.toBase58());

    [lpMintPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("lp_mint"),
        tokenAMint.toBuffer(),
        tokenBMint.toBuffer(),
      ],
      program.programId
    );
    console.log("LP Mint PDA:", lpMintPda.toBase58());

    [poolTokenAPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool_token_a"), poolPda.toBuffer()],
      program.programId
    );
    console.log("Pool Token A PDA:", poolTokenAPda.toBase58());

    [poolTokenBPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool_token_b"), poolPda.toBuffer()],
      program.programId
    );
    console.log("Pool Token B PDA:", poolTokenBPda.toBase58());

    console.log("\n✅ Test environment setup complete!\n");
  });

  it("Initializes the pool", async () => {
    console.log("\n=== Test: Initialize Pool ===\n");

    const tx = await program.methods
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

    console.log("Transaction signature:", tx);

    // Fetch and verify pool data
    const pool = await program.account.pool.fetch(poolPda);
    console.log("\nPool initialized:");
    console.log("  Token A Mint:", pool.tokenAMint.toBase58());
    console.log("  Token B Mint:", pool.tokenBMint.toBase58());
    console.log("  LP Mint:", pool.lpMint.toBase58());
    console.log("  Total LP Supply:", pool.totalLpSupply.toString());

    assert.equal(
      pool.tokenAMint.toBase58(),
      tokenAMint.toBase58(),
      "Token A mint mismatch"
    );
    assert.equal(
      pool.tokenBMint.toBase58(),
      tokenBMint.toBase58(),
      "Token B mint mismatch"
    );
    assert.equal(
      pool.totalLpSupply.toNumber(),
      0,
      "Initial LP supply should be 0"
    );
  });

  it("Deposits liquidity (initial)", async () => {
    console.log("\n=== Test: Deposit Liquidity (Initial) ===\n");

    // Create user LP token account (must be after pool initialization)
    const lpTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      lpMintPda,
      payer.publicKey,
      true // allowOwnerOffCurve for PDA mint
    );
    userLpToken = lpTokenAccount.address;
    console.log("User LP Token:", userLpToken.toBase58());

    const amountA = new anchor.BN(DEPOSIT_AMOUNT_A);
    const amountB = new anchor.BN(DEPOSIT_AMOUNT_B);
    const minLpTokens = new anchor.BN(0);

    console.log(`Depositing ${amountA.toNumber() / 1e6} Token A`);
    console.log(`Depositing ${amountB.toNumber() / 1e6} Token B`);

    const tx = await program.methods
      .depositLiquidity(amountA, amountB, minLpTokens)
      .accountsPartial({
        pool: poolPda,
        lpMint: lpMintPda,
        poolTokenA: poolTokenAPda,
        poolTokenB: poolTokenBPda,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        userLpToken: userLpToken,
        user: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    // Verify pool reserves
    const poolTokenAAccount = await getAccount(
      provider.connection,
      poolTokenAPda
    );
    const poolTokenBAccount = await getAccount(
      provider.connection,
      poolTokenBPda
    );

    console.log("\nPool reserves:");
    console.log(
      "  Token A:",
      Number(poolTokenAAccount.amount) / 1e6,
      "tokens"
    );
    console.log(
      "  Token B:",
      Number(poolTokenBAccount.amount) / 1e6,
      "tokens"
    );

    assert.equal(
      Number(poolTokenAAccount.amount),
      DEPOSIT_AMOUNT_A,
      "Pool Token A amount mismatch"
    );
    assert.equal(
      Number(poolTokenBAccount.amount),
      DEPOSIT_AMOUNT_B,
      "Pool Token B amount mismatch"
    );

    // Verify LP tokens minted
    let lpAccount = await getAccount(
      provider.connection,
      userLpToken
    );
    console.log(
      "  LP Tokens minted:",
      Number(lpAccount.amount) / 1e6
    );

    assert.isTrue(
      Number(lpAccount.amount) > 0,
      "LP tokens should be minted"
    );

    // Verify pool state
    const pool = await program.account.pool.fetch(poolPda);
    console.log("  Total LP Supply:", pool.totalLpSupply.toNumber() / 1e6);

    assert.equal(
      pool.totalLpSupply.toNumber(),
      Number(lpAccount.amount),
      "Total LP supply mismatch"
    );
  });

  it("Swaps token A for token B", async () => {
    console.log("\n=== Test: Swap A -> B ===\n");

    const swapAmount = new anchor.BN(10 * 1e6); // 10 tokens
    const minAmountOut = new anchor.BN(0);

    // Get balances before swap
    const userTokenABefore = await getAccount(provider.connection, userTokenA);
    const userTokenBBefore = await getAccount(provider.connection, userTokenB);

    console.log(`Swapping ${swapAmount.toNumber() / 1e6} Token A for Token B`);
    console.log(
      "User Token A before:",
      Number(userTokenABefore.amount) / 1e6
    );
    console.log(
      "User Token B before:",
      Number(userTokenBBefore.amount) / 1e6
    );

    const tx = await program.methods
      .swap(swapAmount, minAmountOut, true) // true = A to B
      .accountsPartial({
        pool: poolPda,
        poolTokenA: poolTokenAPda,
        poolTokenB: poolTokenBPda,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        user: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    // Get balances after swap
    const userTokenAAfter = await getAccount(provider.connection, userTokenA);
    const userTokenBAfter = await getAccount(provider.connection, userTokenB);

    const tokenASpent =
      Number(userTokenABefore.amount) - Number(userTokenAAfter.amount);
    const tokenBReceived =
      Number(userTokenBAfter.amount) - Number(userTokenBBefore.amount);

    console.log("\nSwap results:");
    console.log("  Token A spent:", tokenASpent / 1e6);
    console.log("  Token B received:", tokenBReceived / 1e6);
    console.log(
      "  Effective rate:",
      (tokenBReceived / tokenASpent).toFixed(4)
    );

    assert.equal(tokenASpent, swapAmount.toNumber(), "Token A spent mismatch");
    assert.isTrue(tokenBReceived > 0, "Should receive Token B");
  });

  it("Swaps token B for token A", async () => {
    console.log("\n=== Test: Swap B -> A ===\n");

    const swapAmount = new anchor.BN(20 * 1e6); // 20 tokens
    const minAmountOut = new anchor.BN(0);

    // Get balances before swap
    const userTokenABefore = await getAccount(provider.connection, userTokenA);
    const userTokenBBefore = await getAccount(provider.connection, userTokenB);

    console.log(`Swapping ${swapAmount.toNumber() / 1e6} Token B for Token A`);
    console.log(
      "User Token A before:",
      Number(userTokenABefore.amount) / 1e6
    );
    console.log(
      "User Token B before:",
      Number(userTokenBBefore.amount) / 1e6
    );

    const tx = await program.methods
      .swap(swapAmount, minAmountOut, false) // false = B to A
      .accountsPartial({
        pool: poolPda,
        poolTokenA: poolTokenAPda,
        poolTokenB: poolTokenBPda,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        user: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    // Get balances after swap
    const userTokenAAfter = await getAccount(provider.connection, userTokenA);
    const userTokenBAfter = await getAccount(provider.connection, userTokenB);

    const tokenBSpent =
      Number(userTokenBBefore.amount) - Number(userTokenBAfter.amount);
    const tokenAReceived =
      Number(userTokenAAfter.amount) - Number(userTokenABefore.amount);

    console.log("\nSwap results:");
    console.log("  Token B spent:", tokenBSpent / 1e6);
    console.log("  Token A received:", tokenAReceived / 1e6);
    console.log(
      "  Effective rate:",
      (tokenAReceived / tokenBSpent).toFixed(4)
    );

    assert.equal(tokenBSpent, swapAmount.toNumber(), "Token B spent mismatch");
    assert.isTrue(tokenAReceived > 0, "Should receive Token A");
  });

  it("Deposits additional liquidity", async () => {
    console.log("\n=== Test: Deposit Additional Liquidity ===\n");

    const amountA = new anchor.BN(50 * 1e6); // 50 tokens
    const amountB = new anchor.BN(100 * 1e6); // 100 tokens
    const minLpTokens = new anchor.BN(0);

    // Get LP balance before
    const userLpBefore = await getAccount(provider.connection, userLpToken);

    console.log(`Depositing ${amountA.toNumber() / 1e6} Token A`);
    console.log(`Depositing ${amountB.toNumber() / 1e6} Token B`);
    console.log("LP tokens before:", Number(userLpBefore.amount) / 1e6);

    const tx = await program.methods
      .depositLiquidity(amountA, amountB, minLpTokens)
      .accountsPartial({
        pool: poolPda,
        lpMint: lpMintPda,
        poolTokenA: poolTokenAPda,
        poolTokenB: poolTokenBPda,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        userLpToken: userLpToken,
        user: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    // Get LP balance after
    const userLpAfter = await getAccount(provider.connection, userLpToken);
    const lpMinted =
      Number(userLpAfter.amount) - Number(userLpBefore.amount);

    console.log("\nDeposit results:");
    console.log("  LP tokens minted:", lpMinted / 1e6);
    console.log("  LP tokens after:", Number(userLpAfter.amount) / 1e6);

    assert.isTrue(lpMinted > 0, "Should mint LP tokens");
  });

  it("Withdraws liquidity", async () => {
    console.log("\n=== Test: Withdraw Liquidity ===\n");

    // Get current LP balance
    const userLpBefore = await getAccount(provider.connection, userLpToken);
    const lpToWithdraw = new anchor.BN(Number(userLpBefore.amount) / 2); // Withdraw half

    const minAmountA = new anchor.BN(0);
    const minAmountB = new anchor.BN(0);

    // Get token balances before
    const userTokenABefore = await getAccount(provider.connection, userTokenA);
    const userTokenBBefore = await getAccount(provider.connection, userTokenB);

    console.log(`Withdrawing ${lpToWithdraw.toNumber() / 1e6} LP tokens`);
    console.log(
      "User Token A before:",
      Number(userTokenABefore.amount) / 1e6
    );
    console.log(
      "User Token B before:",
      Number(userTokenBBefore.amount) / 1e6
    );

    const tx = await program.methods
      .withdrawLiquidity(lpToWithdraw, minAmountA, minAmountB)
      .accountsPartial({
        pool: poolPda,
        lpMint: lpMintPda,
        poolTokenA: poolTokenAPda,
        poolTokenB: poolTokenBPda,
        userTokenA: userTokenA,
        userTokenB: userTokenB,
        userLpToken: userLpToken,
        user: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    // Get balances after
    const userTokenAAfter = await getAccount(provider.connection, userTokenA);
    const userTokenBAfter = await getAccount(provider.connection, userTokenB);
    const userLpAfter = await getAccount(provider.connection, userLpToken);

    const tokenAReceived =
      Number(userTokenAAfter.amount) - Number(userTokenABefore.amount);
    const tokenBReceived =
      Number(userTokenBAfter.amount) - Number(userTokenBBefore.amount);
    const lpBurned =
      Number(userLpBefore.amount) - Number(userLpAfter.amount);

    console.log("\nWithdraw results:");
    console.log("  LP tokens burned:", lpBurned / 1e6);
    console.log("  Token A received:", tokenAReceived / 1e6);
    console.log("  Token B received:", tokenBReceived / 1e6);
    console.log("  LP tokens remaining:", Number(userLpAfter.amount) / 1e6);

    assert.equal(
      lpBurned,
      lpToWithdraw.toNumber(),
      "LP tokens burned mismatch"
    );
    assert.isTrue(tokenAReceived > 0, "Should receive Token A");
    assert.isTrue(tokenBReceived > 0, "Should receive Token B");
  });

  it("Tests slippage protection on swap", async () => {
    console.log("\n=== Test: Slippage Protection ===\n");

    const swapAmount = new anchor.BN(5 * 1e6);
    const unrealisticMinOut = new anchor.BN(1000 * 1e6); // Unrealistically high

    console.log(`Attempting swap with unrealistic minimum output`);

    try {
      await program.methods
        .swap(swapAmount, unrealisticMinOut, true)
        .accountsPartial({
          pool: poolPda,
          poolTokenA: poolTokenAPda,
          poolTokenB: poolTokenBPda,
          userTokenA: userTokenA,
          userTokenB: userTokenB,
          user: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      assert.fail("Should have failed due to slippage");
    } catch (error: any) {
      console.log("✅ Swap correctly failed with slippage protection");
      assert.include(
        error.toString(),
        "SlippageExceeded",
        "Should fail with SlippageExceeded error"
      );
    }
  });

  it("Displays final pool state", async () => {
    console.log("\n=== Final Pool State ===\n");

    const pool = await program.account.pool.fetch(poolPda);
    const poolTokenA = await getAccount(provider.connection, poolTokenAPda);
    const poolTokenB = await getAccount(provider.connection, poolTokenBPda);
    const userLp = await getAccount(provider.connection, userLpToken);

    console.log("Pool Information:");
    console.log("  Token A Reserve:", Number(poolTokenA.amount) / 1e6);
    console.log("  Token B Reserve:", Number(poolTokenB.amount) / 1e6);
    console.log("  Total LP Supply:", pool.totalLpSupply.toNumber() / 1e6);
    console.log("  User LP Balance:", Number(userLp.amount) / 1e6);
    console.log(
      "  Constant Product (k):",
      ((Number(poolTokenA.amount) * Number(poolTokenB.amount)) / 1e12).toFixed(
        2
      )
    );
  });
});
