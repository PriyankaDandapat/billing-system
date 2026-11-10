FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# Build from the repository root so the npm workspace and shared auth files are available.
COPY . .

RUN npm ci --omit=dev --workspace=subscription-service --include-workspace-root=false \
    && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
       npm run db:generate --workspace=subscription-service

USER node

EXPOSE 3002

CMD ["npm", "run", "start", "--workspace=subscription-service"]
