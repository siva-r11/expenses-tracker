import { useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, Modal, PageHeader, cx, fieldClass } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { categoryName, classifyBill } from '../lib/calculations';
import { dueLabel, formatDisplayDate, todayISO } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { validateNamedAmount } from '../lib/validate';

const emptyForm = { name: '', amount: '', dueDate: todayISO(), categoryId: '', note: '' };

export function Bills() {
  const { state, addBill, updateBill, deleteBill, payBill, unpayBill, confirm } = useFinance();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const today = todayISO();
  const expenseCategories = state.categories.filter((category) => category.type === 'expense');

  const groups = useMemo(() => {
    const buckets = { overdue: [], soon: [], later: [], paid: [] };
    [...state.bills]
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
      .forEach((bill) => {
        buckets[classifyBill(bill, today)].push(bill);
      });
    return buckets;
  }, [state.bills, today]);

  function startCreate() {
    setEditing(null);
    setErrors({});
    setForm({ ...emptyForm, dueDate: todayISO(), categoryId: expenseCategories[0]?.id || '' });
    setOpen(true);
  }

  function startEdit(bill) {
    setEditing(bill);
    setErrors({});
    setForm({
      name: bill.name,
      amount: bill.amount.toFixed(2),
      dueDate: bill.dueDate,
      categoryId: bill.categoryId,
      note: bill.note || '',
    });
    setOpen(true);
  }

  function save(event) {
    event.preventDefault();
    const result = validateNamedAmount({ name: form.name, amount: form.amount, date: form.dueDate, dateLabel: 'due date' });
    const nextErrors = { ...result.errors };
    if (!form.categoryId) nextErrors.categoryId = 'Choose a category.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const input = {
      name: result.name,
      amount: result.amount,
      dueDate: form.dueDate,
      categoryId: form.categoryId,
      note: form.note,
    };
    if (editing) updateBill(editing.id, input);
    else addBill(input);
    setOpen(false);
  }

  async function remove(bill) {
    const ok = await confirm({
      title: `Delete ${bill.name}?`,
      message: 'This removes the reminder. An expense already recorded from this bill stays in your transactions.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deleteBill(bill.id);
  }

  async function markUnpaid(bill) {
    const ok = await confirm({
      title: 'Mark as unpaid?',
      message: bill.transactionId
        ? 'The reminder goes back to unpaid. The expense already recorded stays in your transactions.'
        : 'The reminder goes back to unpaid.',
      confirmLabel: 'Mark unpaid',
    });
    if (ok) unpayBill(bill.id);
  }

  return (
    <div>
      <PageHeader
        title="Bills"
        description="Reminders with a due date, amount, and paid status. Overdue and due-soon bills also appear on the dashboard."
        actions={<Button onClick={startCreate} disabled={!expenseCategories.length}>Add bill</Button>}
      />
      {!expenseCategories.length && (
        <p className="mb-4 text-sm text-rose-600" role="alert">Add an expense category before creating a bill.</p>
      )}
      {state.bills.length === 0 ? (
        <Card>
          <EmptyState icon="bills" title="No bills yet" message="Add a due date and amount so the dashboard can warn you before it is late." action={<Button onClick={startCreate}>Add bill</Button>} />
        </Card>
      ) : (
        <div className="space-y-4">
          <BillGroup title="Overdue" bills={groups.overdue} tone="bad" today={today} categories={state.categories} onEdit={startEdit} onDelete={remove} onPay={(bill, recordExpense) => payBill(bill.id, { recordExpense, today })} onUnpay={markUnpaid} />
          <BillGroup title="Due soon" bills={groups.soon} tone="warn" today={today} categories={state.categories} onEdit={startEdit} onDelete={remove} onPay={(bill, recordExpense) => payBill(bill.id, { recordExpense, today })} onUnpay={markUnpaid} />
          <BillGroup title="Upcoming" bills={groups.later} tone="info" today={today} categories={state.categories} onEdit={startEdit} onDelete={remove} onPay={(bill, recordExpense) => payBill(bill.id, { recordExpense, today })} onUnpay={markUnpaid} />
          <BillGroup title="Paid" bills={groups.paid} tone="good" today={today} categories={state.categories} onEdit={startEdit} onDelete={remove} onPay={(bill, recordExpense) => payBill(bill.id, { recordExpense, today })} onUnpay={markUnpaid} />
        </div>
      )}

      {open && (
        <Modal title={editing ? 'Edit bill' : 'Add bill'} onClose={() => setOpen(false)}>
          <form onSubmit={save} className="space-y-4" noValidate>
            <Field id="bill-name" label="Name" error={errors.name}>
              <input id="bill-name" className={fieldClass} maxLength={60} value={form.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'bill-name-error' : undefined} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field id="bill-amount" label="Amount" error={errors.amount}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                <input id="bill-amount" inputMode="decimal" className={`${fieldClass} pl-7`} value={form.amount} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'bill-amount-error' : undefined} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
              </div>
            </Field>
            <Field id="bill-date" label="Due date" error={errors.date}>
              <input id="bill-date" type="date" className={fieldClass} value={form.dueDate} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'bill-date-error' : undefined} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </Field>
            <Field id="bill-category" label="Category" error={errors.categoryId}>
              <select id="bill-category" className={fieldClass} value={form.categoryId} aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? 'bill-category-error' : undefined} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">Select a category</option>
                {expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
            <Field id="bill-note" label="Note">
              <input id="bill-note" className={fieldClass} maxLength={200} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save changes' : 'Add bill'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function BillGroup({ title, bills, tone, today, categories, onEdit, onDelete, onPay, onUnpay }) {
  if (!bills.length) return null;
  const shell = tone === 'bad'
    ? 'border-rose-300 dark:border-rose-900'
    : tone === 'warn'
      ? 'border-amber-200 dark:border-amber-900'
      : '';
  return (
    <Card className={shell}>
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {bills.map((bill) => (
          <li key={bill.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              {(tone === 'bad' || tone === 'warn') && (
                <span
                  className={cx('mt-1 h-8 w-1 shrink-0 rounded-full', tone === 'bad' ? 'bg-rose-500' : 'bg-amber-500')}
                  aria-hidden="true"
                />
              )}
              <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{bill.name}</p>
                <Badge tone={tone}>{bill.paid ? 'Paid' : dueLabel(bill.dueDate, today)}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {formatMoney(bill.amount)} · {formatDisplayDate(bill.dueDate)} · {categoryName(categories, bill.categoryId)}
                {bill.note ? ` · ${bill.note}` : ''}
              </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!bill.paid && (
                <>
                  <Button onClick={() => onPay(bill, true)}>Mark paid and add expense</Button>
                  <Button variant="secondary" onClick={() => onPay(bill, false)}>Mark paid</Button>
                </>
              )}
              {bill.paid && <Button variant="secondary" onClick={() => onUnpay(bill)}>Mark unpaid</Button>}
              <Button variant="ghost" onClick={() => onEdit(bill)}>Edit</Button>
              <Button variant="ghost" className="text-rose-700 dark:text-rose-300" onClick={() => onDelete(bill)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
