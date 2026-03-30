export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csv = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

import { Client, Video, Lead, AdCampaign } from './types';

export function exportClients(clients: Client[]) {
  downloadCsv('clients.csv',
    ['Name', 'Monthly Revenue', 'Week', 'Status', 'Editor', 'Shoot Date'],
    clients.map(c => [c.name, String(c.monthlyRevenue), String(c.week), c.status, c.assignedEditor, c.shootDate || ''])
  );
}

export function exportLeads(leads: Lead[]) {
  downloadCsv('leads.csv',
    ['Company', 'Contact', 'Email', 'Phone', 'Source', 'Revenue', 'Stage', 'Created'],
    leads.map(l => [l.company, l.contactName, l.email, l.phone, l.source, String(l.estimatedRevenue), l.stage, l.createdAt])
  );
}

export function exportVideos(videos: Video[]) {
  downloadCsv('videos.csv',
    ['Title', 'Client ID', 'Platform', 'Status', 'Shoot Date', 'Due Date', 'Posted', 'Revisions'],
    videos.map(v => [v.title, v.clientId, v.platform, v.editingStatus, v.shootDate, v.dueDate, String(v.posted), String(v.revisionsUsed)])
  );
}

export function exportCampaigns(ads: AdCampaign[]) {
  downloadCsv('campaigns.csv',
    ['Campaign', 'Client ID', 'Platform', 'Status', 'Budget', 'Spent'],
    ads.map(a => [a.campaignName, a.clientId, a.platform, a.status, String(a.budget), String(a.spent)])
  );
}
