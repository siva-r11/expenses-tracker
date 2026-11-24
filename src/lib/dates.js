export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function currentMonth() {
  return todayISO().slice(0, 7);
}

export function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isValidMonth(value) {
  return /^\d{4}-\d{2}$/.test(value || '');
}

function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysISO(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function addMonthsISO(iso, count) {
  const [year, month, day] = iso.split('-').map(Number);
  const target = new Date(year, month - 1 + count, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return toISODate(new Date(target.getFullYear(), target.getMonth(), Math.min(day, lastDay)));
}

export function addFrequency(iso, frequency) {
  if (frequency === 'weekly') return addDaysISO(iso, 7);
  if (frequency === 'yearly') return addMonthsISO(iso, 12);
  return addMonthsISO(iso, 1);
}

export function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthsEndingAt(endMonth, count) {
  const months = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    months.push(shiftMonth(endMonth, -index));
  }
  return months;
}

export function monthsInYear(year) {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`);
}

export function yearOf(month) {
  return month.slice(0, 4);
}

export function formatMonth(month, options = { month: 'long', year: 'numeric' }) {
  if (!isValidMonth(month)) return month || '';
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', options);
}

export function formatMonthShort(month) {
  return formatMonth(month, { month: 'short', year: 'numeric' });
}

export function formatDisplayDate(iso) {
  if (!isValidISODate(iso)) return iso || '';
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysBetween(fromISO, toISO) {
  const milliseconds = parseISODate(toISO) - parseISODate(fromISO);
  return Math.round(milliseconds / 86400000);
}

export function dueLabel(dueDate, today) {
  const days = daysBetween(today, dueDate);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${days} days`;
  const overdue = Math.abs(days);
  return overdue === 1 ? '1 day overdue' : `${overdue} days overdue`;
}

export function dateInMonth(month, day) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return `${month}-${String(safeDay).padStart(2, '0')}`;
}
