'use client';

import React, { useState } from 'react';
import { Avatar, Badge, Btn, ProgressBar, Checkbox, PageHeader, EmptyState, ConfirmModal } from '@/components/ui';
import { OnboardingClient } from '@/lib/types';
import { TEAM } from '@/lib/store';

interface OnboardingPageProps {
  onboardingClients: OnboardingClient[];
  setOnboardingClients: (fn: (prev: OnboardingClient[]) => OnboardingClient[]) => void;
  onMoveToProduction: (client: OnboardingClient) => void;
  canDelete?: boolean;
}

export default function OnboardingPage({
  onboardingClients,
  setOnboardingClients,
  onMoveToProduction,
  canDelete = false,
}: OnboardingPageProps) {
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<OnboardingClient | null>(null);

  const checklistItems = [
    { id: 'contractSigned', label: 'Contract Signed' },
    { id: 'invoicePaid', label: 'Invoice Paid' },
    { id: 'strategyCallDone', label: 'Strategy Call Done' },
    { id: 'shootScheduled', label: 'Shoot Scheduled' },
    { id: 'editorAssigned', label: 'Editor Assigned' },
    { id: 'socialManagerAssigned', label: 'Social Manager Assigned' },
  ];

  const getCompletionPercentage = (client: OnboardingClient): number => {
    const completed = checklistItems.filter((item) => client.steps[item.id as keyof typeof client.steps]).length;
    return Math.round((completed / checklistItems.length) * 100);
  };

  const handleToggleChecklist = (clientId: string, itemId: string) => {
    setOnboardingClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? {
              ...client,
              steps: {
                ...client.steps,
                [itemId]: !client.steps[itemId as keyof typeof client.steps],
              },
            }
          : client
      )
    );
  };

  const handleSelectTeamMember = (
    clientId: string,
    itemId: string,
    memberId: string
  ) => {
    setOnboardingClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? {
              ...client,
              steps: {
                ...client.steps,
                [itemId]: true,
              },
              [itemId === 'editorAssigned' ? 'assignedEditor' : 'assignedSocialManager']: memberId,
            }
          : client
      )
    );
  };

  const handleFieldChange = (clientId: string, field: keyof OnboardingClient, value: string) => {
    setOnboardingClients((prev) =>
      prev.map((client) =>
        client.id === clientId ? { ...client, [field]: value } : client
      )
    );
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: 13,
    border: "1px solid #E3E3E0",
    borderRadius: 6,
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const isAllComplete = (client: OnboardingClient): boolean => {
    return getCompletionPercentage(client) === 100;
  };

  const getTeamMembersForRole = (role: string) => {
    return TEAM.filter((member) => member.role === role);
  };

  if (onboardingClients.length === 0) {
    return (
      <div style={{ padding: '40px' }}>
        <PageHeader title="Onboarding Gate" subtitle="Move clients from Sales to Production" />
        <div style={{ marginTop: '56px' }}>
          <EmptyState
            title="No clients in onboarding"
            subtitle="Clients will appear here when they enter the onboarding phase."
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <PageHeader
        title="Onboarding Gate"
        subtitle="Move clients from Sales to Production"
      />

      <div style={{ marginTop: '40px' }}>
        <div
          style={{
            backgroundColor: '#FCE8E6',
            border: '1px solid #EB5757',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '32px',
            color: '#A1261D',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          All steps must be completed before entering production
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {onboardingClients.map((client) => {
            const isExpanded = expandedClientId === client.id;
            const completionPercent = getCompletionPercentage(client);
            const isComplete = isAllComplete(client);
            const completedCount = checklistItems.filter(
              (item) => client.steps[item.id as keyof typeof client.steps]
            ).length;

            return (
              <div
                key={client.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E3E3E0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() =>
                    setExpandedClientId(isExpanded ? null : client.id)
                  }
                  style={{
                    padding: '24px',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#F7F7F5' : '#FFFFFF',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '24px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                        {client.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '12px' }}>
                        {client.package} package - Started {client.startDate}
                      </div>
                      <ProgressBar
                        value={completionPercent}
                        max={100}
                        color={isComplete ? '#4DAB9A' : '#2383E2'}
                      />
                      <div style={{ fontSize: '12px', color: '#9B9B9B', marginTop: '8px' }}>
                        {completedCount} of {checklistItems.length} steps
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      backgroundColor: '#F7F7F5',
                      borderTop: '1px solid #E3E3E0',
                      padding: '24px',
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                      <div>
                        <label style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 4, display: "block" }}>Package</label>
                        <select
                          value={client.package}
                          onChange={(e) => handleFieldChange(client.id, "package", e.target.value)}
                          style={inputStyle}
                        >
                          <option value="Starter">Starter</option>
                          <option value="Growth">Growth</option>
                          <option value="Pro">Pro</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 4, display: "block" }}>Start Date</label>
                        <input
                          type="date"
                          value={client.startDate}
                          onChange={(e) => handleFieldChange(client.id, "startDate", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 4, display: "block" }}>Contact Email</label>
                        <input
                          type="email"
                          value={client.contactEmail || ""}
                          onChange={(e) => handleFieldChange(client.id, "contactEmail", e.target.value)}
                          placeholder="email@example.com"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 4, display: "block" }}>Phone</label>
                        <input
                          type="tel"
                          value={client.phone || ""}
                          onChange={(e) => handleFieldChange(client.id, "phone", e.target.value)}
                          placeholder="(555) 000-0000"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {checklistItems.map((item) => {
                        const isChecked = client.steps[item.id as keyof typeof client.steps];
                        const isTeamMemberDropdown = item.id === 'editorAssigned' || item.id === 'socialManagerAssigned';

                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <Checkbox
                                checked={isChecked}
                                onChange={() => handleToggleChecklist(client.id, item.id)}
                              />
                              <span style={{ fontSize: '14px', color: '#1A1A1A' }}>
                                {item.label}
                              </span>
                            </div>

                            {isTeamMemberDropdown && isChecked && (
                              <select
                                value={
                                  item.id === 'editorAssigned'
                                    ? client.assignedEditor || ''
                                    : client.assignedSocialManager || ''
                                }
                                onChange={(e) =>
                                  handleSelectTeamMember(client.id, item.id, e.target.value)
                                }
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  border: '1px solid #E3E3E0',
                                  backgroundColor: '#FFFFFF',
                                  fontSize: '12px',
                                  color: '#1A1A1A',
                                  cursor: 'pointer',
                                }}
                              >
                                <option value="">Select {item.id === 'editorAssigned' ? 'Editor' : 'Social Manager'}</option>
                                {getTeamMembersForRole(
                                  item.id === 'editorAssigned' ? 'editor' : 'social_manager'
                                ).map((member) => (
                                  <option key={member.id} value={member.id}>
                                    {member.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 4, display: "block" }}>Notes</label>
                      <textarea
                        rows={2}
                        value={client.notes || ""}
                        onChange={(e) => handleFieldChange(client.id, "notes", e.target.value)}
                        placeholder="Add notes..."
                        style={{ ...inputStyle, resize: "vertical" }}
                      />
                    </div>

                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #E3E3E0", display: "flex", justifyContent: "space-between", gap: 12 }}>
                      {canDelete && (
                        <button
                          onClick={() => setDeletingClient(client)}
                          style={{
                            background: "transparent", border: "1px solid var(--border)",
                            borderRadius: 6, padding: "12px 24px", fontSize: 14,
                            color: "var(--red)", cursor: "pointer", fontWeight: 500,
                            fontFamily: "inherit",
                          }}
                        >
                          Remove Client
                        </button>
                      )}
                      <Btn
                        onClick={() => onMoveToProduction(client)}
                        disabled={!isComplete}
                        style={{
                          flex: 1,
                          background: isComplete ? '#4DAB9A' : '#E3E3E0',
                          color: isComplete ? '#FFFFFF' : '#9B9B9B',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: isComplete ? 'pointer' : 'not-allowed',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        Move to Production
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {deletingClient && (
        <ConfirmModal
          title="Remove Client"
          message={`Remove ${deletingClient.name} from onboarding? This cannot be undone.`}
          onConfirm={() => {
            setOnboardingClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
            if (expandedClientId === deletingClient.id) setExpandedClientId(null);
            setDeletingClient(null);
          }}
          onCancel={() => setDeletingClient(null)}
        />
      )}
    </div>
  );
}
