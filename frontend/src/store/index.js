import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import gameReducer from './gameSlice'
import worldReducer from './worldSlice'
import multiplayerReducer from './multiplayerSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    world: worldReducer,
    multiplayer: multiplayerReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['socket/connected', 'socket/disconnected'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp', 'payload.socket'],
        // Ignore these paths in the state
        ignoredPaths: ['multiplayer.socket']
      }
    })
})