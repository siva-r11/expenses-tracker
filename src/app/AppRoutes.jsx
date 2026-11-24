import { Navigate, Route, Routes } from 'react-router-dom';
import { Bills } from '../pages/Bills';
import { Budgets } from '../pages/Budgets';
import { Categories } from '../pages/Categories';
import { Dashboard } from '../pages/Dashboard';
import { Goals } from '../pages/Goals';
import { Recurring } from '../pages/Recurring';
import { Reports } from '../pages/Reports';
import { Settings } from '../pages/Settings';
import { Transactions } from '../pages/Transactions';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/budgets" element={<Budgets />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/recurring" element={<Recurring />} />
      <Route path="/bills" element={<Bills />} />
      <Route path="/goals" element={<Goals />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
