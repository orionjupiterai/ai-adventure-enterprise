import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Chip,
  IconButton,
  Skeleton,
  LinearProgress,
  Tab,
  Tabs
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Explore as ExploreIcon,
  Groups as GroupsIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)
  const [tabValue, setTabValue] = useState(0)
  const [sessions, setSessions] = useState([])
  const [saves, setSaves] = useState([])
  const [userWorlds, setUserWorlds] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [sessionsRes, savesRes, worldsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/games/sessions`),
        axios.get(`${API_URL}/games/saves`),
        axios.get(`${API_URL}/users/worlds`),
        axios.get(`${API_URL}/users/stats`)
      ])

      setSessions(sessionsRes.data.sessions)
      setSaves(savesRes.data)
      setUserWorlds(worldsRes.data.worlds)
      setStats(statsRes.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSave = async (saveId) => {
    if (!window.confirm('Are you sure you want to delete this save?')) return

    try {
      await axios.delete(`${API_URL}/games/saves/${saveId}`)
      setSaves(saves.filter(s => s.id !== saveId))
      toast.success('Save deleted')
    } catch (error) {
      toast.error('Failed to delete save')
    }
  }

  const handleDeleteWorld = async (worldId) => {
    if (!window.confirm('Are you sure you want to delete this world? This cannot be undone.')) return

    try {
      await axios.delete(`${API_URL}/worlds/${worldId}`)
      setUserWorlds(userWorlds.filter(w => w.id !== worldId))
      toast.success('World deleted')
    } catch (error) {
      toast.error('Failed to delete world')
    }
  }

  const StatCard = ({ icon, title, value, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              color: 'white',
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  const renderContent = () => {
    switch (tabValue) {
      case 0: // Continue Playing
        return (
          <Grid container spacing={3}>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Grid item xs={12} key={i}>
                  <Skeleton variant="rectangular" height={100} />
                </Grid>
              ))
            ) : sessions.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No active game sessions
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ExploreIcon />}
                    onClick={() => navigate('/worlds')}
                    sx={{ mt: 2 }}
                  >
                    Explore Worlds
                  </Button>
                </Paper>
              </Grid>
            ) : (
              sessions.map(session => (
                <Grid item xs={12} key={session.id}>
                  <Card>
                    <CardContent>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="h6">
                            {session.session_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {session.world.name}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                            <Chip
                              icon={<ScheduleIcon />}
                              label={`Last played ${format(new Date(session.last_played_at), 'MMM d, yyyy')}`}
                              size="small"
                            />
                            <Chip
                              icon={<PlayIcon />}
                              label={`${session.stats?.moves || 0} moves`}
                              size="small"
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button
                              variant="contained"
                              startIcon={<PlayIcon />}
                              onClick={() => navigate(`/game/${session.id}`)}
                            >
                              Continue
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )

      case 1: // Saved Games
        return (
          <Grid container spacing={3}>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Grid item xs={12} md={6} key={i}>
                  <Skeleton variant="rectangular" height={150} />
                </Grid>
              ))
            ) : saves.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No saved games yet
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              saves.map(save => (
                <Grid item xs={12} md={6} key={save.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {save.save_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {save.session.world.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Saved {format(new Date(save.created_at), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() => navigate(`/game/load/${save.id}`)}
                      >
                        Load
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSave(save.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )

      case 2: // My Worlds
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Your Created Worlds
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/create-world')}
                >
                  Create New World
                </Button>
              </Box>
            </Grid>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Skeleton variant="rectangular" height={200} />
                </Grid>
              ))
            ) : userWorlds.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    You haven't created any worlds yet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create-world')}
                    sx={{ mt: 2 }}
                  >
                    Create Your First World
                  </Button>
                </Paper>
              </Grid>
            ) : (
              userWorlds.map(world => (
                <Grid item xs={12} md={4} key={world.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {world.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <StarIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {world.rating_average.toFixed(1)} ({world.rating_count} ratings)
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {world.play_count} plays
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {world.is_public ? (
                          <Chip label="Public" color="success" size="small" />
                        ) : (
                          <Chip label="Private" color="default" size="small" />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<TrendingIcon />}>
                        Stats
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteWorld(world.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )

      default:
        return null
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Welcome back, {user?.displayName || user?.username}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Your adventure dashboard
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PlayIcon />}
            title="Games Played"
            value={stats?.gamesPlayed || 0}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ExploreIcon />}
            title="Worlds Created"
            value={stats?.worldsCreated || 0}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrophyIcon />}
            title="Achievements"
            value={stats?.achievementsEarned || 0}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ScheduleIcon />}
            title="Hours Played"
            value={stats?.totalPlayTimeHours || 0}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Continue Playing" />
          <Tab label="Saved Games" />
          <Tab label="My Worlds" />
        </Tabs>
        
        {renderContent()}
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<ExploreIcon />}
          onClick={() => navigate('/worlds')}
        >
          Explore Worlds
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<GroupsIcon />}
          onClick={() => navigate('/multiplayer')}
        >
          Join Multiplayer
        </Button>
      </Box>
    </Container>
  )
}

export default DashboardPage