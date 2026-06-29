# ExpenseTrack - Expense Tracker Web App

A modern, responsive expense tracking web application built with vanilla HTML, CSS, and JavaScript. ExpenseTrack helps users monitor income and expenses, review spending patterns through charts, and manage personal finance preferences from a clean dashboard interface.

## Overview

ExpenseTrack is a front-end wireframe/prototype project focused on personal finance management. It includes:

- Login flow (lightweight demo authentication)
- Dashboard with key financial summaries
- Transaction creation and listing
- Reports and analytics views
- User settings with persistent preferences

The application stores data locally in the browser using localStorage, so no backend setup is required.

## Features

- Responsive multi-page-style single-page interface:
	- Dashboard
	- Reports
	- Analytics
	- Settings
- Income and expense tracking with categories
- Add transaction modal with validation
- Category filtering and search for transactions
- Monthly budget progress tracking
- Savings goal progress tracking
- Chart visualizations using Chart.js:
	- Monthly spending
	- Category distribution
	- Income vs expenses
	- 12-month trend and comparisons
- Dark mode toggle
- Currency selection
- Persistent user data and preferences via localStorage
- Reset data option in Settings

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js (CDN)

## Project Structure

```text
project/
|- Wireframe/
|  |- Expense-Tracker/
|  |  |- index.html
|  |  |- style.css
|  |  |- app.js
|- Readme/
|  |- README.md
|- Wireframe.png
```

## Getting Started

### Prerequisites

- Any modern web browser (Chrome, Edge, Firefox, Safari)

### Run Locally

1. Navigate to the project folder.
2. Open `Wireframe/Expense-Tracker/index.html` in your browser.

Optional (recommended for development): run with a local server to avoid any browser file restrictions.

Example using VS Code Live Server:

1. Open the `project` folder in VS Code.
2. Right-click `index.html` in `Wireframe/Expense-Tracker`.
3. Select **Open with Live Server**.

## Usage

1. Enter any values on the login page to continue.
2. Review the Dashboard cards and charts.
3. Click the **+** floating action button to add a transaction.
4. Use search and category filters in Recent Transactions.
5. Explore Reports and Analytics for deeper insights.
6. Update preferences from Settings (currency, dark mode, notifications).

## Data Persistence

ExpenseTrack stores app data in browser localStorage using keys such as:

- `et_user`
- `et_txs`
- `et_cur`
- `et_dark`
- `et_budget`
- `et_savings`

To clear saved data, use the **Reset All Data** button in Settings.

## Current Scope

This project is currently a front-end prototype/wireframe. It does not include:

- Server-side authentication
- Database storage
- API integration

## Future Improvements

- Backend integration for secure multi-user support
- Real authentication and authorization
- Export reports (CSV/PDF)
- Recurring transactions and bill reminders
- Category budget limits and alerts
- Unit/integration tests

## License

This project is intended for learning, prototyping, and portfolio demonstration.

