// assets/js/auth.js
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("uid", user.uid); // ✅ store UID
      window.location.href = "dashboard.html"; // redirect after login
    })
    .catch((error) => {
      errorMsg.textContent = "❌ " + error.message;
    });
});
