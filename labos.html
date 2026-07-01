const uid = localStorage.getItem("uid");
if (!uid) {
  Toast.error("User not logged in");
  window.location.href = "index.html"; // or redirect to login
}

const db = firebase.database();
const labosRef = db.ref("labos/" + uid);

const laboForm = document.getElementById("laboForm");
const laboTableBody = document.querySelector("#laboTable tbody");

let labos = {};
let editingLaboKey = null;
let filteredLabos = {}; // will hold filtered results

// Validate function stays the same
function validateLaboData(data) {
  if (!data.name.trim()) {
    Toast.warning("Please enter the labo name.");
    return false;
  }
  if (isNaN(data.price) || data.price < 0) {
    Toast.warning("Please enter a valid positive labo price.");
    return false;
  }
  if (!data.date) {
    Toast.warning("Please select the labo date.");
    return false;
  }
  if (!data.status) {
    Toast.warning("Please select labo status.");
    return false;
  }
  if (!data.sendDate) {
    Toast.warning("Please select the labo send date.");
    return false;
  }
  return true;
}

function getStatusClass(status) {
  switch (status) {
    case "Working":
      return "status-working";

    case "Delivered":
      return "status-delivered";

    case "Sent":
      return "status-sent";

    default:
      return "status-pending";
  }
}

function renderLabos(labosToRender = labos) {
  laboTableBody.innerHTML = "";

  Object.entries(labosToRender).forEach(([key, l]) => {

    const tr = document.createElement("tr");

    tr.innerHTML = `

      <td>${l.name}</td>

      <td>${Number(l.price).toFixed(2)} DH</td>

      <td>${l.date}</td>

      <td>
          <span class="status-badge ${getStatusClass(l.status)}">
              ${l.status}
          </span>
      </td>

      <td>${l.sendDate}</td>

      <td class="action-buttons">

          <button
              class="icon-btn edit-btn"
              onclick="editLabo('${key}')"
              title="Edit">

              <i class="fa-solid fa-pen"></i>

          </button>

          <button
              class="icon-btn note-btn"
              onclick="openLaboNote('${key}')"
              title="Note">

              <i class="fa-solid fa-note-sticky"></i>

          </button>

          <button
              class="icon-btn delete-btn"
              onclick="deleteLabo('${key}')"
              title="Delete">

              <i class="fa-solid fa-trash"></i>

          </button>

      </td>

    `;

    laboTableBody.appendChild(tr);

  });
}
window.openLaboNote = function (key) {

  const l = labos[key];

  document.getElementById("laboNoteContent").innerHTML =
      l.note && l.note.trim()
          ? l.note
          : "<em>No note available.</em>";

  document.getElementById("laboNoteModal").style.display = "flex";

};

window.closeLaboNote = function () {

  document.getElementById("laboNoteModal").style.display = "none";

};

// Search and Filter functionality for labos
function applyLaboFilters() {
  const searchTerm = document
    .getElementById("searchLaboBar")
    .value.toLowerCase();
  const statusFilter = document.getElementById("filterLaboStatus").value;

  filteredLabos = {};

  for (const key in labos) {
    const l = labos[key];
    const matchesSearch = l.name.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || l.status === statusFilter;

    if (matchesSearch && matchesStatus) {
      filteredLabos[key] = l;
    }
  }

  renderLabos(filteredLabos);
}

// Export to CSV functionality for labos
function exportLabosToCSV() {
  const dataToExport =
    Object.keys(filteredLabos).length > 0 ? filteredLabos : labos;

  let csv = "Name,Price,Date,Status,Send Date,Note\n";

  for (const key in dataToExport) {
    const l = dataToExport[key];
    csv += `"${l.name}",${Number(l.price).toFixed(2)},"${l.date}","${
      l.status
    }","${l.sendDate}","${l.note || ""}"\n`;
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lab_work_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Event listeners for search and filters
document
  .getElementById("searchLaboBar")
  .addEventListener("input", applyLaboFilters);
document
  .getElementById("filterLaboStatus")
  .addEventListener("change", applyLaboFilters);
document
  .getElementById("exportLaboBtn")
  .addEventListener("click", exportLabosToCSV);

// Edit a labo entry
window.editLabo = function (key) {

  editingLaboKey = key;

  const l = labos[key];

  document.getElementById("editLaboName").value = l.name;
  document.getElementById("editLaboPrice").value = l.price;
  document.getElementById("editLaboDate").value = l.date;
  document.getElementById("editLaboStatus").value = l.status;
  document.getElementById("editLaboSendDate").value = l.sendDate;
  document.getElementById("editLaboNote").value = l.note || "";

  document.getElementById("laboModal").style.display = "flex";

};
window.closeLaboModal = function () {

  document.getElementById("laboModal").style.display = "none";

};
window.saveLaboEdit = function () {

    if (!editingLaboKey) return;

    const updated = {

        name: document.getElementById("editLaboName").value.trim(),

        price: parseFloat(document.getElementById("editLaboPrice").value),

        date: document.getElementById("editLaboDate").value,

        status: document.getElementById("editLaboStatus").value,

        sendDate: document.getElementById("editLaboSendDate").value,

        note: document.getElementById("editLaboNote").value.trim()

    };

    if (!validateLaboData(updated))
        return;

    labosRef.child(editingLaboKey)

        .set(updated)

        .then(() => {

            Toast.success("Lab updated successfully.");

            closeLaboModal();

            editingLaboKey = null;

        })

        .catch(err =>

            Toast.error(err.message)

        );

};
// Delete a labo entry
window.deleteLabo = function (key) {
  if (confirm("Are you sure you want to delete this labo entry?")) {
    labosRef
      .child(key)
      .remove()
      .then(() => Toast.success("Labo entry deleted successfully."))
      .catch((err) => Toast.error("Error deleting labo: " + err.message));
  }
};

function resetLaboForm() {

  laboForm.reset();

  editingLaboKey = null;

  document.querySelector("#laboForm button[type='submit']").textContent =
      "Add Lab Work";

}

laboForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newLabo = {
    name: laboForm.laboName.value.trim(),
    price: parseFloat(laboForm.laboPrice.value),
    date: laboForm.laboDate.value,
    status: laboForm.laboStatus.value,
    sendDate: laboForm.laboSendDate.value,
    note: laboForm.laboNote.value.trim(),
  };

  if (!validateLaboData(newLabo)) return;

  if (editingLaboKey) {
    // Update existing labo in Firebase
    labosRef
      .child(editingLaboKey)
      .set(newLabo)
      .then(() => {
        Toast.success("Labo entry updated successfully.");
        resetLaboForm();
      })
      .catch((err) => Toast.error("Error updating labo: " + err.message));
  } else {
    // Add new labo to Firebase
    labosRef
      .push(newLabo)
      .then(() => {
        Toast.success("Labo entry added successfully.");
        resetLaboForm();
      })
      .catch((err) => Toast.error("Error adding labo: " + err.message));
  }
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

// Listen for realtime updates to labos
labosRef.on("value", (snapshot) => {
  labos = snapshot.val() || {};
  renderLabos();
  updateDashboard(); // update dashboard when labos change
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const uid = user.uid;
    localStorage.setItem("uid", uid); // optional
    const db = firebase.database();
    const labosRef = db.ref("labos/" + uid);

    // ⬇️ Put all your app logic here (form, events, listeners, etc.)
  } else {
    // Not logged in → redirect
    window.location.href = "index.html";
  }
});
