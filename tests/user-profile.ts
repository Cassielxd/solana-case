import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UserProfile } from "../target/types/user_profile";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("user-profile", () => {
  // 配置客户端使用本地集群
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.UserProfile as Program<UserProfile>;
  const authority = provider.wallet.publicKey;

  // 计算用户资料 PDA
  let userProfilePda: PublicKey;
  let bump: number;

  before(() => {
    [userProfilePda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("user-profile"), authority.toBuffer()],
      program.programId
    );
  });

  it("创建用户资料", async () => {
    const username = "test_user";
    const email = "test@example.com";
    const age = 25;
    const bio = "This is a test bio";

    const tx = await program.methods
      .createProfile(username, email, age, bio)
      .accountsPartial({
        userProfile: userProfilePda,
        authority: authority,
      })
      .rpc();

    console.log("创建交易:", tx);

    // 验证用户资料
    const profile = await program.account.userProfile.fetch(userProfilePda);
    assert.equal(profile.username, username);
    assert.equal(profile.email, email);
    assert.equal(profile.age, age);
    assert.equal(profile.bio, bio);
    assert.ok(profile.authority.equals(authority));
  });

  it("更新用户资料（部分字段）", async () => {
    const newAge = 26;
    const newBio = "Updated bio";

    await program.methods
      .updateProfile(null, null, newAge, newBio)
      .accountsPartial({
        userProfile: userProfilePda,
        authority: authority,
      })
      .rpc();

    const profile = await program.account.userProfile.fetch(userProfilePda);
    assert.equal(profile.age, newAge);
    assert.equal(profile.bio, newBio);
    assert.equal(profile.username, "test_user"); // 未更新
    assert.equal(profile.email, "test@example.com"); // 未更新
  });

  it("更新用户资料（全量更新）", async () => {
    const newUsername = "new_user";
    const newEmail = "new@example.com";
    const newAge = 30;
    const newBio = "Completely new bio";

    await program.methods
      .updateProfile(newUsername, newEmail, newAge, newBio)
      .accountsPartial({
        userProfile: userProfilePda,
        authority: authority,
      })
      .rpc();

    const profile = await program.account.userProfile.fetch(userProfilePda);
    assert.equal(profile.username, newUsername);
    assert.equal(profile.email, newEmail);
    assert.equal(profile.age, newAge);
    assert.equal(profile.bio, newBio);
  });

  it("删除用户资料", async () => {
    await program.methods
      .deleteProfile()
      .accountsPartial({
        userProfile: userProfilePda,
        authority: authority,
      })
      .rpc();

    // 验证账户已删除
    try {
      await program.account.userProfile.fetch(userProfilePda);
      assert.fail("账户应该已被删除");
    } catch (error) {
      // 预期错误
      assert.ok(error);
    }
  });

  it("验证数据长度限制", async () => {
    // 重新创建资料进行测试
    await program.methods
      .createProfile("test", "test@test.com", 25, "test bio")
      .accountsPartial({
        userProfile: userProfilePda,
        authority: authority,
      })
      .rpc();

    // 测试用户名过长
    const longUsername = "a".repeat(33); // 超过 32 字符
    try {
      await program.methods
        .updateProfile(longUsername, null, null, null)
        .accountsPartial({
          userProfile: userProfilePda,
          authority: authority,
        })
        .rpc();
      assert.fail("应该抛出用户名过长错误");
    } catch (error: any) {
      assert.ok(error.message.includes("用户名太长"));
    }

    // 清理
    await program.methods
      .deleteProfile()
      .accountsPartial({
        userProfile: userProfilePda,
        authority: authority,
      })
      .rpc();
  });
});
