import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../services/auth'
import { apolloClient } from '../services/apollo'

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, email, password }) => {
    const response = await authService.login({ username, email, password })
    localStorage.setItem('token', response.token)
    return response
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, email, password, displayName }) => {
    const response = await authService.register({ username, email, password, displayName })
    localStorage.setItem('token', response.token)
    return response
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('token')
    await apolloClient.clearStore()
    return null
  }
)

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    try {
      const user = await authService.getMe()
      return { user, token }
    } catch (error) {
      localStorage.removeItem('token')
      throw error
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
    
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
    
    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
    
    // Initialize
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  }
})

export const { clearError, updateUser } = authSlice.actions
export default authSlice.reducer