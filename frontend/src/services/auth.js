import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token')
    this.setupInterceptors()
  }

  setupInterceptors() {
    // Request interceptor to add token
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          
          try {
            const response = await this.refreshToken()
            this.token = response.data.token
            localStorage.setItem('token', this.token)
            originalRequest.headers.Authorization = `Bearer ${this.token}`
            return axios(originalRequest)
          } catch (refreshError) {
            this.logout()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  async login({ username, email, password }) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      email,
      password
    })
    
    this.token = response.data.token
    localStorage.setItem('token', this.token)
    
    return response.data
  }

  async register({ username, email, password, displayName }) {
    const response = await axios.post(`${API_URL}/auth/register`, {
      username,
      email,
      password,
      displayName
    })
    
    this.token = response.data.token
    localStorage.setItem('token', this.token)
    
    return response.data
  }

  async refreshToken() {
    return axios.post(`${API_URL}/auth/refresh`, {}, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    })
  }

  async getMe() {
    const response = await axios.get(`${API_URL}/users/profile`)
    return response.data.user
  }

  logout() {
    this.token = null
    localStorage.removeItem('token')
  }

  isAuthenticated() {
    return !!this.token
  }
}

export const authService = new AuthService()