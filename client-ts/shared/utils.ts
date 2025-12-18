// ============================================================================
// TypeScript 客户端工具函数库
// ============================================================================

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// ============================================================================
// Provider 创建工具
// ============================================================================

/**
 * 创建 Provider 的配置选项
 */
export interface ProviderOptions {
  /** RPC URL，默认为 http://127.0.0.1:8899 */
  rpcUrl?: string;
  /** 钱包路径，默认为 ~/.config/solana/id.json */
  walletPath?: string;
  /** Commitment 级别，默认为 confirmed */
  commitment?: anchor.web3.Commitment;
}

/**
 * 创建 Anchor Provider
 *
 * 优先使用环境变量，如果未设置则使用默认值
 */
export function createProvider(options: ProviderOptions = {}): anchor.AnchorProvider {
  // 1. 确定 RPC URL
  const rpcUrl =
    process.env.ANCHOR_PROVIDER_URL ||
    options.rpcUrl ||
    "http://127.0.0.1:8899";

  // 2. 确定钱包路径
  const walletPath =
    process.env.ANCHOR_WALLET ||
    options.walletPath ||
    path.join(os.homedir(), ".config", "solana", "id.json");

  // 3. 加载钱包
  let wallet: anchor.Wallet;
  try {
    const keypair = loadKeypairFromFile(walletPath);
    wallet = new anchor.Wallet(keypair);
  } catch (error) {
    throw new Error(
      `无法加载钱包: ${walletPath}\n` +
      `请确保:\n` +
      `  1. 钱包文件存在\n` +
      `  2. 使用 'solana-keygen new' 创建新钱包\n` +
      `  3. 或设置 ANCHOR_WALLET 环境变量\n` +
      `错误详情: ${error}`
    );
  }

  // 4. 创建连接
  const connection = new Connection(rpcUrl, options.commitment || "confirmed");

  // 5. 创建并返回 Provider
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    {
      commitment: options.commitment || "confirmed",
      preflightCommitment: options.commitment || "confirmed",
    }
  );

  return provider;
}

/**
 * 从环境变量创建 Provider（兼容 Anchor.env()）
 */
export function getEnvProvider(): anchor.AnchorProvider {
  return createProvider();
}

// ============================================================================
// 钱包工具函数
// ============================================================================

/**
 * 从文件加载 Keypair
 */
export function loadKeypairFromFile(filepath: string): Keypair {
  const fullPath = filepath.startsWith("~")
    ? filepath.replace("~", os.homedir())
    : filepath;

  const secretKeyString = fs.readFileSync(fullPath, "utf-8");
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

/**
 * 保存 Keypair 到文件
 */
export function saveKeypairToFile(keypair: Keypair, filepath: string): void {
  const fullPath = filepath.startsWith("~")
    ? filepath.replace("~", os.homedir())
    : filepath;

  // 确保目录存在
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 保存密钥
  fs.writeFileSync(
    fullPath,
    JSON.stringify(Array.from(keypair.secretKey)),
    { mode: 0o600 } // 仅所有者可读写
  );
}

/**
 * 生成新的 Keypair 并保存到文件
 */
export function generateAndSaveKeypair(filepath: string): Keypair {
  const keypair = Keypair.generate();
  saveKeypairToFile(keypair, filepath);
  return keypair;
}

// ============================================================================
// 格式化工具函数
// ============================================================================

/**
 * 格式化 SOL 余额（lamports -> SOL）
 */
export function formatSol(lamports: number | bigint): string {
  const amount = typeof lamports === "bigint"
    ? Number(lamports)
    : lamports;
  return (amount / anchor.web3.LAMPORTS_PER_SOL).toFixed(4);
}

/**
 * 格式化公钥（截断中间部分）
 */
export function formatPubkey(pubkey: PublicKey, length: number = 8): string {
  const str = pubkey.toBase58();
  if (str.length <= length * 2) return str;
  return `${str.slice(0, length)}...${str.slice(-length)}`;
}

/**
 * 格式化交易签名（截断中间部分）
 */
export function formatSignature(signature: string, length: number = 8): string {
  if (signature.length <= length * 2) return signature;
  return `${signature.slice(0, length)}...${signature.slice(-length)}`;
}

// ============================================================================
// 账户查询工具
// ============================================================================

/**
 * 获取账户余额（SOL）
 */
export async function getBalance(
  connection: Connection,
  pubkey: PublicKey
): Promise<number> {
  const lamports = await connection.getBalance(pubkey);
  return lamports / anchor.web3.LAMPORTS_PER_SOL;
}

/**
 * 打印账户信息
 */
export async function printAccountInfo(
  connection: Connection,
  pubkey: PublicKey,
  label?: string
): Promise<void> {
  try {
    const balance = await connection.getBalance(pubkey);
    const info = await connection.getAccountInfo(pubkey);

    console.log(label ? `${label}:` : "账户信息:");
    console.log(`  地址: ${pubkey.toBase58()}`);
    console.log(`  余额: ${formatSol(balance)} SOL`);

    if (info) {
      console.log(`  所有者: ${info.owner.toBase58()}`);
      console.log(`  数据大小: ${info.data.length} 字节`);
      console.log(`  可执行: ${info.executable ? "是" : "否"}`);
    } else {
      console.log(`  状态: 账户不存在`);
    }
  } catch (error) {
    console.log(`${label || "账户"}: 无法获取信息 - ${error}`);
  }
}

/**
 * 检查账户是否存在
 */
export async function accountExists(
  connection: Connection,
  pubkey: PublicKey
): Promise<boolean> {
  const info = await connection.getAccountInfo(pubkey);
  return info !== null;
}

// ============================================================================
// 空投工具（仅用于测试网）
// ============================================================================

/**
 * 请求空投（测试网）
 */
export async function requestAirdrop(
  connection: Connection,
  pubkey: PublicKey,
  amountSol: number = 1
): Promise<string> {
  const signature = await connection.requestAirdrop(
    pubkey,
    amountSol * anchor.web3.LAMPORTS_PER_SOL
  );

  // 等待确认
  await connection.confirmTransaction(signature);

  return signature;
}

/**
 * 确保账户有足够余额（不足时请求空投）
 */
export async function ensureBalance(
  connection: Connection,
  pubkey: PublicKey,
  minBalanceSol: number = 1
): Promise<void> {
  const balance = await getBalance(connection, pubkey);

  if (balance < minBalanceSol) {
    console.log(`余额不足 (${balance.toFixed(4)} SOL)，请求空投...`);
    const needed = minBalanceSol - balance;
    await requestAirdrop(connection, pubkey, needed);
    console.log(`空投成功: ${needed.toFixed(4)} SOL`);
  }
}

// ============================================================================
// 交易工具
// ============================================================================

/**
 * 等待交易确认并返回详情
 */
export async function confirmAndGetTransaction(
  connection: Connection,
  signature: string,
  commitment: "confirmed" | "finalized" = "confirmed"
): Promise<any> {
  // 等待确认
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    ...latestBlockhash,
  }, commitment);

  // 获取交易详情
  return await connection.getTransaction(signature, {
    commitment,
    maxSupportedTransactionVersion: 0,
  });
}

/**
 * 打印交易摘要
 */
export async function printTransactionSummary(
  connection: Connection,
  signature: string
): Promise<void> {
  try {
    const tx = await confirmAndGetTransaction(connection, signature);

    console.log("交易摘要:");
    console.log(`  签名: ${formatSignature(signature)}`);
    console.log(`  状态: ${tx?.meta?.err ? "失败" : "成功"}`);
    console.log(`  费用: ${formatSol(tx?.meta?.fee || 0)} SOL`);

    if (tx?.meta?.logMessages) {
      console.log(`  日志:`);
      tx.meta.logMessages.forEach((log: string) => {
        console.log(`    ${log}`);
      });
    }
  } catch (error) {
    console.log(`无法获取交易详情: ${error}`);
  }
}

// ============================================================================
// 错误处理工具
// ============================================================================

/**
 * 解析 Anchor 错误
 */
export function parseAnchorError(error: any): {
  code?: string;
  message: string;
  logs?: string[];
} {
  return {
    code: error.code,
    message: error.message || String(error),
    logs: error.logs,
  };
}

/**
 * 打印 Anchor 错误详情
 */
export function printAnchorError(error: any): void {
  const parsed = parseAnchorError(error);

  console.error("错误详情:");
  if (parsed.code) {
    console.error(`  错误代码: ${parsed.code}`);
  }
  console.error(`  错误信息: ${parsed.message}`);

  if (parsed.logs && parsed.logs.length > 0) {
    console.error(`  程序日志:`);
    parsed.logs.forEach((log) => {
      console.error(`    ${log}`);
    });
  }
}

// ============================================================================
// 延迟工具
// ============================================================================

/**
 * 延迟执行（用于演示和测试）
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带进度的延迟
 */
export async function sleepWithProgress(
  ms: number,
  message: string = "等待中"
): Promise<void> {
  const steps = 10;
  const stepTime = ms / steps;

  for (let i = 0; i < steps; i++) {
    process.stdout.write(`\r${message}... ${((i + 1) / steps * 100).toFixed(0)}%`);
    await sleep(stepTime);
  }
  process.stdout.write("\n");
}
