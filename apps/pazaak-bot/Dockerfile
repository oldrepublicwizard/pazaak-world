# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
WORKDIR /workspace
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.workspace.json ./
COPY packages ./packages
COPY apps/pazaak-bot ./apps/pazaak-bot
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pazaak/pazaak-bot build

FROM base AS runtime
WORKDIR /workspace
COPY --from=deps /workspace/package.json ./package.json
COPY --from=deps /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /workspace/tsconfig.base.json ./tsconfig.base.json
COPY --from=deps /workspace/tsconfig.workspace.json ./tsconfig.workspace.json
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages ./packages
COPY --from=deps /workspace/apps/pazaak-bot ./apps/pazaak-bot

CMD ["node", "apps/pazaak-bot/dist/main.js"]
