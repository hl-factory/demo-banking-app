import { AccountsProvider } from './accounts/AccountsContext';
import { NavProvider, useNav } from './nav/NavContext';
import { Header } from './components/Header';
import { AccountsPage } from './pages/AccountsPage';
import { AccountDetailPage } from './pages/AccountDetailPage';
import { HistoryPage } from './pages/HistoryPage';

function CurrentView() {
  const { view, selectedAccountId } = useNav();
  switch (view) {
    case 'accounts':
      return <AccountsPage />;
    case 'detail':
      return <AccountDetailPage accountId={selectedAccountId} />;
    case 'history':
      return <HistoryPage />;
    default:
      return <AccountsPage />;
  }
}

function Shell() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <CurrentView />
      </main>
      <footer className="app-footer">
        <p>&copy; Halcyon Bank &mdash; demo banking app</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AccountsProvider>
      <NavProvider>
        <Shell />
      </NavProvider>
    </AccountsProvider>
  );
}
