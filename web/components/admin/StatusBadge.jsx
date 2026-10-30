export default function StatusBadge({ status }) {
  const cls = `st-${status.toLowerCase().replace(/\s+/g, '-')}`;
  return <span className={`adm-status ${cls}`} data-testid={`status-badge-${cls}`}>{status}</span>;
}
