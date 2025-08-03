import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentWorld: null,
  worlds: [],
  userWorlds: [],
  featuredWorlds: [],
  recentWorlds: [],
  filters: {
    search: '',
    tags: [],
    sortBy: 'created_at',
    order: 'DESC'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }
}

const worldSlice = createSlice({
  name: 'world',
  initialState,
  reducers: {
    setCurrentWorld: (state, action) => {
      state.currentWorld = action.payload
    },
    setWorlds: (state, action) => {
      state.worlds = action.payload.worlds
      state.pagination = {
        page: action.payload.page,
        limit: action.payload.limit || 20,
        total: action.payload.total,
        totalPages: action.payload.totalPages
      }
    },
    appendWorlds: (state, action) => {
      state.worlds = [...state.worlds, ...action.payload.worlds]
      state.pagination.page = action.payload.page
    },
    setUserWorlds: (state, action) => {
      state.userWorlds = action.payload
    },
    setFeaturedWorlds: (state, action) => {
      state.featuredWorlds = action.payload
    },
    setRecentWorlds: (state, action) => {
      state.recentWorlds = action.payload
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.page = 1 // Reset to first page when filters change
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
      state.pagination.page = 1
    },
    updateWorldRating: (state, action) => {
      const { worldId, ratingAverage, ratingCount } = action.payload
      
      // Update in all world lists
      const updateWorld = (world) => {
        if (world.id === worldId) {
          world.ratingAverage = ratingAverage
          world.ratingCount = ratingCount
        }
      }
      
      state.worlds.forEach(updateWorld)
      state.userWorlds.forEach(updateWorld)
      state.featuredWorlds.forEach(updateWorld)
      
      if (state.currentWorld?.id === worldId) {
        state.currentWorld.ratingAverage = ratingAverage
        state.currentWorld.ratingCount = ratingCount
      }
    },
    incrementPlayCount: (state, action) => {
      const worldId = action.payload
      
      const updateWorld = (world) => {
        if (world.id === worldId) {
          world.playCount = (world.playCount || 0) + 1
        }
      }
      
      state.worlds.forEach(updateWorld)
      state.userWorlds.forEach(updateWorld)
      state.featuredWorlds.forEach(updateWorld)
      
      if (state.currentWorld?.id === worldId) {
        state.currentWorld.playCount = (state.currentWorld.playCount || 0) + 1
      }
    }
  }
})

export const {
  setCurrentWorld,
  setWorlds,
  appendWorlds,
  setUserWorlds,
  setFeaturedWorlds,
  setRecentWorlds,
  updateFilters,
  resetFilters,
  updateWorldRating,
  incrementPlayCount
} = worldSlice.actions

export default worldSlice.reducer