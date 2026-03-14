'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/hooks';
import type { Message } from '@/types';

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (diff < 86400000 && d.getDate() === now.getDate()) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: color + '25', color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700,
    }}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

const AVATAR_COLORS = ['#7F77DD', '#378ADD', '#1D9E75', '#EF9F27', '#D4537E', '#639922'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      if (!error && data) setMessages(data as Message[]);
      setLoading(false);
    };
    load();
  }, []);

  // Scroll to bottom on first load
  useEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [loading, scrollToBottom]);

  // Realtime subscription — append new messages directly (no refetch)
  useEffect(() => {
    const ch = supabase
      .channel('messages_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          // Avoid duplicates (optimistic insert already added it)
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as Message];
        });
        setTimeout(() => scrollToBottom(true), 50);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [scrollToBottom]);

  const send = async () => {
    const content = input.trim();
    if (!content || !user || sending) return;

    setSending(true);
    setInput('');

    // Optimistic insert with temp id
    const tempId = `temp_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      user_id: user.id,
      user_name: user.name || user.email || 'You',
      user_avatar: user.avatar || null,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => scrollToBottom(true), 50);

    const { data: saved, error } = await supabase
      .from('messages')
      .insert({ user_id: user.id, user_name: user.name || user.email || 'Unknown', user_avatar: user.avatar || null, content })
      .select()
      .single();

    if (error) {
      console.error('Chat error:', error.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(content);
    } else if (saved) {
      // Replace temp message with real one — realtime event dedup will now match the real id
      setMessages(prev => prev.map(m => m.id === tempId ? saved as Message : m));
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Group messages: show avatar+name only when sender changes
  const grouped = messages.map((msg, i) => ({
    ...msg,
    isFirst: i === 0 || messages[i - 1].user_id !== msg.user_id,
    isOwn: msg.user_id === user?.id,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', gap: 0 }}>
      {/* Header */}
      <div style={{ padding: '0 0 20px', borderBottom: '1px solid var(--brd)', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Team Chat</h2>
        <p style={{ margin: '3px 0 0', color: 'var(--mut)', fontSize: 13 }}>Real-time messaging for the whole team.</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)', fontSize: 13 }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--mut)', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No messages yet</div>
            <div>Be the first to say something!</div>
          </div>
        ) : (
          grouped.map(msg => {
            const color = avatarColor(msg.user_name);
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: msg.isFirst ? '10px 0 2px' : '1px 0',
                  flexDirection: msg.isOwn ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar — only on first in group */}
                <div style={{ width: 32, flexShrink: 0 }}>
                  {msg.isFirst && <Avatar name={msg.user_name} color={color} />}
                </div>

                <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: msg.isOwn ? 'flex-end' : 'flex-start' }}>
                  {msg.isFirst && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4, flexDirection: msg.isOwn ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: msg.isOwn ? '#7F77DD' : color }}>{msg.isOwn ? 'You' : msg.user_name}</span>
                      <span style={{ fontSize: 11, color: 'var(--mut)' }}>{timeLabel(msg.created_at)}</span>
                    </div>
                  )}
                  <div style={{
                    padding: '9px 14px', borderRadius: 12,
                    background: msg.isOwn ? '#7F77DD' : 'var(--bg-2)',
                    color: msg.isOwn ? '#fff' : 'var(--fg)',
                    border: msg.isOwn ? 'none' : '1px solid var(--brd)',
                    fontSize: 13, lineHeight: 1.5,
                    borderBottomRightRadius: msg.isOwn ? 4 : 12,
                    borderBottomLeftRadius: msg.isOwn ? 12 : 4,
                    wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--brd)', paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message the team... (Enter to send, Shift+Enter for new line)"
            disabled={sending}
            rows={1}
            style={{
              flex: 1, resize: 'none', minHeight: 42, maxHeight: 140,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--bg-2)', border: '1px solid var(--brd)',
              color: 'var(--fg)', fontSize: 13, fontFamily: 'inherit',
              outline: 'none', lineHeight: 1.5,
            }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 140) + 'px';
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              background: '#7F77DD', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 18px',
              cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
              opacity: input.trim() && !sending ? 1 : 0.4,
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
              height: 42,
            }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 6 }}>Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}
