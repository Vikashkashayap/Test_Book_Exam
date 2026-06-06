'use client';

import { MessageSquarePlus, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChatSession {
  sessionId: string;
  title: string;
  preview: string;
  updatedAt: string;
  messageCount: number;
}

function formatSessionDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface Props {
  sessions: ChatSession[];
  activeSessionId?: string;
  loading?: boolean;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onClose?: () => void;
  className?: string;
}

export function ChatHistorySidebar({
  sessions,
  activeSessionId,
  loading = false,
  onSelect,
  onNewChat,
  onClose,
  className,
}: Props) {
  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col border-r bg-white',
        className
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-slate-800">Saved Chats</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border-b p-3">
        <Button className="h-10 w-full gap-2" onClick={onNewChat}>
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Loading chats...</p>
        ) : sessions.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No saved chats yet. Start a conversation!
          </p>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => {
              const active = session.sessionId === activeSessionId;
              return (
                <button
                  key={session.sessionId}
                  type="button"
                  onClick={() => onSelect(session.sessionId)}
                  className={cn(
                    'w-full rounded-xl px-3 py-2.5 text-left transition-colors',
                    active
                      ? 'bg-primary/10 ring-1 ring-primary/30'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-medium text-slate-800">{session.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatSessionDate(session.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{session.preview}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
