#!/bin/sh
# =============================================================================
# Nginx 入口：首次启动时生成自签证书，之后直接复用。
# 生产环境请替换为受信任 CA 签发的证书（覆盖 certs/haki.crt 与 haki.key）。
# =============================================================================
set -e

CERT_DIR=/etc/nginx/certs

if [ ! -f "$CERT_DIR/haki.crt" ]; then
  echo "[nginx] 未检测到证书，生成自签证书..."
  apk add --no-cache openssl >/dev/null 2>&1 || true
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout "$CERT_DIR/haki.key" \
    -out "$CERT_DIR/haki.crt" \
    -subj "/C=CN/ST=Zhejiang/L=Ningbo/O=HAKI ERP/CN=localhost"
  echo "[nginx] 自签证书已生成于 $CERT_DIR"
fi

exec nginx -g "daemon off;"