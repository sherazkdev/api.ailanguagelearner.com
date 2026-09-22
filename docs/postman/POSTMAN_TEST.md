# Postman Test Guide (real data)

**Base URL:** `http://127.0.0.1:3000`  
**Auth:** sirf header `x-api-key: dev-lingua-api-key-change-me`  
**Exception:** `GET /health` — no key

Import collection: `docs/postman/Lingua-AI.postman_collection.json`

---

## Real IDs (after `npm run reset-db`)

| Variable | Value |
| --- | --- |
| deviceId | `postman-test-001` |
| typeId (Daily Life) | `6aad1330c4c80e9225aadb3a` |
| type slug | `daily-life` |
| chatId (sample) | `6aad133b2fca43fb69232572` |

### All type IDs

| Title | slug | _id |
| --- | --- | --- |
| Daily Life | daily-life | 6aad1330c4c80e9225aadb3a |
| Work & Career | work-career | 6aad1330c4c80e9225aadb3b |
| Travel & Vacation | travel-vacation | 6aad1330c4c80e9225aadb3c |
| Friends & Family | friends-family | 6aad1330c4c80e9225aadb3d |
| Shopping | shopping | 6aad1330c4c80e9225aadb3e |
| Health & Lifestyle | health-lifestyle | 6aad1330c4c80e9225aadb3f |
| Education | education | 6aad1330c4c80e9225aadb40 |
| Entertainment | entertainment | 6aad1330c4c80e9225aadb41 |
| AI Conversation | ai-conversation | 6aad1330c4c80e9225aadb42 |

> Agar dubara `npm run reset-db` chalao to `_id` values change ho jayengi — pehle `GET /v1/conversation-types` se nayi IDs lo.

---

## Quick copy URLs

### 1. Health
```
GET http://127.0.0.1:3000/health
```

### 2. Subscribe
```
POST http://127.0.0.1:3000/v1/users/subscribe
Header: x-api-key: dev-lingua-api-key-change-me
Body:
{
  "deviceId": "postman-test-001",
  "subscriptionActive": true,
  "subscriptionProvider": "google"
}
```

### 3. List types
```
GET http://127.0.0.1:3000/v1/conversation-types
Header: x-api-key: dev-lingua-api-key-change-me
```

### 4. Create role-play chat
```
POST http://127.0.0.1:3000/v1/chats
Header: x-api-key: dev-lingua-api-key-change-me
Body:
{
  "deviceId": "postman-test-001",
  "mode": "role_play",
  "learningLanguageName": "Spanish",
  "typeId": "6aad1330c4c80e9225aadb3a",
  "difficultyKey": "dl_beginner"
}
```
Response se `chat.id` copy karo → `chatId` variable.

### 5. Send message
```
POST http://127.0.0.1:3000/v1/chats/6aad133b2fca43fb69232572/messages
Header: x-api-key: dev-lingua-api-key-change-me
Body:
{
  "deviceId": "postman-test-001",
  "userMessage": "Hola, quiero practicar"
}
```

### 6. Get history
```
GET http://127.0.0.1:3000/v1/chats/6aad133b2fca43fb69232572/messages?deviceId=postman-test-001
Header: x-api-key: dev-lingua-api-key-change-me
```

### 7. Free chat
```
POST http://127.0.0.1:3000/v1/chats
Header: x-api-key: dev-lingua-api-key-change-me
Body:
{
  "deviceId": "postman-test-001",
  "mode": "free_chat",
  "learningLanguageName": "Spanish"
}
```

---

## DB reset command
```bash
cd api
npm run reset-db
```
