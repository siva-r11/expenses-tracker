import { useEffect, useState } from 'react';
import { todayISO } from '../lib/dates';
import { validateTransactionFields } from '../lib/validate';
import { Button, Field, fieldClass } from './ui';

export function TransactionForm({ initial, categories, defaultDate, submitLabel, onSubmit, onCancel }) {
  const [type, setType] = useState(initial?.type || 'expense');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId || '');
  const [date, setDate] = useState(initial?.date || defaultDate || todayISO());
  const [note, setNote] = useState(initial?.note || '');
  const [errors, setErrors] = useState({});

  const options = categories.filter((category) => category.type === type);

  useEffect(() => {
    if (!options.some((category) => category.id === categoryId)) {
      setCategoryId(options[0]?.id || '');
    }
  }, [type, categoryId, options]);

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateTransactionFields({ amount, categoryId, date });
    setErrors(result.errors);
    if (Object.keys(result.errors).length) return;
    onSubmit({
      type,
      amount: result.amount,
      categoryId,
      date,
      note: note.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Transaction type">
        {['expense', 'income'].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={type === value}
            className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
              type === value
                ? 'border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-100'
                : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
            }`}
            onClick={() => setType(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <Field id="tx-amount" label="Amount" error={errors.amount}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
          <input
            id="tx-amount"
            inputMode="decimal"
            autoComplete="off"
            className={`${fieldClass} pl-7`}
            value={amount}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? 'tx-amount-error' : undefined}
            onChange={(event) => setAmount(event.target.value)}
            onBlur={() => {
              const result = validateTransactionFields({ amount, categoryId: categoryId || 'x', date: date || '2000-01-01' });
              if (!result.errors.amount) setAmount(result.amount.toFixed(2));
            }}
          />
        </div>
      </Field>
      <Field id="tx-category" label="Category" error={errors.categoryId}>
        <select
          id="tx-category"
          className={fieldClass}
          value={categoryId}
          aria-invalid={Boolean(errors.categoryId)}
          aria-describedby={errors.categoryId ? 'tx-category-error' : undefined}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">Select a category</option>
          {options.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </Field>
      <Field id="tx-date" label="Date" error={errors.date}>
        <input
          id="tx-date"
          type="date"
          className={fieldClass}
          value={date}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'tx-date-error' : undefined}
          onChange={(event) => setDate(event.target.value)}
        />
      </Field>
      <Field id="tx-note" label="Note" hint="Optional. Search can find this text.">
        <input
          id="tx-note"
          className={fieldClass}
          value={note}
          maxLength={200}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
