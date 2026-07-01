firebase.auth().onAuthStateChanged((user) => {

    if (!user) return;

    firebase.database().ref("profiles/" + user.uid).once("value")
    .then(snapshot => {

        const profile = snapshot.val();

        if (!profile || !profile.subscription) return;

        const sub = profile.subscription;

        const now = Date.now();

        const status = document.getElementById("subscriptionStatus");
        const date = document.getElementById("subscriptionDate");
        const renew = document.getElementById("renewBtn");

        if (sub.status === "trial") {

            const days = Math.max(0,
                Math.ceil((sub.trialEnd - now) / 86400000)
            );

            status.innerHTML = "🟡 Free Trial";
            date.innerHTML = days + " day(s) remaining";

            renew.style.display = "inline-block";

        }

        else if (sub.status === "active") {

            const days = Math.max(0,
                Math.ceil((sub.subscriptionEnd - now) / 86400000)
            );

            status.innerHTML = "🟢 Premium";
            date.innerHTML = "Expires in " + days + " day(s)";

        }

        else {

            status.innerHTML = "🔴 Subscription Expired";
            date.innerHTML = "Renew to continue using ClinicPanel";

            renew.style.display = "inline-block";

        }

    });

});

document.getElementById("renewBtn").onclick = function(){

    window.open(
        "https://wa.me/212682426294?text=Hello%20ClinicPanel,%20I%20would%20like%20to%20renew%20my%20subscription.",
        "_blank"
    );

};
