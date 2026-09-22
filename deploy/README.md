# VPS deploy — ailanguage.recipehubapi.com

## Stack

| Layer | Port / path |
| --- | --- |
| Nginx (public) | `80` → `ailanguage.recipehubapi.com` |
| Node API (PM2) | `3017` on `127.0.0.1` |
| MongoDB | `27017` local |

## One-time VPS setup

```bash
# 1) Clone repo on VPS (after you add GitHub remote)
cd /var/www
git clone <your-repo-url> ai-language-api
cd ai-language-api

# 2) Production env
cp deploy/env.production.example api/.env
nano api/.env   # set X_API_KEY, GROQ_API_KEY

# 3) Nginx + PM2 (sudo)
chmod +x deploy/setup-vps.sh
sudo bash deploy/setup-vps.sh

# 4) Optional HTTPS
sudo certbot --nginx -d ailanguage.recipehubapi.com
```

## DNS

Point `ailanguage.recipehubapi.com` A record to your VPS IP.

## Useful commands

```bash
pm2 status
pm2 logs lingua-ai-api
pm2 restart lingua-ai-api
curl http://127.0.0.1:3017/health
curl -H "x-api-key: YOUR_KEY" http://127.0.0.1:3017/v1/conversation-types
sudo nginx -t && sudo systemctl reload nginx
```

## Update after code pull

```bash
cd /var/www/ai-language-api
git pull
cd api
npm install
npm run build
npm run seed
export LINGUA_APP_DIR=/var/www/ai-language-api
pm2 delete lingua-ai-api 2>/dev/null || true
pm2 start ../deploy/ecosystem.config.cjs
pm2 save
```

PM2 runs **2 cluster workers** by default (`PM2_INSTANCES=2`). Scale with `PM2_INSTANCES=4 pm2 start ...`.
