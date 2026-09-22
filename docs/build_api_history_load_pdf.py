# -*- coding: utf-8 -*-
"""Lingua AI API documentation: history-on-every-request load issue."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(r"C:\Users\shera\Downloads\Lingua_AI_API_History_Load.pdf")

NAVY = colors.HexColor("#0F2744")
TEAL = colors.HexColor("#0E7C7B")
WHITE = colors.white
ROW = colors.HexColor("#F1F5F9")
AMBER = colors.HexColor("#FFF7ED")
GREEN = colors.HexColor("#F0FDF4")
BORDER = colors.HexColor("#94A3B8")
BODY = colors.HexColor("#0F172A")
MUTED = colors.HexColor("#475569")


def S():
    b = getSampleStyleSheet()
    return {
        "k": ParagraphStyle("k", parent=b["Normal"], fontName="Helvetica-Bold", fontSize=8, textColor=TEAL, spaceAfter=3),
        "t": ParagraphStyle("t", parent=b["Title"], fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=NAVY, alignment=TA_LEFT, spaceAfter=6),
        "h": ParagraphStyle("h", parent=b["Heading2"], fontName="Helvetica-Bold", fontSize=11, textColor=NAVY, spaceBefore=8, spaceAfter=5),
        "p": ParagraphStyle("p", parent=b["Normal"], fontName="Helvetica", fontSize=9.5, leading=13.5, textColor=BODY, spaceAfter=6),
        "b": ParagraphStyle("b", parent=b["Normal"], fontName="Helvetica", fontSize=8.5, leading=12, textColor=BODY),
        "th": ParagraphStyle("th", parent=b["Normal"], fontName="Helvetica-Bold", fontSize=8, textColor=WHITE, leading=11),
        "code": ParagraphStyle("code", parent=b["Normal"], fontName="Courier", fontSize=8, leading=11.5, textColor=BODY),
        "cap": ParagraphStyle("cap", parent=b["Normal"], fontName="Helvetica-Bold", fontSize=8.5, textColor=NAVY, spaceAfter=4),
        "sm": ParagraphStyle("sm", parent=b["Normal"], fontName="Helvetica", fontSize=8, leading=11, textColor=MUTED, spaceBefore=4),
        "bu": ParagraphStyle("bu", parent=b["Normal"], fontName="Helvetica", fontSize=9.5, leading=13.5, textColor=BODY),
    }


def P(text, st):
    return Paragraph(str(text).replace("\n", "<br/>"), st)


def box(items, bg, w):
    t = Table([[i] for i in items], colWidths=[w])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return t


def grid(data, cols):
    t = Table(data, colWidths=cols, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, ROW]),
            ]
        )
    )
    return t


def hf(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 11 * mm, w, 11 * mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(15 * mm, h - 7 * mm, "LINGUA AI  |  Chat API documentation")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 15 * mm, h - 7 * mm, "17 September 2026")
    canvas.setFillColor(TEAL)
    canvas.rect(0, 0, w, 9 * mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(15 * mm, 3.5 * mm, "Current contract from GeminiService.dart. Proposal section is not approved.")
    canvas.drawRightString(w - 15 * mm, 3.5 * mm, f"Page {doc.page}")
    canvas.restoreState()


def main():
    s = S()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=17 * mm,
        bottomMargin=14 * mm,
        title="Lingua AI Chat API - history is sent on every request",
        author="Lingua AI",
    )
    story = []
    W = A4[0] - 30 * mm
    cw = W - 8 * mm

    story.append(P("API DOCUMENTATION", s["k"]))
    story.append(P("The load problem is the request, not the response.", s["t"]))
    story.append(
        P(
            "Every time the user sends one new message, the client sends the full chat history again "
            "to the chat API. The API then sends that same growing history to Gemini. "
            "The HTTP response is small (only the new assistant text, or null). "
            "This document is English. It does not propose summarising old messages.",
            s["p"],
        )
    )

    story.append(P("1. What is wrong with the current API shape", s["h"]))
    story.append(
        ListFlowable(
            [
                ListItem(
                    P(
                        "<b>Request grows every turn.</b> Body = systemInstruction + all previous turns + new userMessage. "
                        "Turn 2 is small. Turn 20 is large. Turn 50 is much larger. Same API name every time.",
                        s["bu"],
                    ),
                    leftIndent=12,
                ),
                ListItem(
                    P(
                        "<b>Gemini sees the same growth.</b> The backend forwards that history to "
                        "<font face='Courier'>generateContent</font>. More input tokens, more cost, more chance of hitting the 30s timeout.",
                        s["bu"],
                    ),
                    leftIndent=12,
                ),
                ListItem(
                    P(
                        "<b>Response does not grow.</b> Success returns only the new reply text (maxOutputTokens 512). "
                        "Failure returns null. Response size is not the load issue.",
                        s["bu"],
                    ),
                    leftIndent=12,
                ),
                ListItem(
                    P(
                        "<b>Firestore already has the messages</b> (app writes them). Sending history again on the API is a second copy.",
                        s["bu"],
                    ),
                    leftIndent=12,
                ),
            ],
            bulletType="bullet",
            start="circle",
            leftIndent=15,
            spaceAfter=6,
        )
    )

    story.append(P("2. Current API", s["h"]))
    story.append(
        grid(
            [
                [P("Field", s["th"]), P("Value", s["th"])],
                [P("Method / path (proxy)", s["b"]), P("<font face='Courier'>POST /v1/chat</font>", s["b"])],
                [
                    P("Upstream", s["b"]),
                    P("<font face='Courier'>POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent</font>", s["b"]),
                ],
                [P("Timeout", s["b"]), P("30 seconds", s["b"])],
                [P("temperature / maxOutputTokens", s["b"]), P("0.7 / 512", s["b"])],
                [P("Modes", s["b"]), P("role-play and free-chat (different systemInstruction, same endpoint)", s["b"])],
            ],
            [55 * mm, W - 55 * mm],
        )
    )

    story.append(Spacer(1, 3 * mm))
    story.append(
        KeepTogether(
            [
                P("3. Current request - this is the heavy part (every message)", s["h"]),
                P("POST /v1/chat", s["cap"]),
                P(
                    "history is the full past conversation. It is sent again on message 3, 4, 5, ... not only the first time.",
                    s["p"],
                ),
                box(
                    [
                        P(
                            '{<br/>'
                            '&nbsp;&nbsp;"systemInstruction": "You are a friendly language-learning conversation partner. '
                            'Topic: Restaurant. Language: Spanish. ...",<br/>'
                            '&nbsp;&nbsp;"userMessage": "Una mesa para dos",<br/>'
                            '&nbsp;&nbsp;"history": [<br/>'
                            '&nbsp;&nbsp;&nbsp;&nbsp;{ "text": "Bienvenido. Cuantas personas?", "isUser": false },<br/>'
                            '&nbsp;&nbsp;&nbsp;&nbsp;{ "text": "Somos dos", "isUser": true },<br/>'
                            '&nbsp;&nbsp;&nbsp;&nbsp;{ "text": "Interior o terraza?", "isUser": false }<br/>'
                            '&nbsp;&nbsp;&nbsp;&nbsp;/* every older turn is repeated here on the next send */<br/>'
                            '&nbsp;&nbsp;]<br/>'
                            '}',
                            s["code"],
                        )
                    ],
                    AMBER,
                    cw,
                ),
                Spacer(1, 2 * mm),
            ]
        )
    )

    story.append(
        KeepTogether(
            [
                P("4. Current response - this is small", s["h"]),
                P("Success", s["cap"]),
                box([P('{ "text": "Claro. Fumador o no fumador?" }', s["code"])], GREEN, cw),
                P("Failure (timeout, empty key, non-200, no candidates) - same as Dart: null", s["cap"]),
                box([P('{ "text": null }', s["code"])], GREEN, cw),
                Spacer(1, 2 * mm),
            ]
        )
    )

    story.append(P("5. How load grows (same API, bigger body)", s["h"]))
    story.append(
        grid(
            [
                [
                    P("User send #", s["th"]),
                    P("What Flutter puts on POST /v1/chat", s["th"]),
                    P("What Gemini generateContent receives", s["th"]),
                    P("What the API returns", s["th"]),
                ],
                [
                    P("1", s["b"]),
                    P("prompt + 0 history + new message", s["b"]),
                    P("prompt + 1 user turn", s["b"]),
                    P("one new text (or null)", s["b"]),
                ],
                [
                    P("5", s["b"]),
                    P("prompt + 8 old turns + new message", s["b"]),
                    P("prompt + those 8 + new user turn", s["b"]),
                    P("one new text (or null)", s["b"]),
                ],
                [
                    P("20", s["b"]),
                    P("prompt + ~38 old turns + new message", s["b"]),
                    P("the same large contents array", s["b"]),
                    P("one new text (or null)", s["b"]),
                ],
            ],
            [28 * mm, 52 * mm, 52 * mm, W - 132 * mm],
        )
    )
    story.append(
        P(
            "The Node server also parses a larger JSON each time. That is still cheap compared with Gemini input tokens. "
            "The serious load is: mobile upload of history + Gemini input size. Not the response JSON.",
            s["p"],
        )
    )

    story.append(P("6. Proposed smaller request (Firestore already stores the chat)", s["h"]))
    story.append(
        P(
            "Do not change Gemini mapping (full history still goes to generateContent unless a later, separate decision says otherwise). "
            "Only stop sending that history from the phone on every POST.",
            s["p"],
        )
    )
    story.append(P("Once: POST /v1/conversations", s["cap"]))
    story.append(
        box(
            [
                P(
                    '{ "mode": "role_play", "systemInstruction": "&lt;RolePlayGeminiPrompt.build()&gt;", "ownerId": "uid" }<br/>'
                    '201 { "conversationId": "chat_123" }',
                    s["code"],
                )
            ],
            GREEN,
            cw,
        )
    )
    story.append(P("Every later message: POST /v1/conversations/chat_123/messages", s["cap"]))
    story.append(
        box(
            [
                P(
                    'Request:&nbsp;&nbsp;{ "userMessage": "Una mesa para dos" }<br/>'
                    'Backend: Firestore READ prompt + full ordered messages, then generateContent, then WRITE if success.<br/>'
                    'Response: { "text": "..." } or { "text": null }',
                    s["code"],
                )
            ],
            GREEN,
            cw,
        )
    )

    story.append(P("7. Unchanged Gemini rules (from submitted Dart)", s["h"]))
    story.append(
        P(
            "History turns first, current user last; roles user / model; four safety categories BLOCK_MEDIUM_AND_ABOVE; "
            "first candidate, first text part, trimmed. Role-play and free-chat English prompts unchanged. "
            "This file is not a Groq, streaming, dashboard, or chat-summary spec.",
            s["p"],
        )
    )
    story.append(
        P(
            "Source: GeminiService.generateReply, RolePlayGeminiPrompt, FreeChatGeminiPrompt.",
            s["sm"],
        )
    )

    doc.build(story, onFirstPage=hf, onLaterPages=hf)
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
