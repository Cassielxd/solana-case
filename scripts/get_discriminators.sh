#!/bin/bash

# 从 IDL 文件中提取指令鉴别器
# 使用方法: ./scripts/get_discriminators.sh

IDL_FILE="target/idl/my_project.json"

if [ ! -f "$IDL_FILE" ]; then
    echo "❌ IDL 文件不存在: $IDL_FILE"
    echo "请先运行: anchor build"
    exit 1
fi

echo "📖 从 IDL 读取指令鉴别器"
echo "================================"
echo ""

# 提取所有指令
echo "// Anchor 指令鉴别器（从 $IDL_FILE 自动生成）"
echo ""

# 使用 Python 解析 JSON（更可靠）
python3 << 'EOF'
import json
import sys

try:
    with open('target/idl/my_project.json', 'r') as f:
        idl = json.load(f)

    for instruction in idl['instructions']:
        name = instruction['name']
        disc = instruction['discriminator']

        # 转换为大写常量名
        const_name = name.upper() + "_DISCRIMINATOR"

        # 格式化为 Rust 数组
        disc_str = "[" + ", ".join(map(str, disc)) + "]"

        print(f"const {const_name}: [u8; 8] = {disc_str};")

    print("\n✅ 成功提取鉴别器")

except Exception as e:
    print(f"❌ 错误: {e}", file=sys.stderr)
    sys.exit(1)
EOF

echo ""
echo "💡 提示: 复制上面的常量到你的 Rust 代码中"
