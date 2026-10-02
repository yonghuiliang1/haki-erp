# =============================================================================
# HAKI ERP — 生产镜像构建（多阶段，Next.js standalone 输出）
#
#   构建：docker build -t haki-erp .
#   运行：由 docker-compose.yml 编排（app + postgres + nginx）
# =============================================================================

# ---- 依赖层：仅装依赖，利用 Docker 层缓存 ----
FROM node:24-alpine AS deps
WORKDIR /app
# 国内镜像加速：npm 包与 Prisma 引擎二进制
ENV npm_config_registry=https://registry.npmmirror.com
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
COPY package.json package-lock.json ./
# postinstall 需要 Prisma Schema（npx prisma generate），故一并拷贝
COPY prisma ./prisma
RUN npm ci

# ---- 构建层：生成 Prisma Client 并编译 Next.js ----
FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true
ENV npm_config_registry=https://registry.npmmirror.com
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
# 小内存机器上用交换分区硬扛编译会拖垮整机，限制编译堆内存换取稳定
ENV NODE_OPTIONS=--max-old-space-size=1536
# 构建期占位值：镜像内不含 .env，这里仅用于编译期校验与客户端内联，
# 真实连接串与密钥在容器运行时通过环境变量注入。
ENV DATABASE_URL="postgresql://placeholder:placeholder@db:5432/haki_erp?schema=public"
ENV JWT_SECRET="build-time-placeholder-not-used-at-runtime"
ENV NEXT_PUBLIC_API_URL="https://localhost"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- 演示数据任务层：只需依赖 + 源码 + Prisma Client，不编译 Next.js ----
FROM node:24-alpine AS seed
WORKDIR /app
ENV npm_config_registry=https://registry.npmmirror.com
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

# ---- 运行层：只带产物与最小运行时依赖 ----
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Prisma 查询引擎依赖 openssl；镜像内保留一个 prisma CLI 供启动时执行迁移
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.cloud.tencent.com/g' /etc/apk/repositories \
 && apk add --no-cache openssl \
 && npm install -g prisma@6.19.3 --registry=https://registry.npmmirror.com

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