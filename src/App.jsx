import { AppRoutes } from './app/AppRoutes';
import { Layout } from './components/Layout';
import { FinanceProvider } from './context/FinanceContext';

export default function App() {
  return (
    <FinanceProvider>
      <Layout>
        <AppRoutes />
      </Layout>
    </FinanceProvider>
  );
}
