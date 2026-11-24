import { useState } from 'react';
import { CategoryBar, ExpenseDoughnut, YearCompareBar } from '../components/Charts';
import { Button, Card, PageHeader } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import {
  budgetSnapshot,
  sumByCategory,
  totalsFor,
  transactionsInMonth,
  transactionsInYear,
  yearSeries,
} from '../lib/calculations';
import { formatMonth, shiftMonth, yearOf } from '../lib/dates';
import { exportBasename, exportTransactionsExcel, exportTransactionsPdf } from '../lib/exportData';
import { formatMoney, formatPercent } from '../lib/money';

const tabs = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'category', label: 'Category' },
  { id: 'budget', label: 'Budget vs actual' },
];

export function Reports() {
  const { state, selectedMonth } = useFinance();
  const [tab, setTab] = useState('monthly');
  const [scope, setScope] = useState('month');
  const [busy, setBusy] = useState('');
  const year = yearOf(selectedMonth);

  function onTabKey(event) {
    const ids = tabs.map((item) => item.id);
    const index = ids.indexOf(tab);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = event.key === 'ArrowRight' ? (index + 1) % ids.length : (index - 1 + ids.length) % ids.length;
      setTab(ids[next]);
    }
  }

  async function exportMonth(kind) {
    const rows = transactionsInMonth(state.transactions, selectedMonth);
    setBusy(kind);
    try {
      if (kind === 'excel') {
        await exportTransactionsExcel(rows, state.categories, `${exportBasename()}-${selectedMonth}.xlsx`);
      } else {
        await exportTransactionsPdf(rows, state.categories, `${exportBasename()}-${selectedMonth}.pdf`, `${formatMonth(selectedMonth)} transactions`);
      }
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`Figures follow ${formatMonth(selectedMonth)}. Change the month in the header to move the monthly, category, and budget reports. The yearly report uses ${year}.`}
      />
      <div role="tablist" aria-label="Reports" className="mb-4 flex gap-2 overflow-x-auto" onKeyDown={onTabKey}>
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                selected
                  ? 'bg-teal-700 text-white dark:bg-teal-600'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
              }`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'monthly' && <MonthlyReport state={state} month={selectedMonth} busy={busy} onExport={exportMonth} />}
        {tab === 'yearly' && <YearlyReport state={state} year={year} />}
        {tab === 'category' && <CategoryReport state={state} month={selectedMonth} year={year} scope={scope} setScope={setScope} />}
        {tab === 'budget' && <BudgetReport state={state} month={selectedMonth} />}
      </div>
    </div>
  );
}

function MonthlyReport({ state, month, busy, onExport }) {
  const current = totalsFor(transactionsInMonth(state.transactions, month));
  const previous = totalsFor(transactionsInMonth(state.transactions, shiftMonth(month, -1)));
  const breakdown = sumByCategory(transactionsInMonth(state.transactions, month), state.categories, 'expense');
  const spent = breakdown.filter((row) => row.amount > 0);
  const top = spent[0];
  const expenseCount = transactionsInMonth(state.transactions, month).filter((transaction) => transaction.type === 'expense').length;
  const delta = current.expenses - previous.expenses;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy || current.count === 0} onClick={() => onExport('excel')}>
          {busy === 'excel' ? 'Exporting…' : 'Export month to Excel'}
        </Button>
        <Button variant="secondary" disabled={busy || current.count === 0} onClick={() => onExport('pdf')}>
          {busy === 'pdf' ? 'Exporting…' : 'Export month to PDF'}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Income" value={formatMoney(current.income)} />
        <Summary label="Expenses" value={formatMoney(current.expenses)} />
        <Summary label="Balance" value={formatMoney(current.balance)} />
        <Summary label="Savings rate" value={formatPercent(current.savingsRate)} />
      </div>
      <Card>
        <h2 className="text-base font-semibold">Compared with {formatMonth(shiftMonth(month, -1))}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Expenses are {formatMoney(Math.abs(delta))} {delta > 0 ? 'higher' : delta < 0 ? 'lower' : 'unchanged'} than the previous month.
          {top ? ` The largest category is ${top.name} at ${formatMoney(top.amount)}.` : ' There are no expenses in this month.'}
          {expenseCount > 0 ? ` Average expense is ${formatMoney(current.expenses / expenseCount)}.` : ''}
        </p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-semibold">Where the money went</h2>
          <ExpenseDoughnut rows={spent} />
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold">Category totals</h2>
          <MoneyTable
            columns={['Category', 'Amount', 'Share']}
            rows={spent.map((row) => [row.name, formatMoney(row.amount), formatPercent(row.percent)])}
            empty="No expenses in this month."
          />
        </Card>
      </div>
    </div>
  );
}

function YearlyReport({ state, year }) {
  const series = yearSeries(state.transactions, year);
  const totals = totalsFor(transactionsInYear(state.transactions, year));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label={`${year} income`} value={formatMoney(totals.income)} />
        <Summary label={`${year} expenses`} value={formatMoney(totals.expenses)} />
        <Summary label="Balance" value={formatMoney(totals.balance)} />
        <Summary label="Savings rate" value={formatPercent(totals.savingsRate)} />
      </div>
      <Card>
        <h2 className="mb-3 text-base font-semibold">Income and expenses by month</h2>
        <YearCompareBar points={series} />
      </Card>
      <Card>
        <h2 className="mb-3 text-base font-semibold">Month by month</h2>
        <MoneyTable
          columns={['Month', 'Income', 'Expenses', 'Balance', 'Savings rate']}
          rows={series.map((point) => [
            point.label,
            formatMoney(point.income),
            formatMoney(point.expenses),
            formatMoney(point.balance),
            formatPercent(point.savingsRate),
          ])}
        />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Months with no transactions show as zero.</p>
      </Card>
    </div>
  );
}

function CategoryReport({ state, month, year, scope, setScope }) {
  const source = scope === 'year'
    ? transactionsInYear(state.transactions, year)
    : transactionsInMonth(state.transactions, month);
  const expenses = sumByCategory(source, state.categories, 'expense');
  const income = sumByCategory(source, state.categories, 'income');
  const spent = expenses.filter((row) => row.amount > 0);
  const earned = income.filter((row) => row.amount > 0);
  const label = scope === 'year' ? year : formatMonth(month);

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="group" aria-label="Category report period">
        <Button variant={scope === 'month' ? 'primary' : 'secondary'} onClick={() => setScope('month')}>This month</Button>
        <Button variant={scope === 'year' ? 'primary' : 'secondary'} onClick={() => setScope('year')}>Full year</Button>
      </div>
      <Card>
        <h2 className="mb-3 text-base font-semibold">Expense categories · {label}</h2>
        <CategoryBar rows={spent} />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-semibold">Expenses</h2>
          <MoneyTable
            columns={['Category', 'Amount', 'Share']}
            rows={spent.map((row) => [row.name, formatMoney(row.amount), formatPercent(row.percent)])}
            empty="No expenses in this period."
          />
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold">Income</h2>
          <MoneyTable
            columns={['Category', 'Amount', 'Share']}
            rows={earned.map((row) => [row.name, formatMoney(row.amount), formatPercent(row.percent)])}
            empty="No income in this period."
          />
        </Card>
      </div>
    </div>
  );
}

function BudgetReport({ state, month }) {
  const snapshot = budgetSnapshot(state, month);
  const rows = [...snapshot.rows].sort((left, right) => (right.used || 0) - (left.used || 0));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Budgeted" value={formatMoney(snapshot.totalBudget)} />
        <Summary label="Actual spending" value={formatMoney(snapshot.totalActual)} />
        <Summary label="Utilization" value={formatPercent(snapshot.used)} />
      </div>
      <Card>
        <h2 className="mb-3 text-base font-semibold">{formatMonth(month)} budget vs actual</h2>
        <MoneyTable
          columns={['Category', 'Budget', 'Actual', 'Variance', 'Used']}
          rows={rows.map((row) => [
            row.name,
            row.budget > 0 ? formatMoney(row.budget) : '—',
            formatMoney(row.actual),
            row.budget > 0
              ? (row.variance >= 0 ? `${formatMoney(row.variance)} under` : `${formatMoney(Math.abs(row.variance))} over`)
              : 'No budget',
            formatPercent(row.used),
          ])}
          empty="Add expense categories to compare a budget with spending."
        />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Actual includes every expense in {formatMonth(month)}. A positive variance means you spent less than planned.
        </p>
      </Card>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

function MoneyTable({ columns, rows, empty }) {
  if (!rows.length) return <p className="text-sm text-slate-500 dark:text-slate-400">{empty || 'Nothing to show.'}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {columns.map((column) => (
              <th key={column} scope="col" className="px-2 py-2 font-semibold">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('|')} className="border-b border-slate-100 dark:border-slate-800">
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`} className={`px-2 py-2 ${index === 0 ? 'font-medium' : 'tabular-nums'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
