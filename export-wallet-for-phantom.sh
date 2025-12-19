#!/bin/bash

echo "================================"
echo "  导出本地钱包到 Phantom"
echo "================================"
echo ""

WALLET_PATH="$HOME/.config/solana/id.json"

if [ ! -f "$WALLET_PATH" ]; then
    echo "❌ 未找到本地钱包文件: $WALLET_PATH"
    echo ""
    echo "请确认钱包文件位置，或创建新钱包："
    echo "  solana-keygen new"
    exit 1
fi

echo "📍 本地钱包位置: $WALLET_PATH"
echo ""

# 获取钱包地址
WALLET_ADDRESS=$(solana-keygen pubkey "$WALLET_PATH")
echo "🔑 钱包地址: $WALLET_ADDRESS"
echo ""

# 获取余额
BALANCE=$(solana balance "$WALLET_ADDRESS" 2>/dev/null || echo "无法获取")
echo "💰 当前余额: $BALANCE"
echo ""

echo "================================"
echo "  导入步骤"
echo "================================"
echo ""
echo "1️⃣ 查看私钥（下一步会显示）"
echo "2️⃣ 在 Phantom 中选择「导入钱包」"
echo "3️⃣ 选择「私钥」导入方式"
echo "4️⃣ 复制粘贴下面的私钥数组"
echo ""

read -p "按回车键显示私钥数组... " -n1 -s
echo ""
echo ""

echo "================================"
echo "  🔐 您的私钥数组（复制下面整行）"
echo "================================"
echo ""

# 显示私钥数组
cat "$WALLET_PATH"

echo ""
echo ""
echo "================================"
echo "  ⚠️  安全提示"
echo "================================"
echo ""
echo "⚠️  这是您的私钥！请妥善保管，不要分享给任何人！"
echo "⚠️  导入 Phantom 后，请清除终端历史或关闭终端"
echo ""
echo "================================"
echo "  📋 Phantom 导入步骤"
echo "================================"
echo ""
echo "1. 打开 Phantom 钱包扩展"
echo "2. 点击右上角菜单（三条线 ≡）"
echo "3. 选择「添加/导入钱包」"
echo "4. 选择「导入私钥」"
echo "5. 将上面的数组完整复制粘贴"
echo "6. 设置钱包名称（可选）"
echo "7. 点击「导入」"
echo ""
echo "✅ 完成后，您的本地钱包将在 Phantom 中可用！"
echo ""
