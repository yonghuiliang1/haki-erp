#!/bin/sh
# =============================================================================
# 应用容器入口：先对齐数据库结构，再启动 Next.js 独立服务。
# =============================================================================
set -e

echo "[entrypoint] 应用数据库迁移..."
prisma migrate deploy --schema=./prisma/schema.prisma

echo "[entrypoint] 启动服务，监听端口 ${PORT:-3000}"
exec node server.js