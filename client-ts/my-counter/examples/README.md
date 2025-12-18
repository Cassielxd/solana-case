# TypeScript 客户端示例

这个目录包含了多个使用场景的示例代码，帮助你快速理解和使用 Anchor TypeScript SDK。

## 📁 示例列表

### 1. basic.ts - 基础示例

最简单的客户端使用方式，展示核心功能。

**包含内容**:
- 初始化计数器
- 增加计数器
- 查询状态

**运行**:
```bash
npx ts-node client-ts/examples/basic.ts
```

**适合人群**: 初学者

---

### 2. batch.ts - 批量操作示例

演示如何批量执行交易和性能测试。

**包含内容**:
- 串行执行多个交易
- 性能测试和计时
- 批量查询账户
- 进度显示

**运行**:
```bash
npx ts-node client-ts/examples/batch.ts
```

**适合人群**: 需要批量操作的开发者

---

### 3. error-handling.ts - 错误处理示例

演示如何处理各种错误情况。

**包含内容**:
- 权限验证错误
- 账户不存在错误
- 重复初始化错误
- 自定义错误处理函数

**运行**:
```bash
npx ts-node client-ts/examples/error-handling.ts
```

**适合人群**: 需要健壮错误处理的开发者

---

## 🚀 快速开始

### 前置要求

1. 启动本地测试网络:
```bash
solana-test-validator
```

2. 部署程序:
```bash
anchor build
anchor deploy
```

3. 确保钱包有足够余额:
```bash
solana balance
# 如果余额不足
solana airdrop 2
```

### 运行所有示例

```bash
# 基础示例
npx ts-node client-ts/examples/basic.ts

# 批量操作
npx ts-node client-ts/examples/batch.ts

# 错误处理
npx ts-node client-ts/examples/error-handling.ts
```

---

## 📝 示例对比

| 示例 | 复杂度 | 代码行数 | 学习时间 | 适用场景 |
|-----|-------|---------|---------|---------|
| basic.ts | ⭐ | ~50 | 5 分钟 | 入门学习 |
| batch.ts | ⭐⭐ | ~80 | 10 分钟 | 批量操作 |
| error-handling.ts | ⭐⭐⭐ | ~120 | 15 分钟 | 生产环境 |

---

## 💡 学习路径

### 推荐顺序

1. **basic.ts** - 理解基础概念
2. **batch.ts** - 学习批量操作
3. **error-handling.ts** - 掌握错误处理
4. **主示例 (index.ts)** - 综合应用

### 学习建议

1. **先阅读代码**
   - 查看注释了解每个步骤
   - 理解代码结构

2. **运行示例**
   - 观察输出
   - 理解执行流程

3. **修改实验**
   - 改变参数
   - 添加新功能
   - 观察结果

4. **实际应用**
   - 参考示例编写自己的代码
   - 遇到问题查看相应示例

---

## 🔧 常见问题

### Q: 运行示例时出现 "Account does not exist" 错误

A: 确保已经部署了程序:
```bash
anchor build
anchor deploy
```

### Q: 运行示例时出现连接错误

A: 检查本地测试网络是否运行:
```bash
# 检查进程
ps aux | grep solana-test-validator

# 如果没有运行，启动它
solana-test-validator
```

### Q: 如何修改连接的网络？

A: 编辑示例文件中的 `createProvider` 调用:
```typescript
const provider = createProvider({
  rpcUrl: "https://api.devnet.solana.com",  // 改为 devnet
});
```

或设置环境变量:
```bash
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
npx ts-node client-ts/examples/basic.ts
```

---

## 📚 相关资源

- [主示例 (index.ts)](../index.ts) - 完整功能演示
- [工具函数库 (utils.ts)](../utils.ts) - 实用工具函数
- [README](../README.md) - 完整文档
- [COMPARISON](../COMPARISON.md) - 与 Rust 客户端对比

---

## 🤝 贡献

欢迎添加更多示例！建议的示例主题：
- PDA（程序派生地址）使用
- 跨程序调用（CPI）
- 事件监听
- 前端集成示例

---

**提示**: 所有示例都使用相同的工具函数库 (utils.ts)，可以重复使用这些函数来简化你的代码。
