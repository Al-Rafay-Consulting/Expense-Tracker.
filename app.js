/* ===================================================
   ExpenseTrack — app.js
   =================================================== */
'use strict';

// =========================================================
// CONSTANTS & CONFIG
// =========================================================
const TODAY = '2026-06-16';

const CATEGORIES = {
  Bills:         { color: '#6366F1', icon: '⚡' },
  Food:          { color: '#22C55E', icon: '🍴' },
  Shopping:      { color: '#F59E0B', icon: '🛍' },
  Health:        { color: '#EF4444', icon: '❤️' },
  Education:     { color: '#8B5CF6', icon: '📚' },
  Entertainment: { color: '#F43F5E', icon: '🎬' },
  Subscriptions: { color: '#06B6D4', icon: '🔄' },
  Transport:     { color: '#F97316', icon: '🚗' },
  Salary:        { color: '#10B981', icon: '💼' },
  Freelance:     { color: '#10B981', icon: '💵' },
  Other:         { color: '#9CA3AF', icon: '📌' },
};

// Historical monthly aggregates (Jul 2025 – Jun 2026, last entry = current month)
const HISTORY = {
  labels:   ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'],
  income:   [318000, 284000, 412000, 376000, 421000, 352000, 382000, 297000, 438000, 391000, 416000, 272500],
  expenses: [ 84000,  91000, 108000,  77000, 133000, 162000,  72000,  87000,  94000, 103000,  81000,  20319],
};

const DEFAULT_TXS = [
  { id:1,  title:'Grocery Shopping',  amount:4270,   type:'expense', category:'Food',          date:'2026-06-15', notes:'' },
  { id:2,  title:'Salary Deposit',    amount:210000, type:'income',  category:'Salary',        date:'2026-06-14', notes:'' },
  { id:3,  title:'Uber Ride',         amount:625,    type:'expense', category:'Transport',     date:'2026-06-13', notes:'' },
  { id:4,  title:'Freelance Payment', amount:37500,  type:'income',  category:'Freelance',     date:'2026-06-12', notes:'' },
  { id:5,  title:'Netflix Subscription', amount:799, type:'expense', category:'Subscriptions', date:'2026-06-11', notes:'' },
  { id:6,  title:'Gym Membership',    amount:2250,   type:'expense', category:'Health',        date:'2026-06-10', notes:'' },
  { id:7,  title:'Electric Bill',     amount:6000,   type:'expense', category:'Bills',         date:'2026-06-09', notes:'' },
  { id:8,  title:'Online Course',     amount:1500,   type:'expense', category:'Education',     date:'2026-06-08', notes:'' },
  { id:9,  title:'Coffee Shop',       amount:425,    type:'expense', category:'Food',          date:'2026-06-07', notes:'' },
  { id:10, title:'New Shoes',         amount:3250,   type:'expense', category:'Shopping',      date:'2026-06-06', notes:'' },
  { id:11, title:'Movie Tickets',     amount:1200,   type:'expense', category:'Entertainment', date:'2026-06-05', notes:'' },
  { id:12, title:'Bonus',             amount:25000,  type:'income',  category:'Salary',        date:'2026-06-04', notes:'' },
];

// =========================================================
// STATE
// =========================================================
let state = {
  user:        null,
  transactions: [],
  currency:    'Rs',
  darkMode:    false,
  budget:      250000,
  savings:     { current: 325000, target: 500000, name: 'Holiday fund' },
  page:        'dashboard',
};

// Active Chart.js instances (keyed by canvas id)
const charts = {};

// =========================================================
// PERSISTENCE
// =========================================================
function save() {
  localStorage.setItem('et_user',   JSON.stringify(state.user));
  localStorage.setItem('et_txs',    JSON.stringify(state.transactions));
  localStorage.setItem('et_cur',    state.currency);
  localStorage.setItem('et_dark',   String(state.darkMode));
  localStorage.setItem('et_budget', String(state.budget));
  localStorage.setItem('et_savings',JSON.stringify(state.savings));
}

function load() {
  const u = localStorage.getItem('et_user');
  state.user = u ? JSON.parse(u) : null;

  const txs = localStorage.getItem('et_txs');
  state.transactions = txs ? JSON.parse(txs) : JSON.parse(JSON.stringify(DEFAULT_TXS));

  state.currency = localStorage.getItem('et_cur') || 'Rs';
  state.darkMode = localStorage.getItem('et_dark') === 'true';
  state.budget   = Number(localStorage.getItem('et_budget')) || 250000;

  const sv = localStorage.getItem('et_savings');
  state.savings = sv ? JSON.parse(sv) : { current: 325000, target: 500000, name: 'Holiday fund' };
}

// =========================================================
// HELPERS
// =========================================================
function fmt(n) {
  return state.currency + Number(n).toLocaleString('en-PK');
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function getMonthTxs(month = 5, year = 2026) { // June = month 5 (0-indexed)
  return state.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

function totals(txs) {
  const income   = txs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

function catBreakdown(txs) {
  const map = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map).sort((a,b) => b[1] - a[1]);
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function chartDefaults() {
  const dark = state.darkMode;
  return {
    textColor: dark ? '#9CA3AF' : '#6B7280',
    gridColor: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
  };
}

// =========================================================
// INIT
// =========================================================
function init() {
  load();
  applyDarkMode();

  // Nav link clicks
  document.querySelectorAll('.nav-item').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.page); });
  });
  document.getElementById('navAvatar').addEventListener('click', () => navigate('settings'));

  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);

  // Modal controls
  document.getElementById('fabBtn').addEventListener('click', openModal);
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.getElementById('txForm').addEventListener('submit', submitTx);

  // Settings controls
  document.getElementById('darkModeBtn').addEventListener('click', toggleDark);
  document.getElementById('darkModeCheck').addEventListener('change', toggleDark);
  document.getElementById('currencySelect').addEventListener('change', changeCurrency);
  document.getElementById('resetBtn').addEventListener('click', resetData);

  // Search / filter
  document.getElementById('searchInput').addEventListener('input', renderTxList);
  document.getElementById('categoryFilter').addEventListener('change', renderTxList);

  if (state.user) {
    showApp();
  }
  // else login page is already visible by default
}

// =========================================================
// AUTH
// =========================================================
function handleLogin(e) {
  e.preventDefault();
  const name  = document.getElementById('loginName').value.trim()  || 'User';
  const email = document.getElementById('loginEmail').value.trim() || 'user@example.com';
  state.user = { name, email };
  save();
  showApp();
}

function showApp() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  updateAvatar();
  syncSettingsUI();
  navigate('dashboard');
}

// =========================================================
// NAVIGATION
// =========================================================
function navigate(page) {
  state.page = page;

  document.querySelectorAll('.nav-item').forEach(a =>
    a.classList.toggle('active', a.dataset.page === page)
  );
  ['dashboard','reports','analytics','settings'].forEach(p => {
    document.getElementById(p + 'Page').classList.toggle('hidden', p !== page);
  });

  if (page === 'dashboard') renderDashboard();
  else if (page === 'reports')   renderReports();
  else if (page === 'analytics') renderAnalytics();
  else if (page === 'settings')  renderSettings();
}

// =========================================================
// DASHBOARD
// =========================================================
function renderDashboard() {
  const monthly = getMonthTxs();
  const { income, expenses } = totals(monthly);
  const allTotals = totals(state.transactions);

  // Balance
  document.getElementById('totalBalance').textContent  = fmt(allTotals.balance);
  document.getElementById('totalIncome').textContent   = fmt(income);
  document.getElementById('totalExpenses').textContent = fmt(expenses);

  // Change %
  const prevExp = HISTORY.expenses[10]; // May
  const currExp = HISTORY.expenses[11]; // Jun (initial)
  const pct = prevExp > 0 ? (((income - expenses) / (HISTORY.income[10] - prevExp) - 1) * 100).toFixed(1) : 0;
  document.getElementById('balanceChange').textContent = `${pct >= 0 ? '+' : ''}${pct}% from last month`;

  // Savings goal
  const { current, target, name } = state.savings;
  const savPct = Math.min(100, Math.round(current / target * 100));
  document.getElementById('savingsGoalDisplay').textContent = `${fmt(current)} / ${fmt(target)}`;
  document.getElementById('savingsFill').style.width = savPct + '%';
  document.getElementById('savingsCaption').textContent = `${savPct}% achieved \u2014 ${esc(name)}`;

  // Budget
  const budPct = Math.min(100, Math.round(expenses / state.budget * 100));
  document.getElementById('budgetTitle').textContent   = `Monthly Budget (${fmt(state.budget)})`;
  document.getElementById('budgetPct').textContent     = `${budPct}% used`;
  document.getElementById('budgetFill').style.width    = budPct + '%';
  document.getElementById('budgetSpent').textContent   = `Spent: ${fmt(expenses)}`;
  document.getElementById('budgetRemaining').textContent = `Remaining: ${fmt(Math.max(0, state.budget - expenses))}`;

  renderInsights(monthly);
  renderDashCharts(monthly);
  populateCatFilter();
  renderTxList();
}

function renderInsights(monthly) {
  const cats = catBreakdown(monthly);
  const transport = (cats.find(c => c[0]==='Transport')?.[1] || 0);
  const transportPct = Math.round(transport / 50000 * 100);
  const insights = [
    { e:'🎉', t:'Food spending down 12% this week' },
    { e:'⚠️', t:`Transport budget ${transportPct}% used` },
    { e:'🎯', t:'On track to meet savings goal by August' },
  ];
  document.getElementById('insightsRow').innerHTML = insights.map(i =>
    `<div class="insight-card"><span class="insight-emoji">${i.e}</span><span>${i.t}</span></div>`
  ).join('');
}

function renderDashCharts(monthly) {
  const { textColor, gridColor } = chartDefaults();

  // --- Monthly Spending line ---
  destroyChart('monthlySpendingChart');
  charts.monthlySpendingChart = new Chart(
    document.getElementById('monthlySpendingChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: HISTORY.labels,
      datasets: [{
        data: HISTORY.expenses.map(v => Math.round(v/1000)),
        borderColor: '#5B50F0',
        backgroundColor: 'rgba(91,80,240,.09)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#5B50F0',
        borderWidth: 2,
      }],
    },
    options: lineBarOptions(textColor, gridColor, '£'),
  });

  // --- Category Donut ---
  destroyChart('categoryChart');
  const cats = catBreakdown(monthly);
  charts.categoryChart = new Chart(
    document.getElementById('categoryChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: cats.map(c => c[0]),
      datasets: [{
        data: cats.map(c => c[1]),
        backgroundColor: cats.map(c => CATEGORIES[c[0]]?.color || '#9CA3AF'),
        borderWidth: 0,
        hoverOffset: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font:{size:10}, boxWidth:10, padding:6, color: textColor },
        },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` },
        },
      },
      cutout: '65%',
    },
  });

  // --- Income vs Expenses grouped bar ---
  destroyChart('incomeExpenseChart');
  charts.incomeExpenseChart = new Chart(
    document.getElementById('incomeExpenseChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: HISTORY.labels.slice(-6),
      datasets: [
        { label:'Income',   data: HISTORY.income.slice(-6).map(v=>Math.round(v/1000)),   backgroundColor:'#22C55E', borderRadius:4 },
        { label:'Expenses', data: HISTORY.expenses.slice(-6).map(v=>Math.round(v/1000)), backgroundColor:'#EF4444', borderRadius:4 },
      ],
    },
    options: lineBarOptions(textColor, gridColor, '£', true),
  });
}

function lineBarOptions(textColor, gridColor, prefix='', showLegend=false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        labels: { font:{size:11}, boxWidth:12, color: textColor },
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label||''}: ${prefix}${Number(ctx.raw).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: { ticks:{ color:textColor, font:{size:10} }, grid:{ color:gridColor } },
      y: {
        ticks: { color:textColor, font:{size:10}, callback: v => `${prefix}${v}` },
        grid:  { color:gridColor },
        beginAtZero: true,
      },
    },
  };
}

// =========================================================
// TRANSACTIONS
// =========================================================
function populateCatFilter() {
  const sel = document.getElementById('categoryFilter');
  const current = sel.value;
  const cats = [...new Set(state.transactions.map(t => t.category))].sort();
  sel.innerHTML = `<option value="">All Categories</option>` +
    cats.map(c => `<option value="${esc(c)}"${c===current?' selected':''}>${esc(c)}</option>`).join('');
}

function renderTxList() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat    =  document.getElementById('categoryFilter')?.value || '';

  let list = state.transactions.filter(t => {
    const matchS = !search || t.title.toLowerCase().includes(search) || t.category.toLowerCase().includes(search);
    const matchC = !cat || t.category === cat;
    return matchS && matchC;
  }).sort((a,b) => new Date(b.date) - new Date(a.date));

  const el = document.getElementById('transactionsList');
  if (!el) return;

  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No transactions found.</div>';
    return;
  }

  el.innerHTML = list.map(t => {
    const cat  = CATEGORIES[t.category] || CATEGORIES.Other;
    const isIn = t.type === 'income';
    return `
      <div class="tx-item">
        <div class="tx-icon ${isIn ? 'tx-income' : 'tx-expense'}">${cat.icon}</div>
        <div class="tx-info">
          <div class="tx-title-text">${esc(t.title)}</div>
          <div class="tx-meta">${fmtDate(t.date)} &middot; ${esc(t.category)}</div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${isIn ? 'pos' : 'neg'}">${isIn ? '+' : '\u2212'}${fmt(t.amount)}</div>
          <span class="tx-del" data-id="${t.id}">delete</span>
        </div>
      </div>`;
  }).join('');

  // Attach delete handlers
  el.querySelectorAll('.tx-del').forEach(btn => {
    btn.addEventListener('click', () => deleteTx(Number(btn.dataset.id)));
  });
}

function deleteTx(id) {
  if (!confirm('Delete this transaction?')) return;
  state.transactions = state.transactions.filter(t => t.id !== id);
  save();
  refreshPage();
}

function submitTx(e) {
  e.preventDefault();
  const title    = document.getElementById('txTitle').value.trim();
  const amount   = Number(document.getElementById('txAmount').value);
  const type     = document.getElementById('txType').value;
  const category = document.getElementById('txCategory').value;
  const date     = document.getElementById('txDate').value;
  const notes    = document.getElementById('txNotes').value.trim();

  if (!title || !amount || !date) return;

  state.transactions.unshift({ id: Date.now(), title, amount, type, category, date, notes });
  save();
  closeModal();
  refreshPage();
}

// =========================================================
// REPORTS
// =========================================================
function renderReports() {
  const monthly = getMonthTxs();
  const { income, expenses } = totals(monthly);
  const total = income + expenses;

  document.getElementById('rTotal').textContent    = fmt(total);
  document.getElementById('rIncome').textContent   = fmt(income);
  document.getElementById('rExpenses').textContent = fmt(expenses);
  document.getElementById('rSaved').textContent    = fmt(Math.max(0, income - expenses));

  const cats = catBreakdown(monthly);
  const totalExp = cats.reduce((s,c) => s + c[1], 0);
  const el = document.getElementById('categoryBreakdown');

  if (!cats.length) {
    el.innerHTML = '<div class="empty-state">No expense data this month.</div>';
    return;
  }

  el.innerHTML = cats.map(([name, amount]) => {
    const pct   = totalExp > 0 ? Math.round(amount / totalExp * 100) : 0;
    const color = CATEGORIES[name]?.color || '#9CA3AF';
    return `
      <div class="breakdown-item">
        <div class="breakdown-name" style="color:${color}">${esc(name)}</div>
        <div class="breakdown-bar-wrap">
          <div class="breakdown-bar" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="breakdown-amount">${fmt(amount)} (${pct}%)</div>
      </div>`;
  }).join('');
}

// =========================================================
// ANALYTICS
// =========================================================
function renderAnalytics() {
  const { textColor, gridColor } = chartDefaults();

  // 12-month trend
  destroyChart('trendChart');
  charts.trendChart = new Chart(
    document.getElementById('trendChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: HISTORY.labels,
      datasets: [{
        label: 'Monthly Spending',
        data: HISTORY.expenses.map(v => Math.round(v/1000)),
        borderColor: '#5B50F0',
        backgroundColor: 'rgba(91,80,240,.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#5B50F0',
        borderWidth: 2,
      }],
    },
    options: lineBarOptions(textColor, gridColor, '£', true),
  });

  // Monthly comparison bar
  destroyChart('comparisonChart');
  charts.comparisonChart = new Chart(
    document.getElementById('comparisonChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: HISTORY.labels.slice(-6),
      datasets: [{
        label: 'Monthly Spending',
        data: HISTORY.expenses.slice(-6).map(v => Math.round(v/1000)),
        backgroundColor: '#6366F1',
        borderRadius: 5,
      }],
    },
    options: lineBarOptions(textColor, gridColor, '£', true),
  });

  // Stat cards
  const avgSpend   = Math.round(HISTORY.expenses.reduce((s,v) => s+v, 0) / 12);
  const avgIncome  = Math.round(HISTORY.income.reduce((s,v) => s+v, 0) / 12);
  const avgSavings = avgIncome - avgSpend;

  document.getElementById('avgSpend').textContent   = fmt(avgSpend);
  document.getElementById('avgIncome').textContent  = fmt(avgIncome);
  document.getElementById('avgSavings').textContent = fmt(avgSavings);
}

// =========================================================
// SETTINGS
// =========================================================
function renderSettings() {
  if (!state.user) return;
  const { name, email } = state.user;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  document.getElementById('profileName').textContent  = name;
  document.getElementById('profileEmail').textContent = email;
  document.getElementById('profileAvatar').textContent = initials;
  syncSettingsUI();
}

function syncSettingsUI() {
  const sel = document.getElementById('currencySelect');
  if (sel) sel.value = state.currency;
  const chk = document.getElementById('darkModeCheck');
  if (chk) chk.checked = state.darkMode;
}

function updateAvatar() {
  if (!state.user) return;
  const initials = state.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('navAvatar').textContent = initials;
}

function changeCurrency() {
  state.currency = document.getElementById('currencySelect').value;
  save();
  refreshPage();
}

function resetData() {
  if (!confirm('Reset all data? This cannot be undone.')) return;
  state.transactions = JSON.parse(JSON.stringify(DEFAULT_TXS));
  state.budget  = 250000;
  state.savings = { current: 325000, target: 500000, name: 'Holiday fund' };
  save();
  refreshPage();
  alert('All data has been reset to defaults.');
}

// =========================================================
// DARK MODE
// =========================================================
function toggleDark() {
  state.darkMode = !state.darkMode;
  applyDarkMode();
  save();
  syncSettingsUI();
  // Redraw charts for new palette
  setTimeout(() => refreshPage(), 50);
}

function applyDarkMode() {
  document.body.classList.toggle('dark', state.darkMode);
}

// =========================================================
// MODAL
// =========================================================
function openModal() {
  document.getElementById('txForm').reset();
  document.getElementById('txDate').value = TODAY;
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('txTitle').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

// =========================================================
// UTILS
// =========================================================
function refreshPage() {
  navigate(state.page);
}

// =========================================================
// START
// =========================================================
document.addEventListener('DOMContentLoaded', init);
