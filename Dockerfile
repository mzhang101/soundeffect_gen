FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept Railway service variables as build args (injected by Railway at build time)
ARG VITE_LLM_API_KEY
ARG VITE_LLM_API_ENDPOINT
ARG VITE_LLM_MODEL
ARG VITE_ELEVENLABS_API_KEY
ARG VITE_API_URL
ARG VITE_USE_MOCK_AUDIO

# Build frontend with injected env vars so Vite bakes real values into the bundle
RUN VITE_LLM_API_KEY=${VITE_LLM_API_KEY} \
    VITE_LLM_API_ENDPOINT=${VITE_LLM_API_ENDPOINT} \
    VITE_LLM_MODEL=${VITE_LLM_MODEL} \
    VITE_ELEVENLABS_API_KEY=${VITE_ELEVENLABS_API_KEY} \
    VITE_API_URL=${VITE_API_URL} \
    VITE_USE_MOCK_AUDIO=${VITE_USE_MOCK_AUDIO} \
    npm run build

# Expose port
EXPOSE 3001

# Start server (serves both API and static files)
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
