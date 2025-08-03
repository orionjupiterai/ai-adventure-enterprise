FROM node:18-alpine

WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads and worlds directories
RUN mkdir -p uploads worlds saves

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/server.js"]