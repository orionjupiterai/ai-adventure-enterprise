import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Badge,
  Fade,
  Slide,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material'
import {
  Inventory as InventoryIcon,
  Save as SaveIcon,
  ExitToApp as ExitIcon,
  Settings as SettingsIcon,
  Map as MapIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import { toast } from 'react-toastify'
import { continueGame, performAction, saveGame, clearGame, toggleAutoSave } from '../store/gameSlice'
import { sendGameAction, sendChatMessage } from '../services/socket'

const GamePage = ({ multiplayer = false }) => {
  const { sessionId, roomId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const gameState = useSelector(state => state.game)
  const multiplayerState = useSelector(state => state.multiplayer)
  const { user } = useSelector(state => state.auth)
  
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(multiplayer)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [typewriterText, setTypewriterText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  const chatInputRef = useRef(null)
  const gameContainerRef = useRef(null)

  useEffect(() => {
    if (sessionId && !multiplayer) {
      dispatch(continueGame(sessionId))
    }
    
    return () => {
      if (!multiplayer) {
        dispatch(clearGame())
      }
    }
  }, [sessionId, multiplayer, dispatch])

  // Typewriter effect for location description
  useEffect(() => {
    if (gameState.locationData?.description) {
      setIsTyping(true)
      setTypewriterText('')
      
      const text = gameState.locationData.description
      let index = 0
      
      const timer = setInterval(() => {
        if (index < text.length) {
          setTypewriterText(prev => prev + text[index])
          index++
        } else {
          setIsTyping(false)
          clearInterval(timer)
        }
      }, 20)
      
      return () => clearInterval(timer)
    }
  }, [gameState.locationData])

  // Auto-save functionality
  useEffect(() => {
    if (!multiplayer && gameState.autoSaveEnabled && gameState.sessionId) {
      const autoSaveTimer = setInterval(() => {
        handleAutoSave()
      }, 5 * 60 * 1000) // Auto-save every 5 minutes
      
      return () => clearInterval(autoSaveTimer)
    }
  }, [gameState.autoSaveEnabled, gameState.sessionId, multiplayer])

  const handleAction = async (action, target) => {
    if (multiplayer) {
      sendGameAction(action, target, roomId)
    } else {
      const result = await dispatch(performAction({
        sessionId: gameState.sessionId,
        action,
        target
      }))
      
      if (performAction.fulfilled.match(result) && result.payload.message) {
        toast.info(result.payload.message)
      }
    }
    
    // Play sound effect
    if (soundEnabled) {
      playSound('action')
    }
  }

  const handleSaveGame = async () => {
    if (!saveName.trim()) {
      toast.error('Please enter a save name')
      return
    }
    
    const result = await dispatch(saveGame({
      sessionId: gameState.sessionId,
      saveName: saveName.trim()
    }))
    
    if (saveGame.fulfilled.match(result)) {
      toast.success('Game saved successfully!')
      setSaveDialogOpen(false)
      setSaveName('')
    }
  }

  const handleAutoSave = async () => {
    const result = await dispatch(saveGame({
      sessionId: gameState.sessionId,
      saveName: `Auto Save - ${new Date().toLocaleString()}`
    }))
    
    if (saveGame.fulfilled.match(result)) {
      toast.info('Game auto-saved', { autoClose: 2000 })
    }
  }

  const handleSendChat = (message) => {
    if (message.trim() && multiplayer) {
      sendChatMessage(roomId, message.trim())
      if (chatInputRef.current) {
        chatInputRef.current.value = ''
      }
    }
  }

  const playSound = (type) => {
    // Sound implementation would go here
    console.log(`Playing sound: ${type}`)
  }

  const toggleFullscreen = () => {
    if (!fullscreen) {
      gameContainerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setFullscreen(!fullscreen)
  }

  const renderInventoryItem = (item) => (
    <ListItem key={item.id}>
      <ListItemIcon>
        <Badge badgeContent={item.quantity || 1} color="primary">
          <InventoryIcon />
        </Badge>
      </ListItemIcon>
      <ListItemText
        primary={item.name}
        secondary={item.description}
      />
    </ListItem>
  )

  const renderChoice = (choice, index) => (
    <Slide direction="up" in mountOnEnter unmountOnExit timeout={300 + index * 100} key={index}>
      <Button
        variant="outlined"
        size="large"
        fullWidth
        onClick={() => handleAction(choice.action, choice.target)}
        disabled={gameState.loading || isTyping}
        sx={{
          py: 2,
          px: 3,
          justifyContent: 'flex-start',
          textAlign: 'left',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          color: 'text.primary',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(243, 156, 18, 0.1)',
            transform: 'translateX(8px)'
          }
        }}
      >
        <Typography variant="body1">
          {choice.text}
        </Typography>
      </Button>
    </Slide>
  )

  if (gameState.loading && !gameState.locationData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box ref={gameContainerRef} sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Game Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" fontWeight="bold">
                {gameState.sessionName || 'Adventure'}
              </Typography>
              {gameState.worldInfo && (
                <Typography variant="body2" color="text.secondary">
                  {gameState.worldInfo.name} by {gameState.worldInfo.author}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Tooltip title="Inventory">
                  <IconButton onClick={() => setInventoryOpen(true)}>
                    <Badge badgeContent={gameState.inventory.length} color="primary">
                      <InventoryIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="History">
                  <IconButton onClick={() => setHistoryOpen(true)}>
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
                
                {multiplayer && (
                  <Tooltip title="Chat">
                    <IconButton onClick={() => setChatOpen(!chatOpen)}>
                      <Badge badgeContent={multiplayerState.chatMessages.length} color="primary">
                        <ChatIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title={soundEnabled ? "Mute" : "Unmute"}>
                  <IconButton onClick={() => setSoundEnabled(!soundEnabled)}>
                    {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
                  <IconButton onClick={toggleFullscreen}>
                    {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </IconButton>
                </Tooltip>
                
                {!multiplayer && (
                  <Tooltip title="Save game">
                    <IconButton onClick={() => setSaveDialogOpen(true)}>
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Exit game">
                  <IconButton onClick={() => navigate(multiplayer ? '/multiplayer' : '/dashboard')}>
                    <ExitIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Game Area */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={multiplayer && chatOpen ? 8 : 12}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                minHeight: '60vh',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Location */}
              <Fade in timeout={500}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" gutterBottom color="primary.main" fontWeight="bold">
                    {gameState.locationData?.name}
                  </Typography>
                  
                  <Box sx={{ position: 'relative' }}>
                    <Typography
                      variant="body1"
                      paragraph
                      sx={{
                        lineHeight: 1.8,
                        color: 'text.primary',
                        fontSize: '1.1rem'
                      }}
                      component="div"
                    >
                      <ReactMarkdown>
                        {typewriterText || gameState.locationData?.description}
                      </ReactMarkdown>
                    </Typography>
                    {isTyping && (
                      <Box
                        sx={{
                          display: 'inline-block',
                          width: '2px',
                          height: '1.2em',
                          backgroundColor: 'primary.main',
                          animation: 'blink 1s infinite'
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Fade>

              {/* Choices */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom color="text.secondary">
                  What do you do?
                </Typography>
                <Grid container spacing={2}>
                  {gameState.locationData?.choices?.map((choice, index) => (
                    <Grid item xs={12} key={index}>
                      {renderChoice(choice, index)}
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Loading indicator */}
              {gameState.loading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Multiplayer Chat */}
          {multiplayer && chatOpen && (
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '60vh',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Room Chat
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
                  {multiplayerState.chatMessages.map((msg) => (
                    <Box key={msg.id} sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {msg.username} • {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                      <Typography variant="body2">
                        {msg.message}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  inputRef={chatInputRef}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendChat(e.target.value)
                    }
                  }}
                  size="small"
                />
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Inventory Drawer */}
        <Drawer
          anchor="right"
          open={inventoryOpen}
          onClose={() => setInventoryOpen(false)}
        >
          <Box sx={{ width: 350, p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Inventory
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {gameState.inventory.length === 0 ? (
              <Typography color="text.secondary">
                Your inventory is empty
              </Typography>
            ) : (
              <List>
                {gameState.inventory.map(renderInventoryItem)}
              </List>
            )}
          </Box>
        </Drawer>

        {/* History Drawer */}
        <Drawer
          anchor="left"
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
        >
          <Box sx={{ width: 350, p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Action History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {gameState.actionHistory.slice().reverse().map((action, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${action.action}: ${action.target}`}
                    secondary={
                      <>
                        {action.result}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle>Save Game</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Save Name"
              fullWidth
              variant="outlined"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="My Adventure Save"
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Auto-save is {gameState.autoSaveEnabled ? 'enabled' : 'disabled'}
              </Typography>
              <Button
                size="small"
                onClick={() => dispatch(toggleAutoSave())}
                sx={{ mt: 1 }}
              >
                {gameState.autoSaveEnabled ? 'Disable' : 'Enable'} Auto-save
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGame} variant="contained" disabled={gameState.saving}>
              {gameState.saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>

      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </Box>
  )
}

export default GamePage