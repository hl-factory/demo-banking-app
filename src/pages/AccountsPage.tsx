import { useAccounts } from '../accounts/AccountsContext';
import { useNav } from '../nav/NavContext';
import { AccountCard } from '../components/AccountCard';

export function AccountsPage() {
  const { accounts } = useAccounts();
  const { goToDetail } = useNav();

  return (
    <section className="accounts-page" aria-labelledby="accounts-heading">
      <div className="accounts-page__intro">
        <h1 id="accounts-heading">Your accounts</h1>
        <p className="accounts-page__count" data-testid="account-count">
          {accounts.length} accounts
        </p>
      </div>
      <div className="account-grid" data-testid="account-grid">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} onView={goToDetail} />
        ))}
      </div>
    </section>
  );
}
