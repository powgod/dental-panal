// Get UID of current user
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    // Not logged in
    window.location.href = "index.html";
    return;
  }

  const uid = user.uid;
  const db = firebase.database();

  const patientsRef = db.ref("patients/" + uid);
  const receptionRef = db.ref("waitingList/" + uid);
  const expensesRef = db.ref("fixedExpenses/" + uid);
  const suppliesRef = db.ref("medicalSupplies/" + uid);
  const labosRef = db.ref("labos/" + uid);
  const profileRef = db.ref("profiles/" + uid);

  // Load doctor name from profile
  profileRef
    .once("value")
    .then((snapshot) => {
      const profile = snapshot.val();
      const doctorName = profile && profile.name ? profile.name : "Doctor";

      // Update header with doctor name
      const headerElement = document.querySelector(".dashboard-header h1");
      if (headerElement) {
        headerElement.innerHTML = `🦷 Welcome Back, ${doctorName}!`;
      }
    })
    .catch((error) => {
      console.error("Error loading profile:", error);
      // Fallback to generic greeting
      const headerElement = document.querySelector(".dashboard-header h1");
      if (headerElement) {
        headerElement.innerHTML = "🦷 Welcome Back, Doctor!";
      }
    });

  // Set date
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

  let revenueChart = null;
  let workTypeChart = null;

  const metricConfigs = [
    {
      id: "totalPatients",
      label: "Total Patients",
      icon: "fa-users",
      color: "#3498db",
    },
    {
      id: "waitingPatients",
      label: "In Reception",
      icon: "fa-clock",
      color: "#f39c12",
    },
    {
      id: "totalPrice",
      label: "Total Revenue",
      icon: "fa-money-bill-wave",
      color: "#27ae60",
      suffix: " MAD",
    },
    {
      id: "totalAdvance",
      label: "Collected",
      icon: "fa-wallet",
      color: "#16a085",
      suffix: " MAD",
    },
    {
      id: "monthlyExpense",
      label: "Monthly Expenses",
      icon: "fa-receipt",
      color: "#e74c3c",
      suffix: " MAD",
    },
    {
      id: "medicalInventoryCost",
      label: "Supplies Cost",
      icon: "fa-pills",
      color: "#9b59b6",
      suffix: " MAD",
    },
    {
      id: "monthlyLaboExpense",
      label: "Lab Expenses",
      icon: "fa-flask",
      color: "#34495e",
      suffix: " MAD",
    },
    {
      id: "laboWorkLeft",
      label: "Pending Labs",
      icon: "fa-tasks",
      color: "#e67e22",
    },
    {
      id: "netProfit",
      label: "Net Profit",
      icon: "fa-chart-line",
      color: "#2ecc71",
      suffix: " MAD",
    },
    {
      id: "caseAmount",
      label: "Cash in Hand",
      icon: "fa-hand-holding-usd",
      color: "#1abc9c",
      suffix: " MAD",
    },
  ];

  function createEnhancedMetricCard(config, value) {
    const card = document.createElement("div");
    card.className = "enhanced-metric-card";
    card.style.borderLeftColor = config.color;

    card.innerHTML = `
      <div class="metric-icon" style="color: ${config.color}">
        <i class="fa ${config.icon}"></i>
      </div>
      <div class="metric-label">${config.label}</div>
      <div class="metric-value" style="color: ${config.color}">
        ${value}${config.suffix || ""}
      </div>
    `;

    return card;
  }

  function updateDashboard(
    patientsData,
    receptionData,
    expensesData,
    suppliesData,
    labosData
  ) {
    const dashboard = document.getElementById("dashboard");
    dashboard.innerHTML = "";
    dashboard.style.display = "grid";
    dashboard.style.gridTemplateColumns =
      "repeat(auto-fit, minmax(220px, 1fr))";
    dashboard.style.gap = "20px";

    const patients = patientsData ? Object.values(patientsData) : [];
    const reception = receptionData ? Object.values(receptionData) : [];
    const expenses = expensesData ? Object.values(expensesData) : [];
    const supplies = suppliesData ? Object.values(suppliesData) : [];
    const labos = labosData ? Object.values(labosData) : [];

    const totalPatients = patients.length;
    const waitingPatients = reception.length;
    const totalPrice = patients.reduce(
      (sum, p) => sum + (Number(p.price) || 0),
      0
    );
    const totalAdvance = patients.reduce(
      (sum, p) => sum + (Number(p.advance) || 0),
      0
    );
    const totalExpense = expenses.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalMedicalCost = supplies.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalLaboExpense = labos.reduce(
      (sum, l) => sum + (Number(l.price) || 0),
      0
    );
    const pendingLabos = labos.filter(
      (l) => l.status.toLowerCase() !== "completed"
    ).length;
    const netProfit =
      totalPrice - totalMedicalCost - totalExpense - totalLaboExpense;
    const cashInHand =
      totalAdvance - totalMedicalCost - totalExpense - totalLaboExpense;

    const values = {
      totalPatients,
      waitingPatients,
      totalPrice: totalPrice.toFixed(2),
      totalAdvance: totalAdvance.toFixed(2),
      monthlyExpense: totalExpense.toFixed(2),
      medicalInventoryCost: totalMedicalCost.toFixed(2),
      monthlyLaboExpense: totalLaboExpense.toFixed(2),
      laboWorkLeft: pendingLabos,
      netProfit: netProfit.toFixed(2),
      caseAmount: cashInHand.toFixed(2),
    };

    metricConfigs.forEach((config) => {
      const card = createEnhancedMetricCard(config, values[config.id]);
      dashboard.appendChild(card);
    });

    // Update charts
    updateCharts(patients);
  }

  function updateCharts(patients) {
    // Monthly Revenue Chart
    const monthlyData = {};
    patients.forEach((p) => {
      if (p.date) {
        const month = new Date(p.date).toLocaleString("default", {
          month: "short",
        });
        monthlyData[month] = (monthlyData[month] || 0) + (Number(p.price) || 0);
      }
    });

    const months = Object.keys(monthlyData);
    const revenues = Object.values(monthlyData);

    if (revenueChart) revenueChart.destroy();

    const ctx1 = document.getElementById("revenueChart").getContext("2d");
    revenueChart = new Chart(ctx1, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Revenue (MAD)",
            data: revenues,
            borderColor: "#3498db",
            backgroundColor: "rgba(52, 152, 219, 0.1)",
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

    // Work Type Distribution Chart
    const workTypes = {};
    patients.forEach((p) => {
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
              "#3498db",
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

  // Setup realtime listeners for all relevant data nodes
  patientsRef.on("value", (patientsSnap) => {
    const patientsData = patientsSnap.val();

    receptionRef.once("value", (receptionSnap) => {
      const receptionData = receptionSnap.val();

      expensesRef.once("value", (expensesSnap) => {
        const expensesData = expensesSnap.val();

        suppliesRef.once("value", (suppliesSnap) => {
          const suppliesData = suppliesSnap.val();

          labosRef.once("value", (labosSnap) => {
            const labosData = labosSnap.val();

            updateDashboard(
              patientsData,
              receptionData,
              expensesData,
              suppliesData,
              labosData
            );
          });
        });
      });
    });
  });
});

const db = firebase.database();

const patientsRef = db.ref("patients/" + uid);
const receptionRef = db.ref("waitingList/" + uid);
const expensesRef = db.ref("fixedExpenses/" + uid);
const suppliesRef = db.ref("medicalSupplies/" + uid);
const labosRef = db.ref("labos/" + uid);

function updateDashboard(patientsData, receptionData) {
  const patients = patientsData ? Object.values(patientsData) : [];
  const reception = receptionData ? Object.values(receptionData) : [];

  const totalPatients = patients.length;
  const waitingPatients = reception.length;

  const dashboard = document.getElementById("dashboard");
  dashboard.innerHTML = `
    <div class="metric-card">
      <h3>Total Patients</h3>
      <p>${totalPatients}</p>
    </div>
    <div class="metric-card">
      <h3>Reception</h3>
      <p>${waitingPatients}</p>
    </div>
  `;
}

function updateTotalAdvance(patientsData) {
  const patients = patientsData ? Object.values(patientsData) : [];
  const totalAdvance = patients.reduce(
    (sum, p) => sum + (Number(p.advance) || 0),
    0
  );

  let advanceElement = document.getElementById("totalAdvance");
  if (advanceElement) {
    advanceElement.textContent = `${totalAdvance.toFixed(2)} MAD`;
  } else {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <h3>Total Advance</h3>
      <p id="totalAdvance">${totalAdvance.toFixed(2)} MAD</p>
    `;
    document.getElementById("dashboard").appendChild(card);
  }
}

function updateTotalPrice(patientsData) {
  const patients = patientsData ? Object.values(patientsData) : [];
  const totalPrice = patients.reduce(
    (sum, p) => sum + (Number(p.price) || 0),
    0
  );

  let priceElement = document.getElementById("totalPrice");
  if (priceElement) {
    priceElement.textContent = `${totalPrice.toFixed(2)} MAD`;
  } else {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <h3>Total Price</h3>
      <p id="totalPrice">${totalPrice.toFixed(2)} MAD</p>
    `;
    document.getElementById("dashboard").appendChild(card);
  }
}

// Similarly for other dashboard items...
function updateMonthlyExpense(expensesData) {
  const expenses = expensesData ? Object.values(expensesData) : [];
  const totalExpense = expenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  let expenseElement = document.getElementById("monthlyExpense");
  if (expenseElement) {
    expenseElement.textContent = `${totalExpense.toFixed(2)} MAD`;
  } else {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <h3>Monthly Expense</h3>
      <p id="monthlyExpense">${totalExpense.toFixed(2)} MAD</p>
    `;
    document.getElementById("dashboard").appendChild(card);
  }
}

function updateMedicalInventoryCost(suppliesData) {
  const supplies = suppliesData ? Object.values(suppliesData) : [];
  const totalCost = supplies.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  let element = document.getElementById("medicalInventoryCost");
  if (element) {
    element.textContent = `${totalCost.toFixed(2)} MAD`;
  } else {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <h3>Medical Supplies Cost</h3>
      <p id="medicalInventoryCost">${totalCost.toFixed(2)} MAD</p>
    `;
    document.getElementById("dashboard").appendChild(card);
  }
}

function updateMonthlyLaboExpense(labosData) {
  const labos = labosData ? Object.values(labosData) : [];
  const total = labos.reduce((sum, l) => sum + (Number(l.price) || 0), 0);

  let laboElement = document.getElementById("monthlyLaboExpense");
  if (laboElement) {
    laboElement.textContent = `${total.toFixed(2)} MAD`;
  } else {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <h3>Monthly Labo Expense</h3>
      <p id="monthlyLaboExpense">${total.toFixed(2)} MAD</p>
    `;
    document.getElementById("dashboard").appendChild(card);
  }
}

function updateLaboWorkLeft(labosData) {
  const labos = labosData ? Object.values(labosData) : [];
  const pendingLabos = labos.filter(
    (l) => l.status.toLowerCase() !== "completed"
  ).length;

  let laboWorkElement = document.getElementById("laboWorkLeft");
  if (laboWorkElement) {
    laboWorkElement.textContent = `${pendingLabos} labos`;
  } else {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <h3>Labo Work Left</h3>
      <p id="laboWorkLeft">${pendingLabos} labos</p>
    `;
    document.getElementById("dashboard").appendChild(card);
  }
}

function updateFinancialSummary(
  patientsData,
  suppliesData,
  expensesData,
  labosData
) {
  const patients = patientsData ? Object.values(patientsData) : [];
  const supplies = suppliesData ? Object.values(suppliesData) : [];
  const expenses = expensesData ? Object.values(expensesData) : [];
  const labos = labosData ? Object.values(labosData) : [];

  const totalPrice = patients.reduce(
    (sum, p) => sum + (Number(p.price) || 0),
    0
  );
  const totalAdvance = patients.reduce(
    (sum, p) => sum + (Number(p.advance) || 0),
    0
  );
  const totalMedicalCost = supplies.reduce(
    (sum, s) => sum + s.quantity * s.unitPrice,
    0
  );
  const totalMonthlyExpense = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const totalLaboExpense = labos.reduce(
    (sum, l) => sum + (Number(l.price) || 0),
    0
  );

  const netProfit =
    totalPrice - totalMedicalCost - totalMonthlyExpense - totalLaboExpense;
  const cashInHand =
    totalAdvance - totalMedicalCost - totalMonthlyExpense - totalLaboExpense;

  let netProfitElement = document.getElementById("netProfit");
  if (netProfitElement) {
    netProfitElement.textContent = `${netProfit.toFixed(2)} MAD`;
  } else {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <h3>Net Profit</h3>
      <p id="netProfit">${netProfit.toFixed(2)} MAD</p>
    `;
    document.getElementById("dashboard").appendChild(card);
  }

  let cashElement = document.getElementById("caseAmount");
  if (cashElement) {
    cashElement.textContent = `${cashInHand.toFixed(2)} MAD`;
  } else {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <h3>Cash In Hand</h3>
      <p id="caseAmount">${cashInHand.toFixed(2)} MAD</p>
    `;
    document.getElementById("dashboard").appendChild(card);
  }
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        window.location.href = "index.html"; // Adjust if your login page has a different name
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  });
}

// Setup realtime listeners for all relevant data nodes
patientsRef.on("value", (patientsSnap) => {
  const patientsData = patientsSnap.val();

  receptionRef.once("value", (receptionSnap) => {
    const receptionData = receptionSnap.val();
    updateDashboard(patientsData, receptionData);
    updateTotalAdvance(patientsData);
    updateTotalPrice(patientsData);
  });

  expensesRef.once("value", (expensesSnap) => {
    const expensesData = expensesSnap.val();

    suppliesRef.once("value", (suppliesSnap) => {
      const suppliesData = suppliesSnap.val();

      labosRef.once("value", (labosSnap) => {
        const labosData = labosSnap.val();

        // ✅ Add this line to show profit and cash in hand
        updateFinancialSummary(
          patientsData,
          suppliesData,
          expensesData,
          labosData
        );

        updateMonthlyExpense(expensesData);
        updateMedicalInventoryCost(suppliesData);
        updateMonthlyLaboExpense(labosData);
      });
    });
  });
});
