import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TransactionForm } from '../components/TransactionForm';
import {
  Badge,
  Button,
  Card,
  CategoryDot,
  Chip,
  EmptyState,
  Modal,
  PageHeader,
  fieldClass,
} from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { categoryColor, categoryName, filterTransactions, totalsFor } from '../lib/calculations';
import { currentMonth, formatDisplayDate, todayISO } from '../lib/dates';
import { exportBasename, exportTransactionsExcel, exportTransactionsPdf } from '../lib/exportData';
import { formatMoney } from '../lib/money';

function monthChoices(transactions, selectedMonth) {
  const months = new Set(transactions.map((transaction) => transaction.date.slice(0, 7)));
  months.add(selectedMonth);
  months.add(currentMonth());
  return [...months].sort().reverse();
}

function defaultDateFor(month) {
  const today = todayISO();
  if (today.startsWith(month)) return today;
  return `${month}-01`;
}

export function Transactions() {
  const {
    state,
    selectedMonth,
    setSelectedMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    confirm,
    toast,
  } = useFinance();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [month, setMonth] = useState(selectedMonth);
  const [followMonth, setFollowMonth] = useState(true);
  const [compose, setCompose] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (followMonth) setMonth(selectedMonth);
  }, [followMonth, selectedMonth]);

  useEffect(() => {
    const requested = params.get('compose');
    if (requested === 'income' || requested === 'expense') {
      setEditing(null);
      setCompose(requested);
      const next = new URLSearchParams(params);
      next.delete('compose');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const rangeError = from && to && from > to ? 'The start date must be on or before the end date.' : '';
  const filtered = useMemo(() => filterTransactions(state.transactions, state.categories, {
    query,
    type,
    categoryId,
    month,
    from: rangeError ? '' : from,
    to: rangeError ? '' : to,
  }), [state.transactions, state.categories, query, type, categoryId, month, from, to, rangeError]);
  const totals = totalsFor(filtered);
  const months = monthChoices(state.transactions, selectedMonth);

  function changeMonth(value) {
    if (value === 'all') {
      setFollowMonth(false);
      setMonth('all');
      return;
    }
    setFollowMonth(true);
    setMonth(value);
    setSelectedMonth(value);
  }

  function clearFilters() {
    setQuery('');
    setType('all');
    setCategoryId('all');
    setFrom('');
    setTo('');
    setFollowMonth(true);
    setMonth(selectedMonth);
  }

  async function handleDelete(transaction) {
    const ok = await confirm({
      title: 'Delete transaction?',
      message: transaction.recurringId
        ? 'This removes it from your totals. That recurrence will not create this occurrence again.'
        : 'This removes it from your totals. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) {
      deleteTransaction(transaction.id);
      toast('Transaction deleted', 'bad');
    }
  }

  async function exportExcel() {
    setBusy('excel');
    try {
      await exportTransactionsExcel(filtered, state.categories, `${exportBasename()}.xlsx`);
      toast('Excel export ready');
    } finally {
      setBusy('');
    }
  }

  async function exportPdf() {
    setBusy('pdf');
    try {
      const scope = month === 'all' ? 'All months' : month;
      await exportTransactionsPdf(filtered, state.categories, `${exportBasename()}.pdf`, `Filtered transactions · ${scope}`);
      toast('PDF export ready');
    } finally {
      setBusy('');
    }
  }

  const formDate = defaultDateFor(month === 'all' ? selectedMonth : month);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Search, filter, edit, and export the ledger. Amounts export as positive income and negative expenses."
        actions={(
          <>
            <Button variant="secondary" onClick={() => { setEditing(null); setCompose('income'); }}>Add income</Button>
            <Button onClick={() => { setEditing(null); setCompose('expense'); }}>Add expense</Button>
          </>
        )}
      />

      <Card className="sticky top-[4.25rem] z-20 mb-4 border-slate-200/90 bg-white/95 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mb-3 flex flex-wrap gap-2">
          <Chip active={type === 'all'} onClick={() => setType('all')} aria-pressed={type === 'all'}>All</Chip>
          <Chip active={type === 'income'} onClick={() => setType('income')} aria-pressed={type === 'income'}>Income</Chip>
          <Chip active={type === 'expense'} onClick={() => setType('expense')} aria-pressed={type === 'expense'}>Expense</Chip>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Search</span>
            <input
              className={fieldClass}
              value={query}
              placeholder="Note, category, or amount"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Category</span>
            <select className={fieldClass} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="all">All categories</option>
              <optgroup label="Expense">
                {state.categories.filter((category) => category.type === 'expense').map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </optgroup>
              <optgroup label="Income">
                {state.categories.filter((category) => category.type === 'income').map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </optgroup>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Month</span>
            <select className={fieldClass} value={month} onChange={(event) => changeMonth(event.target.value)}>
              <option value="all">All months</option>
              {months.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">From</span>
            <input
              type="date"
              className={fieldClass}
              value={from}
              aria-invalid={Boolean(rangeError)}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">To</span>
            <input
              type="date"
              className={fieldClass}
              value={to}
              aria-invalid={Boolean(rangeError)}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
        {rangeError && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400" role="alert">{rangeError}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="min-h-11" onClick={clearFilters}>Clear filters</Button>
          <Button variant="secondary" className="min-h-11" onClick={exportExcel} disabled={!filtered.length || Boolean(busy)}>
            {busy === 'excel' ? 'Exporting…' : 'Export Excel'}
          </Button>
          <Button variant="secondary" className="min-h-11" onClick={exportPdf} disabled={!filtered.length || Boolean(busy)}>
            {busy === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </Button>
          <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
            {filtered.length} shown · Income {formatMoney(totals.income)} · Expenses {formatMoney(totals.expenses)} · Balance {formatMoney(totals.balance)}
          </p>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon="transactions"
            title="No matching transactions"
            message={state.transactions.length ? 'Try clearing a filter or searching for something else.' : 'Add income or an expense to start your ledger.'}
            action={!state.transactions.length && (
              <Button onClick={() => { setEditing(null); setCompose('expense'); }}>Add expense</Button>
            )}
          />
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((transaction) => {
              const income = transaction.type === 'income';
              return (
                <li key={transaction.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <CategoryDot color={categoryColor(state.categories, transaction.categoryId)} className="mt-1.5" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{categoryName(state.categories, transaction.categoryId)}</p>
                        <Badge tone={income ? 'good' : 'bad'}>{income ? 'Income' : 'Expense'}</Badge>
                        {transaction.recurringId && <Badge>Recurring</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {formatDisplayDate(transaction.date)}
                        {transaction.note ? ` · ${transaction.note}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <p className={income
                      ? 'font-semibold tabular-nums text-teal-800 dark:text-teal-200'
                      : 'font-semibold tabular-nums text-rose-800 dark:text-rose-200'}
                    >
                      {income ? '+' : '−'}
                      {formatMoney(transaction.amount)}
                    </p>
                    <Button variant="ghost" className="min-h-11" onClick={() => { setCompose(null); setEditing(transaction); }}>Edit</Button>
                    <Button variant="ghost" className="min-h-11 text-rose-700 dark:text-rose-300" onClick={() => handleDelete(transaction)}>Delete</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {(compose || editing) && (
        <Modal
          title={editing ? 'Edit transaction' : compose === 'income' ? 'Add income' : 'Add expense'}
          onClose={() => { setCompose(null); setEditing(null); }}
        >
          <TransactionForm
            initial={editing || { type: compose, date: formDate }}
            categories={state.categories}
            defaultDate={formDate}
            submitLabel={editing ? 'Save changes' : 'Add transaction'}
            onCancel={() => { setCompose(null); setEditing(null); }}
            onSubmit={(input) => {
              if (editing) {
                updateTransaction(editing.id, input);
                toast('Transaction updated');
              } else {
                addTransaction(input);
                toast(input.type === 'income' ? 'Income added' : 'Expense added');
              }
              setCompose(null);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
