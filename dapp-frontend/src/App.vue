<template>
  <el-container class="app-container">
    <el-header height="60px">
      <div class="header-content">
        <div class="logo">
          <h2>🚀 Solana DApp</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          @select="handleMenuSelect"
          class="main-menu"
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/counter">计数器</el-menu-item>
          <el-menu-item index="/vault">金库</el-menu-item>
          <el-menu-item index="/profile">资料</el-menu-item>
          <el-menu-item index="/amm">AMM</el-menu-item>
        </el-menu>
        <div class="wallet-section">
          <WalletConnector />
        </div>
      </div>
    </el-header>

    <el-main>
      <router-view />
    </el-main>

    <el-footer height="60px">
      <div class="footer-content">
        <p>© 2025 Solana DApp Platform | 支持 4 个程序：Counter · Vault · Profile · AMM</p>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import WalletConnector from './components/WalletConnector.vue'

const router = useRouter()
const route = useRoute()

const activeMenu = computed(() => route.path)

const handleMenuSelect = (index: string) => {
  router.push(index)
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.logo h2 {
  margin: 0;
  color: #409eff;
}

.main-menu {
  flex: 1;
  margin: 0 40px;
  border-bottom: none;
}

.wallet-section {
  min-width: 200px;
  display: flex;
  justify-content: flex-end;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.footer-content p {
  margin: 0;
}
</style>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#app {
  width: 100%;
}
</style>
