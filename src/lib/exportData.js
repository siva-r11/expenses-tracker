import { categoryName, totalsFor } from './calculations';
import { todayISO } from './dates';
import { formatMoneyPlain, formatPercent, roundMoney } from './money';

export function toExportRows(transactions, categories) {
  return [...transactions]
    .sort((left, right) => left.date.localeCompare(right.date) || (left.createdAt || 0) - (right.createdAt || 0))
    .map((transaction) => ({
      Date: transaction.date,
      Type: transaction.type === 'income' ? 'Income' : 'Expense',
      Category: categoryName(categories, transaction.categoryId),
      Note: transaction.note || '',
      Amount: transaction.type === 'expense' ? -roundMoney(transaction.amount) : roundMoney(transaction.amount),
      Recurring: transaction.recurringId ? 'Yes' : 'No',
    }));
}

export function exportBasename() {
  return `expense-tracker-${todayISO()}`;
}

export async function exportTransactionsExcel(transactions, categories, filename) {
  const loaded = await import('xlsx');
  const XLSX = loaded.default?.utils ? loaded.default : loaded;
  const rows = toExportRows(transactions, categories);
  const totals = totalsFor(transactions);
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Date: '', Type: '', Category: '', Note: '', Amount: '', Recurring: '' }]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Transactions');
  const summary = XLSX.utils.json_to_sheet([
    { Metric: 'Income', Value: totals.income },
    { Metric: 'Expenses', Value: totals.expenses },
    { Metric: 'Balance', Value: totals.balance },
    { Metric: 'Savings rate %', Value: totals.savingsRate == null ? '' : Number(totals.savingsRate.toFixed(1)) },
    { Metric: 'Transactions', Value: totals.count },
    { Metric: 'Sign convention', Value: 'Amount is positive for income and negative for expenses.' },
  ]);
  XLSX.utils.book_append_sheet(workbook, summary, 'Summary');
  XLSX.writeFile(workbook, filename);
}

export async function exportTransactionsPdf(transactions, categories, filename, subtitle) {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default;
  const totals = totalsFor(transactions);
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  doc.setFontSize(16);
  doc.text('Expense Tracker', 40, 42);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(subtitle || 'Transactions', 40, 60);
  doc.text(
    `Income ${formatMoneyPlain(totals.income)}    Expenses ${formatMoneyPlain(totals.expenses)}    Balance ${formatMoneyPlain(totals.balance)}    Savings ${formatPercent(totals.savingsRate)}`,
    40,
    76,
  );
  doc.setTextColor(20);
  autoTable(doc, {
    startY: 92,
    head: [['Date', 'Type', 'Category', 'Note', 'Amount']],
    body: toExportRows(transactions, categories).map((row) => [
      row.Date,
      row.Type,
      row.Category,
      row.Note,
      formatMoneyPlain(row.Amount),
    ]),
    styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 58 },
      2: { cellWidth: 90 },
      3: { cellWidth: 210 },
      4: { cellWidth: 72, halign: 'right' },
    },
    margin: { left: 40, right: 40 },
  });
  doc.save(filename);
}
