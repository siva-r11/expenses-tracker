import { useState } from 'react';
import { Badge, Button, Card, Field, Modal, PageHeader, fieldClass } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { categoryUsage, usageTotal } from '../lib/calculations';

export function Categories() {
  const { state, addCategory, renameCategory, removeCategory, confirm } = useFinance();
  const [pending, setPending] = useState(null);
  const [reassignTo, setReassignTo] = useState('');

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Built-in categories start the ledger. Add your own, rename any of them, and delete one only after its transactions, budgets, bills, and recurrences are moved or confirmed empty."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryColumn
          title="Expense categories"
          type="expense"
          categories={state.categories.filter((category) => category.type === 'expense')}
          allCategories={state.categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onAskDelete={(category) => askDelete(category, state, confirm, removeCategory, setPending, setReassignTo)}
        />
        <CategoryColumn
          title="Income categories"
          type="income"
          categories={state.categories.filter((category) => category.type === 'income')}
          allCategories={state.categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onAskDelete={(category) => askDelete(category, state, confirm, removeCategory, setPending, setReassignTo)}
        />
      </div>

      {pending && (
        <Modal title={`Delete ${pending.category.name}?`} onClose={() => setPending(null)}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This category is used by {pending.usage.transactions} transactions, {pending.usage.budgets} budget lines, {pending.usage.recurrences} recurrences, and {pending.usage.bills} bills.
            Choose another {pending.category.type} category to move those records to.
          </p>
          {pending.category.isDefault && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              This is a built-in category. Moving the records keeps the history.
            </p>
          )}
          <div className="mt-4">
            <Field id="reassign-category" label="Move records to">
              <select id="reassign-category" className={fieldClass} value={reassignTo} onChange={(event) => setReassignTo(event.target.value)}>
                {pending.others.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                removeCategory(pending.category.id, reassignTo);
                setPending(null);
              }}
            >
              Reassign and delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

async function askDelete(category, state, confirm, removeCategory, setPending, setReassignTo) {
  const others = state.categories.filter((item) => item.type === category.type && item.id !== category.id);
  if (!others.length) {
    await confirm({
      title: 'Cannot delete this category',
      message: 'Create another category of the same type first, so existing records have somewhere to go.',
      confirmLabel: 'OK',
      hideCancel: true,
    });
    return;
  }
  const usage = categoryUsage(state, category.id);
  const total = usageTotal(usage);
  if (total === 0) {
    const ok = await confirm({
      title: `Delete ${category.name}?`,
      message: category.isDefault
        ? 'This is a built-in category. Nothing is using it, so deleting it only removes the name.'
        : 'Nothing is using this category.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) removeCategory(category.id);
    return;
  }
  setReassignTo(others[0].id);
  setPending({ category, usage, others });
}

function CategoryColumn({ title, type, categories, allCategories, onAdd, onRename, onAskDelete }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [renameError, setRenameError] = useState('');

  function add(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name.');
      return;
    }
    if (allCategories.some((category) => category.type === type && category.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A category with this name already exists.');
      return;
    }
    onAdd({ name: trimmed, type });
    setName('');
    setError('');
  }

  function saveRename(category) {
    const trimmed = draft.trim();
    if (!trimmed) {
      setRenameError('Enter a name.');
      return;
    }
    if (allCategories.some((item) => item.type === category.type && item.id !== category.id && item.name.toLowerCase() === trimmed.toLowerCase())) {
      setRenameError('A category with this name already exists.');
      return;
    }
    onRename(category.id, trimmed);
    setEditingId(null);
    setRenameError('');
  }

  return (
    <Card>
      <h2 className="text-base font-semibold">{title}</h2>
      <form onSubmit={add} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Field id={`new-${type}`} label={`New ${type} category`} error={error}>
            <input
              id={`new-${type}`}
              className={fieldClass}
              maxLength={40}
              value={name}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `new-${type}-error` : undefined}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
        </div>
        <Button type="submit" className="sm:mt-7">Add</Button>
      </form>
      <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {categories.map((category) => (
          <li key={category.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            {editingId === category.id ? (
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <input className={fieldClass} maxLength={40} value={draft} aria-label={`Rename ${category.name}`} onChange={(event) => setDraft(event.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={() => saveRename(category)}>Save</Button>
                  <Button variant="secondary" onClick={() => { setEditingId(null); setRenameError(''); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true" />
                <span className="font-medium">{category.name}</span>
                {category.isDefault && <Badge>Default</Badge>}
              </div>
            )}
            {editingId !== category.id && (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setEditingId(category.id); setDraft(category.name); setRenameError(''); }}>Rename</Button>
                <Button variant="ghost" className="text-rose-700 dark:text-rose-300" onClick={() => onAskDelete(category)}>Delete</Button>
              </div>
            )}
            {editingId === category.id && renameError && <p className="text-sm text-rose-600" role="alert">{renameError}</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
