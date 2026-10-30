'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, EyeOff, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildSampleLeads, SAMPLE_ACTIVITY, TYPES } from './sampleData';
import StatusBadge from './StatusBadge';

const RANGES = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'custom', label: 'Custom' },
];

const WIDGETS = {
  kpis: { title: 'Pipeline summary', span: 12 },
  trend: { title: 'Monthly enquiry trend', span: 8 },
  distribution: { title: 'Enquiry distribution', span: 4 },
  recent: { title: 'Recent enquiries', span: 6 },
  followups: { title: 'Upcoming follow-ups', span: 6 },
  analytics: { title: 'Website analytics', span: 4 },
  subscribers: { title: 'Newsletter subscribers', span: 4 },
  activity: { title: 'Administrative activity', span: 4 },
};
const DEFAULT_LAYOUT = Object.keys(WIDGETS).map((id) => ({ id, visible: true }));
const LAYOUT_KEY = 'ks-preview-dashboard-layout';

const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

export default function Dashboard() {
  const all = useMemo(() => buildSampleLeads(), []);
  const [range, setRange] = useState('30');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null'); if (Array.isArray(saved)) setLayout(saved); } catch { /* ignore */ }
  }, []);
  const persist = (next) => { setLayout(next); localStorage.setItem(LAYOUT_KEY, JSON.stringify(next)); };
  const move = (i, dir) => { const next = [...layout]; const j = i + dir; [next[i], next[j]] = [next[j], next[i]]; persist(next); };
  const toggle = (id) => persist(layout.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  const reset = () => { localStorage.removeItem(LAYOUT_KEY); setLayout(DEFAULT_LAYOUT); };

  const { from, to } = useMemo(() => {
    const end = new Date();
    if (range === 'custom') {
      return { from: custom.from ? new Date(custom.from) : new Date(0), to: custom.to ? new Date(`${custom.to}T23:59:59`) : end };
    }
    const r = RANGES.find((x) => x.key === range);
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (r.days - 1));
    return { from: start, to: end };
  }, [range, custom]);

  const leads = all.filter((l) => { const d = new Date(l.createdAt); return d >= from && d <= to; });
  const count = (st) => leads.filter((l) => l.status === st).length;
  const kpis = [
    { label: 'Total enquiries', value: leads.length, q: '' },
    { label: 'New', value: count('New'), q: 'status=New' },
    { label: 'Qualified', value: count('Qualified'), q: 'status=Qualified' },
    { label: 'Proposals sent', value: count('Proposal Sent'), q: 'status=Proposal%20Sent' },
    { label: 'Won / Lost', value: `${count('Won')} / ${count('Lost')}`, q: 'status=Won' },
  ];

  const trend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({ key, month: d.toLocaleDateString('en-GB', { month: 'short' }), Enquiries: 0, Won: 0 });
    }
    all.forEach((l) => {
      const d = new Date(l.createdAt); const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) { m.Enquiries += 1; if (l.status === 'Won') m.Won += 1; }
    });
    return months;
  }, [all]);
  const dist = TYPES.map((t) => ({ type: t, Enquiries: leads.filter((l) => l.type === t).length }));
  const now = Date.now();
  const followups = all.filter((l) => l.followUpAt).sort((a, b) => a.followUpAt.localeCompare(b.followUpAt)).slice(0, 6);

  const render = {
    kpis: () => (
      <div className="adm-kpis" data-testid="widget-kpis">
        {kpis.map((k) => (
          <Link key={k.label} href={`/phobos/leads${k.q ? `?${k.q}` : ''}`} className="adm-kpi" data-testid={`kpi-${k.label.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
            <span className="adm-kpi-label">{k.label}</span>
            <span className="adm-kpi-value">{k.value}</span>
            <span className="adm-kpi-note">View records →</span>
          </Link>
        ))}
      </div>
    ),
    trend: () => (
      <div className="adm-w-body" style={{ height: 280 }} data-testid="widget-trend">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--a-chart-2)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--a-chart-2)" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid stroke="var(--a-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--a-surface)', border: '1px solid var(--a-border)', borderRadius: 4, color: 'var(--a-text)' }} />
            <Area type="monotone" dataKey="Enquiries" stroke="var(--a-chart-2)" strokeWidth={2} fill="url(#gE)" />
            <Area type="monotone" dataKey="Won" stroke="var(--a-chart-1)" strokeWidth={2} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ),
    distribution: () => (
      <div className="adm-w-body" style={{ height: 280 }} data-testid="widget-distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dist} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--a-border)" horizontal={false} />
            <XAxis type="number" stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <YAxis type="category" dataKey="type" stroke="var(--a-faint)" tickLine={false} axisLine={false} fontSize={12} width={80} />
            <Tooltip cursor={{ fill: 'var(--a-accent-soft)' }} contentStyle={{ background: 'var(--a-surface)', border: '1px solid var(--a-border)', borderRadius: 4, color: 'var(--a-text)' }} />
            <Bar dataKey="Enquiries" fill="var(--a-chart-1)" radius={[0, 3, 3, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
    recent: () => (
      <div className="adm-w-body" data-testid="widget-recent">
        {leads.length === 0 ? <Empty text="No enquiries in this period." /> : (
          <ul className="adm-list">
            {leads.slice(0, 6).map((l) => (
              <li key={l.id}>
                <span className="grow"><b>{l.company}</b><small>{l.type} · {fmtDay(l.createdAt)} · {l.source}</small></span>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    ),
    followups: () => (
      <div className="adm-w-body" data-testid="widget-followups">
        {followups.length === 0 ? <Empty text="No follow-ups scheduled." /> : (
          <ul className="adm-list">
            {followups.map((l) => {
              const overdue = new Date(l.followUpAt).getTime() < now;
              return (
                <li key={l.id}>
                  <span className="grow"><b>{l.company}</b><small>{l.assignee}</small></span>
                  <small className={overdue ? 'adm-overdue' : ''}>{overdue ? 'Overdue · ' : ''}{fmtDay(l.followUpAt)}</small>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    ),
    analytics: () => (
      <div className="adm-w-body" data-testid="widget-analytics">
        <ul className="adm-list">
          <li><span className="grow"><b>WhatsApp clicks</b><small>First-party, no personal data</small></span><b>{Math.round(leads.length * 1.8)}</b></li>
          <li><span className="grow"><b>Meeting link clicks</b><small>When booking is enabled</small></span><b>{Math.round(leads.length * 0.4)}</b></li>
          <li><span className="grow"><b>Top source</b><small>From enquiry context</small></span><b>Organic search</b></li>
        </ul>
      </div>
    ),
    subscribers: () => (
      <div className="adm-w-body" data-testid="widget-subscribers">
        <p className="adm-kpi-value">128</p>
        <p className="adm-sub">Confirmed (double opt-in) · 9 pending · 3 unsubscribed</p>
      </div>
    ),
    activity: () => (
      <div className="adm-w-body" data-testid="widget-activity">
        <ul className="adm-list">
          {SAMPLE_ACTIVITY.map((a) => <li key={a.text}><span className="grow"><b>{a.text}</b><small>{a.kind} · {a.ago}</small></span></li>)}
        </ul>
      </div>
    ),
  };

  const visible = layout.filter((w) => w.visible);

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-h1">Dashboard</h1>
          <p className="adm-sub">Showing {RANGES.find((r) => r.key === range).label.toLowerCase()} · sample data</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div className="adm-seg" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button key={r.key} type="button" aria-pressed={range === r.key} onClick={() => setRange(r.key)} data-testid={`date-filter-${r.key}`}>{r.label}</button>
            ))}
          </div>
          {range === 'custom' && (
            <>
              <label className="visually-hidden" htmlFor="from">From</label>
              <input id="from" type="date" className="adm-date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} data-testid="date-filter-from" />
              <label className="visually-hidden" htmlFor="to">To</label>
              <input id="to" type="date" className="adm-date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} data-testid="date-filter-to" />
            </>
          )}
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
            {layout.map((w) => (
              <label key={w.id}><input type="checkbox" checked={w.visible} onChange={() => toggle(w.id)} data-testid={`widget-visibility-${w.id}`} />{WIDGETS[w.id].title}</label>
            ))}
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
