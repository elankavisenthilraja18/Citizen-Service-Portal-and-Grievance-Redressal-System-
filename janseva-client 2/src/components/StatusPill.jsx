const CLASS_MAP = {
  SUBMITTED: 'sp-pending',
  VIEWED: 'sp-pending',
  UNDER_VERIFICATION: 'sp-pending',
  VAO_APPROVED: 'sp-progress',
  RI_APPROVED: 'sp-progress',
  TAHSILDAR_APPROVED: 'sp-progress',
  CERTIFICATE_READY: 'sp-ok',
  REJECTED: 'sp-bad',
  ASSIGNED: 'sp-progress',
  FIELD_VISIT_COMPLETED: 'sp-progress',
  IN_PROGRESS: 'sp-progress',
  RESOLVED: 'sp-ok',
  CLOSED: 'sp-ok',
};

export default function StatusPill({ status }) {
  const cls = CLASS_MAP[status] || 'sp-pending';
  const label = (status || '').replaceAll('_', ' ');
  return <span className={`status-pill ${cls}`}>{label}</span>;
}
