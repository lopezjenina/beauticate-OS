'use client';

import { useState, useMemo } from 'react';
import { Client, Video, Lead, AdCampaign } from '@/lib/types';
import { Badge } from '@/components/ui';

interface GlobalSearchProps {
  clients: Client[];
  videos: Video[];
  leads: Lead[];
  ads: AdCampaign[];
  onNavigate: (page: string) => void;
}

export function GlobalSearch({ clients, videos, leads, ads, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const items: { type: string; name: string; sub: string; page: string }[] = [];

    clients.forEach(c => {
      if (c.name.toLowerCase().includes(q))
        items.push({ type: "Client", name: c.name, sub: `$${c.monthlyRevenue}/mo · Week ${c.week}`, page: "production" });
    });

    leads.forEach(l => {
      if (l.company.toLowerCase().includes(q) || l.contactName.toLowerCase().includes(q))
        items.push({ type: "Lead", name: l.company, sub: `${l.contactName} · ${l.stage}`, page: "sales" });
    });

    videos.forEach(v => {
      if (v.title.toLowerCase().includes(q)) {
        const clientName = clients.find(c => c.id === v.clientId)?.name || "";
        items.push({ type: "Video", name: v.title, sub: `${clientName} · ${v.platform}`, page: "production" });
      }
    });

    ads.forEach(a => {
      if (a.campaignName.toLowerCase().includes(q))
        items.push({ type: "Campaign", name: a.campaignName, sub: `${a.platform} · ${a.status}`, page: "ads" });
    });

    return items.slice(0, 10);
  }, [query, clients, videos, leads, ads]);

  const typeColors: Record<string, string> = {
    Client: "success",
    Lead: "warning",
    Video: "active",
    Campaign: "default",
  };

  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%", padding: "7px 10px", borderRadius: 6,
          border: "1px solid var(--border)", fontSize: 12,
          background: "var(--bg)", color: "var(--text)",
          fontFamily: "inherit", outline: "none",
          boxSizing: "border-box",
        }}
      />

      {isOpen && results.length > 0 && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4,
          background: "#FFF", border: "1px solid #E3E3E0", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200,
          maxHeight: 320, overflow: "auto",
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={() => { onNavigate(r.page); setQuery(''); setIsOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 14px",
                border: "none", background: "transparent", cursor: "pointer",
                borderBottom: i < results.length - 1 ? "1px solid #EBEBEA" : "none",
                display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit",
              }}
            >
              <Badge variant={typeColors[r.type]}>{r.type}</Badge>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#9B9B9B" }}>{r.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
