import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { solanaConfig } from "../config/solana";

/**
 * Counter 服务
 * 处理计数器相关的所有操作
 */
export class CounterService {
  /**
   * 初始化计数器
   */
  async initialize(userPublicKey: string) {
    const program = solanaConfig.counterProgram;
    if (!program) throw new Error("Counter 程序未加载");

    const user = new PublicKey(userPublicKey);

    // 推导 Counter PDA
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), user.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          counter: counterPda,
          user: user,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        counterAddress: counterPda.toBase58(),
      };
    } catch (error: any) {
      throw new Error(`初始化失败: ${error.message}`);
    }
  }

  /**
   * 增加计数
   */
  async increment(userPublicKey: string) {
    const program = solanaConfig.counterProgram;
    if (!program) throw new Error("Counter 程序未加载");

    const user = new PublicKey(userPublicKey);
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), user.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods
        .increment()
        .accounts({
          counter: counterPda,
          user: user,
        })
        .rpc();

      // 获取更新后的计数
      const counterData = await this.getCounter(userPublicKey);

      return {
        success: true,
        signature: tx,
        count: counterData.count,
      };
    } catch (error: any) {
      throw new Error(`增加计数失败: ${error.message}`);
    }
  }

  /**
   * 减少计数
   */
  async decrement(userPublicKey: string) {
    const program = solanaConfig.counterProgram;
    if (!program) throw new Error("Counter 程序未加载");

    const user = new PublicKey(userPublicKey);
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), user.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods
        .decrement()
        .accounts({
          counter: counterPda,
          user: user,
        })
        .rpc();

      const counterData = await this.getCounter(userPublicKey);

      return {
        success: true,
        signature: tx,
        count: counterData.count,
      };
    } catch (error: any) {
      throw new Error(`减少计数失败: ${error.message}`);
    }
  }

  /**
   * 获取计数器数据
   */
  async getCounter(userPublicKey: string) {
    const program = solanaConfig.counterProgram;
    if (!program) throw new Error("Counter 程序未加载");

    const user = new PublicKey(userPublicKey);
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), user.toBuffer()],
      program.programId
    );

    try {
      const counter: any = await (program.account as any).counter.fetch(counterPda);
      return {
        address: counterPda.toBase58(),
        count: counter.count.toString(),
        owner: counter.authority.toBase58(),
      };
    } catch (error: any) {
      // 计数器可能不存在
      return {
        address: counterPda.toBase58(),
        count: null,
        owner: user.toBase58(),
        exists: false,
      };
    }
  }
}

export const counterService = new CounterService();
