FROM oven/bun:latest AS build
WORKDIR /usr/src/app

COPY package.json bun.lockb ./
COPY shared shared/
RUN bun install --frozen-lockfile

COPY . .
RUN bunx vite build

FROM nginx:alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]