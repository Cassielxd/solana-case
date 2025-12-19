import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Solana 配置类
 * 管理所有 Solana 连接和程序实例
 */
export class SolanaConfig {
  public connection: Connection;
  public wallet: anchor.Wallet;
  public provider: anchor.AnchorProvider;

  // 程序 IDs
  public counterProgramId: PublicKey;
  public vaultProgramId: PublicKey;
  public profileProgramId: PublicKey;
  public ammProgramId: PublicKey;

  // 程序实例
  public counterProgram: anchor.Program | null = null;
  public vaultProgram: anchor.Program | null = null;
  public profileProgram: anchor.Program | null = null;
  public ammProgram: anchor.Program | null = null;

  constructor() {
    // 初始化连接
    const rpcUrl = process.env.SOLANA_RPC_URL || "http://127.0.0.1:8899";
    this.connection = new Connection(rpcUrl, "confirmed");

    // 加载钱包
    const walletPath =
      process.env.WALLET_PATH || path.join(os.homedir(), ".config/solana/id.json");
    const keypair = this.loadKeypair(walletPath);
    this.wallet = new anchor.Wallet(keypair);

    // 创建 Provider
    this.provider = new anchor.AnchorProvider(this.connection, this.wallet, {
      commitment: "confirmed",
    });
    anchor.setProvider(this.provider);

    // 设置程序 IDs
    this.counterProgramId = new PublicKey(
      process.env.PROGRAM_ID_COUNTER || "MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj"
    );
    this.vaultProgramId = new PublicKey(
      process.env.PROGRAM_ID_VAULT || "FukTyMfW3YnifZmVD66Y26nXECk68HNbpQ4DfifU16wZ"
    );
    this.profileProgramId = new PublicKey(
      process.env.PROGRAM_ID_PROFILE || "3cSw9RozRy2bUVsB5PhBGKFHoy4CYCReEB99FmW1eUHL"
    );
    this.ammProgramId = new PublicKey(
      process.env.PROGRAM_ID_AMM || "49CJcqADMbvtbEn4ZCuEJakif6wsue4RAaPrSp5SfdEB"
    );

    console.log("✅ Solana 配置已初始化");
    console.log("  RPC:", rpcUrl);
    console.log("  钱包:", this.wallet.publicKey.toBase58());
  }

  /**
   * 加载钱包密钥对
   */
  private loadKeypair(filepath: string): Keypair {
    const fullPath = filepath.startsWith("~")
      ? filepath.replace("~", os.homedir())
      : filepath;

    const secretKeyString = fs.readFileSync(fullPath, "utf-8");
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey);
  }

  /**
   * 加载程序 IDL 并创建程序实例
   */
  public async loadPrograms() {
    try {
      // 加载 Counter 程序
      const counterIdl = await this.loadIdl("my_project");
      if (counterIdl) {
        this.counterProgram = new anchor.Program(
          counterIdl as any,
          this.provider
        );
        console.log("  ✅ Counter 程序已加载");
      }

      // 加载 Vault 程序
      const vaultIdl = await this.loadIdl("token_vault");
      if (vaultIdl) {
        this.vaultProgram = new anchor.Program(
          vaultIdl as any,
          this.provider
        );
        console.log("  ✅ Vault 程序已加载");
      }

      // 加载 Profile 程序
      const profileIdl = await this.loadIdl("user_profile");
      if (profileIdl) {
        this.profileProgram = new anchor.Program(
          profileIdl as any,
          this.provider
        );
        console.log("  ✅ Profile 程序已加载");
      }

      // 加载 AMM 程序
      const ammIdl = await this.loadIdl("simple_amm");
      if (ammIdl) {
        this.ammProgram = new anchor.Program(
          ammIdl as any,
          this.provider
        );
        console.log("  ✅ AMM 程序已加载");
      }
    } catch (error) {
      console.error("❌ 加载程序失败:", error);
      throw error;
    }
  }

  /**
   * 加载 IDL 文件
   */
  private async loadIdl(programName: string): Promise<any> {
    try {
      const idlPath = path.join(
        __dirname,
        "../../../target/idl",
        `${programName}.json`
      );
      const idlString = fs.readFileSync(idlPath, "utf-8");
      return JSON.parse(idlString);
    } catch (error) {
      console.warn(`  ⚠️  无法加载 ${programName} IDL:`, error);
      return null;
    }
  }

  /**
   * 获取钱包余额
   */
  public async getBalance(publicKey?: PublicKey): Promise<number> {
    const key = publicKey || this.wallet.publicKey;
    const balance = await this.connection.getBalance(key);
    return balance / anchor.web3.LAMPORTS_PER_SOL;
  }
}

// 导出单例
export const solanaConfig = new SolanaConfig();
