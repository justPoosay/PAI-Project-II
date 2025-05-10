FROM oven/bun:latest AS base
WORKDIR /usr/src/app

FROM base AS install
WORKDIR /temp/dev

COPY package.json bun.lock ./
COPY apps/backend apps/backend
COPY packages/common packages/common

RUN bun install

FROM base AS install-prod
WORKDIR /temp/prod

COPY package.json bun.lock ./
COPY apps/backend apps/backend
COPY packages/common packages/common
COPY apps/frontend/package.json apps/frontend/package.json
COPY patches patches

RUN bun install --production

FROM base AS prerelease
COPY --from=install /temp/dev/apps/backend apps/backend

COPY apps/backend apps/backend
COPY packages/common packages/common

WORKDIR /usr/src/app/apps/backend
ENV NODE_ENV=production

FROM base AS release
COPY --from=install-prod /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/apps/backend apps/backend
COPY --from=prerelease /usr/src/app/packages/common packages/common

WORKDIR /usr/src/app/apps/backend

RUN chown -R bun:bun .

USER bun
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
