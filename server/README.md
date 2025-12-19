# Solana DApp API Server

后端 API 服务器，为所有 Solana 程序提供 REST API 接口。

## 📚 支持的程序

1. **Counter** - 计数器程序
2. **Token Vault** - SOL 金库程序
3. **User Profile** - 用户资料管理程序
4. **Simple AMM** - 自动做市商程序

## 🚀 快速开始

### 安装依赖

```bash
cd server
npm install
# 或
yarn install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置你的环境
vim .env
```

### 启动服务器

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务器将运行在 `http://localhost:3001`

## 📡 API 端点

### 健康检查

```
GET /api/health
```

返回服务器状态和 Solana 网络信息。

### 程序信息

```
GET /api/programs
```

返回所有已加载的程序信息。

### Counter API

#### 获取计数器

```
GET /api/counter/:userPublicKey
```

#### 初始化计数器

```
POST /api/counter/initialize
Body: { "userPublicKey": "..." }
```

#### 增加计数

```
POST /api/counter/increment
Body: { "userPublicKey": "..." }
```

#### 减少计数

```
POST /api/counter/decrement
Body: { "userPublicKey": "..." }
```

### AMM API

#### 获取流动性池

```
GET /api/amm/pool?tokenAMint=...&tokenBMint=...
```

#### 初始化流动性池

```
POST /api/amm/pool/initialize
Body: {
  "tokenAMint": "...",
  "tokenBMint": "...",
  "payerPublicKey": "..."
}
```

#### 获取交换报价

```
POST /api/amm/swap/quote
Body: {
  "tokenAMint": "...",
  "tokenBMint": "...",
  "amountIn": 100,
  "isAToB": true
}
```

## 🔧 技术栈

- **Node.js** + **TypeScript**
- **Express** - Web 框架
- **@coral-xyz/anchor** - Solana 程序框架
- **@solana/web3.js** - Solana Web3 库
- **@solana/spl-token** - SPL Token 库

## 📁 项目结构

```
server/
├── src/
│   ├── config/
│   │   └── solana.ts          # Solana 配置
│   ├── services/
│   │   ├── counterService.ts  # Counter 服务
│   │   └── ammService.ts      # AMM 服务
│   ├── routes/
│   │   └── index.ts           # API 路由
│   └── index.ts               # 服务器入口
├── package.json
├── tsconfig.json
└── .env.example
```

## 🌐 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务器端口 | `3001` |
| `SOLANA_RPC_URL` | Solana RPC URL | `http://127.0.0.1:8899` |
| `SOLANA_NETWORK` | Solana 网络 | `localnet` |
| `WALLET_PATH` | 钱包密钥路径 | `~/.config/solana/id.json` |
| `PROGRAM_ID_COUNTER` | Counter 程序 ID | - |
| `PROGRAM_ID_VAULT` | Vault 程序 ID | - |
| `PROGRAM_ID_PROFILE` | Profile 程序 ID | - |
| `PROGRAM_ID_AMM` | AMM 程序 ID | - |
| `CORS_ORIGIN` | CORS 允许的源 | `http://localhost:5173` |

## 🐛 调试

查看服务器日志：

```bash
npm run dev
```

测试 API：

```bash
# 健康检查
curl http://localhost:3001/api/health

# 获取程序列表
curl http://localhost:3001/api/programs

# 获取计数器（替换为实际的公钥）
curl http://localhost:3001/api/counter/YOUR_PUBLIC_KEY
```

## 📝 开发指南

### 添加新的 API 端点

1. 在 `src/services/` 创建服务文件
2. 在 `src/routes/index.ts` 添加路由
3. 重启服务器

### 部署到生产环境

```bash
# 构建
npm run build

# 启动
NODE_ENV=production npm start
```

## ⚠️ 注意事项

- 确保 Solana 本地验证器正在运行
- 确保所有程序已部署
- 钱包需要有足够的 SOL 余额
- 生产环境请使用环境变量管理敏感信息

## 📄 许可证

ISC
