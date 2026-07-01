// assets/js/auth.js

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {

      const user = userCredential.user;

      const db = firebase.database();

      return db.ref("profiles/" + user.uid).once("value")
        .then((snapshot) => {

          const profile = snapshot.val();

          // If no profile exists
          if (!profile) {
            throw new Error("Profile not found.");
          }

          const sub = profile.subscription;

          // Trial account
          if (sub.status === "trial") {

            if (Date.now() > sub.trialEnd) {

              window.location.href = "expired.html";
              return;

            }

          }

          // Active subscription
          if (sub.status === "active") {

            if (sub.subscriptionEnd && Date.now() > sub.subscriptionEnd) {

              window.location.href = "expired.html";
              return;

            }

          }

          localStorage.setItem("loggedIn", "true");
          localStorage.setItem("uid", user.uid);

          window.location.href = "dashboard.html";

        });

    })
    .catch((error) => {

      errorMsg.textContent = "❌ " + error.message;

    });
});
