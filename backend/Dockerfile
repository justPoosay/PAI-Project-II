FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY backend/package.json backend/bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY backend/package.json backend/bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules backend/node_modules
COPY backend backend/
COPY shared shared/

ENV NODE_ENV=production
WORKDIR /usr/src/app/backend

FROM base AS release
COPY --from=install /temp/prod/node_modules backend/node_modules
COPY --from=prerelease /usr/src/app/backend/src backend/src
COPY --from=prerelease /usr/src/app/backend/package.json backend/
COPY --from=prerelease /usr/src/app/shared shared/

WORKDIR /usr/src/app/backend

RUN chown -R bun:bun /usr/src/app/backend

USER bun
EXPOSE 3000/tcp
CMD ["bun", "run", "src/index.ts"]