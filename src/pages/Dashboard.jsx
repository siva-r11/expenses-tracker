import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CategoryBar, ExpenseDoughnut, TrendLine } from '../components/Charts';
import {
  Badge,
  Card,
  CategoryDot,
  DashboardSkeleton,
  EmptyState,
  InsightBanner,
  PageHeader,
  ProgressBar,
  StatCard,
  buttonClass,
  cx,
} from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import {
  budgetSnapshot,
  categoryColor,
  categoryName,
  classifyBill,
  compareTransactions,
  percentChange,
  spendingTrend,
  sumByCategory,
  totalsFor,
  transactionsInMonth,
} from '../lib/calculations';
import { dueLabel, formatMonth, shiftMonth, todayISO } from '../lib/dates';
import { formatMoney, formatPercent } from '../lib/money';

function StatIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function Dashboard() {
  const { state, selectedMonth } = useFinance();
  const [insightTab, setInsightTab] = useState('trend');
  const [loading, setLoading] = useState(false);
  const today = todayISO();

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, [selectedMonth]);

  const previousMonth = shiftMonth(selectedMonth, -1);
  const monthTransactions = useMemo(
    () => transactionsInMonth(state.transactions, selectedMonth),
    [state.transactions, selectedMonth],
  );
  const previousTransactions = useMemo(
    () => transactionsInMonth(state.transactions, previousMonth),
    [state.transactions, previousMonth],
  );
  const totals = totalsFor(monthTransactions);
  const previousTotals = totalsFor(previousTransactions);
  const budget = budgetSnapshot(state, selectedMonth);
  const breakdown = sumByCategory(monthTransactions, state.categories, 'expense').filter((row) => row.amount > 0);
  const trend = spendingTrend(state.transactions, selectedMonth, 6);
  const reminders = state.bills
    .map((bill) => ({ bill, timing: classifyBill(bill, today) }))
    .filter((item) => item.timing === 'overdue' || item.timing === 'soon')
    .sort((left, right) => left.bill.dueDate.localeCompare(right.bill.dueDate));
  const recent = [...monthTransactions].sort(compareTransactions).slice(0, 6);
  const expenseCount = monthTransactions.filter((transaction) => transaction.type === 'expense').length;
  const incomeSpark = trend.map((point) => point.income);
  const expenseSpark = trend.map((point) => point.expenses);
  const balanceSpark = trend.map((point) => point.balance);
  const savingsSpark = trend.map((point) => (
    point.income > 0 ? ((point.balance / point.income) * 100) : 0
  ));

  const insight = (() => {
    if (budget.totalBudget > 0 && budget.remaining < 0) {
      return {
        tone: 'bad',
        title: `${formatMoney(Math.abs(budget.remaining))} over budget`,
        message: `You've spent ${formatMoney(budget.totalActual)} of ${formatMoney(budget.totalBudget)} this month.`,
        action: <Link className={buttonClass('secondary', 'bg-white/80')} to="/budgets">Review budgets</Link>,
      };
    }
    if (reminders.some((item) => item.timing === 'overdue')) {
      const count = reminders.filter((item) => item.timing === 'overdue').length;
      return {
        tone: 'warn',
        title: `${count} overdue bill${count === 1 ? '' : 's'}`,
        message: 'Clear overdue bills to keep cash flow predictable.',
        action: <Link className={buttonClass('secondary', 'bg-white/80')} to="/bills">Open bills</Link>,
      };
    }
    if (totals.balance >= 0 && totals.income > 0) {
      return {
        tone: 'good',
        title: `${formatMoney(totals.balance)} remaining this month`,
        message: `Savings rate ${formatPercent(totals.savingsRate)} · ${formatMonth(selectedMonth)}`,
        action: <Link className={buttonClass('secondary', 'bg-white/80')} to="/goals">Put it toward a goal</Link>,
      };
    }
    return {
      tone: 'info',
      title: `Snapshot for ${formatMonth(selectedMonth)}`,
      message: totals.income > 0
        ? 'Track expenses against your plan as the month unfolds.'
        : 'Add income to unlock savings rate and clearer insights.',
      action: <Link className={buttonClass('primary')} to="/transactions?compose=income">Add income</Link>,
    };
  })();

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description={`${formatMonth(selectedMonth)} summary.`}
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${formatMonth(selectedMonth)} summary. The month control in the header updates these totals, the budget, and the reports.`}
        actions={(
          <>
            <Link className={buttonClass('secondary')} to="/transactions?compose=income">Add income</Link>
            <Link className={buttonClass('primary')} to="/transactions?compose=expense">Add expense</Link>
          </>
        )}
      />

      <InsightBanner {...insight} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total income"
          value={formatMoney(totals.income)}
          detail={formatMonth(selectedMonth)}
          tone="good"
          delta={percentChange(totals.income, previousTotals.income)}
          spark={incomeSpark}
          icon={<StatIcon><path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" /></StatIcon>}
        />
        <StatCard
          label="Total expenses"
          value={formatMoney(totals.expenses)}
          detail={expenseCount === 1 ? '1 expense' : `${expenseCount} expenses`}
          tone="bad"
          delta={percentChange(totals.expenses, previousTotals.expenses)}
          spark={expenseSpark}
          icon={<StatIcon><path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" /><path d="M4 12h16" /></StatIcon>}
        />
        <StatCard
          label="Remaining balance"
          value={formatMoney(totals.balance)}
          detail="Income minus expenses"
          tone={totals.balance < 0 ? 'bad' : 'good'}
          delta={percentChange(totals.balance, previousTotals.balance)}
          spark={balanceSpark}
          icon={<StatIcon><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></StatIcon>}
        />
        <StatCard
          label="Savings rate"
          value={formatPercent(totals.savingsRate)}
          detail={totals.income > 0 ? 'Remaining divided by income' : 'No income this month'}
          tone={totals.savingsRate != null && totals.savingsRate < 0 ? 'bad' : 'good'}
          delta={percentChange(totals.savingsRate, previousTotals.savingsRate)}
          spark={savingsSpark}
          icon={<StatIcon><path d="M12 21a8 8 0 1 0-8-8" /><path d="M12 13V7M9.5 9.5 12 7l2.5 2.5" /></StatIcon>}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Budget utilization</h2>
            <Link className="text-sm font-medium text-teal-800 hover:underline dark:text-teal-200" to="/budgets">Edit budget</Link>
          </div>
          {budget.totalBudget <= 0 ? (
            <EmptyState
              compact
              icon="budget"
              title="No budget for this month"
              message="Set a budget for each expense category to compare the plan with what you spent."
              action={<Link className={buttonClass('primary')} to="/budgets">Set budget</Link>}
            />
          ) : (
            <div className="space-y-4">
              <ProgressBar
                label="Overall spent vs budget"
                value={budget.totalActual}
                max={budget.totalBudget}
                remainingLabel={budget.remaining >= 0
                  ? `${formatMoney(budget.remaining)} left`
                  : `${formatMoney(Math.abs(budget.remaining))} over`}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Spent {formatMoney(budget.totalActual)} of {formatMoney(budget.totalBudget)}.
              </p>
              <div className="space-y-3">
                {budget.rows
                  .filter((row) => row.budget > 0 || row.actual > 0)
                  .slice(0, 6)
                  .map((row) => (
                    <div key={row.categoryId} className="flex items-start gap-2">
                      <CategoryDot color={row.color} className="mt-1.5" />
                      <div className="min-w-0 flex-1">
                        <ProgressBar
                          label={`${row.name} · ${formatMoney(row.actual)}`}
                          value={row.actual}
                          max={row.budget}
                          remainingLabel={row.budget > 0
                            ? (row.variance >= 0
                              ? `${formatMoney(row.variance)} left`
                              : `${formatMoney(Math.abs(row.variance))} over`)
                            : undefined}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-2 text-base font-semibold">Expense breakdown</h2>
          <ExpenseDoughnut rows={breakdown} />
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">More insights</h2>
          <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
            <button
              type="button"
              className={cx(
                'rounded-full px-3 py-1.5 text-sm font-medium transition',
                insightTab === 'trend'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
              )}
              onClick={() => setInsightTab('trend')}
            >
              Spending trend
            </button>
            <button
              type="button"
              className={cx(
                'rounded-full px-3 py-1.5 text-sm font-medium transition',
                insightTab === 'categories'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
              )}
              onClick={() => setInsightTab('categories')}
            >
              By category
            </button>
          </div>
        </div>
        {insightTab === 'trend' ? (
          <>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Income and expenses for the six months ending {formatMonth(selectedMonth)}.
            </p>
            <TrendLine points={trend} />
          </>
        ) : (
          <CategoryBar rows={breakdown} />
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Bills to watch</h2>
            <Link className="text-sm font-medium text-teal-800 hover:underline dark:text-teal-200" to="/bills">All bills</Link>
          </div>
          {reminders.length === 0 ? (
            <EmptyState compact icon="bills" title="Nothing due soon" message="Overdue bills and bills due within 7 days show up here." />
          ) : (
            <ul className="space-y-3">
              {reminders.map(({ bill, timing }) => (
                <li
                  key={bill.id}
                  className={cx(
                    'flex items-start justify-between gap-3 rounded-xl border px-3 py-3',
                    timing === 'overdue'
                      ? 'border-rose-300 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/40'
                      : 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cx(
                        'mt-1 h-8 w-1 shrink-0 rounded-full',
                        timing === 'overdue' ? 'bg-rose-500' : 'bg-amber-500',
                      )}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium">{bill.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {dueLabel(bill.dueDate, today)} · {categoryName(state.categories, bill.categoryId)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{formatMoney(bill.amount)}</p>
                    <Badge tone={timing === 'overdue' ? 'bad' : 'warn'}>{timing === 'overdue' ? 'Overdue' : 'Due soon'}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Savings goals</h2>
            <Link className="text-sm font-medium text-teal-800 hover:underline dark:text-teal-200" to="/goals">Manage goals</Link>
          </div>
          {state.goals.length === 0 ? (
            <EmptyState
              compact
              icon="goals"
              title="No goals yet"
              message="Track a target amount and add contributions as you save."
              action={<Link className={buttonClass('primary')} to="/goals">Add a goal</Link>}
            />
          ) : (
            <ul className="space-y-4">
              {state.goals.map((goal) => {
                const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
                return (
                  <li key={goal.id}>
                    <ProgressBar
                      label={`${goal.name} · ${formatMoney(goal.currentAmount)} of ${formatMoney(goal.targetAmount)}`}
                      value={goal.currentAmount}
                      max={goal.targetAmount}
                      tone="bg-teal-600"
                      remainingLabel={`${formatMoney(remaining)} to go`}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Recent transactions</h2>
          <Link className="text-sm font-medium text-teal-800 hover:underline dark:text-teal-200" to="/transactions">View all</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState compact icon="transactions" title="No transactions this month" message="Add income or an expense to fill in the month." />
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {recent.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryDot color={categoryColor(state.categories, transaction.categoryId)} />
                  <div className="min-w-0">
                    <p className="font-medium">{categoryName(state.categories, transaction.categoryId)}</p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {transaction.date}
                      {transaction.note ? ` · ${transaction.note}` : ''}
                    </p>
                  </div>
                </div>
                <p className={transaction.type === 'income'
                  ? 'shrink-0 font-semibold tabular-nums text-teal-800 dark:text-teal-200'
                  : 'shrink-0 font-semibold tabular-nums text-rose-800 dark:text-rose-200'}
                >
                  {transaction.type === 'income' ? '+' : '−'}
                  {formatMoney(transaction.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
