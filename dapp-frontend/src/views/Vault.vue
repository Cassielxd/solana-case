<template>
  <div class="vault-container">
    <el-card class="title-card">
      <h1>💰 Token Vault</h1>
      <p>SOL 金库程序 - 安全存储您的 SOL</p>
    </el-card>

    <!-- 钱包连接提示 -->
    <el-alert
      v-if="!walletStore.connected"
      title="请先连接钱包"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <div style="display: flex; gap: 10px; margin-top: 10px">
          <el-button type="primary" @click="walletStore.connect">连接 Phantom</el-button>
          <el-button @click="walletStore.connectLocal">连接本地钱包</el-button>
        </div>
      </template>
    </el-alert>

    <div v-else>
      <!-- 钱包信息 -->
      <el-card class="info-card" style="margin-bottom: 20px">
        <div class="info-row">
          <span class="label">钱包类型:</span>
          <el-tag :type="walletStore.walletType === 'phantom' ? 'success' : 'primary'">
            {{ walletStore.walletType === 'phantom' ? 'Phantom' : '本地钱包' }}
          </el-tag>
        </div>
        <div class="info-row">
          <span class="label">钱包地址:</span>
          <span class="value">{{ walletStore.publicKey }}</span>
        </div>
        <div class="info-row">
          <span class="label">钱包余额:</span>
          <span class="value">{{ walletStore.balance.toFixed(4) }} SOL</span>
        </div>
      </el-card>

      <!-- 创建金库 -->
      <el-card v-if="!vaultExists" class="action-card">
        <template #header>
          <div class="card-header">
            <span>📝 创建金库</span>
          </div>
        </template>

        <el-form :model="createForm" label-width="100px">
          <el-form-item label="金库名称">
            <el-input
              v-model="createForm.vaultName"
              placeholder="例如: my-vault"
              @keyup.enter="initializeVault"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              @click="initializeVault"
            >
              创建金库
            </el-button>
            <el-button @click="createForm.vaultName = ''">清空</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 金库信息和操作 -->
      <div v-else>
        <!-- 金库状态 -->
        <el-card class="info-card" style="margin-bottom: 20px">
          <template #header>
            <div class="card-header">
              <span>🏦 金库信息</span>
              <el-button type="primary" size="small" @click="fetchVaultInfo">
                刷新
              </el-button>
            </div>
          </template>

          <div class="info-row">
            <span class="label">金库名称:</span>
            <span class="value">{{ vaultInfo.vaultName }}</span>
          </div>
          <div class="info-row">
            <span class="label">金库地址:</span>
            <span class="value">{{ vaultInfo.vaultAddress }}</span>
          </div>
          <div class="info-row">
            <span class="label">金库余额:</span>
            <span class="value highlight">{{ vaultInfo.balance }} SOL</span>
          </div>
          <div class="info-row">
            <span class="label">权限者:</span>
            <span class="value">{{ vaultInfo.authority }}</span>
          </div>
        </el-card>

        <!-- 存款操作 -->
        <el-card class="action-card" style="margin-bottom: 20px">
          <template #header>
            <div class="card-header">
              <span>💸 存款</span>
            </div>
          </template>

          <el-form :model="depositForm" label-width="100px">
            <el-form-item label="存款金额">
              <el-input-number
                v-model="depositForm.amount"
                :min="0.001"
                :step="0.1"
                :precision="3"
                style="width: 200px"
              />
              <span style="margin-left: 10px">SOL</span>
            </el-form-item>

            <el-form-item>
              <el-button
                type="success"
                :loading="loading"
                @click="deposit"
              >
                存入
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 取款操作 -->
        <el-card class="action-card" style="margin-bottom: 20px">
          <template #header>
            <div class="card-header">
              <span>💰 取款</span>
            </div>
          </template>

          <el-form :model="withdrawForm" label-width="100px">
            <el-form-item label="取款金额">
              <el-input-number
                v-model="withdrawForm.amount"
                :min="0.001"
                :step="0.1"
                :precision="3"
                :max="vaultInfo.balance"
                style="width: 200px"
              />
              <span style="margin-left: 10px">SOL</span>
            </el-form-item>

            <el-form-item>
              <el-button
                type="warning"
                :loading="loading"
                @click="withdraw"
              >
                取出
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 关闭金库 -->
        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span>🔒 关闭金库</span>
            </div>
          </template>

          <el-alert
            title="警告：关闭金库将会提取所有余额并删除金库账户。此操作不可逆！"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 15px"
          />

          <el-button
            type="danger"
            :loading="loading"
            @click="closeVault"
          >
            关闭金库
          </el-button>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWalletStore } from '@/stores/wallet'
import api from '@/api'

const walletStore = useWalletStore()

// 状态
const loading = ref(false)
const vaultExists = ref(false)

// 表单数据
const createForm = ref({
  vaultName: ''
})

const depositForm = ref({
  amount: 0.1
})

const withdrawForm = ref({
  amount: 0.1
})

// 金库信息
const vaultInfo = ref({
  vaultName: '',
  vaultAddress: '',
  balance: 0,
  authority: ''
})

// 初始化金库
const initializeVault = async () => {
  if (!createForm.value.vaultName) {
    ElMessage.warning('请输入金库名称')
    return
  }

  if (!walletStore.publicKey) {
    ElMessage.error('请先连接钱包')
    return
  }

  loading.value = true

  try {
    const response = await api.post('/vault/initialize', {
      authorityPublicKey: walletStore.publicKey,
      vaultName: createForm.value.vaultName
    })

    if (response.data.success) {
      ElMessage.success('金库创建成功！')
      await fetchVaultInfo()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '创建金库失败')
    console.error('初始化金库失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取金库信息
const fetchVaultInfo = async () => {
  if (!walletStore.publicKey) return
  if (!createForm.value.vaultName && !vaultInfo.value.vaultName) {
    return
  }

  const vaultName = vaultInfo.value.vaultName || createForm.value.vaultName

  try {
    const response = await api.get(
      `/vault/${walletStore.publicKey}/${vaultName}`
    )

    if (response.data.exists) {
      vaultExists.value = true
      vaultInfo.value = response.data
    } else {
      vaultExists.value = false
    }
  } catch (error) {
    console.error('获取金库信息失败:', error)
  }
}

// 存款
const deposit = async () => {
  if (depositForm.value.amount <= 0) {
    ElMessage.warning('请输入有效的存款金额')
    return
  }

  if (depositForm.value.amount > walletStore.balance) {
    ElMessage.error('钱包余额不足')
    return
  }

  loading.value = true

  try {
    const response = await api.post('/vault/deposit', {
      authorityPublicKey: walletStore.publicKey,
      vaultName: vaultInfo.value.vaultName,
      amount: depositForm.value.amount
    })

    if (response.data.success) {
      ElMessage.success(`成功存入 ${depositForm.value.amount} SOL`)
      await fetchVaultInfo()
      await walletStore.updateBalance()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '存款失败')
    console.error('存款失败:', error)
  } finally {
    loading.value = false
  }
}

// 取款
const withdraw = async () => {
  if (withdrawForm.value.amount <= 0) {
    ElMessage.warning('请输入有效的取款金额')
    return
  }

  if (withdrawForm.value.amount > vaultInfo.value.balance) {
    ElMessage.error('金库余额不足')
    return
  }

  loading.value = true

  try {
    const response = await api.post('/vault/withdraw', {
      authorityPublicKey: walletStore.publicKey,
      vaultName: vaultInfo.value.vaultName,
      amount: withdrawForm.value.amount
    })

    if (response.data.success) {
      ElMessage.success(`成功取出 ${withdrawForm.value.amount} SOL`)
      await fetchVaultInfo()
      await walletStore.updateBalance()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '取款失败')
    console.error('取款失败:', error)
  } finally {
    loading.value = false
  }
}

// 关闭金库
const closeVault = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要关闭金库吗？这将提取所有余额并删除金库账户，此操作不可逆！',
      '警告',
      {
        confirmButtonText: '确定关闭',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    loading.value = true

    const response = await api.post('/vault/close', {
      authorityPublicKey: walletStore.publicKey,
      vaultName: vaultInfo.value.vaultName
    })

    if (response.data.success) {
      ElMessage.success('金库已成功关闭')
      vaultExists.value = false
      vaultInfo.value = {
        vaultName: '',
        vaultAddress: '',
        balance: 0,
        authority: ''
      }
      createForm.value.vaultName = ''
      await walletStore.updateBalance()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '关闭金库失败')
      console.error('关闭金库失败:', error)
    }
  } finally {
    loading.value = false
  }
}

// 页面加载时获取金库信息
onMounted(async () => {
  if (walletStore.connected) {
    // 尝试加载默认名称的金库
    createForm.value.vaultName = 'my-vault'
    await fetchVaultInfo()
  }
})
</script>

<style scoped>
.vault-container {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-card,
.action-card {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-weight: bold;
  color: #606266;
}

.info-row .value {
  color: #303133;
  word-break: break-all;
}

.info-row .value.highlight {
  color: #67c23a;
  font-weight: bold;
  font-size: 18px;
}
</style>
