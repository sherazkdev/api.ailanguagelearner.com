# Lingua AI

Fastify + MongoDB API and Vite React admin for language-learning chats.

## Prompt rule

**Do not send the prompt on every message.**

1. `POST /v1/chats` builds and stores `systemInstruction` once.
2. `POST /v1/chats/:id/messages` body is `{ deviceId and/or userId, userMessage }`.
3. Server loads prompt + history from Mongo → Groq → `{ text }` or `{ text: null }`.

No sockets. Auth: `x-api-key` header.

## Production (VPS)

Domain: `ailanguage.recipehubapi.com` · API port: `3017` · Nginx + PM2

```bash
chmod +x deploy/setup-vps.sh
sudo bash deploy/setup-vps.sh
```

See `deploy/README.md` for full steps (DNS, `.env`, certbot).

## Run

```bash
# MongoDB local must be running
# mongodb://127.0.0.1:27017/lingua_ai

cd api
cp .env.example .env   # set GROQ_API_KEY
npm install
npm run seed
npm run dev            # http://127.0.0.1:3017  docs: /docs

cd ../admin
npm install
npm run dev            # http://127.0.0.1:5173
```

## APIs

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/v1/users/subscribe` | Save user by deviceId and/or userId |
| GET | `/v1/users/:deviceId` | Get user by deviceId |
| GET | `/v1/users/by-user-id/:userId` | Get user by userId |
| GET | `/v1/users` | List users (admin) |
| GET | `/v1/conversation-types` | Types screen (+ `?filter=`) |
| POST | `/v1/conversation-types` | Create type (admin) |
| GET | `/v1/chats?deviceId=` or `?userId=` | User chats |
| POST | `/v1/chats` | Create chat (stores prompt) |
| GET | `/v1/chats/:id?deviceId=` or `?userId=` | One chat |
| GET | `/v1/chats/:id/messages?deviceId=` or `?userId=` | History |
| POST | `/v1/chats/:id/messages` | Send message → AI |
| DELETE | `/v1/chats/:id?deviceId=` or `?userId=` | Delete chat |

## Modules (`api/src/modules`)

`users` · `conversation-types` · `chats` — each has model + service + routes.
