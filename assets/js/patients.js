// Get UID of current user
const uid = localStorage.getItem("uid");
if (!uid) {
  Toast.error("User not logged in");
  window.location.href = "index.html"; // or redirect to login
}

// Reference only the logged-in user's patients
const db = firebase.database();
const patientRef = db.ref("patients/" + uid); // ✅ scoped to this user

const patientForm = document.getElementById("patientForm");
const patientName = document.getElementById("patientName");
const patientPhone = document.getElementById("patientPhone");
const patientWork = document.getElementById("patientWork");
const patientNote = document.getElementById("patientNote");
const firstVisit = document.getElementById("firstVisit");
const nextVisit = document.getElementById("nextVisit");
const patientStatus = document.getElementById("patientStatus");
const patientPrice = document.getElementById("patientPrice");
const patientAdvance = document.getElementById("patientAdvance");
const patientDate = document.getElementById("patientDate");
const patientTable = document.querySelector("#patientTable tbody");

let patients = {}; // will hold patients from Firebase as an object
let editingKey = null;
let currentNoteKey = null;
let filteredPatients = {}; // will hold filtered results

function renderPatients(patientsToRender = patients) {
  patientTable.innerHTML = "";
  for (const key in patientsToRender) {
    const p = patientsToRender[key];
    const remaining = (p.price || 0) - (p.advance || 0);
    const row = document.createElement("tr");

    const statusClass =
      p.status === "Finished"
        ? "row-status-finished"
        : p.status === "In Labo"
        ? "row-status-labo"
        : "";
    if (statusClass) row.classList.add(statusClass);

    row.innerHTML = `
      <td>${p.name}</td>
      <td>${p.phone}</td>
      <td>${p.work}</td>
      <td>${p.status}</td>
      <td>${p.firstVisit || ""}</td>
      <td>${p.nextVisit || ""}</td>
      <td>${p.price || 0}</td>
      <td>${p.advance || 0}</td>
      <td>${remaining}</td>
      <td>${p.date || ""}</td>
      <td class="action-buttons">

  <button class="icon-btn edit-btn"
          onclick="openEditModal('${key}')"
          title="Edit">
      <i class="fa-solid fa-pen"></i>
  </button>

  <button class="icon-btn note-btn"
          onclick="openNoteModal('${key}')"
          title="View Note">
      <i class="fa-solid fa-note-sticky"></i>
  </button>

  <button class="icon-btn delete-btn"
          onclick="deletePatient('${key}')"
          title="Delete">
      <i class="fa-solid fa-trash"></i>
  </button>

</td>
    `;
    patientTable.appendChild(row);
  }
}
window.openNoteModal = function (key) {

  currentNoteKey = key;

  const p = patients[key];

  document.getElementById("patientNoteContent").value =
      p.note || "";

  document.getElementById("noteModal").style.display = "flex";

};

window.closeNoteModal = function () {

  document.getElementById("noteModal").style.display = "none";

  currentNoteKey = null;

};

window.saveCurrentNote = function () {

  if (!currentNoteKey) return;

  const note = document.getElementById("patientNoteContent").value;

  patients[currentNoteKey].note = note;

  patientRef
      .child(currentNoteKey)
      .update({
          note: note
      })
      .then(() => {

          Toast.success("Note updated");

          closeNoteModal();

      })
      .catch(error => {

          Toast.error(error.message);

      });

};
// Search and Filter functionality
function applyFilters() {
  const searchTerm = document.getElementById("searchBar").value.toLowerCase();
  const statusFilter = document.getElementById("filterStatus").value;
  const workFilter = document.getElementById("filterWork").value;

  filteredPatients = {};

  for (const key in patients) {
    const p = patients[key];
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm) ||
      p.phone.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesWork = !workFilter || p.work === workFilter;

    if (matchesSearch && matchesStatus && matchesWork) {
      filteredPatients[key] = p;
    }
  }

  renderPatients(filteredPatients);
}

// Export to CSV functionality
function exportToCSV() {
  const dataToExport =
    Object.keys(filteredPatients).length > 0 ? filteredPatients : patients;

  let csv =
    "Name,Phone,Work,Status,Note,First Visit,Next Visit,Price,Advance,Remaining,Date\n";

  for (const key in dataToExport) {
    const p = dataToExport[key];
    const remaining = (p.price || 0) - (p.advance || 0);
    csv += `"${p.name}","${p.phone}","${p.work}","${p.status}","${
      p.note || ""
    }","${p.firstVisit || ""}","${p.nextVisit || ""}",${p.price || 0},${
      p.advance || 0
    },${remaining},"${p.date || ""}"\n`;
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `patients_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Event listeners for search and filters
document.getElementById("searchBar").addEventListener("input", applyFilters);
document
  .getElementById("filterStatus")
  .addEventListener("change", applyFilters);
document.getElementById("filterWork").addEventListener("change", applyFilters);
document.getElementById("exportBtn").addEventListener("click", exportToCSV);

// Add new patient
patientForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const patient = {
    name: patientName.value,
    phone: patientPhone.value,
    work: patientWork.value,
    note: patientNote.value,
    firstVisit: firstVisit.value,
    nextVisit: nextVisit.value,
    status: patientStatus.value,
    price: parseFloat(patientPrice.value),
    advance: parseFloat(patientAdvance.value),

    date:
        patientDate.value ||
        new Date().toISOString().split("T")[0],

    history: [
        {
            amount: parseFloat(patientAdvance.value),
            date: new Date().toLocaleDateString(),
        },
    ],
};

  patientRef
    .push(patient)
    .then(() => {
      patientForm.reset();
    })
    .catch((error) => {
      Toast.error("Error adding patient: " + error.message);
    });
});

// Delete patient
window.deletePatient = function (key) {
  const patientName = patients[key]?.name || "this patient";

  // Create custom confirmation dialog
  const confirmDelete = confirm(
    `Are you sure you want to delete ${patientName}?\n\nThis action cannot be undone.`
  );

  if (confirmDelete) {
    patientRef
      .child(key)
      .remove()
      .then(() => {
        Toast.success(`Patient "${patientName}" deleted successfully`);
      })
      .catch((error) => {
        Toast.error("Failed to delete patient: " + error.message);
      });
  }
};

// Edit patient
window.openEditModal = function (key) {
  editingKey = key;
  const p = patients[key];
  document.getElementById("editName").value = p.name;
  document.getElementById("editPhone").value = p.phone;
  document.getElementById("editStatus").value = p.status;
  document.getElementById("editAdvance").value = "";
  document.getElementById("editModal").style.display = "flex";

  renderHistory(p.history || []);
};

function renderHistory(history) {
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";
  if (history.length === 0) {
    historyList.innerHTML = "<li>No payment history</li>";
    return;
  }
  history.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.date}: ${entry.amount} MAD`;
    historyList.appendChild(li);
  });
}

// Save edited patient data
window.saveEdit = function () {
  if (!editingKey) return;

  const p = patients[editingKey];
  const newAdvance =
    parseFloat(document.getElementById("editAdvance").value) || 0;

  if (newAdvance > 0) {
    p.advance = (p.advance || 0) + newAdvance;
    p.history = p.history || [];
    p.history.push({
      date: new Date().toLocaleDateString(),
      amount: newAdvance,
    });
  }

  p.name = document.getElementById("editName").value;
  p.phone = document.getElementById("editPhone").value;
  p.status = document.getElementById("editStatus").value;

  patientRef
    .child(editingKey)
    .set(p)
    .then(() => {
      document.getElementById("editModal").style.display = "none";
    })
    .catch((error) => {
      Toast.error("Error saving changes: " + error.message);
    });
};

window.closeModal = function () {
  document.getElementById("editModal").style.display = "none";
};

// Firebase realtime listener
patientRef.on("value", (snapshot) => {
  patients = snapshot.val() || {};
  renderPatients();
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
    const patientRef = db.ref("patients/" + uid);

    // ⬇️ Put all your app logic here (form, events, listeners, etc.)
  } else {
    // Not logged in → redirect
    window.location.href = "index.html";
  }
});
