# Lingua AI — Full Guide: Conversation Types, Chats, APIs, Params & Verification

**Audience:** you (product / Flutter) + QA  
**Source of truth for contracts:** `docs/API_REQUIREMENTS.md`  
**Base URL:** `http://127.0.0.1:3000`  
**Auth header (almost all APIs):** `x-api-key: <X_API_KEY from api/.env>`

---

## 1. Pehle confusion clear karo (sab se important)

Do **alag** cheezein hain. Inko mix mat karo.

| Concept | Kya hai? | Example | User ki personal data? |
| --- | --- | --- | --- |
| **Conversation type** | App screen *“Choose Conversation Type”* ki **category catalog** | Daily Life, Work & Career, Travel… | **Nahi** — sab users same list dekhen |
| **Chat (conversation session)** | User ne type choose karke jo **session start** kiya | device `abc` ka “Daily Life” chat | **Haan** — `deviceId` se judi |
| **Message** | Us chat ke andar user / AI lines | “Hola” / “¡Hola!” | **Haan** |

### Galat samajh

- “Conversation type” = user ki chat history ❌  
- `GET /v1/conversation-types` se purani chats nahi milti ❌  
- Alag “topics” API zaroori hai ❌ (yeh feature remove ho gaya — original Dart requirements mein bhi nahi tha)

### Sahi samajh

1. User **type** choose karta hai → `GET /v1/conversation-types`  
2. Phir **chat create** → `POST /v1/chats` (yahan prompt Mongo pe save)  
3. Baad mein **chats list** → `GET /v1/chats?deviceId=`  
4. History → `GET /v1/chats/:chatId/messages?deviceId=`  

```text
[Conversation Type]  e.g. Daily Life (title + description)
        │
        ▼
 [User Chat session] one Mongo "chats" row (has deviceId + stored prompt)
        │
        ▼
   [Messages]        user / model turns
```

**Filters** on the type screen (`All` / `Daily Life` / `Work` / `Travel`) = query `filter` on types API — yeh **chat filter nahi**, catalog filter hai.

---

## 2. Conversation types (catalog) — fields

| Field | Meaning |
| --- | --- |
| `_id` | Mongo id (chat create pe `typeId` ke tor pe use) |
| `slug` | URL-friendly id, e.g. `daily-life`, `work-career` |
| `title` | UI title, e.g. `Daily Life` — role-play prompt ka `topicTitle` |
| `description` | Short subtitle — role-play prompt ka `topicDescription` |
| `iconKey` | App icon key (`coffee`, `briefcase`, …) |
| `filterGroup` | `daily_life` \| `work` \| `travel` \| `other` (tabs) |
| `sortOrder` | List order |
| `isActive` | Soft flag |

### Seeded titles (app screen)

| Title | Slug |
| --- | --- |
| Daily Life | `daily-life` |
| Work & Career | `work-career` |
| Travel & Vacation | `travel-vacation` |
| Friends & Family | `friends-family` |
| Shopping | `shopping` |
| Health & Lifestyle | `health-lifestyle` |
| Education | `education` |
| Entertainment | `entertainment` |
| AI Conversation | `ai-conversation` (free chat; use `mode: free_chat`) |

---

## 3. End-to-end user journey (Flutter)

### A) Role-play

| Step | API | Params |
| --- | --- | --- |
| 1 Subscribe | `POST /v1/users/subscribe` | Body: `deviceId` (required) |
| 2 Types list | `GET /v1/conversation-types` | Query optional: `filter=all\|daily_life\|work\|travel` |
| 3 Start chat | `POST /v1/chats` | Body: `deviceId`, `mode=role_play`, `learningLanguageName`, `typeId`, optional `difficultyKey` |
| 4 Send message | `POST /v1/chats/{chatId}/messages` | Body: **only** `deviceId`, `userMessage` |
| 5 Later: my chats | `GET /v1/chats?deviceId=` | Query: `deviceId` |
| 6 Later: history | `GET /v1/chats/{chatId}/messages?deviceId=` | Path `chatId` + query `deviceId` |

`difficultyKey`: `dl_beginner` (default) \| `dl_intermediate` \| `dl_advanced`

### B) Free chat (AI Conversation)

```json
{
  "deviceId": "abc-123",
  "mode": "free_chat",
  "learningLanguageName": "Spanish"
}
```

No `typeId`. Server type = `ai-conversation`.

---

## 4. Har API — method, params, response, function

Har protected call pe header:

```http
x-api-key: <X_API_KEY>
```

### 4.1 Health

`GET /health` — no key  
Response: `{ "ok": true, "service": "lingua-ai-api", "mongo": true }`

### 4.2 Users

| API | Function |
| --- | --- |
| `POST /v1/users/subscribe` | Upsert user by `deviceId` |
| `GET /v1/users/:deviceId` | Get one user |
| `GET /v1/users` | Admin list (limit 100) |

### 4.3 Conversation types

#### `GET /v1/conversation-types`

| | |
| --- | --- |
| **Query** | optional `filter=all\|daily_life\|work\|travel` |
| **Response** | `{ "types": [ { _id, slug, title, description, iconKey, filterGroup, ... } ] }` |
| **Function** | App “Choose Conversation Type” screen |

#### `GET /v1/conversation-types/:slugOrId`

Response: `{ "type": { ... } }`

#### `POST /v1/conversation-types` (admin)

Body: `slug`, `title`, `description`, `iconKey`, `filterGroup`, optional `sortOrder`  
Response: `201` `{ "type": { ... } }`

### 4.4 Chats

#### `GET /v1/chats?deviceId=`

Response: `{ "chats": [ ... ] }` — no `systemInstruction` in list

#### `POST /v1/chats`

| | |
| --- | --- |
| **Body** | `deviceId`, `mode` (`role_play`\|`free_chat`), `learningLanguageName` required · `typeId` required **only for role_play** · optional `difficultyKey` for role_play |
| **Response** | `201` `{ "chat": { id, deviceId, mode, title, typeId, learningLanguageName, createdAt, updatedAt } }` |
| **Function** | Prompt build + Mongo save (client ko prompt wapas nahi milta) |

#### `GET /v1/chats/:chatId?deviceId=`

Response: `{ "chat": { ... without systemInstruction } }`

#### `GET /v1/chats/:chatId/messages?deviceId=`

Response: `{ "chatId", "title", "mode", "messages": [ { role, text, createdAt } ] }`

#### `POST /v1/chats/:chatId/messages`

Body: **only** `deviceId`, `userMessage`  
Response: `{ "text": "..." }` or `{ "text": null }` on Groq failure

#### `DELETE /v1/chats/:chatId?deviceId=`

Response: `{ "deleted": true }`

---

## 5. Known limits / notes

| Item | Note |
| --- | --- |
| No separate topics API | Role-play scenario = conversation type `title` + `description` |
| No type DELETE/UPDATE public APIs | Sirf create + list/get (admin create) |
| Prompt on server only | Client har message pe `systemInstruction` / `history` nahi bhejta |

---

## 6. QA checklist

- [ ] `GET /v1/conversation-types` → 9 types  
- [ ] `POST /v1/chats` role_play with `typeId` → `chat.id`  
- [ ] `POST /v1/chats/:id/messages` → Spanish/English reply  
- [ ] Free chat create without `typeId` works  
- [ ] `GET /v1/chats?deviceId=` lists user chats  
- [ ] Admin http://localhost:5173 — click type → start chat directly  

---

## 7. Quick reference

| Need | API |
| --- | --- |
| Types for app screen | `GET /v1/conversation-types` |
| Start role-play | `POST /v1/chats` with `typeId` |
| Start free chat | `POST /v1/chats` with `mode: free_chat` |
| Send message | `POST /v1/chats/:chatId/messages` |
| User's chats | `GET /v1/chats?deviceId=` |
