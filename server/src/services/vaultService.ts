import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { solanaConfig } from "../config/solana";

/**
 * Vault 服务
 * 参考 client-ts/token-vault/index.ts
 */
export class VaultService {
  /**
   * 推导 Vault PDA
   */
  private deriveVaultPda(authority: PublicKey, vaultName: string) {
    const program = solanaConfig.vaultProgram;
    if (!program) throw new Error("Vault 程序未加载");

    const [vaultPda, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        authority.toBuffer(),
        Buffer.from(vaultName),
      ],
      program.programId
    );

    return { vaultPda, bump };
  }

  /**
   * 初始化金库
   */
  async initialize(authorityPublicKey: string, vaultName: string) {
    const program = solanaConfig.vaultProgram;
    if (!program) throw new Error("Vault 程序未加载");

    const authority = new PublicKey(authorityPublicKey);
    const { vaultPda } = this.deriveVaultPda(authority, vaultName);

    try {
      const tx = await (program.methods as any)
        .initialize(vaultName)
        .accounts({
          vault: vaultPda,
          authority: authority,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        vaultAddress: vaultPda.toBase58(),
        vaultName,
      };
    } catch (error: any) {
      throw new Error(`初始化金库失败: ${error.message}`);
    }
  }

  /**
   * 存款
   */
  async deposit(authorityPublicKey: string, vaultName: string, amount: number) {
    const program = solanaConfig.vaultProgram;
    if (!program) throw new Error("Vault 程序未加载");

    const authority = new PublicKey(authorityPublicKey);
    const { vaultPda } = this.deriveVaultPda(authority, vaultName);

    try {
      const amountLamports = new anchor.BN(amount * anchor.web3.LAMPORTS_PER_SOL);

      const tx = await (program.methods as any)
        .deposit(amountLamports)
        .accounts({
          vault: vaultPda,
          authority: authority,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        amount,
      };
    } catch (error: any) {
      throw new Error(`存款失败: ${error.message}`);
    }
  }

  /**
   * 取款
   */
  async withdraw(authorityPublicKey: string, vaultName: string, amount: number) {
    const program = solanaConfig.vaultProgram;
    if (!program) throw new Error("Vault 程序未加载");

    const authority = new PublicKey(authorityPublicKey);
    const { vaultPda } = this.deriveVaultPda(authority, vaultName);

    try {
      const amountLamports = new anchor.BN(amount * anchor.web3.LAMPORTS_PER_SOL);

      const tx = await (program.methods as any)
        .withdraw(amountLamports)
        .accounts({
          vault: vaultPda,
          authority: authority,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        amount,
      };
    } catch (error: any) {
      throw new Error(`取款失败: ${error.message}`);
    }
  }

  /**
   * 获取金库信息
   */
  async getVault(authorityPublicKey: string, vaultName: string) {
    const program = solanaConfig.vaultProgram;
    if (!program) throw new Error("Vault 程序未加载");

    const authority = new PublicKey(authorityPublicKey);
    const { vaultPda } = this.deriveVaultPda(authority, vaultName);

    try {
      const accountInfo = await solanaConfig.connection.getAccountInfo(vaultPda);

      if (!accountInfo) {
        return {
          exists: false,
          vaultAddress: vaultPda.toBase58(),
        };
      }

      const vaultAccount: any = await (program.account as any).vault.fetch(vaultPda);
      const balance = await solanaConfig.connection.getBalance(vaultPda);

      return {
        exists: true,
        vaultAddress: vaultPda.toBase58(),
        vaultName: vaultAccount.vaultName,
        authority: vaultAccount.originalAuthority.toBase58(),
        balance: balance / anchor.web3.LAMPORTS_PER_SOL,
        bump: vaultAccount.bump,
      };
    } catch (error: any) {
      throw new Error(`获取金库信息失败: ${error.message}`);
    }
  }

  /**
   * 关闭金库
   */
  async close(authorityPublicKey: string, vaultName: string) {
    const program = solanaConfig.vaultProgram;
    if (!program) throw new Error("Vault 程序未加载");

    const authority = new PublicKey(authorityPublicKey);
    const { vaultPda } = this.deriveVaultPda(authority, vaultName);

    try {
      const tx = await (program.methods as any)
        .closeVault()
        .accounts({
          vault: vaultPda,
          authority: authority,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
      };
    } catch (error: any) {
      throw new Error(`关闭金库失败: ${error.message}`);
    }
  }
}

export const vaultService = new VaultService();
