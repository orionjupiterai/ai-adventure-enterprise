import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { getSocket, joinRoom, leaveRoom } from '../services/socket'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const createRoom = createAsyncThunk(
  'multiplayer/createRoom',
  async ({ worldId, roomName, maxPlayers, isPrivate }) => {
    const response = await axios.post(`${API_URL}/multiplayer/rooms`, {
      worldId,
      roomName,
      maxPlayers,
      isPrivate
    })
    return response.data
  }
)

export const joinMultiplayerRoom = createAsyncThunk(
  'multiplayer/joinRoom',
  async (roomCode) => {
    const response = await axios.post(`${API_URL}/multiplayer/rooms/join`, {
      roomCode
    })
    
    // Join socket room
    if (response.data.room) {
      joinRoom(response.data.room.id)
    }
    
    return response.data
  }
)

export const leaveMultiplayerRoom = createAsyncThunk(
  'multiplayer/leaveRoom',
  async (roomId) => {
    const response = await axios.post(`${API_URL}/multiplayer/rooms/${roomId}/leave`)
    
    // Leave socket room
    leaveRoom(roomId)
    
    return response.data
  }
)

export const updatePlayerState = createAsyncThunk(
  'multiplayer/updatePlayerState',
  async ({ roomId, playerState }) => {
    const response = await axios.put(`${API_URL}/multiplayer/rooms/${roomId}/state`, {
      playerState
    })
    return response.data
  }
)

const initialState = {
  currentRoom: null,
  roomParticipants: [],
  chatMessages: [],
  playerActions: [],
  activeRooms: [],
  loading: false,
  error: null,
  connected: false,
  playerStates: {}
}

const multiplayerSlice = createSlice({
  name: 'multiplayer',
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.connected = action.payload
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push({
        ...action.payload,
        id: Date.now(),
        timestamp: new Date().toISOString()
      })
      // Keep only last 100 messages
      if (state.chatMessages.length > 100) {
        state.chatMessages = state.chatMessages.slice(-100)
      }
    },
    addPlayerAction: (state, action) => {
      state.playerActions.push({
        ...action.payload,
        id: Date.now(),
        timestamp: new Date().toISOString()
      })
      // Keep only last 50 actions
      if (state.playerActions.length > 50) {
        state.playerActions = state.playerActions.slice(-50)
      }
    },
    updatePlayerState: (state, action) => {
      const { userId, state: playerState } = action.payload
      state.playerStates[userId] = playerState
    },
    playerJoined: (state, action) => {
      const participant = action.payload
      if (!state.roomParticipants.find(p => p.user.id === participant.user.id)) {
        state.roomParticipants.push(participant)
      }
    },
    playerLeft: (state, action) => {
      const { userId } = action.payload
      state.roomParticipants = state.roomParticipants.filter(
        p => p.user.id !== userId
      )
      delete state.playerStates[userId]
    },
    clearRoom: (state) => {
      state.currentRoom = null
      state.roomParticipants = []
      state.chatMessages = []
      state.playerActions = []
      state.playerStates = {}
    },
    setActiveRooms: (state, action) => {
      state.activeRooms = action.payload
    }
  },
  extraReducers: (builder) => {
    // Create room
    builder
      .addCase(createRoom.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false
        state.currentRoom = action.payload.room
        state.roomParticipants = action.payload.room.participants || []
        state.chatMessages = []
        state.playerActions = []
        
        // Join socket room
        joinRoom(action.payload.room.id)
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

    // Join room
    builder
      .addCase(joinMultiplayerRoom.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(joinMultiplayerRoom.fulfilled, (state, action) => {
        state.loading = false
        state.currentRoom = action.payload.room
        state.roomParticipants = action.payload.room.participants || []
        state.chatMessages = []
        state.playerActions = []
      })
      .addCase(joinMultiplayerRoom.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

    // Leave room
    builder
      .addCase(leaveMultiplayerRoom.fulfilled, (state) => {
        state.currentRoom = null
        state.roomParticipants = []
        state.chatMessages = []
        state.playerActions = []
        state.playerStates = {}
      })

    // Update player state
    builder
      .addCase(updatePlayerState.fulfilled, (state, action) => {
        // State updated via socket events
      })
  }
})

export const {
  setConnected,
  addChatMessage,
  addPlayerAction,
  playerJoined,
  playerLeft,
  clearRoom,
  setActiveRooms
} = multiplayerSlice.actions

export default multiplayerSlice.reducer