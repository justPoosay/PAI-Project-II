FROM oven/bun:1.2.2 AS base
WORKDIR /usr/src/app

FROM base AS install
WORKDIR /temp/dev

COPY package.json bun.lock ./
COPY packages/backend packages/backend
COPY packages/common packages/common

RUN bun install --frozen-lockfile

FROM base AS install-prod
WORKDIR /temp/prod

COPY package.json bun.lock ./
COPY packages/backend packages/backend
COPY packages/common packages/common

RUN bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/packages/backend packages/backend

COPY packages/backend packages/backend
COPY packages/common packages/common

WORKDIR /usr/src/app/packages/backend
ENV NODE_ENV=production

FROM base AS release
COPY --from=install-prod /temp/prod/packages/backend/node_modules packages/backend/node_modules
COPY --from=prerelease /usr/src/app/packages/backend packages/backend
COPY --from=prerelease /usr/src/app/common packages/common

WORKDIR /usr/src/app/packages/backend

RUN chown -R bun:bun .

USER bun
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
