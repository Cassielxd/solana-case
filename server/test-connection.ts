import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

async function testConnection() {
  console.log("🔍 测试 Solana 连接...\n");

  const rpcUrl = "http://127.0.0.1:8899";
  const connection = new Connection(rpcUrl, "confirmed");

  try {
    // 测试 1: 获取版本
    console.log("1. 测试获取集群版本...");
    const version = await connection.getVersion();
    console.log("✅ 版本:", version);

    // 测试 2: 获取余额
    console.log("\n2. 测试获取余额...");
    const pubkey = new PublicKey("EiHBw7AVAiTHDRHhcjmQHpWoXTnwU3h43SP9DeZYsTn8");
    const balance = await connection.getBalance(pubkey);
    console.log("✅ 余额:", balance / anchor.web3.LAMPORTS_PER_SOL, "SOL");

    // 测试 3: 获取最新区块高度
    console.log("\n3. 测试获取区块高度...");
    const slot = await connection.getSlot();
    console.log("✅ 当前区块高度:", slot);

    console.log("\n✅ 所有测试通过!");
  } catch (error: any) {
    console.error("\n❌ 测试失败:", error.message);
    process.exit(1);
  }
}

testConnection();
