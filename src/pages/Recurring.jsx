import { useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, Modal, PageHeader, fieldClass } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { FREQUENCIES, frequencyLabel } from '../lib/constants';
import { categoryName } from '../lib/calculations';
import { formatDisplayDate, todayISO } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { validateTransactionFields } from '../lib/validate';

const emptyForm = {
  type: 'expense',
  amount: '',
  categoryId: '',
  frequency: 'monthly',
  nextDate: todayISO(),
  note: '',
};

export function Recurring() {
  const {
    state,
    addRecurrence,
    updateRecurrence,
    setRecurrencePaused,
    deleteRecurrence,
    confirm,
  } = useFinance();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const options = state.categories.filter((category) => category.type === form.type);

  function startCreate() {
    const first = state.categories.find((category) => category.type === 'expense');
    setEditing(null);
    setErrors({});
    setForm({ ...emptyForm, nextDate: todayISO(), categoryId: first?.id || '' });
    setOpen(true);
  }

  function startEdit(rule) {
    setEditing(rule);
    setErrors({});
    setForm({
      type: rule.type,
      amount: rule.amount.toFixed(2),
      categoryId: rule.categoryId,
      frequency: rule.frequency,
      nextDate: rule.nextDate,
      note: rule.note || '',
    });
    setOpen(true);
  }

  function changeType(type) {
    const nextOptions = state.categories.filter((category) => category.type === type);
    setForm((current) => ({
      ...current,
      type,
      categoryId: nextOptions.some((category) => category.id === current.categoryId)
        ? current.categoryId
        : (nextOptions[0]?.id || ''),
    }));
  }

  function save(event) {
    event.preventDefault();
    const result = validateTransactionFields({
      amount: form.amount,
      categoryId: form.categoryId,
      date: form.nextDate,
    });
    const nextErrors = { ...result.errors };
    if (nextErrors.date) nextErrors.date = 'Enter the next date for this recurrence.';
    if (!['weekly', 'monthly', 'yearly'].includes(form.frequency)) nextErrors.frequency = 'Choose a frequency.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const input = {
      type: form.type,
      amount: result.amount,
      categoryId: form.categoryId,
      frequency: form.frequency,
      nextDate: form.nextDate,
      note: form.note,
    };
    if (editing) updateRecurrence(editing.id, input);
    else addRecurrence(input);
    setOpen(false);
  }

  async function remove(rule) {
    const ok = await confirm({
      title: 'Delete recurrence?',
      message: 'Future occurrences will stop. Transactions already added to your ledger stay there.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deleteRecurrence(rule.id);
  }

  return (
    <div>
      <PageHeader
        title="Recurring"
        description="Weekly, monthly, or yearly income and expenses. Due dates are added to your transactions when you open the app, and the same occurrence is never added twice."
        actions={<Button onClick={startCreate}>Add recurrence</Button>}
      />
      <Card>
        {state.recurrences.length === 0 ? (
          <EmptyState icon="transactions" title="No recurring items" message="Add rent, a paycheck, or any other repeating amount." action={<Button onClick={startCreate}>Add recurrence</Button>} />
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {state.recurrences.map((rule) => (
              <li key={rule.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{rule.note || categoryName(state.categories, rule.categoryId)}</p>
                    <Badge tone={rule.type === 'income' ? 'good' : 'bad'}>{rule.type === 'income' ? 'Income' : 'Expense'}</Badge>
                    {rule.paused && <Badge tone="warn">Paused</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {formatMoney(rule.amount)} · {frequencyLabel(rule.frequency)} · {categoryName(state.categories, rule.categoryId)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Next date {formatDisplayDate(rule.nextDate)}
                    {rule.postedKeys?.length ? ` · ${rule.postedKeys.length} posted` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setRecurrencePaused(rule.id, !rule.paused)}>
                    {rule.paused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button variant="ghost" onClick={() => startEdit(rule)}>Edit</Button>
                  <Button variant="ghost" className="text-rose-700 dark:text-rose-300" onClick={() => remove(rule)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open && (
        <Modal title={editing ? 'Edit recurrence' : 'Add recurrence'} onClose={() => setOpen(false)}>
          <form onSubmit={save} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-2">
              {['expense', 'income'].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={form.type === value}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                    form.type === value
                      ? 'border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-100'
                      : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                  }`}
                  onClick={() => changeType(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <Field id="rec-amount" label="Amount" error={errors.amount}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                <input
                  id="rec-amount"
                  inputMode="decimal"
                  className={`${fieldClass} pl-7`}
                  value={form.amount}
                  aria-invalid={Boolean(errors.amount)}
                  aria-describedby={errors.amount ? 'rec-amount-error' : undefined}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                />
              </div>
            </Field>
            <Field id="rec-category" label="Category" error={errors.categoryId}>
              <select
                id="rec-category"
                className={fieldClass}
                value={form.categoryId}
                aria-invalid={Boolean(errors.categoryId)}
                aria-describedby={errors.categoryId ? 'rec-category-error' : undefined}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              >
                <option value="">Select a category</option>
                {options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
            <Field id="rec-frequency" label="Frequency" error={errors.frequency}>
              <select
                id="rec-frequency"
                className={fieldClass}
                value={form.frequency}
                onChange={(event) => setForm({ ...form, frequency: event.target.value })}
              >
                {FREQUENCIES.map((frequency) => <option key={frequency.id} value={frequency.id}>{frequency.label}</option>)}
              </select>
            </Field>
            <Field id="rec-date" label="Next date" error={errors.date} hint="If this date is today or earlier, it is added to your transactions when you save.">
              <input
                id="rec-date"
                type="date"
                className={fieldClass}
                value={form.nextDate}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'rec-date-error' : undefined}
                onChange={(event) => setForm({ ...form, nextDate: event.target.value })}
              />
            </Field>
            <Field id="rec-note" label="Note">
              <input
                id="rec-note"
                className={fieldClass}
                maxLength={200}
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save changes' : 'Add recurrence'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
