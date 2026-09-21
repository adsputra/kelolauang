import type { ReactNode } from 'react';
import { AuthProvider } from '../features/auth/AuthContext';
import { FinanceDataProvider } from '../features/finance/FinanceDataContext';
import { UiProvider } from '../features/ui/UiContext';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UiProvider>
      <AuthProvider>
        <FinanceDataProvider>{children}</FinanceDataProvider>
      </AuthProvider>
    </UiProvider>
  );
}
