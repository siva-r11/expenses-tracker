import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { Bills } from '../pages/Bills';
import { Budgets } from '../pages/Budgets';
import { Categories } from '../pages/Categories';
import { Dashboard } from '../pages/Dashboard';
import { Goals } from '../pages/Goals';
import { Login } from '../pages/Login';
import { Recurring } from '../pages/Recurring';
import { Reports } from '../pages/Reports';
import { Settings } from '../pages/Settings';
import { Transactions } from '../pages/Transactions';

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <FinanceProvider>
      <Layout>
        <Outlet />
      </Layout>
    </FinanceProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/recurring" element={<Recurring />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
