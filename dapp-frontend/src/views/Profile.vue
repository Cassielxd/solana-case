<template>
  <div class="profile-container">
    <el-card class="title-card">
      <h1>👤 User Profile</h1>
      <p>用户资料管理程序 - 集中式管理员模式</p>
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
          <span class="label">管理员地址:</span>
          <span class="value">{{ walletStore.publicKey }}</span>
        </div>
        <div class="info-row">
          <span class="label">钱包余额:</span>
          <span class="value">{{ walletStore.balance.toFixed(4) }} SOL</span>
        </div>
      </el-card>

      <!-- 查询用户资料 -->
      <el-card class="action-card" style="margin-bottom: 20px">
        <template #header>
          <div class="card-header">
            <span>🔍 查询用户资料</span>
          </div>
        </template>

        <el-form :model="queryForm" label-width="100px">
          <el-form-item label="用户 ID">
            <el-input
              v-model="queryForm.userId"
              placeholder="例如: user123"
              @keyup.enter="fetchProfile"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" @click="fetchProfile">
              查询资料
            </el-button>
            <el-button @click="queryForm.userId = ''">清空</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 创建用户资料 -->
      <el-card v-if="!profileExists" class="action-card">
        <template #header>
          <div class="card-header">
            <span>📝 创建用户资料</span>
          </div>
        </template>

        <el-form :model="createForm" label-width="100px">
          <el-form-item label="用户 ID" required>
            <el-input
              v-model="createForm.userId"
              placeholder="唯一标识符，例如: user123"
            />
          </el-form-item>

          <el-form-item label="用户名" required>
            <el-input
              v-model="createForm.username"
              placeholder="显示名称"
            />
          </el-form-item>

          <el-form-item label="邮箱" required>
            <el-input
              v-model="createForm.email"
              type="email"
              placeholder="example@email.com"
            />
          </el-form-item>

          <el-form-item label="年龄">
            <el-input-number
              v-model="createForm.age"
              :min="0"
              :max="150"
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="个人简介">
            <el-input
              v-model="createForm.bio"
              type="textarea"
              :rows="3"
              placeholder="简要介绍自己..."
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" @click="createProfile">
              创建资料
            </el-button>
            <el-button @click="resetCreateForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 用户资料详情和操作 -->
      <div v-else>
        <!-- 资料详情 -->
        <el-card class="info-card" style="margin-bottom: 20px">
          <template #header>
            <div class="card-header">
              <span>👥 用户资料详情</span>
              <el-button type="primary" size="small" @click="fetchProfile">
                刷新
              </el-button>
            </div>
          </template>

          <div class="info-row">
            <span class="label">用户 ID:</span>
            <span class="value">{{ profileInfo.userId }}</span>
          </div>
          <div class="info-row">
            <span class="label">用户名:</span>
            <span class="value">{{ profileInfo.username }}</span>
          </div>
          <div class="info-row">
            <span class="label">邮箱:</span>
            <span class="value">{{ profileInfo.email }}</span>
          </div>
          <div class="info-row">
            <span class="label">年龄:</span>
            <span class="value">{{ profileInfo.age }}</span>
          </div>
          <div class="info-row">
            <span class="label">个人简介:</span>
            <span class="value">{{ profileInfo.bio || '暂无' }}</span>
          </div>
          <div class="info-row">
            <span class="label">资料地址:</span>
            <span class="value">{{ profileInfo.profileAddress }}</span>
          </div>
          <div class="info-row">
            <span class="label">管理员:</span>
            <span class="value">{{ profileInfo.admin }}</span>
          </div>
          <div class="info-row">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatTimestamp(profileInfo.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="label">更新时间:</span>
            <span class="value">{{ formatTimestamp(profileInfo.updatedAt) }}</span>
          </div>
        </el-card>

        <!-- 更新资料 -->
        <el-card class="action-card" style="margin-bottom: 20px">
          <template #header>
            <div class="card-header">
              <span>✏️ 更新资料</span>
            </div>
          </template>

          <el-form :model="updateForm" label-width="100px">
            <el-form-item label="用户名">
              <el-input
                v-model="updateForm.username"
                placeholder="留空则不更新"
              />
            </el-form-item>

            <el-form-item label="邮箱">
              <el-input
                v-model="updateForm.email"
                type="email"
                placeholder="留空则不更新"
              />
            </el-form-item>

            <el-form-item label="年龄">
              <el-input-number
                v-model="updateForm.age"
                :min="0"
                :max="150"
                style="width: 150px"
                placeholder="留空则不更新"
              />
            </el-form-item>

            <el-form-item label="个人简介">
              <el-input
                v-model="updateForm.bio"
                type="textarea"
                :rows="3"
                placeholder="留空则不更新"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="success" :loading="loading" @click="updateProfile">
                更新资料
              </el-button>
              <el-button @click="resetUpdateForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 删除资料 -->
        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span>🗑️ 删除资料</span>
            </div>
          </template>

          <el-alert
            title="警告：删除用户资料是不可逆的操作！"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 15px"
          />

          <el-button type="danger" :loading="loading" @click="deleteProfile">
            删除资料
          </el-button>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWalletStore } from '@/stores/wallet'
import api from '@/api'

const walletStore = useWalletStore()

// 状态
const loading = ref(false)
const profileExists = ref(false)

// 表单数据
const queryForm = ref({
  userId: ''
})

const createForm = ref({
  userId: '',
  username: '',
  email: '',
  age: 0,
  bio: ''
})

const updateForm = ref({
  username: '',
  email: '',
  age: undefined as number | undefined,
  bio: ''
})

// 用户资料信息
const profileInfo = ref({
  profileAddress: '',
  admin: '',
  userId: '',
  username: '',
  email: '',
  age: 0,
  bio: '',
  createdAt: 0,
  updatedAt: 0
})

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

// 获取用户资料
const fetchProfile = async () => {
  const userId = queryForm.value.userId || profileInfo.value.userId

  if (!userId) {
    ElMessage.warning('请输入用户 ID')
    return
  }

  if (!walletStore.publicKey) {
    ElMessage.error('请先连接钱包')
    return
  }

  try {
    const response = await api.get(
      `/profile/${walletStore.publicKey}/${userId}`
    )

    if (response.data.exists) {
      profileExists.value = true
      profileInfo.value = response.data
      queryForm.value.userId = userId
    } else {
      profileExists.value = false
      ElMessage.info('该用户资料不存在，您可以创建新资料')
      // 预填充用户 ID
      createForm.value.userId = userId
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '查询资料失败')
    console.error('获取用户资料失败:', error)
  }
}

// 创建用户资料
const createProfile = async () => {
  if (!createForm.value.userId || !createForm.value.username || !createForm.value.email) {
    ElMessage.warning('请填写必填字段（用户 ID、用户名、邮箱）')
    return
  }

  if (!walletStore.publicKey) {
    ElMessage.error('请先连接钱包')
    return
  }

  loading.value = true

  try {
    const response = await api.post('/profile/create', {
      adminPublicKey: walletStore.publicKey,
      userId: createForm.value.userId,
      username: createForm.value.username,
      email: createForm.value.email,
      age: createForm.value.age || 0,
      bio: createForm.value.bio || ''
    })

    if (response.data.success) {
      ElMessage.success('用户资料创建成功！')
      queryForm.value.userId = createForm.value.userId
      await fetchProfile()
      resetCreateForm()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '创建资料失败')
    console.error('创建用户资料失败:', error)
  } finally {
    loading.value = false
  }
}

// 更新用户资料
const updateProfile = async () => {
  if (!profileInfo.value.userId) {
    ElMessage.warning('请先查询用户资料')
    return
  }

  // 检查是否有任何字段被修改
  if (!updateForm.value.username && !updateForm.value.email &&
      updateForm.value.age === undefined && !updateForm.value.bio) {
    ElMessage.warning('请至少修改一个字段')
    return
  }

  loading.value = true

  try {
    const response = await api.post('/profile/update', {
      adminPublicKey: walletStore.publicKey,
      userId: profileInfo.value.userId,
      username: updateForm.value.username || undefined,
      email: updateForm.value.email || undefined,
      age: updateForm.value.age,
      bio: updateForm.value.bio || undefined
    })

    if (response.data.success) {
      ElMessage.success('用户资料更新成功！')
      await fetchProfile()
      resetUpdateForm()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '更新资料失败')
    console.error('更新用户资料失败:', error)
  } finally {
    loading.value = false
  }
}

// 删除用户资料
const deleteProfile = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该用户资料吗？此操作不可逆！',
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    loading.value = true

    const response = await api.post('/profile/delete', {
      adminPublicKey: walletStore.publicKey,
      userId: profileInfo.value.userId
    })

    if (response.data.success) {
      ElMessage.success('用户资料已成功删除')
      profileExists.value = false
      profileInfo.value = {
        profileAddress: '',
        admin: '',
        userId: '',
        username: '',
        email: '',
        age: 0,
        bio: '',
        createdAt: 0,
        updatedAt: 0
      }
      queryForm.value.userId = ''
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '删除资料失败')
      console.error('删除用户资料失败:', error)
    }
  } finally {
    loading.value = false
  }
}

// 重置表单
const resetCreateForm = () => {
  createForm.value = {
    userId: '',
    username: '',
    email: '',
    age: 0,
    bio: ''
  }
}

const resetUpdateForm = () => {
  updateForm.value = {
    username: '',
    email: '',
    age: undefined,
    bio: ''
  }
}
</script>

<style scoped>
.profile-container {
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
  min-width: 100px;
}

.info-row .value {
  color: #303133;
  word-break: break-all;
  flex: 1;
  text-align: right;
}
</style>
