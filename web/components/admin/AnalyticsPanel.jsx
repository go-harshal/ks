'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/client';

const TIP = { background: 'var(--a-surface)', border: '1px solid var(--a-border)', borderRadius: 4, color: 'var(--a-text)' };

/** Consent-based website analytics. `compact` = dashboard widget (top 5 pages, no chart). */
export default function AnalyticsPanel({ range = '30', compact = false }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api(`/admin/analytics?range=${range}`).then((r) => setD(r.data)).catch((e) => setErr(e.message)); }, [range]);
  if (err) return <div className="adm-empty"><span>{err}</span></div>;
  if (!d) return <p className="adm-sub" style={{ padding: 16 }}>Loading analytics…</p>;
  const pages = compact ? d.pages.slice(0, 5) : d.pages;
  return (
    <div className="adm-w-body" style={{ display: 'grid', gap: 18 }} data-testid={compact ? 'widget-analytics' : 'analytics-panel'}>
      <div className="adm-conv" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div><span className="adm-kpi-label">Page views</span><span className="adm-kpi-value" data-testid="analytics-views">{d.totals.views}</span></div>
        <div><span className="adm-kpi-label">Visits</span><span className="adm-kpi-value" data-testid="analytics-sessions">{d.totals.sessions}</span></div>
        <div><span className="adm-kpi-label">Enquiries</span><span className="adm-kpi-value">{d.totals.enquiries}</span></div>
        <div><span className="adm-kpi-label">Visit → enquiry</span><span className="adm-kpi-value" data-testid="analytics-conversion">{d.totals.conversion === null ? '—' : `${d.totals.conversion}%`}</span></div>
      </div>
      {!compact && (
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={d.series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--a-border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={11} minTickGap={16} />
              <YAxis stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={TIP} />
              <Area type="monotone" dataKey="Views" stroke="var(--a-chart-2)" strokeWidth={2} fill="var(--a-accent-soft)" />
              <Area type="monotone" dataKey="Sessions" stroke="var(--a-chart-1)" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="adm-table-wrap"><table className="adm-table" data-testid="analytics-top-pages">
        <thead><tr><th>Page</th><th>Views</th><th>Visits</th><th>Landings</th><th>Enquiries</th><th>Conversion</th></tr></thead>
        <tbody>
          {pages.length === 0 && <tr><td colSpan={6}><span className="adm-sub">No visits recorded yet. Only visitors who accept analytics cookies are counted.</span></td></tr>}
          {pages.map((p) => (
            <tr key={p.path} style={{ cursor: 'default' }} data-testid={`analytics-page-${p.path}`}>
              <td><b>{p.path}</b></td><td>{p.views}</td><td>{p.sessions}</td><td>{p.entries}</td><td>{p.enquiries}</td><td>{p.conversion === null ? '—' : `${p.conversion}%`}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {!compact && d.sources.length > 0 && <p className="adm-sub" data-testid="analytics-sources">Visit sources: {d.sources.map((s) => `${s.source} ${s.sessions}`).join(' · ')}</p>}
      <p className="adm-sub" style={{ fontSize: '0.76rem' }}>
        Counts only visitors who accepted analytics cookies. Conversion = enquiries from consented visits ÷ visits that landed on the page first.{d.unattributed ? ` ${d.unattributed} of ${d.totals.enquiries} enquiries came from visitors who declined analytics, so they are not attributed.` : ''}
        {compact && <> <Link href="/phobos/analytics" data-testid="analytics-open-full">Full report →</Link></>}
      </p>
    </div>
  );
}
