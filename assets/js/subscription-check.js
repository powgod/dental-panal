firebase.auth().onAuthStateChanged((user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

firebase.database().ref("profiles/" + user.uid).on("value", (snapshot) => { 

      const profile = snapshot.val();

      if (!profile || !profile.subscription) {
        window.location.href = "expired.html";
        return;
      }

      const sub = profile.subscription;
      const now = Date.now();

      // Trial expired
      if (sub.status === "trial" && now > sub.trialEnd) {
        window.location.href = "expired.html";
        return;
      }

      // Paid subscription expired
      if (
        sub.status === "active" &&
        sub.subscriptionEnd &&
        now > sub.subscriptionEnd
      ) {
        window.location.href = "expired.html";
        return;
      }

      console.log("✅ Subscription valid");

    })
    .catch((error) => {
      console.error("Subscription check failed:", error);
    });

});
