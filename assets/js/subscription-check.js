firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    firebase.database()
        .ref("profiles/" + user.uid)
        .on("value", (snapshot) => {

            const profile = snapshot.val();

            if (!profile || !profile.subscription) {

                firebase.auth().signOut().then(() => {
                    window.location.href = "expired.html";
                });

                return;
            }

            const sub = profile.subscription;
            const now = Date.now();

            // Manually expired by admin
            if (sub.status === "expired") {

                firebase.auth().signOut().then(() => {
                    window.location.href = "expired.html";
                });

                return;
            }

            // Trial expired
            if (sub.status === "trial" && now > sub.trialEnd) {

                firebase.auth().signOut().then(() => {
                    window.location.href = "expired.html";
                });

                return;
            }

            // Paid subscription expired
            if (
                sub.status === "active" &&
                sub.subscriptionEnd &&
                now > sub.subscriptionEnd
            ) {

                firebase.auth().signOut().then(() => {
                    window.location.href = "expired.html";
                });

                return;
            }

            console.log("✅ Subscription valid");

        });

});
