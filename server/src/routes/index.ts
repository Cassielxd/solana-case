import express from "express";
import { counterService } from "../services/counterService";
import { ammService } from "../services/ammService";
import { vaultService } from "../services/vaultService";
import { profileService } from "../services/profileService";
import { solanaConfig } from "../config/solana";

const router = express.Router();

// ============================================================================
// Health Check
// ============================================================================
router.get("/health", async (req, res) => {
  try {
    const balance = await solanaConfig.getBalance();
    res.json({
      status: "healthy",
      network: process.env.SOLANA_NETWORK || "localnet",
      rpc: process.env.SOLANA_RPC_URL,
      wallet: solanaConfig.wallet.publicKey.toBase58(),
      balance: balance.toFixed(4) + " SOL",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Counter Routes
// ============================================================================

// 获取计数器
router.get("/counter/:userPublicKey", async (req, res) => {
  try {
    const { userPublicKey } = req.params;
    const counter = await counterService.getCounter(userPublicKey);
    res.json(counter);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 初始化计数器
router.post("/counter/initialize", async (req, res) => {
  try {
    const { userPublicKey } = req.body;
    if (!userPublicKey) {
      return res.status(400).json({ error: "userPublicKey is required" });
    }
    console.log("🔄 初始化计数器，用户:", userPublicKey);
    const result = await counterService.initialize(userPublicKey);
    console.log("✅ 初始化成功:", result);
    res.json(result);
  } catch (error: any) {
    console.error("❌ 初始化失败:", error);
    console.error("错误堆栈:", error.stack);
    res.status(500).json({ error: error.message, details: error.toString() });
  }
});

// 增加计数
router.post("/counter/increment", async (req, res) => {
  try {
    const { userPublicKey } = req.body;
    if (!userPublicKey) {
      return res.status(400).json({ error: "userPublicKey is required" });
    }
    const result = await counterService.increment(userPublicKey);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 减少计数
router.post("/counter/decrement", async (req, res) => {
  try {
    const { userPublicKey } = req.body;
    if (!userPublicKey) {
      return res.status(400).json({ error: "userPublicKey is required" });
    }
    const result = await counterService.decrement(userPublicKey);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AMM Routes
// ============================================================================

// 获取流动性池信息
router.get("/amm/pool", async (req, res) => {
  try {
    const { tokenAMint, tokenBMint } = req.query;
    if (!tokenAMint || !tokenBMint) {
      return res.status(400).json({ error: "tokenAMint and tokenBMint are required" });
    }
    const pool = await ammService.getPool(
      tokenAMint as string,
      tokenBMint as string
    );
    res.json(pool);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 初始化流动性池
router.post("/amm/pool/initialize", async (req, res) => {
  try {
    const { tokenAMint, tokenBMint, payerPublicKey } = req.body;
    if (!tokenAMint || !tokenBMint || !payerPublicKey) {
      return res.status(400).json({
        error: "tokenAMint, tokenBMint and payerPublicKey are required",
      });
    }
    const result = await ammService.initializePool(
      tokenAMint,
      tokenBMint,
      payerPublicKey
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取交换报价
router.post("/amm/swap/quote", async (req, res) => {
  try {
    const { tokenAMint, tokenBMint, amountIn, isAToB } = req.body;
    if (!tokenAMint || !tokenBMint || !amountIn || isAToB === undefined) {
      return res.status(400).json({
        error: "tokenAMint, tokenBMint, amountIn and isAToB are required",
      });
    }
    const quote = await ammService.getSwapQuote(
      tokenAMint,
      tokenBMint,
      Number(amountIn),
      Boolean(isAToB)
    );
    res.json(quote);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Vault Routes
// ============================================================================

// 获取金库信息
router.get("/vault/:authority/:vaultName", async (req, res) => {
  try {
    const { authority, vaultName } = req.params;
    const vault = await vaultService.getVault(authority, vaultName);
    res.json(vault);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 初始化金库
router.post("/vault/initialize", async (req, res) => {
  try {
    const { authorityPublicKey, vaultName } = req.body;
    if (!authorityPublicKey || !vaultName) {
      return res.status(400).json({
        error: "authorityPublicKey and vaultName are required",
      });
    }
    const result = await vaultService.initialize(authorityPublicKey, vaultName);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 存款
router.post("/vault/deposit", async (req, res) => {
  try {
    const { authorityPublicKey, vaultName, amount } = req.body;
    if (!authorityPublicKey || !vaultName || !amount) {
      return res.status(400).json({
        error: "authorityPublicKey, vaultName and amount are required",
      });
    }
    const result = await vaultService.deposit(authorityPublicKey, vaultName, amount);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 取款
router.post("/vault/withdraw", async (req, res) => {
  try {
    const { authorityPublicKey, vaultName, amount } = req.body;
    if (!authorityPublicKey || !vaultName || !amount) {
      return res.status(400).json({
        error: "authorityPublicKey, vaultName and amount are required",
      });
    }
    const result = await vaultService.withdraw(authorityPublicKey, vaultName, amount);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 关闭金库
router.post("/vault/close", async (req, res) => {
  try {
    const { authorityPublicKey, vaultName } = req.body;
    if (!authorityPublicKey || !vaultName) {
      return res.status(400).json({
        error: "authorityPublicKey and vaultName are required",
      });
    }
    const result = await vaultService.close(authorityPublicKey, vaultName);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Profile Routes
// ============================================================================

// 获取用户资料
router.get("/profile/:admin/:userId", async (req, res) => {
  try {
    const { admin, userId } = req.params;
    const profile = await profileService.getProfile(admin, userId);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建用户资料
router.post("/profile/create", async (req, res) => {
  try {
    const { adminPublicKey, userId, username, email, age, bio } = req.body;
    if (!adminPublicKey || !userId || !username || !email) {
      return res.status(400).json({
        error: "adminPublicKey, userId, username and email are required",
      });
    }
    const result = await profileService.createProfile(
      adminPublicKey,
      userId,
      username,
      email,
      age || 0,
      bio || ""
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户资料
router.post("/profile/update", async (req, res) => {
  try {
    const { adminPublicKey, userId, username, email, age, bio } = req.body;
    if (!adminPublicKey || !userId) {
      return res.status(400).json({
        error: "adminPublicKey and userId are required",
      });
    }
    const result = await profileService.updateProfile(
      adminPublicKey,
      userId,
      username,
      email,
      age,
      bio
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除用户资料
router.post("/profile/delete", async (req, res) => {
  try {
    const { adminPublicKey, userId } = req.body;
    if (!adminPublicKey || !userId) {
      return res.status(400).json({
        error: "adminPublicKey and userId are required",
      });
    }
    const result = await profileService.deleteProfile(adminPublicKey, userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Development Only - Local Wallet Access
// ============================================================================

// 获取本地钱包信息（仅开发环境）
router.get("/dev/local-wallet", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      error: "This endpoint is only available in development",
    });
  }

  res.json({
    publicKey: solanaConfig.wallet.publicKey.toBase58(),
    // 注意：生产环境中绝不应该暴露私钥
    secretKey: Array.from(solanaConfig.wallet.payer.secretKey),
  });
});

// ============================================================================
// Program Info Routes
// ============================================================================

// 获取所有程序信息
router.get("/programs", (req, res) => {
  res.json({
    programs: [
      {
        name: "Counter",
        id: solanaConfig.counterProgramId.toBase58(),
        description: "简单计数器程序",
        loaded: !!solanaConfig.counterProgram,
      },
      {
        name: "Token Vault",
        id: solanaConfig.vaultProgramId.toBase58(),
        description: "SOL 金库程序",
        loaded: !!solanaConfig.vaultProgram,
      },
      {
        name: "User Profile",
        id: solanaConfig.profileProgramId.toBase58(),
        description: "用户资料管理程序",
        loaded: !!solanaConfig.profileProgram,
      },
      {
        name: "Simple AMM",
        id: solanaConfig.ammProgramId.toBase58(),
        description: "自动做市商程序",
        loaded: !!solanaConfig.ammProgram,
      },
    ],
  });
});

export default router;
