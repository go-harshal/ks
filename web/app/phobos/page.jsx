import AdminShell from '@/components/admin/AdminShell';
import Dashboard from '@/components/admin/Dashboard';

export const metadata = { title: 'Dashboard' };

export default function PhobosDashboardPage() {
  return (
    <AdminShell title="Dashboard">
      <Dashboard />
    </AdminShell>
  );
}
