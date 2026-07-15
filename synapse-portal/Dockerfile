# Stage 1: Development
FROM node:22-alpine AS dev

WORKDIR /app

# Install tools to build native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./
RUN npm install

# Copy source code and generate Prisma
COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]


# Stage 2: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install tools to build native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

# Copy code and generate Prisma
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://synapse:synapse@db:5432/synapse?schema=public

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Explicitly install production tools needed for the entrypoint
# Standalone mode skips these because they aren't used by the web server
RUN npm install prisma tsx --omit=dev

# Expose port
EXPOSE 3000

# Start the application directly
CMD ["node", "server.js"]
