export const STORAGE_KEY = 'expense-tracker.v1';
export const SCHEMA_VERSION = 1;

export const EXPENSE_CATEGORY_DEFS = [
  { id: 'exp-rent', name: 'Rent', color: '#0f766e' },
  { id: 'exp-groceries', name: 'Groceries', color: '#16a34a' },
  { id: 'exp-utilities', name: 'Utilities', color: '#0284c7' },
  { id: 'exp-transport', name: 'Transportation', color: '#d97706' },
  { id: 'exp-shopping', name: 'Shopping', color: '#db2777' },
  { id: 'exp-medical', name: 'Medical', color: '#e11d48' },
  { id: 'exp-insurance', name: 'Insurance', color: '#4f46e5' },
  { id: 'exp-entertainment', name: 'Entertainment', color: '#7c3aed' },
  { id: 'exp-investments', name: 'Investments', color: '#0891b2' },
  { id: 'exp-education', name: 'Education', color: '#65a30d' },
  { id: 'exp-childcare', name: 'Child Care', color: '#ea580c' },
  { id: 'exp-misc', name: 'Miscellaneous', color: '#64748b' },
];

export const INCOME_CATEGORY_DEFS = [
  { id: 'inc-salary', name: 'Salary', color: '#0f766e' },
  { id: 'inc-other', name: 'Other', color: '#0369a1' },
];

export const CUSTOM_COLORS = [
  '#0f766e',
  '#0369a1',
  '#7c3aed',
  '#be123c',
  '#b45309',
  '#15803d',
  '#4338ca',
  '#a21caf',
  '#0e7490',
  '#b91c1c',
];

export const FREQUENCIES = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export function defaultCategories() {
  return [
    ...EXPENSE_CATEGORY_DEFS.map((category) => ({ ...category, type: 'expense', isDefault: true })),
    ...INCOME_CATEGORY_DEFS.map((category) => ({ ...category, type: 'income', isDefault: true })),
  ];
}

export function frequencyLabel(frequency) {
  return FREQUENCIES.find((item) => item.id === frequency)?.label || frequency;
}
