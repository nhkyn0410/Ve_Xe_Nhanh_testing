FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --omit=dev --workspace backend --include-workspace-root=false

COPY backend ./backend

EXPOSE 5000

CMD ["npm", "run", "start", "--workspace", "backend"]
