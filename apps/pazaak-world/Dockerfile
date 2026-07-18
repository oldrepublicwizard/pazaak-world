# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
WORKDIR /workspace
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.workspace.json ./
COPY packages ./packages
COPY apps/pazaak-world ./apps/pazaak-world
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pazaak/platform build \
  && pnpm --filter @pazaak/blackjack-engine build \
  && pnpm --filter @pazaak/pazaak-engine build \
  && pnpm --filter pazaak-world build

FROM base AS runtime
WORKDIR /workspace
ARG PORT=4173
ENV PORT=${PORT}
COPY --from=deps /workspace/package.json ./package.json
COPY --from=deps /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /workspace/tsconfig.base.json ./tsconfig.base.json
COPY --from=deps /workspace/tsconfig.workspace.json ./tsconfig.workspace.json
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages ./packages
COPY --from=deps /workspace/apps/pazaak-world ./apps/pazaak-world
EXPOSE 4173
CMD ["sh", "-lc", "pnpm --filter pazaak-world preview --host 0.0.0.0 --port \"${PORT:-4173}\" --strictPort"]