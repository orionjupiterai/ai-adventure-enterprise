module.exports = {
  apps: [
    {
      name: 'adventure-backend',
      script: './backend/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'immersive-rpg-backend',
      script: './immersive-ai-rpg/backend/src/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/rpg-error.log',
      out_file: './logs/rpg-out.log',
      log_file: './logs/rpg-combined.log',
      time: true
    }
  ]
};