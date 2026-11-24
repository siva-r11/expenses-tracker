import { isValidISODate } from './dates';
import { parseAmount } from './money';

export function validateTransactionFields({ amount, categoryId, date }) {
  const errors = {};
  const parsed = parseAmount(amount);
  if (parsed == null || parsed <= 0) errors.amount = 'Enter an amount greater than 0.';
  if (!categoryId) errors.categoryId = 'Choose a category.';
  if (!isValidISODate(date)) errors.date = 'Enter a valid date.';
  return { errors, amount: parsed };
}

export function validateNamedAmount({ name, amount, date, dateLabel = 'date' }) {
  const errors = {};
  const trimmed = (name || '').trim();
  const parsed = parseAmount(amount);
  if (!trimmed) errors.name = 'Enter a name.';
  if (parsed == null || parsed <= 0) errors.amount = 'Enter an amount greater than 0.';
  if (!isValidISODate(date)) errors.date = `Enter a valid ${dateLabel}.`;
  return { errors, name: trimmed, amount: parsed };
}
