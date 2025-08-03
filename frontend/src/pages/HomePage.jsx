import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom
} from '@mui/material'
import {
  Explore as ExploreIcon,
  Create as CreateIcon,
  Groups as GroupsIcon,
  AutoAwesome as AutoAwesomeIcon,
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon
} from '@mui/icons-material'

const features = [
  {
    icon: <ExploreIcon sx={{ fontSize: 48 }} />,
    title: 'Explore Worlds',
    description: 'Discover countless adventures created by our community of storytellers'
  },
  {
    icon: <CreateIcon sx={{ fontSize: 48 }} />,
    title: 'Create Stories',
    description: 'Build your own interactive adventures with our intuitive world editor'
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 48 }} />,
    title: 'Play Together',
    description: 'Join multiplayer rooms and experience adventures with friends'
  },
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: 48 }} />,
    title: 'AI Enhanced',
    description: 'Dynamic story generation and artwork powered by advanced AI'
  },
  {
    icon: <CloudUploadIcon sx={{ fontSize: 48 }} />,
    title: 'Share Worlds',
    description: 'Upload and share your creations with players worldwide'
  },
  {
    icon: <SaveIcon sx={{ fontSize: 48 }} />,
    title: 'Cross-World Progress',
    description: 'Save your progress and carry items between different adventures'
  }
]

const HomePage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          py: { xs: 8, md: 12 }
        }}
      >
        <Container maxWidth="lg">
          <Fade in timeout={1000}>
            <Box textAlign="center">
              <Typography
                variant={isMobile ? 'h3' : 'h1'}
                fontWeight="bold"
                gutterBottom
                className="gradient-text"
              >
                Your Adventure Awaits
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
              >
                Create, play, and share interactive choose-your-own-adventure stories
                with AI-powered storytelling and multiplayer support
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/worlds')}
                  startIcon={<ExploreIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(45deg, #f39c12 30%, #e67e22 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #e67e22 30%, #d35400 90%)',
                    }
                  }}
                >
                  Explore Worlds
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.light',
                      backgroundColor: 'rgba(243, 156, 18, 0.1)'
                    }
                  }}
                >
                  Get Started
                </Button>
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Everything You Need for Epic Adventures
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Zoom in timeout={500 + index * 100}>
                <Card
                  sx={{
                    height: '100%',
                    p: 3,
                    textAlign: 'center',
                    transition: 'all 0.3s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      '& .feature-icon': {
                        color: 'primary.main',
                        transform: 'scale(1.1)'
                      }
                    }
                  }}
                >
                  <CardContent>
                    <Box
                      className="feature-icon"
                      sx={{
                        color: 'text.secondary',
                        mb: 2,
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.1) 0%, rgba(230, 126, 34, 0.1) 100%)',
          py: 8,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Ready to Start Your Journey?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Join thousands of adventurers creating and exploring amazing stories
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                }
              }}
            >
              Create Free Account
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default HomePage