'use client';

import { useState } from 'react';
import { Btn, PageHeader, Badge, ConfirmModal, FileUploadArea, AttachmentList, LinkInput, showToast } from '@/components/ui';
import { AdCampaign, Client, Attachment } from '@/lib/types';

type StatusFilter = 'all' | 'active' | 'paused' | 'draft' | 'ended';

interface NewCampaignForm {
  clientId: string;
  campaignName: string;
  platform: 'meta' | 'google' | 'tiktok';
  status: 'active' | 'paused' | 'draft' | 'ended';
  budget: number;
  spent: number;
  creative: string;
  optimizationSchedule: string;
  notes: string;
}

const cellInputStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: "0.85rem",
  border: "1px solid #D0D0CE",
  borderRadius: 6,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#FFF",
  outline: "none",
  transition: "border-color 0.15s",
};

export default function AdsPage({
  ads,
  setAds,
  clients,
  canDelete = false,
}: {
  ads: AdCampaign[];
  setAds: (fn: (prev: AdCampaign[]) => AdCampaign[]) => void;
  clients: Client[];
  canDelete?: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<AdCampaign | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<any>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [formAttachments, setFormAttachments] = useState<Attachment[]>([]);
  const [formData, setFormData] = useState<NewCampaignForm>({
    clientId: clients[0]?.id || '',
    campaignName: '',
    platform: 'meta',
    status: 'draft',
    budget: 0,
    spent: 0,
    creative: '',
    optimizationSchedule: '',
    notes: '',
  });

  const filteredAds =
    statusFilter === 'all'
      ? ads
      : ads.filter((ad) => ad.status === statusFilter);

  const stats = {
    activeCampaigns: ads.filter((a) => a.status === 'active').length,
    totalBudget: ads.reduce((sum, a) => sum + a.budget, 0),
    totalSpent: ads.reduce((sum, a) => sum + a.spent, 0),
    avgRoas: 3.2,
  };

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || clientId;
  };

  const resetForm = () => {
    setFormData({
      clientId: clients[0]?.id || '',
      campaignName: '',
      platform: 'meta',
      status: 'draft',
      budget: 0,
      spent: 0,
      creative: '',
      optimizationSchedule: '',
      notes: '',
    });
    setFormAttachments([]);
    setShowModal(false);
  };

  const handleEditCampaign = (campaign: AdCampaign) => {
    setEditingRowId(campaign.id);
    setEditRowData({
      clientId: campaign.clientId,
      campaignName: campaign.campaignName,
      platform: campaign.platform,
      status: campaign.status,
      budget: campaign.budget,
      spent: campaign.spent,
      creative: campaign.creative,
      optimizationSchedule: campaign.optimizationSchedule,
      notes: campaign.notes,
    });
  };

  const handleSaveInlineEdit = () => {
    if (!editingRowId || !editRowData) return;
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === editingRowId
          ? {
              ...ad,
              clientId: editRowData.clientId,
              campaignName: editRowData.campaignName,
              platform: editRowData.platform,
              status: editRowData.status,
              budget: editRowData.budget,
              spent: editRowData.spent,
              creative: editRowData.creative,
              optimizationSchedule: editRowData.optimizationSchedule,
              notes: editRowData.notes,
            }
          : ad
      )
    );
    showToast(`"${editRowData.campaignName}" saved`, "success");
    setEditingRowId(null);
    setEditRowData(null);
  };

  const handleCancelInlineEdit = () => {
    setEditingRowId(null);
    setEditRowData(null);
  };

  const handleAddCampaign = () => {
    const newCampaign: AdCampaign = {
      id: `campaign-${Date.now()}`,
      clientId: formData.clientId,
      campaignName: formData.campaignName,
      platform: formData.platform,
      status: formData.status,
      budget: formData.budget,
      spent: formData.spent,
      creative: formData.creative,
      optimizationSchedule: formData.optimizationSchedule,
      notes: formData.notes,
      attachments: formAttachments.length > 0 ? formAttachments : undefined,
    };
    setAds((prev) => [...prev, newCampaign]);
    showToast(`"${formData.campaignName}" created`, "success");
    resetForm();
  };

  const toggleStatus = (id: string) => {
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === id
          ? { ...ad, status: ad.status === 'active' ? 'paused' : 'active' }
          : ad
      )
    );
  };

  const handleFilesSelected = (files: { name: string; url: string; type: "image" | "video" | "document" }[]) => {
    const newAttachments: Attachment[] = files.map((f, i) => ({
      id: `att-${Date.now()}-${i}`,
      name: f.name,
      url: f.url,
      type: f.type,
      thumbnailUrl: f.type === "image" ? f.url : undefined,
      addedAt: new Date().toISOString(),
    }));
    setFormAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleLinkAdd = (link: { name: string; url: string }) => {
    setFormAttachments((prev) => [...prev, {
      id: `att-${Date.now()}`,
      name: link.name,
      url: link.url,
      type: "link" as const,
      addedAt: new Date().toISOString(),
    }]);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <div>
        <PageHeader title="Ads Management" />
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#F7F7F5', border: '1px solid #E3E3E0', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>Active Campaigns</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4DAB9A' }}>{stats.activeCampaigns}</div>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#F7F7F5', border: '1px solid #E3E3E0', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>Total Monthly Budget</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1A1A1A' }}>{formatCurrency(stats.totalBudget)}</div>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#F7F7F5', border: '1px solid #E3E3E0', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>Total Spent</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#EB5757' }}>{formatCurrency(stats.totalSpent)}</div>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#F7F7F5', border: '1px solid #E3E3E0', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>Avg ROAS</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2383E2' }}>{stats.avgRoas}x</div>
        </div>
      </div>

      {/* Filter Pills & Add Campaign Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all', 'active', 'paused', 'draft', 'ended'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '6px',
                border: statusFilter === filter ? '1px solid #1A1A1A' : '1px solid #E3E3E0',
                backgroundColor: statusFilter === filter ? '#1A1A1A' : '#FFFFFF',
                color: statusFilter === filter ? '#FFFFFF' : '#1A1A1A',
                fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (statusFilter !== filter) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F7F7F5'; }}
              onMouseLeave={(e) => { if (statusFilter !== filter) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF'; }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <Btn variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>New Campaign</Btn>
      </div>

      {/* Campaigns Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#FFFFFF', border: '1px solid #E3E3E0', borderRadius: '8px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E3E3E0', backgroundColor: '#F7F7F5' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B' }}>Client Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B' }}>Campaign Name</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B' }}>Platform</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B' }}>Budget</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B' }}>Spent</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B' }}>Creative</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B' }}>Schedule</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAds.map((ad) => {
              const isEditing = editingRowId === ad.id;
              const isHovered = hoveredRowId === ad.id;
              return (
                <tr
                  key={ad.id}
                  style={{
                    borderBottom: '1px solid #E3E3E0',
                    backgroundColor: isEditing ? '#F8F7FF' : isHovered ? '#FAFAF8' : undefined,
                    outline: isEditing ? '2px solid #5B5FC7' : 'none',
                    borderRadius: isEditing ? 8 : 0,
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={() => { if (!isEditing) setHoveredRowId(ad.id); }}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  {/* Client Name */}
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#1A1A1A', fontWeight: '500' }}>
                    {isEditing ? (
                      <select
                        value={editRowData.clientId}
                        onChange={(e) => setEditRowData({ ...editRowData, clientId: e.target.value })}
                        style={cellInputStyle}
                      >
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    ) : (
                      getClientName(ad.clientId)
                    )}
                  </td>

                  {/* Campaign Name */}
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#1A1A1A' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editRowData.campaignName}
                        onChange={(e) => setEditRowData({ ...editRowData, campaignName: e.target.value })}
                        style={cellInputStyle}
                      />
                    ) : (
                      <>
                        {ad.campaignName}
                        {ad.attachments && ad.attachments.length > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginLeft: 6 }}>
                            {ad.attachments.length} file{ad.attachments.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </>
                    )}
                  </td>

                  {/* Platform */}
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {isEditing ? (
                      <select
                        value={editRowData.platform}
                        onChange={(e) => setEditRowData({ ...editRowData, platform: e.target.value })}
                        style={cellInputStyle}
                      >
                        <option value="meta">Meta</option>
                        <option value="google">Google</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                    ) : (
                      <Badge variant={ad.platform === 'meta' ? 'active' : ad.platform === 'google' ? 'warning' : 'default'}>
                        {ad.platform.charAt(0).toUpperCase() + ad.platform.slice(1)}
                      </Badge>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {isEditing ? (
                      <select
                        value={editRowData.status}
                        onChange={(e) => setEditRowData({ ...editRowData, status: e.target.value })}
                        style={cellInputStyle}
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="draft">Draft</option>
                        <option value="ended">Ended</option>
                      </select>
                    ) : (
                      <button onClick={() => toggleStatus(ad.id)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: 0 }}>
                        <Badge variant={ad.status === 'active' ? 'success' : ad.status === 'paused' ? 'warning' : ad.status === 'draft' ? 'default' : 'danger'}>
                          {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                        </Badge>
                      </button>
                    )}
                  </td>

                  {/* Budget */}
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.9rem', color: '#1A1A1A', fontFamily: 'monospace' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editRowData.budget}
                        onChange={(e) => setEditRowData({ ...editRowData, budget: parseFloat(e.target.value) || 0 })}
                        style={{ ...cellInputStyle, textAlign: 'right' }}
                      />
                    ) : (
                      formatCurrency(ad.budget)
                    )}
                  </td>

                  {/* Spent */}
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.9rem', color: '#EB5757', fontFamily: 'monospace', fontWeight: '500' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editRowData.spent}
                        onChange={(e) => setEditRowData({ ...editRowData, spent: parseFloat(e.target.value) || 0 })}
                        style={{ ...cellInputStyle, textAlign: 'right' }}
                      />
                    ) : (
                      formatCurrency(ad.spent)
                    )}
                  </td>

                  {/* Creative */}
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#9B9B9B' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editRowData.creative}
                        onChange={(e) => setEditRowData({ ...editRowData, creative: e.target.value })}
                        style={cellInputStyle}
                      />
                    ) : (
                      ad.creative
                    )}
                  </td>

                  {/* Schedule */}
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#9B9B9B' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editRowData.optimizationSchedule}
                        onChange={(e) => setEditRowData({ ...editRowData, optimizationSchedule: e.target.value })}
                        style={cellInputStyle}
                      />
                    ) : (
                      ad.optimizationSchedule
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={handleSaveInlineEdit}
                          style={{
                            border: 'none', background: '#5B5FC7', color: '#FFFFFF',
                            fontSize: '0.8rem', cursor: 'pointer', padding: '6px 14px',
                            borderRadius: 6, fontFamily: 'inherit', fontWeight: 600,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#4A4EB3'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#5B5FC7'; }}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelInlineEdit}
                          style={{
                            border: 'none', background: 'transparent', color: '#6B6B6B',
                            fontSize: '0.8rem', cursor: 'pointer', padding: '6px 14px',
                            borderRadius: 6, fontFamily: 'inherit', fontWeight: 500,
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#1A1A1A'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6B6B6B'; }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditCampaign(ad)}
                          style={{
                            border: 'none', background: 'transparent',
                            color: isHovered ? '#6B6B6B' : '#C0C0BC',
                            fontSize: '0.8rem', cursor: 'pointer', padding: '4px 8px',
                            borderRadius: 4, fontFamily: 'inherit',
                            transition: 'color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F0F0EE'; (e.currentTarget as HTMLElement).style.color = '#1A1A1A'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = isHovered ? '#6B6B6B' : '#C0C0BC'; }}
                        >
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeletingCampaign(ad)}
                            style={{
                              border: 'none', background: 'transparent',
                              color: isHovered ? '#EB5757' : '#C0C0BC',
                              fontSize: '0.8rem', cursor: 'pointer', padding: '4px 8px',
                              borderRadius: 4, fontFamily: 'inherit',
                              transition: 'color 0.15s, background 0.15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FDECEC'; (e.currentTarget as HTMLElement).style.color = '#EB5757'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = isHovered ? '#EB5757' : '#C0C0BC'; }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Campaign Modal (create only) */}
      {showModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={resetForm}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E3E3E0',
              padding: '2rem', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1A1A1A', marginBottom: '1.5rem' }}>
              New Campaign
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Client</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Campaign Name</label>
                <input
                  type="text" value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="Spring Sale 2024"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as 'meta' | 'google' | 'tiktok' })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                  >
                    <option value="meta">Meta</option>
                    <option value="google">Google</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' | 'draft' | 'ended' })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Budget</label>
                  <input
                    type="number" value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                    placeholder="5000"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Spent</label>
                  <input
                    type="number" value={formData.spent}
                    onChange={(e) => setFormData({ ...formData, spent: parseFloat(e.target.value) })}
                    placeholder="0"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Creative</label>
                <input
                  type="text" value={formData.creative}
                  onChange={(e) => setFormData({ ...formData, creative: e.target.value })}
                  placeholder="Spring Carousel v2"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Optimization Schedule</label>
                <input
                  type="text" value={formData.optimizationSchedule}
                  onChange={(e) => setFormData({ ...formData, optimizationSchedule: e.target.value })}
                  placeholder="Bi-weekly"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Notes</label>
                <input
                  type="text" value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Testing new audience segment"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              {/* Attachments */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Attachments</label>
                <FileUploadArea onFilesSelected={handleFilesSelected} />
                <div style={{ marginTop: 10 }}>
                  <LinkInput onAdd={handleLinkAdd} />
                </div>
                <AttachmentList
                  attachments={formAttachments}
                  onRemove={(id) => setFormAttachments((prev) => prev.filter((a) => a.id !== id))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <Btn onClick={resetForm}>Cancel</Btn>
              <Btn variant="primary" onClick={handleAddCampaign}>
                Create Campaign
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingCampaign && (
        <ConfirmModal
          title="Delete Campaign"
          message={`This will permanently remove "${deletingCampaign.campaignName}" and its data.`}
          onConfirm={() => {
            showToast(`"${deletingCampaign.campaignName}" deleted`, "error");
            setAds((prev) => prev.filter((a) => a.id !== deletingCampaign!.id));
            setDeletingCampaign(null);
          }}
          onCancel={() => setDeletingCampaign(null)}
        />
      )}
    </div>
  );
}
