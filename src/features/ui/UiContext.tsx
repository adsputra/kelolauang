import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ActiveTab } from '../../types';

interface UiContextValue {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const UiContext = createContext<UiContextValue | null>(null);

function readStoredBoolean(key: string): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? null : value === 'true';
  } catch {
    return null;
  }
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => readStoredBoolean('kelolauang_sidebar_collapsed') ?? false,
  );
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = readStoredBoolean('kelolauang_dark_mode');
    if (stored !== null) return stored;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    try {
      window.localStorage.setItem('kelolauang_dark_mode', String(isDarkMode));
    } catch {
      // Storage may be unavailable in private browsing; the in-memory preference still works.
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem('kelolauang_sidebar_collapsed', String(sidebarCollapsed));
    } catch {
      // Keep the current session usable even when persistence is blocked.
    }
  }, [sidebarCollapsed]);

  const toggleDarkMode = useCallback(() => setIsDarkMode((current) => !current), []);
  const value = useMemo(
    () => ({ activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed, isDarkMode, toggleDarkMode }),
    [activeTab, sidebarCollapsed, isDarkMode, toggleDarkMode],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUi harus digunakan di dalam UiProvider.');
  return context;
}
