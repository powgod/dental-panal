document.addEventListener("DOMContentLoaded", () => {
  // Check login
  const uid = localStorage.getItem("uid");
  if (!uid) {
    Toast.error("User not logged in");
    window.location.href = "index.html";
    return;
  }

  const db = firebase.database();
  const medicalRef = db.ref("medicalHistory/" + uid);
  const historyTable = document.getElementById("medicalTable");
  const addPatientBtn = document.getElementById("addPatientBtn");

  let patients = {};

  // Redirect to patient-details page to add new patient
  addPatientBtn.addEventListener("click", () => {
    localStorage.removeItem("selectedPatientKey"); // clear any selected patient
    window.location.href = "patient-details.html";
  });

  // Listen for Firebase changes
  medicalRef.on("value", (snapshot) => {
    patients = snapshot.val() || {};
    renderPatientList();
  });

  function renderPatientList() {
    historyTable.innerHTML = "";

    for (const key in patients) {
      const patient = patients[key];
      const row = document.createElement("tr");

      // Get patient image URL
      let imageHtml = '<td style="text-align: center;">-</td>';
      if (
        patient.images &&
        patient.images.length > 0 &&
        patient.images[0].url
      ) {
        imageHtml = `<td style="text-align: center;"><img src="${patient.images[0].url}" style="width: 50px; height: 50px; border-radius: 4px; object-fit: cover;" alt="Patient"></td>`;
      }

      row.innerHTML =
        imageHtml +
        `
        <td class="patient-name" data-key="${key}" style="cursor: pointer; color: #007bff; text-decoration: underline;">${
          patient.fullName || "Unnamed Patient"
        }</td>
        <td>${patient.dateCreated || ""}</td>
        <td>
          <button class="delete-btn" data-key="${key}">🗑️ Delete</button>
        </td>
      `;

      historyTable.appendChild(row);
    }

    // Click patient name → edit
    document.querySelectorAll(".patient-name").forEach((cell) => {
      cell.addEventListener("click", () => {
        const key = cell.getAttribute("data-key");
        localStorage.setItem("selectedPatientKey", key);
        window.location.href = "patient-details.html";
      });
    });

    // Delete patient
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-key");
        const patientName = patients[key].fullName || "this patient";
        if (confirm(`Are you sure you want to delete ${patientName}?`)) {
          medicalRef
            .child(key)
            .remove()
            .then(() =>
              Toast.success(`Patient "${patientName}" deleted successfully`)
            )
            .catch((err) =>
              Toast.error("Error deleting patient: " + err.message)
            );
        }
      });
    });
  }

  // Optional: logout button if exists
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("uid");
      window.location.href = "index.html";
    });
  }
});
