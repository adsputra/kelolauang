import type { ActiveTab } from '../../types';

export const NAV_ITEMS: Array<{ id: ActiveTab; label: string; shortLabel: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Beranda', icon: 'LayoutDashboard' },
  { id: 'income', label: 'Pemasukan', shortLabel: 'Masuk', icon: 'TrendingUp' },
  { id: 'expense', label: 'Pengeluaran', shortLabel: 'Keluar', icon: 'TrendingDown' },
  { id: 'reports', label: 'Riwayat & Laporan', shortLabel: 'Laporan', icon: 'BarChart3' },
  { id: 'settings', label: 'Pengaturan', shortLabel: 'Atur', icon: 'Settings' },
];
