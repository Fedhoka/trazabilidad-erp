#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# init-letsencrypt.sh
#
# Run this ONCE on the production server to obtain the first Let's Encrypt
# certificate.  After the first run, the certbot container handles renewals
# automatically every 12 hours.
#
# Prerequisites:
#   1. DNS A record for DOMAIN already points to this server's IP
#   2. docker + docker compose are installed
#   3. Ports 80 and 443 are open in the firewall
#
# Usage:
#   export DOMAIN=erp.yourdomain.com
#   export SSL_EMAIL=admin@yourdomain.com
#   bash scripts/init-letsencrypt.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN to your domain name, e.g. erp.yourdomain.com}"
EMAIL="${SSL_EMAIL:?Set SSL_EMAIL to your admin email for Let's Encrypt notifications}"
STAGING="${STAGING:-0}"   # set STAGING=1 to test without hitting rate limits

# Paths (must match docker-compose volume mounts)
DATA_PATH="./nginx/ssl"

echo "==> Checking for existing certificate data..."
if [ -d "$DATA_PATH/live/$DOMAIN" ]; then
  echo "    Certificate already exists. Delete $DATA_PATH/live/$DOMAIN to force renewal."
  exit 0
fi

# ── Step 1: create dummy certificate so Nginx can start ──────────────────────
echo "==> Creating temporary self-signed certificate for $DOMAIN..."
mkdir -p "$DATA_PATH/live/$DOMAIN"
docker run --rm \
  -v "$(pwd)/$DATA_PATH:/etc/letsencrypt" \
  --entrypoint openssl \
  certbot/certbot \
  req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
  -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
  -subj "/CN=localhost"

# ── Step 2: start Nginx (serves ACME challenge path on port 80) ───────────────
echo "==> Starting Nginx..."
docker compose up -d nginx

# ── Step 3: delete the dummy cert and request the real one ───────────────────
echo "==> Deleting dummy certificate..."
rm -rf "$DATA_PATH/live/$DOMAIN"
mkdir -p "$DATA_PATH/live/$DOMAIN"

echo "==> Requesting Let's Encrypt certificate for $DOMAIN..."

STAGING_FLAG=""
if [ "$STAGING" = "1" ]; then
  STAGING_FLAG="--staging"
  echo "    (STAGING MODE — certificate will not be trusted by browsers)"
fi

docker run --rm \
  -v "$(pwd)/$DATA_PATH:/etc/letsencrypt" \
  -v "$(pwd)/nginx/ssl/www:/var/www/certbot" \
  --network "$(basename $(pwd))_default" \
  certbot/certbot certonly \
    $STAGING_FLAG \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# ── Step 4: reload Nginx with the real cert ───────────────────────────────────
echo "==> Reloading Nginx..."
docker compose exec nginx nginx -s reload

echo ""
echo "✅ SSL certificate obtained for $DOMAIN"
echo "   Renewal is handled automatically by the certbot container."
