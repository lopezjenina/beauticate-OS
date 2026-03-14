'use client';

import { useState } from 'react';
import { useTable } from '@/lib/hooks';
import { MetricCard, ProgressBar, Badge, PageHeader, AlertBanner, PageLoader, PrimaryButton } from '@/components/ui/shared';
import { useToast } from '@/components/ui/toast-provider';
import { formatPesoK, daysFromNow, WEEKS } from '@/lib/utils';
import { SALES_STAGES, PUBLISH_STATUSES, EDITORS, WEEKLY_TARGET } from '@/lib/constants';
import type { Sale, Client, PublishItem, AdCampaign, OnboardingItem, ActivityEntry } from '@/types';

export default function DashboardPage() {
  const { data: sales, loading } = useTable<Sale>('sales');
  const { data: clients } = useTable<Client>('clients');
  const { data: publishing } = useTable<PublishItem>('publishing');
  const { data: ads } = useTable<AdCampaign>('ads');
  const { data: onboarding } = useTable<OnboardingItem>('onboarding');
  const { data: logs } = useTable<ActivityEntry>('activity_log', 'created_at');
  const showToast = useToast();
  const [sendingReport, setSendingReport] = useState(false);

  const totalT = clients.reduce((a, b) => a + b.videos_target, 0);
  const totalC = clients.reduce((a, b) => a + b.videos_complete, 0);
  const rev = sales.filter(s => s.stage === 'closed_won').reduce((a, b) => a + b.deal_value, 0);
  const pipeVal = sales.filter(s => !['closed_won', 'closed_lost'].includes(s.stage)).reduce((a, b) => a + b.deal_value, 0);
  const pending = publishing.filter(p => ['pending_caption', 'approved'].includes(p.status)).length;
  const activeAds = ads.filter(a => a.status === 'active').length;
  const adSpend = ads.filter(a => a.status === 'active').reduce((a, b) => a + b.spent, 0);
  const behind = clients.filter(c => c.status === 'behind');
  const obPending = onboarding.filter(o => o.status !== 'complete');
  const rushContent = publishing.filter(p => p.scheduled_date && p.status !== 'posted' && daysFromNow(p.scheduled_date) < 7);

  const edLoad = EDITORS.map(ed => {
    const cl = clients.filter(c => c.editor === ed);
    return { editor: ed, target: cl.reduce((a, b) => a + b.videos_target, 0), complete: cl.reduce((a, b) => a + b.videos_complete, 0) };
  });

  const bottlenecks: { text: string; severity: string; detail?: string }[] = [];
  if (behind.length > 0) bottlenecks.push({ text: `${behind.length} client${behind.length > 1 ? 's' : ''} behind`, severity: 'high', detail: behind.map(c => c.name).join(', ') });
  if (rushContent.length > 0) bottlenecks.push({ text: `${rushContent.length} content violating 7-day rule`, severity: 'high' });
  if (pending > 2) bottlenecks.push({ text: `${pending} content pending`, severity: 'medium' });
  if (obPending.length > 0) bottlenecks.push({ text: `${obPending.length} in onboarding`, severity: 'low', detail: obPending.map(o => o.client_name).join(', ') });
  edLoad.forEach(el => { if (el.target > 22) bottlenecks.push({ text: `${el.editor} over capacity`, severity: 'high' }); });

  const sevC: Record<string, string> = { high: '#E24B4A', medium: '#EF9F27', low: '#378ADD' };

  const sendWeeklyReport = async () => {
    setSendingReport(true);
    try {
      const adminEmails = Object.entries(
        (await import('@/lib/constants')).TEAM_EMAILS
      ).filter(([, v]) => v.role === 'admin').map(([email]) => email);

      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly_report',
          to: adminEmails,
          data: {
            revenue: formatPesoK(rev),
            pipeline: formatPesoK(pipeVal),
            activeClients: clients.length,
            videosComplete: totalC,
            videosTarget: totalT,
            contentPending: pending,
            activeAds: activeAds,
            adSpend: formatPesoK(adSpend),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send');
      showToast('Weekly report sent to admins.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to send report.', 'error');
    } finally {
      setSendingReport(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Executive dashboard" subtitle="60-second visibility. If something is broken, you'll see it here.">
        <PrimaryButton onClick={sendWeeklyReport} disabled={sendingReport}>
          {sendingReport ? 'Sending...' : 'Email report'}
        </PrimaryButton>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <MetricCard label="Active clients" value={clients.length} accent="#7F77DD" />
        <MetricCard label="Revenue" value={formatPesoK(rev)} accent="#639922" />
        <MetricCard label="Videos this week" value={`${totalC}/${totalT}`} sub={`Target: ${WEEKLY_TARGET}`} accent="#378ADD" />
        <MetricCard label="Pipeline" value={formatPesoK(pipeVal)} accent="#D4537E" />
        <MetricCard label="Content pending" value={pending} accent={pending > 3 ? '#E24B4A' : '#1D9E75'} />
        <MetricCard label="Active ads" value={activeAds} sub={`${formatPesoK(adSpend)} spent`} accent="#EF9F27" />
      </div>

      {/* Weekly load */}
      <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--mut)' }}>Weekly load distribution</h3>
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {WEEKS.map(w => {
          const cl = clients.filter(c => c.week_num === w.num);
          const wT = cl.reduce((a, b) => a + b.videos_target, 0);
          const wC = cl.reduce((a, b) => a + b.videos_complete, 0);
          const ideal = Math.round(WEEKLY_TARGET / 4);
          const over = wT > ideal + 6;
          return (
            <div key={w.num} className="rounded-xl p-3.5" style={{ background: 'var(--bg-2)', border: `1px solid ${over ? 'rgba(226,75,74,0.35)' : 'var(--brd)'}` }}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold">{w.label}</span>
                {over && <Badge color="#E24B4A">Over</Badge>}
              </div>
              <div className="text-[11px] mb-2" style={{ color: 'var(--mut)' }}>{cl.length} clients · {wT} videos</div>
              <ProgressBar value={wC} max={wT} color={wC >= wT ? '#639922' : '#1D9E75'} h={8} />
              <div className="text-xs font-bold mt-1">{wC}/{wT}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Bottlenecks */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--mut)' }}>Bottlenecks ({bottlenecks.length})</h3>
          {bottlenecks.length === 0 ? (
            <AlertBanner type="success">All systems clear</AlertBanner>
          ) : (
            <div className="grid gap-2">
              {bottlenecks.map((b, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: sevC[b.severity] + '0D', border: `1px solid ${sevC[b.severity]}30` }}>
                  <div className="text-[13px] font-semibold" style={{ color: sevC[b.severity] }}>{b.text}</div>
                  {b.detail && <div className="text-xs mt-1" style={{ color: 'var(--mut)' }}>{b.detail}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor workload */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--mut)' }}>Editor workload</h3>
          <div className="grid gap-2">
            {edLoad.map(el => {
              const cap = Math.round(el.target / 22 * 100);
              const col = cap > 100 ? '#E24B4A' : cap > 80 ? '#EF9F27' : '#1D9E75';
              return (
                <div key={el.editor} className="rounded-lg p-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)' }}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] font-bold">{el.editor}</span>
                    <span className="text-[11px] font-semibold" style={{ color: col }}>{el.complete}/{el.target} · {cap}%</span>
                  </div>
                  <ProgressBar value={el.complete} max={el.target} color={col} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sales pipeline */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--mut)' }}>Sales pipeline</h3>
          <div className="grid gap-1.5">
            {SALES_STAGES.map(st => {
              const items = sales.filter(s => s.stage === st.key);
              const val = items.reduce((a, b) => a + b.deal_value, 0);
              return (
                <div key={st.key} className="flex items-center gap-2.5 rounded-lg p-2.5" style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: st.color }} />
                  <span className="text-[13px] flex-1">{st.label}</span>
                  <span className="text-xs font-bold" style={{ color: st.color }}>{formatPesoK(val)}</span>
                  <span className="text-[11px]" style={{ color: 'var(--mut)' }}>{items.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content + recent activity */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--mut)' }}>Content status</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {PUBLISH_STATUSES.map(s => (
              <div key={s.key} className="rounded-lg p-2.5" style={{ background: s.color + '0D', border: `1px solid ${s.color}25` }}>
                <div className="text-xl font-bold" style={{ color: s.color }}>{publishing.filter(p => p.status === s.key).length}</div>
                <div className="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--mut)' }}>Recent activity</h3>
          {logs.slice(0, 4).map(l => (
            <div key={l.id} className="text-xs py-1.5" style={{ color: 'var(--mut)', borderBottom: '1px solid var(--brd)' }}>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{l.action}</span> — {l.detail || l.board}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
