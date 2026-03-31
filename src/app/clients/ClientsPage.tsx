'use client';

import React, { useState, useMemo } from 'react';
import { ConfirmModal, PageHeader, Stat, FilterPills } from '@/components/ui';
import type { Client } from '@/lib/types';
import { upsertClient } from '@/lib/db';
import { getPackageNames } from '@/app/packages/PackagesPage';

interface ClientsPageProps {
  clients: Client[];
  setClients: (fn: (prev: Client[]) => Client[]) => void;
  canDelete?: boolean;
}
const STATUS_OPTIONS: { value: Client['status']; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'churned', label: 'Churned' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = ['#4A90D9', '#7B68EE', '#E8913A', '#50B88E', '#D94A6E', '#6BC5D9', '#9B6BD9', '#D9A84A'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ClientsPage({ clients, setClients, canDelete = false }: ClientsPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [editingExpandedId, setEditingExpandedId] = useState<string | null>(null);

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
    setClients((prev) => {
      const updated = prev.map((c) => (c.id === clientId ? { ...c, [field]: value } : c));
      const updatedClient = updated.find(c => c.id === clientId);
      if (updatedClient) upsertClient(updatedClient);
      return updated;
    });
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
    width: 90,
    fontFamily: 'inherit',
  };

  const statusBadge = (status: string) => {
    const isActive = status === 'active';
    return {
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 500 as const,
      borderRadius: 10,
      background: isActive ? '#E8F5E9' : '#FFEBEE',
      color: isActive ? '#2E7D32' : '#C62828',
    };
  };

  const packageBadge = () => ({
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 500 as const,
    borderRadius: 10,
    background: '#F0F0F0',
    color: '#555',
  });

  return (
    <div>
      <PageHeader title="Clients" subtitle="Contact directory" />

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

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-ter)', padding: 32, fontSize: 13 }}>
            No clients found
          </div>
        ) : (
          filtered.map((client, idx) => {
            const isExpanded = expandedClientId === client.id;
            const isEditing = editingExpandedId === client.id;
            return (
              <React.Fragment key={client.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 20px',
                    borderBottom: (!isExpanded && idx < filtered.length - 1) ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.1s',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => {
                    setExpandedClientId(isExpanded ? null : client.id);
                    if (isExpanded) setEditingExpandedId(null);
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FAFAFA'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {/* Chevron */}
                  <div style={{
                    flex: '0 0 16px',
                    fontSize: 12,
                    color: 'var(--text-ter)',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}>
                    {'\u25B6'}
                  </div>

                  {/* Avatar */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: avatarColor(client.name),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#FFF',
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {getInitials(client.name)}
                  </div>

                  {/* Name + badges */}
                  <div style={{ flex: '1 1 180px', minWidth: 140 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>
                      {client.name}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {client.package && (
                        <span style={packageBadge()}>{client.package}</span>
                      )}
                      <span style={statusBadge(client.status)}>
                        {client.status === 'active' ? 'Active' : 'Churned'}
                      </span>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div style={{ flex: '0 0 120px', textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>
                      ${client.monthlyRevenue.toLocaleString()}/mo
                    </div>
                  </div>

                  {/* Contact info summary */}
                  <div style={{ flex: '1 1 180px', minWidth: 120 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>
                      {client.contactEmail || '-'}
                    </div>
                  </div>

                  {/* Delete */}
                  {canDelete && (
                    <div style={{ flex: '0 0 auto' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingClient(client); }}
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
                    </div>
                  )}
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div style={{
                    background: '#F7F7F5',
                    padding: '16px 20px',
                    borderTop: '1px solid #E3E3E0',
                    borderBottom: '1px solid #E3E3E0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>Client Details</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingExpandedId(isEditing ? null : client.id); }}
                        style={{
                          padding: '4px 12px',
                          fontSize: 12,
                          border: '1px solid #E3E3E0',
                          borderRadius: 4,
                          background: isEditing ? '#1A1A1A' : '#FFF',
                          color: isEditing ? '#FFF' : '#1A1A1A',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontWeight: 500,
                        }}
                      >
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px' }}>
                      {/* Contact Person */}
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-ter)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Person</div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={client.contactPerson || ''}
                            onChange={(e) => handleFieldChange(client.id, 'contactPerson', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ ...inlineInput, width: '100%' }}
                          />
                        ) : (
                          <div style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>{client.contactPerson || '-'}</div>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-ter)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
                        {isEditing ? (
                          <input
                            type="email"
                            value={client.contactEmail || ''}
                            onChange={(e) => handleFieldChange(client.id, 'contactEmail', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ ...inlineInput, width: '100%' }}
                          />
                        ) : (
                          client.contactEmail ? (
                            <a href={`mailto:${client.contactEmail}`} onClick={(e) => e.stopPropagation()} style={{ color: '#4A90D9', textDecoration: 'none', fontSize: 13 }}>
                              {client.contactEmail}
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-ter)', fontSize: 13 }}>-</span>
                          )
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-ter)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</div>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={client.phone || ''}
                            onChange={(e) => handleFieldChange(client.id, 'phone', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ ...inlineInput, width: '100%' }}
                          />
                        ) : (
                          client.phone ? (
                            <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()} style={{ color: '#4A90D9', textDecoration: 'none', fontSize: 13 }}>
                              {client.phone}
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-ter)', fontSize: 13 }}>-</span>
                          )
                        )}
                      </div>

                      {/* Package */}
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-ter)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Package</div>
                        {isEditing ? (
                          <select
                            value={client.package || ''}
                            onChange={(e) => handleFieldChange(client.id, 'package', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={inlineSelect}
                          >
                            <option value="">--</option>
                            {getPackageNames().map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: 13, color: '#1A1A1A' }}>{client.package || '-'}</span>
                        )}
                      </div>

                      {/* Monthly Revenue */}
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-ter)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Revenue</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={client.monthlyRevenue}
                            onChange={(e) => handleFieldChange(client.id, 'monthlyRevenue', Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            style={{ ...inlineInput, width: '100%' }}
                          />
                        ) : (
                          <span style={{ fontSize: 13, color: '#1A1A1A' }}>${client.monthlyRevenue.toLocaleString()}</span>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-ter)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                        {isEditing ? (
                          <select
                            value={client.status}
                            onChange={(e) => handleFieldChange(client.id, 'status', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={inlineSelect}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={statusBadge(client.status)}>
                            {client.status === 'active' ? 'Active' : 'Churned'}
                          </span>
                        )}
                      </div>

                      {/* Graduated From */}
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-ter)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onboarding ID</div>
                        <span style={{ fontSize: 13, color: '#1A1A1A' }}>{client.graduatedFrom || '-'}</span>
                      </div>

                      {/* Notes */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-ter)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</div>
                        {isEditing ? (
                          <textarea
                            value={client.notes || ''}
                            onChange={(e) => handleFieldChange(client.id, 'notes', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            rows={3}
                            style={{ ...inlineInput, width: '100%', resize: 'vertical' as const }}
                          />
                        ) : (
                          <span style={{ fontSize: 13, color: '#1A1A1A' }}>{client.notes || '-'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
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
