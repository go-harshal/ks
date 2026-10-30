'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, EyeOff, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/client';
import StatusBadge from './StatusBadge';
import AnalyticsPanel from './AnalyticsPanel';

const RANGES = [
  { key: 'today', label: 'Today' }, { key: '7', label: 'Last 7 days' }, { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' }, { key: 'custom', label: 'Custom' },
];
const WIDGETS = {
  kpis: { title: 'Pipeline summary', span: 12 },
  followups: { title: 'Follow-ups', span: 6 },
  conversion: { title: 'Conversion', span: 6 },
  trend: { title: 'Monthly enquiry trend (last 6 months)', span: 8 },
  sources: { title: 'Lead sources', span: 4 },
  distribution: { title: 'Enquiries by type', span: 6 },
  recent: { title: 'Recent enquiries', span: 6 },
  workqueue: { title: 'Content & careers queue', span: 12 },
  analytics: { title: 'Website visits & top pages', span: 12 },
};
const DEFAULT_LAYOUT = Object.keys(WIDGETS).map((id) => ({ id, visible: true }));
const LAYOUT_KEY = 'ks-dashboard-layout-v2';
const TIP = { background: 'var(--a-surface)', border: '1px solid var(--a-border)', borderRadius: 4, color: 'var(--a-text)' };
const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' });

export default function Dashboard() {
  const [range, setRange] = useState('30');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [customizing, setCustomizing] = useState(false);
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [fuTab, setFuTab] = useState('overdue');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
      if (Array.isArray(saved)) setLayout([...saved.filter((w) => WIDGETS[w.id]), ...DEFAULT_LAYOUT.filter((d) => !saved.some((w) => w.id === d.id))]);
    } catch { /* ignore */ }
  }, []);
  const persist = (next) => { setLayout(next); localStorage.setItem(LAYOUT_KEY, JSON.stringify(next)); };
  const move = (i, dir) => { const next = [...layout]; const j = i + dir; [next[i], next[j]] = [next[j], next[i]]; persist(next); };
  const toggle = (id) => persist(layout.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  const reset = () => { localStorage.removeItem(LAYOUT_KEY); setLayout(DEFAULT_LAYOUT); };

  const load = useCallback(() => {
    if (range === 'custom' && (!custom.from || !custom.to)) return;
    const qs = new URLSearchParams({ range, ...(range === 'custom' ? custom : {}) });
    api(`/admin/dashboard?${qs}`).then((r) => { setData(r.data); setState('ok'); }).catch(() => setState('error'));
  }, [range, custom]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { window.addEventListener('ks:leads-changed', load); return () => window.removeEventListener('ks:leads-changed', load); }, [load]);

  if (state === 'error') return <div className="adm-empty" data-testid="dashboard-error"><span>Could not load the dashboard. Refresh to try again.</span></div>;
  if (!data) return <p className="adm-sub" data-testid="dashboard-loading">Loading dashboard…</p>;

  const st = data.kpis.byStatus;
  const kpis = [
    { label: 'Total enquiries', value: data.kpis.total, q: '' },
    { label: 'New', value: st.New, q: 'status=New' },
    { label: 'Qualified', value: st.Qualified, q: 'status=Qualified' },
    { label: 'Proposals sent', value: st['Proposal Sent'], q: 'status=Proposal%20Sent' },
    { label: 'Won / Lost', value: `${st.Won} / ${st.Lost}`, q: 'status=Won' },
  ];
  const fu = data.followups;
  const fuList = fu[fuTab] || [];
  const hasQueue = data.reviewQueue || data.applications;

  const render = {
    kpis: () => (
      <div className="adm-kpis" data-testid="widget-kpis">
        {kpis.map((k) => (
          <Link key={k.label} href={`/phobos/leads${k.q ? `?${k.q}` : ''}`} className="adm-kpi" data-testid={`kpi-${k.label.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
            <span className="adm-kpi-label">{k.label}</span><span className="adm-kpi-value">{k.value}</span><span className="adm-kpi-note">View records →</span>
          </Link>
        ))}
      </div>
    ),
    followups: () => (
      <div className="adm-w-body" data-testid="widget-followups">
        <div className="adm-seg" role="group" aria-label="Follow-up period" style={{ marginBottom: 12 }}>
          {[['overdue', `Overdue (${fu.overdueCount})`], ['today', `Today (${fu.todayCount})`], ['upcoming', `Next 7 days (${fu.upcomingCount})`]].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={fuTab === k} onClick={() => setFuTab(k)} data-testid={`followups-tab-${k}`}>{l}</button>
          ))}
        </div>
        {fuList.length === 0 ? <Empty text={fuTab === 'overdue' ? 'Nothing overdue. Well done.' : 'No follow-ups in this period.'} /> : (
          <ul className="adm-list">
            {fuList.map((l) => (
              <li key={l.id}>
                <Link href={`/phobos/leads?open=${l.id}`} className="grow" style={{ color: 'inherit' }} data-testid={`followup-${l.id}`}><b>{l.name}</b><small>{l.type} · {l.assigneeName}</small></Link>
                <small className={fuTab === 'overdue' ? 'adm-overdue' : ''}>{fmtDay(l.followUpAt)}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    ),
    conversion: () => {
      const c = data.conversion;
      return (
        <div className="adm-w-body adm-conv" data-testid="widget-conversion">
          <div><span className="adm-kpi-label">Win rate</span><span className="adm-kpi-value" data-testid="conversion-win-rate">{c.winRate === null ? '—' : `${c.winRate}%`}</span><small className="adm-sub">Won ÷ closed ({c.won} of {c.closed})</small></div>
          <div><span className="adm-kpi-label">Lead to win</span><span className="adm-kpi-value" data-testid="conversion-lead-to-win">{c.leadToWin === null ? '—' : `${c.leadToWin}%`}</span><small className="adm-sub">Won ÷ all enquiries in range</small></div>
          <div><span className="adm-kpi-label">Still open</span><span className="adm-kpi-value">{data.kpis.open}</span><small className="adm-sub">Not yet won or lost</small></div>
        </div>
      );
    },
    trend: () => (
      <div className="adm-w-body" style={{ height: 280 }} data-testid="widget-trend">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs><linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--a-chart-2)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--a-chart-2)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="var(--a-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={TIP} />
            <Area type="monotone" dataKey="Enquiries" stroke="var(--a-chart-2)" strokeWidth={2} fill="url(#gE)" />
            <Area type="monotone" dataKey="Won" stroke="var(--a-chart-1)" strokeWidth={2} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ),
    sources: () => (
      <div className="adm-w-body" data-testid="widget-sources">
        {data.sources.length === 0 ? <Empty text="No enquiries in this period." /> : (
          <ul className="adm-list">
            {data.sources.map((s) => {
              const pct = Math.round((s.count / data.kpis.total) * 100);
              return (
                <li key={s.source} style={{ display: 'grid', gap: 6 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between' }}><b>{s.source}</b><span>{s.count} · {pct}%</span></span>
                  <span className="adm-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="adm-sub" style={{ marginTop: 10, fontSize: '0.76rem' }}>From UTM source, otherwise the referring site.</p>
      </div>
    ),
    distribution: () => (
      <div className="adm-w-body" style={{ height: 240 }} data-testid="widget-distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={Object.entries(data.byType).map(([type, n]) => ({ type, Enquiries: n }))} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--a-border)" horizontal={false} />
            <XAxis type="number" stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <YAxis type="category" dataKey="type" stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={12} width={80} />
            <Tooltip cursor={{ fill: 'var(--a-accent-soft)' }} contentStyle={TIP} />
            <Bar dataKey="Enquiries" fill="var(--a-chart-1)" radius={[0, 3, 3, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
    recent: () => (
      <div className="adm-w-body" data-testid="widget-recent">
        {data.recent.length === 0 ? <Empty text="No enquiries in this period." /> : (
          <ul className="adm-list">
            {data.recent.map((l) => (
              <li key={l.id}>
                <Link href={`/phobos/leads?open=${l.id}`} className="grow" style={{ color: 'inherit' }} data-testid={`recent-${l.id}`}><b>{l.name}</b><small>{l.type} · {fmtDay(l.createdAt)} · {l.source}</small></Link>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    ),
    analytics: () => <AnalyticsPanel key={range === 'custom' ? '30' : range} range={range === 'custom' ? '30' : range} compact />,
    workqueue: () => (
      <div className="adm-kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }} data-testid="widget-workqueue">
        {data.reviewQueue && <>
          <Link href="/phobos/case-studies?status=in_review" className="adm-kpi" data-testid="queue-case-studies"><span className="adm-kpi-label">Case studies to review</span><span className="adm-kpi-value">{data.reviewQueue.caseStudies}</span><span className="adm-kpi-note">Open review queue →</span></Link>
          <Link href="/phobos/careers?status=in_review" className="adm-kpi" data-testid="queue-jobs"><span className="adm-kpi-label">Job posts to review</span><span className="adm-kpi-value">{data.reviewQueue.jobs}</span><span className="adm-kpi-note">Open review queue →</span></Link>
        </>}
        {data.applications && <Link href="/phobos/careers/applications?status=New" className="adm-kpi" data-testid="queue-applications"><span className="adm-kpi-label">New applications</span><span className="adm-kpi-value">{data.applications.new}</span><span className="adm-kpi-note">{data.applications.total} in total →</span></Link>}
      </div>
    ),
  };

  const visible = layout.filter((w) => w.visible && (w.id !== 'workqueue' || hasQueue) && (w.id !== 'analytics' || data.analytics));
  const rangeLabel = RANGES.find((r) => r.key === range).label.toLowerCase();

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-h1">Dashboard</h1>
          <p className="adm-sub" data-testid="dashboard-scope">{data.scope === 'mine' ? 'Leads assigned to you' : 'All company leads'} · {rangeLabel} ({data.range.from} → {data.range.to}, India time)</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div className="adm-seg" role="group" aria-label="Date range">
            {RANGES.map((r) => <button key={r.key} type="button" aria-pressed={range === r.key} onClick={() => setRange(r.key)} data-testid={`date-filter-${r.key}`}>{r.label}</button>)}
          </div>
          {range === 'custom' && <>
            <label className="visually-hidden" htmlFor="from">From</label>
            <input id="from" type="date" className="adm-date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} data-testid="date-filter-from" />
            <label className="visually-hidden" htmlFor="to">To</label>
            <input id="to" type="date" className="adm-date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} data-testid="date-filter-to" />
          </>}
          <button type="button" className={`adm-btn ${customizing ? 'adm-btn--primary' : ''}`} onClick={() => setCustomizing((v) => !v)} aria-pressed={customizing} data-testid="dashboard-customize-toggle">
            <SlidersHorizontal aria-hidden="true" />{customizing ? 'Done' : 'Customise'}
          </button>
        </div>
      </div>

      {customizing && (
        <section className="adm-w" aria-label="Customise dashboard" data-testid="dashboard-customize-panel">
          <div className="adm-w-head"><span className="adm-w-title">Show or hide widgets</span>
            <div className="adm-w-tools"><button type="button" title="Restore default layout" aria-label="Restore default layout" onClick={reset} data-testid="dashboard-reset-layout"><RotateCcw aria-hidden="true" /></button></div>
          </div>
          <div className="adm-w-body adm-customize" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {layout.map((w) => <label key={w.id}><input type="checkbox" checked={w.visible} onChange={() => toggle(w.id)} data-testid={`widget-visibility-${w.id}`} />{WIDGETS[w.id].title}</label>)}
          </div>
        </section>
      )}

      <div className="adm-grid">
        {visible.map((w) => {
          const i = layout.findIndex((x) => x.id === w.id);
          const meta = WIDGETS[w.id];
          return (
            <section key={w.id} className={`adm-w span-${meta.span}`} aria-label={meta.title} data-testid={`dashboard-widget-${w.id}`}>
              <div className="adm-w-head">
                <h2 className="adm-w-title">{meta.title}</h2>
                {customizing && (
                  <div className="adm-w-tools">
                    <button type="button" aria-label={`Move ${meta.title} earlier`} disabled={i === 0} onClick={() => move(i, -1)} data-testid={`widget-move-up-${w.id}`}><ArrowUp aria-hidden="true" /></button>
                    <button type="button" aria-label={`Move ${meta.title} later`} disabled={i === layout.length - 1} onClick={() => move(i, 1)} data-testid={`widget-move-down-${w.id}`}><ArrowDown aria-hidden="true" /></button>
                    <button type="button" aria-label={`Hide ${meta.title}`} onClick={() => toggle(w.id)} data-testid={`widget-hide-${w.id}`}><EyeOff aria-hidden="true" /></button>
                  </div>
                )}
              </div>
              {render[w.id]()}
            </section>
          );
        })}
        {visible.length === 0 && <div className="adm-w span-12"><Empty text="All widgets are hidden. Use Customise to show them again." /></div>}
      </div>
    </>
  );
}

function Empty({ text }) {
  return <div className="adm-empty"><span>{text}</span></div>;
}
