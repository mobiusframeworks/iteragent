# Multi-stage build for InterTools Railway Backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/iteragent-cli/package*.json ./packages/iteragent-cli/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY packages/iteragent-cli/src ./packages/iteragent-cli/src
COPY packages/iteragent-cli/tsconfig.json ./packages/iteragent-cli/

# Build TypeScript
WORKDIR /app/packages/iteragent-cli
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S intertools -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=intertools:nodejs /app/packages/iteragent-cli/dist ./dist
COPY --from=builder --chown=intertools:nodejs /app/packages/iteragent-cli/node_modules ./node_modules
COPY --from=builder --chown=intertools:nodejs /app/packages/iteragent-cli/package.json ./

# Create directories for data persistence
RUN mkdir -p .intertools && chown intertools:nodejs .intertools

# Switch to app user
USER intertools

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/railway-server.js"]
