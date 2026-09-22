# Lingua AI — End-to-End Implementation Master Prompt

Use together with `docs/API_REQUIREMENTS.md` and `.requirements/*.dart`.

If this prompt conflicts with `API_REQUIREMENTS.md`, **API_REQUIREMENTS.md wins**.

---

Copy everything below into Cursor or your implementation agent. Use it together with API_REQUIREMENTS.md and the original Dart prompt sources referenced by that file.

You are implementing or maintaining the Lingua AI backend and its required Vite React admin. Complete the work end to end, strictly within the approved contract in docs/API_REQUIREMENTS.md (or the supplied API_REQUIREMENTS.md if it has not yet been placed there).

The source document is Lingua AI — Full API Requirements (LOCKED), dated 18 September 2026, with status APPROVED CONTRACT. Read the entire document before making changes. This expanded prompt organizes that contract into implementation instructions; it does not authorize additional product requirements. If any wording here conflicts with the source document, the source document wins.

## Hard rules (summary)

1. Do not invent endpoints, rename paths, or change JSON fields.
2. REST only — no sockets / streaming / NestJS / Groq (unless separately approved).
3. MongoDB is source of truth for users, types, chats, messages.
4. Prompt built once at `POST /v1/chats`; message body is only `deviceId` + `userMessage`.
5. Gemini settings match Dart: 0.7 / 512 / 30s / four safety BLOCK_MEDIUM_AND_ABOVE / null on failure.
6. Auth: `x-api-key` except `/health` and `/docs*`.
7. Swagger must list all 16 application operations.
8. Port `RolePlayGeminiPrompt` and `FreeChatGeminiPrompt` from `.requirements/` faithfully.

Full expanded sections 1–14 are in the conversation that authored this file; keep `API_REQUIREMENTS.md` as the normative contract for paths and envelopes.
