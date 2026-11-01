# -- Stage 1: Build dependencies ----------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching - npm install only reruns if package.json changes)
COPY package*.json ./

# Install production dependencies only (needs package-lock.json)
RUN npm ci --omit=dev

# -- Stage 2: Production image -------------------------------------------------
FROM node:18-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

WORKDIR /app

# Copy only production node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodeuser:nodejs . .

# Switch to non-root user
USER nodeuser

# Expose app port
EXPOSE 3000

# Health check for ECS / ELB / K8s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Start app
CMD ["node", "src/app.js"]
