'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/hooks';
import { ROLES } from '@/lib/constants';
import { ChevronLeft, Users, Settings, Trash2, X, Send, Hash } from 'lucide-react';
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
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color + '22', color, border: `1px solid ${color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, letterSpacing: '-0.01em',
    }}>
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
          ? <span key={i} style={{ color: isOwn ? '#d4d0ff' : '#a49ff5', fontWeight: 700 }}>{part}</span>
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
  const [showMembers, setShowMembers] = useState(false);

  // Channel editing
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', allowed_roles: [] as string[] });
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState<Channel | null>(null);

  // Mobile: track which panel is visible
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'channels' | 'chat'>('channels');

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

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const filtered = profiles.filter(p => p.id !== user?.id && p.name.toLowerCase().includes(query)).slice(0, 6);
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
        e.preventDefault(); insertMention(mentionSuggestions[mentionIdx]); return;
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

  const openEditChannel = (ch: Channel) => {
    setEditForm({ name: ch.name, description: ch.description || '', allowed_roles: [...ch.allowed_roles] });
    setEditingChannel(ch);
    setNewChannelOpen(false);
  };

  const updateChannel = async () => {
    if (!editingChannel || !editForm.name.trim()) return;
    setEditSaving(true);
    const { data, error } = await supabase
      .from('channels')
      .update({ name: editForm.name.trim(), description: editForm.description.trim(), allowed_roles: editForm.allowed_roles })
      .eq('id', editingChannel.id)
      .select().single();
    if (!error && data) {
      setChannels(prev => prev.map(c => c.id === editingChannel.id ? data as Channel : c));
      setEditingChannel(data as Channel);
    }
    setEditSaving(false);
  };

  const deleteChannel = async (ch: Channel) => {
    const { error } = await supabase.from('channels').delete().eq('id', ch.id);
    if (!error) {
      setChannels(prev => prev.filter(c => c.id !== ch.id));
      if (selectedId === ch.id) {
        const remaining = channels.filter(c => c.id !== ch.id);
        setSelectedId(remaining[0]?.id || null);
      }
      setEditingChannel(null);
      setConfirmDeleteChannel(null);
    }
  };

  const toggleRole = (r: string) => {
    setEditForm(prev => ({
      ...prev,
      allowed_roles: prev.allowed_roles.includes(r)
        ? prev.allowed_roles.filter(x => x !== r)
        : [...prev.allowed_roles, r],
    }));
  };

  const selectChannel = (id: string) => {
    setSelectedId(id);
    setShowMembers(false);
    setEditingChannel(null);
    if (isMobile) setMobilePanel('chat');
  };

  const grouped = messages.map((msg, i) => ({
    ...msg,
    isFirst: i === 0 || messages[i - 1].user_id !== msg.user_id,
    isOwn: msg.user_id === user?.id,
  }));

  const channelMembers = useMemo(() =>
    profiles.filter(p => selectedChannel?.allowed_roles?.includes(p.role)),
    [profiles, selectedChannel]
  );

  const ROLE_OPTIONS = ['admin', 'editor', 'social', 'viewer'];

  if (loadingChannels) {
    return <div style={{ padding: 40, color: 'var(--mut)', fontSize: 13 }}>Loading channels...</div>;
  }

  // ── Shared: channel list panel ─────────────────────────
  const ChannelList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 14px 10px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Channels
        </span>
      </div>

      {/* Channel list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {channels.map(ch => {
          const isActive = selectedId === ch.id;
          const isEditing = editingChannel?.id === ch.id;
          return (
            <div
              key={ch.id}
              className="ch-row"
              style={{
                display: 'flex', alignItems: 'center',
                borderRadius: 7, marginBottom: 1,
                background: isActive ? 'rgba(127,119,221,0.14)' : 'transparent',
                transition: 'background 0.12s',
              }}
            >
              <button
                onClick={() => selectChannel(ch.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0,
                  padding: isMobile ? '11px 10px' : '7px 10px',
                  background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                  color: isActive ? '#a49ff5' : 'var(--mut)',
                  fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                  borderRadius: 7,
                }}
              >
                <Hash size={13} style={{ opacity: isActive ? 0.9 : 0.5, flexShrink: 0, color: isActive ? '#a49ff5' : 'var(--mut)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? 'var(--fg)' : 'var(--mut)' }}>{ch.name}</span>
              </button>
              {role?.canManageUsers && (
                <button
                  className="ch-gear"
                  onClick={e => { e.stopPropagation(); isEditing ? setEditingChannel(null) : openEditChannel(ch); }}
                  aria-label={`Settings for ${ch.name}`}
                  style={{
                    background: isEditing ? 'rgba(127,119,221,0.18)' : 'transparent',
                    border: 'none', color: isEditing ? '#a49ff5' : 'var(--mut)',
                    cursor: 'pointer', padding: '6px 8px', opacity: isEditing ? 1 : 0,
                    transition: 'opacity 0.15s, color 0.12s', flexShrink: 0, borderRadius: 5,
                  }}
                >
                  <Settings size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* New channel button */}
      {role?.canManageUsers && (
        <div style={{ padding: '10px 8px 12px' }}>
          <button
            onClick={() => setNewChannelOpen(o => !o)}
            style={{
              width: '100%', padding: '8px 10px',
              background: newChannelOpen ? 'rgba(127,119,221,0.12)' : 'transparent',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 7, color: 'var(--mut)', fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.12s',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1, color: 'rgba(255,255,255,0.3)' }}>+</span>
            <span>New channel</span>
          </button>
        </div>
      )}
    </div>
  );

  // ── Shared: message thread panel ───────────────────────
  const ChatPanel = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
      {/* Channel header */}
      <div style={{
        padding: isMobile ? '10px 14px' : '12px 20px',
        borderBottom: '1px solid var(--brd)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-1)',
      }}>
        {isMobile && (
          <button
            onClick={() => setMobilePanel('channels')}
            style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: '4px 2px', display: 'flex', alignItems: 'center' }}
            aria-label="Back to channels"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Hash size={14} style={{ color: '#a49ff5' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg)' }}>{selectedChannel?.name || 'Select a channel'}</h2>
            {selectedChannel?.description && !isMobile && (
              <p style={{ margin: 0, color: 'var(--mut)', fontSize: 11 }}>{selectedChannel.description}</p>
            )}
          </div>
        </div>
        {/* Member count badge (desktop) */}
        {!isMobile && channelMembers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brd)', borderRadius: 6, padding: '4px 10px' }}>
            <Users size={12} style={{ color: 'var(--mut)' }} />
            <span style={{ fontSize: 12, color: 'var(--mut)', fontWeight: 600 }}>{channelMembers.length}</span>
          </div>
        )}
        {/* Members toggle (mobile only) */}
        {isMobile && (
          <button
            onClick={() => setShowMembers(v => !v)}
            style={{ background: showMembers ? 'rgba(127,119,221,0.14)' : 'rgba(255,255,255,0.04)', border: '1px solid var(--brd)', color: showMembers ? '#a49ff5' : 'var(--mut)', cursor: 'pointer', padding: '5px 7px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4 }}
            aria-label="Toggle members"
          >
            <Users size={14} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>{channelMembers.length}</span>
          </button>
        )}
      </div>

      {/* Mobile members overlay */}
      {isMobile && showMembers && (
        <div style={{ position: 'absolute', top: 52, right: 0, width: 230, background: 'var(--bg-1)', border: '1px solid var(--brd)', borderRadius: '0 0 0 12px', zIndex: 50, maxHeight: '60dvh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
          <div style={{ padding: '12px 14px 8px', fontSize: 10, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--brd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Members · {channelMembers.length}</span>
            <button onClick={() => setShowMembers(false)} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
          </div>
          <div style={{ padding: '6px 0' }}>
            {channelMembers.map(p => {
              const rc = ROLES[p.role];
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 14px' }}>
                  <Avatar name={p.name} color={rc?.color || '#888780'} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg)' }}>{p.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: rc?.color || '#888' }}>{rc?.label || p.role}</div>
                  </div>
                  {p.id === user?.id && <span style={{ fontSize: 10, color: 'var(--mut)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>you</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 14px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {loadingMessages ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)', fontSize: 13 }}>Loading...</div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 40, color: 'var(--mut)', fontSize: 13, gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Hash size={22} style={{ color: '#a49ff5' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>#{selectedChannel?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--mut)' }}>Be the first to say something!</div>
          </div>
        ) : (
          grouped.map((msg, idx) => {
            const sender = profileMap[msg.user_id];
            const senderRole = ROLES[sender?.role || 'viewer'];
            const roleColor = senderRole?.color || '#888780';
            const showAvatar = msg.isFirst;
            const isLast = idx === grouped.length - 1 || grouped[idx + 1].user_id !== msg.user_id;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  paddingTop: msg.isFirst ? (idx === 0 ? 4 : 16) : 1,
                  paddingBottom: isLast ? 2 : 0,
                  flexDirection: msg.isOwn ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar column */}
                <div style={{ width: 34, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                  {showAvatar && <Avatar name={msg.user_name} color={roleColor} size={34} />}
                </div>

                {/* Message column */}
                <div style={{ maxWidth: isMobile ? '82%' : '66%', display: 'flex', flexDirection: 'column', alignItems: msg.isOwn ? 'flex-end' : 'flex-start' }}>
                  {msg.isFirst && (
                    <div style={{ display: 'flex', gap: 7, alignItems: 'baseline', marginBottom: 5, flexDirection: msg.isOwn ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: msg.isOwn ? '#a49ff5' : roleColor }}>{msg.isOwn ? 'You' : msg.user_name}</span>
                      {senderRole && !msg.isOwn && !isMobile && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: roleColor, background: roleColor + '15', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.02em' }}>{senderRole.label}</span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--mut)' }}>{timeLabel(msg.created_at)}</span>
                    </div>
                  )}
                  <div style={{
                    padding: '9px 14px',
                    borderRadius: 14,
                    borderBottomRightRadius: msg.isOwn ? 4 : 14,
                    borderBottomLeftRadius: msg.isOwn ? 14 : 4,
                    background: msg.isOwn ? 'linear-gradient(135deg, #8B84E6 0%, #6B63CC 100%)' : 'var(--bg-2)',
                    color: msg.isOwn ? '#fff' : 'var(--fg)',
                    border: msg.isOwn ? 'none' : '1px solid var(--brd)',
                    fontSize: 13.5, lineHeight: 1.55,
                    wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                    boxShadow: msg.isOwn ? '0 2px 12px rgba(127,119,221,0.25)' : 'none',
                  }}>
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
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--brd)', padding: isMobile ? '10px 12px 12px' : '12px 20px 16px', background: 'var(--bg-1)' }}>
        <div style={{ position: 'relative' }}>
          {/* @mention popover */}
          {mentionSuggestions.length > 0 && (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: isMobile ? 0 : 52, background: 'var(--bg-1)', border: '1px solid var(--brd)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
              <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Mention someone</div>
              {mentionSuggestions.map((p, i) => {
                const rc = ROLES[p.role];
                return (
                  <button
                    key={p.id}
                    onMouseDown={e => { e.preventDefault(); insertMention(p); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', background: i === mentionIdx ? 'rgba(127,119,221,0.1)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Avatar name={p.name} color={rc?.color || '#888780'} size={28} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: rc?.color || '#888', background: (rc?.color || '#888') + '15', padding: '2px 8px', borderRadius: 4 }}>{rc?.label || p.role}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Input row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 12, padding: '4px 4px 4px 14px', transition: 'border-color 0.15s' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder={`Message #${selectedChannel?.name || '...'}`}
              disabled={sending || !selectedId}
              rows={1}
              style={{
                flex: 1, resize: 'none', minHeight: 36, maxHeight: 120,
                background: 'transparent', border: 'none',
                color: 'var(--fg)', fontSize: 13.5, fontFamily: 'inherit',
                outline: 'none', lineHeight: 1.5, padding: '6px 0',
              }}
              onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }}
              onFocus={e => { e.currentTarget.parentElement!.style.borderColor = 'rgba(127,119,221,0.45)'; }}
              onBlur={e => { e.currentTarget.parentElement!.style.borderColor = 'var(--brd)'; }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending || !selectedId}
              style={{
                background: input.trim() && !sending ? 'linear-gradient(135deg, #8B84E6 0%, #6B63CC 100%)' : 'rgba(255,255,255,0.05)',
                color: input.trim() && !sending ? '#fff' : 'var(--mut)',
                border: 'none', borderRadius: 9,
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s', flexShrink: 0,
              }}
              aria-label="Send message"
            >
              {sending ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <Send size={15} />}
            </button>
          </div>
          {!isMobile && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>Enter to send · Shift+Enter for new line · @ to mention</div>
          )}
        </div>
      </div>
    </div>
  );

  // ── MOBILE layout ───────────────────────────────────────
  if (isMobile) {
    const containerHeight = 'calc(100dvh - 52px - 68px - 20px)';
    return (
      <div style={{ position: 'relative', height: containerHeight, display: 'flex', flexDirection: 'column', margin: '0 -14px' }}>
        {mobilePanel === 'channels' ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ChannelList />
            {editingChannel && (
              <div style={{ borderTop: '1px solid var(--brd)' }}>
                <ChannelEditPanel ch={editingChannel} onClose={() => setEditingChannel(null)} />
              </div>
            )}
            {newChannelOpen && !editingChannel && role?.canManageUsers && (
              <div style={{ borderTop: '1px solid var(--brd)' }}>
                <NewChannelForm onClose={() => setNewChannelOpen(false)} />
              </div>
            )}
          </div>
        ) : (
          <ChatPanel />
        )}
      </div>
    );
  }

  // ── DESKTOP layout ──────────────────────────────────────
  return (
    <>
    <div style={{ display: 'flex', height: '100vh', gap: 0, margin: '-24px -28px' }}>
      {/* Channel list sidebar */}
      <div style={{ width: 210, flexShrink: 0, borderRight: '1px solid var(--brd)', background: 'var(--bg-1)' }}>
        <ChannelList />
      </div>

      {/* Message area */}
      <ChatPanel />

      {/* Right panel */}
      <div style={{ width: 240, flexShrink: 0, borderLeft: '1px solid var(--brd)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--bg-1)' }}>
        {editingChannel ? (
          <ChannelEditPanel ch={editingChannel} onClose={() => setEditingChannel(null)} />
        ) : newChannelOpen && role?.canManageUsers ? (
          <NewChannelForm onClose={() => setNewChannelOpen(false)} />
        ) : (
          <MembersPanel />
        )}
      </div>
    </div>

    {/* Delete channel confirm */}
    {confirmDeleteChannel && (
      <div onClick={() => setConfirmDeleteChannel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20, backdropFilter: 'blur(4px)' }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-1)', borderRadius: 14, border: '1px solid var(--brd)', width: 380, maxWidth: '96vw', padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Trash2 size={18} style={{ color: '#f87171' }} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>Delete #{confirmDeleteChannel.name}?</h3>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--mut)', lineHeight: 1.6 }}>All messages in this channel will be permanently deleted. This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmDeleteChannel(null)} style={{ background: 'transparent', color: 'var(--mut)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
            <button onClick={() => deleteChannel(confirmDeleteChannel)} style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Delete channel</button>
          </div>
        </div>
      </div>
    )}
    </>
  );

  // ── Shared panel components ─────────────────────────────

  function MembersPanel() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid var(--brd)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            Members
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)' }}>{channelMembers.length}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {channelMembers.map(p => {
            const rc = ROLES[p.role];
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', borderRadius: 0 }}>
                <Avatar name={p.name} color={rc?.color || '#888780'} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                    {p.id === user?.id && <span style={{ fontSize: 10, color: 'var(--mut)', marginLeft: 5, fontWeight: 400 }}>you</span>}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: rc?.color || '#888', letterSpacing: '0.02em' }}>{rc?.label || p.role}</div>
                </div>
              </div>
            );
          })}
          {channelMembers.length === 0 && (
            <div style={{ padding: '20px 12px', color: 'var(--mut)', fontSize: 12, textAlign: 'center' }}>No members</div>
          )}
        </div>
      </div>
    );
  }

  function NewChannelForm({ onClose }: { onClose: () => void }) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--fg)' }}>New Channel</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: 5, borderRadius: 5, display: 'flex' }}><X size={13} /></button>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 600, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</label>
          <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="e.g. design" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-0)', border: '1px solid var(--brd)', borderRadius: 7, color: 'var(--fg)', fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 600, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
          <input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)} placeholder="What's this channel for?" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-0)', border: '1px solid var(--brd)', borderRadius: 7, color: 'var(--fg)', fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Who can access</label>
          {ROLE_OPTIONS.map(r => {
            const rc = ROLES[r];
            const members = profiles.filter(p => p.role === r);
            return (
              <label key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: newChannelRoles.includes(r) ? 'rgba(127,119,221,0.06)' : 'transparent', border: `1px solid ${newChannelRoles.includes(r) ? 'rgba(127,119,221,0.2)' : 'transparent'}`, transition: 'all 0.12s' }}>
                <input type="checkbox" checked={newChannelRoles.includes(r)}
                  onChange={e => setNewChannelRoles(prev => e.target.checked ? [...prev, r] : prev.filter(x => x !== r))}
                  style={{ accentColor: '#7F77DD', marginTop: 2 }} />
                <div>
                  <span style={{ fontWeight: 700, color: rc?.color || 'var(--fg)' }}>{rc?.label || r}</span>
                  {members.length > 0 && <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 2 }}>{members.map(m => m.name).join(', ')}</div>}
                </div>
              </label>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
          <button onClick={createChannel} disabled={!newChannelName.trim()} style={{ flex: 1, padding: '9px 0', background: 'linear-gradient(135deg, #8B84E6 0%, #6B63CC 100%)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: newChannelName.trim() ? 'pointer' : 'not-allowed', opacity: newChannelName.trim() ? 1 : 0.5 }}>Create</button>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'var(--bg-2)', color: 'var(--mut)', border: '1px solid var(--brd)', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    );
  }

  function ChannelEditPanel({ ch, onClose }: { ch: Channel; onClose: () => void }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--brd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Channel settings</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', marginTop: 1 }}>#{ch.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}><X size={13} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 700, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Channel name</label>
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-0)', border: '1px solid var(--brd)', borderRadius: 7, color: 'var(--fg)', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 700, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
            <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="What's this channel for?" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-0)', border: '1px solid var(--brd)', borderRadius: 7, color: 'var(--fg)', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 700, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Who can access</label>
            {ROLE_OPTIONS.map(r => {
              const rc = ROLES[r];
              const members = profiles.filter(p => p.role === r);
              const hasAccess = editForm.allowed_roles.includes(r);
              return (
                <div key={r} style={{ marginBottom: 8, padding: '8px 10px', background: hasAccess ? 'rgba(127,119,221,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hasAccess ? 'rgba(127,119,221,0.25)' : 'var(--brd)'}`, borderRadius: 8, transition: 'all 0.12s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasAccess} onChange={() => toggleRole(r)} style={{ accentColor: '#7F77DD' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: rc?.color || 'var(--fg)', flex: 1 }}>{rc?.label || r}</span>
                    <span style={{ fontSize: 11, color: 'var(--mut)', background: 'rgba(255,255,255,0.05)', padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>{members.length}</span>
                  </label>
                  {members.length > 0 && (
                    <div style={{ marginTop: 6, paddingLeft: 24, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {members.map(m => (
                        <span key={m.id} style={{ fontSize: 11, color: hasAccess ? 'var(--fg)' : 'var(--mut)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 10 }}>{m.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={updateChannel}
            disabled={editSaving || !editForm.name.trim()}
            style={{ width: '100%', padding: '9px 0', background: 'linear-gradient(135deg, #8B84E6 0%, #6B63CC 100%)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.6 : 1 }}
          >
            {editSaving ? 'Saving...' : 'Save changes'}
          </button>
          {!ch.is_default && (
            <button
              onClick={() => setConfirmDeleteChannel(ch)}
              style={{ width: '100%', padding: '9px 0', background: 'rgba(248,113,113,0.06)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Trash2 size={13} /> Delete channel
            </button>
          )}
          {ch.is_default && (
            <p style={{ fontSize: 11, color: 'var(--mut)', textAlign: 'center', margin: 0 }}>Default channels cannot be deleted.</p>
          )}
        </div>
      </div>
    );
  }
}
