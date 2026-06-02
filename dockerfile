FROM node:22.14-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y \
    ca-certificates \
    openssl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

COPY . .

RUN pnpm prisma generate

RUN pnpm run build

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV RUN_SEED=true

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]