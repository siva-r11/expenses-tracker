import { useState } from 'react';
import { Button, Card, PageHeader } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { exportBasename, exportTransactionsExcel, exportTransactionsPdf } from '../lib/exportData';
import { STORAGE_KEY } from '../lib/storage';

export function Settings() {
  const { state, theme, toggleTheme, resetSampleData, clearData, confirm } = useFinance();
  const [busy, setBusy] = useState('');

  async function resetSample() {
    const ok = await confirm({
      title: 'Reset sample data?',
      message: 'This replaces your transactions, budgets, categories, bills, goals, and recurrences with the starter set. Your light or dark choice stays.',
      confirmLabel: 'Reset sample data',
      danger: true,
    });
    if (ok) resetSampleData();
  }

  async function clear() {
    const ok = await confirm({
      title: 'Clear your data?',
      message: 'This removes transactions, budgets, bills, goals, and recurrences, and restores the default categories. The dashboard will be empty until you add something.',
      confirmLabel: 'Clear data',
      danger: true,
    });
    if (ok) clearData();
  }

  async function exportExcel() {
    setBusy('excel');
    try {
      await exportTransactionsExcel(state.transactions, state.categories, `${exportBasename()}-all.xlsx`);
    } finally {
      setBusy('');
    }
  }

  async function exportPdf() {
    setBusy('pdf');
    try {
      await exportTransactionsPdf(state.transactions, state.categories, `${exportBasename()}-all.pdf`, 'All transactions');
    } finally {
      setBusy('');
    }
  }

  const counts = [
    ['Transactions', state.transactions.length],
    ['Budgets', state.budgets.length],
    ['Categories', state.categories.length],
    ['Recurrences', state.recurrences.length],
    ['Bills', state.bills.length],
    ['Goals', state.goals.length],
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Appearance, exports, and the data stored in this browser."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {theme === 'dark' ? 'Dark mode is on.' : 'Light mode is on.'} The choice is saved with your ledger.
          </p>
          <Button className="mt-4" variant="secondary" aria-pressed={theme === 'dark'} onClick={toggleTheme}>
            {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          </Button>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Export everything</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Download every transaction, not just the filtered list on the Transactions page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!state.transactions.length || Boolean(busy)} onClick={exportExcel}>
              {busy === 'excel' ? 'Exporting…' : 'Export Excel'}
            </Button>
            <Button variant="secondary" disabled={!state.transactions.length || Boolean(busy)} onClick={exportPdf}>
              {busy === 'pdf' ? 'Exporting…' : 'Export PDF'}
            </Button>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Stored in this browser</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Storage key</dt>
              <dd className="font-medium">{STORAGE_KEY}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Schema version</dt>
              <dd className="font-medium">{state.version}</dd>
            </div>
            {counts.map(([label, count]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium tabular-nums">{count}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Reset or clear</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Reset puts the sample paycheck, expenses, current-month budget, emergency fund, and electric bill back. Clear leaves the default categories and an empty ledger.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={resetSample}>Reset sample data</Button>
            <Button variant="danger" onClick={clear}>Clear my data</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
