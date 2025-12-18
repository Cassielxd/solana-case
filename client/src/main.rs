// ============================================================================
// Anchor Rust Client 示例 - 计数器程序客户端
// ============================================================================
//
// 这个示例展示如何使用 anchor-client crate 调用 Solana 链上程序
//
// 注意：anchor-client 在 Rust 中的使用比较复杂，实际项目中更推荐：
// - 使用 TypeScript SDK（最简单，自动化程度高）
// - 或使用代码生成工具自动生成 Rust 类型定义
//
// ============================================================================

use anchor_client::{
    anchor_lang::{AnchorDeserialize, AnchorSerialize, Discriminator},
    solana_sdk::{
        commitment_config::CommitmentConfig,  // 交易确认级别配置
        pubkey::Pubkey,                        // Solana 公钥类型
        signature::{read_keypair_file, Keypair, Signer},  // 密钥对操作
        system_program,                        // Solana 系统程序
    },
    Client,   // Anchor 客户端
    Cluster,  // 网络集群配置
};
use anyhow::Result;      // 错误处理
use std::rc::Rc;          // 引用计数智能指针
use std::str::FromStr;    // 字符串转换 trait

// ============================================================================
// 常量定义
// ============================================================================

// 程序 ID - 从 Anchor.toml 或 lib.rs 的 declare_id! 获取
const PROGRAM_ID: &str = "MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj";

// ============================================================================
// 数据结构定义（需要手动从智能合约复制）
// ============================================================================

/// Counter 账户数据结构
///
/// 这个结构体必须与智能合约中的 Counter 完全一致
/// 用于序列化和反序列化链上账户数据
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Counter {
    pub count: u64,           // 计数值
    pub authority: Pubkey,    // 权限所有者（只有他能修改计数器）
}

/// 为 Counter 实现 Discriminator trait
///
/// Discriminator（鉴别器）是账户数据的前 8 字节
/// 用于标识账户的类型（类似于类型 ID）
/// 这个值从 target/idl/my_project.json 中获取
impl anchor_lang::Discriminator for Counter {
    const DISCRIMINATOR: &'static [u8] = &[255, 176, 4, 245, 188, 253, 124, 25];
}

// ============================================================================
// 指令参数定义
// ============================================================================

/// Initialize 指令参数
///
/// 这个指令不需要任何参数，所以是空结构体
/// 但仍需要定义以便序列化
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Initialize {}

/// Increment 指令参数
///
/// 同样不需要参数
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Increment {}

/// Decrement 指令参数
///
/// 同样不需要参数
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Decrement {}

// ============================================================================
// 主函数 - 程序入口点
// ============================================================================

fn main() -> Result<()> {
    println!("🚀 Anchor Client (简化版)");
    println!("================================\n");

    // ------------------------------------------------------------------------
    // 第 1 步：配置网络和钱包
    // ------------------------------------------------------------------------

    // 指定要连接的 Solana 集群
    // Localnet = 本地测试网络（http://127.0.0.1:8899）
    // Devnet = 开发网络
    // Mainnet = 主网
    let cluster = Cluster::Localnet;

    // 从文件加载钱包密钥对
    // ~/.config/solana/id.json 是 Solana CLI 默认的钱包位置
    // shellexpand::tilde 会将 ~ 展开为实际的 home 目录路径
    let payer = read_keypair_file(&*shellexpand::tilde("~/.config/solana/id.json"))
        .expect("❌ 无法读取钱包文件");

    // 获取钱包的公钥地址
    let payer_pubkey = payer.pubkey();

    println!("📡 连接到: {:?}", cluster);
    println!("👛 钱包地址: {}", payer_pubkey);

    // ------------------------------------------------------------------------
    // 第 2 步：创建 Anchor 客户端
    // ------------------------------------------------------------------------

    // 创建 Anchor 客户端实例
    // - cluster: 要连接的网络
    // - Rc::new(payer): 引用计数包装的钱包（用于支付交易费用和签名）
    // - CommitmentConfig::confirmed(): 交易确认级别（confirmed = 大多数验证者确认）
    let client = Client::new_with_options(
        cluster,
        Rc::new(payer),
        CommitmentConfig::confirmed(),
    );

    // ------------------------------------------------------------------------
    // 第 3 步：加载程序
    // ------------------------------------------------------------------------

    // 将程序 ID 字符串转换为 Pubkey 类型
    let program_id = Pubkey::from_str(PROGRAM_ID)?;

    // 通过程序 ID 获取程序实例
    // 这个 program 对象提供了与链上程序交互的 API
    let program = client.program(program_id)?;

    println!("📦 程序 ID: {}\n", program.id());

    // ------------------------------------------------------------------------
    // 第 4 步：初始化计数器
    // ------------------------------------------------------------------------

    println!("=== 1️⃣ 初始化计数器 ===");

    // 生成新的密钥对作为计数器账户的地址
    // 每次运行都会创建一个新的唯一地址
    let counter = Keypair::new();
    println!("🆕 新计数器地址: {}", counter.pubkey());

    // 构建 initialize 指令的数据
    // Solana 指令数据格式：[鉴别器(8字节)] + [参数序列化数据]
    let initialize_data = {
        // 创建可变的 Vec，先放入 initialize 指令的鉴别器
        // 这个鉴别器从 target/idl/my_project.json 中获取
        let mut data = vec![175, 175, 109, 31, 13, 152, 155, 237];

        // 将 Initialize 参数序列化并追加到 data
        // Initialize {} 没有参数，但仍需序列化
        Initialize {}.serialize(&mut data)?;

        data  // 返回完整的指令数据
    };

    // 发送 initialize 交易
    let tx = program
        .request()  // 创建交易请求
        .instruction(anchor_client::solana_sdk::instruction::Instruction {
            program_id,  // 要调用的程序 ID

            // 指定这个指令需要的所有账户
            // 顺序和类型必须与智能合约中的 Initialize struct 完全一致
            accounts: vec![
                // 第 1 个账户：counter (mut, signer)
                // - counter.pubkey(): 账户地址
                // - true: 需要签名（因为是新创建的账户）
                anchor_client::solana_sdk::instruction::AccountMeta::new(
                    counter.pubkey(),
                    true,  // is_signer
                ),

                // 第 2 个账户：user (mut, signer)
                // - payer_pubkey: 用户地址
                // - true: 需要签名（支付租金和交易费用）
                anchor_client::solana_sdk::instruction::AccountMeta::new(
                    payer_pubkey,
                    true,  // is_signer
                ),

                // 第 3 个账户：system_program (readonly)
                // - system_program::ID: 系统程序地址
                // - false: 不需要签名（系统程序是公共的）
                anchor_client::solana_sdk::instruction::AccountMeta::new_readonly(
                    system_program::ID,
                    false,  // is_signer
                ),
            ],

            data: initialize_data,  // 指令数据
        })
        .signer(&counter)  // 添加 counter 作为签名者
        .send()?;  // 发送交易并等待确认

    println!("📝 交易签名: {}", tx);
    println!("✅ 初始化成功\n");

    // ------------------------------------------------------------------------
    // 第 5 步：查询计数器状态
    // ------------------------------------------------------------------------

    println!("=== 2️⃣ 查询状态 ===");

    // 从链上获取计数器账户的原始数据
    // program.rpc() 返回一个 RPC 客户端，用于查询链上状态
    let counter_data = program.rpc().get_account_data(&counter.pubkey())?;

    // 反序列化账户数据
    // 账户数据布局：
    // [0..8]   - 鉴别器（Discriminator，标识账户类型）
    // [8..16]  - count (u64, 8 字节)
    // [16..48] - authority (Pubkey, 32 字节)
    //
    // &counter_data[8..] 跳过前 8 字节的鉴别器
    // Counter::deserialize() 将剩余数据反序列化为 Counter 结构体
    let counter_account = Counter::deserialize(&mut &counter_data[8..])?;

    println!("📊 计数值: {}", counter_account.count);
    println!("🔑 权限: {}\n", counter_account.authority);

    // ------------------------------------------------------------------------
    // 第 6 步：增加计数器
    // ------------------------------------------------------------------------

    println!("=== 3️⃣ 增加计数器 ===");
let mut request_builder = program
        .request();
    //发送10次交易
  for i in 0..10  {
    // 构建 increment 指令的数据
    let increment_data = {
        // increment 指令的鉴别器（从 IDL 获取）
        let mut data = vec![11, 18, 104, 9, 104, 174, 59, 33];
        // 序列化参数（increment 没有参数，但仍需调用）
        Increment {}.serialize(&mut data)?;

        data
    };
       // 发送 increment 交易
       request_builder = request_builder.instruction(anchor_client::solana_sdk::instruction::Instruction {
            program_id,

            // increment 指令需要的账户（对应智能合约中的 Update struct）
            accounts: vec![
                // 第 1 个账户：counter (mut)
                // - false: 不需要签名（已经存在的账户）
                anchor_client::solana_sdk::instruction::AccountMeta::new(
                    counter.pubkey(),
                    false,  // is_signer
                ),

                // 第 2 个账户：authority (signer)
                // - true: 需要签名（只有权限所有者才能修改）
                anchor_client::solana_sdk::instruction::AccountMeta::new_readonly(
                    payer_pubkey,
                    true,  // is_signer
                ),
            ],

            data: increment_data,
        });

   
  }
   let tx =request_builder.send()?;
    println!("📝 交易签名: {}", tx);
    // 查询更新后的状态
    let counter_data = program.rpc().get_account_data(&counter.pubkey())?;
    let counter_account = Counter::deserialize(&mut &counter_data[8..])?;
    println!("📊 新计数值: {}\n", counter_account.count);

    // ------------------------------------------------------------------------
    // 第 7 步：减少计数器
    // ------------------------------------------------------------------------

    println!("=== 4️⃣ 减少计数器 ===");

    // 构建 decrement 指令的数据
    let decrement_data = {
        // decrement 指令的鉴别器（从 IDL 获取）
        // 注意：必须使用正确的鉴别器，否则会报 InstructionFallbackNotFound 错误
        let mut data = vec![106, 227, 168, 59, 248, 27, 150, 101];

        // 序列化参数
        Decrement {}.serialize(&mut data)?;

        data
    };

    // 发送 decrement 交易
    let tx = program
        .request()
        .instruction(anchor_client::solana_sdk::instruction::Instruction {
            program_id,

            // decrement 指令需要的账户（与 increment 相同）
            accounts: vec![
                // counter 账户（可写）
                anchor_client::solana_sdk::instruction::AccountMeta::new(
                    counter.pubkey(),
                    false,
                ),

                // authority 账户（签名者）
                anchor_client::solana_sdk::instruction::AccountMeta::new_readonly(
                    payer_pubkey,
                    true,
                ),
            ],

            data: decrement_data,
        })
        .send()?;

    println!("📝 交易签名: {}", tx);

    // 查询最终状态
    let counter_data = program.rpc().get_account_data(&counter.pubkey())?;
    let counter_account = Counter::deserialize(&mut &counter_data[8..])?;
    println!("📊 最终计数值: {}\n", counter_account.count);

    // ------------------------------------------------------------------------
    // 完成
    // ------------------------------------------------------------------------

    println!("✅ 所有操作完成！");

    Ok(())
}

// ============================================================================
// 总结：使用 Anchor Rust Client 的步骤
// ============================================================================
//
// 1. 定义数据结构（Counter, Initialize, Increment, Decrement）
// 2. 实现 Discriminator trait（提供账户鉴别器）
// 3. 创建 Anchor Client 实例
// 4. 加载程序
// 5. 手动构建指令数据：
//    - 鉴别器（8 字节）
//    - 参数序列化
// 6. 指定账户元数据（地址、是否可写、是否签名）
// 7. 发送交易
// 8. 查询账户状态并反序列化
//
// 注意事项：
// - 鉴别器必须从 IDL 文件获取，不能手动计算（容易出错）
// - 账户顺序和类型必须与智能合约完全一致
// - 相比 TypeScript SDK，Rust Client 需要更多手动工作
//
// ============================================================================
