// expenses.js
const uid = localStorage.getItem("uid");
if (!uid) {
  Toast.error("User not logged in");
  window.location.href = "index.html"; // or redirect to login
}

const db = firebase.database();
const expensesRef = db.ref("fixedExpenses/" + uid);

const expenseForm = document.getElementById("expenseForm");
const expenseNameInput = document.getElementById("expenseName");
const expenseAmountInput = document.getElementById("expenseAmount");
const expensesTableBody = document.querySelector("#expensesTable tbody");

let expenses = {};

// Render expenses table from Firebase data
function renderExpenses() {
  expensesTableBody.innerHTML = `
    <tr>
      <th>Expense</th>
      <th>Amount (MAD)</th>
      <th>Action</th>
    </tr>
  `;

  Object.entries(expenses).forEach(([key, expense]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${expense.name}</td>
      <td>${expense.amount.toFixed(2)}</td>
      <td><button class="delete-btn" onclick="deleteExpense('${key}')">🗑️</button></td>
    `;
    expensesTableBody.appendChild(tr);
  });
}

// Delete expense from Firebase
window.deleteExpense = async function (key) {
  if (confirm("Delete this expense?")) {
    await expensesRef.child(key).remove();
  }
};

// Add new expense to Firebase
expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = expenseNameInput.value.trim();
  const amount = parseFloat(expenseAmountInput.value);

  if (!name || isNaN(amount) || amount < 0) {
    Toast.warning("Please enter a valid name and amount.");
    return;
  }

  expensesRef.push({ name, amount })
  .then(() => {

    expenseForm.reset();

    return firebase.database()
      .ref("profiles/" + uid + "/setup")
      .update({
        expense: true
      });

  })
  .then(() => {

    if (localStorage.getItem("setupRedirect") === "expense") {

      localStorage.removeItem("setupRedirect");

      Toast.success("🎉 Great! Your first expense has been added.");

      setTimeout(() => {

        window.location.href = "dashboard.html";

      }, 1200);

    }

  })
  .catch((err) => {

    Toast.error("Error adding expense: " + err.message);

  });
});

// Listen for realtime updates from Firebase
expensesRef.on("value", (snapshot) => {
  expenses = snapshot.val() || {};
  renderExpenses();
});
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

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const uid = user.uid;
    localStorage.setItem("uid", uid); // optional
    const db = firebase.database();
    const expensesRef = db.ref("fixedExpenses/" + uid);

    // ⬇️ Put all your app logic here (form, events, listeners, etc.)
  } else {
    // Not logged in → redirect
    window.location.href = "index.html";
  }
});
