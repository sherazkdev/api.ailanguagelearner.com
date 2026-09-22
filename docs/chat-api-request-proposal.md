# Lingua AI — Chat API request proposal

**Date:** 17 September 2026  
**Status:** Discussion / proposal (not an approved change to the Dart contract until confirmed)  
**Source:** Submitted Dart requirements (`GeminiService`, `RolePlayGeminiPrompt`, `FreeChatGeminiPrompt`)

---

## Current requirement (what happens today)

On every user message, the client sends three things together:

1. `systemInstruction` — full prompt  
2. `history` — full past conversation  
3. `userMessage` — the new line only  

The backend (or Flutter today) forwards that to Gemini `generateContent`. The HTTP response is small: only the new assistant text, or `null` on failure.

As the chat grows (for example 10–15 messages), the same history is uploaded again on every send. The request body keeps getting larger. The load is on the **request**, not the response.

### Current request shape

```json
{
  "systemInstruction": "...full prompt...",
  "userMessage": "Una mesa para dos",
  "history": [
    { "text": "Bienvenido. ¿Cuántas personas?", "isUser": false },
    { "text": "Somos dos", "isUser": true }
  ]
}
```

### Current response shape

```json
{ "text": "Claro. ¿Fumador o no fumador?" }
```

On failure (timeout, empty key, non-200, no candidates):

```json
{ "text": null }
```

---

## Proposed approach

Keep the same Gemini behaviour. Reduce duplicate upload from the phone.

| Piece | Who owns it |
| --- | --- |
| Prompt (`systemInstruction`) | Backend (same role-play / free-chat text from Dart) |
| History | Backend fetches from Firebase (already saved by the app) |
| New user message | App sends on each request |
| User ID | App sends on each request |

### What the app should send

- New **user message**  
- **User ID**  

### What the backend will do

1. Fetch that user’s chat history from Firebase  
2. Apply the saved prompt  
3. Call Gemini `generateContent` the same way as `GeminiService.generateReply`  
4. Return the AI reply to the app  

### Proposed request shape

```json
{
  "userId": "firebaseAuthUid_abc",
  "userMessage": "Una mesa para dos"
}
```

### Proposed response shape (unchanged idea)

```json
{ "text": "Claro. ¿Fumador o no fumador?" }
```

or `{ "text": null }` on failure.

---

## What this does **not** change

From the submitted Dart files, these stay the same:

- Role-play and free-chat modes (different prompts, same generate flow)  
- History order: previous turns first, current user message last  
- Roles: user / model  
- `temperature`: 0.7  
- `maxOutputTokens`: 512  
- Timeout: 30 seconds  
- Four safety categories at `BLOCK_MEDIUM_AND_ABOVE`  
- First candidate, first text part, trimmed  
- Failure ? `null`  

Also out of scope for this note:

- Summarising or truncating history  
- Groq migration  
- Streaming  
- Dashboard  
- New product APIs such as `/users` list or fetch-chats list (app already uses Firebase for that)

---

## Message for the Flutter / product side

Please check the current chat requirements. Right now every message sends the full prompt + full history + new text, so the request grows every turn.

Better option: keep the prompt on the backend; fetch history from Firebase; from the app send only the new user message and the user ID. Backend builds the Gemini call and returns the reply.

Same AI behaviour as the Dart requirements — no new product features added on top.

Please confirm so the Flutter request body can be aligned.
