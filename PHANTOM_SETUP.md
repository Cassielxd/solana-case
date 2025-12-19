# Phantom 钱包连接问题解决方案

## 问题：Phantom 没有网络设置选项

新版本的 Phantom 钱包默认隐藏了网络切换功能。以下是解决方案：

## ✅ 方法 1：简单重置（推荐）

### 步骤 1：完全断开并重置 Phantom

1. **打开 Phantom 钱包扩展**

2. **点击右上角三条线菜单（≡）或设置图标**

3. **找到 "已连接的网站" 或 "Trusted Apps"**
   - 如果看到 `localhost:5173`，点击它并选择"断开连接"或"移除"

4. **锁定钱包**
   - 在设置中找到"锁定钱包"或直接关闭 Phantom

5. **重新打开并解锁 Phantom**

### 步骤 2：刷新页面并重新连接

1. 刷新浏览器页面（F5 或 Ctrl+R）
2. 点击"连接钱包"按钮
3. 在 Phantom 弹窗中点击"连接"

---

## ✅ 方法 2：使用测试页面诊断

访问测试页面查看具体问题：

```
http://localhost:5173/test-connection.html
```

按顺序测试：
1. ✅ 检查 Phantom 是否安装
2. ✅ 连接钱包
3. ✅ 获取余额
4. ✅ 测试本地 RPC

---

## ✅ 方法 3：启用 Phantom 开发者模式

如果您想看到网络切换选项：

### Chrome/Edge 浏览器

1. **右键点击 Phantom 扩展图标**
2. **选择 "管理扩展"**
3. **向下滚动找到 "开发者模式"**
4. **打开开发者模式开关**
5. **重新打开 Phantom**

现在 Phantom 可能会显示更多开发者选项，包括网络切换。

### 在 Phantom 中切换网络（如果可见）

1. 打开 Phantom
2. 点击顶部的网络名称（通常显示 "Mainnet"）
3. 选择 **"Devnet"** 或 **"Testnet"**

---

## ✅ 方法 4：重新安装 Phantom（最后手段）

如果以上方法都不行：

1. **卸载 Phantom 扩展**
   - 在浏览器扩展管理中移除 Phantom

2. **清除浏览器缓存**
   - 按 Ctrl+Shift+Delete
   - 清除缓存和 Cookie

3. **重新安装 Phantom**
   - 访问 https://phantom.app
   - 下载并安装扩展

4. **恢复钱包**
   - 使用助记词恢复您的钱包
   - ⚠️ **请确保您已保存好助记词！**

---

## 🔍 常见错误及解决方案

### 错误："Unexpected error"

**可能原因：**
- Phantom 正在尝试连接到不可用的网络
- 钱包已锁定
- 浏览器缓存问题

**解决方案：**
```bash
# 1. 确保本地验证器在运行
solana cluster-version

# 2. 如果没有运行，启动它
solana-test-validator

# 3. 刷新浏览器并重试
```

### 错误："User rejected"

**原因：** 您在 Phantom 弹窗中点击了"取消"或"拒绝"

**解决方案：** 重新点击"连接钱包"按钮，在 Phantom 弹窗中点击"连接"

### 余额显示 0 SOL

**解决方案：**
```bash
# 获取您的 Phantom 钱包地址（在 Phantom 中点击地址复制）
# 然后执行空投
solana airdrop 10 <您的钱包地址>

# 检查余额
solana balance <您的钱包地址>
```

---

## 📋 快速排查清单

执行以下命令确认环境正常：

```bash
# 1. 检查本地验证器
solana cluster-version

# 2. 检查 RPC 连接
solana cluster-version

# 3. 查看当前配置
solana config get

# 应该显示：
# RPC URL: http://127.0.0.1:8899
```

---

## 🎯 测试连接的完整步骤

1. **确保本地验证器运行中**
   ```bash
   solana cluster-version
   # 应该显示版本号，如: 3.0.13
   ```

2. **访问测试页面**
   ```
   http://localhost:5173/test-connection.html
   ```

3. **按顺序点击测试按钮**
   - 如果第 1 步失败：Phantom 未安装
   - 如果第 2 步失败：连接权限问题，尝试方法 1
   - 如果第 3 步失败：本地验证器问题
   - 如果第 4 步失败：RPC 连接问题

4. **全部通过后，访问 Counter 页面**
   ```
   http://localhost:5173/counter
   ```

---

## 💡 最简单的方法

**如果您只是想快速测试，不在意网络显示：**

1. 确保 Phantom 已解锁
2. 刷新浏览器页面
3. 点击"连接钱包"
4. 在 Phantom 弹窗中点击"连接"
5. 忽略 Phantom 显示的网络名称
6. 应用会自动使用本地 RPC

**Phantom 显示的网络和实际使用的 RPC 是分开的！** 前端代码已配置为始终使用 `http://127.0.0.1:8899`。

---

## 🆘 还是不行？

请在浏览器按 F12 打开开发者工具，切换到 Console 标签，截图完整的错误信息并发给我。
