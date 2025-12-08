let uid = localStorage.getItem("uid");
let appointmentsRef;
let patientsRef;

const patientNameInput = document.getElementById("patientName");
const appointmentForm = document.getElementById("appointmentForm");
const appointmentsTableBody = document.querySelector(
  "#appointmentsTable tbody"
);
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const statusFilterInput = document.getElementById("statusFilter");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const appointmentFormCard = document.getElementById("appointmentFormCard");
const appointmentFormTitle = document.getElementById("appointmentFormTitle");
const appointmentSubmit = document.getElementById("appointmentSubmit");
const openFormBtn = document.getElementById("openAppointmentFormBtn");
const closeFormBtns = document.querySelectorAll(
  "[data-close-target='appointmentFormCard']"
);

let appointments = {};
let patients = {};
let editingIndex = null;
let calendar = null;
let fullCalendarReady = false;

function ensureFullCalendar() {
  if (window.FullCalendar) {
    fullCalendarReady = true;
    return Promise.resolve();
  }

  const sources = [
    "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/main.min.js",
    "https://unpkg.com/fullcalendar@6.1.10/main.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/6.1.10/index.global.min.js",
  ];

  const loadScript = (url) =>
    new Promise((resolve, reject) => {
      const existing = document.querySelector(
        `script[data-fc-loader="true"][src="${url}"]`
      );
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = url;
      script.setAttribute("data-fc-loader", "true");
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

  // Try sources sequentially
  return sources
    .reduce(
      (chain, url) =>
        chain.catch(() =>
          loadScript(url).then(() => {
            if (window.FullCalendar) {
              fullCalendarReady = true;
            }
          })
        ),
      Promise.reject()
    )
    .then(() => {
      if (!window.FullCalendar) {
        throw new Error("FullCalendar failed to load from all sources.");
      }
      fullCalendarReady = true;
    });
}

// Normalize legacy records that might use different field names
function normalizeAppointment(app) {
  if (!app) return null;
  const date = app.date || app.appointmentDate || "";
  const time = app.time || app.appointmentTime || "";
  const duration = Number(app.duration || app.appointmentDuration || 0);
  return {
    patientName: app.patientName || app.name || app.patient || "Patient",
    date,
    time,
    duration,
    status: app.status || "Scheduled",
    notes: app.notes || "",
  };
}

const calendarEl = document.getElementById("appointmentCalendar");

function initCalendar() {
  if (!fullCalendarReady && !window.FullCalendar) return;
  if (!calendarEl || calendar) return;
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    dayMaxEventRows: true,
    displayEventTime: true,
    displayEventEnd: true,
    eventDisplay: "block",
    eventTimeFormat: { hour: "numeric", minute: "2-digit" },
    eventDidMount: ({ event, el }) => {
      const notes = event.extendedProps?.notes || "";
      const duration = event.extendedProps?.duration
        ? `${event.extendedProps.duration} min`
        : "";
      const tooltip = [
        `Patient: ${event.title}`,
        `Status: ${event.extendedProps?.status || ""}`,
        `Date: ${event.startStr?.split("T")[0] || ""}`,
        `Time: ${event.start
          ?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || ""}`,
        duration ? `Duration: ${duration}` : "",
        notes ? `Notes: ${notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      el.setAttribute("title", tooltip);
    },
    eventClick: ({ event }) => {
      if (event.id) {
        editAppointment(event.id, true);
      }
    },
    height: "auto",
    aspectRatio: 1.55,
  });
  calendar.render();
}

function syncCalendar() {
  if (!calendar) return;
  const statusColors = {
    Scheduled: "#3498db",
    Completed: "#27ae60",
    Cancelled: "#e74c3c",
  };

  const events = Object.entries(appointments)
    .map(([key, app]) => {
      const normalized = normalizeAppointment(app);
      if (!normalized || !normalized.date || !normalized.time) return null;
      const start = `${normalized.date}T${normalized.time}`;
      const endDate = new Date(`${normalized.date}T${normalized.time}`);
      endDate.setMinutes(
        endDate.getMinutes() + Number(normalized.duration || 0)
      );
      return {
        id: key,
        title: `${normalized.patientName}`,
        start,
        end: endDate.toISOString(),
        color: statusColors[normalized.status] || "#3498db",
        extendedProps: {
          status: normalized.status,
          duration: normalized.duration,
          notes: normalized.notes,
        },
      };
    })
    .filter(Boolean);

  calendar.removeAllEvents();
  calendar.addEventSource(events);
}

function saveAppointmentData(appointmentData) {
  if (editingIndex !== null) {
    return appointmentsRef.child(editingIndex).set(appointmentData);
  } else {
    return appointmentsRef.push(appointmentData);
  }
}

function showAppointmentForm(mode = "add") {
  if (!appointmentFormCard) return;
  const isEdit = mode === "edit";
  appointmentFormCard.classList.remove("hidden");
  appointmentFormTitle.textContent = isEdit
    ? "Update Appointment"
    : "Add Appointment";
  appointmentSubmit.textContent = isEdit
    ? "Update Appointment"
    : "Add Appointment";
  if (!isEdit) {
    appointmentForm.reset();
    editingIndex = null;
  }
}

function hideAppointmentForm() {
  appointmentFormCard?.classList.add("hidden");
}

function renderAppointments(startDate = null, endDate = null, statusFilter = null) {
  appointmentsTableBody.innerHTML = "";

  const appsArray = Object.entries(appointments)
    .map(([key, val]) => {
      const normalized = normalizeAppointment(val);
      if (!normalized) return null;
      return { key, ...normalized };
    })
    .filter(Boolean);

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

  // Apply status filter
  if (statusFilter) {
    filtered = filtered.filter((app) => app.status === statusFilter);
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
    const rowClass =
      app.status === "Completed"
        ? "row-status-finished"
        : app.status === "Cancelled"
        ? "row-status-labo"
        : "";
    const statusClass =
      app.status === "Completed"
        ? "status-badge success"
        : app.status === "Cancelled"
        ? "status-badge danger"
        : "status-badge info";
    appointmentsTableBody.innerHTML += `
        <tr class="${rowClass}">
          <td>${app.patientName}</td>
          <td>${app.date}</td>
          <td>${app.time}</td>
          <td>${app.duration} min</td>
          <td><span class="${statusClass}">${app.status}</span></td>
          <td>${app.notes || ""}</td>
          <td>
            <button class="icon-btn" onclick="editAppointment('${app.key}')">✏️</button>
            <button class="icon-btn danger" onclick="deleteAppointment('${app.key}')">🗑️</button>
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
    const normalized = normalizeAppointment(app);
    if (!normalized || normalized.date !== newDate) return false;

    const appStart = new Date(`${normalized.date}T${normalized.time}`);
    const appEnd = new Date(
      appStart.getTime() + (normalized.duration || 0) * 60000
    );

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
      showAppointmentForm("add");
      hideAppointmentForm();
    })
    .catch((err) => {
      Toast.error("Error saving appointment: " + err.message);
    });
});

window.editAppointment = function (key, fromCalendar = false) {
  editingIndex = key;
  const app = normalizeAppointment(appointments[key]);
  if (!app) return Toast.error("Appointment data not found.");

  patientNameInput.value = app.patientName;
  document.getElementById("appointmentDate").value = app.date;
  document.getElementById("appointmentTime").value = app.time;
  document.getElementById("appointmentDuration").value = app.duration;
  document.getElementById("appointmentStatus").value = app.status;
  document.getElementById("appointmentNotes").value = app.notes || "";
  showAppointmentForm("edit");

  if (fromCalendar && openFormBtn) {
    openFormBtn.scrollIntoView({ behavior: "smooth" });
  }
};

window.deleteAppointment = function (key) {
  if (confirm("Delete this appointment?")) {
    appointmentsRef.child(key).remove();
  }
};

function applyDateFilter() {
  const startDate = startDateInput.value || null;
  const endDate = endDateInput.value || null;
  const statusValue = statusFilterInput ? statusFilterInput.value : null;
  renderAppointments(startDate, endDate, statusValue);
  syncCalendar();
}

startDateInput.addEventListener("change", applyDateFilter);
endDateInput.addEventListener("change", applyDateFilter);
statusFilterInput?.addEventListener("change", applyDateFilter);

clearFilterBtn.addEventListener("click", () => {
  startDateInput.value = "";
  endDateInput.value = "";
  renderAppointments();
  syncCalendar();
});

openFormBtn?.addEventListener("click", () => showAppointmentForm("add"));

closeFormBtns.forEach((btn) =>
  btn.addEventListener("click", () => hideAppointmentForm())
);

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
    Toast.error("User not logged in");
    window.location.href = "index.html";
    return;
  }

  uid = user.uid;
  localStorage.setItem("uid", uid);

  const db = firebase.database();
  patientsRef = db.ref("patients/" + uid);

  // Listen to primary and legacy appointment paths
  const appointmentPaths = ["appointments", "appointment"];
  const attachAppointmentListener = (path) => {
    db.ref(`${path}/${uid}`).on("value", (snapshot) => {
      const data = snapshot.val() || {};
      // prefer non-empty data; keep the last non-empty source
      if (Object.keys(data).length > 0 || Object.keys(appointments).length === 0) {
        appointmentsRef = db.ref(`${path}/${uid}`);
        appointments = data;
        applyDateFilter();
      }
    });
  };

  ensureFullCalendar()
    .then(() => {
      initCalendar();
    })
    .catch((err) => {
      console.error("Failed to load FullCalendar", err);
      Toast.error("Calendar failed to load.");
    });

  patientsRef.on("value", (snapshot) => {
    patients = snapshot.val() || {};
  });

  appointmentPaths.forEach(attachAppointmentListener);
});
