import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { solanaConfig } from "../config/solana";

/**
 * AMM 服务
 * 处理自动做市商相关的所有操作
 */
export class AmmService {
  /**
   * 获取流动性池信息
   */
  async getPool(tokenAMint: string, tokenBMint: string) {
    const program = solanaConfig.ammProgram;
    if (!program) throw new Error("AMM 程序未加载");

    const tokenA = new PublicKey(tokenAMint);
    const tokenB = new PublicKey(tokenBMint);

    // 推导 PDA
    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenA.toBuffer(), tokenB.toBuffer()],
      program.programId
    );

    const [lpMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("lp_mint"), tokenA.toBuffer(), tokenB.toBuffer()],
      program.programId
    );

    const [poolTokenAPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool_token_a"), poolPda.toBuffer()],
      program.programId
    );

    const [poolTokenBPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool_token_b"), poolPda.toBuffer()],
      program.programId
    );

    try {
      // 获取池数据
      const pool: any = await (program.account as any).pool.fetch(poolPda);

      // 获取储备量
      const poolTokenA = await getAccount(solanaConfig.connection, poolTokenAPda);
      const poolTokenB = await getAccount(solanaConfig.connection, poolTokenBPda);

      return {
        address: poolPda.toBase58(),
        tokenAMint: pool.tokenAMint.toBase58(),
        tokenBMint: pool.tokenBMint.toBase58(),
        lpMint: pool.lpMint.toBase58(),
        reserveA: poolTokenA.amount.toString(),
        reserveB: poolTokenB.amount.toString(),
        totalLpSupply: pool.totalLpSupply.toString(),
        priceRatio: Number(poolTokenB.amount) / Number(poolTokenA.amount),
      };
    } catch (error: any) {
      return {
        address: poolPda.toBase58(),
        exists: false,
        message: "池不存在",
      };
    }
  }

  /**
   * 初始化流动性池
   */
  async initializePool(
    tokenAMint: string,
    tokenBMint: string,
    payerPublicKey: string
  ) {
    const program = solanaConfig.ammProgram;
    if (!program) throw new Error("AMM 程序未加载");

    const tokenA = new PublicKey(tokenAMint);
    const tokenB = new PublicKey(tokenBMint);
    const payer = new PublicKey(payerPublicKey);

    // 推导 PDA
    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenA.toBuffer(), tokenB.toBuffer()],
      program.programId
    );

    const [lpMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("lp_mint"), tokenA.toBuffer(), tokenB.toBuffer()],
      program.programId
    );

    const [poolTokenAPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool_token_a"), poolPda.toBuffer()],
      program.programId
    );

    const [poolTokenBPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool_token_b"), poolPda.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods
        .initializePool()
        .accounts({
          pool: poolPda,
          lpMint: lpMintPda,
          tokenAMint: tokenA,
          tokenBMint: tokenB,
          poolTokenA: poolTokenAPda,
          poolTokenB: poolTokenBPda,
          payer: payer,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        poolAddress: poolPda.toBase58(),
        lpMint: lpMintPda.toBase58(),
      };
    } catch (error: any) {
      throw new Error(`初始化池失败: ${error.message}`);
    }
  }

  /**
   * 计算交换输出量
   */
  calculateSwapOutput(amountIn: number, reserveIn: number, reserveOut: number): number {
    // 使用恒定乘积公式 x * y = k
    // 扣除 0.3% 手续费
    const FEE_NUMERATOR = 3;
    const FEE_DENOMINATOR = 1000;

    const amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;

    return Math.floor(numerator / denominator);
  }

  /**
   * 获取交换报价
   */
  async getSwapQuote(
    tokenAMint: string,
    tokenBMint: string,
    amountIn: number,
    isAToB: boolean
  ) {
    const poolInfo = await this.getPool(tokenAMint, tokenBMint);

    if (!poolInfo.reserveA || !poolInfo.reserveB) {
      throw new Error("池不存在或无流动性");
    }

    const reserveA = Number(poolInfo.reserveA);
    const reserveB = Number(poolInfo.reserveB);

    let amountOut: number;
    let priceImpact: number;

    if (isAToB) {
      amountOut = this.calculateSwapOutput(amountIn, reserveA, reserveB);
      priceImpact = (amountIn / reserveA) * 100;
    } else {
      amountOut = this.calculateSwapOutput(amountIn, reserveB, reserveA);
      priceImpact = (amountIn / reserveB) * 100;
    }

    const effectivePrice = amountOut / amountIn;

    return {
      amountIn,
      amountOut,
      effectivePrice,
      priceImpact: priceImpact.toFixed(2) + "%",
      fee: (amountIn * 0.003).toFixed(6),
      minimumReceived: Math.floor(amountOut * 0.99), // 1% 滑点容忍
    };
  }
}

export const ammService = new AmmService();
