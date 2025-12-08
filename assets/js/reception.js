// reception.js
const uid = localStorage.getItem("uid");
if (!uid) {
  Toast.error("User not logged in");
  window.location.href = "index.html"; // or redirect to login
}

const db = firebase.database();
const waitingRef = db.ref("waitingList/" + uid);

const nameInput = document.getElementById("patientwaitingName");
const phoneInput = document.getElementById("patientwaitingPhone");
const workInput = document.getElementById("patientwaitingwork");
const waitingTable = document.getElementById("waitingTable");

let waitingPatients = {};
let editingKey = null;

// Clock
function updateClock() {
  const now = new Date();
  document.getElementById("currentTime").textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Render patients from Firebase data snapshot
function renderWaitingList() {
  waitingTable.innerHTML = `
    <tr>
      <th>Name</th><th>Phone</th><th>Work</th><th>Actions</th>
    </tr>`;

  Object.entries(waitingPatients).forEach(([key, patient]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${patient.name}</td>
      <td>${patient.phone}</td>
      <td>${patient.work}</td>
      <td>
        <button onclick="removePatient('${key}')" class="delete-btn">🗑️</button>
      </td>
    `;
    waitingTable.appendChild(tr);
  });
}

// Remove patient from Firebase
window.removePatient = async function (key) {
  if (confirm("Are you sure you want to remove this patient?")) {
    await waitingRef.child(key).remove();
  }
};

// Add patient to Firebase
function addPatient() {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const work = workInput.value.trim();
  if (!name || !phone || !work) return;

  const newPatient = { name, phone, work };
  waitingRef.push(newPatient).then(() => {
    nameInput.value = "";
    phoneInput.value = "";
    workInput.value = "";
  });
}

// Add event listener for "Enter" on last input
workInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPatient();
});

// Listen to Firebase waitingList changes in realtime
waitingRef.on("value", (snapshot) => {
  waitingPatients = snapshot.val() || {};
  renderWaitingList();
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
    const waitingRef = db.ref("waitingList/" + uid);

    // ⬇️ Put all your app logic here (form, events, listeners, etc.)
  } else {
    // Not logged in → redirect
    window.location.href = "index.html";
  }
});
