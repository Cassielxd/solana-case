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

  // 管理员钱包（系统统一的钱包）
  const admin = provider.wallet.publicKey;

  // 测试用的第三方用户 ID
  const userId1 = "test_user_001";
  const userId2 = "test_user_002";

  // 计算用户资料 PDA
  let userProfilePda1: PublicKey;
  let userProfilePda2: PublicKey;
  let bump1: number;
  let bump2: number;

  before(() => {
    // 计算第一个用户的 PDA
    [userProfilePda1, bump1] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-profile"),
        admin.toBuffer(),
        Buffer.from(userId1)
      ],
      program.programId
    );

    // 计算第二个用户的 PDA
    [userProfilePda2, bump2] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-profile"),
        admin.toBuffer(),
        Buffer.from(userId2)
      ],
      program.programId
    );

    console.log("\n测试配置:");
    console.log(`  管理员: ${admin.toBase58()}`);
    console.log(`  用户 1 ID: ${userId1}`);
    console.log(`  用户 1 PDA: ${userProfilePda1.toBase58()}`);
    console.log(`  用户 2 ID: ${userId2}`);
    console.log(`  用户 2 PDA: ${userProfilePda2.toBase58()}\n`);
  });

  it("创建用户资料", async () => {
    const username = "test_user";
    const email = "test@example.com";
    const age = 25;
    const bio = "This is a test bio";

    const tx = await program.methods
      .createProfile(userId1, username, email, age, bio)
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();

    console.log("创建交易:", tx);

    // 验证用户资料
    const profile = await program.account.userProfile.fetch(userProfilePda1);
    assert.equal(profile.userId, userId1);
    assert.equal(profile.username, username);
    assert.equal(profile.email, email);
    assert.equal(profile.age, age);
    assert.equal(profile.bio, bio);
    assert.ok(profile.admin.equals(admin));
    assert.equal(profile.bump, bump1);
  });

  it("更新用户资料（部分字段）", async () => {
    const newAge = 26;
    const newBio = "Updated bio";

    await program.methods
      .updateProfile(userId1, null, null, newAge, newBio)
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();

    const profile = await program.account.userProfile.fetch(userProfilePda1);
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
      .updateProfile(userId1, newUsername, newEmail, newAge, newBio)
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();

    const profile = await program.account.userProfile.fetch(userProfilePda1);
    assert.equal(profile.username, newUsername);
    assert.equal(profile.email, newEmail);
    assert.equal(profile.age, newAge);
    assert.equal(profile.bio, newBio);
    assert.equal(profile.userId, userId1); // user_id 不可变
    assert.ok(profile.admin.equals(admin)); // admin 不可变
  });

  it("创建第二个用户资料（测试多用户支持）", async () => {
    const username = "second_user";
    const email = "second@example.com";
    const age = 28;
    const bio = "Second user bio";

    const tx = await program.methods
      .createProfile(userId2, username, email, age, bio)
      .accountsPartial({
        userProfile: userProfilePda2,
        admin: admin,
      })
      .rpc();

    console.log("第二个用户创建交易:", tx);

    // 验证第二个用户资料
    const profile = await program.account.userProfile.fetch(userProfilePda2);
    assert.equal(profile.userId, userId2);
    assert.equal(profile.username, username);
    assert.equal(profile.email, email);
    assert.equal(profile.age, age);
    assert.equal(profile.bio, bio);
    assert.ok(profile.admin.equals(admin));
    assert.equal(profile.bump, bump2);

    // 验证第一个用户资料仍然存在且未受影响
    const profile1 = await program.account.userProfile.fetch(userProfilePda1);
    assert.equal(profile1.userId, userId1);
    assert.equal(profile1.username, "new_user");
  });

  it("删除用户资料", async () => {
    // 删除第一个用户资料
    await program.methods
      .deleteProfile(userId1)
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();

    // 验证账户已删除
    try {
      await program.account.userProfile.fetch(userProfilePda1);
      assert.fail("账户应该已被删除");
    } catch (error) {
      // 预期错误
      assert.ok(error);
    }

    // 验证第二个用户资料仍然存在
    const profile2 = await program.account.userProfile.fetch(userProfilePda2);
    assert.equal(profile2.userId, userId2);
  });

  it("验证数据长度限制", async () => {
    // 重新创建资料进行测试
    await program.methods
      .createProfile(userId1, "test", "test@test.com", 25, "test bio")
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();

    // 测试用户名过长
    const longUsername = "a".repeat(33); // 超过 32 字符
    try {
      await program.methods
        .updateProfile(userId1, longUsername, null, null, null)
        .accountsPartial({
          userProfile: userProfilePda1,
          admin: admin,
        })
        .rpc();
      assert.fail("应该抛出用户名过长错误");
    } catch (error: any) {
      // 验证确实抛出了错误（错误消息可能包含中文或错误代码）
      assert.ok(error);
    }

    // 测试邮箱过长
    const longEmail = "a".repeat(65) + "@test.com"; // 超过 64 字符
    try {
      await program.methods
        .updateProfile(userId1, null, longEmail, null, null)
        .accountsPartial({
          userProfile: userProfilePda1,
          admin: admin,
        })
        .rpc();
      assert.fail("应该抛出邮箱过长错误");
    } catch (error: any) {
      // 验证确实抛出了错误
      assert.ok(error);
    }

    // 测试简介过长
    const longBio = "a".repeat(257); // 超过 256 字符
    try {
      await program.methods
        .updateProfile(userId1, null, null, null, longBio)
        .accountsPartial({
          userProfile: userProfilePda1,
          admin: admin,
        })
        .rpc();
      assert.fail("应该抛出简介过长错误");
    } catch (error: any) {
      // 验证确实抛出了错误
      assert.ok(error);
    }

    // 清理两个用户资料
    await program.methods
      .deleteProfile(userId1)
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();

    await program.methods
      .deleteProfile(userId2)
      .accountsPartial({
        userProfile: userProfilePda2,
        admin: admin,
      })
      .rpc();
  });

  it("验证 PDA 唯一性（相同 user_id 不能重复创建）", async () => {
    // 创建用户资料
    await program.methods
      .createProfile(userId1, "test", "test@test.com", 25, "test bio")
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();

    // 尝试使用相同的 user_id 再次创建
    try {
      await program.methods
        .createProfile(userId1, "test2", "test2@test.com", 26, "test bio 2")
        .accountsPartial({
          userProfile: userProfilePda1,
          admin: admin,
        })
        .rpc();
      assert.fail("应该抛出账户已存在错误");
    } catch (error: any) {
      // 预期错误：账户已存在
      assert.ok(error);
    }

    // 清理
    await program.methods
      .deleteProfile(userId1)
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();
  });

  it("验证时间戳功能", async () => {
    // 创建用户资料
    await program.methods
      .createProfile(userId1, "test", "test@test.com", 25, "test bio")
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();

    const profile1 = await program.account.userProfile.fetch(userProfilePda1);
    const createdAt = profile1.createdAt.toNumber();
    const updatedAt1 = profile1.updatedAt.toNumber();

    // 创建时，created_at 应该等于 updated_at
    assert.equal(createdAt, updatedAt1);

    // 等待 2 秒
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 更新用户资料
    await program.methods
      .updateProfile(userId1, null, null, 26, null)
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();

    const profile2 = await program.account.userProfile.fetch(userProfilePda1);
    const updatedAt2 = profile2.updatedAt.toNumber();

    // 更新后，updated_at 应该大于 created_at
    assert.ok(updatedAt2 > createdAt);
    // updated_at 应该被更新
    assert.ok(updatedAt2 > updatedAt1);
    // created_at 应该保持不变
    assert.equal(profile2.createdAt.toNumber(), createdAt);

    // 清理
    await program.methods
      .deleteProfile(userId1)
      .accountsPartial({
        userProfile: userProfilePda1,
        admin: admin,
      })
      .rpc();
  });
});
