# Adventure Platform Pro

A comprehensive choose-your-own-adventure platform with AI integration, multiplayer capabilities, and cross-platform support.

## Features

### Core Features
- **Multi-world System**: Create and upload custom adventure worlds
- **Universal Save/Load**: Save progress across different game worlds
- **Cross-world Progression**: Carry inventory and achievements between worlds
- **Web & Mobile**: React web app + React Native mobile app
- **Real-time Multiplayer**: Play adventures together with WebSocket support

### AI Integration
- **ChatGPT Integration**: Dynamic story expansion and procedural content
- **DALL-E Image Generation**: AI-generated scene artwork
- **AI Dungeon Master**: Procedural content generation
- **Voice Narration**: Text-to-speech for immersive storytelling

### Technical Stack
- **Backend**: Node.js, Express, GraphQL, PostgreSQL, Redis
- **Frontend**: React, Redux, Material-UI, Apollo Client
- **Mobile**: React Native
- **Real-time**: Socket.io
- **Infrastructure**: Docker, AWS/Azure ready
- **AI**: OpenAI API integration

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/adventure-platform-pro.git
cd adventure-platform-pro
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
DATABASE_URL=postgresql://adventure_user:password@localhost:5432/adventure_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
```

### Docker Setup (Recommended)

```bash
# Start all services
docker-compose up

# Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:3000
# GraphQL Playground: http://localhost:3000/graphql
```

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Setup database:
```bash
# Create database
createdb adventure_platform

# Run migrations
cd backend && npm run migrate
```

3. Start services:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## Project Structure

```
adventure-platform-pro/
├── backend/                 # Express backend
│   ├── src/
│   │   ├── api/            # REST & GraphQL APIs
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Sequelize models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   └── styles/         # Global styles
│   └── Dockerfile
├── mobile/                 # React Native app
├── docker/                 # Docker configurations
├── docs/                   # Documentation
└── docker-compose.yml      # Docker compose config
```

## API Documentation

### REST API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

#### Worlds
- `GET /api/worlds` - List public worlds
- `GET /api/worlds/:id` - Get world details
- `POST /api/worlds` - Create new world (auth required)
- `PUT /api/worlds/:id` - Update world (owner only)
- `DELETE /api/worlds/:id` - Delete world (owner only)

#### Game Sessions
- `POST /api/games/start` - Start new game
- `GET /api/games/sessions` - List user's sessions
- `POST /api/games/action` - Perform game action
- `POST /api/games/save` - Save game state
- `POST /api/games/load/:saveId` - Load saved game

#### Multiplayer
- `POST /api/multiplayer/rooms` - Create room
- `POST /api/multiplayer/rooms/join` - Join room
- `GET /api/multiplayer/rooms` - List active rooms

#### AI Features
- `POST /api/ai/generate-story` - Generate story content
- `POST /api/ai/generate-image` - Generate scene artwork
- `POST /api/ai/dungeon-master` - AI game master

### GraphQL API

Access GraphQL playground at `http://localhost:3000/graphql`

Example queries:

```graphql
# Get worlds
query GetWorlds {
  worlds(page: 1, limit: 20, featured: true) {
    worlds {
      id
      name
      description
      author {
        username
      }
      playCount
      ratingAverage
    }
    totalPages
  }
}

# Start game
mutation StartGame {
  startGame(worldId: "world-id") {
    id
    sessionName
    currentLocation
  }
}
```

### WebSocket Events

#### Client Events
- `join_room` - Join multiplayer room
- `game_action` - Send game action
- `chat_message` - Send chat message
- `update_player_state` - Update player state

#### Server Events
- `player_joined` - Player joined room
- `player_action` - Player performed action
- `chat_message` - New chat message
- `player_state_update` - Player state changed

## Deployment

### Docker Deployment

1. Build images:
```bash
docker-compose build
```

2. Run with production config:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### AWS Deployment

1. Push to ECR:
```bash
# Build and tag
docker build -t adventure-platform-backend ./backend
docker tag adventure-platform-backend:latest $ECR_URI/adventure-platform-backend:latest

# Push
docker push $ECR_URI/adventure-platform-backend:latest
```

2. Deploy with ECS/Fargate or EKS

### Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for AI features

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

### Code Style

- ESLint for JavaScript/TypeScript
- Prettier for formatting
- Husky for pre-commit hooks

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Security

- JWT authentication
- Rate limiting on all endpoints
- Input validation with Joi
- SQL injection protection with Sequelize
- XSS protection with helmet
- CORS configured

## Performance

- Redis caching for sessions
- Database indexing
- Image optimization
- Lazy loading
- WebSocket connection pooling

## Monitoring

- Winston logging
- Sentry error tracking (optional)
- New Relic APM (optional)
- Custom analytics events

## License

MIT License - see LICENSE file for details

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Discord: [Join our community]

## Roadmap

- [ ] Voice chat in multiplayer
- [ ] Mobile app release
- [ ] Workshop for world creators
- [ ] Achievement system expansion
- [ ] Localization support
- [ ] VR mode support