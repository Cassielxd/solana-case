<template>
  <div class="amm-container">
    <el-card class="title-card">
      <h1>💱 自动做市商 (AMM)</h1>
      <p>去中心化交易所核心 - 流动性池与代币交换</p>
    </el-card>

    <el-alert
      v-if="!walletStore.connected"
      title="请先连接钱包"
      type="warning"
      :closable="false"
      show-icon
      class="alert-box"
    >
      请点击右上角连接 Phantom 钱包后使用 AMM 功能
    </el-alert>

    <template v-else>
      <!-- 池信息 -->
      <el-card class="pool-card">
        <h2>流动性池信息</h2>
        <el-form :model="poolForm" label-width="120px">
          <el-form-item label="Token A Mint">
            <el-input v-model="poolForm.tokenAMint" placeholder="输入 Token A Mint 地址" />
          </el-form-item>
          <el-form-item label="Token B Mint">
            <el-input v-model="poolForm.tokenBMint" placeholder="输入 Token B Mint 地址" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchPool" :loading="loading">
              查询池信息
            </el-button>
            <el-button @click="initPool" :loading="loading" :disabled="poolExists">
              初始化池
            </el-button>
          </el-form-item>
        </el-form>

        <el-divider v-if="poolData" />

        <div v-if="poolData && poolExists" class="pool-stats">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-statistic
                title="Token A 储备"
                :value="formatAmount(poolData.reserveA)"
              />
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="Token B 储备"
                :value="formatAmount(poolData.reserveB)"
              />
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="价格比率 (B/A)"
                :value="poolData.priceRatio?.toFixed(4) || '0'"
              />
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 交换界面 -->
      <el-card class="swap-card" v-if="poolExists">
        <h2>代币交换</h2>
        <el-form :model="swapForm" label-width="120px">
          <el-form-item label="交换方向">
            <el-radio-group v-model="swapForm.isAToB">
              <el-radio :value="true">A → B</el-radio>
              <el-radio :value="false">B → A</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="输入数量">
            <el-input-number
              v-model="swapForm.amountIn"
              :min="0"
              :step="1"
              @change="getQuote"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getQuote" :loading="quoteLoading">
              获取报价
            </el-button>
          </el-form-item>
        </el-form>

        <div v-if="quote" class="quote-info">
          <h3>交换报价</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="输入数量">
              {{ quote.amountIn }}
            </el-descriptions-item>
            <el-descriptions-item label="预计输出">
              {{ quote.amountOut }}
            </el-descriptions-item>
            <el-descriptions-item label="有效价格">
              {{ quote.effectivePrice.toFixed(4) }}
            </el-descriptions-item>
            <el-descriptions-item label="价格影响">
              {{ quote.priceImpact }}
            </el-descriptions-item>
            <el-descriptions-item label="手续费">
              {{ quote.fee }}
            </el-descriptions-item>
            <el-descriptions-item label="最少获得">
              {{ quote.minimumReceived }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <!-- 使用说明 -->
      <el-card class="info-card">
        <h3>💡 AMM 说明</h3>
        <ul>
          <li><strong>恒定乘积公式</strong>: x * y = k，确保流动性</li>
          <li><strong>交易手续费</strong>: 0.3% 的交易费用</li>
          <li><strong>LP 代币</strong>: 添加流动性可获得 LP 代币</li>
          <li><strong>滑点保护</strong>: 自动计算最少接收数量</li>
        </ul>
        <el-alert
          title="提示"
          type="info"
          :closable="false"
          show-icon
        >
          这是一个演示程序，请使用测试代币进行操作
        </el-alert>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useWalletStore } from '../stores/wallet'
import { ammAPI } from '../api'
import { ElMessage } from 'element-plus'

const walletStore = useWalletStore()

const loading = ref(false)
const quoteLoading = ref(false)
const poolExists = ref(false)
const poolData = ref<any>(null)
const quote = ref<any>(null)

const poolForm = reactive({
  tokenAMint: '',
  tokenBMint: '',
})

const swapForm = reactive({
  amountIn: 10,
  isAToB: true,
})

const formatAmount = (amount: string | number) => {
  if (!amount) return '0'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return (num / 1e6).toFixed(2)
}

const fetchPool = async () => {
  if (!poolForm.tokenAMint || !poolForm.tokenBMint) {
    ElMessage.warning('请输入 Token Mint 地址')
    return
  }

  loading.value = true
  try {
    const data = await ammAPI.getPool(poolForm.tokenAMint, poolForm.tokenBMint)
    if (data.exists === false) {
      poolExists.value = false
      ElMessage.info('池不存在，请先初始化')
    } else {
      poolData.value = data
      poolExists.value = true
      ElMessage.success('池信息获取成功')
    }
  } catch (error: any) {
    ElMessage.error('获取池信息失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const initPool = async () => {
  if (!walletStore.publicKey || !poolForm.tokenAMint || !poolForm.tokenBMint) {
    ElMessage.warning('请确保已连接钱包并输入代币地址')
    return
  }

  loading.value = true
  try {
    const result = await ammAPI.initializePool(
      poolForm.tokenAMint,
      poolForm.tokenBMint,
      walletStore.publicKey
    )
    ElMessage.success('池初始化成功!')
    await fetchPool()
  } catch (error: any) {
    ElMessage.error('初始化失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const getQuote = async () => {
  if (!poolExists.value || swapForm.amountIn <= 0) return

  quoteLoading.value = true
  try {
    const data = await ammAPI.getSwapQuote(
      poolForm.tokenAMint,
      poolForm.tokenBMint,
      swapForm.amountIn * 1e6, // 转换为最小单位
      swapForm.isAToB
    )
    quote.value = data
  } catch (error: any) {
    ElMessage.error('获取报价失败: ' + error.message)
  } finally {
    quoteLoading.value = false
  }
}

watch(() => swapForm.isAToB, () => {
  if (poolExists.value && swapForm.amountIn > 0) {
    getQuote()
  }
})
</script>

<style scoped>
.amm-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.title-card {
  text-align: center;
  margin-bottom: 20px;
}

.title-card h1 {
  color: #409eff;
  margin-bottom: 10px;
}

.title-card p {
  color: #909399;
}

.alert-box {
  margin-bottom: 20px;
}

.pool-card,
.swap-card,
.info-card {
  margin-bottom: 20px;
}

.pool-card h2,
.swap-card h2 {
  margin-bottom: 20px;
  color: #303133;
}

.pool-stats {
  margin-top: 20px;
}

.quote-info {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.quote-info h3 {
  margin-bottom: 15px;
  color: #303133;
}

.info-card h3 {
  margin-bottom: 15px;
  color: #303133;
}

.info-card ul {
  padding-left: 20px;
  line-height: 2;
  margin-bottom: 15px;
}

.info-card li {
  margin-bottom: 8px;
  color: #606266;
}
</style>
