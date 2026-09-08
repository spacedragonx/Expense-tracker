# ---- Stage 1: build the static Vite bundle ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
# Deliberately NOT copying package-lock.json into this stage. The committed
# lockfile was generated on Windows and this npm bug (github.com/npm/cli/issues/4828)
# means npm can skip Rollup's platform-specific optional native binary even on a
# plain `npm install` when a foreign-platform lockfile is present at all. Installing
# from package.json alone forces a fresh resolution against this container's actual
# platform (linux-musl), which is what actually gets @rollup/rollup-linux-x64-musl
# installed. This only affects this ephemeral build stage — your real
# package-lock.json on the host is untouched.
RUN npm install

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
