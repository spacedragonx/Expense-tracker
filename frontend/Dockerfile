# ---- Stage 1: build the static Vite bundle ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Baked in at BUILD time (Vite env vars are compile-time).
# Defaults to a relative path so the app works behind the Nginx proxy
# regardless of which domain it's served from.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---- Stage 2: serve the static build with Nginx ----
FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
