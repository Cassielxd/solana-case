# 🚀 DApp 快速启动指南

## 📋 前置条件检查清单

- [ ] Solana CLI 已安装
- [ ] Anchor CLI 已安装
- [ ] Node.js (v18+) 已安装
- [ ] Yarn 已安装
- [ ] Phantom 钱包扩展已安装

## ⚡ 5 分钟快速启动

### 步骤 1: 安装依赖

```bash
# 在项目根目录
yarn install
```

### 步骤 2: 启动 Solana 本地验证器

```bash
# 新终端窗口 1
solana-test-validator
```

### 步骤 3: 部署程序

```bash
# 新终端窗口 2
anchor build
anchor deploy
```

### 步骤 4: 启动 DApp

```bash
# 新终端窗口 3（项目根目录）
yarn dev
```

这将同时启动：
- **后端API**: http://localhost:3001
- **前端界面**: http://localhost:5173

### 步骤 5: 配置 Phantom 钱包

1. 打开 Phantom 钱包扩展
2. 切换到 **Localhost** 网络
3. 确保有 SOL（可通过 `solana airdrop 2` 获取）

### 步骤 6: 开始使用

1. 打开浏览器访问 http://localhost:5173
2. 点击右上角"连接钱包"
3. 授权 Phantom 钱包连接
4. 开始体验各个程序！

## 🎯 测试功能

### Counter (计数器)

1. 访问 Counter 页面
2. 点击"初始化计数器"
3. 测试"增加"和"减少"按钮
4. 观察链上状态变化

### AMM (自动做市商)

1. 访问 AMM 页面
2. 使用以下测试代币地址（需要先创建）：
   - 或运行客户端示例创建测试代币：
     ```bash
     npx ts-node client-ts/simple-amm/index.ts
     ```
3. 查询池信息
4. 获取交换报价

## 🔧 开发模式

### 仅后端开发

```bash
yarn server:dev
```

访问 http://localhost:3001/api/health 测试后端

### 仅前端开发

```bash
# 确保后端已启动
yarn frontend:dev
```

### 查看日志

**后端日志**: 直接在后端终端查看

**前端日志**: 浏览器开发者工具 Console

**Solana 日志**:
```bash
solana logs
```

## 📚 下一步

- 阅读 [DAPP_README.md](DAPP_README.md) 了解完整架构
- 阅读 [server/README.md](server/README.md) 了解后端 API
- 阅读 [dapp-frontend/README.md](dapp-frontend/README.md) 了解前端开发

## 🐛 常见问题

### Q: 后端启动失败

**A**: 检查是否正确配置 `server/.env` 文件：
```bash
cd server
cp .env.example .env
# 编辑 .env，确保程序 ID 正确
```

### Q: 前端无法连接后端

**A**: 确保后端运行在 3001 端口，前端会自动代理 API 请求

### Q: 钱包连接失败

**A**:
1. 检查 Phantom 是否安装
2. 确认切换到 Localhost 网络
3. 刷新页面重试

### Q: 交易失败

**A**:
1. 检查钱包余额：`solana balance`
2. 如果不足，请求空投：`solana airdrop 2`
3. 确认程序已部署：`solana program show <PROGRAM_ID>`

## 💡 提示

- **开发时**：使用 `yarn dev` 并行运行前后端
- **生产环境**：分别构建和部署前后端
- **调试**：查看浏览器控制台和后端终端输出
- **测试**：使用 Solana Explorer (localhost) 查看交易

## 📞 获取帮助

遇到问题？
1. 查看各子项目的 README
2. 检查浏览器控制台错误
3. 查看后端服务日志
4. 查看 Solana 验证器日志

---

**🎉 祝你使用愉快！**
