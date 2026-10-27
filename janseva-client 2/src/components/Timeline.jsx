import { useState } from 'react';
import Modal from './Modal';

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function officerLabel(officer) {
  if (!officer) return 'System';
  return `${officer.role ? officer.role.replaceAll('_', ' ') + ' – ' : ''}${officer.name}`;
}

export default function Timeline({ steps }) {
  const [zoomed, setZoomed] = useState(null);

  if (!steps || steps.length === 0) {
    return <div className="empty-state">No history yet.</div>;
  }
  return (
    <div className="thread-line">
      {steps.map((s, i) => {
        const isRejected = /reject/i.test(s.stage || s.action || '');
        return (
          <div key={s.historyId || i} className={`t-step ${isRejected ? 'rejected' : 'done'}`}>
            <div className="t-tag">{isRejected ? '✕' : '✓'}</div>
            <div className="t-card">
              <b>{s.stage}</b>
              <div className="t-meta">
                <span>{officerLabel(s.officer)}</span>
                <span>{fmtDate(s.actionDate)}</span>
              </div>
              {s.remarks && (
                <div style={{ marginTop: 8, fontSize: 12, background: 'var(--paper)', padding: '8px 10px', borderRadius: 8 }}>
                  {s.remarks}
                </div>
              )}
              {s.photoUrl && (
                <button
                  onClick={() => setZoomed(s.photoUrl)}
                  style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <img src={s.photoUrl} alt="Evidence" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line-strong)' }} />
                  <span style={{ fontSize: 11.5, color: 'var(--navy)', fontWeight: 600 }}>📷 View geo-tagged photo</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {zoomed && (
        <Modal title="Geo-tagged Photo" onClose={() => setZoomed(null)}>
          <img src={zoomed} alt="Evidence full size" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--line)' }} />
        </Modal>
      )}
    </div>
  );
}

export { fmtDate };
