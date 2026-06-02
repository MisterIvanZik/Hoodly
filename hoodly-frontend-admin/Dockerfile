# ── BUILD ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

ARG DOTENV_PRIVATE_KEY
ENV DOTENV_PRIVATE_KEY=$DOTENV_PRIVATE_KEY

RUN node_modules/.bin/dotenvx run -- node_modules/.bin/vite build

# ── RUNNER ────────────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
