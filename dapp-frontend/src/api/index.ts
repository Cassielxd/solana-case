import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API 错误:', error)
    return Promise.reject(error)
  }
)

// ============================================================================
// Health API
// ============================================================================
export const healthAPI = {
  check: () => apiClient.get('/health'),
  getPrograms: () => apiClient.get('/programs'),
}

// ============================================================================
// Counter API
// ============================================================================
export const counterAPI = {
  getCounter: (userPublicKey: string) =>
    apiClient.get(`/counter/${userPublicKey}`),

  initialize: (userPublicKey: string) =>
    apiClient.post('/counter/initialize', { userPublicKey }),

  increment: (userPublicKey: string) =>
    apiClient.post('/counter/increment', { userPublicKey }),

  decrement: (userPublicKey: string) =>
    apiClient.post('/counter/decrement', { userPublicKey }),
}

// ============================================================================
// AMM API
// ============================================================================
export const ammAPI = {
  getPool: (tokenAMint: string, tokenBMint: string) =>
    apiClient.get('/amm/pool', { params: { tokenAMint, tokenBMint } }),

  initializePool: (tokenAMint: string, tokenBMint: string, payerPublicKey: string) =>
    apiClient.post('/amm/pool/initialize', {
      tokenAMint,
      tokenBMint,
      payerPublicKey,
    }),

  getSwapQuote: (
    tokenAMint: string,
    tokenBMint: string,
    amountIn: number,
    isAToB: boolean
  ) =>
    apiClient.post('/amm/swap/quote', {
      tokenAMint,
      tokenBMint,
      amountIn,
      isAToB,
    }),
}

export default apiClient
