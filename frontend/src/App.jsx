import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/material'

// Layout components
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WorldsPage from './pages/WorldsPage'
import WorldDetailPage from './pages/WorldDetailPage'
import GamePage from './pages/GamePage'
import ProfilePage from './pages/ProfilePage'
import CreateWorldPage from './pages/CreateWorldPage'
import MultiplayerPage from './pages/MultiplayerPage'
import DashboardPage from './pages/DashboardPage'

// Services
import { initializeAuth } from './store/authSlice'
import { setupSocketConnection } from './services/socket'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector(state => state.auth)

  useEffect(() => {
    // Initialize authentication
    dispatch(initializeAuth())
  }, [dispatch])

  useEffect(() => {
    // Setup WebSocket connection when authenticated
    if (isAuthenticated) {
      const cleanup = setupSocketConnection()
      return cleanup
    }
  }, [isAuthenticated])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="worlds" element={<WorldsPage />} />
          <Route path="worlds/:worldId" element={<WorldDetailPage />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="create-world" element={<CreateWorldPage />} />
            <Route path="game/:sessionId" element={<GamePage />} />
            <Route path="multiplayer" element={<MultiplayerPage />} />
            <Route path="multiplayer/:roomId" element={<GamePage multiplayer />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  )
}

export default App