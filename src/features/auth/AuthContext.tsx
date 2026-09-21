import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser } from '../../types';
import type { Result } from '../../shared/result';
import { failure, success } from '../../shared/result';
import {
  fetchSession,
  loginWithPassword,
  registerAccount,
  signOutAccount,
  updateAccountName,
} from './authRepository';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<Result<void>>;
  signup: (name: string, email: string, password: string) => Promise<Result<string>>;
  logout: () => Promise<Result<void>>;
  syncAccountName: (name: string) => Promise<Result<void>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isSameUser(prev: AuthUser | null, next: AuthUser | null): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  return prev.id === next.id && prev.email === next.email && prev.name === next.name;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInFlight = useRef(false);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const result = await fetchSession();
      if (!active) return;

      if (!result.ok) {
        // Kegagalan sementara tidak memaksa logout bila sesi sebelumnya masih ada.
        setStatus((current) => (current === 'authenticated' ? current : 'anonymous'));
        return;
      }

      if (result.data) {
        const nextUser = result.data;
        setUser((prev) => (isSameUser(prev, nextUser) ? prev : nextUser));
        setStatus('authenticated');
      } else {
        setUser((prev) => (prev === null ? prev : null));
        setStatus('anonymous');
      }
    };

    void syncSession();

    const handleFocus = () => {
      void syncSession();
    };
    const handleUnauthorized = () => {
      void syncSession();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('kelolauang:unauthorized', handleUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('kelolauang:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<Result<void>> => {
    const result = await loginWithPassword(email.trim().toLowerCase(), password);
    if (!result.ok) return result;
    setUser(result.data);
    setStatus('authenticated');
    return success(undefined);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<Result<string>> => {
      const result = await registerAccount(name, email.trim().toLowerCase(), password);
      if (!result.ok) return result;
      if (result.data.hasSession) {
        setUser(result.data.user);
        setStatus('authenticated');
        return success('Akun berhasil dibuat.');
      }
      return success('Akun berhasil dibuat. Periksa email Anda untuk konfirmasi.');
    },
    [],
  );

  const logout = useCallback(async (): Promise<Result<void>> => {
    if (logoutInFlight.current) return failure('LOGOUT_PENDING', 'Proses keluar sedang berjalan.');
    logoutInFlight.current = true;
    setIsLoggingOut(true);
    const result = await signOutAccount();
    logoutInFlight.current = false;
    setIsLoggingOut(false);
    if (result.ok) {
      setUser(null);
      setStatus('anonymous');
    }
    return result;
  }, []);

  const syncAccountName = useCallback(async (name: string): Promise<Result<void>> => {
    const result = await updateAccountName(name);
    if (result.ok) setUser((current) => (current ? { ...current, name } : current));
    return result;
  }, []);

  const value = useMemo(
    () => ({ user, status, isLoggingOut, login, signup, logout, syncAccountName }),
    [user, status, isLoggingOut, login, signup, logout, syncAccountName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  return context;
}
