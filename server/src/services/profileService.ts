import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { solanaConfig } from "../config/solana";

/**
 * User Profile 服务
 * 参考 client-ts/user-profile/index.ts (集中式管理员模式)
 */
export class ProfileService {
  /**
   * 推导 User Profile PDA
   */
  private deriveProfilePda(admin: PublicKey, userId: string) {
    const program = solanaConfig.profileProgram;
    if (!program) throw new Error("Profile 程序未加载");

    const [profilePda, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-profile"),
        admin.toBuffer(),
        Buffer.from(userId),
      ],
      program.programId
    );

    return { profilePda, bump };
  }

  /**
   * 创建用户资料
   */
  async createProfile(
    adminPublicKey: string,
    userId: string,
    username: string,
    email: string,
    age: number,
    bio: string
  ) {
    const program = solanaConfig.profileProgram;
    if (!program) throw new Error("Profile 程序未加载");

    const admin = new PublicKey(adminPublicKey);
    const { profilePda } = this.deriveProfilePda(admin, userId);

    try {
      const tx = await (program.methods as any)
        .createProfile(userId, username, email, age, bio)
        .accounts({
          userProfile: profilePda,
          admin: admin,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        profileAddress: profilePda.toBase58(),
        userId,
      };
    } catch (error: any) {
      throw new Error(`创建资料失败: ${error.message}`);
    }
  }

  /**
   * 更新用户资料
   */
  async updateProfile(
    adminPublicKey: string,
    userId: string,
    username?: string,
    email?: string,
    age?: number,
    bio?: string
  ) {
    const program = solanaConfig.profileProgram;
    if (!program) throw new Error("Profile 程序未加载");

    const admin = new PublicKey(adminPublicKey);
    const { profilePda } = this.deriveProfilePda(admin, userId);

    try {
      const tx = await (program.methods as any)
        .updateProfile(
          userId,
          username || null,
          email || null,
          age !== undefined ? age : null,
          bio || null
        )
        .accounts({
          userProfile: profilePda,
          admin: admin,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        profileAddress: profilePda.toBase58(),
      };
    } catch (error: any) {
      throw new Error(`更新资料失败: ${error.message}`);
    }
  }

  /**
   * 获取用户资料
   */
  async getProfile(adminPublicKey: string, userId: string) {
    const program = solanaConfig.profileProgram;
    if (!program) throw new Error("Profile 程序未加载");

    const admin = new PublicKey(adminPublicKey);
    const { profilePda } = this.deriveProfilePda(admin, userId);

    try {
      const accountInfo = await solanaConfig.connection.getAccountInfo(profilePda);

      if (!accountInfo) {
        return {
          exists: false,
          profileAddress: profilePda.toBase58(),
        };
      }

      const profile: any = await (program.account as any).userProfile.fetch(profilePda);

      return {
        exists: true,
        profileAddress: profilePda.toBase58(),
        admin: profile.admin.toBase58(),
        userId: profile.userId,
        username: profile.username,
        email: profile.email,
        age: profile.age,
        bio: profile.bio,
        createdAt: profile.createdAt.toNumber(),
        updatedAt: profile.updatedAt.toNumber(),
      };
    } catch (error: any) {
      throw new Error(`获取资料失败: ${error.message}`);
    }
  }

  /**
   * 删除用户资料
   */
  async deleteProfile(adminPublicKey: string, userId: string) {
    const program = solanaConfig.profileProgram;
    if (!program) throw new Error("Profile 程序未加载");

    const admin = new PublicKey(adminPublicKey);
    const { profilePda } = this.deriveProfilePda(admin, userId);

    try {
      const tx = await (program.methods as any)
        .deleteProfile(userId)
        .accounts({
          userProfile: profilePda,
          admin: admin,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
      };
    } catch (error: any) {
      throw new Error(`删除资料失败: ${error.message}`);
    }
  }
}

export const profileService = new ProfileService();
