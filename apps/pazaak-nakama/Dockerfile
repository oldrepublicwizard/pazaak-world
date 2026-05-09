# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
WORKDIR /workspace
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.workspace.json ./
COPY packages ./packages
COPY apps/pazaak-nakama ./apps/pazaak-nakama
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @openkotor/pazaak-nakama build

FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=deps /workspace/apps/pazaak-nakama/dist ./dist
COPY --from=deps /workspace/apps/pazaak-nakama/package.json ./package.json

# Nakama modules are typically loaded by a Nakama server; this container
# is primarily useful for build verification and CI/CD pipelines that need
# to check the Nakama bundle can be successfully built and packaged.
# To run locally with Nakama, mount the dist directory into the Nakama container.
CMD ["sh", "-c", "echo 'Nakama module bundle built. See /app/dist for compiled modules.' && tail -f /dev/null"]
