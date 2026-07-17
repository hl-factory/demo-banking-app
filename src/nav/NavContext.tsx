import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type View = 'accounts' | 'detail' | 'history';

interface NavContextValue {
  view: View;
  selectedAccountId: string | null;
  goToAccounts: () => void;
  goToDetail: (accountId: string) => void;
  goToHistory: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('accounts');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const goToAccounts = useCallback(() => {
    setView('accounts');
    setSelectedAccountId(null);
    window.scrollTo(0, 0);
  }, []);

  const goToDetail = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setView('detail');
    window.scrollTo(0, 0);
  }, []);

  const goToHistory = useCallback(() => {
    setView('history');
    window.scrollTo(0, 0);
  }, []);

  return (
    <NavContext.Provider
      value={{ view, selectedAccountId, goToAccounts, goToDetail, goToHistory }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within a NavProvider');
  return ctx;
}
