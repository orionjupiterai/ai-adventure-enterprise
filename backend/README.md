# Adventure Platform Backend

A complete Node.js backend for a choose-your-own-adventure game platform with real-time multiplayer capabilities.

## Features

### Core Infrastructure
- **Express.js** server with comprehensive middleware
- **PostgreSQL** database with Sequelize ORM
- **Redis** for session management and caching
- **WebSocket** integration for real-time multiplayer
- **JWT** authentication with refresh tokens
- **File upload** handling with Multer
- **GraphQL** API (optional)

### Security Features
- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** with Redis backing
- **Input validation** and sanitization
- **XSS and NoSQL injection** prevention
- **Password hashing** with bcrypt

### Authentication & Authorization
- User registration and login
- JWT access tokens (15 minutes)
- Refresh tokens (7 days)
- Session management with Redis
- Multi-device session tracking
- Password change functionality
- Account deactivation support

### Multiplayer Features
- Real-time WebSocket communication
- Room-based multiplayer sessions
- Voice chat signaling (WebRTC)
- Player state synchronization
- Chat messaging
- Admin controls (kick, transfer host)

### File Management
- Avatar uploads (images)
- World file uploads (JSON/ZIP)
- Save game management
- Temporary file cleanup
- CDN-ready static file serving

### Database Schema
- Users with profiles and preferences
- Worlds with versioning and ratings
- Game sessions with state persistence
- Multiplayer rooms with participants
- Achievements system
- AI-generated content tracking
- Analytics events

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Redis 6+

### Installation

1. **Clone and setup**:
```bash
cd backend
npm install
```

2. **Environment configuration**:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Database setup**:
```bash
# Create PostgreSQL database
createdb adventure_platform

# Run database initialization
psql adventure_platform < ../docker/postgres/init.sql
```

4. **Start services**:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Environment Variables

Key environment variables to configure:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/adventure_platform

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (MUST change in production)
JWT_SECRET=your_jwt_secret_min_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_min_32_characters

# API Configuration
PORT=3000
FRONTEND_URL=http://localhost:3001
```

See `.env.example` for all available options.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (single device)
- `POST /api/auth/logout-all` - Logout all devices
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/change-password` - Change password

### World Management
- `GET /api/worlds` - List worlds (with search/filter)
- `POST /api/worlds` - Create new world
- `GET /api/worlds/:id` - Get world details
- `PUT /api/worlds/:id` - Update world
- `DELETE /api/worlds/:id` - Delete world
- `POST /api/worlds/:id/rate` - Rate world

### Game Sessions
- `GET /api/games` - List user's game sessions
- `POST /api/games` - Create new game session
- `GET /api/games/:id` - Get session details
- `PUT /api/games/:id` - Update session state
- `DELETE /api/games/:id` - Delete session

### Multiplayer
- `GET /api/multiplayer/rooms` - List active rooms
- `POST /api/multiplayer/rooms` - Create room
- `POST /api/multiplayer/join` - Join room by code
- `GET /api/multiplayer/rooms/:id` - Get room details
- `PUT /api/multiplayer/rooms/:id` - Update room
- `DELETE /api/multiplayer/rooms/:id` - Delete room

### File Uploads
- `POST /api/upload/avatar` - Upload avatar image
- `POST /api/upload/world` - Upload world file
- `POST /api/upload/save` - Upload save file

## WebSocket Events

### Connection
- `connected` - Connection established
- `disconnected` - Connection lost

### Room Management
- `join_room` - Join multiplayer room
- `leave_room` - Leave room
- `player_joined` - Player joined notification
- `player_left` - Player left notification

### Game Actions
- `game_action` - Send game action
- `player_action` - Receive player action
- `sync_game_state` - Synchronize game state
- `game_state_updated` - Game state changed

### Communication
- `chat_message` - Send/receive chat messages
- `direct_message` - Private messages
- `typing_start/stop` - Typing indicators

### Admin Actions
- `admin_action` - Room admin commands
- `player_kicked` - Player kicked notification
- `host_transferred` - Host ownership changed

## Security Features

### Rate Limiting
- General API: 1000 requests/15 minutes
- Authentication: 10 attempts/15 minutes
- AI endpoints: 20 requests/minute
- File uploads: 50 uploads/hour
- Failed auth attempts: Progressive limiting

### Input Validation
- Comprehensive validation rules
- XSS prevention with HTML sanitization
- NoSQL injection prevention
- File type and size validation
- Request size limits

### Session Management
- Redis-backed sessions
- Multi-device session tracking
- Session revocation
- Automatic cleanup of expired sessions

## Database Models

### Core Models
- **User**: User accounts and profiles
- **World**: Adventure world definitions
- **GameSession**: Individual game playthroughs
- **SaveGame**: Game save states
- **MultiplayerRoom**: Multiplayer session rooms
- **RoomParticipant**: Room membership

### Support Models
- **WorldRating**: User ratings for worlds
- **Achievement**: Achievement definitions
- **UserAchievement**: User achievement progress
- **AIContent**: AI-generated content tracking

## Deployment

### Docker
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Environment Setup
1. Set production environment variables
2. Use strong JWT secrets (64+ characters)
3. Enable SSL/TLS for database connections
4. Configure proper CORS origins
5. Set up log rotation
6. Configure monitoring and health checks

### Health Monitoring
- Health check endpoint: `GET /health`
- Includes database and Redis connectivity
- Memory and CPU usage metrics
- Uptime and version information

## Development

### Scripts
- `npm run dev` - Development with nodemon
- `npm start` - Production start
- `npm test` - Run tests
- `npm run lint` - Code linting

### Project Structure
```
src/
├── api/
│   ├── routes/          # API route handlers
│   └── graphql/         # GraphQL schema and resolvers
├── config/              # Configuration files
├── middleware/          # Express middleware
├── models/              # Database models
├── services/            # Business logic services
└── utils/               # Utility functions
```

### Adding New Features
1. Create route handlers in `api/routes/`
2. Add validation rules in `middleware/validation.js`
3. Implement business logic in `services/`
4. Add database models if needed
5. Update rate limiting if necessary
6. Add WebSocket events if real-time needed

## Troubleshooting

### Common Issues

**Database Connection Errors**:
- Check PostgreSQL is running
- Verify connection string in `.env`
- Ensure database exists

**Redis Connection Errors**:
- Check Redis is running
- Verify Redis configuration
- Check Redis password if set

**WebSocket Connection Issues**:
- Verify CORS configuration
- Check frontend WebSocket URL
- Ensure JWT token is valid

**File Upload Problems**:
- Check upload directory permissions
- Verify file size limits
- Check available disk space

### Logs
Logs are written to console and optionally to files:
- Error logs include request context
- Unique error IDs for tracking
- Different log levels based on environment

## Contributing

1. Follow existing code patterns
2. Add proper error handling
3. Include input validation
4. Write tests for new features
5. Update documentation

## License

Private - Adventure Platform Pro