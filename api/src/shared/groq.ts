import { env } from '../config/env.js';

export type ChatTurn = {
  text: string;
  isUser: boolean;
};

/**
 * Groq OpenAI-compatible chat completions.
 * Same app contract as before: returns trimmed text or null on failure / missing key.
 * Roles in Mongo stay user|model; Groq maps model → assistant.
 */
export async function generateReply(input: {
  systemInstruction: string;
  userMessage: string;
  history: ChatTurn[];
}): Promise<string | null> {
  if (!env.GROQ_API_KEY) {
    return null;
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: input.systemInstruction },
    ...input.history.map((turn) => ({
      role: (turn.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: turn.text,
    })),
    { role: 'user', content: input.userMessage },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const text = json.choices?.[0]?.message?.content;
    return text?.trim() ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
