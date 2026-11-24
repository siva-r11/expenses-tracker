import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ConfirmDialog, ToastStack } from '../components/ui';
import {
  addBill,
  addCategory,
  addContribution,
  addGoal,
  addRecurrence,
  addTransaction,
  createEmptyState,
  createSeedState,
  deleteBill,
  deleteContribution,
  deleteGoal,
  deleteRecurrence,
  deleteTransaction,
  loadState,
  materializeRecurrences,
  payBill,
  removeCategory,
  renameCategory,
  saveState,
  setBudgetsForMonth,
  setRecurrencePaused,
  unpayBill,
  updateBill,
  updateGoal,
  updateRecurrence,
  updateTransaction,
} from '../lib/storage';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [state, setState] = useState(() => loadState());
  const [storageError, setStorageError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);
  const dialogRef = useRef(null);
  const toastTimers = useRef(new Map());
  dialogRef.current = dialog;

  const commit = useCallback((recipe) => {
    setState((previous) => {
      const next = recipe(previous);
      const materialized = materializeRecurrences(next);
      if (materialized === previous) return previous;
      try {
        saveState(materialized);
        queueMicrotask(() => setStorageError(''));
      } catch {
        queueMicrotask(() => {
          setStorageError('Could not save to this browser. Storage may be full or blocked.');
        });
      }
      return materialized;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      commit((previous) => previous);
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [commit]);

  const closeDialog = useCallback((result) => {
    dialogRef.current?.resolve(result);
    setDialog(null);
  }, []);

  const confirm = useCallback((options) => new Promise((resolve) => {
    setDialog({ ...options, resolve });
  }), []);

  const dismissToast = useCallback((id) => {
    const timer = toastTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimers.current.delete(id);
    }
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((message, tone = 'good') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((previous) => [...previous.slice(-3), { id, message, tone }]);
    const timer = window.setTimeout(() => dismissToast(id), 3200);
    toastTimers.current.set(id, timer);
  }, [dismissToast]);

  useEffect(() => () => {
    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current.clear();
  }, []);

  const value = {
    state,
    theme: state.theme,
    selectedMonth: state.selectedMonth,
    storageError,
    confirm,
    toast,
    setSelectedMonth: (month) => commit((previous) => ({ ...previous, selectedMonth: month })),
    toggleTheme: () => commit((previous) => ({
      ...previous,
      theme: previous.theme === 'dark' ? 'light' : 'dark',
    })),
    addTransaction: (input) => commit((previous) => addTransaction(previous, input)),
    updateTransaction: (id, input) => commit((previous) => updateTransaction(previous, id, input)),
    deleteTransaction: (id) => commit((previous) => deleteTransaction(previous, id)),
    setBudgetsForMonth: (month, entries) => commit((previous) => setBudgetsForMonth(previous, month, entries)),
    addCategory: (input) => commit((previous) => addCategory(previous, input)),
    renameCategory: (id, name) => commit((previous) => renameCategory(previous, id, name)),
    removeCategory: (id, reassignToId) => commit((previous) => removeCategory(previous, id, reassignToId)),
    addRecurrence: (input) => commit((previous) => addRecurrence(previous, input)),
    updateRecurrence: (id, input) => commit((previous) => updateRecurrence(previous, id, input)),
    setRecurrencePaused: (id, paused) => commit((previous) => setRecurrencePaused(previous, id, paused)),
    deleteRecurrence: (id) => commit((previous) => deleteRecurrence(previous, id)),
    addBill: (input) => commit((previous) => addBill(previous, input)),
    updateBill: (id, input) => commit((previous) => updateBill(previous, id, input)),
    deleteBill: (id) => commit((previous) => deleteBill(previous, id)),
    payBill: (id, options) => commit((previous) => payBill(previous, id, options)),
    unpayBill: (id) => commit((previous) => unpayBill(previous, id)),
    addGoal: (input) => commit((previous) => addGoal(previous, input)),
    updateGoal: (id, input) => commit((previous) => updateGoal(previous, id, input)),
    deleteGoal: (id) => commit((previous) => deleteGoal(previous, id)),
    addContribution: (goalId, input) => commit((previous) => addContribution(previous, goalId, input)),
    deleteContribution: (goalId, contributionId) => commit((previous) => deleteContribution(previous, goalId, contributionId)),
    resetSampleData: () => commit((previous) => {
      const seeded = createSeedState();
      seeded.theme = previous.theme;
      return seeded;
    }),
    clearData: () => commit((previous) => createEmptyState(previous)),
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          danger={dialog.danger}
          hideCancel={dialog.hideCancel}
          onConfirm={() => closeDialog(true)}
          onCancel={() => closeDialog(false)}
        />
      )}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
}
