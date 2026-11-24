# Expense Tracker

A browser-based personal finance dashboard built with React, Vite, and Tailwind CSS.
It tracks income, expenses, budgets, bills, savings goals, and recurring
transactions, with charts and Excel/PDF transaction exports.

## Requirements

- Node.js 20 or newer and npm.

## Getting started

```bash
npm ci
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Available commands

```bash
npm run dev      # Start the development server
npm run build    # Create a production build in dist/
npm run preview  # Serve the production build locally
```

## Project structure

```text
index.html                 HTML entry point
public/                    Static assets
src/
  main.jsx                 React and router bootstrap
  App.jsx                  Finance provider and shared layout
  app/AppRoutes.jsx        Application routes
  components/              Shared UI, layout, charts, and transaction form
  context/FinanceContext.jsx  Shared finance state and actions
  lib/                     Calculations, storage, dates, validation, and exports
  pages/                   Route-level screens
  index.css                Global styles and Tailwind directives
vite.config.js             Vite configuration
tailwind.config.js         Tailwind configuration
```

The app uses React Router for navigation, Chart.js for charts, and browser
`localStorage` for persistence. Amounts are displayed in Indian rupees.

## Data and deployment

- Data is stored locally in the current browser and origin under
  `expense-tracker.v1`; there is no server, account, or cross-device sync.
- A new browser starts with sample data. Settings lets you reset the sample
  data or clear the ledger, and export transactions to Excel or PDF. These
  exports are not full backups of budgets, bills, goals, or settings.
- Clearing browser storage can delete your data. Use a regular browser profile
  and export transactions you need to keep.
- For deployment, serve the contents of `dist/` and configure the host to
  return `index.html` for application routes so direct links and refreshes work.
  `npm run preview` is intended for local preview, not production hosting.
