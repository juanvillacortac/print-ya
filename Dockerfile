FROM node:alpine AS builder
RUN apk update && apk add git
# Set working directory
WORKDIR /app
RUN npm i -g turbo@canary pnpm
COPY . .

# Add lockfile and package.json's of isolated subworkspace
FROM node:alpine AS installer
RUN apk update && apk add git
WORKDIR /app
RUN npm i -g turbo@canary pnpm
# COPY --from=builder /app/out/json/ .
# COPY --from=builder /app/out/yarn.lock ./yarn.lock
# COPY --from=builder /app/out/full/ .
COPY . .
# COPY turbo.json turbo.json

ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG DATABASE_URL
ARG PUBLIC_GEOAPIFY_TOKEN
ARG PUBLIC_UPSTASH_REDIS_URL
ARG PUBLIC_UPSTASH_REDIS_TOKEN
ARG SENDGRID_API_KEY

ENV PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL}
ENV PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_ANON_KEY}
ENV DATABASE_URL=${DATABASE_URL}
ENV PUBLIC_GEOAPIFY_TOKEN=${PUBLIC_GEOAPIFY_TOKEN}
ENV PUBLIC_UPSTASH_REDIS_URL=${PUBLIC_UPSTASH_REDIS_URL}
ENV PUBLIC_UPSTASH_REDIS_TOKEN=${PUBLIC_UPSTASH_REDIS_TOKEN}
ENV SENDGRID_API_KEY=${SENDGRID_API_KEY}}

RUN pnpm install
RUN pnpx turbo run build --filter=api...

FROM node:alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 shackcart
RUN adduser --system --uid 1001 shackcart
USER shackcart
COPY --from=installer /app .

CMD node apps/api/dist/index.js
