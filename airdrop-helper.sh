#!/bin/bash

# Phantom 钱包空投助手脚本

echo "================================"
echo "  Phantom 钱包空投助手"
echo "================================"
echo ""

# 检查本地验证器是否运行
echo "🔍 检查本地验证器状态..."
if solana cluster-version &>/dev/null; then
    echo "✅ 本地验证器运行正常"
    solana cluster-version
else
    echo "❌ 本地验证器未运行"
    echo ""
    echo "请在新终端执行："
    echo "  solana-test-validator"
    exit 1
fi

echo ""
echo "================================"
echo ""

# 获取钱包地址
read -p "请输入您的 Phantom 钱包地址: " WALLET_ADDRESS

if [ -z "$WALLET_ADDRESS" ]; then
    echo "❌ 未输入钱包地址"
    exit 1
fi

echo ""
echo "🎁 正在向 $WALLET_ADDRESS 空投 10 SOL..."
echo ""

# 空投 SOL
solana airdrop 10 "$WALLET_ADDRESS"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 空投成功！"
    echo ""
    echo "📊 查询余额..."
    solana balance "$WALLET_ADDRESS"
    echo ""
    echo "================================"
    echo "✅ 完成！现在可以在前端连接钱包了"
    echo ""
    echo "访问: http://localhost:5173"
    echo "================================"
else
    echo ""
    echo "❌ 空投失败，请检查："
    echo "  1. 钱包地址是否正确"
    echo "  2. 本地验证器是否正常运行"
    echo "  3. 是否已经空投过太多次（有限制）"
fi
