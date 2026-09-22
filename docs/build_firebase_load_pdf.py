"""Clear English PDF: Firebase already has chat; duplicate API load. No history-summarization mix-up."""

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

OUT = Path(r"C:\Users\shera\Downloads\Lingua_AI_Firebase_Read_Not_Summarize.pdf")

NAVY = colors.HexColor("#0F2744")
TEAL = colors.HexColor("#0E7C7B")
WHITE = colors.white
ROW = colors.HexColor("#F1F5F9")
CODE_BG = colors.HexColor("#F8FAFC")
CODE_BORDER = colors.HexColor("#94A3B8")
BODY = colors.HexColor("#0F172A")
MUTED = colors.HexColor("#475569")
AMBER_BG = colors.HexColor("#FFF7ED")
GREEN_BG = colors.HexColor("#F0FDF4")


def S():
    base = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle(
            "kicker", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=8, textColor=TEAL, spaceAfter=3,
        ),
        "title": ParagraphStyle(
            "title", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=14, leading=18, textColor=NAVY, alignment=TA_LEFT, spaceAfter=8,
        ),
        "h": ParagraphStyle(
            "h", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=11, textColor=NAVY, spaceBefore=8, spaceAfter=6,
        ),
        "p": ParagraphStyle(
            "p", parent=base["Normal"], fontName="Helvetica",
            fontSize=9.5, leading=13.5, textColor=BODY, spaceAfter=6,
        ),
        "b": ParagraphStyle(
            "b", parent=base["Normal"], fontName="Helvetica",
            fontSize=8.5, leading=12, textColor=BODY,
        ),
        "th": ParagraphStyle(
            "th", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=8, textColor=WHITE, leading=11,
        ),
        "code": ParagraphStyle(
            "code", parent=base["Normal"], fontName="Courier",
            fontSize=8, leading=11.5, textColor=BODY,
        ),
        "cap": ParagraphStyle(
            "cap", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=8.5, textColor=NAVY, spaceAfter=4, spaceBefore=2,
        ),
        "small": ParagraphStyle(
            "small", parent=base["Normal"], fontName="Helvetica",
            fontSize=8, leading=11, textColor=MUTED, spaceBefore=6,
        ),
        "bullet": ParagraphStyle(
            "bullet", parent=base["Normal"], fontName="Helvetica",
            fontSize=9.5, leading=13.5, textColor=BODY,
        ),
    }


def P(text, style):
    return Paragraph(text.replace("\n", "<br/>"), style)


def box(flowables, bg=CODE_BG, width=None):
    inner = Table([[f] for f in flowables], colWidths=[width])
    inner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("BOX", (0, 0), (-1, -1), 0.6, CODE_BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return inner


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


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 11 * mm, w, 11 * mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(15 * mm, h - 7 * mm, "LINGUA AI  |  Duplicate chat payload vs Firebase")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 15 * mm, h - 7 * mm, "16 September 2026")
    canvas.setFillColor(TEAL)
    canvas.rect(0, 0, w, 9 * mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(15 * mm, 3.5 * mm, "Discussion note. Current Dart Gemini contract is unchanged until approved.")
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
        title="Lingua AI — Duplicate API payload because chat is already in Firebase",
        author="Lingua AI",
    )
    story = []
    W = A4[0] - 30 * mm
    code_w = W - 8 * mm

    story.append(P("BACKEND DISCUSSION", s["kicker"]))
    story.append(
        P(
            "Firebase already stores the chat. The extra load is sending that same chat again on every API call.",
            s["title"],
        )
    )

    story.append(P("Correct summary (read this first)", s["h"]))
    story.append(
        ListFlowable(
            [
                ListItem(
                    P(
                        "<b>What is already true:</b> The app saves messages in Cloud Firestore. "
                        "That copy can be the source of truth.",
                        s["bullet"],
                    ),
                    leftIndent=12,
                    bulletColor=TEAL,
                ),
                ListItem(
                    P(
                        "<b>What is wasteful today:</b> On every new message the Flutter app also sends "
                        "the full <font face='Courier'>systemInstruction</font> and the full "
                        "<font face='Courier'>history</font> to the backend "
                        "(<font face='Courier'>POST /v1/chat</font>). That is a second copy of data Firebase already has.",
                        s["bullet"],
                    ),
                    leftIndent=12,
                    bulletColor=TEAL,
                ),
                ListItem(
                    P(
                        "<b>What this proposal does:</b> Flutter sends only the new "
                        "<font face='Courier'>userMessage</font> (and a "
                        "<font face='Courier'>conversationId</font>). The backend reads prompt + history from Firestore, "
                        "then calls Gemini <font face='Courier'>generateContent</font> the same way as the Dart file.",
                        s["bullet"],
                    ),
                    leftIndent=12,
                    bulletColor=TEAL,
                ),
                ListItem(
                    P(
                        "<b>What this proposal does not do:</b> It does not summarise old messages. "
                        "It does not drop turns. Gemini still receives the full stored history, in order. "
                        "It does not remove the Gemini call. One new user message still means one "
                        "<font face='Courier'>generateContent</font> call.",
                        s["bullet"],
                    ),
                    leftIndent=12,
                    bulletColor=TEAL,
                ),
            ],
            bulletType="bullet",
            start="circle",
            leftIndent=15,
            spaceAfter=8,
        )
    )

    story.append(P("APIs in this note", s["h"]))
    story.append(
        grid(
            [
                [
                    P("Name", s["th"]),
                    P("Caller", s["th"]),
                    P("Role", s["th"]),
                ],
                [
                    P("<b>Cloud Firestore Write</b>", s["b"]),
                    P("Flutter (already)", s["b"]),
                    P("Saves each successful user turn and assistant turn.", s["b"]),
                ],
                [
                    P("<b>Cloud Firestore Read</b><br/>Firebase Admin SDK", s["b"]),
                    P("Backend (proposed)", s["b"]),
                    P("Loads the saved system prompt and ordered messages for that conversation.", s["b"]),
                ],
                [
                    P("<b>POST /v1/chat</b><br/>(current backend proxy)", s["b"]),
                    P("Flutter → Node", s["b"]),
                    P("Today: large body (prompt + full history + new text). This is the duplicate upload.", s["b"]),
                ],
                [
                    P("<b>POST /v1/conversations</b><br/>(proposed, once)", s["b"]),
                    P("Flutter → Node", s["b"]),
                    P("Creates the conversation and stores the system prompt in Firestore. Returns conversationId.", s["b"]),
                ],
                [
                    P("<b>POST /v1/conversations/{id}/messages</b><br/>(proposed, every send)", s["b"]),
                    P("Flutter → Node", s["b"]),
                    P("Small body: only the new userMessage. Backend reads Firebase, then calls Gemini.", s["b"]),
                ],
                [
                    P("<b>POST /v1beta/models/{model}:generateContent</b><br/>Gemini API", s["b"]),
                    P("Backend → Google", s["b"]),
                    P("Unchanged contract: history first, current user last; temperature 0.7; 512 tokens; 30s timeout.", s["b"]),
                ],
            ],
            [58 * mm, 38 * mm, W - 96 * mm],
        )
    )

    story.append(Spacer(1, 4 * mm))
    story.append(P("Where the load is", s["h"]))
    story.append(
        grid(
            [
                [
                    P("Place", s["th"]),
                    P("Load?", s["th"]),
                    P("Why", s["th"]),
                ],
                [
                    P("Flutter → POST /v1/chat", s["b"]),
                    P("<b>Yes — duplicate</b>", s["b"]),
                    P("The phone re-uploads prompt + all old turns every send. Firestore already has them.", s["b"]),
                ],
                [
                    P("Node JSON parse / RAM", s["b"]),
                    P("Low", s["b"]),
                    P("Building the Gemini JSON is cheap. This is not the main cost.", s["b"]),
                ],
                [
                    P("Firestore writes", s["b"]),
                    P("Already paid", s["b"]),
                    P("The app already writes turns. This proposal does not add a new write pattern.", s["b"]),
                ],
                [
                    P("Firestore reads (new)", s["b"]),
                    P("New Firebase cost", s["b"]),
                    P("Backend reads the conversation and its messages instead of trusting the phone body.", s["b"]),
                ],
                [
                    P("Gemini generateContent", s["b"]),
                    P("<b>Main cost + latency</b>", s["b"]),
                    P("Still one call per new message. Token size stays the same because history is not shortened.", s["b"]),
                ],
            ],
            [48 * mm, 38 * mm, W - 86 * mm],
        )
    )

    # STEP 1
    step1_code = P(
        '{<br/>'
        '&nbsp;&nbsp;"systemInstruction": "You are a friendly language-learning '
        'conversation partner... Topic: Restaurant. Language: Spanish.",<br/>'
        '&nbsp;&nbsp;"userMessage": "Hola, una mesa para dos por favor",<br/>'
        '&nbsp;&nbsp;"history": [<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;{ "text": "Bienvenido. ¿Cuántas personas?", "isUser": false },<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;{ "text": "Somos dos", "isUser": true },<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;{ "text": "¿Interior o terraza?", "isUser": false }<br/>'
        '&nbsp;&nbsp;]<br/>'
        '}',
        s["code"],
    )
    story.append(
        KeepTogether(
            [
                P("Step 1 — What Flutter sends today (every message)", s["h"]),
                P(
                    "API: <font face='Courier'>POST /v1/chat</font> &nbsp;→&nbsp; backend &nbsp;→&nbsp; "
                    "Gemini <font face='Courier'>generateContent</font>",
                    s["cap"],
                ),
                P(
                    "The user typed only the new line. The request still includes the full prompt and every old turn. "
                    "Those old turns are already documents in Firestore.",
                    s["p"],
                ),
                box([step1_code], bg=AMBER_BG, width=code_w),
                Spacer(1, 3 * mm),
            ]
        )
    )

    # STEP 2
    step2_code = P(
        '{<br/>'
        '&nbsp;&nbsp;"mode": "role_play",<br/>'
        '&nbsp;&nbsp;"systemInstruction": "&lt;exact string from RolePlayGeminiPrompt.build()&gt;",<br/>'
        '&nbsp;&nbsp;"ownerId": "firebaseAuthUid_abc"<br/>'
        '}<br/><br/>'
        'Response 201:<br/>'
        '{ "conversationId": "chat_123" }<br/><br/>'
        'Firestore: conversations/chat_123 stores systemInstruction, ownerId, mode.',
        s["code"],
    )
    story.append(
        KeepTogether(
            [
                P("Step 2 — Start a conversation once", s["h"]),
                P("API: <font face='Courier'>POST /v1/conversations</font>", s["cap"]),
                P(
                    "Save the system prompt in Firebase at the start. Do not send that long prompt again on later messages.",
                    s["p"],
                ),
                box([step2_code], bg=GREEN_BG, width=code_w),
                Spacer(1, 3 * mm),
            ]
        )
    )

    # STEP 3
    step3_code = P(
        '{ "userMessage": "Hola, una mesa para dos por favor" }<br/><br/>'
        'Backend then:<br/>'
        '1. Firestore READ&nbsp;&nbsp;conversations/chat_123<br/>'
        '2. Firestore READ&nbsp;&nbsp;conversations/chat_123/messages&nbsp;&nbsp;(full ordered history, not a summary)<br/>'
        '3. Gemini&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;generateContent&nbsp;&nbsp;(same fields as GeminiService.dart)<br/>'
        '4. Firestore WRITE user + model turns if Gemini succeeds<br/>'
        '5. Response { "text": "¡Claro! ¿Fumador o no fumador?" }<br/><br/>'
        'If Gemini fails or times out: { "text": null } and do not write the failed turn.',
        s["code"],
    )
    story.append(
        KeepTogether(
            [
                P("Step 3 — Every later message (small body)", s["h"]),
                P(
                    "API: <font face='Courier'>POST /v1/conversations/chat_123/messages</font>",
                    s["cap"],
                ),
                P(
                    "Flutter only sends the new text. The backend rebuilds the Gemini request from Firebase. "
                    "History is the full stored list, in the same order as today (old turns first, new user message last).",
                    s["p"],
                ),
                box([step3_code], bg=GREEN_BG, width=code_w),
                Spacer(1, 3 * mm),
            ]
        )
    )

    story.append(P("What stays the same", s["h"]))
    story.append(
        P(
            "Role-play and free-chat prompts from the submitted Dart files; difficulty keys; "
            "user/model roles; temperature 0.7; maxOutputTokens 512; 30-second timeout; "
            "four safety categories at BLOCK_MEDIUM_AND_ABOVE; first candidate first text part, trimmed; "
            "null on failure. Groq, streaming, dashboards, and queues are out of scope.",
            s["p"],
        )
    )
    story.append(
        P(
            "This note is not a request to summarise or truncate chat history. "
            "It only moves the existing history from the HTTP body to a Firestore read.",
            s["small"],
        )
    )

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
