# 本地环境 Phantom 钱包设置指南

## 1. 安装 Phantom 钱包

1. 在 Chrome/Edge/Brave 浏览器中安装 **Phantom 钱包扩展**
   - Chrome Web Store: https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa
   - 或直接访问: https://phantom.app/download

2. 创建新钱包或导入现有钱包

## 2. 配置 Phantom 连接��地网络

### 方法一：使用 Phantom 设置（推荐）

1. 打开 Phantom 钱包扩展
2. 点击左上角的 **设置齿轮图标** ⚙️
3. 选择 **"开发者设置"** (Developer Settings)
4. 找到 **"更改网络"** (Change Network)
5. 选择 **"Localhost"** 或添加自定义 RPC
   - RPC URL: `http://127.0.0.1:8899`
   - 网络名称: Localhost

### 方法二：通过浏览器开发者工具临时切换

如果 Phantom 没有显示 Localhost 选项，可以：

1. 在 Phantom 设置中选择 **Devnet** 或 **Testnet**
2. 前端代码会自动使用本地 RPC (`http://127.0.0.1:8899`)

## 3. 获取测试 SOL

在本地测试网络中，您需要给钱包空投一些 SOL：

```bash
# 进入项目目录
cd /home/lixingdong/workspace/my-project

# 查看当前钱包地址
solana address

# 空投 10 SOL 到您的 Phantom 钱包地址
solana airdrop 10 <YOUR_PHANTOM_WALLET_ADDRESS>

# 或者直接空投到当前配置的钱包
solana airdrop 10

# 检查余额
solana balance <YOUR_PHANTOM_WALLET_ADDRESS>
```

**获取 Phantom 钱包地址的方法：**
1. 打开 Phantom 钱包
2. 点击钱包地址（顶部）
3. 点击 **"复制地址"** 按钮

## 4. 启动本地 Solana 测试验证器

确保本地 Solana 验证器正在运行：

```bash
# 在一个新终端窗口中启动
solana-test-validator

# 或者如果已经在运行，检查状态
solana cluster-version
```

## 5. 使用 DApp

1. **启动服务**
   ```bash
   cd /home/lixingdong/workspace/my-project

   # 启动前端（后端可选）
   yarn frontend:dev

   # 或者同时启动前端和后端
   yarn dev
   ```

2. **访问应用**
   - 打开浏览器访问: http://localhost:5173

3. **连接钱包**
   - 点击页面右上角的 **"连接钱包"** 按钮
   - Phantom 会弹出连接请求
   - 点击 **"连接"** 授权应用访问您的钱包

4. **使用 Counter 程序**
   - 访问: http://localhost:5173/counter
   - 点击 **"初始化计数器"** - 会弹出 Phantom 签名请求
   - 确认交易后，计数器创建成功
   - 使用 **"增加 (+1)"** 和 **"减少 (-1)"** 按钮

## 6. 常见问题排查

### 问题：Phantom 无法连接

**解决方案：**
- 确保 Phantom 钱包网络设置为 Localhost 或 Devnet
- 检查本地验证器是否在运行: `solana cluster-version`
- 刷新页面并重新连接钱包

### 问题：交易失败 "insufficient funds"

**解决方案：**
```bash
# 给钱包空投更多 SOL
solana airdrop 10 <YOUR_WALLET_ADDRESS>
```

### 问题：计数器初始化失败

**解决方案：**
1. 检查钱包是否有足够的 SOL（至少 0.01 SOL）
2. 确认程序已部署:
   ```bash
   solana program show MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj
   ```
3. 如果程序不存在，重新部署:
   ```bash
   anchor build
   anchor deploy
   ```

### 问题：页面显示空白或功能不可用

**解决方案��**
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签中的错误信息
3. 确保前端正确加载了所有依赖
4. 尝试刷新页面并清除缓存

## 7. 开发提示

### 查看交易详情

每次交易成功后，控制台会显示交易签名。您可以：

```bash
# 查看交易详情
solana confirm <TRANSACTION_SIGNATURE> -v
```

### 查看程序日志

```bash
# 实时查看验证器日志
solana logs
```

### 重置计数器

如果需要重新开始，可以在浏览器控制台中执行：

```javascript
localStorage.removeItem('counter_keypair')
```

然后刷新页面，重新初始化计数器。

## 8. 网络配置参考

| 网络 | RPC URL | 用途 |
|------|---------|------|
| Localhost | http://127.0.0.1:8899 | 本地开发测试 |
| Devnet | https://api.devnet.solana.com | 开发网测试 |
| Testnet | https://api.testnet.solana.com | 测试网 |
| Mainnet Beta | https://api.mainnet-beta.solana.com | 生产环境 |

---

## 快速启动命令

```bash
# 1. 启动本地验证器（新终端）
solana-test-validator

# 2. 空投 SOL 到钱包
solana airdrop 10 <YOUR_PHANTOM_WALLET_ADDRESS>

# 3. 启动前端
cd /home/lixingdong/workspace/my-project
yarn frontend:dev

# 4. 在浏览器中访问
# http://localhost:5173
```

**完成！** 现在您可以在本地环境中使用 Phantom 钱包进行 DApp 开发和测试了。
