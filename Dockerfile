# =============================================================================
# HAKI ERP — 生产镜像构建（多阶段，Next.js standalone 输出）
#
#   构建：docker build -t haki-erp .
#   运行：由 docker-compose.yml 编排（app + postgres + nginx）
# =============================================================================

# ---- 依赖层：仅装依赖，利用 Docker 层缓存 ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- 构建层：生成 Prisma Client 并编译 Next.js ----
FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true
# 构建期占位值：镜像内不含 .env，这里仅用于编译期校验与客户端内联，
# 真实连接串与密钥在容器运行时通过环境变量注入。
ENV DATABASE_URL="postgresql://placeholder:placeholder@db:5432/haki_erp?schema=public"
ENV JWT_SECRET="build-time-placeholder-not-used-at-runtime"
ENV NEXT_PUBLIC_API_URL="https://localhost"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- 运行层：只带产物与最小运行时依赖 ----
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Prisma 查询引擎依赖 openssl；镜像内保留一个 prisma CLI 供启动时执行迁移
RUN apk add --no-cache openssl \
 && npm install -g prisma@6.19.3

RUN addgroup -S nodejs -g 1001 \
 && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/deploy/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["sh", "./entrypoint.sh"]