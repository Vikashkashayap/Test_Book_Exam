'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiSuccess } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MentorMessageContent } from '@/components/test/MentorMessageContent';
import { ChatHistorySidebar, type ChatSession } from '@/components/mentor/ChatHistorySidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SESSION_STORAGE_KEY = 'mentor-active-session';

const suggestions = [
  { label: 'Explain Pythagoras theorem', icon: '📐' },
  { label: 'Strategy for SSC CGL prelims', icon: '🎯' },
  { label: 'Notes on Indian Constitution', icon: '📜' },
  { label: 'Daily motivation for exam prep', icon: '💪' },
];

export default function AIMentorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      const res = await api<ApiSuccess<ChatSession[]>>('/ai/mentor/sessions');
      setSessions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const loadSessionHistory = useCallback(async (id: string) => {
    setLoadingHistory(true);
    try {
      const res = await api<ApiSuccess<{ role: 'user' | 'assistant'; content: string }[]>>(
        `/ai/mentor/history?sessionId=${encodeURIComponent(id)}`
      );
      setMessages(res.data.map((m) => ({ role: m.role, content: m.content })));
      setSessionId(id);
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    } catch (e) {
      console.error(e);
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      loadSessionHistory(saved);
    }
  }, [loadSessionHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, loadingHistory]);

  function startNewChat() {
    setMessages([]);
    setSessionId(undefined);
    setInput('');
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setHistoryOpen(false);
  }

  function selectSession(id: string) {
    if (id === sessionId) {
      setHistoryOpen(false);
      return;
    }
    loadSessionHistory(id);
    setHistoryOpen(false);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api<ApiSuccess<{ reply: string; sessionId: string }>>('/ai/mentor/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, sessionId }),
      });
      setSessionId(res.data.sessionId);
      localStorage.setItem(SESSION_STORAGE_KEY, res.data.sessionId);
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply }]);
      await loadSessions();
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Sorry, I could not respond. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const chatContent = (
    <>
      <div className="shrink-0 border-b bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">AI Mentor</h1>
              <p className="text-sm text-muted-foreground">
                Concepts, notes, strategies & motivation — simple Hindi/English answers
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5 lg:hidden"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-4 w-4" />
            Chats
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {loadingHistory ? (
          <div className="mx-auto flex h-full max-w-2xl items-center justify-center py-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading chat...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Kya seekhna hai aaj?</h2>
            <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
              Koi bhi topic pucho — main simple language mein samjhaunga.
            </p>
            <div className="mt-8 grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => sendMessage(s.label)}
                  className="flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="font-medium text-slate-700">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    msg.role === 'user' ? 'bg-primary/15' : 'bg-white ring-1 ring-slate-200'
                  )}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>

                <div
                  className={cn(
                    'min-w-0 max-w-[88%] sm:max-w-[80%]',
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <p
                    className={cn(
                      'mb-1 text-[11px] font-medium uppercase tracking-wide',
                      msg.role === 'user' ? 'text-right text-primary/70' : 'text-slate-400'
                    )}
                  >
                    {msg.role === 'user' ? 'You' : 'AI Mentor'}
                  </p>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 shadow-sm',
                      msg.role === 'user'
                        ? 'rounded-tr-md bg-primary text-primary-foreground'
                        : 'rounded-tl-md border bg-white'
                    )}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <MentorMessageContent content={msg.content} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-md border bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Soch raha hoon...
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Apna sawal likho — jaise: Pythagoras theorem samjhao..."
            className="min-h-[44px] rounded-xl border-slate-200 bg-slate-50"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            disabled={loading || loadingHistory}
          />
          <Button
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl"
            onClick={() => sendMessage(input)}
            disabled={loading || loadingHistory || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-full min-h-0 bg-slate-50/50">
      <div className="hidden w-72 shrink-0 xl:w-80 lg:block">
        <ChatHistorySidebar
          sessions={sessions}
          activeSessionId={sessionId}
          loading={loadingSessions}
          onSelect={selectSession}
          onNewChat={startNewChat}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{chatContent}</div>

      {historyOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setHistoryOpen(false)}
            aria-label="Close chat history"
          />
          <div className="absolute inset-y-0 left-0 w-[min(100%,20rem)] shadow-xl">
            <ChatHistorySidebar
              sessions={sessions}
              activeSessionId={sessionId}
              loading={loadingSessions}
              onSelect={selectSession}
              onNewChat={startNewChat}
              onClose={() => setHistoryOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
