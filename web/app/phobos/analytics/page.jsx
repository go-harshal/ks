'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import AnalyticsPanel from '@/components/admin/AnalyticsPanel';

const RANGES = [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']];

export default function AnalyticsPage() {
  const [range, setRange] = useState('30');
  return (
    <AdminShell title="Analytics & Reports">
      <div className="adm-page-head">
        <div><h1 className="adm-h1">Website analytics</h1><p className="adm-sub">Counted on our own server, only with analytics consent. Google Analytics 4 runs alongside once a measurement ID is configured.</p></div>
        <div className="adm-seg" role="group" aria-label="Date range">
          {RANGES.map(([k, l]) => <button key={k} type="button" aria-pressed={range === k} onClick={() => setRange(k)} data-testid={`analytics-range-${k}`}>{l}</button>)}
        </div>
      </div>
      <section className="adm-w"><AnalyticsPanel key={range} range={range} /></section>
    </AdminShell>
  );
}
