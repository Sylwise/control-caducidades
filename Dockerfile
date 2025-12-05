FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install root dependencies
RUN npm install

# Install client dependencies
WORKDIR /app/client
RUN npm install

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Return to root
WORKDIR /app

# Copy source code
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build

# Return to root
WORKDIR /app

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "cd server && node scripts/create_indexes.js && node scripts/create_admin.js && NODE_ENV=production npm start"]
