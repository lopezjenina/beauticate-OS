'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/hooks';
import { ROLES } from '@/lib/constants';
import type { Message, Profile, Channel } from '@/types';

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
    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: color + '25', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
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

function MessageContent({ content, isOwn }: { content: string; isOwn: boolean }) {
  const parts = content.split(/(@\w[\w\s]*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        /^@\w/.test(part)
          ? <span key={i} style={{ color: isOwn ? '#fff' : '#7F77DD', fontWeight: 700 }}>{part}</span>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

export default function ChatPage() {
  const { user, role } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelRoles, setNewChannelRoles] = useState<string[]>(['admin', 'editor', 'social', 'viewer']);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  const selectedChannel = channels.find(c => c.id === selectedId);

  // Load channels + profiles
  useEffect(() => {
    const load = async () => {
      const [{ data: chs }, { data: profs }] = await Promise.all([
        supabase.from('channels').select('*').order('position', { ascending: true }),
        supabase.from('profiles').select('id, name, email, role, avatar'),
      ]);
      if (chs) {
        setChannels(chs as Channel[]);
        const def = (chs as Channel[]).find(c => c.is_default) || chs[0];
        if (def) setSelectedId(def.id);
      }
      if (profs) setProfiles(profs as Profile[]);
      setLoadingChannels(false);
    };
    load();
  }, []);

  // Load messages when selected channel changes
  useEffect(() => {
    if (!selectedId) return;
    setLoadingMessages(true);
    setMessages([]);
    supabase
      .from('messages')
      .select('*')
      .eq('channel_id', selectedId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
        setLoadingMessages(false);
        setTimeout(() => scrollToBottom(false), 50);
      });
  }, [selectedId, scrollToBottom]);

  // Realtime subscription — scoped to selected channel
  useEffect(() => {
    if (!selectedId) return;
    const ch = supabase
      .channel(`messages_${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `channel_id=eq.${selectedId}`,
      }, payload => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as Message];
        });
        setTimeout(() => scrollToBottom(true), 50);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedId, scrollToBottom]);

  const parseMentions = useCallback((content: string): string[] => {
    const pattern = /@(\w+)/g;
    const words = [...content.matchAll(pattern)].map(m => m[1].toLowerCase());
    return profiles
      .filter(p => words.some(w => p.name.toLowerCase().startsWith(w)) && p.id !== user?.id)
      .map(p => p.id);
  }, [profiles, user?.id]);

  const send = async () => {
    const content = input.trim();
    if (!content || !user || sending || !selectedId) return;

    setSending(true);
    setInput('');

    const tempId = `temp_${Date.now()}`;
    const optimistic: Message = {
      id: tempId, channel_id: selectedId,
      user_id: user.id, user_name: user.name || user.email || 'You',
      user_avatar: user.avatar || null, content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => scrollToBottom(true), 50);

    const { data: saved, error } = await supabase
      .from('messages')
      .insert({ channel_id: selectedId, user_id: user.id, user_name: user.name || user.email || 'Unknown', user_avatar: user.avatar || null, content })
      .select().single();

    if (error) {
      console.error('Chat error:', error.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(content);
    } else if (saved) {
      setMessages(prev => prev.map(m => m.id === tempId ? saved as Message : m));

      // Notify @mentioned users
      const mentionedIds = parseMentions(content);
      for (const mentionedUserId of mentionedIds) {
        await supabase.from('notifications').insert({
          user_id: mentionedUserId, type: 'mention',
          title: `${user.name || 'Someone'} mentioned you`,
          body: content.slice(0, 120),
          link: `/chat`,
          actor_id: user.id, actor_name: user.name || 'Unknown',
        });
      }
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) return;
    const slug = newChannelName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase
      .from('channels')
      .insert({ name: newChannelName.trim(), slug, description: newChannelDesc.trim(), allowed_roles: newChannelRoles, created_by: user?.id })
      .select().single();
    if (!error && data) {
      setChannels(prev => [...prev, data as Channel]);
      setSelectedId((data as Channel).id);
      setNewChannelOpen(false);
      setNewChannelName(''); setNewChannelDesc('');
      setNewChannelRoles(['admin', 'editor', 'social', 'viewer']);
    }
  };

  const grouped = messages.map((msg, i) => ({
    ...msg,
    isFirst: i === 0 || messages[i - 1].user_id !== msg.user_id,
    isOwn: msg.user_id === user?.id,
  }));

  const ROLE_OPTIONS = ['admin', 'editor', 'social', 'viewer'];

  if (loadingChannels) {
    return <div style={{ padding: 40, color: 'var(--mut)', fontSize: 13 }}>Loading channels...</div>;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', gap: 0 }}>
      {/* Channel list sidebar */}
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--brd)', display: 'flex', flexDirection: 'column', paddingTop: 4 }}>
        <div style={{ padding: '12px 14px 8px', fontSize: 11, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Channels
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setSelectedId(ch.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                padding: '7px 14px', background: selectedId === ch.id ? 'rgba(127,119,221,0.12)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                color: selectedId === ch.id ? '#7F77DD' : 'var(--mut)',
                fontSize: 13, fontWeight: selectedId === ch.id ? 600 : 400,
                borderRadius: 0,
              }}
            >
              <span style={{ opacity: 0.5, fontSize: 12 }}>#</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
            </button>
          ))}
        </div>

        {role?.canManageUsers && (
          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--brd)' }}>
            <button
              onClick={() => setNewChannelOpen(o => !o)}
              style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 6, color: 'var(--mut)', fontSize: 12, cursor: 'pointer' }}
            >
              + New channel
            </button>
          </div>
        )}
      </div>

      {/* Message area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Channel header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--brd)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--mut)', fontSize: 18, lineHeight: 1 }}>#</span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selectedChannel?.name || 'Select a channel'}</h2>
          </div>
          {selectedChannel?.description && (
            <p style={{ margin: '2px 0 0', color: 'var(--mut)', fontSize: 12 }}>{selectedChannel.description}</p>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingMessages ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)', fontSize: 13 }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--mut)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No messages in #{selectedChannel?.name}</div>
              <div>Be the first to say something!</div>
            </div>
          ) : (
            grouped.map(msg => {
              const color = avatarColor(msg.user_name);
              return (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: msg.isFirst ? '10px 0 2px' : '1px 0', flexDirection: msg.isOwn ? 'row-reverse' : 'row' }}>
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
                    <div style={{ padding: '9px 14px', borderRadius: 12, background: msg.isOwn ? '#7F77DD' : 'var(--bg-2)', color: msg.isOwn ? '#fff' : 'var(--fg)', border: msg.isOwn ? 'none' : '1px solid var(--brd)', fontSize: 13, lineHeight: 1.5, borderBottomRightRadius: msg.isOwn ? 4 : 12, borderBottomLeftRadius: msg.isOwn ? 12 : 4, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      <MessageContent content={msg.content} isOwn={msg.isOwn} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--brd)', padding: '12px 20px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message #${selectedChannel?.name || '...'} · @Name to mention`}
              disabled={sending || !selectedId}
              rows={1}
              style={{ flex: 1, resize: 'none', minHeight: 42, maxHeight: 140, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--brd)', color: 'var(--fg)', fontSize: 13, fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
              onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending || !selectedId}
              style={{ background: '#7F77DD', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed', opacity: input.trim() && !sending ? 1 : 0.4, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, height: 42 }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4 }}>Enter to send · Shift+Enter for new line</div>
        </div>
      </div>

      {/* New channel panel (admin only) */}
      {newChannelOpen && (
        <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid var(--brd)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>New Channel</div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Name</label>
            <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="e.g. design" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-0)', border: '1px solid var(--brd)', borderRadius: 6, color: 'var(--fg)', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
            <input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)} placeholder="What's this channel for?" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-0)', border: '1px solid var(--brd)', borderRadius: 6, color: 'var(--fg)', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Access</label>
            {ROLE_OPTIONS.map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={newChannelRoles.includes(r)}
                  onChange={e => setNewChannelRoles(prev => e.target.checked ? [...prev, r] : prev.filter(x => x !== r))}
                  style={{ accentColor: '#7F77DD' }} />
                <span style={{ textTransform: 'capitalize' }}>{ROLES[r]?.label || r}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={createChannel} disabled={!newChannelName.trim()} style={{ flex: 1, padding: '8px 0', background: '#7F77DD', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: newChannelName.trim() ? 'pointer' : 'not-allowed', opacity: newChannelName.trim() ? 1 : 0.5 }}>Create</button>
            <button onClick={() => setNewChannelOpen(false)} style={{ flex: 1, padding: '8px 0', background: 'var(--bg-2)', color: 'var(--mut)', border: '1px solid var(--brd)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
