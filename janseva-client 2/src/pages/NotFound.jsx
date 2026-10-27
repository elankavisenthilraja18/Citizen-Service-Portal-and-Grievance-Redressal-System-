import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty-state" style={{ padding: '100px 20px' }}>
      <h2 style={{ marginBottom: 10 }}>Page not found</h2>
      <p style={{ marginBottom: 20 }}>The page you're looking for doesn't exist.</p>
      <Link className="btn btn-primary" to="/">Back to Home</Link>
    </div>
  );
}
