import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { classifyBill } from '../lib/calculations';
import { currentMonth, formatMonth, formatMonthShort, shiftMonth, todayISO } from '../lib/dates';
import { buttonClass, cx } from './ui';

const navGroups = [
  {
    label: 'Daily',
    links: [
      { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
      { to: '/transactions', label: 'Transactions', icon: ListIcon },
    ],
  },
  {
    label: 'Plan',
    links: [
      { to: '/budgets', label: 'Budgets', icon: BudgetIcon },
      { to: '/bills', label: 'Bills', icon: BillIcon },
      { to: '/goals', label: 'Goals', icon: GoalIcon },
      { to: '/recurring', label: 'Recurring', icon: RepeatIcon },
    ],
  },
  {
    label: 'Analyze',
    links: [
      { to: '/reports', label: 'Reports', icon: ChartIcon },
    ],
  },
  {
    label: 'Setup',
    links: [
      { to: '/categories', label: 'Categories', icon: TagIcon },
      { to: '/settings', label: 'Settings', icon: GearIcon },
    ],
  },
];

const mobileNav = [
  { to: '/', label: 'Home', icon: DashboardIcon, end: true },
  { to: '/transactions', label: 'Ledger', icon: ListIcon },
  { to: '/budgets', label: 'Budget', icon: BudgetIcon },
  { to: '/bills', label: 'Bills', icon: BillIcon },
];

function navClass(isActive) {
  return cx(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200',
    isActive
      ? 'bg-teal-50 text-teal-900 shadow-sm dark:bg-teal-950/70 dark:text-teal-100'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  );
}

export function Layout({ children }) {
  const { state, theme, selectedMonth, setSelectedMonth, toggleTheme, storageError } = useFinance();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const today = todayISO();
  const overdueCount = state.bills.filter((bill) => classifyBill(bill, today) === 'overdue').length;
  const showFab = !location.pathname.startsWith('/settings');

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900"
      >
        Skip to content
      </a>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 transition-opacity lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="app-sidebar"
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900/95 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-sm" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19V5M4 19h16" strokeLinecap="round" />
                <path d="M8 15v-4M12 15V8M16 15v-6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Expense Tracker</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personal finance, this browser</p>
            </div>
          </div>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => navClass(isActive)}>
                      <Icon />
                      <span className="flex-1">{link.label}</span>
                      {link.to === '/bills' && overdueCount > 0 && (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{overdueCount}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <p className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">Saved in this browser only.</p>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md transition dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="app-sidebar"
                onClick={() => setOpen(true)}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </button>
              <p className="font-semibold text-slate-900 dark:text-white lg:hidden">Expenses</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <button
                  type="button"
                  className={buttonClass('ghost', 'h-10 w-10 rounded-full px-0')}
                  aria-label="Previous month"
                  onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
                >
                  ‹
                </button>
                <label htmlFor="selected-month" className="sr-only">Selected month</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-sm font-semibold text-slate-900 dark:text-white">
                    {formatMonthShort(selectedMonth)}
                  </span>
                  <input
                    id="selected-month"
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => {
                      if (event.target.value) setSelectedMonth(event.target.value);
                    }}
                    className="h-10 w-[7.5rem] cursor-pointer rounded-full border-0 bg-transparent px-3 text-sm text-transparent caret-transparent outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                </div>
                <button
                  type="button"
                  className={buttonClass('ghost', 'h-10 w-10 rounded-full px-0')}
                  aria-label="Next month"
                  onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
                >
                  ›
                </button>
              </div>
              {selectedMonth !== currentMonth() && (
                <button type="button" className={buttonClass('ghost')} onClick={() => setSelectedMonth(currentMonth())}>
                  This month
                </button>
              )}
              <button
                type="button"
                className={buttonClass('secondary', 'min-h-11 gap-2')}
                aria-pressed={theme === 'dark'}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>
        </header>
        {storageError && (
          <p className="bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200" role="alert">
            {storageError}
          </p>
        )}
        <main id="main" className="min-w-0 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
          <p className="sr-only">Showing {formatMonth(selectedMonth)}</p>
          <div key={selectedMonth} className="animate-fade-up">
            {children}
          </div>
        </main>
      </div>

      {showFab && (
        <Link
          to="/transactions?compose=expense"
          className="fixed bottom-24 right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-teal-700 px-5 text-sm font-semibold text-white shadow-fab transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 lg:bottom-6 lg:right-6"
          aria-label="Add expense"
        >
          <span className="text-lg leading-none" aria-hidden="true">+</span>
          <span className="hidden sm:inline">Add expense</span>
        </Link>
      )}

      <nav
        aria-label="Mobile primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
      >
        <ul className="grid grid-cols-4 gap-1">
          {mobileNav.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => cx(
                    'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium transition',
                    isActive
                      ? 'bg-teal-50 text-teal-900 dark:bg-teal-950/70 dark:text-teal-100'
                      : 'text-slate-500 dark:text-slate-400',
                  )}
                >
                  <span className="relative">
                    <Icon />
                    {link.to === '/bills' && overdueCount > 0 && (
                      <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-rose-600" aria-hidden="true" />
                    )}
                  </span>
                  {link.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <Icon>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
  );
}
function ListIcon() {
  return <Icon><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Icon>;
}
function BudgetIcon() {
  return <Icon><path d="M4 19V5M4 19h16" /><path d="M8 16v-5M12 16V8M16 16v-3" /></Icon>;
}
function ChartIcon() {
  return <Icon><path d="M4 19h16" /><path d="M7 16l4-5 3 3 5-7" /></Icon>;
}
function RepeatIcon() {
  return <Icon><path d="M17 1v5h-5" /><path d="M7 23v-5h5" /><path d="M20 12a8 8 0 0 0-14.9-4M4 12a8 8 0 0 0 14.9 4" /></Icon>;
}
function BillIcon() {
  return <Icon><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6" /></Icon>;
}
function GoalIcon() {
  return <Icon><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></Icon>;
}
function TagIcon() {
  return <Icon><path d="M20 13l-7 7-9-9V4h7l9 9z" /><circle cx="7.5" cy="7.5" r="1" /></Icon>;
}
function GearIcon() {
  return <Icon><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></Icon>;
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
