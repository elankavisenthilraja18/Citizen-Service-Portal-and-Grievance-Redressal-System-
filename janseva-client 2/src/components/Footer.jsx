import { Link } from 'react-router-dom';
import Seal from './Seal';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Seal size={30} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: 16 }}>JanSeva</div>
            </div>
            <p style={{ fontSize: 12.5, opacity: 0.75, maxWidth: 280 }}>
              A unified digital platform for citizen certificates and grievance redressal, connecting
              citizens directly with VAO, RI, Tahsildar and department offices.
            </p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/track">Track Status</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li>Privacy Policy</li>
              <li>Terms &amp; Conditions</li>
              <li>Support</li>
            </ul>
          </div>
          <div>
            <h4>Helpdesk</h4>
            <ul>
              <li>1800-425-1000 (Toll Free)</li>
              <li>support@janseva.gov.in</li>
              <li>Mon-Sat, 9 AM - 6 PM</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 JanSeva · Government of India. All rights reserved.</span>
          <span>Powered by the JanSeva REST API</span>
        </div>
      </div>
    </footer>
  );
}
