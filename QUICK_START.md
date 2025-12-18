# 🚀 快速开始指南

5 分钟内启动并运行你的 Solana 计数器项目！

## ⚡ 最快速度运行

```bash
# 1. 启动测试网络（新终端）
solana-test-validator

# 2. 部署程序
anchor build && anchor deploy

# 3. 运行客户端（选择一个）
npx ts-node client-ts/index.ts              # 完整演示
npx ts-node client-ts/examples/basic.ts     # 基础示例
```

就这么简单！🎉

---

## 📋 详细步骤

### 步骤 1: 启动测试网络

打开**第一个终端**：

```bash
solana-test-validator
```

看到以下输出说明成功：
```
Ledger location: test-ledger
✅ Listening on http://127.0.0.1:8899
```

**保持这个终端运行**，不要关闭！

---

### 步骤 2: 部署智能合约

打开**第二个终端**：

```bash
# 构建程序
anchor build

# 部署到本地测试网络
anchor deploy
```

看到以下输出说明成功：
```
Deploying workspace: http://localhost:8899
  Program Id: MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj
✅ Deploy success
```

---

### 步骤 3: 运行客户端

#### 选项 A: TypeScript 客户端（推荐）✅

```bash
# 运行完整演示
npx ts-node client-ts/index.ts
```

预期输出：
```
🚀 Anchor TypeScript 客户端（增强版）
================================

📡 RPC 端点: http://127.0.0.1:8899
👛 钱包地址: ...
📦 程序 ID: MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj

=== 1️⃣ 初始化计数器 ===
🆕 新计数器地址: ...
✅ 初始化成功

=== 2️⃣ 查询初始状态 ===
📊 计数值: 0
...
```

#### 选项 B: 运行简单示例

```bash
# 基础示例（最简单）
npx ts-node client-ts/examples/basic.ts

# 批量操作示例
npx ts-node client-ts/examples/batch.ts

# 错误处理示例
npx ts-node client-ts/examples/error-handling.ts
```

#### 选项 C: Rust 客户端

```bash
cd client
cargo run
```

---

## 🔍 验证运行状态

### 查看程序日志（可选）

打开**第三个终端**：

```bash
solana logs
```

你会看到程序的实时日志输出。

### 查看账户余额

```bash
solana balance
```

如果余额不足：
```bash
solana airdrop 2
```

---

## ⚠️ 常见问题快速修复

### 问题 1: "command not found: solana"

**解决**:
```bash
# 安装 Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 添加到 PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### 问题 2: "command not found: anchor"

**解决**:
```bash
# 安装 Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 问题 3: "insufficient funds"

**解决**:
```bash
# 请求空投
solana airdrop 2

# 验证余额
solana balance
```

### 问题 4: "Connection refused"

**解决**:
- 确保 `solana-test-validator` 正在运行
- 检查是否在正确的终端中运行命令

### 问题 5: TypeScript 编译错误

**解决**:
```bash
# 重新构建生成类型
anchor build

# 重新安装依赖
yarn install
```

### 问题 6: "Program not deployed"

**解决**:
```bash
# 重新部署
anchor build
anchor deploy
```

---

## 🎯 下一步做什么？

### 1. 探索代码

```bash
# 查看智能合约
cat programs/my-project/src/lib.rs

# 查看 TypeScript 客户端
cat client-ts/index.ts
```

### 2. 修改代码

尝试修改计数器的初始值：

```rust
// 在 programs/my-project/src/lib.rs 中
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = 100;  // 改为 100
    counter.authority = ctx.accounts.user.key();
    Ok(())
}
```

然后重新部署：
```bash
anchor build && anchor deploy
npx ts-node client-ts/examples/basic.ts
```

### 3. 阅读文档

- [项目 README](README.md) - 完整文档
- [TypeScript 客户端文档](client-ts/README.md) - 客户端说明
- [对比文档](client-ts/COMPARISON.md) - 客户端对比

### 4. 运行测试

```bash
# 运行 Anchor 测试
anchor test
```

---

## 📊 命令速查表

| 任务 | 命令 |
|-----|------|
| 启动测试网络 | `solana-test-validator` |
| 构建程序 | `anchor build` |
| 部署程序 | `anchor deploy` |
| 运行测试 | `anchor test` |
| 运行 TS 客户端 | `npx ts-node client-ts/index.ts` |
| 运行 Rust 客户端 | `cd client && cargo run` |
| 查看日志 | `solana logs` |
| 查看余额 | `solana balance` |
| 请求空投 | `solana airdrop 2` |
| 查看程序 ID | `solana address -k target/deploy/my_project-keypair.json` |

---

## 🎓 学习路径

### 初学者（1-2 小时）

1. ✅ 完成快速开始（本文件）
2. ✅ 运行所有示例
3. ✅ 阅读 [client-ts/README.md](client-ts/README.md)
4. ✅ 修改代码并重新部署

### 中级（3-5 小时）

1. ✅ 阅读智能合约代码
2. ✅ 理解账户结构
3. ✅ 学习错误处理
4. ✅ 添加新指令

### 高级（5+ 小时）

1. ✅ 深入理解 Anchor 框架
2. ✅ 学习 PDA 和 CPI
3. ✅ 阅读 Solana 官方文档
4. ✅ 构建自己的项目

---

## 💡 专业提示

### 提示 1: 使用多个终端

建议打开 3 个终端：
- **终端 1**: `solana-test-validator`（保持运行）
- **终端 2**: 部署和运行客户端
- **终端 3**: `solana logs`（查看日志）

### 提示 2: 自动重启测试网络

```bash
# 使用 --reset 清除之前的状态
solana-test-validator --reset
```

### 提示 3: 快速重新部署

```bash
# 一键构建和部署
anchor build && anchor deploy && npx ts-node client-ts/examples/basic.ts
```

### 提示 4: 查看详细错误

```bash
# 运行客户端时显示详细日志
RUST_LOG=debug npx ts-node client-ts/index.ts
```

---

## 🆘 需要帮助？

- 📖 查看 [README.md](README.md) 了解更多信息
- 🐛 查看 [常见问题](#常见问题快速修复)
- 💬 加入 [Solana Discord](https://discord.gg/solana)
- 📚 访问 [Solana Cookbook](https://solanacookbook.com/)

---

## ✅ 检查清单

部署前确保：

- [ ] `solana-test-validator` 正在运行
- [ ] 钱包有足够余额（`solana balance`）
- [ ] 程序已构建（`anchor build`）
- [ ] 程序已部署（`anchor deploy`）
- [ ] 依赖已安装（`yarn install`）

---

<div align="center">

**🎉 恭喜！你已经成功运行了 Solana 计数器项目！**

继续探索，愉快编码！💻

</div>
