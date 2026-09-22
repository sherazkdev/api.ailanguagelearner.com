# -*- coding: utf-8 -*-
"""
Lingua AI — API Integration Reference (production).
Enterprise technical document — readable contrast, tight layout.
"""

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    CondPageBreak,
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "Lingua_AI_Developer_Integration_Guide.pdf"

BASE = "https://ailanguage.recipehubapi.com"
API_KEY = "KJSD84JIDNMZI83_3USLA983@8347SLDKJLE21D"
SWAGGER = f"{BASE}/docs"
DOC_VERSION = "1.0.0"
DOC_DATE = "22 September 2026"

DAILY_TYPE_ID = "6ab2292281d16f67ce31b18a"
TOPIC_ID = "6ab2292281d16f67ce31b195"

# Stronger contrast — less washed-out grey
ACCENT = colors.HexColor("#1565C0")
ACCENT_DARK = colors.HexColor("#0D47A1")
ACCENT_LIGHT = colors.HexColor("#E3F2FD")
BLACK = colors.HexColor("#0A0A0A")
DARK = colors.HexColor("#141414")
BODY = colors.HexColor("#222222")
MUTED = colors.HexColor("#444444")
LINE = colors.HexColor("#B0BEC5")
RULE = colors.HexColor("#CFD8DC")
CODE_BG = colors.HexColor("#ECEFF1")
TABLE_HEAD = colors.HexColor("#D6E8FA")
CODE_BORDER = colors.HexColor("#90CAF9")

M_LEFT = 18 * mm
M_RIGHT = 18 * mm
M_TOP = 24 * mm
M_BOTTOM = 18 * mm


def st():
    b = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle(
            "cover_kicker", parent=b["Normal"], fontName="Helvetica-Bold", fontSize=9,
            textColor=ACCENT, spaceAfter=6,
        ),
        "cover_title": ParagraphStyle(
            "cover_title", parent=b["Title"], fontName="Helvetica-Bold", fontSize=26,
            leading=30, textColor=BLACK, spaceAfter=6,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub", parent=b["Normal"], fontName="Helvetica", fontSize=11,
            leading=15, textColor=BODY, spaceAfter=12,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta", parent=b["Normal"], fontName="Helvetica", fontSize=9,
            leading=13, textColor=MUTED, spaceAfter=2,
        ),
        "h1": ParagraphStyle(
            "h1", parent=b["Heading1"], fontName="Helvetica-Bold", fontSize=14,
            textColor=ACCENT_DARK, spaceBefore=10, spaceAfter=6,
        ),
        "h2": ParagraphStyle(
            "h2", parent=b["Heading2"], fontName="Helvetica-Bold", fontSize=10.5,
            textColor=ACCENT, spaceBefore=8, spaceAfter=4,
        ),
        "p": ParagraphStyle(
            "p", parent=b["Normal"], fontName="Helvetica", fontSize=9.5,
            leading=14, textColor=BODY, spaceAfter=6,
        ),
        "mono_label": ParagraphStyle(
            "mono_label", parent=b["Normal"], fontName="Helvetica-Bold", fontSize=8.5,
            textColor=DARK, spaceBefore=5, spaceAfter=3,
        ),
        "code": ParagraphStyle(
            "code", parent=b["Normal"], fontName="Courier", fontSize=7.5,
            leading=11, textColor=BLACK, wordWrap="CJK",
        ),
        "th": ParagraphStyle(
            "th", parent=b["Normal"], fontName="Helvetica-Bold", fontSize=8.5,
            textColor=ACCENT_DARK, leading=12,
        ),
        "td": ParagraphStyle(
            "td", parent=b["Normal"], fontName="Helvetica", fontSize=8.5,
            textColor=BODY, leading=12, wordWrap="CJK",
        ),
        "td_mono": ParagraphStyle(
            "td_mono", parent=b["Normal"], fontName="Courier", fontSize=7.5,
            textColor=BLACK, leading=11, wordWrap="CJK",
        ),
        "small": ParagraphStyle(
            "small", parent=b["Normal"], fontName="Helvetica", fontSize=8,
            textColor=MUTED, leading=11, spaceBefore=3, spaceAfter=4,
        ),
    }


def P(text, style):
    return Paragraph(str(text), style)


def section_break(min_height=35 * mm):
    """Break page only when not enough room — avoids half-empty pages."""
    return CondPageBreak(min_height)


def rule(width):
    return HRFlowable(width=width, thickness=0.75, color=ACCENT, spaceBefore=3, spaceAfter=6)


def code_block(text, width):
    safe = escape(text.strip()).replace("\n", "<br/>")
    inner = P(safe, st()["code"])
    t = Table([[inner]], colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
        ("BOX", (0, 0), (-1, -1), 0.75, CODE_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def cell(text, mono=False):
    s = st()
    style = s["td_mono"] if mono else s["td"]
    return P(escape(str(text)), style)


def spec_table(headers, rows, col_widths, mono_cols=None):
    mono_cols = mono_cols or set()
    data = [[P(escape(h), st()["th"]) for h in headers]]
    for row in rows:
        data.append([cell(row[i], mono=(i in mono_cols)) for i in range(len(row))])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEAD),
        ("BOX", (0, 0), (-1, -1), 0.75, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def api_section(num, title, method, path, description, auth, request_body, response_body, errors=None):
    s = st()
    W = A4[0] - M_LEFT - M_RIGHT
    parts = [
        section_break(45 * mm),
        P(f"{num}. {escape(title)}", s["h2"]),
        P(escape(description), s["p"]),
        spec_table(
            ["Property", "Value"],
            [
                ["Method", method],
                ["URL", f"{BASE}{path}"],
                ["Authentication", auth],
            ],
            [34 * mm, W - 34 * mm],
            mono_cols={1},
        ),
        Spacer(1, 2 * mm),
    ]
    if request_body:
        parts += [
            P("Request body", s["mono_label"]),
            code_block(request_body, W),
            Spacer(1, 2 * mm),
        ]
    parts += [
        P("Response", s["mono_label"]),
        code_block(response_body, W),
    ]
    if errors:
        parts += [P(escape(errors), s["small"])]
    parts.append(Spacer(1, 4 * mm))
    return parts


def page_frame(canvas, doc):
    canvas.saveState()
    w, h = A4

    # Accent top bar
    canvas.setFillColor(ACCENT)
    canvas.rect(0, h - 6 * mm, w, 6 * mm, fill=1, stroke=0)

    header_y = h - M_TOP + 2 * mm
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(M_LEFT, header_y, w - M_RIGHT, header_y)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(DARK)
    canvas.drawString(M_LEFT, header_y + 2 * mm, "Lingua AI API — Integration Reference")
    canvas.setFillColor(ACCENT)
    canvas.drawRightString(w - M_RIGHT, header_y + 2 * mm, f"v{DOC_VERSION}")

    footer_y = M_BOTTOM - 4 * mm
    canvas.line(M_LEFT, footer_y, w - M_RIGHT, footer_y)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(M_LEFT, footer_y - 4 * mm, DOC_DATE)
    canvas.setFillColor(DARK)
    canvas.drawRightString(w - M_RIGHT, footer_y - 4 * mm, f"Page {doc.page}")
    canvas.restoreState()


def main():
    s = st()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=M_LEFT,
        rightMargin=M_RIGHT,
        topMargin=M_TOP,
        bottomMargin=M_BOTTOM,
        title="Lingua AI API Integration Reference",
        author="Lingua AI Engineering",
    )
    story = []
    W = A4[0] - M_LEFT - M_RIGHT

    # Cover + scope on page 1 — continuous flow
    story.append(Spacer(1, 4 * mm))
    story.append(P("LINGUA AI", s["cover_kicker"]))
    story.append(P("API Integration Reference", s["cover_title"]))
    story.append(P("REST API specification for mobile client integration", s["cover_sub"]))
    for line in [
        f"Document version: {DOC_VERSION}",
        f"Published: {DOC_DATE}",
        f"Base URL: {BASE}",
        f"OpenAPI / Swagger: {SWAGGER}",
        "Classification: Internal — development team",
    ]:
        story.append(P(escape(line), s["cover_meta"]))
    story.append(Spacer(1, 6 * mm))
    story.append(rule(W))
    story.append(P("Document scope", s["h1"]))
    story.append(P(
        "This reference defines the production REST contract between the Lingua AI mobile "
        "application and the backend service. It specifies authentication, the two supported "
        "conversation flows, every endpoint with request/response schemas, and integration rules "
        "the client must follow.",
        s["p"],
    ))
    story.append(P(
        "The server persists users, chats, and messages in MongoDB. The AI system prompt "
        "(systemInstruction) is composed once at chat creation and is never returned to or "
        "resent by the client.",
        s["p"],
    ))
    story.append(spec_table(
        ["Parameter", "Value"],
        [
            ["Base URL", BASE],
            ["API key header", "x-api-key"],
            ["Production key", API_KEY],
            ["Content-Type", "application/json; charset=utf-8"],
            ["Rate limit", "300 requests / minute / IP"],
        ],
        [38 * mm, W - 38 * mm],
        mono_cols={1},
    ))

    # Section 1 — flows naturally after scope (no forced blank page)
    story.append(section_break(40 * mm))
    story.append(P("1. Authentication", s["h1"]))
    story.append(P(
        "All endpoints except GET /health and routes under /docs require a valid API key "
        "in the x-api-key request header.",
        s["p"],
    ))
    story.append(code_block(
        f"x-api-key: {API_KEY}\nContent-Type: application/json; charset=utf-8",
        W,
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(spec_table(
        ["Status", "Condition", "Response"],
        [
            ["401", "Missing or invalid key", '{"error":"Unauthorized","message":"Valid x-api-key header is required"}'],
            ["400", "Validation failure", '{"error":"<message>","details":{...}}'],
            ["404", "Resource not found", '{"error":"Chat not found"}'],
            ["500", "Server error", '{"error":"Internal server error"}'],
        ],
        [14 * mm, 36 * mm, W - 50 * mm],
        mono_cols={2},
    ))

    story.append(section_break(35 * mm))
    story.append(P("2. Client identity", s["h1"]))
    story.append(P(
        "Every chat operation requires deviceId (anonymous device) and/or userId (authenticated account). "
        "At least one must be present. When both are sent on subscribe, the server links them to one user record.",
        s["p"],
    ))
    story.append(spec_table(
        ["Field", "Type", "Usage"],
        [
            ["deviceId", "string", "Anonymous identity — subscription / pre-login"],
            ["userId", "string", "Firebase or auth UID — logged-in user"],
        ],
        [28 * mm, 22 * mm, W - 50 * mm],
    ))

    story.append(section_break(40 * mm))
    story.append(P("3. Conversation flows", s["h1"]))

    story.append(P("3.1 Flow A — Role Play (structured scenario)", s["h2"]))
    story.append(spec_table(
        ["Step", "Action", "Endpoint"],
        [
            ["1", "Load conversation types", "GET /v1/conversation-types"],
            ["2", "Load topics for selected type", "GET /v1/conversation-types/{slug}/topics"],
            ["3", "Create chat (prompt stored server-side)", "POST /v1/chats  mode=role_play"],
            ["4", "Send user turn", "POST /v1/chats/{chatId}/messages"],
            ["5", "Load history (optional)", "GET /v1/chats/{chatId}/messages"],
        ],
        [12 * mm, 50 * mm, W - 62 * mm],
        mono_cols={2},
    ))
    story.append(P(
        "Required POST /v1/chats fields: mode, learningLanguageName, typeId, topicId. "
        "Optional: difficultyKey (dl_beginner | dl_intermediate | dl_advanced).",
        s["small"],
    ))

    story.append(P("3.2 Flow B — Free Chat (AI Conversation)", s["h2"]))
    story.append(spec_table(
        ["Step", "Action", "Endpoint"],
        [
            ["1", "Create chat directly (no topic)", "POST /v1/chats  mode=free_chat"],
            ["2", "Send user turn", "POST /v1/chats/{chatId}/messages"],
            ["3", "Load history (optional)", "GET /v1/chats/{chatId}/messages"],
        ],
        [12 * mm, 50 * mm, W - 62 * mm],
        mono_cols={2},
    ))
    story.append(P(
        "Do not send topicId with mode free_chat. Do not call the topics endpoint for ai-conversation.",
        s["small"],
    ))

    story.append(P("3.3 Mode comparison", s["h2"]))
    story.append(spec_table(
        ["mode", "UI entry", "typeId", "topicId", "Chat title"],
        [
            ["role_play", "Type, Topic, Chat", "Required", "Required", "Topic title"],
            ["free_chat", "AI Conversation", "Ignored", "Must omit", "AI Conversation"],
        ],
        [22 * mm, 36 * mm, 18 * mm, 18 * mm, W - 94 * mm],
    ))

    story.append(section_break(45 * mm))
    story.append(P("4. Endpoint specification", s["h1"]))

    for block in api_section(
        "4.1", "Health check", "GET", "/health",
        "Returns service and database connectivity status. No authentication.",
        "None", None,
        '{\n  "ok": true,\n  "service": "lingua-ai-api",\n  "mongo": true\n}',
    ):
        story.append(block)

    for block in api_section(
        "4.2", "Subscribe user", "POST", "/v1/users/subscribe",
        "Upsert user after in-app purchase or first launch.",
        "x-api-key required",
        '{\n  "deviceId": "string",\n  "userId": "string (optional)",\n  "subscriptionActive": true,\n  "subscriptionProvider": "google"\n}',
        '{\n  "user": {\n    "_id": "ObjectId",\n    "deviceId": "string",\n    "userId": "string | null",\n    "subscriptionActive": true,\n    "lastSeenAt": "ISO8601"\n  }\n}',
    ):
        story.append(block)

    for block in api_section(
        "4.3", "List conversation types", "GET", "/v1/conversation-types",
        "Returns 9 active types with topicsCount. Optional query: filter=all|daily_life|work|travel.",
        "x-api-key required", None,
        '{\n  "types": [\n    {\n      "_id": "ObjectId",\n      "slug": "daily-life",\n      "title": "Daily Life",\n      "topicsCount": 18\n    }\n  ]\n}',
    ):
        story.append(block)

    for block in api_section(
        "4.4", "List topics", "GET", "/v1/conversation-types/daily-life/topics",
        "Returns topics for a conversation type. Replace slug in path. Not available for ai-conversation (400).",
        "x-api-key required", None,
        '{\n  "type": { "_id": "' + DAILY_TYPE_ID + '", "slug": "daily-life" },\n'
        '  "topics": [ { "_id": "' + TOPIC_ID + '", "title": "At a Coffee Shop" } ]\n}',
        "Live IDs valid as of document date. Re-fetch after server re-seed.",
    ):
        story.append(block)

    for block in api_section(
        "4.5", "Create chat — Role Play", "POST", "/v1/chats",
        "Creates chat and stores systemInstruction server-side. Response excludes systemInstruction.",
        "x-api-key required",
        '{\n  "deviceId": "client-device-id",\n  "mode": "role_play",\n  "learningLanguageName": "Spanish",\n'
        '  "typeId": "' + DAILY_TYPE_ID + '",\n  "topicId": "' + TOPIC_ID + '",\n  "difficultyKey": "dl_beginner"\n}',
        'HTTP 201\n{\n  "chat": {\n    "id": "ObjectId",\n    "mode": "role_play",\n    "title": "At a Coffee Shop"\n  }\n}',
        "400 if topicId missing or topic does not belong to typeId.",
    ):
        story.append(block)

    for block in api_section(
        "4.6", "Create chat — Free Chat", "POST", "/v1/chats",
        "Direct tutor session. Server assigns ai-conversation type internally.",
        "x-api-key required",
        '{\n  "deviceId": "client-device-id",\n  "mode": "free_chat",\n  "learningLanguageName": "Spanish"\n}',
        'HTTP 201\n{\n  "chat": {\n    "id": "ObjectId",\n    "mode": "free_chat",\n    "title": "AI Conversation"\n  }\n}',
    ):
        story.append(block)

    for block in api_section(
        "4.7", "Send message", "POST", "/v1/chats/{chatId}/messages",
        "Submits one user turn. Server loads prompt and history from DB, calls Groq, persists messages on success.",
        "x-api-key required",
        '{\n  "deviceId": "client-device-id",\n  "userMessage": "Hola, quiero un cafe por favor."\n}',
        'HTTP 200\n{ "text": "assistant reply string" }\n\n-- or on Groq failure --\n{ "text": null }',
        "Do NOT send systemInstruction or history. userMessage max 4000 characters.",
    ):
        story.append(block)

    for block in api_section(
        "4.8", "Get messages", "GET", "/v1/chats/{chatId}/messages?deviceId=client-device-id",
        "Returns ordered message history for the chat.",
        "x-api-key required", None,
        '{\n  "chatId": "ObjectId",\n  "title": "string",\n  "mode": "role_play",\n  "messages": [\n'
        '    { "role": "user", "text": "string", "createdAt": "ISO8601" },\n'
        '    { "role": "model", "text": "string", "createdAt": "ISO8601" }\n  ]\n}',
    ):
        story.append(block)

    for block in api_section(
        "4.9", "List chats", "GET", "/v1/chats?deviceId=client-device-id",
        "Returns chats for owner sorted by lastMessageAt descending.",
        "x-api-key required", None,
        '{\n  "chats": [\n    { "_id": "ObjectId", "title": "string", "mode": "role_play", "lastMessageAt": "ISO8601" }\n  ]\n}',
        "systemInstruction is never included in responses.",
    ):
        story.append(block)

    for block in api_section(
        "4.10", "Delete chat", "DELETE", "/v1/chats/{chatId}?deviceId=client-device-id",
        "Deletes chat and all associated messages.",
        "x-api-key required", None,
        '{ "deleted": true }',
    ):
        story.append(block)

    story.append(section_break(40 * mm))
    story.append(P("5. Client implementation rules", s["h1"]))
    story.append(spec_table(
        ["Rule", "Requirement"],
        [
            ["Prompt handling", "Never send systemInstruction on message requests"],
            ["History handling", "Never send message history — server loads from DB"],
            ["Chat creation", "POST /v1/chats once per session; store returned chat.id"],
            ["Identity", "Same deviceId or userId on create, message, list, delete"],
            ["Null AI response", "Handle { \"text\": null } without crash"],
            ["HTTPS", "Production base URL must use TLS"],
            ["Key storage", "Store x-api-key securely; do not log in production"],
        ],
        [38 * mm, W - 38 * mm],
    ))

    story.append(section_break(35 * mm))
    story.append(P("6. Verification commands", s["h1"]))
    story.append(code_block(
        f"curl -s {BASE}/health\n\n"
        f"curl -s {BASE}/v1/conversation-types \\\n"
        f'  -H "x-api-key: {API_KEY}"\n\n'
        f"curl -s {BASE}/v1/conversation-types/daily-life/topics \\\n"
        f'  -H "x-api-key: {API_KEY}"\n\n'
        f"# Swagger UI: {SWAGGER}",
        W,
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(P(
        "End of document. Contact backend team before modifying client contracts.",
        s["small"],
    ))

    doc.build(story, onFirstPage=page_frame, onLaterPages=page_frame)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
