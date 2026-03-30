'use client';

import { useState } from 'react';
import { Avatar, Badge, Btn, Stat, PageHeader } from '@/components/ui';
import { AdCampaign, Client } from '@/lib/types';

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

export default function AdsPage({
  ads,
  setAds,
  clients,
}: {
  ads: AdCampaign[];
  setAds: (fn: (prev: AdCampaign[]) => AdCampaign[]) => void;
  clients: Client[];
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showModal, setShowModal] = useState(false);
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

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'meta':
        return '#2383E2';
      case 'google':
        return '#CB7F2C';
      case 'tiktok':
        return '#1A1A1A';
      default:
        return '#9B9B9B';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4DAB9A';
      case 'paused':
        return '#9B9B9B';
      case 'draft':
        return '#6B6B6B';
      case 'ended':
        return '#EB5757';
      default:
        return '#9B9B9B';
    }
  };

  const handleAddCampaign = () => {
    const newCampaign: AdCampaign = {
      id: `campaign-${Date.now()}`,
      clientId: formData.clientId,
      campaignName: formData.campaignName,
      platform: formData.platform as 'meta' | 'google' | 'tiktok',
      status: formData.status as 'active' | 'paused' | 'draft' | 'ended',
      budget: formData.budget,
      spent: formData.spent,
      creative: formData.creative,
      optimizationSchedule: formData.optimizationSchedule,
      notes: formData.notes,
    };

    setAds((prev) => [...prev, newCampaign]);
    setShowModal(false);
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
  };

  const toggleStatus = (id: string) => {
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === id
          ? {
              ...ad,
              status: ad.status === 'active' ? 'paused' : 'active',
            }
          : ad
      )
    );
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#F7F7F5',
            border: '1px solid #E3E3E0',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>
            Active Campaigns
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4DAB9A' }}>
            {stats.activeCampaigns}
          </div>
        </div>

        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#F7F7F5',
            border: '1px solid #E3E3E0',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>
            Total Monthly Budget
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1A1A1A' }}>
            {formatCurrency(stats.totalBudget)}
          </div>
        </div>

        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#F7F7F5',
            border: '1px solid #E3E3E0',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>
            Total Spent
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#EB5757' }}>
            {formatCurrency(stats.totalSpent)}
          </div>
        </div>

        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#F7F7F5',
            border: '1px solid #E3E3E0',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>
            Avg ROAS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2383E2' }}>
            {stats.avgRoas}x
          </div>
        </div>
      </div>

      {/* Filter Pills & Add Campaign Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all', 'active', 'paused', 'draft', 'ended'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border:
                  statusFilter === filter
                    ? '1px solid #1A1A1A'
                    : '1px solid #E3E3E0',
                backgroundColor:
                  statusFilter === filter ? '#1A1A1A' : '#FFFFFF',
                color:
                  statusFilter === filter ? '#FFFFFF' : '#1A1A1A',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== filter) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#F7F7F5';
                }
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== filter) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#FFFFFF';
                }
              }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <Btn variant="primary" onClick={() => setShowModal(true)}>New Campaign</Btn>
      </div>

      {/* Campaigns Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E3E3E0',
            borderRadius: '8px',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid #E3E3E0',
                backgroundColor: '#F7F7F5',
              }}
            >
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#6B6B6B',
                }}
              >
                Client Name
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#6B6B6B',
                }}
              >
                Campaign Name
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#6B6B6B',
                }}
              >
                Platform
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#6B6B6B',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'right',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#6B6B6B',
                }}
              >
                Budget
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'right',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#6B6B6B',
                }}
              >
                Spent
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#6B6B6B',
                }}
              >
                Creative
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#6B6B6B',
                }}
              >
                Optimization Schedule
              </th>
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#6B6B6B',
                }}
              >
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAds.map((ad) => (
              <tr
                key={ad.id}
                style={{
                  borderBottom: '1px solid #E3E3E0',
                }}
              >
                <td
                  style={{
                    padding: '1rem',
                    fontSize: '0.9rem',
                    color: '#1A1A1A',
                    fontWeight: '500',
                  }}
                >
                  {getClientName(ad.clientId)}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    fontSize: '0.9rem',
                    color: '#1A1A1A',
                  }}
                >
                  {ad.campaignName}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  <Badge variant={ad.platform === 'meta' ? 'active' : ad.platform === 'google' ? 'warning' : 'default'}>
                    {ad.platform.charAt(0).toUpperCase() + ad.platform.slice(1)}
                  </Badge>
                </td>
                <td
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <button
                    onClick={() => toggleStatus(ad.id)}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <Badge variant={ad.status === 'active' ? 'success' : ad.status === 'paused' ? 'warning' : ad.status === 'draft' ? 'default' : 'danger'}>
                      {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                    </Badge>
                  </button>
                </td>
                <td
                  style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontSize: '0.9rem',
                    color: '#1A1A1A',
                    fontFamily: 'monospace',
                  }}
                >
                  {formatCurrency(ad.budget)}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontSize: '0.9rem',
                    color: '#EB5757',
                    fontFamily: 'monospace',
                    fontWeight: '500',
                  }}
                >
                  {formatCurrency(ad.spent)}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    fontSize: '0.85rem',
                    color: '#9B9B9B',
                  }}
                >
                  {ad.creative}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    fontSize: '0.85rem',
                    color: '#9B9B9B',
                  }}
                >
                  {ad.optimizationSchedule}
                </td>
                <td
                  style={{
                    padding: '1rem',
                    fontSize: '0.85rem',
                    color: '#9B9B9B',
                  }}
                >
                  {ad.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Campaign Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E3E3E0',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '1.5rem',
              }}
            >
              New Campaign
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                >
                  Client
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) =>
                    setFormData({ ...formData, clientId: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E3E3E0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                >
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.campaignName}
                  onChange={(e) =>
                    setFormData({ ...formData, campaignName: e.target.value })
                  }
                  placeholder="Spring Sale 2024"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E3E3E0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#6B6B6B',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform: e.target.value as 'meta' | 'google' | 'tiktok',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #E3E3E0',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="meta">Meta</option>
                    <option value="google">Google</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#6B6B6B',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | 'active'
                          | 'paused'
                          | 'draft'
                          | 'ended',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #E3E3E0',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                    }}
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
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#6B6B6B',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Budget
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: parseFloat(e.target.value) })
                    }
                    placeholder="5000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #E3E3E0',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#6B6B6B',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Spent
                  </label>
                  <input
                    type="number"
                    value={formData.spent}
                    onChange={(e) =>
                      setFormData({ ...formData, spent: parseFloat(e.target.value) })
                    }
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #E3E3E0',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                >
                  Creative
                </label>
                <input
                  type="text"
                  value={formData.creative}
                  onChange={(e) =>
                    setFormData({ ...formData, creative: e.target.value })
                  }
                  placeholder="Spring Carousel v2"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E3E3E0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                >
                  Optimization Schedule
                </label>
                <input
                  type="text"
                  value={formData.optimizationSchedule}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      optimizationSchedule: e.target.value,
                    })
                  }
                  placeholder="Bi-weekly"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E3E3E0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                >
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Testing new audience segment"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E3E3E0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1.5rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid #E3E3E0',
                  backgroundColor: '#FFFFFF',
                  color: '#1A1A1A',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#F7F7F5';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#FFFFFF';
                }}
              >
                Cancel
              </button>
              <Btn
                variant="primary"
                onClick={handleAddCampaign}
              >
                Create Campaign
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
