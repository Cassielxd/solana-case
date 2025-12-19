# Solana DApp Frontend

基于 Vue 3 + TypeScript + Vite 的 Solana DApp 前端应用。

## 🚀 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Vite** - 极速开发服务器
- **Element Plus** - UI 组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Axios** - HTTP 客户端
- **Solana Web3.js** - Solana 交互

## 📦 安装

```bash
# 在项目根目录
yarn install

# 或直接在 dapp-frontend 目录
yarn install
```

## 🎮 运行

### 开发模式

```bash
# 从根目录运行
yarn frontend:dev

# 或在 dapp-frontend 目录
yarn dev
```

应用将运行在 `http://localhost:5173`

### 生产构建

```bash
yarn frontend:build
```

### 预览生产构建

```bash
yarn frontend:preview
```

## 📁 项目结构

```
dapp-frontend/
├── src/
│   ├── api/              # API 客户端
│   │   └── index.ts      # API 接口定义
│   ├── assets/           # 静态资源
│   ├── components/       # Vue 组件
│   │   └── WalletConnector.vue
│   ├── router/           # 路由配置
│   │   └── index.ts
│   ├── stores/           # Pinia 状态管理
│   │   └── wallet.ts
│   ├── views/            # 页面组件
│   │   ├── Home.vue      # 首页
│   │   ├── Counter.vue   # 计数器
│   │   ├── AMM.vue       # AMM
│   │   ├── Vault.vue     # 金库
│   │   └── Profile.vue   # 资料
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🎯 功能特性

### 已实现功能

- ✅ Phantom 钱包连接
- ✅ 钱包余额显示
- ✅ 响应式导航菜单
- ✅ Counter 程序完整UI
- ✅ AMM 程序查询和报价
- ✅ 与后端 API 集成

### 待开发功能

- ⏳ Token Vault UI
- ⏳ User Profile UI
- ⏳ AMM 完整交互（添加/移除流动性、交换）
- ⏳ 交易历史记录
- ⏳ 通知系统

## 🔧 环境变量

复制 `.env.example` 到 `.env` 并配置：

```env
VITE_SOLANA_RPC_URL=http://127.0.0.1:8899
VITE_SOLANA_NETWORK=localnet
```

## 💡 使用说明

### 1. 连接钱包

点击右上角"连接钱包"按钮，连接 Phantom 钱包。

**前置条件**：
- 已安装 [Phantom 钱包浏览器扩展](https://phantom.app/)
- 钱包已切换到本地网络（如果使用 localnet）

### 2. 使用 Counter

1. 进入 Counter 页面
2. 点击"初始化计数器"（首次使用）
3. 使用"增加"和"减少"按钮操作计数

### 3. 使用 AMM

1. 进入 AMM 页面
2. 输入 Token A 和 Token B 的 Mint 地址
3. 查询池信息或初始化新池
4. 输入交换数量获取报价

## 🐛 常见问题

### 无法连接钱包

- 确保已安装 Phantom 钱包
- 检查浏览器控制台错误信息
- 尝试刷新页面

### API 请求失败

- 确保后端服务已启动 (`yarn server:dev`)
- 检查后端服务运行在 `http://localhost:3001`
- 查看网络请求状态

### 交易失败

- 确保钱包有足够的 SOL 余额
- 确保连接到正确的网络
- 检查程序是否已部署

## 📝 开发指南

### 添加新页面

1. 在 `src/views/` 创建新组件
2. 在 `src/router/index.ts` 添加路由
3. 在 `App.vue` 添加菜单项

### 调用后端 API

```typescript
import { counterAPI } from '@/api'

// 调用 API
const result = await counterAPI.increment(publicKey)
```

### 使用钱包状态

```typescript
import { useWalletStore } from '@/stores/wallet'

const walletStore = useWalletStore()
console.log(walletStore.publicKey) // 钱包地址
console.log(walletStore.balance)   // 余额
```

## 🎨 UI 定制

Element Plus 主题可以在 `src/main.ts` 中自定义。

## 📄 许可证

ISC
