# Build from the repo root:  docker build -f apps/web/Dockerfile -t chipy-web .
# In AWS (Milestone 2) the built assets go straight to S3 + CloudFront; this
# image exists so `docker compose` mirrors production locally.
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/engine/package.json packages/engine/
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM install AS build
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
COPY packages/engine packages/engine
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @chipy/web... run build

FROM nginx:1.27-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
