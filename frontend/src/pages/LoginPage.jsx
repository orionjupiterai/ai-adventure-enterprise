import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Fade
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { login, clearError } from '../store/authSlice'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { loading, error } = useSelector(state => state.auth)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const from = location.state?.from?.pathname || '/dashboard'

  const onSubmit = async (data) => {
    dispatch(clearError())
    const result = await dispatch(login(data))
    if (login.fulfilled.match(result)) {
      navigate(from, { replace: true })
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Fade in timeout={500}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <LoginIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Typography component="h1" variant="h4" fontWeight="bold">
                Welcome Back
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username or Email"
                autoComplete="username"
                autoFocus
                {...register('username', {
                  required: 'Username or email is required'
                })}
                error={!!errors.username}
                helperText={errors.username?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #f39c12 30%, #e67e22 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #e67e22 30%, #d35400 90%)',
                  }
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Divider sx={{ my: 3 }}>OR</Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    style={{
                      color: '#f39c12',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Sign up now
                  </Link>
                </Typography>
              </Box>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link
                  to="/forgot-password"
                  style={{
                    color: '#b0b0b0',
                    textDecoration: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  Forgot password?
                </Link>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Box>
    </Container>
  )
}

export default LoginPage