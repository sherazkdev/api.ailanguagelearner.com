# Lingua AI — Full API Requirements (LOCKED)

**Status:** APPROVED CONTRACT — do not change paths, request/response shapes, or behaviour unless the product owner explicitly revises this document.  
**Date:** 18 September 2026  
**Stack (locked):** Fastify 5 + TypeScript + Mongoose (local MongoDB) + Swagger (`/docs`) + Vite React admin + `x-api-key` from env.  
**No sockets.** REST only.  
**LLM provider:** Groq (`GROQ_API_KEY` + `GROQ_MODEL`, default `groq/compound-mini`). Approved shift from Gemini.

---

## Master prompt (copy-paste for Cursor / implementer)

```text
You are implementing / maintaining Lingua AI API exactly as defined in docs/API_REQUIREMENTS.md.

HARD RULES:
1. Do NOT invent new endpoints, rename paths, or change request/response JSON fields.
2. Do NOT add sockets, streaming, NestJS, or Firebase chat storage as the source of truth (MongoDB is source of truth for users/chats/messages/types).
3. Do NOT require systemInstruction or history on every message request.
4. Prompt is built once at POST /v1/chats and stored on the chat document.
5. POST /v1/chats/:chatId/messages accepts only deviceId + userMessage; server loads prompt + history from Mongo; calls Groq; returns { text } or { text: null }.
6. Auth: every route except /health and /docs* requires header x-api-key matching env X_API_KEY.
7. Groq settings: temperature 0.7, max_tokens 512, 30s timeout, history first then current user, Mongo roles user/model (Groq assistant), null on failure (do not save failed turns).
8. Feature-based modules: users, conversation-types, chats (model + service + routes).
9. Swagger must list all operations (routes wrapped with fastify-plugin so OpenAPI sees them).
10. If something is unclear, follow this requirements file — do not “improve” the API contract.
```

---

## 1. Goals

| Goal | Requirement |
| --- | --- |
| Subscription identity | App sends `deviceId` after Google subscription → user upsert in Mongo |
| Conversation types | Catalog matching app “Choose Conversation Type” (Daily Life, Work, Travel, …) |
| Persist chats | History on server so uninstall does not wipe server copy |
| AI reply | Role-play + free chat via Groq; prompt not resent every turn |
| Admin | Vite React app to browse types and test chat; Swagger for API docs |

---

## 2. Non-goals (do not add)

- Socket.IO / realtime friend rooms  
- Sending full `history` or `systemInstruction` from the mobile client on every message  
- Summarising / truncating history (unless a new approved requirement)  
- Dashboard analytics product  
- Changing Gemini prompts away from Dart `RolePlayGeminiPrompt` / `FreeChatGeminiPrompt` text  

---

## 3. Environment (locked names)

| Variable | Purpose |
| --- | --- |
| `PORT` | Default `3019` (local dev; nginx proxies public domain to this port) |
| `HOST` | Default `0.0.0.0` |
| `MONGODB_URI` | Default `mongodb://127.0.0.1:27017/lingua_ai` |
| `X_API_KEY` | Required on API calls |
| `GROQ_API_KEY` | Groq key (empty → message returns `{ text: null }`) |
| `GROQ_MODEL` | Default `groq/compound-mini` (fast); optional `qwen/qwen3.8-27b` |
| `CORS_ORIGIN` | Admin origin(s), comma-separated |
| `RATE_LIMIT_MAX` | Default `300` |
| `RATE_LIMIT_TIME_WINDOW_MS` | Default `60000` |

---

## 4. Auth (locked)

- Header: `x-api-key: <X_API_KEY>`  
- Public (no key): `GET /health`, everything under `/docs`  
- Missing/wrong key → `401` `{ "error": "Unauthorized", "message": "Valid x-api-key header is required" }`  

---

## 5. API list (LOCKED — no path changes)

### 5.1 Health

`GET /health`  
Response:

```json
{ "ok": true, "service": "lingua-ai-api", "mongo": true }
```

### 5.2 Users

#### `POST /v1/users/subscribe`

Body:

```json
{
  "deviceId": "string (required, min 3)",
  "subscriptionActive": true,
  "subscriptionProvider": "google"
}
```

Response `200`: `{ "user": { ...userDoc } }`  
Behaviour: upsert by `deviceId`.

#### `GET /v1/users/:deviceId`

Response `200`: `{ "user": { ... } }`  
`404`: `{ "error": "User not found" }`

#### `GET /v1/users`

Admin list (limit 100).  
Response: `{ "users": [ ... ] }`

### 5.3 Conversation types

#### `GET /v1/conversation-types`

Query (optional): `filter=all|daily_life|work|travel`  
Response: `{ "types": [ { _id, slug, title, description, iconKey, filterGroup, sortOrder, isActive, ... } ] }`

Seeded types (titles locked to app screen):

- Daily Life  
- Work & Career  
- Travel & Vacation  
- Friends & Family  
- Shopping  
- Health & Lifestyle  
- Education  
- Entertainment  
- AI Conversation (free chat type; use `mode: free_chat`)

#### `GET /v1/conversation-types/:slugOrId`

Response: `{ "type": { ... } }`

#### `POST /v1/conversation-types` (admin create)

Body: `slug`, `title`, `description`, `iconKey`, `filterGroup`, optional `sortOrder`  
Response `201`: `{ "type": { ... } }`

### 5.4 Chats

#### `GET /v1/chats?deviceId=`

Response: `{ "chats": [ ... ] }`  
Note: `systemInstruction` must NOT be returned in list.

#### `POST /v1/chats`

Body:

```json
{
  "deviceId": "string",
  "mode": "role_play" | "free_chat",
  "learningLanguageName": "Spanish",
  "typeId": "required for role_play",
  "difficultyKey": "optional for role_play (dl_beginner | dl_intermediate | dl_advanced, default dl_beginner)"
}
```

Behaviour:

- Upsert/touch user by `deviceId`  
- **Build and store `systemInstruction` once** on the chat document  
  - `role_play`: from conversation type `title` + `description` + difficulty guides (Dart `RolePlayGeminiPrompt`)  
  - `free_chat`: Dart `FreeChatGeminiPrompt`; type = `ai-conversation`  
- Response `201`: `{ "chat": { id, deviceId, mode, title, typeId, learningLanguageName, createdAt, updatedAt } }`  
- Do NOT return `systemInstruction` to the client in this response

#### `GET /v1/chats/:chatId?deviceId=`

Response: `{ "chat": { ... without systemInstruction } }`

#### `GET /v1/chats/:chatId/messages?deviceId=`

Response:

```json
{
  "chatId": "...",
  "title": "...",
  "mode": "role_play",
  "messages": [ { "_id", "role": "user"|"model", "text", "createdAt" } ]
}
```

#### `POST /v1/chats/:chatId/messages`  ← core AI call

Body (ONLY these fields — locked):

```json
{
  "deviceId": "string",
  "userMessage": "string"
}
```

Server must:

1. Load chat by `chatId` + `deviceId`  
2. Load ordered messages from Mongo as history  
3. Call Groq with stored `systemInstruction` + history + new user message  
4. On success: save user + model messages; return `{ "text": "..." }`  
5. On failure: return `{ "text": null }` and **do not** write messages  

#### `DELETE /v1/chats/:chatId?deviceId=`

Deletes chat + its messages.  
Response: `{ "deleted": true }`

---

## 6. Groq contract (locked app behaviour)

| Setting | Value |
| --- | --- |
| Endpoint | `POST https://api.groq.com/openai/v1/chat/completions` |
| Default model | `groq/compound-mini` |
| temperature | `0.7` |
| max_tokens | `512` |
| timeout | `30` seconds |
| messages order | system (stored prompt) → history → current user last |
| Mongo roles | `user` / `model` (mapped to Groq `user` / `assistant`) |
| success | first choice message content, trimmed |
| failure / empty key | `null` (do not save turn) |

**Prompt is NOT sent by the client on each message.** It lives on the chat in Mongo. Dart prompt *text* is unchanged; only the provider is Groq.

---

## 7. Data model (Mongo — locked collections)

| Collection | Key fields |
| --- | --- |
| `users` | `deviceId` (unique), `subscriptionActive`, `subscriptionProvider`, `lastSeenAt` |
| `conversationtypes` | `slug`, `title`, `description`, `iconKey`, `filterGroup`, `sortOrder`, `isActive` |
| `chats` | `deviceId`, `typeId`, `mode`, `learningLanguageName`, **`systemInstruction`**, `title`, `lastMessageAt` |
| `messages` | `chatId`, `role` (`user`\|`model`), `text`, `createdAt` |

---

## 8. Admin (Vite React) — required behaviour

- Read `VITE_API_BASE`, `VITE_API_KEY`  
- Pages/sections: conversation types, chat playground (subscribe → create chat → send message → history), users list, link to Swagger  
- Must call the locked APIs above only — no alternate contracts  

---

## 9. Swagger

- UI: `/docs`  
- Spec: `/docs/json`  
- Must list all operations (Health, Users, ConversationTypes, Chats)  
- Security scheme: `ApiKeyAuth` header `x-api-key`  

---

## 10. Capacity

- Target ~200–300 HTTP requests in the rate-limit window (default 300/min)  
- Mongo pool sized for concurrent I/O  
- Groq remains the latency/cost bottleneck — do not fake higher throughput by changing the API  

---

## 11. Change control

Any change to:

- path names  
- required body fields  
- response field names  
- prompt-on-every-message behaviour  

…requires an explicit update to **this file** first. Implementers must not silently alter the contract.

---

## 12. Quick client flow (Flutter)

1. `POST /v1/users/subscribe` `{ deviceId }`  
2. `GET /v1/conversation-types` → pick type  
3. `POST /v1/chats` `{ deviceId, mode, learningLanguageName, typeId, difficultyKey? }` → save `chat.id`  
4. Loop: `POST /v1/chats/:id/messages` `{ deviceId, userMessage }` → show `text`  
5. Later: `GET /v1/chats?deviceId=` and `GET /v1/chats/:id/messages?deviceId=`  

**Never** send `systemInstruction` or full `history` in step 5.
