import { Keypair } from '@solana/web3.js'

const LOCAL_WALLET_KEY = 'local_wallet_keypair'

/**
 * 本地钱包管理器
 */
export class LocalWalletManager {
  private keypair: Keypair | null = null

  /**
   * 从 localStorage 加载钱包
   */
  loadFromStorage(): Keypair | null {
    const stored = localStorage.getItem(LOCAL_WALLET_KEY)
    if (stored) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(stored))
        this.keypair = Keypair.fromSecretKey(secretKey)
        return this.keypair
      } catch (error) {
        console.error('加载本地钱包失败:', error)
        return null
      }
    }
    return null
  }

  /**
   * 导入钱包私钥
   */
  importWallet(secretKeyArray: number[]): Keypair {
    const secretKey = Uint8Array.from(secretKeyArray)
    this.keypair = Keypair.fromSecretKey(secretKey)

    // 保存到 localStorage
    localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(secretKeyArray))

    return this.keypair
  }

  /**
   * 从服务器获取本地钱包（仅开发环境）
   */
  async loadFromServer(): Promise<Keypair> {
    try {
      const response = await fetch('/api/dev/local-wallet')
      const data = await response.json()

      if (data.secretKey) {
        return this.importWallet(data.secretKey)
      } else {
        throw new Error('无法获取本地钱包')
      }
    } catch (error) {
      console.error('从服务器加载钱包失败:', error)
      throw error
    }
  }

  /**
   * 获取钱包实例（Anchor 兼容）
   */
  getWallet() {
    if (!this.keypair) {
      throw new Error('钱包未加载')
    }

    return {
      publicKey: this.keypair.publicKey,
      signTransaction: async (tx: any) => {
        if (!this.keypair) throw new Error('钱包未加载')
        tx.partialSign(this.keypair)
        return tx
      },
      signAllTransactions: async (txs: any[]) => {
        if (!this.keypair) throw new Error('钱包未加载')
        return txs.map(tx => {
          tx.partialSign(this.keypair!)
          return tx
        })
      }
    }
  }

  /**
   * 获取 Keypair（用于需要 signer 的场景）
   */
  getKeypair(): Keypair {
    if (!this.keypair) {
      throw new Error('钱包未加载')
    }
    return this.keypair
  }

  /**
   * 清除钱包
   */
  clear() {
    localStorage.removeItem(LOCAL_WALLET_KEY)
    this.keypair = null
  }

  /**
   * 检查是否已加载钱包
   */
  isLoaded(): boolean {
    return this.keypair !== null
  }

  /**
   * 获取钱包地址
   */
  getAddress(): string | null {
    return this.keypair ? this.keypair.publicKey.toBase58() : null
  }
}

export const localWallet = new LocalWalletManager()
