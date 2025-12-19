import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { localWallet } from '@/utils/localWallet'

// 钱包类型
export type WalletType = 'phantom' | 'local' | null

// Phantom 钱包接口
interface PhantomProvider {
  isPhantom?: boolean
  connect: () => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  on: (event: string, callback: (args: any) => void) => void
  publicKey: PublicKey | null
}

declare global {
  interface Window {
    solana?: PhantomProvider
  }
}

export const useWalletStore = defineStore('wallet', () => {
  const connected = ref(false)
  const publicKey = ref<string | null>(null)
  const balance = ref(0)
  const connection = ref<Connection | null>(null)
  const provider = ref<PhantomProvider | null>(null)
  const walletType = ref<WalletType>(null)

  // 初始化连接
  const initConnection = () => {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'http://127.0.0.1:8899'
    connection.value = new Connection(rpcUrl, 'confirmed')
  }

  // 连接钱包
  const connect = async () => {
    if (!window.solana) {
      throw new Error('请先安装 Phantom 钱包')
    }

    try {
      // 方法1: 检查是否已经连接
      if (window.solana.isConnected && window.solana.publicKey) {
        console.log('钱包已连接，直接使用')
        publicKey.value = window.solana.publicKey.toBase58()
        connected.value = true
        provider.value = window.solana

        if (!connection.value) {
          initConnection()
        }
        await updateBalance()
        return
      }

      // 方法2: 尝试多种连接方式
      let resp

      try {
        // 首先尝试标准连接
        console.log('尝试标准连接方式...')
        resp = await window.solana.connect({ onlyIfTrusted: false })
      } catch (e1) {
        console.log('标准连接失败，尝试备用方式...', e1)

        try {
          // 备用方式1: 不带参数
          resp = await window.solana.connect()
        } catch (e2) {
          console.log('备用方式1失败，尝试方式2...', e2)

          // 备用方式2: 使用 request 方法
          try {
            const accounts = await (window.solana as any).request({
              method: 'connect',
              params: { onlyIfTrusted: false }
            })
            resp = { publicKey: accounts.publicKey || window.solana.publicKey }
          } catch (e3) {
            console.error('所有连接方式都失败了', e3)
            throw e1 // 抛出最初的错误
          }
        }
      }

      if (!resp || !resp.publicKey) {
        // 最后尝试: 检查 window.solana.publicKey
        if (window.solana.publicKey) {
          resp = { publicKey: window.solana.publicKey }
        } else {
          throw new Error('无法获取钱包公钥')
        }
      }

      publicKey.value = resp.publicKey.toBase58()
      connected.value = true
      provider.value = window.solana
      walletType.value = 'phantom'

      // 初始化连接
      if (!connection.value) {
        initConnection()
      }

      // 获取余额
      await updateBalance()

      // 监听账户变化
      window.solana.on('accountChanged', async (pubkey: PublicKey | null) => {
        if (pubkey) {
          publicKey.value = pubkey.toBase58()
          await updateBalance()
        } else {
          disconnect()
        }
      })

      // 保存连接状态
      localStorage.setItem('walletConnected', 'true')
      localStorage.setItem('walletType', 'phantom')

      console.log('✅ 钱包连接成功:', publicKey.value)

    } catch (error: any) {
      console.error('连接钱包失败:', error)

      // 提供更友好的错误信息
      if (error.code === 4001) {
        throw new Error('用户拒绝了连接请求')
      } else if (error.message && error.message.includes('User rejected')) {
        throw new Error('用户拒绝了连接请求')
      } else if (error.message && error.message.includes('Unexpected error')) {
        throw new Error('Phantom 连接异常。请尝试：1) 刷新页面 2) 重启浏览器 3) 更新 Phantom 到最新版本')
      } else {
        throw new Error('连接失败: ' + (error.message || '未知错误'))
      }
    }
  }

  // 断开连接
  const disconnect = () => {
    if (walletType.value === 'phantom' && window.solana) {
      window.solana.disconnect()
    } else if (walletType.value === 'local') {
      localWallet.clear()
    }
    connected.value = false
    publicKey.value = null
    balance.value = 0
    provider.value = null
    walletType.value = null
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('walletType')
  }

  // 更新余额
  const updateBalance = async () => {
    if (!connection.value || !publicKey.value) return

    try {
      const pubKey = new PublicKey(publicKey.value)
      const lamports = await connection.value.getBalance(pubKey)
      balance.value = lamports / 1e9 // 转换为 SOL
    } catch (error) {
      console.error('获取余额失败:', error)
    }
  }

  // 连接本地钱包
  const connectLocal = async () => {
    try {
      // 尝试从 localStorage 加载
      let wallet = localWallet.loadFromStorage()

      // 如果没有，尝试从服务器加载（仅开发环境）
      if (!wallet) {
        try {
          wallet = await localWallet.loadFromServer()
          console.log('✅ 从服务器加载本地钱包成功')
        } catch (error) {
          throw new Error('无法加载本地钱包。请确保 server 正在运行。')
        }
      }

      if (wallet) {
        publicKey.value = wallet.publicKey.toBase58()
        connected.value = true
        walletType.value = 'local'

        // 初始化连接
        if (!connection.value) {
          initConnection()
        }

        await updateBalance()

        // 保存连接状态
        localStorage.setItem('walletConnected', 'true')
        localStorage.setItem('walletType', 'local')

        console.log('✅ 本地钱包连接成功:', publicKey.value)
      }
    } catch (error: any) {
      console.error('连接本地钱包失败:', error)
      throw new Error('连接本地钱包失败: ' + (error.message || '未知错误'))
    }
  }

  // 自动连接
  const autoConnect = async () => {
    const wasConnected = localStorage.getItem('walletConnected')
    const savedWalletType = localStorage.getItem('walletType') as WalletType

    if (wasConnected === 'true') {
      try {
        if (savedWalletType === 'local') {
          await connectLocal()
        } else if (window.solana) {
          await connect()
        }
      } catch (error) {
        console.error('自动连接失败:', error)
      }
    }
  }

  // 获取钱包适配器（用于签名交易）
  const getWalletAdapter = () => {
    if (walletType.value === 'local') {
      return localWallet.getWallet()
    } else if (walletType.value === 'phantom') {
      return provider.value
    }
    return null
  }

  return {
    connected,
    publicKey,
    balance,
    provider,
    walletType,
    connect,
    connectLocal,
    disconnect,
    updateBalance,
    autoConnect,
    getWalletAdapter,
  }
})
