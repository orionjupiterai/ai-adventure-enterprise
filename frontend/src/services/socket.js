import { io } from 'socket.io-client'
import { toast } from 'react-toastify'

let socket = null

export const setupSocketConnection = () => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    console.error('No auth token for socket connection')
    return
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || '', {
    auth: {
      token
    },
    transports: ['websocket', 'polling']
  })

  socket.on('connect', () => {
    console.log('Socket connected')
    socket.emit('subscribe_notifications')
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
    toast.error('Connection error')
  })

  socket.on('notification', (notification) => {
    toast.info(notification.message)
  })

  return () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }
}

export const getSocket = () => socket

export const joinRoom = (roomId) => {
  if (!socket) return
  socket.emit('join_room', roomId)
}

export const leaveRoom = (roomId) => {
  if (!socket) return
  socket.emit('leave_room', roomId)
}

export const sendGameAction = (action, target, sessionId) => {
  if (!socket) return
  socket.emit('game_action', { action, target, sessionId })
}

export const sendChatMessage = (roomId, message) => {
  if (!socket) return
  socket.emit('chat_message', { roomId, message })
}

export const updatePlayerState = (state) => {
  if (!socket) return
  socket.emit('update_player_state', { state })
}