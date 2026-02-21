import axios from 'axios'

// Origin only (no /api) so we can prefix every path with /api consistently
const origin = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')
export const api = axios.create({
  baseURL: origin,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chama-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors: full logout and redirect so logout works from any page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('chama-token')
      localStorage.removeItem('chama-active-chama-id')
      localStorage.removeItem('chama-auth')
      localStorage.removeItem('chama-context')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Helper to build chama-scoped routes (all paths under /api)
export function chamaRoute(chamaId: string, path: string): string {
  if (path.startsWith('/stkpush')) {
    return `/api/mpesa/${chamaId}/stkpush`
  }
  if (path.startsWith('/my/mpesa')) {
    return `/api/mpesa/${chamaId}/my/mpesa`
  }
  if (path === '/mpesa' || path.startsWith('/mpesa')) {
    return `/api/mpesa/${chamaId}/mpesa${path.replace('/mpesa', '')}`
  }
  return `/api/chamas/${chamaId}${path}`
}

export default api
