FROM node:alpine AS builder
RUN apk update && apk add git
# Set working directory
WORKDIR /app
RUN npm i -g turbo@canary pnpm
COPY . .

# Add lockfile and package.json's of isolated subworkspace
FROM node:alpine AS installer
RUN apk update
WORKDIR /app
RUN npm i -g turbo@canary pnpm
# COPY --from=builder /app/out/json/ .
# COPY --from=builder /app/out/yarn.lock ./yarn.lock
# COPY --from=builder /app/out/full/ .
COPY . .
# COPY turbo.json turbo.json

RUN pnpm install
RUN pnpx turbo run build --filter=server...

FROM node:alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 shackcart
RUN adduser --system --uid 1001 shackcart
USER shackcart
COPY --from=installer /app .

CMD node apps/api/dist/index.js
