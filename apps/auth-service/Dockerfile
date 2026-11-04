FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# Build from the repository root for the npm workspace and shared files.
COPY . .

RUN npm ci --omit=dev --workspace=invoice_payment_service --include-workspace-root=false \
    && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
       npm run db:generate --workspace=invoice_payment_service

USER node

EXPOSE 3001

CMD ["npm", "run", "start", "--workspace=auth-service"]