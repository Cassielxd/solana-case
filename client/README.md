# Solana 计数器 Rust 客户端

这是一个用 Rust 编写的客户端程序，演示如何调用部署在 Solana 链上的计数器智能合约。

## 功能说明

这个客户端展示了如何：
1. 连接到 Solana 网络
2. 构建和发送交易
3. 调用智能合约的指令（initialize、increment、decrement）
4. 查询链上账户状态

## 使用步骤

### 1. 启动本地 Solana 测试网络

```bash
# 在一个终端窗口中启动
solana-test-validator
```

### 2. 部署智能合约

```bash
# 在项目根目录
anchor build
anchor deploy
```

### 3. 运行客户端

```bash
cd client
cargo run
```

## 代码结构说明

### 核心概念

#### 1. **指令鉴别器（Discriminator）**
Anchor 框架为每个指令生成唯一的 8 字节鉴别器（通过 SHA256 哈希函数）：

```rust
const INITIALIZE_DISCRIMINATOR: [u8; 8] = [175, 175, 109, 31, 13, 152, 155, 237];
const INCREMENT_DISCRIMINATOR: [u8; 8] = [11, 18, 104, 9, 104, 174, 59, 33];
const DECREMENT_DISCRIMINATOR: [u8; 8] = [106, 227, 123, 53, 123, 184, 159, 234];
```

#### 2. **构建指令**
使用 `Instruction` 结构体构建交易指令：

```rust
let increment_ix = Instruction {
    program_id: *program_id,
    accounts: vec![
        AccountMeta::new(*counter, false),        // 可写账户
        AccountMeta::new_readonly(payer.pubkey(), true),  // 只读签名账户
    ],
    data: INCREMENT_DISCRIMINATOR.to_vec(),
};
```

#### 3. **发送交易**
```rust
let recent_blockhash = client.get_latest_blockhash()?;
let transaction = Transaction::new_signed_with_payer(
    &[increment_ix],           // 指令数组
    Some(&payer.pubkey()),     // 费用支付者
    &[payer],                  // 签名者
    recent_blockhash,          // 最新区块哈希
);

let signature = client.send_and_confirm_transaction(&transaction)?;
```

#### 4. **读取账户数据**
```rust
let account = client.get_account(counter)?;
// 跳过 8 字节鉴别器，读取数据
let count_bytes: [u8; 8] = account.data[8..16].try_into()?;
let count = u64::from_le_bytes(count_bytes);
```

## 账户数据布局

计数器账户的数据结构：
```
+------------------+------------------+------------------+
| Discriminator    | Count (u64)      | Authority        |
| 8 bytes          | 8 bytes          | 32 bytes         |
+------------------+------------------+------------------+
总共: 48 字节
```

## 完整流程示例

```
1. 初始化计数器
   ├─ 创建新账户 (System Program)
   └─ 调用 initialize 指令

2. 增加计数器
   └─ 调用 increment 指令

3. 查询状态
   └─ 读取账户数据

4. 减少计数器
   └─ 调用 decrement 指令
```

## 如何获取指令鉴别器？

有两种方式获取 Anchor 指令的鉴别器：

### 方法 1：从 IDL 文件读取
```bash
# 构建后会生成 target/idl/my_project.json
cat target/idl/my_project.json | jq '.instructions'
```

### 方法 2：手动计算
```rust
use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

fn get_discriminator(name: &str) -> [u8; 8] {
    let preimage = format!("global:{}", name);
    let mut hasher = Sha256::new();
    hasher.update(preimage.as_bytes());
    let result = hasher.finalize();
    result[..8].try_into().unwrap()
}

// 使用
let init_disc = get_discriminator("initialize");
let inc_disc = get_discriminator("increment");
```

## 调试技巧

### 查看程序日志
```bash
solana logs
```

### 查看账户信息
```bash
solana account <COUNTER_ADDRESS>
```

### 查看交易详情
```bash
solana confirm -v <TRANSACTION_SIGNATURE>
```

## 常见问题

### Q: 如何更改连接的网络？
修改 `main.rs` 中的 RPC URL：
```rust
// 本地网络
let rpc_url = "http://localhost:8899";

// 开发网
let rpc_url = "https://api.devnet.solana.com";

// 测试网
let rpc_url = "https://api.testnet.solana.com";
```

### Q: 程序 ID 从哪里获取？
从 `programs/my-project/src/lib.rs` 的 `declare_id!` 宏中获取，或者从 `Anchor.toml` 中查看。

### Q: 如何在其他 Rust 程序中复用？
将客户端代码封装成库（lib.rs），然后在其他项目中作为依赖引用。

## 扩展阅读

- [Solana 官方文档](https://docs.solana.com/)
- [Anchor 框架文档](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
