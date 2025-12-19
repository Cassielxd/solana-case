<template>
  <div class="wallet-connector">
    <el-button v-if="!connected" type="primary" @click="connectWallet">
      <el-icon><Wallet /></el-icon>
      <span>连接钱包</span>
    </el-button>

    <el-dropdown v-else>
      <el-button type="success">
        <el-icon><User /></el-icon>
        <span>{{ shortenAddress(walletAddress) }}</span>
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item>
            <div class="wallet-info">
              <div class="info-item">
                <span class="label">地址:</span>
                <span class="value">{{ shortenAddress(walletAddress) }}</span>
              </div>
              <div class="info-item">
                <span class="label">余额:</span>
                <span class="value">{{ balance }} SOL</span>
              </div>
            </div>
          </el-dropdown-item>
          <el-dropdown-item divided @click="disconnectWallet">
            <el-icon><SwitchButton /></el-icon>
            断开连接
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useWalletStore } from '../stores/wallet'

const walletStore = useWalletStore()

const connected = computed(() => walletStore.connected)
const walletAddress = computed(() => walletStore.publicKey)
const balance = computed(() => walletStore.balance.toFixed(4))

const connectWallet = async () => {
  try {
    await walletStore.connect()
    ElMessage.success('钱包连接成功!')
  } catch (error: any) {
    ElMessage.error('连接失败: ' + error.message)
  }
}

const disconnectWallet = () => {
  walletStore.disconnect()
  ElMessage.info('钱包已断开')
}

const shortenAddress = (address: string | null) => {
  if (!address) return ''
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

onMounted(() => {
  // 尝试自动连接之前连接过的钱包
  walletStore.autoConnect()
})
</script>

<style scoped>
.wallet-connector {
  display: flex;
  align-items: center;
}

.wallet-info {
  padding: 8px 0;
  min-width: 200px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.info-item .label {
  color: #909399;
  margin-right: 12px;
}

.info-item .value {
  font-weight: 500;
}
</style>
