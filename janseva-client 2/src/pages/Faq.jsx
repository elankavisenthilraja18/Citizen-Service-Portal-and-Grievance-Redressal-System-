import { useState } from 'react';

const FAQS = [
  ['How long does a certificate take to be issued?', 'Most certificates are issued within 5–15 days once VAO, RI and Tahsildar verification is complete. Exact SLA is shown on the Services page.'],
  ['What if my application is rejected?', 'You will receive the rejection reason via SMS and email immediately. Upload corrected documents and resubmit the same application without starting over.'],
  ['How do I verify a certificate is genuine?', 'Every JanSeva certificate carries a unique QR code. Scanning it opens a verification page confirming the certificate number, issue date and issuing officer.'],
  ['Can I track a complaint without logging in?', 'Yes — guests can track any application or complaint using its ID from the Track Status page, no login required.'],
  ['How are grievances assigned to a field officer?', 'Our AI reads the complaint description and category, detects the correct department, and assigns the nearest available field officer for that ward.'],
];

export default function Faq() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">Home / FAQ</div>
          <h1>Frequently Asked Questions</h1>
        </div>
      </div>
      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          {FAQS.map(([q, a], i) => (
            <div key={q} style={{ borderBottom: '1px solid var(--line)', padding: '16px 0', cursor: 'pointer' }} onClick={() => setOpen(open === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 650 }}>
                {q} <span>{open === i ? '−' : '+'}</span>
              </div>
              {open === i && <div style={{ color: 'var(--slate)', fontSize: 13.5, marginTop: 10 }}>{a}</div>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
