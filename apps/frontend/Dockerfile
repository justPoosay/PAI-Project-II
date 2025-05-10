FROM oven/bun:latest AS build
WORKDIR /usr/src/app

ARG VITE_MESSAGES_PER_MONTH_FREE
ARG VITE_MESSAGES_PER_MONTH_PAID

ENV VITE_MESSAGES_PER_MONTH_FREE=${VITE_MESSAGES_PER_MONTH_FREE}
ENV VITE_MESSAGES_PER_MONTH_PAID=${VITE_MESSAGES_PER_MONTH_PAID}

COPY package.json bun.lock ./

COPY apps/frontend apps/frontend
COPY packages/common packages/common

COPY patches patches

WORKDIR /usr/src/app/apps/frontend

RUN bun install

RUN bunx vite build

FROM nginx:alpine
COPY --from=build /usr/src/app/apps/frontend/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
