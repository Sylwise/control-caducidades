FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "cd server && node scripts/create_indexes.js && node scripts/create_admin.js && NODE_ENV=production npm start"]
