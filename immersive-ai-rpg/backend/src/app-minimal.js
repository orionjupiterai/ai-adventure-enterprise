import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
}));
app.use(express.json());

// In-memory storage (for testing)
const users = new Map();
const games = new Map();

// Helper to generate JWT
const generateToken = (userId, email, role = 'player') => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '7d' }
  );
};

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Backend is running!'
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    console.log('Registration attempt:', { email, username });

    // Check if user exists
    const existingUser = Array.from(users.values()).find(
      u => u.email === email || u.username === username
    );
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: 'Email or username already exists' }
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userId = Date.now().toString();
    const user = {
      id: userId,
      email,
      username,
      passwordHash,
      role: 'player',
      createdAt: new Date().toISOString(),
    };

    users.set(userId, user);

    // Generate tokens
    const token = generateToken(userId, email);
    const refreshToken = generateToken(userId, email);

    console.log('User registered successfully:', username);

    res.status(201).json({
      success: true,
      user: {
        id: userId,
        email,
        username,
        role: 'player',
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Registration failed' }
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);

    // Find user
    const user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // Generate tokens
    const token = generateToken(user.id, user.email, user.role);
    const refreshToken = generateToken(user.id, user.email, user.role);

    console.log('User logged in successfully:', user.username);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Login failed' }
    });
  }
});

// Create demo user
const createDemoUser = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('DemoAccount123!', salt);
  
  const demoUser = {
    id: 'demo-user-id',
    email: 'demo@immersive-rpg.com',
    username: 'DemoPlayer',
    passwordHash,
    role: 'player',
    createdAt: new Date().toISOString(),
  };
  
  users.set('demo-user-id', demoUser);
  console.log('Demo user created');
};

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ 
    success: false,
    error: { message: `Route not found: ${req.method} ${req.url}` }
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Minimal backend server running on port ${PORT}`);
  console.log(`🌍 CORS enabled for http://localhost:3000`);
  console.log(`📝 Test the health endpoint: http://localhost:${PORT}/health`);
  
  // Create demo user
  await createDemoUser();
  console.log('✅ Demo user available: demo@immersive-rpg.com / DemoAccount123!');
});