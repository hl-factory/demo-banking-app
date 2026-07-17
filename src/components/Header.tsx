import { useNav } from '../nav/NavContext';

export function Header() {
  const { goToAccounts, goToHistory, goToTransfer, view } = useNav();

  return (
    <header className="header">
      <button
        type="button"
        className="header__brand"
        data-testid="brand-home"
        onClick={goToAccounts}
      >
        Halcyon Bank
      </button>
      <nav className="header__nav" aria-label="Primary">
        <button
          type="button"
          className={`header__nav-link${view === 'accounts' ? ' header__nav-link--active' : ''}`}
          data-testid="nav-accounts"
          onClick={goToAccounts}
        >
          Accounts
        </button>
        <button
          type="button"
          className={`header__nav-link${view === 'transfer' ? ' header__nav-link--active' : ''}`}
          data-testid="nav-transfer"
          onClick={() => goToTransfer()}
        >
          Transfer
        </button>
        <button
          type="button"
          className={`header__nav-link${view === 'history' ? ' header__nav-link--active' : ''}`}
          data-testid="nav-history"
          onClick={goToHistory}
        >
          Transactions
        </button>
      </nav>
    </header>
  );
}
