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
  // Handle form submission
const profileForm = document.getElementById("profileForm");

profileForm.addEventListener("submit", function (e) {

  e.preventDefault();

  const profileData = {
    name: document.getElementById("profileName").value.trim(),
    phone: document.getElementById("profilePhone").value.trim(),
    specialization: document.getElementById("profileSpecialization").value.trim(),
    clinic: document.getElementById("profileClinic").value.trim()
  };

  profileRef
    .update(profileData)
    .then(() => {

      return profileRef.child("setup").update({
        profile: true
      });

    })
    .then(() => {
      console.log(localStorage.getItem("setupRedirect"));
      const successMsg = document.getElementById("successMessage");
      successMsg.classList.remove("hidden");

      setTimeout(() => {

        if (localStorage.getItem("setupRedirect") === "profile") {

          localStorage.removeItem("setupRedirect");
          window.location.href = "dashboard.html";

        } else {

          successMsg.classList.add("hidden");

        }

      }, 1200);

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
