let uid = null;
  let revenueChart = null;
  let workTypeChart = null;
  let barChart = null;

const state = {
  patients: {},
  reception: {},
  expenses: {},
  supplies: {},
  labos: {},
  appointments: {},
  profile: {},
};

let selectedRange = "monthly";
let dataLoaded = false;

function toggleSkeleton(show) {
  const skeletons = document.querySelectorAll(".skeleton-block");
  const liveBlocks = document.querySelectorAll(".live-block");
  skeletons.forEach((el) => el.classList.toggle("hidden", !show));
  liveBlocks.forEach((el) => el.classList.toggle("hidden", show));
}

function markDataLoaded() {
  if (dataLoaded) return;
  dataLoaded = true;
  toggleSkeleton(false);
}
// Ensure skeletons show at start
toggleSkeleton(true);

const metricConfigs = [
  {
    id: "totalPatients",
    label: "Total Patients",
    icon: "fa-users",
    color: "#1d7bff",
    link: "patients.html",
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: "fa-calendar-check",
    color: "#27ae60",
    link: "appointments.html",
  },
  {
    id: "cash",
    label: "Cash in Hand",
    icon: "fa-sack-dollar",
    color: "#9b59b6",
    suffix: " MAD",
    link: "expenses.html",
  },
  {
    id: "payments",
    label: "Payments",
    icon: "fa-wallet",
    color: "#e67e22",
    suffix: " MAD",
    link: "patients.html",
  },
];

function safeDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function monthlyAggregate(items, dateKey, valueFn) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let currentTotal = 0;
  let prevTotal = 0;

  items.forEach((item) => {
    const d = safeDate(item[dateKey]);
    if (!d) return;
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      currentTotal += valueFn(item);
    } else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
      prevTotal += valueFn(item);
    }
  });

  return { currentTotal, prevTotal };
}

function computeTrend(current, previous) {
  if (!previous || previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  return delta;
}

function rangeTotals(items, dateKey, valueFn, range = selectedRange) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "weekly") {
    const startCurrent = new Date(today);
    startCurrent.setDate(startCurrent.getDate() - 6);
    const endCurrent = new Date(today);

    const startPrev = new Date(startCurrent);
    startPrev.setDate(startPrev.getDate() - 7);
    const endPrev = new Date(startCurrent);
    endPrev.setDate(endPrev.getDate() - 1);

    const inWindow = (d, start, end) => d >= start && d <= end;

    let currentTotal = 0;
    let prevTotal = 0;
    items.forEach((item) => {
      const d = safeDate(item[dateKey]);
      if (!d) return;
      if (inWindow(d, startCurrent, endCurrent)) currentTotal += valueFn(item);
      else if (inWindow(d, startPrev, endPrev)) prevTotal += valueFn(item);
    });
    return { currentTotal, prevTotal };
  }

  if (range === "yearly") {
    const currentYear = now.getFullYear();
    const prevYear = currentYear - 1;
    let currentTotal = 0;
    let prevTotal = 0;
    items.forEach((item) => {
      const d = safeDate(item[dateKey]);
      if (!d) return;
      if (d.getFullYear() === currentYear) currentTotal += valueFn(item);
      else if (d.getFullYear() === prevYear) prevTotal += valueFn(item);
    });
    return { currentTotal, prevTotal };
  }

  // default monthly
  return monthlyAggregate(items, dateKey, valueFn);
}

function filterByRange(items, dateKey, range = selectedRange) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return items.filter((item) => {
    const d = safeDate(item[dateKey]);
    if (!d) return false;

    if (range === "weekly") {
      const diffMs = startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays < 7;
    }

    if (range === "monthly") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    if (range === "yearly") {
      return d.getFullYear() === now.getFullYear();
    }

    return true;
  });
}

  function createEnhancedMetricCard(config, value) {
    const trend = arguments.length > 2 ? arguments[2] : null;
    const numericValue = Number(value || 0);
    const formattedValue = config.suffix
      ? `${numericValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}${config.suffix}`
      : numericValue.toLocaleString();

    const trendClass =
      typeof trend === "number"
        ? trend === 0
          ? ""
          : trend > 0
          ? "trend-up"
          : "trend-down"
        : "muted";
    const trendLabel =
      typeof trend === "number"
        ? `${trend > 0 ? "↑" : trend < 0 ? "↓" : ""} ${Math.abs(trend).toFixed(
            1
          )}%`
        : "—";

    const card = document.createElement("div");
    card.className = "enhanced-metric-card card";
    card.style.borderLeft = `4px solid ${config.color}`;

    card.innerHTML = `
      <div class="metric-icon" style="color: ${config.color}">
        <i class="fa ${config.icon}"></i>
      </div>
      <div class="metric-label">${config.label}</div>
      <div class="metric-value">
        ${formattedValue}
      </div>
      <div class="metric-trend ${trendClass}">
        ${trendLabel}
      </div>
      <button class="ghost-btn small" ${
        config.link ? "" : 'disabled aria-disabled="true"'
      }>View report</button>
    `;

    if (config.link) {
      const btn = card.querySelector(".ghost-btn.small");
      btn.addEventListener("click", () => {
        window.location.href = config.link;
      });
    }

    return card;
  }

function renderMetrics() {
  const dashboard = document.getElementById("dashboard");
  if (!dashboard) return;
  dashboard.innerHTML = "";

  const patients = Object.values(state.patients || {});
  const appointments = Object.values(state.appointments || {});
  const labos = Object.values(state.labos || {});
  const expenses = Object.values(state.expenses || {});
  const supplies = Object.values(state.supplies || {});

  const patientsInRange = filterByRange(patients, "date");
  const appointmentsInRange = filterByRange(appointments, "date");

  const totalAdvance = patients.reduce(
    (sum, p) => sum + (Number(p.advance) || 0),
    0
  );
  const labTotal = labos.reduce(
    (sum, l) => sum + (Number(l.price) || 0),
    0
  );
  const expensesTotal = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const suppliesTotal = supplies.reduce(
    (sum, s) => sum + (Number(s.unitPrice || 0) * Number(s.quantity || 0)),
    0
  );
  const cashInHand = totalAdvance - (labTotal + expensesTotal + suppliesTotal);

  // Trends compare current vs previous for the selected range.
  const patientsAgg = rangeTotals(patients, "date", () => 1);
  const appointmentsAgg = rangeTotals(appointments, "date", () => 1);
  const paymentsAgg = rangeTotals(
    patients,
    "date",
    (p) => Number(p.advance) || 0
  );

  const trends = {
    totalPatients: computeTrend(
      patientsAgg.currentTotal,
      patientsAgg.prevTotal
    ),
    appointments: computeTrend(
      appointmentsAgg.currentTotal,
      appointmentsAgg.prevTotal
    ),
    payments: computeTrend(
      paymentsAgg.currentTotal,
      paymentsAgg.prevTotal
    ),
    cash: null,
  };

  const values = {
    totalPatients: patientsInRange.length,
    appointments: appointmentsInRange.length,
    payments: totalAdvance.toFixed(2),
    cash: cashInHand.toFixed(2),
  };

  metricConfigs.forEach((config) => {
    const card = createEnhancedMetricCard(
      config,
      values[config.id] || 0,
      trends[config.id]
    );
    dashboard.appendChild(card);
  });

  markDataLoaded();
}

function updateCharts() {
  const patients = Object.values(state.patients || {});
  const filteredPatients = filterByRange(patients, "date");
  const basePatients =
    selectedRange === "monthly" || selectedRange === "yearly"
      ? patients
      : filteredPatients;

  // Revenue chart adapts by range
  let labels = [];
  let revenues = [];
  if (selectedRange === "weekly") {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    labels = days.map((d) =>
      d.toLocaleDateString("en-US", { weekday: "short" })
    );
    revenues = days.map((day) => {
      const dateStr = day.toISOString().split("T")[0];
      return filteredPatients
        .filter((p) => p.date === dateStr)
        .reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    });
  } else {
    const monthlyData = {};
    const source =
      selectedRange === "monthly"
        ? filterByRange(patients, "date", "yearly") // current year only
        : patients.filter((p) => {
            const d = safeDate(p.date);
            return d && d.getFullYear() === new Date().getFullYear();
          });

    source.forEach((p) => {
      if (p.date) {
        const d = safeDate(p.date);
        if (!d) return;
        const label =
          selectedRange === "yearly"
            ? d.getFullYear().toString()
            : d.toLocaleString("default", { month: "short" });
        monthlyData[label] =
          (monthlyData[label] || 0) + (Number(p.price) || 0);
      }
    });
    labels = Object.keys(monthlyData);
    revenues = Object.values(monthlyData);
  }

  if (revenueChart) revenueChart.destroy();

  const ctx1 = document.getElementById("revenueChart").getContext("2d");
  revenueChart = new Chart(ctx1, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue (MAD)",
          data: revenues,
          borderColor: "#1d7bff",
          backgroundColor: "rgba(29, 123, 255, 0.15)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });

  // Work Type Distribution Chart (filtered by range)
  const workTypes = {};
  filteredPatients.forEach((p) => {
    if (p.work) {
      workTypes[p.work] = (workTypes[p.work] || 0) + 1;
    }
  });

  if (workTypeChart) workTypeChart.destroy();

  const ctx2 = document.getElementById("workTypeChart").getContext("2d");
  workTypeChart = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: Object.keys(workTypes),
      datasets: [
        {
          data: Object.values(workTypes),
          backgroundColor: [
            "#1d7bff",
            "#e74c3c",
            "#f39c12",
            "#27ae60",
            "#9b59b6",
            "#1abc9c",
            "#34495e",
            "#e67e22",
            "#16a085",
            "#c0392b",
            "#2980b9",
            "#8e44ad",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: "right" },
      },
    },
  });

  // Bar Chart: Net Profit (advance) vs Revenue (price)
  const barMonthly = {};
  basePatients.forEach((p) => {
    const d = safeDate(p.date);
    if (!d) return;
    const label =
      selectedRange === "yearly"
        ? d.getFullYear().toString()
        : d.toLocaleString("default", { month: "short" });
    const revenue = Number(p.price) || 0;
    const net = Number(p.advance) || 0;
    if (!barMonthly[label]) barMonthly[label] = { revenue: 0, net: 0 };
    barMonthly[label].revenue += revenue;
    barMonthly[label].net += net;
  });

  const barCanvas = document.getElementById("barChart");
  if (barChart) barChart.destroy();
  if (barCanvas) {
    const ctx3 = barCanvas.getContext("2d");
    barChart = new Chart(ctx3, {
      type: "bar",
      data: {
        labels: Object.keys(barMonthly),
        datasets: [
          {
            label: "Net Profit",
            data: Object.values(barMonthly).map((v) => v.net),
            backgroundColor: "#1d7bff",
          },
          {
            label: "Revenue",
            data: Object.values(barMonthly).map((v) => v.revenue),
            backgroundColor: "#27ae60",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: { beginAtZero: true },
          x: { ticks: { autoSkip: true, maxTicksLimit: 10 } },
        },
      },
    });
  }
}

function renderNextPatientCard() {
  const target = document.getElementById("nextPatientCard");
  if (!target) return;
  const patients = Object.values(state.patients || {});
  if (!patients.length) {
    target.innerHTML =
      "<h3>Next Patient Details</h3><p class='muted'>No patients yet.</p>";
    return;
  }

  const withDate = patients
    .filter((p) => p.nextVisit)
    .sort(
      (a, b) => new Date(a.nextVisit).getTime() - new Date(b.nextVisit).getTime()
    );
  const next = withDate[0] || patients[0];

  target.innerHTML = `
    <h3>Next Patient Details</h3>
    <p class="muted">${next.work || "Treatment"}</p>
    <div class="profile-chip">
      <div class="avatar">${(next.name || "?").charAt(0).toUpperCase()}</div>
      <div>
        <strong>${next.name || "Unnamed Patient"}</strong>
        <div class="muted">${next.phone || "No phone"}</div>
      </div>
    </div>
    <div class="mini-grid">
      <div><p class="eyebrow">Next Visit</p><strong>${
        next.nextVisit || "TBD"
      }</strong></div>
      <div><p class="eyebrow">Status</p><strong>${
        next.status || "In Progress"
      }</strong></div>
    </div>
  `;
}

function renderApprovalCard() {
  const target = document.getElementById("approvalCard");
  if (!target) return;
  const reception = Object.values(state.reception || {});
  target.innerHTML = `<h3>Approval Requests</h3>`;

  if (!reception.length) {
    target.innerHTML += `<p class="muted">No pending approvals.</p>`;
    return;
  }

  const list = document.createElement("div");
  list.className = "stacked-list";
  reception.slice(0, 4).forEach((item) => {
    const row = document.createElement("div");
    row.className = "stacked-row";
    row.innerHTML = `
      <div>
        <strong>${item.name || "Patient"}</strong>
        <p class="muted">${item.work || ""}</p>
      </div>
      <div class="chip chip-scheduled">Awaiting</div>
    `;
    list.appendChild(row);
  });
  target.appendChild(list);
}

function renderTodayAppointments() {
  const target = document.getElementById("todayAppointmentsCard");
  if (!target) return;
  const today = new Date().toISOString().split("T")[0];
  const todayApps = Object.entries(state.appointments || {})
    .map(([key, val]) => ({ key, ...val }))
    .filter((a) => a.date === today);

  target.innerHTML = `<h3>Today's Appointments</h3>`;

  if (!todayApps.length) {
    target.innerHTML += `<p class="muted">No appointments scheduled today.</p>`;
    return;
  }

  const list = document.createElement("div");
  list.className = "stacked-list";
  todayApps.forEach((app) => {
    const row = document.createElement("div");
    row.className = "stacked-row";
    row.innerHTML = `
      <div>
        <strong>${app.patientName}</strong>
        <p class="muted">${app.time} • ${app.notes || "No notes"}</p>
      </div>
      <span class="status-badge info">${app.status}</span>
    `;
    list.appendChild(row);
  });
  target.appendChild(list);
}

function renderSuccessStats() {
  const target = document.getElementById("successStatsCard");
  if (!target) return;
  const appointments = filterByRange(
    Object.values(state.appointments || {}),
    "date"
  );
  const completed = appointments.filter((a) => a.status === "Completed").length;
  const rate =
    appointments.length === 0
      ? 0
      : Math.round((completed / appointments.length) * 100);

  // Compare completion rate current vs previous period for selected range
  const rateForSet = (set) => {
    if (!set.length) return 0;
    return Math.round(
      (set.filter((a) => a.status === "Completed").length / set.length) * 100
    );
  };

  const now = new Date();
  let currentSet = appointments;
  let prevSet = [];

  if (selectedRange === "weekly") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startCurrent = new Date(today);
    startCurrent.setDate(startCurrent.getDate() - 6);
    const endCurrent = today;

    const startPrev = new Date(startCurrent);
    startPrev.setDate(startPrev.getDate() - 7);
    const endPrev = new Date(startCurrent);
    endPrev.setDate(endPrev.getDate() - 1);

    const inWindow = (d, start, end) => d >= start && d <= end;
    currentSet = appointments.filter((a) => {
      const d = safeDate(a.date);
      return d && inWindow(d, startCurrent, endCurrent);
    });
    prevSet = appointments.filter((a) => {
      const d = safeDate(a.date);
      return d && inWindow(d, startPrev, endPrev);
    });
  } else if (selectedRange === "yearly") {
    const currentYear = now.getFullYear();
    const prevYear = currentYear - 1;
    currentSet = appointments.filter((a) => {
      const d = safeDate(a.date);
      return d && d.getFullYear() === currentYear;
    });
    prevSet = appointments.filter((a) => {
      const d = safeDate(a.date);
      return d && d.getFullYear() === prevYear;
    });
  } else {
    // monthly default
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    currentSet = appointments.filter((a) => {
      const d = safeDate(a.date);
      return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    prevSet = appointments.filter((a) => {
      const d = safeDate(a.date);
      return d && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });
  }

  const currentRate = rateForSet(currentSet);
  const prevRate = prevSet.length ? rateForSet(prevSet) : null;

  const rateTrend =
    prevRate === null || prevRate === 0
      ? null
      : ((currentRate - prevRate) / prevRate) * 100;

  const trendLabel =
    typeof rateTrend === "number"
      ? `${rateTrend > 0 ? "↑" : "↓"} ${Math.abs(rateTrend).toFixed(1)}%`
      : "—";

  target.innerHTML = `
    <h3>Success Stats</h3>
    <div class="status-header">
      <span class="status-emoji">😊</span>
      <div>
        <div class="big-number">${currentRate}%</div>
        <span class="chip chip-scheduled">${trendLabel}</span>
      </div>
    </div>
    <p class="muted">Completion rate based on appointments</p>
  `;
}

function renderCounts() {
  const patients = Object.values(state.patients || {});
  const appointments = Object.values(state.appointments || {});
  const targetPatients = document.getElementById("patientsThisMonthCard");
  const targetEarnings = document.getElementById("earningsCard");
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const patientsThisMonth = patients.filter((p) => {
    if (!p.date) return false;
    const d = new Date(p.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const earnings = patients.reduce(
    (sum, p) => sum + (Number(p.advance) || 0),
    0
  );

  if (targetPatients) {
    targetPatients.innerHTML = `
      <h3>Total Patients This Month</h3>
      <div class="big-number">${patientsThisMonth}</div>
    `;
  }

  if (targetEarnings) {
    targetEarnings.innerHTML = `
      <h3>Earning</h3>
      <div class="big-number">$${earnings.toFixed(2)}</div>
      <p class="muted">This month so far</p>
    `;
  }
}

function refreshDashboard() {
  renderMetrics();
  updateCharts();
  renderNextPatientCard();
  renderApprovalCard();
  renderTodayAppointments();
  renderSuccessStats();
  renderCounts();
}

function updateWelcome(profile) {
  const name = profile?.name || "Doctor";
  const welcome = document.getElementById("dashboardWelcome");
  if (welcome) {
    welcome.textContent = `Welcome Back, ${name}!`;
  }
}

function setupTimeframeSwitch() {
  const switcher = document.getElementById("timeframeSwitch");
  if (!switcher) return;
  switcher.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill-btn");
    if (!btn) return;
    switcher.querySelectorAll(".pill-btn").forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");
    selectedRange = btn.dataset.range || "monthly";
    refreshDashboard();
  });
}

function initDateLabel() {
  const now = new Date();
  const dateElement = document.getElementById("dashboardDate");
  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

function bootstrapRealtime(db, uid) {
  const patientsRef = db.ref("patients/" + uid);
  const receptionRef = db.ref("waitingList/" + uid);
  const expensesRef = db.ref("fixedExpenses/" + uid);
  const suppliesRef = db.ref("medicalSupplies/" + uid);
  const labosRef = db.ref("labos/" + uid);
  const appointmentsRef = db.ref("appointments/" + uid);
  const profileRef = db.ref("profiles/" + uid);

  patientsRef.on("value", (snap) => {
    state.patients = snap.val() || {};
    refreshDashboard();
  });
  receptionRef.on("value", (snap) => {
    state.reception = snap.val() || {};
    refreshDashboard();
  });
  expensesRef.on("value", (snap) => {
    state.expenses = snap.val() || {};
    refreshDashboard();
  });
  suppliesRef.on("value", (snap) => {
    state.supplies = snap.val() || {};
    refreshDashboard();
  });
  labosRef.on("value", (snap) => {
    state.labos = snap.val() || {};
    refreshDashboard();
  });
  appointmentsRef.on("value", (snap) => {
    state.appointments = snap.val() || {};
    refreshDashboard();
  });
  profileRef.on("value", (snap) => {
    state.profile = snap.val() || {};
    updateWelcome(state.profile);
  });
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  });
}

firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  uid = user.uid;
  localStorage.setItem("uid", uid);
  const db = firebase.database();
  initDateLabel();
  setupTimeframeSwitch();
  bootstrapRealtime(db, uid);
});
