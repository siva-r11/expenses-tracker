import { categoryUsage } from './calculations';
import { CUSTOM_COLORS, SCHEMA_VERSION, STORAGE_KEY, defaultCategories } from './constants';
import {
  addFrequency,
  addMonthsISO,
  currentMonth,
  dateInMonth,
  isValidISODate,
  isValidMonth,
  monthsEndingAt,
  todayISO,
} from './dates';
import { roundMoney } from './money';

export { STORAGE_KEY };

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function earlierDate(left, right) {
  if (left && right) return left < right ? left : right;
  return left || right || '';
}

function makeRecurringTransaction(rule, date, occurrenceKey) {
  const note = (rule.note || '').trim();
  return {
    id: createId(),
    type: rule.type,
    amount: roundMoney(rule.amount),
    categoryId: rule.categoryId,
    date,
    note: note || 'Recurring',
    recurringId: rule.id,
    occurrenceKey,
    createdAt: Date.now(),
  };
}

export function materializeRecurrences(state, today = todayISO()) {
  let changed = false;
  const transactions = [...state.transactions];
  const existingKeys = new Set(transactions.map((transaction) => transaction.occurrenceKey).filter(Boolean));

  const recurrences = state.recurrences.map((rule) => {
    if (rule.paused) return rule;
    const anchor = earlierDate(rule.startDate, rule.nextDate);
    if (!anchor || !isValidISODate(anchor)) return rule;

    const posted = new Set(rule.postedKeys || []);
    let cursor = anchor;
    let guard = 0;
    let ruleChanged = false;

    while (cursor <= today && guard < 600) {
      const occurrenceKey = `${rule.id}:${cursor}`;
      if (!posted.has(occurrenceKey)) {
        if (!existingKeys.has(occurrenceKey)) {
          transactions.push(makeRecurringTransaction(rule, cursor, occurrenceKey));
          existingKeys.add(occurrenceKey);
        }
        posted.add(occurrenceKey);
        ruleChanged = true;
      }
      const next = addFrequency(cursor, rule.frequency);
      if (!next || next <= cursor) break;
      cursor = next;
      guard += 1;
    }

    if (!ruleChanged && rule.nextDate === cursor) return rule;
    changed = true;
    return { ...rule, nextDate: cursor, postedKeys: [...posted] };
  });

  if (!changed) return state;
  return { ...state, transactions, recurrences };
}

function pushSample(transactions, today, transaction) {
  if (transaction.date > today) return;
  transactions.push({
    id: createId(),
    note: '',
    recurringId: null,
    occurrenceKey: null,
    createdAt: Date.parse(`${transaction.date}T12:00:00`) || Date.now(),
    ...transaction,
    amount: roundMoney(transaction.amount),
  });
}

export function createSeedState(now = new Date()) {
  const todayValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const month = todayValue.slice(0, 7);
  const months = monthsEndingAt(month, 6);
  const transactions = [];
  const salaries = [5100, 5180, 5250, 5320, 5380, 5460];

  months.forEach((yearMonth, index) => {
    pushSample(transactions, todayValue, {
      type: 'income',
      amount: salaries[index],
      categoryId: 'inc-salary',
      date: dateInMonth(yearMonth, 1),
      note: 'Paycheck',
    });
    if (index === 4) {
      pushSample(transactions, todayValue, {
        type: 'income',
        amount: 320,
        categoryId: 'inc-other',
        date: dateInMonth(yearMonth, 18),
        note: 'Freelance invoice',
      });
    }
    pushSample(transactions, todayValue, {
      type: 'expense',
      amount: 1680,
      categoryId: 'exp-rent',
      date: dateInMonth(yearMonth, 1),
      note: 'Apartment rent',
    });
    pushSample(transactions, todayValue, {
      type: 'expense',
      amount: 86.4 + index * 2.15,
      categoryId: 'exp-groceries',
      date: dateInMonth(yearMonth, 3),
      note: 'Kroger',
    });
    pushSample(transactions, todayValue, {
      type: 'expense',
      amount: 74.52,
      categoryId: 'exp-groceries',
      date: dateInMonth(yearMonth, 16),
      note: "Trader Joe's",
    });
    pushSample(transactions, todayValue, {
      type: 'expense',
      amount: 118.25 + (index % 3) * 8.4,
      categoryId: 'exp-utilities',
      date: dateInMonth(yearMonth, 6),
      note: 'Electric and water',
    });
    pushSample(transactions, todayValue, {
      type: 'expense',
      amount: 46.2,
      categoryId: 'exp-transport',
      date: dateInMonth(yearMonth, 4),
      note: 'Gas',
    });
    pushSample(transactions, todayValue, {
      type: 'expense',
      amount: 38.75,
      categoryId: 'exp-transport',
      date: dateInMonth(yearMonth, 19),
      note: 'Transit pass',
    });
    pushSample(transactions, todayValue, {
      type: 'expense',
      amount: 214.5,
      categoryId: 'exp-insurance',
      date: dateInMonth(yearMonth, 8),
      note: 'Auto insurance',
    });
    pushSample(transactions, todayValue, {
      type: 'expense',
      amount: 15.99,
      categoryId: 'exp-entertainment',
      date: dateInMonth(yearMonth, 11),
      note: 'Streaming',
    });
    pushSample(transactions, todayValue, {
      type: 'expense',
      amount: 300,
      categoryId: 'exp-investments',
      date: dateInMonth(yearMonth, 9),
      note: 'Brokerage transfer',
    });
    if (index % 2 === 0) {
      pushSample(transactions, todayValue, {
        type: 'expense',
        amount: 54.8 + index * 4.25,
        categoryId: 'exp-shopping',
        date: dateInMonth(yearMonth, 12),
        note: 'Household goods',
      });
    }
    if (index === 2) {
      pushSample(transactions, todayValue, {
        type: 'expense',
        amount: 45,
        categoryId: 'exp-medical',
        date: dateInMonth(yearMonth, 14),
        note: 'Clinic copay',
      });
    }
    if (index === 1) {
      pushSample(transactions, todayValue, {
        type: 'expense',
        amount: 89,
        categoryId: 'exp-education',
        date: dateInMonth(yearMonth, 10),
        note: 'Online course',
      });
    }
    if (index === 3) {
      pushSample(transactions, todayValue, {
        type: 'expense',
        amount: 120,
        categoryId: 'exp-childcare',
        date: dateInMonth(yearMonth, 5),
        note: 'After-school care',
      });
    }
    if (index === 5) {
      pushSample(transactions, todayValue, {
        type: 'expense',
        amount: 22.15,
        categoryId: 'exp-misc',
        date: dateInMonth(yearMonth, 7),
        note: 'Pharmacy extras',
      });
    }
  });

  const budgetAmounts = [
    ['exp-rent', 1680],
    ['exp-groceries', 480],
    ['exp-utilities', 160],
    ['exp-transport', 150],
    ['exp-shopping', 120],
    ['exp-medical', 75],
    ['exp-insurance', 220],
    ['exp-entertainment', 80],
    ['exp-investments', 300],
    ['exp-education', 50],
    ['exp-misc', 60],
  ];

  const nextMonthFirst = addMonthsISO(`${month}-01`, 1);
  const [year, monthNumber, day] = todayValue.split('-').map(Number);
  const dueDate = new Date(year, monthNumber - 1, day + 5);
  const billDue = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
  const goalDate = addMonthsISO(todayValue, 8);
  const firstContribution = dateInMonth(months[2], 2);
  const secondContribution = dateInMonth(months[4], 2);

  return {
    version: SCHEMA_VERSION,
    theme: 'light',
    selectedMonth: month,
    categories: defaultCategories(),
    transactions,
    budgets: budgetAmounts.map(([categoryId, amount]) => ({
      id: createId(),
      month,
      categoryId,
      amount,
    })),
    recurrences: [
      {
        id: 'rec-rent',
        type: 'expense',
        amount: 1680,
        categoryId: 'exp-rent',
        frequency: 'monthly',
        startDate: nextMonthFirst,
        nextDate: nextMonthFirst,
        note: 'Apartment rent',
        paused: false,
        postedKeys: [],
      },
      {
        id: 'rec-salary',
        type: 'income',
        amount: 5460,
        categoryId: 'inc-salary',
        frequency: 'monthly',
        startDate: nextMonthFirst,
        nextDate: nextMonthFirst,
        note: 'Paycheck',
        paused: false,
        postedKeys: [],
      },
    ],
    bills: [
      {
        id: 'bill-electric',
        name: 'Electric bill',
        amount: 96.4,
        dueDate: billDue,
        categoryId: 'exp-utilities',
        paid: false,
        note: 'City power',
        transactionId: null,
      },
    ],
    goals: [
      {
        id: 'goal-emergency',
        name: 'Emergency fund',
        targetAmount: 10000,
        currentAmount: 2750,
        targetDate: goalDate,
        contributions: [
          {
            id: 'contrib-start',
            amount: 2000,
            date: firstContribution > todayValue ? todayValue : firstContribution,
            note: 'Starting balance',
          },
          {
            id: 'contrib-transfer',
            amount: 750,
            date: secondContribution > todayValue ? todayValue : secondContribution,
            note: 'Monthly transfer',
          },
        ],
      },
    ],
  };
}

function normalizeCategory(category) {
  if (!category?.id || !category?.name) return null;
  if (category.type !== 'income' && category.type !== 'expense') return null;
  return {
    id: String(category.id),
    name: String(category.name),
    type: category.type,
    isDefault: Boolean(category.isDefault),
    color: typeof category.color === 'string' ? category.color : '#64748b',
  };
}

function normalizeTransaction(transaction) {
  if (!transaction?.id) return null;
  if (transaction.type !== 'income' && transaction.type !== 'expense') return null;
  if (!isValidISODate(transaction.date)) return null;
  const amount = roundMoney(transaction.amount);
  if (amount <= 0) return null;
  return {
    id: String(transaction.id),
    type: transaction.type,
    amount,
    categoryId: String(transaction.categoryId || ''),
    date: transaction.date,
    note: String(transaction.note || ''),
    recurringId: transaction.recurringId ? String(transaction.recurringId) : null,
    occurrenceKey: transaction.occurrenceKey ? String(transaction.occurrenceKey) : null,
    createdAt: Number(transaction.createdAt) || 0,
  };
}

function normalizeRecurrence(rule) {
  if (!rule?.id) return null;
  if (rule.type !== 'income' && rule.type !== 'expense') return null;
  if (!['weekly', 'monthly', 'yearly'].includes(rule.frequency)) return null;
  if (!isValidISODate(rule.nextDate)) return null;
  const amount = roundMoney(rule.amount);
  if (amount <= 0) return null;
  return {
    id: String(rule.id),
    type: rule.type,
    amount,
    categoryId: String(rule.categoryId || ''),
    frequency: rule.frequency,
    startDate: isValidISODate(rule.startDate) ? rule.startDate : rule.nextDate,
    nextDate: rule.nextDate,
    note: String(rule.note || ''),
    paused: Boolean(rule.paused),
    postedKeys: Array.isArray(rule.postedKeys) ? rule.postedKeys.map(String) : [],
  };
}

function normalizeBill(bill) {
  if (!bill?.id || !bill?.name) return null;
  if (!isValidISODate(bill.dueDate)) return null;
  const amount = roundMoney(bill.amount);
  if (amount <= 0) return null;
  return {
    id: String(bill.id),
    name: String(bill.name),
    amount,
    dueDate: bill.dueDate,
    categoryId: String(bill.categoryId || ''),
    paid: Boolean(bill.paid),
    note: String(bill.note || ''),
    transactionId: bill.transactionId ? String(bill.transactionId) : null,
  };
}

function normalizeGoal(goal) {
  if (!goal?.id || !goal?.name) return null;
  const targetAmount = roundMoney(goal.targetAmount);
  if (targetAmount <= 0 || !isValidISODate(goal.targetDate)) return null;
  const contributions = Array.isArray(goal.contributions)
    ? goal.contributions
        .map((entry) => {
          if (!entry?.id || !isValidISODate(entry.date)) return null;
          const amount = roundMoney(entry.amount);
          if (amount <= 0) return null;
          return {
            id: String(entry.id),
            amount,
            date: entry.date,
            note: String(entry.note || ''),
          };
        })
        .filter(Boolean)
    : [];
  return {
    id: String(goal.id),
    name: String(goal.name),
    targetAmount,
    currentAmount: Math.max(0, roundMoney(goal.currentAmount)),
    targetDate: goal.targetDate,
    contributions,
  };
}

export function createEmptyState(previous) {
  return {
    version: SCHEMA_VERSION,
    theme: previous?.theme === 'dark' ? 'dark' : 'light',
    selectedMonth: currentMonth(),
    categories: defaultCategories(),
    transactions: [],
    budgets: [],
    recurrences: [],
    bills: [],
    goals: [],
  };
}

function normalizeState(parsed) {
  const categories = Array.isArray(parsed.categories)
    ? parsed.categories.map(normalizeCategory).filter(Boolean)
    : [];
  return {
    version: SCHEMA_VERSION,
    theme: parsed.theme === 'dark' ? 'dark' : 'light',
    selectedMonth: isValidMonth(parsed.selectedMonth) ? parsed.selectedMonth : currentMonth(),
    categories: categories.length ? categories : defaultCategories(),
    transactions: Array.isArray(parsed.transactions) ? parsed.transactions.map(normalizeTransaction).filter(Boolean) : [],
    budgets: Array.isArray(parsed.budgets)
      ? parsed.budgets
          .filter((budget) => budget?.categoryId && isValidMonth(budget.month))
          .map((budget) => ({
            id: String(budget.id || createId()),
            month: budget.month,
            categoryId: String(budget.categoryId),
            amount: roundMoney(budget.amount),
          }))
          .filter((budget) => budget.amount > 0)
      : [],
    recurrences: Array.isArray(parsed.recurrences) ? parsed.recurrences.map(normalizeRecurrence).filter(Boolean) : [],
    bills: Array.isArray(parsed.bills) ? parsed.bills.map(normalizeBill).filter(Boolean) : [],
    goals: Array.isArray(parsed.goals) ? parsed.goals.map(normalizeGoal).filter(Boolean) : [],
  };
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = materializeRecurrences(createSeedState());
      saveState(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== SCHEMA_VERSION) {
      const seeded = materializeRecurrences(createSeedState());
      saveState(seeded);
      return seeded;
    }
    const normalized = normalizeState(parsed);
    const materialized = materializeRecurrences(normalized);
    if (materialized !== normalized) saveState(materialized);
    return materialized;
  } catch {
    return materializeRecurrences(createSeedState());
  }
}

export function addTransaction(state, input) {
  const transaction = {
    id: createId(),
    type: input.type,
    amount: roundMoney(input.amount),
    categoryId: input.categoryId,
    date: input.date,
    note: (input.note || '').trim(),
    recurringId: null,
    occurrenceKey: null,
    createdAt: Date.now(),
  };
  return { ...state, transactions: [...state.transactions, transaction] };
}

export function updateTransaction(state, id, input) {
  return {
    ...state,
    transactions: state.transactions.map((transaction) => (
      transaction.id === id
        ? {
            ...transaction,
            type: input.type,
            amount: roundMoney(input.amount),
            categoryId: input.categoryId,
            date: input.date,
            note: (input.note || '').trim(),
          }
        : transaction
    )),
  };
}

export function deleteTransaction(state, id) {
  return {
    ...state,
    transactions: state.transactions.filter((transaction) => transaction.id !== id),
    bills: state.bills.map((bill) => (bill.transactionId === id ? { ...bill, transactionId: null } : bill)),
  };
}

export function setBudgetsForMonth(state, month, entries) {
  const kept = state.budgets.filter((budget) => budget.month !== month);
  const next = entries
    .map((entry) => ({ categoryId: entry.categoryId, amount: roundMoney(entry.amount) }))
    .filter((entry) => entry.amount > 0)
    .map((entry) => ({
      id: createId(),
      month,
      categoryId: entry.categoryId,
      amount: entry.amount,
    }));
  return { ...state, budgets: [...kept, ...next] };
}

function nextColor(categories) {
  const used = new Set(categories.map((category) => category.color));
  return CUSTOM_COLORS.find((color) => !used.has(color)) || CUSTOM_COLORS[categories.length % CUSTOM_COLORS.length];
}

export function addCategory(state, input) {
  const category = {
    id: createId(),
    name: input.name.trim(),
    type: input.type,
    isDefault: false,
    color: nextColor(state.categories),
  };
  return { ...state, categories: [...state.categories, category] };
}

export function renameCategory(state, id, name) {
  return {
    ...state,
    categories: state.categories.map((category) => (
      category.id === id ? { ...category, name: name.trim() } : category
    )),
  };
}

function mergeBudgets(budgets, fromId, toId) {
  if (!toId) return budgets.filter((budget) => budget.categoryId !== fromId);
  const merged = [];
  const index = new Map();
  budgets.forEach((budget) => {
    const categoryId = budget.categoryId === fromId ? toId : budget.categoryId;
    const key = `${budget.month}:${categoryId}`;
    const existing = index.get(key);
    if (existing) {
      existing.amount = roundMoney(existing.amount + budget.amount);
      return;
    }
    const copy = { ...budget, categoryId, amount: roundMoney(budget.amount) };
    index.set(key, copy);
    merged.push(copy);
  });
  return merged;
}

export function removeCategory(state, categoryId, reassignToId) {
  const usage = categoryUsage(state, categoryId);
  const total = usage.transactions + usage.budgets + usage.recurrences + usage.bills;
  if (total > 0 && !reassignToId) return state;
  const mapId = (id) => (id === categoryId ? reassignToId : id);
  return {
    ...state,
    categories: state.categories.filter((category) => category.id !== categoryId),
    transactions: state.transactions.map((transaction) => ({
      ...transaction,
      categoryId: mapId(transaction.categoryId),
    })),
    budgets: mergeBudgets(state.budgets, categoryId, reassignToId),
    recurrences: state.recurrences.map((rule) => ({ ...rule, categoryId: mapId(rule.categoryId) })),
    bills: state.bills.map((bill) => ({ ...bill, categoryId: mapId(bill.categoryId) })),
  };
}

export function addRecurrence(state, input) {
  const rule = {
    id: createId(),
    type: input.type,
    amount: roundMoney(input.amount),
    categoryId: input.categoryId,
    frequency: input.frequency,
    startDate: input.nextDate,
    nextDate: input.nextDate,
    note: (input.note || '').trim(),
    paused: false,
    postedKeys: [],
  };
  return { ...state, recurrences: [...state.recurrences, rule] };
}

export function updateRecurrence(state, id, input) {
  return {
    ...state,
    recurrences: state.recurrences.map((rule) => (
      rule.id === id
        ? {
            ...rule,
            type: input.type,
            amount: roundMoney(input.amount),
            categoryId: input.categoryId,
            frequency: input.frequency,
            nextDate: input.nextDate,
            note: (input.note || '').trim(),
          }
        : rule
    )),
  };
}

export function setRecurrencePaused(state, id, paused) {
  return {
    ...state,
    recurrences: state.recurrences.map((rule) => (rule.id === id ? { ...rule, paused } : rule)),
  };
}

export function deleteRecurrence(state, id) {
  return { ...state, recurrences: state.recurrences.filter((rule) => rule.id !== id) };
}

export function addBill(state, input) {
  const bill = {
    id: createId(),
    name: input.name.trim(),
    amount: roundMoney(input.amount),
    dueDate: input.dueDate,
    categoryId: input.categoryId,
    paid: false,
    note: (input.note || '').trim(),
    transactionId: null,
  };
  return { ...state, bills: [...state.bills, bill] };
}

export function updateBill(state, id, input) {
  return {
    ...state,
    bills: state.bills.map((bill) => (
      bill.id === id
        ? {
            ...bill,
            name: input.name.trim(),
            amount: roundMoney(input.amount),
            dueDate: input.dueDate,
            categoryId: input.categoryId,
            note: (input.note || '').trim(),
          }
        : bill
    )),
  };
}

export function deleteBill(state, id) {
  return { ...state, bills: state.bills.filter((bill) => bill.id !== id) };
}

export function payBill(state, id, { recordExpense, today }) {
  const bill = state.bills.find((item) => item.id === id);
  if (!bill) return state;
  let transactions = state.transactions;
  let transactionId = bill.transactionId;
  if (recordExpense) {
    const exists = transactionId && transactions.some((transaction) => transaction.id === transactionId);
    if (!exists) {
      const transaction = {
        id: createId(),
        type: 'expense',
        amount: roundMoney(bill.amount),
        categoryId: bill.categoryId,
        date: today,
        note: bill.dueDate === today ? bill.name : `${bill.name} (due ${bill.dueDate})`,
        recurringId: null,
        occurrenceKey: null,
        createdAt: Date.now(),
      };
      transactions = [...transactions, transaction];
      transactionId = transaction.id;
    }
  }
  return {
    ...state,
    transactions,
    bills: state.bills.map((item) => (item.id === id ? { ...item, paid: true, transactionId: transactionId || null } : item)),
  };
}

export function unpayBill(state, id) {
  return {
    ...state,
    bills: state.bills.map((bill) => (bill.id === id ? { ...bill, paid: false } : bill)),
  };
}

export function addGoal(state, input) {
  const goal = {
    id: createId(),
    name: input.name.trim(),
    targetAmount: roundMoney(input.targetAmount),
    currentAmount: Math.max(0, roundMoney(input.currentAmount || 0)),
    targetDate: input.targetDate,
    contributions: [],
  };
  if (goal.currentAmount > 0) {
    goal.contributions.push({
      id: createId(),
      amount: goal.currentAmount,
      date: todayISO(),
      note: 'Opening balance',
    });
  }
  return { ...state, goals: [...state.goals, goal] };
}

export function updateGoal(state, id, input) {
  return {
    ...state,
    goals: state.goals.map((goal) => (
      goal.id === id
        ? {
            ...goal,
            name: input.name.trim(),
            targetAmount: roundMoney(input.targetAmount),
            currentAmount: Math.max(0, roundMoney(input.currentAmount || 0)),
            targetDate: input.targetDate,
          }
        : goal
    )),
  };
}

export function deleteGoal(state, id) {
  return { ...state, goals: state.goals.filter((goal) => goal.id !== id) };
}

export function addContribution(state, goalId, input) {
  const entry = {
    id: createId(),
    amount: roundMoney(input.amount),
    date: input.date,
    note: (input.note || '').trim(),
  };
  return {
    ...state,
    goals: state.goals.map((goal) => (
      goal.id === goalId
        ? {
            ...goal,
            currentAmount: roundMoney(goal.currentAmount + entry.amount),
            contributions: [...(goal.contributions || []), entry],
          }
        : goal
    )),
  };
}

export function deleteContribution(state, goalId, contributionId) {
  return {
    ...state,
    goals: state.goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      const entry = (goal.contributions || []).find((item) => item.id === contributionId);
      if (!entry) return goal;
      return {
        ...goal,
        currentAmount: Math.max(0, roundMoney(goal.currentAmount - entry.amount)),
        contributions: goal.contributions.filter((item) => item.id !== contributionId),
      };
    }),
  };
}
