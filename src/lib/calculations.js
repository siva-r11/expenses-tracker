import { addDaysISO, formatMonthShort, monthsEndingAt, monthsInYear } from './dates';
import { roundMoney } from './money';

export function categoryName(categories, categoryId) {
  return categories.find((category) => category.id === categoryId)?.name || 'Uncategorized';
}

export function categoryColor(categories, categoryId) {
  return categories.find((category) => category.id === categoryId)?.color || '#64748b';
}

export function percentChange(current, previous) {
  if (previous == null || !Number.isFinite(previous) || previous === 0) {
    if (current == null || !Number.isFinite(current) || current === 0) return null;
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function sumAmounts(transactions) {
  return roundMoney(transactions.reduce((total, transaction) => total + Number(transaction.amount || 0), 0));
}

export function totalsFor(transactions) {
  const income = sumAmounts(transactions.filter((transaction) => transaction.type === 'income'));
  const expenses = sumAmounts(transactions.filter((transaction) => transaction.type === 'expense'));
  const balance = roundMoney(income - expenses);
  const savingsRate = income > 0 ? (balance / income) * 100 : null;
  return {
    income,
    expenses,
    balance,
    savingsRate,
    count: transactions.length,
  };
}

export function transactionsInMonth(transactions, month) {
  return transactions.filter((transaction) => transaction.date.slice(0, 7) === month);
}

export function transactionsInYear(transactions, year) {
  return transactions.filter((transaction) => transaction.date.slice(0, 4) === year);
}

export function compareTransactions(left, right) {
  if (left.date !== right.date) return right.date.localeCompare(left.date);
  return (right.createdAt || 0) - (left.createdAt || 0);
}

export function filterTransactions(transactions, categories, filters) {
  const query = (filters.query || '').trim().toLowerCase();
  return transactions
    .filter((transaction) => {
      if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) return false;
      if (filters.categoryId && filters.categoryId !== 'all' && transaction.categoryId !== filters.categoryId) {
        return false;
      }
      if (filters.month && filters.month !== 'all' && transaction.date.slice(0, 7) !== filters.month) return false;
      if (filters.from && transaction.date < filters.from) return false;
      if (filters.to && transaction.date > filters.to) return false;
      if (query) {
        const name = categoryName(categories, transaction.categoryId).toLowerCase();
        const haystack = `${transaction.note || ''} ${name} ${transaction.type} ${transaction.amount}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort(compareTransactions);
}

export function sumByCategory(transactions, categories, type) {
  const matching = transactions.filter((transaction) => transaction.type === type);
  const amounts = new Map();
  matching.forEach((transaction) => {
    amounts.set(transaction.categoryId, (amounts.get(transaction.categoryId) || 0) + Number(transaction.amount));
  });

  const known = categories.filter((category) => category.type === type);
  const rows = known.map((category) => ({
    categoryId: category.id,
    name: category.name,
    color: category.color,
    amount: roundMoney(amounts.get(category.id) || 0),
  }));

  amounts.forEach((amount, categoryId) => {
    if (!known.some((category) => category.id === categoryId) && amount > 0) {
      rows.push({
        categoryId,
        name: categoryName(categories, categoryId),
        color: '#64748b',
        amount: roundMoney(amount),
      });
    }
  });

  const total = roundMoney(rows.reduce((sum, row) => sum + row.amount, 0));
  return rows
    .map((row) => ({
      ...row,
      percent: total > 0 ? (row.amount / total) * 100 : 0,
    }))
    .sort((left, right) => right.amount - left.amount);
}

export function spendingTrend(transactions, endMonth, count = 6) {
  return monthsEndingAt(endMonth, count).map((month) => {
    const totals = totalsFor(transactionsInMonth(transactions, month));
    return {
      month,
      label: formatMonthShort(month),
      income: totals.income,
      expenses: totals.expenses,
      balance: totals.balance,
    };
  });
}

export function yearSeries(transactions, year) {
  return monthsInYear(year).map((month) => {
    const totals = totalsFor(transactionsInMonth(transactions, month));
    return {
      month,
      label: formatMonthShort(month).replace(` ${year}`, ''),
      ...totals,
    };
  });
}

export function budgetSnapshot(state, month) {
  const expenseCategories = state.categories.filter((category) => category.type === 'expense');
  const monthExpenses = transactionsInMonth(state.transactions, month).filter(
    (transaction) => transaction.type === 'expense',
  );
  const spent = new Map();
  monthExpenses.forEach((transaction) => {
    spent.set(transaction.categoryId, (spent.get(transaction.categoryId) || 0) + Number(transaction.amount));
  });

  const budgetByCategory = new Map();
  state.budgets.forEach((budget) => {
    if (budget.month === month) budgetByCategory.set(budget.categoryId, Number(budget.amount) || 0);
  });

  const rows = expenseCategories.map((category) => {
    const actual = roundMoney(spent.get(category.id) || 0);
    const budget = roundMoney(budgetByCategory.get(category.id) || 0);
    spent.delete(category.id);
    return {
      categoryId: category.id,
      name: category.name,
      color: category.color,
      actual,
      budget,
      variance: roundMoney(budget - actual),
      used: budget > 0 ? (actual / budget) * 100 : null,
      synthetic: false,
    };
  });

  spent.forEach((amount, categoryId) => {
    const actual = roundMoney(amount);
    if (actual <= 0) return;
    rows.push({
      categoryId,
      name: categoryName(state.categories, categoryId),
      color: '#64748b',
      actual,
      budget: 0,
      variance: roundMoney(-actual),
      used: null,
      synthetic: true,
    });
  });

  const totalBudget = roundMoney(rows.reduce((sum, row) => sum + row.budget, 0));
  const totalActual = roundMoney(rows.reduce((sum, row) => sum + row.actual, 0));
  return {
    rows,
    totalBudget,
    totalActual,
    remaining: roundMoney(totalBudget - totalActual),
    used: totalBudget > 0 ? (totalActual / totalBudget) * 100 : null,
  };
}

export function classifyBill(bill, today) {
  if (bill.paid) return 'paid';
  if (bill.dueDate < today) return 'overdue';
  if (bill.dueDate <= addDaysISO(today, 7)) return 'soon';
  return 'later';
}

export function categoryUsage(state, categoryId) {
  return {
    transactions: state.transactions.filter((transaction) => transaction.categoryId === categoryId).length,
    budgets: state.budgets.filter((budget) => budget.categoryId === categoryId).length,
    recurrences: state.recurrences.filter((rule) => rule.categoryId === categoryId).length,
    bills: state.bills.filter((bill) => bill.categoryId === categoryId).length,
  };
}

export function usageTotal(usage) {
  return usage.transactions + usage.budgets + usage.recurrences + usage.bills;
}
