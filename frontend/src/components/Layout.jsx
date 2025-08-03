import React, { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  Menu as MenuIcon,
  Explore as ExploreIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Login as LoginIcon
} from '@mui/icons-material'
import { logout } from '../store/authSlice'

const Layout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector(state => state.auth)
  
  const [anchorElUser, setAnchorElUser] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget)
  }

  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const menuItems = [
    { text: 'Explore Worlds', icon: <ExploreIcon />, path: '/worlds', auth: false },
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', auth: true },
    { text: 'Create World', icon: <AddIcon />, path: '/create-world', auth: true },
    { text: 'Multiplayer', icon: <GroupsIcon />, path: '/multiplayer', auth: true }
  ]

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Adventure Platform
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems
          .filter(item => !item.auth || isAuthenticated)
          .map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
            >
              <ListItemIcon sx={{ color: 'primary.main' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'primary.main',
                textDecoration: 'none',
                display: { xs: 'none', md: 'flex' }
              }}
            >
              ADVENTURE
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {menuItems
                .filter(item => !item.auth || isAuthenticated)
                .map((item) => (
                  <Button
                    key={item.text}
                    onClick={() => navigate(item.path)}
                    sx={{ my: 2, color: 'white', display: 'block' }}
                    startIcon={item.icon}
                  >
                    {item.text}
                  </Button>
                ))}
            </Box>

            <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

            {isAuthenticated ? (
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar
                      alt={user?.displayName || user?.username}
                      src={user?.avatarUrl}
                      sx={{ bgcolor: 'primary.main' }}
                    >
                      {(user?.displayName || user?.username || '?')[0].toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={() => { navigate('/profile'); handleCloseUserMenu(); }}>
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    <Typography textAlign="center">Profile</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/dashboard'); handleCloseUserMenu(); }}>
                    <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                    <Typography textAlign="center">Dashboard</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/register')}
                  sx={{ ml: 1 }}
                >
                  Sign Up
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Adventure Platform. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}

export default Layout