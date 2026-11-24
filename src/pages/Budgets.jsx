import { useEffect, useMemo, useState } from 'react';
import { Button, Card, EmptyState, PageHeader, fieldClass } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { budgetSnapshot, totalsFor, transactionsInMonth } from '../lib/calculations';
import { formatMonth } from '../lib/dates';
import { formatMoney, parseAmount } from '../lib/money';

function draftFrom(state, month) {
  const snapshot = budgetSnapshot(state, month);
  const draft = {};
  snapshot.rows.filter((row) => !row.synthetic).forEach((row) => {
    draft[row.categoryId] = row.budget > 0 ? row.budget.toFixed(2) : '';
  });
  return draft;
}

export function Budgets() {
  const { state, selectedMonth, setBudgetsForMonth } = useFinance();
  const snapshot = useMemo(() => budgetSnapshot(state, selectedMonth), [state, selectedMonth]);
  const rows = snapshot.rows.filter((row) => !row.synthetic);
  const savedKey = state.budgets
    .filter((budget) => budget.month === selectedMonth)
    .map((budget) => `${budget.categoryId}:${budget.amount}`)
    .join('|');
  const [draft, setDraft] = useState(() => draftFrom(state, selectedMonth));
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const monthTotals = totalsFor(transactionsInMonth(state.transactions, selectedMonth));

  useEffect(() => {
    setDraft(draftFrom(state, selectedMonth));
    setErrors({});
    setDirty(false);
  }, [selectedMonth, savedKey, state.categories, state.budgets]);

  function updateDraft(categoryId, value) {
    setDraft((current) => ({ ...current, [categoryId]: value }));
    setDirty(true);
  }

  function save(event) {
    event.preventDefault();
    const nextErrors = {};
    const entries = rows.map((row) => {
      const raw = (draft[row.categoryId] || '').trim();
      if (!raw) return { categoryId: row.categoryId, amount: 0 };
      const amount = parseAmount(raw);
      if (amount == null || amount < 0) {
        nextErrors[row.categoryId] = 'Enter a valid amount, or leave it blank to clear the budget.';
        return null;
      }
      return { categoryId: row.categoryId, amount };
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || entries.some((entry) => !entry)) return;
    setBudgetsForMonth(selectedMonth, entries);
  }

  return (
    <div>
      <PageHeader
        title="Budgets"
        description={`Plan ${formatMonth(selectedMonth)} by expense category. Blank means no budget. Spent amounts come from expenses dated in this month.`}
        actions={<Button type="submit" form="budget-form" disabled={!dirty}>Save budgets</Button>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budgeted</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(snapshot.totalBudget)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spent</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(snapshot.totalActual)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Month income</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(monthTotals.income)}</p>
        </Card>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon="budget" title="No expense categories" message="Add an expense category before setting a budget." />
        ) : (
          <form id="budget-form" onSubmit={save} className="space-y-3">
            {rows.map((row) => {
              const raw = (draft[row.categoryId] || '').trim();
              const typed = raw ? parseAmount(raw) : 0;
              const planned = typed == null || typed < 0 ? null : typed;
              const remaining = planned == null ? null : planned - row.actual;
              return (
                <div key={row.categoryId} className="grid items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
                    <span className="font-medium">{row.name}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Spent {formatMoney(row.actual)}</p>
                  <div>
                    <label className="sr-only" htmlFor={`budget-${row.categoryId}`}>Budget for {row.name}</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                      <input
                        id={`budget-${row.categoryId}`}
                        inputMode="decimal"
                        className={`${fieldClass} pl-7`}
                        value={draft[row.categoryId] || ''}
                        placeholder="0.00"
                        aria-invalid={Boolean(errors[row.categoryId])}
                        onChange={(event) => updateDraft(row.categoryId, event.target.value)}
                      />
                    </div>
                    {errors[row.categoryId] && <p className="mt-1 text-sm text-rose-600" role="alert">{errors[row.categoryId]}</p>}
                  </div>
                  <p className={`text-sm tabular-nums ${remaining != null && remaining < 0 ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {planned == null ? 'Check the amount' : planned === 0 ? 'No budget' : remaining >= 0 ? `${formatMoney(remaining)} left` : `${formatMoney(Math.abs(remaining))} over`}
                  </p>
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={!dirty}>{dirty ? 'Save budgets' : 'Saved'}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
