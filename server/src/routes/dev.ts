import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const router = Router();

/**
 * 开发环境专用路由
 * ⚠️ 仅用于本地开发，生产环境不要使用！
 */

// 获取本地钱包私钥
router.get("/local-wallet", (req, res) => {
  try {
    // 仅在本地开发环境启用
    const isLocalDev =
      process.env.NODE_ENV !== "production" &&
      (req.hostname === "localhost" || req.hostname === "127.0.0.1");

    if (!isLocalDev) {
      return res.status(403).json({
        error: "此端点仅在本地开发环境可用",
      });
    }

    const walletPath = path.join(os.homedir(), ".config/solana/id.json");

    if (!fs.existsSync(walletPath)) {
      return res.status(404).json({
        error: "本地钱包文件不存在",
        path: walletPath,
      });
    }

    const secretKeyString = fs.readFileSync(walletPath, "utf-8");
    const secretKey = JSON.parse(secretKeyString);

    res.json({
      success: true,
      secretKey: secretKey,
      walletPath: walletPath,
      warning: "⚠️ 请勿在生产环境使用此端点！",
    });
  } catch (error: any) {
    res.status(500).json({
      error: "读取钱包失败",
      message: error.message,
    });
  }
});

export default router;
