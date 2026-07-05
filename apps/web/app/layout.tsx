import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VeyraSend',
  description: 'Email campaign & management platform on SendGrid.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="enxi-product">{children}</body>
    </html>
  );
}
