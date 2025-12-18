# Solana Anchor 项目部署和调用完整指南

## 目录
1. [环境准备](#环境准备)
2. [构建程序](#构建程序)
3. [部署程序](#部署程序)
4. [参数获取说明](#参数获取说明)
5. [Rust 客户端调用](#rust-客户端调用)
6. [TypeScript 客户端调用](#typescript-客户端调用)
7. [常见问题](#常见问题)

---

## 环境准备

### 1. 启动 Localnet（持久化模式）

```bash
# 启动本地测试验证器，数据持久化到 .anchor/test-ledger 目录
solana-test-validator --ledger .anchor/test-ledger

# 或者不持久化（重启后数据清空）
solana-test-validator
```

**说明**：
- `--ledger` 参数指定数据存储目录，重启后数据不会丢失
- 不带参数时，重启验证器会清空所有账户和程序

### 2. 配置 Solana CLI

```bash
# 查看当前配置
solana config get

# 设置为 localnet
solana config set --url localhost

# 查看钱包余额
solana balance

# 如果余额不足，空投 SOL（仅 localnet/devnet）
solana airdrop 10
```

---

## 构建程序

### 1. 使用 Anchor 构建

```bash
# 在项目根目录执行
anchor build
```

**构建产物**：
- 编译后的程序：`target/deploy/my_project.so`
- 程序密钥对：`target/deploy/my_project-keypair.json`
- IDL 文件：`target/idl/my_project.json`

### 2. 获取程序 ID

```bash
# 从密钥对文件获取程序 ID
solana-keygen pubkey target/deploy/my_project-keypair.json
```

**输出示例**：
```
MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj
```

### 3. 更新程序 ID 配置

确保以下文件中的程序 ID 一致：

**a. `Anchor.toml`**
```toml
[programs.localnet]
my_project = "MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj"
```

**b. `programs/my-project/src/lib.rs`**
```rust
declare_id!("MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj");
```

**c. 客户端代码中的 PROGRAM_ID**
```rust
const PROGRAM_ID: &str = "MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj";
```

---

## 部署程序

### 方法 1：使用 Anchor 部署（推荐）

```bash
anchor deploy
```

### 方法 2：使用 Solana CLI 部署

```bash
solana program deploy \
  target/deploy/my_project.so \
  --program-id target/deploy/my_project-keypair.json
```

**输出示例**：
```
Program Id: MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj
Signature: 5fJcHSdQAvi3MAEwzKFKgGZJoMSce1YnZU4bA3S9K299...
```

### 验证部署

```bash
# 查看程序信息
solana program show MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj

# 输出示例：
# Program Id: MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: ...
# Authority: EiHBw7AVAiTHDRHhcjmQHpWoXTnwU3h43SP9DeZYsTn8
# Last Deployed In Slot: 123
# Data Length: 208648 (0x32f88) bytes
```

---

## 参数获取说明

### 1. 程序 ID (Program ID)

**获取方式**：
```bash
solana-keygen pubkey target/deploy/my_project-keypair.json
```

**用途**：
- 标识链上程序的唯一地址
- 客户端调用时必须指定

### 2. 账户鉴别器 (Discriminator)

**什么是 Discriminator**：
- 账户数据的前 8 字节
- 用于识别账户类型
- 由 Anchor 根据账户名称自动生成

**获取方式**：从 IDL 文件中获取

```bash
# 查看 IDL 文件
cat target/idl/my_project.json
```

**示例**：
```json
{
  "accounts": [
    {
      "name": "Counter",
      "discriminator": [255, 176, 4, 245, 188, 253, 124, 25]
    }
  ]
}
```

**在 Rust 中使用**：
```rust
impl anchor_lang::Discriminator for Counter {
    const DISCRIMINATOR: &'static [u8] = &[255, 176, 4, 245, 188, 253, 124, 25];
}
```

### 3. 指令鉴别器 (Instruction Discriminator)

**获取方式**：从 IDL 文件中获取

```json
{
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [175, 175, 109, 31, 13, 152, 155, 237]
    },
    {
      "name": "increment",
      "discriminator": [11, 18, 104, 9, 104, 174, 59, 33]
    },
    {
      "name": "decrement",
      "discriminator": [106, 227, 168, 59, 248, 27, 150, 101]
    }
  ]
}
```

**在 Rust 中使用**：
```rust
// 构建 initialize 指令数据
let mut data = vec![175, 175, 109, 31, 13, 152, 155, 237];  // 鉴别器
Initialize {}.serialize(&mut data)?;  // 参数
```

### 4. 钱包密钥对 (Wallet Keypair)

**默认位置**：
```bash
~/.config/solana/id.json
```

**获取钱包地址**：
```bash
solana address

# 或者从文件获取
solana-keygen pubkey ~/.config/solana/id.json
```

**在代码中加载**：
```rust
use anchor_client::solana_sdk::signature::read_keypair_file;

let payer = read_keypair_file(&*shellexpand::tilde("~/.config/solana/id.json"))
    .expect("无法读取钱包文件");
```

### 5. 系统程序 ID (System Program ID)

**固定值**：`11111111111111111111111111111111`

**在代码中使用**：
```rust
use anchor_client::solana_sdk::system_program;

let system_program_id = system_program::ID;
```

---

## Rust 客户端调用

### 完整示例：初始化计数器

```rust
use anchor_client::{
    anchor_lang::{AnchorDeserialize, AnchorSerialize},
    solana_sdk::{
        commitment_config::CommitmentConfig,
        pubkey::Pubkey,
        signature::{read_keypair_file, Keypair, Signer},
        system_program,
    },
    Client, Cluster,
};
use std::rc::Rc;
use std::str::FromStr;

fn main() -> anyhow::Result<()> {
    // 1. 配置网络和钱包
    let cluster = Cluster::Localnet;
    let payer = read_keypair_file(&*shellexpand::tilde("~/.config/solana/id.json"))?;
    let payer_pubkey = payer.pubkey();

    // 2. 创建客户端
    let client = Client::new_with_options(
        cluster,
        Rc::new(payer),
        CommitmentConfig::confirmed(),
    );

    // 3. 加载程序
    let program_id = Pubkey::from_str("MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj")?;
    let program = client.program(program_id)?;

    // 4. 生成计数器账户
    let counter = Keypair::new();
    println!("计数器地址: {}", counter.pubkey());

    // 5. 构建指令数据
    let initialize_data = {
        let mut data = vec![175, 175, 109, 31, 13, 152, 155, 237];  // initialize 鉴别器
        Initialize {}.serialize(&mut data)?;
        data
    };

    // 6. 发送交易
    let tx = program
        .request()
        .instruction(anchor_client::solana_sdk::instruction::Instruction {
            program_id,
            accounts: vec![
                // counter 账户 (mut, signer)
                anchor_client::solana_sdk::instruction::AccountMeta::new(
                    counter.pubkey(),
                    true,  // is_signer
                ),
                // user 账户 (mut, signer)
                anchor_client::solana_sdk::instruction::AccountMeta::new(
                    payer_pubkey,
                    true,  // is_signer
                ),
                // system_program (readonly)
                anchor_client::solana_sdk::instruction::AccountMeta::new_readonly(
                    system_program::ID,
                    false,  // is_signer
                ),
            ],
            data: initialize_data,
        })
        .signer(&counter)  // 添加 counter 签名
        .send()?;

    println!("交易签名: {}", tx);

    // 7. 查询账户数据
    let counter_data = program.rpc().get_account_data(&counter.pubkey())?;
    let counter_account = Counter::deserialize(&mut &counter_data[8..])?;  // 跳过 8 字节鉴别器
    println!("计数值: {}", counter_account.count);

    Ok(())
}

// 数据结构定义（必须与链上程序一致）
#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Initialize {}
```

### 运行客户端

```bash
# 进入 client 目录
cd client

# 运行
cargo run

# 或者编译后运行
cargo build --release
./target/release/counter-client
```

---

## TypeScript 客户端调用

### 1. 安装依赖

```bash
npm install @coral-xyz/anchor @solana/web3.js
# 或
yarn add @coral-xyz/anchor @solana/web3.js
```

### 2. TypeScript 示例

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import fs from "fs";

// 加载 IDL
const idl = JSON.parse(fs.readFileSync("./target/idl/my_project.json", "utf8"));

async function main() {
    // 1. 配置连接
    const connection = new anchor.web3.Connection("http://127.0.0.1:8899", "confirmed");

    // 2. 加载钱包
    const walletKeypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(fs.readFileSync(
            `${process.env.HOME}/.config/solana/id.json`,
            "utf8"
        )))
    );
    const wallet = new anchor.Wallet(walletKeypair);

    // 3. 创建 Provider
    const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });

    // 4. 加载程序
    const programId = new PublicKey("MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj");
    const program = new Program(idl, programId, provider);

    // 5. 生成计数器账户
    const counter = Keypair.generate();
    console.log("计数器地址:", counter.publicKey.toBase58());

    // 6. 调用 initialize 指令
    const tx = await program.methods
        .initialize()
        .accounts({
            counter: counter.publicKey,
            user: wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([counter])
        .rpc();

    console.log("交易签名:", tx);

    // 7. 查询账户数据
    const counterAccount = await program.account.counter.fetch(counter.publicKey);
    console.log("计数值:", counterAccount.count.toString());
    console.log("权限:", counterAccount.authority.toBase58());

    // 8. 增加计数器
    await program.methods
        .increment()
        .accounts({
            counter: counter.publicKey,
            authority: wallet.publicKey,
        })
        .rpc();

    // 9. 再次查询
    const updatedAccount = await program.account.counter.fetch(counter.publicKey);
    console.log("新计数值:", updatedAccount.count.toString());
}

main().catch(console.error);
```

### 运行 TypeScript 客户端

```bash
# 安装 ts-node
npm install -g ts-node typescript

# 运行
ts-node client.ts
```

---

## 账户结构说明

### Counter 账户布局

```
┌─────────────────┬──────────┬────────┐
│     字段        │   大小   │  偏移  │
├─────────────────┼──────────┼────────┤
│ Discriminator   │  8 字节  │   0    │
│ count (u64)     │  8 字节  │   8    │
│ authority (Pubkey)│ 32 字节│  16    │
└─────────────────┴──────────┴────────┘
总大小：48 字节
```

**反序列化示例**：
```rust
// 跳过前 8 字节鉴别器
let counter = Counter::deserialize(&mut &account_data[8..])?;
```

---

## 指令账户列表

### 1. Initialize 指令

| 账户            | 可写 | 签名 | 说明                    |
|----------------|------|------|------------------------|
| counter        | ✓    | ✓    | 要初始化的计数器账户      |
| user           | ✓    | ✓    | 支付租金的用户账户        |
| system_program |      |      | Solana 系统程序          |

### 2. Increment/Decrement 指令

| 账户      | 可写 | 签名 | 说明              |
|----------|------|------|------------------|
| counter  | ✓    |      | 计数器账户         |
| authority|      | ✓    | 权限所有者账户     |

---

## 常见问题

### Q1: "This program may not be used for executing instructions"

**原因**：程序未部署或 localnet 重启导致程序丢失

**解决**：
```bash
anchor build
anchor deploy
```

### Q2: 程序 ID 不匹配

**原因**：`Anchor.toml`、`lib.rs`、客户端代码中的程序 ID 不一致

**解决**：
```bash
# 1. 获取实际的程序 ID
solana-keygen pubkey target/deploy/my_project-keypair.json

# 2. 更新所有配置文件中的程序 ID
# - Anchor.toml
# - programs/my-project/src/lib.rs (declare_id!)
# - 客户端代码中的 PROGRAM_ID

# 3. 重新构建和部署
anchor build
anchor deploy
```

### Q3: AccountNotFound 错误

**原因**：账户不存在或地址错误

**解决**：
- 检查账户地址是否正确
- 确认账户已创建
- 使用 `solana account <ADDRESS>` 验证

### Q4: 如何持久化 Localnet 数据

**方法**：
```bash
# 启动时指定 ledger 目录
solana-test-validator --ledger .anchor/test-ledger

# 数据会保存到 .anchor/test-ledger 目录
# 重启后数据不会丢失
```

### Q5: 如何查看交易日志

**方法 1：通过交易签名**
```bash
solana confirm -v <SIGNATURE>
```

**方法 2：查看 Anchor 日志**
```bash
# 查看最新日志
cat .anchor/program-logs/*.log
```

**方法 3：在代码中查看**
```rust
// 程序中使用 msg! 宏输出日志
msg!("Counter value: {}", counter.count);
```

---

## 部署到 Devnet/Mainnet

### 1. 切换网络

```bash
# 切换到 Devnet
solana config set --url devnet

# 切换到 Mainnet
solana config set --url mainnet-beta
```

### 2. 获取 SOL

**Devnet**：
```bash
solana airdrop 2
```

**Mainnet**：
- 需要购买真实的 SOL
- 确保有足够余额支付部署费用（约 0.5-2 SOL）

### 3. 更新 Anchor.toml

```toml
[programs.devnet]
my_project = "你的程序ID"

[programs.mainnet]
my_project = "你的程序ID"
```

### 4. 部署

```bash
# 部署到 Devnet
anchor deploy --provider.cluster devnet

# 部署到 Mainnet
anchor deploy --provider.cluster mainnet
```

---

## 安全检查清单

部署到主网前，请确保：

- [ ] 完整的单元测试覆盖
- [ ] 集成测试通过
- [ ] 代码审计
- [ ] 权限控制正确
- [ ] 没有硬编码的测试地址
- [ ] 错误处理完善
- [ ] 使用 `checked_add`/`checked_sub` 防止溢出
- [ ] 账户验证充分
- [ ] 测试了所有边界条件

---

## 总结

### 快速开始流程

```bash
# 1. 启动本地网络
solana-test-validator --ledger .anchor/test-ledger

# 2. 构建程序
anchor build

# 3. 获取程序 ID
solana-keygen pubkey target/deploy/my_project-keypair.json

# 4. 更新配置（Anchor.toml, lib.rs, 客户端代码）

# 5. 重新构建
anchor build

# 6. 部署
anchor deploy

# 7. 运行客户端测试
cd client
cargo run
```

### 关键参数获取总结

| 参数               | 获取方式                                          |
|-------------------|--------------------------------------------------|
| 程序 ID            | `solana-keygen pubkey target/deploy/*.json`     |
| 账户鉴别器         | 从 `target/idl/my_project.json` 获取             |
| 指令鉴别器         | 从 `target/idl/my_project.json` 获取             |
| 钱包地址           | `solana address`                                 |
| 系统程序 ID        | `11111111111111111111111111111111` (固定)        |
| 账户数据           | `solana account <ADDRESS>`                       |

---

**更多资源**：
- [Anchor 官方文档](https://www.anchor-lang.com/)
- [Solana 官方文档](https://docs.solana.com/)
- [Solana Cookbook](https://solanacookbook.com/)
