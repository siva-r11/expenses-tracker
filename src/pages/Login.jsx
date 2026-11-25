import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Card, Field, PageHeader, fieldClass } from '../components/ui';
import { DEMO_CREDENTIALS, useAuth } from '../context/AuthContext';

export function Login() {
  const { user, error, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to="/" replace />;

  function handleSubmit(event) {
    event.preventDefault();
    if (login(email, password)) navigate('/', { replace: true });
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <section>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight">Expense Tracker</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Personal finance, this browser</p>
            </div>
          </div>
          <div className="mt-10 hidden lg:block">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">Your finances,<br />in focus.</h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Track everyday spending, plan your budget, and follow your savings goals from one dashboard.
            </p>
            <p className="mt-6 text-sm font-medium text-teal-800 dark:text-teal-200">A clearer picture of every month.</p>
          </div>
        </section>

        <Card className="p-6 sm:p-8">
          <PageHeader title="Log in" description="Welcome back. Log in to open your dashboard." />
          <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="demo-login-notice">
            <Field id="login-email" label="Email address">
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={fieldClass}
              />
            </Field>
            <Field id="login-password" label="Password">
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className={fieldClass}
              />
            </Field>
            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="min-h-11 w-full">Log in</Button>
          </form>

          <aside className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/60" aria-label="Demo account">
            <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">Try the demo user</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                <dd className="font-mono">{DEMO_CREDENTIALS.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Password</dt>
                <dd className="font-mono">{DEMO_CREDENTIALS.password}</dd>
              </div>
            </dl>
          </aside>
          <p id="demo-login-notice" className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Demo login only, not secure authentication. No backend is connected. Finance data is shared in this browser; do not enter real credentials.
          </p>
        </Card>
      </div>
    </main>
  );
}
