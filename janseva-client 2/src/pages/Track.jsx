import { useState } from 'react';
import { trackApi } from '../api';
import Timeline from '../components/Timeline';
import StatusPill from '../components/StatusPill';

export default function Track() {
  const [id, setId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doTrack = async (e) => {
    e.preventDefault();
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await trackApi.track(id.trim().toUpperCase());
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const record = result?.record;

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">Home / Track Status</div>
          <h1>Track Application or Complaint</h1>
          <p className="lead">Enter your Application ID or Complaint ID to view live status — no login required.</p>
        </div>
      </div>
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <form className="card" style={{ display: 'flex', gap: 10 }} onSubmit={doTrack}>
            <input
              className="mono"
              placeholder="e.g. CS2025000123 or GR2025000456"
              value={id}
              onChange={(e) => setId(e.target.value)}
              style={{ flex: 1, padding: '11px 14px', border: '1.5px solid var(--line-strong)', borderRadius: 9 }}
            />
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Searching…' : '🔍 Track'}</button>
          </form>

          {error && <div className="error-box" style={{ marginTop: 20 }}>{error}</div>}

          {record && (
            <div className="card" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 16 }}>
                    {result.type === 'APPLICATION' ? record.service?.serviceName : record.title}
                  </h3>
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--slate)' }}>
                    {result.type === 'APPLICATION' ? record.applicationId : record.grievanceId}
                  </div>
                </div>
                <StatusPill status={record.status} />
              </div>
              <Timeline steps={result.timeline} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
