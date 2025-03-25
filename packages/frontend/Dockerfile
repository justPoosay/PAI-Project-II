FROM oven/bun:1.2.2 AS build
WORKDIR /usr/src/app

COPY package.json bun.lock ./

COPY packages/frontend packages/frontend
COPY packages/common packages/common

COPY patches patches

WORKDIR /usr/src/app/packages/frontend

RUN bun install --frozen-lockfile

RUN bunx vite build

FROM nginx:alpine
COPY --from=build /usr/src/app/packages/frontend/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
