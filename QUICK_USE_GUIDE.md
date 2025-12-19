# 🚀 快速使用指南 - Vault 和 Profile 功能

## 启动服务

### 1. 启动 Solana 本地验证器(如果还没启动)
```bash
# 新终端窗口
solana-test-validator
```

### 2. 启动 Server
```bash
cd server
yarn dev
```

**期望输出:**
```
✅ Solana 配置已初始化
  RPC: http://127.0.0.1:8899
  钱包: EiHBw7AVAiTHDRHhcjmQHpWoXTnwU3h43SP9DeZYsTn8

🚀 启动 Solana DApp API 服务器...

  ✅ Counter 程序已加载
  ✅ Vault 程序已加载
  ✅ Profile 程序已加载
  ✅ AMM 程序已加载

✅ 服务器运行在 http://localhost:3001
```

### 3. 启动 Frontend
```bash
# 新终端窗口
cd dapp-frontend
yarn dev
```

访问: http://localhost:5173

## 使用 Vault 功能

### 1. 进入 Vault 页面
http://localhost:5173/vault

### 2. 连接钱包
有两种方式：

**方式 A: Phantom 钱包**
- 点击"连接 Phantom"
- 在 Phantom 扩展中授权

**方式 B: 本地钱包**
- 点击"连接本地钱包"
- 自动加载 `~/.config/solana/id.json`

### 3. 创建金库
```
金库名称: my-vault
点击: 创建金库
```

### 4. 存款
```
金额: 0.1 SOL
点击: 存入
```

### 5. 查看金库余额
金库信息会自动刷新,显示:
- 金库名称
- 金库地址
- 金库余额
- 权限者

### 6. 取款
```
金额: 0.05 SOL
点击: 取出
```

### 7. 关闭金库(可选)
⚠️ 警告:此操作不可逆!
```
点击: 关闭金库
确认对话框: 确定关闭
```

## 使用 Profile 功能

### 1. 进入 Profile 页面
http://localhost:5173/profile

### 2. 连接钱包
同 Vault(选择 Phantom 或本地钱包)

### 3. 创建用户资料
```
用户 ID: user123
用户名: Alice
邮箱: alice@example.com
年龄: 25
个人简介: Hello, I'm Alice!

点击: 创建资料
```

### 4. 查询用户资料
```
用户 ID: user123
点击: 查询资料
```

### 5. 更新用户资料
修改任意字段:
```
用户名: Alice Wang
年龄: 26

点击: 更新资料
```

### 6. 删除用户资料(可选)
⚠️ 警告:此操作不可逆!
```
点击: 删除资料
确认对话框: 确定删除
```

## API 测试(可选)

### 测试 Vault API
```bash
# 获取金库信息
curl http://localhost:3001/api/vault/YOUR_WALLET_ADDRESS/my-vault

# 健康检查
curl http://localhost:3001/api/health

# 获取所有程序信息
curl http://localhost:3001/api/programs
```

### 测试 Profile API
```bash
# 获取用户资料
curl http://localhost:3001/api/profile/YOUR_WALLET_ADDRESS/user123
```

### 测试本地钱包端点(仅开发环境)
```bash
curl http://localhost:3001/api/dev/local-wallet
```

## 常见问题

### Q1: Server 启动失败 "address already in use"
**A:** 端口 3001 已被占用,说明已经有一个 server 实例在运行。
```bash
# 查找并杀掉占用端口的进程
lsof -ti:3001 | xargs kill -9
# 然后重新启动
yarn dev
```

### Q2: 连接本地钱包失败
**A:** 确保:
1. Server 正在运行
2. `~/.config/solana/id.json` 文件存在
3. 检查浏览器控制台的错误信息

### Q3: 交易失败 "insufficient funds"
**A:** 钱包余额不足
```bash
# 空投 SOL 到你的钱包
solana airdrop 2 YOUR_WALLET_ADDRESS
```

### Q4: Vault 或 Profile 页面显示空白
**A:**
1. 检查浏览器控制台是否有错误
2. 确认 Server 正在运行
3. 检查网络连接(Frontend → Server)

### Q5: TypeScript 编译错误
**A:** 这是正常的!使用 `yarn dev` 而不是 `yarn build`。
详见 `IMPROVEMENTS.md` 中的 "TypeScript 编译说明"。

## 开发提示

### 查看交易日志
```bash
# 实时查看 Solana 验证器日志
solana logs
```

### 查看账户余额
```bash
# 查看钱包余额
solana balance

# 查看指定地址余额
solana balance YOUR_WALLET_ADDRESS
```

### 重置状态
如果需要从头开始:
```bash
# 1. 停止验证器
# 2. 清除测试账本
solana-test-validator --reset

# 3. 重新部署程序
anchor build
anchor deploy

# 4. 重启 server 和 frontend
```

## 钱包类型对比

| 特性 | Phantom 钱包 | 本地钱包 |
|-----|-------------|---------|
| 需要浏览器扩展 | ✅ 是 | ❌ 否 |
| 用户友好 | ✅ 高 | ⚠️ 中 |
| 适用场景 | 生产环境 | 开发/测试 |
| 安全性 | ✅ 高 | ⚠️ 仅本地 |
| 签名方式 | 用户确认 | 自动签名 |
| 推荐用途 | 终端用户 | 开发者测试 |

## 下一步

- [ ] 测试 Vault 的存取款功能
- [ ] 测试 Profile 的 CRUD 操作
- [ ] 尝试使用不同的钱包类型
- [ ] 查看 Server 日志了解交易详情
- [ ] 探索 Counter 和 AMM 功能

---

**需要帮助?** 查看:
- `IMPROVEMENTS.md` - 详细的改进说明
- `README.md` - 项目总览
- `QUICKSTART.md` - 5 分钟快速启动
- `DAPP_README.md` - DApp 架构说明

**祝你使用愉快!** 🎉
