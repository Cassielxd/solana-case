import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import router from "./routes";
import { solanaConfig } from "./config/solana";

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// 中间件
// ============================================================================

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// JSON 解析
app.use(express.json());

// 日志
app.use(morgan("dev"));

// ============================================================================
// 路由
// ============================================================================

app.use("/api", router);

// 根路径
app.get("/", (req, res) => {
  res.json({
    name: "Solana DApp API Server",
    version: "1.0.0",
    description: "Backend API for all Solana programs",
    programs: ["Counter", "Token Vault", "User Profile", "Simple AMM"],
    endpoints: {
      health: "/api/health",
      programs: "/api/programs",
      counter: "/api/counter",
      amm: "/api/amm",
    },
  });
});

// ============================================================================
// 启动服务器
// ============================================================================

async function startServer() {
  try {
    console.log("\n🚀 启动 Solana DApp API 服务器...\n");

    // 加载所有程序
    await solanaConfig.loadPrograms();

    // 启动 Express 服务器
    app.listen(PORT, () => {
      console.log(`\n✅ 服务器运行在 http://localhost:${PORT}`);
      console.log(`   API 端点: http://localhost:${PORT}/api`);
      console.log(`   健康检查: http://localhost:${PORT}/api/health`);
      console.log(`\n📚 支持的程序:`);
      console.log(`   - Counter (计数器)`);
      console.log(`   - Token Vault (金库)`);
      console.log(`   - User Profile (资料)`);
      console.log(`   - Simple AMM (做市商)`);
      console.log("\n");
    });
  } catch (error) {
    console.error("❌ 服务器启动失败:", error);
    process.exit(1);
  }
}

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("服务器错误:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// 启动
startServer();
