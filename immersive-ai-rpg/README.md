# Immersive AI RPG Platform

An advanced RPG platform that leverages Claude AI to create dynamic, personalized adventures with real-time world generation, adaptive storytelling, and intelligent NPC interactions.

## Features

- **Dynamic World Generation**: AI-powered procedural world creation
- **Adaptive Storytelling**: Real-time narrative generation based on player actions
- **Intelligent NPCs**: Characters with personalities, memories, and dynamic dialogue
- **Visual & Audio Generation**: AI-generated scenes and voice synthesis
- **Balanced Gameplay**: Adversarial AI ensures fair challenges
- **Multiple Genres**: Fantasy, Sci-Fi, Cyberpunk, and Horror themes

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development servers
npm run dev
```

## Project Structure

- `/frontend` - React-based game interface
- `/backend` - Node.js API server
- `/ai-services` - Microservices for AI features
- `/.claude` - Claude Code subagents for development
- `/database` - Database schemas and migrations
- `/docs` - Comprehensive documentation

## Technologies

- **Frontend**: React, Tailwind CSS, Zustand/Redux
- **Backend**: Node.js, Express, Supabase
- **AI**: Claude API, MidJourney, ElevenLabs
- **Infrastructure**: Docker, Kubernetes, Terraform

## License

MIT License - see LICENSE file for details