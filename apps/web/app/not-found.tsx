import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="login-shell">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="wordmark">
          Veyra<span className="accent">Send</span>
        </div>
        <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: '16px 0 24px' }}>
          The page you were looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn-primary" style={{ display: 'inline-block' }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
