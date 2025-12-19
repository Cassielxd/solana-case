import * as anchor from '@coral-xyz/anchor'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { MyProject } from '../idl/my_project'
import idlJson from '../idl/my_project.json?raw'

const COUNTER_KEYPAIR_KEY = 'counter_keypair'
const PROGRAM_ID = 'MSzWnazBzfoG8xNbAh82sa35qTjfgpe7Sd6hkq3B4Aj'

export class CounterProgramService {
  private connection: Connection
  private program: Program<MyProject> | null = null
  private counterKeypair: Keypair | null = null

  constructor() {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'http://127.0.0.1:8899'
    this.connection = new Connection(rpcUrl, 'confirmed')
    this.loadCounterKeypair()
  }

  /**
   * 从 localStorage 加载 counter keypair
   */
  private loadCounterKeypair() {
    const stored = localStorage.getItem(COUNTER_KEYPAIR_KEY)
    if (stored) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(stored))
        this.counterKeypair = Keypair.fromSecretKey(secretKey)
      } catch (error) {
        console.error('加载 counter keypair 失败:', error)
        this.counterKeypair = null
      }
    }
  }

  /**
   * 保存 counter keypair 到 localStorage
   */
  private saveCounterKeypair(keypair: Keypair) {
    const secretKey = Array.from(keypair.secretKey)
    localStorage.setItem(COUNTER_KEYPAIR_KEY, JSON.stringify(secretKey))
    this.counterKeypair = keypair
  }

  /**
   * 生成新的 counter keypair
   */
  generateCounterKeypair() {
    const keypair = Keypair.generate()
    this.saveCounterKeypair(keypair)
    return keypair
  }

  /**
   * 获取当前的 counter keypair，如果不存在则生成新的
   */
  getCounterKeypair(): Keypair {
    if (!this.counterKeypair) {
      this.counterKeypair = this.generateCounterKeypair()
    }
    return this.counterKeypair
  }

  /**
   * 重置 counter (生成新的 keypair)
   */
  resetCounter() {
    localStorage.removeItem(COUNTER_KEYPAIR_KEY)
    this.counterKeypair = null
  }

  /**
   * 初始化 Program 实例
   */
  async initializeProgram(wallet: any) {
    if (!wallet) {
      throw new Error('钱包未连接')
    }

    const provider = new AnchorProvider(
      this.connection,
      wallet,
      { commitment: 'confirmed' }
    )

    const idl = JSON.parse(idlJson)
    this.program = new Program(idl as any, provider)
    return this.program
  }

  /**
   * 获取 counter 账户数据
   */
  async getCounter(wallet: any): Promise<{
    address: string
    count: string | null
    owner: string
    exists: boolean
  }> {
    const counterKeypair = this.getCounterKeypair()
    const counterAddress = counterKeypair.publicKey

    try {
      await this.initializeProgram(wallet)
      if (!this.program) throw new Error('程序未初始化')

      const counter = await this.program.account.counter.fetch(counterAddress)
      return {
        address: counterAddress.toBase58(),
        count: (counter as any).count.toString(),
        owner: (counter as any).authority.toBase58(),
        exists: true,
      }
    } catch (error: any) {
      // 账户不存在
      return {
        address: counterAddress.toBase58(),
        count: null,
        owner: wallet.publicKey.toBase58(),
        exists: false,
      }
    }
  }

  /**
   * 初始化 counter 账户
   */
  async initialize(wallet: any) {
    await this.initializeProgram(wallet)
    if (!this.program) throw new Error('程序未初始化')

    const counterKeypair = this.getCounterKeypair()

    const tx = await this.program.methods
      .initialize()
      .accounts({
        counter: counterKeypair.publicKey,
        user: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counterKeypair])
      .rpc()

    return {
      success: true,
      signature: tx,
      counterAddress: counterKeypair.publicKey.toBase58(),
    }
  }

  /**
   * 增加计数
   */
  async increment(wallet: any) {
    await this.initializeProgram(wallet)
    if (!this.program) throw new Error('程序未初始化')

    const counterKeypair = this.getCounterKeypair()

    const tx = await this.program.methods
      .increment()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: wallet.publicKey,
      })
      .rpc()

    // 获取更新后的计数
    const counter = await this.program.account.counter.fetch(counterKeypair.publicKey)

    return {
      success: true,
      signature: tx,
      count: (counter as any).count.toString(),
    }
  }

  /**
   * 减少计数
   */
  async decrement(wallet: any) {
    await this.initializeProgram(wallet)
    if (!this.program) throw new Error('程序未初始化')

    const counterKeypair = this.getCounterKeypair()

    const tx = await this.program.methods
      .decrement()
      .accounts({
        counter: counterKeypair.publicKey,
        authority: wallet.publicKey,
      })
      .rpc()

    // 获取更新后的计数
    const counter = await this.program.account.counter.fetch(counterKeypair.publicKey)

    return {
      success: true,
      signature: tx,
      count: (counter as any).count.toString(),
    }
  }
}

// 导出单例
export const counterProgram = new CounterProgramService()
