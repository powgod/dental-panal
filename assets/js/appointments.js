const uid = localStorage.getItem("uid");
if (!uid) {
  Toast.error("User not logged in");
  window.location.href = "index.html"; // or redirect to login
}

const db = firebase.database();
const appointmentsRef = db.ref("appointments/" + uid);
const patientsRef = db.ref("patients/" + uid);

const patientNameInput = document.getElementById("patientName");
const appointmentForm = document.getElementById("appointmentForm");
const appointmentsTableBody = document.querySelector(
  "#appointmentsTable tbody"
);
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const clearFilterBtn = document.getElementById("clearFilterBtn");

let appointments = {};
let patients = {};
let editingIndex = null;

patientsRef.on("value", (snapshot) => {
  patients = snapshot.val() || {};
});

function saveAppointmentData(appointmentData) {
  if (editingIndex !== null) {
    return appointmentsRef.child(editingIndex).set(appointmentData);
  } else {
    return appointmentsRef.push(appointmentData);
  }
}

function renderAppointments(startDate = null, endDate = null) {
  appointmentsTableBody.innerHTML = "";

  const appsArray = Object.entries(appointments).map(([key, val]) => ({
    key,
    ...val,
  }));

  let filtered = appsArray;

  // Apply date range filter
  if (startDate && endDate) {
    filtered = appsArray.filter(
      (app) => app.date >= startDate && app.date <= endDate
    );
  } else if (startDate) {
    filtered = appsArray.filter((app) => app.date >= startDate);
  } else if (endDate) {
    filtered = appsArray.filter((app) => app.date <= endDate);
  }

  if (filtered.length === 0) {
    appointmentsTableBody.innerHTML = `<tr><td colspan="7">No appointments found.</td></tr>`;
    return;
  }

  // Sort by date and time
  filtered.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  filtered.forEach((app) => {
    appointmentsTableBody.innerHTML += `
        <tr>
          <td>${app.patientName}</td>
          <td>${app.date}</td>
          <td>${app.time}</td>
          <td>${app.duration} min</td>
          <td>${app.status}</td>
          <td>${app.notes || ""}</td>
          <td>
            <button onclick="editAppointment('${app.key}')">✏️</button>
            <button onclick="deleteAppointment('${app.key}')">🗑️</button>
          </td>
        </tr>
      `;
  });
}

function hasConflict(newDate, newTime, newDuration, skipKey = null) {
  const newStart = new Date(`${newDate}T${newTime}`);
  const newEnd = new Date(newStart.getTime() + newDuration * 60000);

  return Object.entries(appointments).some(([key, app]) => {
    if (key === skipKey) return false;
    if (app.date !== newDate) return false;

    const appStart = new Date(`${app.date}T${app.time}`);
    const appEnd = new Date(appStart.getTime() + app.duration * 60000);

    return newStart < appEnd && newEnd > appStart;
  });
}

appointmentForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const enteredName = patientNameInput.value.trim();
  if (!enteredName) return Toast.warning("Enter the patient's name.");

  const date = document.getElementById("appointmentDate").value;
  const time = document.getElementById("appointmentTime").value;
  const duration = parseInt(
    document.getElementById("appointmentDuration").value
  );
  const status = document.getElementById("appointmentStatus").value;
  const notes = document.getElementById("appointmentNotes").value;

  if (hasConflict(date, time, duration, editingIndex)) {
    return Toast.warning("Appointment conflicts with an existing one.");
  }

  const appointmentData = {
    patientName: enteredName,
    date,
    time,
    duration,
    status,
    notes,
  };

  saveAppointmentData(appointmentData)
    .then(() => {
      Toast.success(
        editingIndex ? "Appointment updated." : "Appointment added."
      );
      appointmentForm.reset();
      editingIndex = null;
      appointmentForm.querySelector("button").textContent = "Add Appointment";
    })
    .catch((err) => {
      Toast.error("Error saving appointment: " + err.message);
    });
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

window.editAppointment = function (key) {
  editingIndex = key;
  const app = appointments[key];
  if (!app) return Toast.error("Appointment data not found.");

  patientNameInput.value = app.patientName;
  document.getElementById("appointmentDate").value = app.date;
  document.getElementById("appointmentTime").value = app.time;
  document.getElementById("appointmentDuration").value = app.duration;
  document.getElementById("appointmentStatus").value = app.status;
  document.getElementById("appointmentNotes").value = app.notes || "";
  appointmentForm.querySelector("button").textContent = "Update Appointment";
};

window.deleteAppointment = function (key) {
  if (confirm("Delete this appointment?")) {
    appointmentsRef.child(key).remove();
  }
};

appointmentsRef.on("value", (snapshot) => {
  appointments = snapshot.val() || {};
  applyDateFilter();
});

// Date range filter event listeners
function applyDateFilter() {
  const startDate = startDateInput.value || null;
  const endDate = endDateInput.value || null;
  renderAppointments(startDate, endDate);
}

startDateInput.addEventListener("change", applyDateFilter);
endDateInput.addEventListener("change", applyDateFilter);

clearFilterBtn.addEventListener("click", () => {
  startDateInput.value = "";
  endDateInput.value = "";
  renderAppointments();
});

// Initial render
renderAppointments();
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const uid = user.uid;
    localStorage.setItem("uid", uid); // optional
    const db = firebase.database();
    const patientRef = db.ref("appointments/" + uid);

    // ⬇️ Put all your app logic here (form, events, listeners, etc.)
  } else {
    // Not logged in → redirect
    window.location.href = "index.html";
  }
});
