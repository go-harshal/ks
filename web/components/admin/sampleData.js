// DESIGN-PREVIEW SAMPLE DATA ONLY. Clearly fictional ("Sample …") and generated relative to today.
// Replaced by real MongoDB data in Phase 4e. Never shown on the public site.
export const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
export const TYPES = ['Project', 'Hiring', 'Partnership', 'Contact'];
export const ASSIGNEES = ['Unassigned', 'Sample Manager', 'Sample Team Member A', 'Sample Team Member B'];
const SOURCES = ['Organic search', 'Direct', 'Referral', 'LinkedIn', 'WhatsApp'];
const SERVICES = ['Mobile App Development', 'Web Application Development', 'UI/UX Design', 'E-commerce Development', 'Cloud Solutions & DevOps'];

function rng(seed) {
  let x = seed;
  return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
}

export function buildSampleLeads(count = 72) {
  const r = rng(42);
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const type = TYPES[Math.floor(r() * (r() > 0.25 ? 2 : 4))];
    const created = new Date(now - Math.floor(r() * 150) * 864e5 - Math.floor(r() * 864e5));
    const status = STATUSES[Math.min(5, Math.floor(r() * r() * 7))];
    const assignee = ASSIGNEES[Math.floor(r() * 4)];
    const fuOffset = Math.floor(r() * 10) - 3;
    const hasFollowUp = status !== 'Won' && status !== 'Lost' && r() > 0.45;
    return {
      id: `SMP-${String(1000 + i)}`,
      name: `Sample Contact ${String(i + 1).padStart(2, '0')}`,
      company: `Sample Company ${String.fromCharCode(65 + (i % 26))}${i > 25 ? Math.floor(i / 26) : ''}`,
      email: `contact${i + 1}@example.com`,
      type,
      status,
      assignee,
      source: SOURCES[Math.floor(r() * SOURCES.length)],
      service: type === 'Project' ? SERVICES[Math.floor(r() * SERVICES.length)] : type === 'Hiring' ? 'Full-Stack Developers × 2' : '—',
      createdAt: created.toISOString(),
      followUpAt: hasFollowUp ? new Date(now + fuOffset * 864e5 + 3.6e6 * Math.floor(r() * 8)).toISOString() : null,
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const SAMPLE_ACTIVITY = [
  { kind: 'Security', text: 'Sample Manager signed in from a new device', ago: '12 min ago' },
  { kind: 'Email', text: 'Assignment email to Sample Team Member A — delivered', ago: '1 h ago' },
  { kind: 'Security', text: 'Invitation sent to sample.user@example.com', ago: '3 h ago' },
  { kind: 'Email', text: 'Acknowledgement email retry 2/5 — delivered', ago: 'Yesterday' },
  { kind: 'Backup', text: 'Daily database backup completed', ago: 'Yesterday' },
];
