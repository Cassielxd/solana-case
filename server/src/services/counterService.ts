import { PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { solanaConfig } from "../config/solana";
import * as fs from "fs";
import * as path from "path";

/**
 * Counter 服务 - 使用 Keypair 方式（匹配实际程序）
 */
export class CounterService {
  private counterKeypairPath: string;

  constructor() {
    // Counter keypair 存储路径
    this.counterKeypairPath = path.join(
      __dirname,
      "../../.counter-keypair.json"
    );
  }

  /**
   * 获取或创建 counter keypair
   */
  private getCounterKeypair(): Keypair {
    if (fs.existsSync(this.counterKeypairPath)) {
      // 加载现有的 keypair
      const secretKeyString = fs.readFileSync(this.counterKeypairPath, "utf-8");
      const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
      return Keypair.fromSecretKey(secretKey);
    } else {
      // 创建新的 keypair
      const keypair = Keypair.generate();
      const secretKey = Array.from(keypair.secretKey);
      fs.writeFileSync(this.counterKeypairPath, JSON.stringify(secretKey));
      console.log(
        `  ✅ 创建新的 Counter Keypair: ${keypair.publicKey.toBase58()}`
      );
      return keypair;
    }
  }

  /**
   * 重置 counter (删除 keypair 文件)
   */
  resetCounter() {
    if (fs.existsSync(this.counterKeypairPath)) {
      fs.unlinkSync(this.counterKeypairPath);
      console.log("  ✅ Counter keypair 已删除");
    }
  }

  /**
   * 初始化计数器
   */
  async initialize(userPublicKey: string) {
    console.log("🔄 开始初始化计数器...");
    const program = solanaConfig.counterProgram;
    if (!program) throw new Error("Counter 程序未加载");

    const user = new PublicKey(userPublicKey);
    const counterKeypair = this.getCounterKeypair();

    console.log("  Counter 地址:", counterKeypair.publicKey.toBase58());
    console.log("  User 地址:", user.toBase58());

    // 检查 counter 是否已经存在
    try {
      const existingCounter = await solanaConfig.connection.getAccountInfo(
        counterKeypair.publicKey
      );
      if (existingCounter) {
        console.log("ℹ️  Counter 已经初始化，返回现有地址");
        return {
          success: true,
          signature: "already_exists",
          counterAddress: counterKeypair.publicKey.toBase58(),
          message: "Counter 已经存在"
        };
      }
    } catch (e) {
      console.log("  检查现有 counter 时出错，继续初始化...");
    }

    try {
      console.log("  📝 构建交易...");

      const tx = await (program.methods as any)
        .initialize()
        .accounts({
          counter: counterKeypair.publicKey,
          user: user,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([counterKeypair])
        .rpc();

      console.log("✅ 初始化成功! 签名:", tx);
      return {
        success: true,
        signature: tx,
        counterAddress: counterKeypair.publicKey.toBase58(),
      };
    } catch (error: any) {
      console.error("❌ 初始化失败:", error.message);
      if (error.logs) {
        console.error("程序日志:", error.logs);
      }
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
    const counterKeypair = this.getCounterKeypair();

    try {
      const tx = await (program.methods as any)
        .increment()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: user,
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
    const counterKeypair = this.getCounterKeypair();

    try {
      const tx = await (program.methods as any)
        .decrement()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: user,
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
    const counterKeypair = this.getCounterKeypair();

    try {
      const counter: any = await (program.account as any).counter.fetch(
        counterKeypair.publicKey
      );
      return {
        address: counterKeypair.publicKey.toBase58(),
        count: counter.count.toString(),
        owner: counter.authority.toBase58(),
        exists: true,
      };
    } catch (error: any) {
      // 计数器可能不存在
      return {
        address: counterKeypair.publicKey.toBase58(),
        count: null,
        owner: user.toBase58(),
        exists: false,
      };
    }
  }
}

export const counterService = new CounterService();
