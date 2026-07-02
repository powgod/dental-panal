// Profile page logic
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    Toast.warning("Please log in first");
    window.location.href = "index.html";
    return;
  }

  const uid = user.uid;
  const db = firebase.database();
  const profileRef = db.ref("profiles/" + uid);

  // Set email (readonly)
  document.getElementById("profileEmail").value = user.email || "";

  // Set avatar initial
  const email = user.email || "";
  const initial = email.charAt(0).toUpperCase();
  document.getElementById("profileAvatar").textContent = initial;

  // Load existing profile data
  profileRef.once("value").then((snapshot) => {
    const profile = snapshot.val();
    if (profile) {
      document.getElementById("profileName").value = profile.name || "";
      document.getElementById("profilePhone").value = profile.phone || "";
      document.getElementById("profileSpecialization").value =
        profile.specialization || "";
      document.getElementById("profileClinic").value = profile.clinic || "";
    }
  });

  // Handle form submission
  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const profileData = {
      name: document.getElementById("profileName").value.trim(),
      email: user.email,
      phone: document.getElementById("profilePhone").value.trim(),
      specialization: document
        .getElementById("profileSpecialization")
        .value.trim(),
      clinic: document.getElementById("profileClinic").value.trim(),
      updatedAt: new Date().toISOString(),
    };

    profileRef
      .update(profileData)
      .then(() => {
        // Show success message
        const successMsg = document.getElementById("successMessage");
        successMsg.classList.remove("hidden");
        setTimeout(() => {
          successMsg.classList.add("hidden");
        }, 3000);
      })
      .catch((error) => {
        Toast.error("Error updating profile: " + error.message);
      });
  });

  // Logout button
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
});

// Reset form function
window.resetForm = function () {
  document.getElementById("profileForm").reset();
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      const uid = user.uid;
      const db = firebase.database();
      const profileRef = db.ref("profiles/" + uid);

      // Reload original data
      profileRef.once("value").then((snapshot) => {
        const profile = snapshot.val();
        if (profile) {
          document.getElementById("profileName").value = profile.name || "";
          document.getElementById("profilePhone").value = profile.phone || "";
          document.getElementById("profileSpecialization").value =
            profile.specialization || "";
          document.getElementById("profileClinic").value = profile.clinic || "";
        }
      });
    }
  });
};
