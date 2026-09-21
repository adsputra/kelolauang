import '../src/index.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KelolaUang',
  description: 'Catat pemasukan, pengeluaran, anggaran, dan laporan keuangan pribadi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
