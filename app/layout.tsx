import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TendLife - Financial Wellness for Hospitality Workers',
  description: 'Built for bartenders, servers, and hospitality workers. Track your tips, manage irregular income, and finally get ahead.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
