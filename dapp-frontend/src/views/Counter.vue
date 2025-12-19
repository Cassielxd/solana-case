<template>
  <div class="counter-container">
    <el-card class="title-card">
      <h1>🔢 计数器程序</h1>
      <p>简单的链上计数器，支持增加和减少操作</p>
    </el-card>

    <el-alert
      title="后端 API 模式"
      type="info"
      :closable="false"
      show-icon
      class="alert-box"
    >
      使用后端钱包进行交易，无需连接 Phantom
    </el-alert>

    <el-card class="counter-card">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-statistic title="当前计数" :value="count" />
        </el-col>
        <el-col :span="12">
          <el-statistic title="计数器地址" :value="shortenAddress(counterAddress)" />
        </el-col>
      </el-row>

      <el-divider />

      <div class="button-group">
        <el-button
          type="primary"
          size="large"
          @click="initialize"
          :loading="loading"
          :disabled="counterExists"
        >
          <el-icon><Plus /></el-icon>
          初始化计数器
        </el-button>

        <el-button
          type="success"
          size="large"
          @click="increment"
          :loading="loading"
        >
          <el-icon><Top /></el-icon>
          增加 (+1)
        </el-button>

        <el-button
          type="danger"
          size="large"
          @click="decrement"
          :loading="loading"
        >
          <el-icon><Bottom /></el-icon>
          减少 (-1)
        </el-button>

        <el-button size="large" @click="fetchCounter" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </el-card>

    <el-card class="info-card">
      <h3>💡 使用说明</h3>
      <ol>
        <li>首次使用需要点击"初始化计数器"创建你的计数器账户</li>
        <li>初始化后可以使用"增加"和"减少"按钮修改计数</li>
        <li>每次操作都会在链上执行，需要消耗少量 SOL 作为交易费</li>
        <li>计数器数据永久存储在 Solana 区块链上</li>
      </ol>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useWalletStore } from '../stores/wallet'
import { counterAPI } from '../api'
import { ElMessage } from 'element-plus'

const walletStore = useWalletStore()

const count = ref<string>('0')
const counterAddress = ref<string>('')
const counterExists = ref(false)
const loading = ref(false)
const useBackendAPI = ref(true) // 使用后端 API 模式

const shortenAddress = (address: string) => {
  if (!address) return '-'
  return `${address.slice(0, 8)}...${address.slice(-8)}`
}

// 使用后端钱包地址
const BACKEND_WALLET = 'EiHBw7AVAiTHDRHhcjmQHpWoXTnwU3h43SP9DeZYsTn8'

const fetchCounter = async () => {
  loading.value = true
  try {
    const data = await counterAPI.getCounter(BACKEND_WALLET)
    counterAddress.value = data.address
    if (data.count !== null) {
      count.value = data.count
      counterExists.value = true
    } else {
      counterExists.value = false
    }
  } catch (error: any) {
    console.error('获取计数器失败:', error)
    ElMessage.error('获取计数器失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const initialize = async () => {
  loading.value = true
  try {
    const result = await counterAPI.initialize(BACKEND_WALLET)
    ElMessage.success('计数器初始化成功!')
    await fetchCounter()
  } catch (error: any) {
    console.error('初始化失败:', error)
    ElMessage.error('初始化失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const increment = async () => {
  loading.value = true
  try {
    const result = await counterAPI.increment(BACKEND_WALLET)
    count.value = result.count
    ElMessage.success('计数 +1')
  } catch (error: any) {
    console.error('增加失败:', error)
    ElMessage.error('增加失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const decrement = async () => {
  loading.value = true
  try {
    const result = await counterAPI.decrement(BACKEND_WALLET)
    count.value = result.count
    ElMessage.success('计数 -1')
  } catch (error: any) {
    console.error('减少失败:', error)
    ElMessage.error('减少失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 自动加载计数器数据
  fetchCounter()
})
</script>

<style scoped>
.counter-container {
  max-width: 800px;
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

.counter-card {
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

.info-card h3 {
  margin-bottom: 15px;
  color: #303133;
}

.info-card ol {
  padding-left: 20px;
  line-height: 1.8;
}

.info-card li {
  margin-bottom: 8px;
  color: #606266;
}
</style>
