import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatMoneyCompact, formatPercent } from '../lib/money';
import '../lib/chartSetup';
import { EmptyState } from './ui';

function useChartColors() {
  const { theme } = useFinance();
  const dark = theme === 'dark';
  return {
    text: dark ? '#cbd5e1' : '#334155',
    muted: dark ? '#94a3b8' : '#64748b',
    grid: dark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(15, 23, 42, 0.06)',
    income: '#0f766e',
    expense: '#e11d48',
    incomeFill: dark ? 'rgba(45, 212, 191, 0.16)' : 'rgba(15, 118, 110, 0.14)',
    expenseFill: dark ? 'rgba(251, 113, 133, 0.16)' : 'rgba(225, 29, 72, 0.12)',
    average: dark ? '#94a3b8' : '#64748b',
  };
}

function baseOptions(colors, { indexAxis = 'x', legend = true } = {}) {
  const valueAxis = {
    ticks: { color: colors.text, callback: (value) => formatMoneyCompact(value) },
    grid: { color: colors.grid },
    beginAtZero: true,
  };
  const labelAxis = {
    ticks: { color: colors.text },
    grid: { display: false },
  };
  const horizontal = indexAxis === 'y';
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis,
    plugins: {
      legend: legend
        ? { position: 'bottom', labels: { color: colors.text, boxWidth: 12, padding: 14 } }
        : { display: false },
    },
    scales: {
      x: horizontal ? valueAxis : labelAxis,
      y: horizontal ? labelAxis : valueAxis,
    },
  };
}

const doughnutCenterPlugin = {
  id: 'doughnutCenter',
  afterDraw(chart, _args, options) {
    const { ctx, chartArea } = chart;
    if (!chartArea || !options?.lines?.length) return;
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    options.lines.forEach((line, index) => {
      const offset = (index - (options.lines.length - 1) / 2) * 18;
      ctx.fillStyle = line.color;
      ctx.font = line.font;
      ctx.fillText(line.text, centerX, centerY + offset);
    });
    ctx.restore();
  },
};

export function ExpenseDoughnut({ rows }) {
  const colors = useChartColors();
  const visible = rows.filter((row) => row.amount > 0);
  if (!visible.length) {
    return <EmptyState compact icon="chart" title="No expenses yet" message="Category spending for this period will appear here." />;
  }
  const total = visible.reduce((sum, row) => sum + row.amount, 0);
  return (
    <div className="h-72" role="img" aria-label="Expense breakdown by category">
      <Doughnut
        key={colors.text}
        data={{
          labels: visible.map((row) => row.name),
          datasets: [{
            data: visible.map((row) => row.amount),
            backgroundColor: visible.map((row) => row.color),
            borderWidth: 0,
          }],
        }}
        plugins={[doughnutCenterPlugin]}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { position: 'bottom', labels: { color: colors.text, boxWidth: 12, padding: 12 } },
            tooltip: {
              callbacks: {
                label(context) {
                  const values = context.dataset.data;
                  const amount = values[context.dataIndex];
                  const percent = total ? (amount / total) * 100 : 0;
                  return ` ${context.label}: ${formatMoney(amount)} (${formatPercent(percent)})`;
                },
              },
            },
            doughnutCenter: {
              lines: [
                { text: 'Spent', color: colors.muted, font: '600 11px Segoe UI, sans-serif' },
                { text: formatMoneyCompact(total), color: colors.text, font: '700 16px Segoe UI, sans-serif' },
              ],
            },
          },
        }}
      />
    </div>
  );
}

export function CategoryBar({ rows }) {
  const colors = useChartColors();
  const visible = [...rows].filter((row) => row.amount > 0).sort((left, right) => right.amount - left.amount);
  if (!visible.length) {
    return <EmptyState compact icon="chart" title="No category spending" message="Add expenses to compare categories." />;
  }
  return (
    <div className="h-80 sm:h-80" role="img" aria-label="Spending by category">
      <Bar
        key={colors.text}
        data={{
          labels: visible.map((row) => row.name),
          datasets: [{
            label: 'Spent',
            data: visible.map((row) => row.amount),
            backgroundColor: visible.map((row) => row.color),
            borderRadius: 6,
          }],
        }}
        options={{
          ...baseOptions(colors, { indexAxis: 'y', legend: false }),
          plugins: {
            ...baseOptions(colors, { indexAxis: 'y', legend: false }).plugins,
            tooltip: {
              callbacks: {
                title: (items) => items[0]?.label || '',
                label: (context) => ` ${formatMoney(context.parsed.x)}`,
              },
            },
          },
        }}
      />
    </div>
  );
}

export function TrendLine({ points }) {
  const colors = useChartColors();
  const hasMoney = points.some((point) => point.income > 0 || point.expenses > 0);
  if (!hasMoney) {
    return <EmptyState compact icon="chart" title="No trend yet" message="Income and spending across months will show up here." />;
  }
  const expenseAverage = points.reduce((sum, point) => sum + point.expenses, 0) / points.length;
  const latest = points[points.length - 1];
  const vsAverage = expenseAverage > 0
    ? ((latest.expenses - expenseAverage) / expenseAverage) * 100
    : null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          This month · {formatMoney(latest.expenses)} spent
        </span>
        {vsAverage != null && Number.isFinite(vsAverage) && (
          <span>
            {vsAverage >= 0 ? '+' : ''}
            {vsAverage.toFixed(0)}% vs 6-month avg ({formatMoney(expenseAverage)})
          </span>
        )}
      </div>
      <div className="h-72" role="img" aria-label="Income and spending trend">
        <Line
          key={colors.text}
          data={{
            labels: points.map((point) => point.label),
            datasets: [
              {
                label: 'Income',
                data: points.map((point) => point.income),
                borderColor: colors.income,
                backgroundColor: colors.incomeFill,
                fill: true,
                tension: 0.3,
                pointRadius: points.map((_, index) => (index === points.length - 1 ? 5 : 3)),
                pointHoverRadius: 6,
              },
              {
                label: 'Expenses',
                data: points.map((point) => point.expenses),
                borderColor: colors.expense,
                backgroundColor: colors.expenseFill,
                fill: true,
                tension: 0.3,
                pointRadius: points.map((_, index) => (index === points.length - 1 ? 5 : 3)),
                pointHoverRadius: 6,
              },
              {
                label: 'Expense avg',
                data: points.map(() => expenseAverage),
                borderColor: colors.average,
                borderDash: [6, 4],
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
                tension: 0,
              },
            ],
          }}
          options={{
            ...baseOptions(colors),
            plugins: {
              ...baseOptions(colors).plugins,
              tooltip: {
                callbacks: {
                  label: (context) => ` ${context.dataset.label}: ${formatMoney(context.parsed.y)}`,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export function YearCompareBar({ points }) {
  const colors = useChartColors();
  return (
    <div className="h-80" role="img" aria-label="Yearly income and expenses by month">
      <Bar
        key={colors.text}
        data={{
          labels: points.map((point) => point.label),
          datasets: [
            {
              label: 'Income',
              data: points.map((point) => point.income),
              backgroundColor: colors.income,
              borderRadius: 4,
            },
            {
              label: 'Expenses',
              data: points.map((point) => point.expenses),
              backgroundColor: colors.expense,
              borderRadius: 4,
            },
          ],
        }}
        options={{
          ...baseOptions(colors),
          plugins: {
            ...baseOptions(colors).plugins,
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.dataset.label}: ${formatMoney(context.parsed.y)}`,
              },
            },
          },
        }}
      />
    </div>
  );
}
