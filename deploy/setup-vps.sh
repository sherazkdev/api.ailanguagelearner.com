#!/usr/bin/env bash
set -euo pipefail

# Run on VPS from project root:
#   chmod +x deploy/setup-vps.sh
#   sudo bash deploy/setup-vps.sh
#
# Requires: Node 20+, npm, nginx, pm2, MongoDB running locally

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SITE_NAME="ailanguage.recipehubapi.com"
NGINX_AVAIL="/etc/nginx/sites-available/${SITE_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${SITE_NAME}"
API_DIR="${APP_DIR}/api"
ENV_FILE="${API_DIR}/.env"
ENV_EXAMPLE="${APP_DIR}/deploy/env.production.example"

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo bash deploy/setup-vps.sh"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js 20+ first."
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found. Install: npm install -g pm2"
  exit 1
fi

if [[ ! -d /etc/nginx/sites-available ]]; then
  echo "nginx not found. Install: apt install nginx"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${ENV_EXAMPLE}" "${ENV_FILE}"
  echo "Created ${ENV_FILE} from production example — edit GROQ_API_KEY and X_API_KEY before going live."
fi

echo "==> Installing API dependencies and building..."
cd "${API_DIR}"
sudo -u "${SUDO_USER:-root}" npm install
sudo -u "${SUDO_USER:-root}" npm run build

echo "==> Seeding conversation types (safe to re-run)..."
sudo -u "${SUDO_USER:-root}" npm run seed || true

echo "==> Starting PM2 on port 3019..."
export LINGUA_APP_DIR="${APP_DIR}"
sudo -u "${SUDO_USER:-root}" env LINGUA_APP_DIR="${APP_DIR}" pm2 delete lingua-ai-api 2>/dev/null || true
sudo -u "${SUDO_USER:-root}" env LINGUA_APP_DIR="${APP_DIR}" pm2 start "${APP_DIR}/deploy/ecosystem.config.cjs"
sudo -u "${SUDO_USER:-root}" pm2 save

echo "==> Configuring nginx for ${SITE_NAME}..."
cp "${APP_DIR}/deploy/nginx/${SITE_NAME}.conf" "${NGINX_AVAIL}"
ln -sfn "${NGINX_AVAIL}" "${NGINX_ENABLED}"

nginx -t
systemctl reload nginx

echo
echo "Done."
echo "  App:      http://127.0.0.1:3019/health"
echo "  Public:   http://${SITE_NAME}/health"
echo "  Swagger:  http://${SITE_NAME}/docs"
echo "  PM2:      pm2 status"
echo "  Logs:     pm2 logs lingua-ai-api"
echo "  TLS:      certbot --nginx -d ${SITE_NAME}"
