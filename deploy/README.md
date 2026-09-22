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
cd /var/www/ai-language-api/api
git pull
npm install
npm run build
pm2 restart lingua-ai-api
```
