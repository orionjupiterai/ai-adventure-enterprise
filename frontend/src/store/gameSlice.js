import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const startGame = createAsyncThunk(
  'game/start',
  async ({ worldId, sessionName }) => {
    const response = await axios.post(`${API_URL}/games/start`, {
      worldId,
      sessionName
    })
    return response.data
  }
)

export const continueGame = createAsyncThunk(
  'game/continue',
  async (sessionId) => {
    const response = await axios.get(`${API_URL}/games/continue/${sessionId}`)
    return response.data
  }
)

export const performAction = createAsyncThunk(
  'game/action',
  async ({ sessionId, action, target }) => {
    const response = await axios.post(`${API_URL}/games/action`, {
      sessionId,
      action,
      target
    })
    return response.data
  }
)

export const saveGame = createAsyncThunk(
  'game/save',
  async ({ sessionId, saveName }) => {
    const response = await axios.post(`${API_URL}/games/save`, {
      sessionId,
      saveName
    })
    return response.data
  }
)

export const loadGame = createAsyncThunk(
  'game/load',
  async (saveId) => {
    const response = await axios.post(`${API_URL}/games/load/${saveId}`)
    return response.data
  }
)

const initialState = {
  sessionId: null,
  sessionName: null,
  worldInfo: null,
  currentLocation: null,
  locationData: null,
  inventory: [],
  gameState: {},
  stats: {},
  loading: false,
  saving: false,
  error: null,
  actionHistory: [],
  autoSaveEnabled: true
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    clearGame: (state) => {
      return initialState
    },
    addToInventory: (state, action) => {
      state.inventory.push(action.payload)
    },
    removeFromInventory: (state, action) => {
      state.inventory = state.inventory.filter(item => item.id !== action.payload)
    },
    updateGameState: (state, action) => {
      state.gameState = { ...state.gameState, ...action.payload }
    },
    addToHistory: (state, action) => {
      state.actionHistory.push({
        ...action.payload,
        timestamp: new Date().toISOString()
      })
      // Keep only last 50 actions
      if (state.actionHistory.length > 50) {
        state.actionHistory = state.actionHistory.slice(-50)
      }
    },
    toggleAutoSave: (state) => {
      state.autoSaveEnabled = !state.autoSaveEnabled
    }
  },
  extraReducers: (builder) => {
    // Start game
    builder
      .addCase(startGame.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(startGame.fulfilled, (state, action) => {
        state.loading = false
        state.sessionId = action.payload.sessionId
        state.sessionName = action.payload.sessionName
        state.currentLocation = action.payload.currentLocation
        state.locationData = action.payload.locationData
        state.worldInfo = action.payload.worldInfo
        state.inventory = []
        state.gameState = {}
        state.actionHistory = []
      })
      .addCase(startGame.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

    // Continue game
    builder
      .addCase(continueGame.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(continueGame.fulfilled, (state, action) => {
        state.loading = false
        state.sessionId = action.payload.sessionId
        state.sessionName = action.payload.sessionName
        state.currentLocation = action.payload.currentLocation
        state.locationData = action.payload.locationData
        state.inventory = action.payload.inventory || []
        state.gameState = action.payload.gameState || {}
        state.stats = action.payload.stats || {}
      })
      .addCase(continueGame.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

    // Perform action
    builder
      .addCase(performAction.pending, (state) => {
        state.loading = true
      })
      .addCase(performAction.fulfilled, (state, action) => {
        state.loading = false
        
        if (action.payload.success) {
          state.currentLocation = action.payload.currentLocation
          
          if (action.payload.locationData) {
            state.locationData = action.payload.locationData
          }
          
          if (action.payload.inventoryUpdate) {
            state.inventory.push(action.payload.inventoryUpdate)
          }
          
          if (action.payload.stateUpdate) {
            state.gameState = { ...state.gameState, ...action.payload.stateUpdate }
          }
          
          // Add to history
          state.actionHistory.push({
            action: action.meta.arg.action,
            target: action.meta.arg.target,
            result: action.payload.message || 'Success',
            timestamp: new Date().toISOString()
          })
        }
      })
      .addCase(performAction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

    // Save game
    builder
      .addCase(saveGame.pending, (state) => {
        state.saving = true
      })
      .addCase(saveGame.fulfilled, (state) => {
        state.saving = false
      })
      .addCase(saveGame.rejected, (state, action) => {
        state.saving = false
        state.error = action.error.message
      })

    // Load game
    builder
      .addCase(loadGame.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadGame.fulfilled, (state, action) => {
        state.loading = false
        state.sessionId = action.payload.sessionId
        state.sessionName = action.payload.sessionName
        state.currentLocation = action.payload.currentLocation
        state.locationData = action.payload.locationData
        state.inventory = action.payload.inventory || []
        state.gameState = action.payload.gameState || {}
        state.stats = action.payload.stats || {}
        state.actionHistory = []
      })
      .addCase(loadGame.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  }
})

export const {
  clearGame,
  addToInventory,
  removeFromInventory,
  updateGameState,
  addToHistory,
  toggleAutoSave
} = gameSlice.actions

export default gameSlice.reducer