'use client';

import React, { useState, useMemo } from 'react';
import { ConfirmModal, PageHeader, Stat, FilterPills } from '@/components/ui';
import { TEAM } from '@/lib/store';
import type { Client } from '@/lib/types';

interface ClientsPageProps {
  clients: Client[];
  setClients: (fn: (prev: Client[]) => Client[]) => void;
  canDelete?: boolean;
}

const PACKAGES = ['Starter', 'Growth', 'Pro', 'Enterprise'];
const STATUS_OPTIONS: { value: Client['status']; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'churned', label: 'Churned' },
];
const WEEKS: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

export default function ClientsPage({ clients, setClients, canDelete = false }: ClientsPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const editors = TEAM.filter((m) => m.role === 'editor');
  const socialManagers = TEAM.filter((m) => m.role === 'social_manager');

  const filtered = useMemo(() => {
    let list = clients;
    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.contactEmail || '').toLowerCase().includes(q) ||
          (c.package || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, statusFilter, search]);

  const totalClients = clients.length;
  const activeCount = clients.filter((c) => c.status === 'active').length;
  const churnedCount = clients.filter((c) => c.status === 'churned').length;
  const totalMRR = clients
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + c.monthlyRevenue, 0);

  const handleFieldChange = (clientId: string, field: keyof Client, value: string | number) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, [field]: value } : c))
    );
  };

  const teamName = (id: string) => TEAM.find((m) => m.id === id)?.name || id;

  const cellStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 13,
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-ter)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    background: 'var(--bg-sub)',
    position: 'sticky' as const,
    top: 0,
  };

  const inlineSelect: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: 12,
    border: '1px solid var(--border)',
    borderRadius: 4,
    background: '#FFF',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const inlineInput: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: 12,
    border: '1px solid var(--border)',
    borderRadius: 4,
    width: 80,
    fontFamily: 'inherit',
  };

  return (
    <div>
      <PageHeader title="Clients" subtitle="All graduated clients from onboarding" />

      <div style={{ display: 'flex', gap: 16, marginTop: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <Stat label="Total Clients" value={totalClients} />
        <Stat label="Active" value={activeCount} />
        <Stat label="Churned" value={churnedCount} />
        <Stat label="Total MRR" value={`$${totalMRR.toLocaleString()}`} />
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: 13,
            border: '1px solid var(--border)',
            borderRadius: 6,
            width: 240,
            fontFamily: 'inherit',
          }}
        />
        <FilterPills
          options={[
            { value: null, label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'churned', label: 'Churned' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Name</th>
              <th style={headerCellStyle}>Package</th>
              <th style={headerCellStyle}>Monthly Revenue</th>
              <th style={headerCellStyle}>Week</th>
              <th style={headerCellStyle}>Editor</th>
              <th style={headerCellStyle}>Social Manager</th>
              <th style={headerCellStyle}>Status</th>
              <th style={headerCellStyle}>Contact Email</th>
              <th style={headerCellStyle}>Phone</th>
              {canDelete && <th style={headerCellStyle}></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canDelete ? 10 : 9} style={{ ...cellStyle, textAlign: 'center', color: 'var(--text-ter)', padding: 32 }}>
                  No clients found
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id}>
                  <td style={{ ...cellStyle, fontWeight: 500 }}>{client.name}</td>
                  <td style={cellStyle}>
                    <select
                      value={client.package || ''}
                      onChange={(e) => handleFieldChange(client.id, 'package', e.target.value)}
                      style={inlineSelect}
                    >
                      <option value="">--</option>
                      {PACKAGES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="number"
                      value={client.monthlyRevenue}
                      onChange={(e) => handleFieldChange(client.id, 'monthlyRevenue', Number(e.target.value))}
                      style={inlineInput}
                    />
                  </td>
                  <td style={cellStyle}>
                    <select
                      value={client.week}
                      onChange={(e) => handleFieldChange(client.id, 'week', Number(e.target.value))}
                      style={inlineSelect}
                    >
                      {WEEKS.map((w) => (
                        <option key={w} value={w}>Week {w}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...cellStyle, fontSize: 12 }}>{teamName(client.assignedEditor)}</td>
                  <td style={{ ...cellStyle, fontSize: 12 }}>{teamName(client.assignedSocialManager)}</td>
                  <td style={cellStyle}>
                    <select
                      value={client.status}
                      onChange={(e) => handleFieldChange(client.id, 'status', e.target.value)}
                      style={inlineSelect}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...cellStyle, fontSize: 12, color: 'var(--text-sec)' }}>{client.contactEmail || '-'}</td>
                  <td style={{ ...cellStyle, fontSize: 12, color: 'var(--text-sec)' }}>{client.phone || '-'}</td>
                  {canDelete && (
                    <td style={cellStyle}>
                      <button
                        onClick={() => setDeletingClient(client)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--red)',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deletingClient && (
        <ConfirmModal
          title="Remove Client"
          message={`Remove ${deletingClient.name}? This cannot be undone.`}
          onConfirm={() => {
            setClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
            setDeletingClient(null);
          }}
          onCancel={() => setDeletingClient(null)}
        />
      )}
    </div>
  );
}
