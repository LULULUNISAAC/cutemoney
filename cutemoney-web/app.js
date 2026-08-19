// ============================================================
// CuteMoney web — app.js
//
// All data lives in the browser's localStorage. Nothing is ever
// sent to a server, so each device/browser keeps its own private
// copy of the data. That also means: clearing browser data, or
// opening the site in a different browser/device, starts fresh.
// ============================================================

const STORAGE_KEY = "cutemoney.transactions.v1";
const SETTINGS_KEY = "cutemoney.settings.v1";

const EXPENSE_CATEGORIES = [
  { name: "Food", emoji: "🍜" },
  { name: "Transport", emoji: "🚌" },
  { name: "Shopping", emoji: "🛍️" },
  { name: "Bills", emoji: "🧾" },
  { name: "Fun", emoji: "🎉" },
  { name: "Health", emoji: "💊" },
  { name: "Other", emoji: "✨" },
];

const INCOME_CATEGORIES = [
  { name: "Salary", emoji: "💼" },
  { name: "Gift", emoji: "🎁" },
  { name: "Freelance", emoji: "💻" },
  { name: "Other", emoji: "✨" },
];

// ---------- Storage helpers ----------

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read transactions:", e);
    return [];
  }
}

function saveTransactions(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { dailyBudget: 30, currency: "USD" };
  } catch (e) {
    return { dailyBudget: 30, currency: "USD" };
  }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

let state = {
  transactions: loadTransactions(),
  settings: loadSettings(),
  selectedMonth: new Date(),
  currentAddType: "expense",
};

// ---------- Utilities ----------

const CURRENCY_SYMBOLS = {
  USD: "$", EUR: "€", GBP: "£", PHP: "₱", JPY: "¥", INR: "₹", AUD: "$", CAD: "$",
};

function formatCurrency(amount) {
  const symbol = CURRENCY_SYMBOLS[state.settings.currency] || "$";
  const sign = amount < 0 ? "-" : "";
  return `${sign}${symbol}${Math.abs(amount).toFixed(2)}`;
}

function categoryEmoji(type, categoryName) {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = list.find((c) => c.name === categoryName);
  return found ? found.emoji : "✨";
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isSameMonth(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayISODate() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

// ============================================================
// Tabs
// ============================================================

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");

    if (btn.dataset.tab === "trends") renderTrends();
    if (btn.dataset.tab === "expenses") renderExpensesTab();
    if (btn.dataset.tab === "export") renderExportTab();
  });
});

// ============================================================
// Home panel
// ============================================================

const RING_CIRCUMFERENCE = 2 * Math.PI * 72;

function renderHome() {
  const today = new Date();
  const todaysTx = state.transactions.filter((t) => isSameDay(new Date(t.date), today));
  const spentToday = todaysTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const budget = state.settings.dailyBudget;
  const remaining = budget - spentToday;
  const progress = budget > 0 ? Math.min(spentToday / budget, 1) : 0;

  const ringProgress = document.getElementById("ringProgress");
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  ringProgress.style.strokeDasharray = RING_CIRCUMFERENCE;
  ringProgress.style.strokeDashoffset = offset;
  ringProgress.style.stroke = remaining < 0 ? "var(--expense)" : "var(--coral)";

  const ringLabel = document.getElementById("ringLabel");
  const ringAmount = document.getElementById("ringAmount");
  ringLabel.textContent = remaining < 0 ? "Over budget" : "Left today";
  ringAmount.textContent = formatCurrency(remaining);
  ringAmount.classList.toggle("over", remaining < 0);

  document.getElementById("spentTodayAmt").textContent = formatCurrency(spentToday);
  document.getElementById("budgetTargetAmt").textContent = formatCurrency(budget);

  // Recent list
  const sorted = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentList = document.getElementById("recentList");
  const recentEmpty = document.getElementById("recentEmpty");
  recentList.innerHTML = "";

  if (sorted.length === 0) {
    recentEmpty.hidden = false;
  } else {
    recentEmpty.hidden = true;
    sorted.slice(0, 8).forEach((tx) => recentList.appendChild(buildTxRow(tx)));
  }
}

function buildTxRow(tx) {
  const row = document.createElement("div");
  row.className = "tx-row";

  const emoji = document.createElement("div");
  emoji.className = `tx-emoji ${tx.type === "income" ? "income-bg" : "expense-bg"}`;
  emoji.textContent = categoryEmoji(tx.type, tx.category);

  const main = document.createElement("div");
  main.className = "tx-main";
  const cat = document.createElement("div");
  cat.className = "tx-category";
  cat.textContent = tx.category;
  main.appendChild(cat);
  if (tx.note) {
    const note = document.createElement("div");
    note.className = "tx-note";
    note.textContent = tx.note;
    main.appendChild(note);
  }

  const right = document.createElement("div");
  right.className = "tx-right";
  const amt = document.createElement("div");
  amt.className = `tx-amount ${tx.type}`;
  amt.textContent = (tx.type === "income" ? "+" : "-") + formatCurrency(tx.amount).replace("-", "");
  const date = document.createElement("div");
  date.className = "tx-date";
  date.textContent = new Date(tx.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  right.appendChild(amt);
  right.appendChild(date);

  const del = document.createElement("button");
  del.className = "tx-delete";
  del.textContent = "✕";
  del.title = "Delete";
  del.addEventListener("click", () => deleteTransaction(tx.id));

  row.appendChild(emoji);
  row.appendChild(main);
  row.appendChild(right);
  row.appendChild(del);
  return row;
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  saveTransactions(state.transactions);
  renderAll();
}

// ============================================================
// Expenses tab (monthly list/table)
// ============================================================

function renderExpensesTab() {
  const month = state.selectedMonth;
  document.getElementById("monthLabel").textContent = month.toLocaleDateString(undefined, {
    month: "long", year: "numeric",
  });

  const monthExpenses = state.transactions.filter(
    (t) => t.type === "expense" && isSameMonth(new Date(t.date), month)
  );

  const monthTotal = monthExpenses.reduce((s, t) => s + t.amount, 0);
  document.getElementById("monthTotal").textContent = formatCurrency(monthTotal);

  const groupsContainer = document.getElementById("expensesGroups");
  const emptyState = document.getElementById("expensesEmpty");
  groupsContainer.innerHTML = "";

  if (monthExpenses.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  // group by day
  const groups = {};
  monthExpenses.forEach((t) => {
    const key = startOfDay(new Date(t.date)).toISOString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

  sortedKeys.forEach((key) => {
    const items = groups[key].sort((a, b) => new Date(b.date) - new Date(a.date));
    const dayTotal = items.reduce((s, t) => s + t.amount, 0);

    const groupDiv = document.createElement("div");
    groupDiv.className = "day-group";

    const header = document.createElement("div");
    header.className = "day-group-header";
    const dateLabel = document.createElement("span");
    dateLabel.textContent = new Date(key).toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric",
    });
    const totalLabel = document.createElement("span");
    totalLabel.textContent = `Total: ${formatCurrency(dayTotal)}`;
    header.appendChild(dateLabel);
    header.appendChild(totalLabel);

    const itemsDiv = document.createElement("div");
    itemsDiv.className = "day-group-items";

    items.forEach((tx) => {
      const row = document.createElement("div");
      row.className = "day-row";

      const emoji = document.createElement("span");
      emoji.textContent = categoryEmoji("expense", tx.category);

      const main = document.createElement("div");
      main.className = "tx-main";
      const cat = document.createElement("div");
      cat.className = "tx-category";
      cat.textContent = tx.category;
      main.appendChild(cat);
      if (tx.note) {
        const note = document.createElement("div");
        note.className = "tx-note";
        note.textContent = tx.note;
        main.appendChild(note);
      }

      const amt = document.createElement("div");
      amt.className = "tx-amount expense";
      amt.textContent = formatCurrency(tx.amount);

      const del = document.createElement("button");
      del.className = "tx-delete";
      del.textContent = "✕";
      del.addEventListener("click", () => deleteTransaction(tx.id));

      row.appendChild(emoji);
      row.appendChild(main);
      row.appendChild(amt);
      row.appendChild(del);
      itemsDiv.appendChild(row);
    });

    groupDiv.appendChild(header);
    groupDiv.appendChild(itemsDiv);
    groupsContainer.appendChild(groupDiv);
  });
}

document.getElementById("prevMonth").addEventListener("click", () => {
  const m = new Date(state.selectedMonth);
  m.setMonth(m.getMonth() - 1);
  state.selectedMonth = m;
  renderExpensesTab();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  const m = new Date(state.selectedMonth);
  m.setMonth(m.getMonth() + 1);
  state.selectedMonth = m;
  renderExpensesTab();
});

// ============================================================
// Trends tab (Chart.js)
// ============================================================

let trendChartInstance = null;
let categoryChartInstance = null;

function renderTrends() {
  const days = [];
  const today = startOfDay(new Date());
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const incomeData = days.map((d) =>
    state.transactions.filter((t) => t.type === "income" && isSameDay(new Date(t.date), d))
      .reduce((s, t) => s + t.amount, 0)
  );
  const expenseData = days.map((d) =>
    state.transactions.filter((t) => t.type === "expense" && isSameDay(new Date(t.date), d))
      .reduce((s, t) => s + t.amount, 0)
  );

  const hasAny = incomeData.some((v) => v > 0) || expenseData.some((v) => v > 0);
  document.getElementById("trendEmptyMsg").hidden = hasAny;
  document.getElementById("trendChart").style.display = hasAny ? "block" : "none";

  if (trendChartInstance) trendChartInstance.destroy();
  if (hasAny) {
    const ctx = document.getElementById("trendChart").getContext("2d");
    trendChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: days.map((d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" })),
        datasets: [
          { label: "Income", data: incomeData, backgroundColor: "#4caf7d", borderRadius: 6 },
          { label: "Expense", data: expenseData, backgroundColor: "#f0637a", borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true, labels: { font: { family: "Nunito", weight: "700" }, boxWidth: 10 } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "Nunito" } } },
          y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { family: "Nunito" } } },
        },
      },
    });
  }

  // Category breakdown (current month)
  const monthExpenses = state.transactions.filter(
    (t) => t.type === "expense" && isSameMonth(new Date(t.date), new Date())
  );
  const byCategory = {};
  monthExpenses.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });
  const catEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  document.getElementById("categoryEmptyMsg").hidden = catEntries.length > 0;
  document.getElementById("categoryChart").style.display = catEntries.length > 0 ? "block" : "none";

  const palette = ["#ff8b76", "#4caf7d", "#cbe9fb", "#e1dcfb", "#ffd8c2", "#f0637a", "#c3ecd4"];

  if (categoryChartInstance) categoryChartInstance.destroy();
  const legendEl = document.getElementById("categoryLegend");
  legendEl.innerHTML = "";

  if (catEntries.length > 0) {
    const ctx2 = document.getElementById("categoryChart").getContext("2d");
    categoryChartInstance = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: catEntries.map((e) => e[0]),
        datasets: [{ data: catEntries.map((e) => e[1]), backgroundColor: palette, borderWidth: 0 }],
      },
      options: {
        responsive: true,
        cutout: "60%",
        plugins: { legend: { display: false } },
      },
    });

    catEntries.forEach(([name, total]) => {
      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `<span class="legend-emoji">${categoryEmoji("expense", name)}</span>
        <span class="legend-name">${name}</span>
        <span class="legend-amt">${formatCurrency(total)}</span>`;
      legendEl.appendChild(row);
    });
  }
}

// ============================================================
// Export tab (CSV)
// ============================================================

function csvEscape(field) {
  const str = String(field ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function getRangeDates() {
  const start = new Date(document.getElementById("rangeStart").value);
  const end = new Date(document.getElementById("rangeEnd").value);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function filteredByRange() {
  const { start, end } = getRangeDates();
  return state.transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
}

function renderExportTab() {
  const filtered = filteredByRange();
  document.getElementById("incomeCount").textContent =
    `${filtered.filter((t) => t.type === "income").length} entries in range`;
  document.getElementById("expenseCount").textContent =
    `${filtered.filter((t) => t.type === "expense").length} entries in range`;
}

document.getElementById("rangeStart").addEventListener("change", renderExportTab);
document.getElementById("rangeEnd").addEventListener("change", renderExportTab);

function downloadCSV(type, filename) {
  const items = filteredByRange()
    .filter((t) => t.type === type)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const rows = ["Date,Category,Note,Amount,Currency"];
  items.forEach((t) => {
    rows.push([
      new Date(t.date).toISOString().slice(0, 10),
      t.category,
      t.note || "",
      t.amount.toFixed(2),
      state.settings.currency,
    ].map(csvEscape).join(","));
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById("exportIncomeBtn").addEventListener("click", () =>
  downloadCSV("income", "CuteMoney_Income.csv")
);
document.getElementById("exportExpenseBtn").addEventListener("click", () =>
  downloadCSV("expense", "CuteMoney_Expenses.csv")
);

// ============================================================
// Add Transaction modal
// ============================================================

const addModalOverlay = document.getElementById("addModalOverlay");
const typeSegment = document.getElementById("typeSegment");
const categorySelect = document.getElementById("categorySelect");

function populateCategories(type) {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  categorySelect.innerHTML = "";
  list.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.name;
    opt.textContent = `${c.emoji} ${c.name}`;
    categorySelect.appendChild(opt);
  });
}

function openAddModal(type) {
  state.currentAddType = type;
  document.getElementById("addModalTitle").textContent =
    type === "income" ? "Add Income 💰" : "Add Expense 🧾";

  typeSegment.querySelectorAll(".segment").forEach((s) => {
    s.classList.toggle("active", s.dataset.type === type);
  });

  populateCategories(type);
  document.getElementById("amountInput").value = "";
  document.getElementById("noteInput").value = "";
  document.getElementById("dateInput").value = todayISODate();

  addModalOverlay.classList.add("open");
  document.getElementById("amountInput").focus();
}

document.getElementById("btnAddIncome").addEventListener("click", () => openAddModal("income"));
document.getElementById("btnAddExpense").addEventListener("click", () => openAddModal("expense"));

typeSegment.querySelectorAll(".segment").forEach((seg) => {
  seg.addEventListener("click", () => {
    state.currentAddType = seg.dataset.type;
    typeSegment.querySelectorAll(".segment").forEach((s) => s.classList.remove("active"));
    seg.classList.add("active");
    populateCategories(seg.dataset.type);
    document.getElementById("addModalTitle").textContent =
      seg.dataset.type === "income" ? "Add Income 💰" : "Add Expense 🧾";
  });
});

document.getElementById("closeAddModal").addEventListener("click", () => {
  addModalOverlay.classList.remove("open");
});
addModalOverlay.addEventListener("click", (e) => {
  if (e.target === addModalOverlay) addModalOverlay.classList.remove("open");
});

document.getElementById("saveTxBtn").addEventListener("click", () => {
  const amount = parseFloat(document.getElementById("amountInput").value);
  if (!amount || amount <= 0) {
    document.getElementById("amountInput").focus();
    return;
  }
  const category = categorySelect.value;
  const note = document.getElementById("noteInput").value.trim();
  const dateVal = document.getElementById("dateInput").value || todayISODate();

  const tx = {
    id: uid(),
    type: state.currentAddType,
    amount,
    category,
    note,
    date: new Date(dateVal + "T12:00:00").toISOString(),
  };

  state.transactions.push(tx);
  saveTransactions(state.transactions);
  addModalOverlay.classList.remove("open");
  renderAll();
});

// ============================================================
// Settings modal
// ============================================================

const settingsModalOverlay = document.getElementById("settingsModalOverlay");

document.getElementById("openSettings").addEventListener("click", () => {
  document.getElementById("budgetInput").value = state.settings.dailyBudget;
  document.getElementById("currencySelect").value = state.settings.currency;
  settingsModalOverlay.classList.add("open");
});

document.getElementById("closeSettingsModal").addEventListener("click", () => {
  settingsModalOverlay.classList.remove("open");
});
settingsModalOverlay.addEventListener("click", (e) => {
  if (e.target === settingsModalOverlay) settingsModalOverlay.classList.remove("open");
});

document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  const budget = parseFloat(document.getElementById("budgetInput").value);
  state.settings.dailyBudget = isNaN(budget) ? 0 : budget;
  state.settings.currency = document.getElementById("currencySelect").value;
  saveSettings(state.settings);
  settingsModalOverlay.classList.remove("open");
  renderAll();
});

document.getElementById("clearDataBtn").addEventListener("click", () => {
  if (confirm("This will permanently delete all transactions stored on this device. Continue?")) {
    state.transactions = [];
    saveTransactions([]);
    settingsModalOverlay.classList.remove("open");
    renderAll();
  }
});

// ============================================================
// Init
// ============================================================

function renderAll() {
  renderHome();
  renderExpensesTab();
  renderExportTab();
  if (document.getElementById("panel-trends").classList.contains("active")) {
    renderTrends();
  }
}

(function init() {
  const today = todayISODate();
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  document.getElementById("rangeStart").value = monthAgo.toISOString().slice(0, 10);
  document.getElementById("rangeEnd").value = today;
  document.getElementById("dateInput").value = today;

  renderAll();
})();
