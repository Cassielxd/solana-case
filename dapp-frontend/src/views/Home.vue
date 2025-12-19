<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <h1>🎉 欢迎来到 Solana DApp 平台</h1>
      <p class="subtitle">一个支持多个 Solana 程序的去中心化应用平台</p>
    </el-card>

    <el-row :gutter="20" class="program-cards">
      <el-col :xs="24" :sm="12" :md="6" v-for="program in programs" :key="program.name">
        <el-card class="program-card" shadow="hover" @click="navigateTo(program.route)">
          <div class="card-icon">{{ program.icon }}</div>
          <h3>{{ program.name }}</h3>
          <p>{{ program.description }}</p>
          <el-tag :type="program.loaded ? 'success' : 'info'">
            {{ program.loaded ? '已加载' : '未加载' }}
          </el-tag>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="info-card">
      <h2>🚀 快速开始</h2>
      <el-steps :active="currentStep" finish-status="success">
        <el-step title="连接钱包" description="点击右上角连接 Phantom 钱包" />
        <el-step title="选择程序" description="选择你想使用的程序" />
        <el-step title="开始使用" description="体验链上交互" />
      </el-steps>
    </el-card>

    <el-card class="stats-card" v-if="stats">
      <h2>📊 网络状态</h2>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="网络" :value="stats.network" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="钱包余额" :value="stats.balance" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="程序数量" :value="stats.programCount" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="状态" value="健康" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '../stores/wallet'
import { healthAPI } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const walletStore = useWalletStore()

const programs = ref([
  {
    name: 'Counter',
    icon: '🔢',
    description: '简单计数器程序',
    route: '/counter',
    loaded: false,
  },
  {
    name: 'Token Vault',
    icon: '💰',
    description: 'SOL 金库程序',
    route: '/vault',
    loaded: false,
  },
  {
    name: 'User Profile',
    icon: '👤',
    description: '用户资料管理',
    route: '/profile',
    loaded: false,
  },
  {
    name: 'Simple AMM',
    icon: '💱',
    description: '自动做市商',
    route: '/amm',
    loaded: false,
  },
])

const stats = ref<any>(null)

const currentStep = computed(() => {
  if (!walletStore.connected) return 0
  return 1
})

const navigateTo = (route: string) => {
  router.push(route)
}

const fetchStatus = async () => {
  try {
    const health = await healthAPI.check()
    stats.value = {
      network: health.network,
      balance: health.balance,
      programCount: 4,
    }

    const programsInfo = await healthAPI.getPrograms()
    programsInfo.programs.forEach((prog: any, index: number) => {
      programs.value[index].loaded = prog.loaded
    })
  } catch (error) {
    console.error('获取状态失败:', error)
    ElMessage.warning('无法连接到后端服务')
  }
}

onMounted(() => {
  fetchStatus()
})
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-card {
  text-align: center;
  margin-bottom: 30px;
}

.welcome-card h1 {
  color: #409eff;
  margin-bottom: 10px;
}

.subtitle {
  color: #909399;
  font-size: 16px;
}

.program-cards {
  margin: 30px 0;
}

.program-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.program-card:hover {
  transform: translateY(-5px);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.program-card h3 {
  margin: 10px 0;
  color: #303133;
}

.program-card p {
  color: #909399;
  margin-bottom: 15px;
}

.info-card,
.stats-card {
  margin: 30px 0;
}

.info-card h2,
.stats-card h2 {
  margin-bottom: 20px;
  color: #303133;
}
</style>
