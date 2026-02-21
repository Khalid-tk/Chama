import axios from 'axios'

// Same-origin /api so Vercel rewrite proxy can forward to backend (no CORS, no VITE_API_URL)
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chama-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

// Paths relative to baseURL /api (no /api prefix here)
export function chamaRoute(chamaId: string, path: string): string {
  if (path.startsWith('/stkpush')) {
    return `/mpesa/${chamaId}/stkpush`
  }
  if (path.startsWith('/my/mpesa')) {
    return `/mpesa/${chamaId}/my/mpesa`
  }
  if (path === '/mpesa' || path.startsWith('/mpesa')) {
    return `/mpesa/${chamaId}/mpesa${path.replace('/mpesa', '')}`
  }
  return `/chamas/${chamaId}${path}`
}

export default api
