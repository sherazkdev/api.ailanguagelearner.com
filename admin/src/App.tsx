import { useEffect, useMemo, useState } from 'react';
import { API_BASE, api } from './api/client';
import './App.css';

type Tab = 'types' | 'playground' | 'users';

type ConversationType = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  iconKey: string;
  filterGroup: string;
  topicsCount?: number;
};

type Topic = {
  _id: string;
  slug: string;
  title: string;
  description: string;
};

type Chat = {
  _id: string;
  title: string;
  mode: string;
  lastMessageAt?: string;
  typeId?: { title?: string; slug?: string };
};

type Message = { _id: string; role: 'user' | 'model'; text: string; createdAt: string };

const FILTERS = ['all', 'daily_life', 'work', 'travel'] as const;
const DIFFICULTIES = [
  { key: 'dl_beginner', label: 'Beginner' },
  { key: 'dl_intermediate', label: 'Intermediate' },
  { key: 'dl_advanced', label: 'Advanced' },
] as const;

function ownerQuery(deviceId: string, userId: string) {
  const params = new URLSearchParams();
  if (userId.trim()) params.set('userId', userId.trim());
  if (deviceId.trim()) params.set('deviceId', deviceId.trim());
  return params.toString();
}

function ownerJson(deviceId: string, userId: string, extra: Record<string, unknown> = {}) {
  const body: Record<string, unknown> = { ...extra };
  if (userId.trim()) body.userId = userId.trim();
  if (deviceId.trim()) body.deviceId = deviceId.trim();
  return body;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('types');
  const [health, setHealth] = useState('…');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [types, setTypes] = useState<ConversationType[]>([]);
  const [selectedType, setSelectedType] = useState<ConversationType | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('lingua_device') ?? 'device-demo-001');
  const [userId, setUserId] = useState(() => localStorage.getItem('lingua_user') ?? '');
  const [language, setLanguage] = useState('Spanish');
  const [difficultyKey, setDifficultyKey] = useState<(typeof DIFFICULTIES)[number]['key']>('dl_beginner');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<unknown[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const pushLog = (line: string) => setLog((prev) => [`${new Date().toLocaleTimeString()} — ${line}`, ...prev].slice(0, 30));

  useEffect(() => {
    localStorage.setItem('lingua_device', deviceId);
  }, [deviceId]);

  useEffect(() => {
    localStorage.setItem('lingua_user', userId);
  }, [userId]);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((j) => setHealth(j.ok ? `OK · mongo ${j.mongo ? 'up' : 'down'}` : 'DOWN'))
      .catch(() => setHealth('DOWN'));
  }, []);

  useEffect(() => {
    if (tab !== 'types' && tab !== 'playground') return;
    setError(null);
    const q = filter === 'all' ? '' : `?filter=${filter}`;
    api<{ types: ConversationType[] }>(`/v1/conversation-types${q}`)
      .then((d) => setTypes(d.types))
      .catch((e: Error) => setError(e.message));
  }, [filter, tab]);

  async function refreshChats() {
    const d = await api<{ chats: Chat[] }>(`/v1/chats?${ownerQuery(deviceId, userId)}`);
    setChats(d.chats);
  }

  async function subscribe() {
    setBusy(true);
    setError(null);
    try {
      await api('/v1/users/subscribe', {
        method: 'POST',
        json: ownerJson(deviceId, userId, {
          subscriptionActive: true,
          subscriptionProvider: 'google',
        }),
      });
      pushLog(`Subscribed ${userId.trim() ? `user ${userId}` : `device ${deviceId}`}`);
      await refreshChats();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadTopics(type: ConversationType) {
    if (type.slug === 'ai-conversation') {
      return startFreeChat();
    }
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ topics: Topic[] }>(`/v1/conversation-types/${type.slug}/topics`);
      setSelectedType(type);
      setTopics(d.topics);
      pushLog(`Loaded ${d.topics.length} topics for ${type.title}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function startRolePlayWithTopic(type: ConversationType, topic: Topic) {
    setBusy(true);
    setError(null);
    try {
      await subscribe();
      const d = await api<{ chat: { id: string } }>('/v1/chats', {
        method: 'POST',
        json: ownerJson(deviceId, userId, {
          mode: 'role_play',
          learningLanguageName: language,
          typeId: type._id,
          topicId: topic._id,
          difficultyKey,
        }),
      });
      setActiveChatId(String(d.chat.id));
      setMessages([]);
      pushLog(`Created role_play chat ${d.chat.id} · ${topic.title}`);
      await refreshChats();
      setTab('playground');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function startRolePlay(type: ConversationType) {
    await loadTopics(type);
  }

  async function startFreeChat() {
    setBusy(true);
    setError(null);
    try {
      await subscribe();
      const d = await api<{ chat: { id: string } }>('/v1/chats', {
        method: 'POST',
        json: ownerJson(deviceId, userId, {
          mode: 'free_chat',
          learningLanguageName: language,
        }),
      });
      setActiveChatId(String(d.chat.id));
      setMessages([]);
      pushLog(`Created free_chat ${d.chat.id}`);
      await refreshChats();
      setTab('playground');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openChat(chatId: string) {
    setBusy(true);
    setError(null);
    try {
      setActiveChatId(chatId);
      const d = await api<{ messages: Message[] }>(
        `/v1/chats/${chatId}/messages?${ownerQuery(deviceId, userId)}`,
      );
      setMessages(d.messages);
      pushLog(`Opened history (${d.messages.length} messages)`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    if (!activeChatId || !draft.trim()) return;
    setBusy(true);
    setError(null);
    const userMessage = draft.trim();
    setDraft('');
    try {
      const d = await api<{ text: string | null }>(`/v1/chats/${activeChatId}/messages`, {
        method: 'POST',
        json: ownerJson(deviceId, userId, { userMessage }),
      });
      pushLog(d.text == null ? 'Groq returned null' : 'AI reply received');
      await openChat(activeChatId);
      await refreshChats();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadUsers() {
    setError(null);
    try {
      const d = await api<{ users: unknown[] }>('/v1/users');
      setUsers(d.users);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    if (tab === 'playground') refreshChats().catch((e: Error) => setError(e.message));
    if (tab === 'users') loadUsers();
  }, [tab]);

  const activeTitle = useMemo(
    () => chats.find((c) => c._id === activeChatId)?.title ?? activeChatId,
    [chats, activeChatId],
  );

  return (
    <div className="shell">
      <aside className="side">
        <p className="brand">Lingua AI</p>
        <p className="muted">Admin · API tester</p>
        <nav>
          {(
            [
              ['types', 'Conversation types'],
              ['playground', 'Chat playground'],
              ['users', 'Users'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? 'nav on' : 'nav'} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <a className="docs" href={`${API_BASE}/docs`} target="_blank" rel="noreferrer">
          Open Swagger docs →
        </a>
        <p className="health">API: {health}</p>
      </aside>

      <main className="main">
        <header className="bar">
          <label>
            deviceId
            <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="anonymous / pre-login" />
          </label>
          <label>
            userId
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="logged-in account (optional)" />
          </label>
          <label>
            learning language
            <input value={language} onChange={(e) => setLanguage(e.target.value)} />
          </label>
          <label>
            difficulty
            <select value={difficultyKey} onChange={(e) => setDifficultyKey(e.target.value as typeof difficultyKey)}>
              {DIFFICULTIES.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled={busy} onClick={() => void subscribe()}>
            Subscribe device
          </button>
          <button type="button" disabled={busy} onClick={() => void startFreeChat()}>
            Start free chat
          </button>
        </header>

        {error && <p className="error">{error}</p>}

        {tab === 'types' && (
          <section>
            <div className="filters">
              {FILTERS.map((f) => (
                <button key={f} type="button" className={filter === f ? 'chip on' : 'chip'} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
            <ul className="cards">
              {types.map((t) => (
                <li key={t._id}>
                  <div className="card">
                    <strong>{t.title}</strong>
                    <span>{t.description}</span>
                    <em>
                      {t.slug}
                      {typeof t.topicsCount === 'number' && t.slug !== 'ai-conversation'
                        ? ` · ${t.topicsCount} topics`
                        : ''}
                    </em>
                    <button type="button" disabled={busy} onClick={() => void startRolePlay(t)}>
                      {t.slug === 'ai-conversation' ? 'Start free chat' : 'Choose topic'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {selectedType && topics.length > 0 && (
              <section className="panel topics">
                <h2>
                  Topics · {selectedType.title}
                  <button type="button" className="linkish" onClick={() => { setSelectedType(null); setTopics([]); }}>
                    Close
                  </button>
                </h2>
                <ul>
                  {topics.map((topic) => (
                    <li key={topic._id}>
                      <button type="button" disabled={busy} onClick={() => void startRolePlayWithTopic(selectedType, topic)}>
                        <strong>{topic.title}</strong>
                        <span>{topic.description}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>
        )}

        {tab === 'playground' && (
          <section className="split">
            <div className="panel">
              <h2>Chats</h2>
              <button type="button" className="linkish" onClick={() => void refreshChats()}>
                Refresh
              </button>
              <ul className="chat-list">
                {chats.map((c) => (
                  <li key={c._id}>
                    <button type="button" className={c._id === activeChatId ? 'on' : ''} onClick={() => void openChat(c._id)}>
                      <strong>{c.title}</strong>
                      <span>
                        {c.mode} · {c.typeId?.title ?? ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel chat-pane">
              <h2>{activeTitle ?? 'Select a chat'}</h2>
              <div className="messages">
                {messages.map((m) => (
                  <div key={m._id} className={m.role === 'user' ? 'bubble user' : 'bubble ai'}>
                    <small>{m.role}</small>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              <div className="composer">
                <input
                  value={draft}
                  placeholder="userMessage only — prompt/history stay on server"
                  disabled={!activeChatId || busy}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void sendMessage();
                  }}
                />
                <button type="button" disabled={!activeChatId || busy} onClick={() => void sendMessage()}>
                  Send
                </button>
              </div>
            </div>
          </section>
        )}

        {tab === 'users' && (
          <section className="panel">
            <h2>Users</h2>
            <pre>{JSON.stringify(users, null, 2)}</pre>
          </section>
        )}

        <section className="panel log">
          <h3>Activity</h3>
          <ul>
            {log.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
