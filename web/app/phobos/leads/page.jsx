import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import LeadsTable from '@/components/admin/LeadsTable';

export const metadata = { title: 'Lead Management' };

export default function PhobosLeadsPage() {
  return (
    <AdminShell title="Lead Management">
      <Suspense fallback={<p className="adm-sub">Loading leads…</p>}>
        <LeadsTable />
      </Suspense>
    </AdminShell>
  );
}
