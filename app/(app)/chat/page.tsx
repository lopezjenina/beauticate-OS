'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: color + '25', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.375, fontWeight: 700 }}>
      {getInitials(name)}
    </div>
  );
}

function MessageContent({ content, isOwn }: { content: string; isOwn: boolean }) {
  const parts = content.split(/(@[\w][\w\s]*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        /^@\w/.test(part)
          ? <span key={i} style={{ color: isOwn ? '#d4d0ff' : '#7F77DD', fontWeight: 700 }}>{part}</span>
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

  // @mention autocomplete
  const [mentionSuggestions, setMentionSuggestions] = useState<Profile[]>([]);
  const [mentionIdx, setMentionIdx] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  const selectedChannel = channels.find(c => c.id === selectedId);
  const profileMap = useMemo(() => Object.fromEntries(profiles.map(p => [p.id, p])), [profiles]);

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

  // Realtime subscription
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
    const pattern = /@([\w]+(?:\s[\w]+)*)/g;
    const names = [...content.matchAll(pattern)].map(m => m[1].toLowerCase());
    return profiles
      .filter(p => names.some(n => p.name.toLowerCase() === n) && p.id !== user?.id)
      .map(p => p.id);
  }, [profiles, user?.id]);

  // @mention detection in input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const cursor = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);

    if (match) {
      const query = match[1].toLowerCase();
      const filtered = profiles
        .filter(p => p.id !== user?.id && p.name.toLowerCase().includes(query))
        .slice(0, 6);
      setMentionSuggestions(filtered);
      setMentionIdx(0);
    } else {
      setMentionSuggestions([]);
    }
  };

  const insertMention = useCallback((profile: Profile) => {
    const cursor = inputRef.current?.selectionStart ?? input.length;
    const textBefore = input.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (!match) return;

    const start = cursor - match[0].length;
    const newInput = input.slice(0, start) + `@${profile.name} ` + input.slice(cursor);
    setInput(newInput);
    setMentionSuggestions([]);

    setTimeout(() => {
      if (inputRef.current) {
        const pos = start + profile.name.length + 2;
        inputRef.current.selectionStart = pos;
        inputRef.current.selectionEnd = pos;
        inputRef.current.focus();
      }
    }, 0);
  }, [input]);

  const send = async () => {
    const content = input.trim();
    if (!content || !user || sending || !selectedId) return;

    setSending(true);
    setInput('');
    setMentionSuggestions([]);

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
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(content);
    } else if (saved) {
      setMessages(prev => prev.map(m => m.id === tempId ? saved as Message : m));
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
    if (mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, mentionSuggestions.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Tab' || (e.key === 'Enter' && mentionSuggestions[mentionIdx])) {
        e.preventDefault();
        insertMention(mentionSuggestions[mentionIdx]);
        return;
      }
      if (e.key === 'Escape') { setMentionSuggestions([]); return; }
    }
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

  // Channel members: profiles whose role is in allowed_roles
  const channelMembers = useMemo(() =>
    profiles.filter(p => selectedChannel?.allowed_roles?.includes(p.role)),
    [profiles, selectedChannel]
  );

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
                color: selectedId === ch.id ? '#7F77DD' : 'var(--fg)',
                fontSize: 13, fontWeight: selectedId === ch.id ? 600 : 400,
                borderRadius: 0, opacity: selectedId === ch.id ? 1 : 0.65,
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.6 }}>#</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
            </button>
          ))}
        </div>
        {role?.canManageUsers && (
          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--brd)' }}>
            <button
              onClick={() => setNewChannelOpen(o => !o)}
              style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 6, color: 'var(--fg)', fontSize: 12, cursor: 'pointer', opacity: 0.8 }}
            >
              + New channel
            </button>
          </div>
        )}
      </div>

      {/* Message area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Channel header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--brd)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--mut)', fontSize: 18, lineHeight: 1 }}>#</span>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{selectedChannel?.name || 'Select a channel'}</h2>
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
              const sender = profileMap[msg.user_id];
              const senderRole = ROLES[sender?.role || 'viewer'];
              const roleColor = senderRole?.color || '#888780';
              return (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: msg.isFirst ? '10px 0 2px' : '1px 0', flexDirection: msg.isOwn ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 32, flexShrink: 0 }}>
                    {msg.isFirst && <Avatar name={msg.user_name} color={roleColor} />}
                  </div>
                  <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: msg.isOwn ? 'flex-end' : 'flex-start' }}>
                    {msg.isFirst && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4, flexDirection: msg.isOwn ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: roleColor }}>{msg.isOwn ? 'You' : msg.user_name}</span>
                        {senderRole && !msg.isOwn && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: roleColor, background: roleColor + '18', padding: '1px 6px', borderRadius: 4 }}>{senderRole.label}</span>
                        )}
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
          <div style={{ position: 'relative' }}>
            {/* @mention dropdown */}
            {mentionSuggestions.length > 0 && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 60, background: 'var(--bg-1)', border: '1px solid var(--brd)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.45)', zIndex: 100 }}>
                <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mention someone</div>
                {mentionSuggestions.map((p, i) => {
                  const rc = ROLES[p.role];
                  return (
                    <button
                      key={p.id}
                      onMouseDown={e => { e.preventDefault(); insertMention(p); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', background: i === mentionIdx ? 'rgba(127,119,221,0.12)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Avatar name={p.name} color={rc?.color || '#888780'} size={28} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: rc?.color || '#888', background: (rc?.color || '#888') + '18', padding: '2px 8px', borderRadius: 4 }}>{rc?.label || p.role}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKey}
                placeholder={`Message #${selectedChannel?.name || '...'} · Type @ to mention`}
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
            <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 5 }}>Enter to send · Shift+Enter for new line · @ to mention</div>
          </div>
        </div>
      </div>

      {/* Right panel: Members or New Channel form */}
      <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid var(--brd)', display: 'flex', flexDirection: 'column' }}>
        {newChannelOpen && role?.canManageUsers ? (
          // New channel form
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
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
                  <span style={{ textTransform: 'capitalize', color: 'var(--fg)' }}>{ROLES[r]?.label || r}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
              <button onClick={createChannel} disabled={!newChannelName.trim()} style={{ flex: 1, padding: '8px 0', background: '#7F77DD', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: newChannelName.trim() ? 'pointer' : 'not-allowed', opacity: newChannelName.trim() ? 1 : 0.5 }}>Create</button>
              <button onClick={() => setNewChannelOpen(false)} style={{ flex: 1, padding: '8px 0', background: 'var(--bg-2)', color: 'var(--fg)', border: '1px solid var(--brd)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          // Members panel
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '14px 14px 8px', fontSize: 11, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--brd)' }}>
              Members · {channelMembers.length}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {channelMembers.map(p => {
                const rc = ROLES[p.role];
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px' }}>
                    <Avatar name={p.name} color={rc?.color || '#888780'} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: rc?.color || '#888' }}>{rc?.label || p.role}</div>
                    </div>
                    {p.id === user?.id && (
                      <span style={{ fontSize: 10, color: 'var(--mut)' }}>you</span>
                    )}
                  </div>
                );
              })}
              {channelMembers.length === 0 && (
                <div style={{ padding: '20px 12px', color: 'var(--mut)', fontSize: 12, textAlign: 'center' }}>No members</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
