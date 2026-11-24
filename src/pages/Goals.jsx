import { useState } from 'react';
import { Button, Card, EmptyState, Field, Modal, PageHeader, ProgressBar, fieldClass } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { formatDisplayDate, isValidISODate, todayISO } from '../lib/dates';
import { formatMoney, formatPercent, parseAmount } from '../lib/money';

const emptyGoal = { name: '', targetAmount: '', currentAmount: '', targetDate: '' };
const emptyContribution = { amount: '', date: todayISO(), note: '' };

export function Goals() {
  const { state, addGoal, updateGoal, deleteGoal, addContribution, deleteContribution, confirm } = useFinance();
  const [goalOpen, setGoalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [goalErrors, setGoalErrors] = useState({});
  const [contributionFor, setContributionFor] = useState(null);
  const [contribution, setContribution] = useState(emptyContribution);
  const [contributionErrors, setContributionErrors] = useState({});
  const today = todayISO();

  function startCreate() {
    setEditing(null);
    setGoalErrors({});
    setGoalForm({ ...emptyGoal, targetDate: todayISO() });
    setGoalOpen(true);
  }

  function startEdit(goal) {
    setEditing(goal);
    setGoalErrors({});
    setGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toFixed(2),
      currentAmount: goal.currentAmount.toFixed(2),
      targetDate: goal.targetDate,
    });
    setGoalOpen(true);
  }

  function saveGoal(event) {
    event.preventDefault();
    const errors = {};
    const name = goalForm.name.trim();
    const targetAmount = parseAmount(goalForm.targetAmount);
    const currentRaw = goalForm.currentAmount.trim();
    const currentAmount = currentRaw ? parseAmount(currentRaw) : 0;
    if (!name) errors.name = 'Enter a name.';
    if (targetAmount == null || targetAmount <= 0) errors.targetAmount = 'Enter a target greater than 0.';
    if (currentAmount == null || currentAmount < 0) errors.currentAmount = 'Enter zero or a positive amount already saved.';
    if (!isValidISODate(goalForm.targetDate)) errors.targetDate = 'Enter a valid target date.';
    setGoalErrors(errors);
    if (Object.keys(errors).length) return;
    const input = { name, targetAmount, currentAmount, targetDate: goalForm.targetDate };
    if (editing) updateGoal(editing.id, input);
    else addGoal(input);
    setGoalOpen(false);
  }

  function saveContribution(event) {
    event.preventDefault();
    const errors = {};
    const amount = parseAmount(contribution.amount);
    if (amount == null || amount <= 0) errors.amount = 'Enter an amount greater than 0.';
    if (!isValidISODate(contribution.date)) errors.date = 'Enter a valid date.';
    setContributionErrors(errors);
    if (Object.keys(errors).length || !contributionFor) return;
    addContribution(contributionFor.id, { amount, date: contribution.date, note: contribution.note });
    setContributionFor(null);
  }

  async function removeGoal(goal) {
    const ok = await confirm({
      title: `Delete ${goal.name}?`,
      message: 'This removes the goal and its contribution history. It does not change your transactions.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deleteGoal(goal.id);
  }

  async function removeContribution(goal, entry) {
    const ok = await confirm({
      title: 'Remove contribution?',
      message: 'The saved amount on this goal will be reduced by the contribution.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) deleteContribution(goal.id, entry.id);
  }

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Track a savings target, the amount saved so far, and a date you want to reach it."
        actions={<Button onClick={startCreate}>Add goal</Button>}
      />
      {state.goals.length === 0 ? (
        <Card>
          <EmptyState icon="goals" title="No savings goals" message="Name a target, how much you have saved, and the date you are aiming for." action={<Button onClick={startCreate}>Add goal</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {state.goals.map((goal) => {
            const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const reached = goal.currentAmount >= goal.targetAmount;
            const late = !reached && goal.targetDate < today;
            return (
              <Card key={goal.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{goal.name}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Target {formatDisplayDate(goal.targetDate)}
                      {reached ? ' · Reached' : late ? ' · Past the target date' : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatPercent(percent)}</p>
                </div>
                <div className="mt-4">
                  <ProgressBar
                    label={`${formatMoney(goal.currentAmount)} of ${formatMoney(goal.targetAmount)}`}
                    value={goal.currentAmount}
                    max={goal.targetAmount}
                    tone="bg-teal-600"
                    remainingLabel={`${formatMoney(Math.max(goal.targetAmount - goal.currentAmount, 0))} to go`}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => { setContributionFor(goal); setContribution({ ...emptyContribution, date: todayISO() }); setContributionErrors({}); }}>
                    Add contribution
                  </Button>
                  <Button variant="secondary" onClick={() => startEdit(goal)}>Edit</Button>
                  <Button variant="ghost" className="text-rose-700 dark:text-rose-300" onClick={() => removeGoal(goal)}>Delete</Button>
                </div>
                {goal.contributions?.length > 0 && (
                  <ul className="mt-4 divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    {[...goal.contributions].sort((left, right) => right.date.localeCompare(left.date)).map((entry) => (
                      <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                        <span>
                          {formatDisplayDate(entry.date)} · {formatMoney(entry.amount)}
                          {entry.note ? ` · ${entry.note}` : ''}
                        </span>
                        <Button variant="ghost" className="text-rose-700 dark:text-rose-300" onClick={() => removeContribution(goal, entry)}>Remove</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {goalOpen && (
        <Modal title={editing ? 'Edit goal' : 'Add goal'} onClose={() => setGoalOpen(false)}>
          <form onSubmit={saveGoal} className="space-y-4" noValidate>
            <Field id="goal-name" label="Name" error={goalErrors.name}>
              <input id="goal-name" className={fieldClass} maxLength={60} value={goalForm.name} aria-invalid={Boolean(goalErrors.name)} aria-describedby={goalErrors.name ? 'goal-name-error' : undefined} onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })} />
            </Field>
            <Field id="goal-target" label="Target amount" error={goalErrors.targetAmount}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                <input id="goal-target" inputMode="decimal" className={`${fieldClass} pl-7`} value={goalForm.targetAmount} aria-invalid={Boolean(goalErrors.targetAmount)} aria-describedby={goalErrors.targetAmount ? 'goal-target-error' : undefined} onChange={(event) => setGoalForm({ ...goalForm, targetAmount: event.target.value })} />
              </div>
            </Field>
            <Field id="goal-current" label="Current saved" error={goalErrors.currentAmount} hint={editing ? 'You can correct the saved amount here. Contributions are listed on the goal.' : 'Optional. This becomes the opening balance.'}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                <input id="goal-current" inputMode="decimal" className={`${fieldClass} pl-7`} value={goalForm.currentAmount} aria-invalid={Boolean(goalErrors.currentAmount)} aria-describedby={goalErrors.currentAmount ? 'goal-current-error' : undefined} onChange={(event) => setGoalForm({ ...goalForm, currentAmount: event.target.value })} />
              </div>
            </Field>
            <Field id="goal-date" label="Target date" error={goalErrors.targetDate}>
              <input id="goal-date" type="date" className={fieldClass} value={goalForm.targetDate} aria-invalid={Boolean(goalErrors.targetDate)} aria-describedby={goalErrors.targetDate ? 'goal-date-error' : undefined} onChange={(event) => setGoalForm({ ...goalForm, targetDate: event.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setGoalOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save changes' : 'Add goal'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {contributionFor && (
        <Modal title={`Add to ${contributionFor.name}`} onClose={() => setContributionFor(null)}>
          <form onSubmit={saveContribution} className="space-y-4" noValidate>
            <Field id="contrib-amount" label="Amount" error={contributionErrors.amount}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                <input id="contrib-amount" inputMode="decimal" className={`${fieldClass} pl-7`} value={contribution.amount} aria-invalid={Boolean(contributionErrors.amount)} aria-describedby={contributionErrors.amount ? 'contrib-amount-error' : undefined} onChange={(event) => setContribution({ ...contribution, amount: event.target.value })} />
              </div>
            </Field>
            <Field id="contrib-date" label="Date" error={contributionErrors.date}>
              <input id="contrib-date" type="date" className={fieldClass} value={contribution.date} aria-invalid={Boolean(contributionErrors.date)} aria-describedby={contributionErrors.date ? 'contrib-date-error' : undefined} onChange={(event) => setContribution({ ...contribution, date: event.target.value })} />
            </Field>
            <Field id="contrib-note" label="Note">
              <input id="contrib-note" className={fieldClass} maxLength={200} value={contribution.note} onChange={(event) => setContribution({ ...contribution, note: event.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setContributionFor(null)}>Cancel</Button>
              <Button type="submit">Add contribution</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
