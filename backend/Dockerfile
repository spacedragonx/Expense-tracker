# ---- Stage 1: build TypeScript -> JS ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: lean production runtime ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 5000

# Run as the non-root user baked into the node:alpine image
USER node

CMD ["node", "dist/server.js"]
