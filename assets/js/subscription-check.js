firebase.auth().onAuthStateChanged((user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  firebase.database().ref("profiles/" + user.uid).once("value")
    .then((snapshot) => {

      const profile = snapshot.val();

      if (!profile || !profile.subscription) {
        firebase.auth().signOut();
        localStorage.clear();
        window.location.href = "expired.html";
        return;
      }

      const sub = profile.subscription;
      const now = Date.now();

      // Trial expired
      if (sub.status === "trial" && now > sub.trialEnd) {
        firebase.auth().signOut();
        localStorage.clear();
        window.location.href = "expired.html";
        return;
      }

      // Paid subscription expired
      if (
        sub.status === "active" &&
        sub.subscriptionEnd &&
        now > sub.subscriptionEnd
      ) {
        firebase.auth().signOut();
        localStorage.clear();
        window.location.href = "expired.html";
      }

    })
    .catch((error) => {
      console.error("Subscription check failed:", error);
    });

});
