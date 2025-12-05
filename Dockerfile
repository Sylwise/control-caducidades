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

# Return to server to run the app
WORKDIR /app/server

# Expose port
EXPOSE 3000

# Start command
CMD npm run start:prod
