# ==========================================
# Head-2-Code Backend Container
# Node.js 20 Alpine (Lightweight & Secure)
# ==========================================
FROM node:20-alpine AS base

# Install build dependencies for native modules (bcrypt) and dumb-init
RUN apk add --no-cache dumb-init python3 make g++

WORKDIR /usr/src/app

# Install dependencies separately to leverage Docker layer caching
COPY package*.json ./

RUN npm ci --only=production && npm rebuild bcrypt --build-from-source

# Copy application source code
COPY . .

# Set container security: run as non-root user
USER node

# Expose API & WebSocket port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Healthcheck to monitor container status
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 0

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/index.js"]

