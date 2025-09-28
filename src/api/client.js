import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8099'
})

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// global 401 handler → send to login and preserve where we were
api.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const here = window.location.pathname + window.location.search
      if (!here.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(here)}`
      }
    }
    return Promise.reject(err)
  }
)

export default api
