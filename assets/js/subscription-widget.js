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
        const bar = document.getElementById("subscriptionBar");

if (sub.status === "trial") {

    const total = 14;
    const days = Math.max(0, Math.ceil((sub.trialEnd-now)/86400000));

    const percent = (days/total)*100;

    status.innerHTML="🟡 Free Trial";
    date.innerHTML=days+" day(s) remaining";

    bar.style.width=percent+"%";
    bar.style.background="#fbbf24";

    renew.style.display="inline-block";

}

else if(sub.status==="active"){

    const total=30;
    console.log(sub);
    console.log("subscriptionEnd:", sub.subscriptionEnd);
    console.log("type:", typeof sub.subscriptionEnd);
    console.log("now:", now);
    const days=Math.max(0,Math.ceil((sub.subscriptionEnd-now)/86400000));

    const percent=(days/total)*100;

    status.innerHTML="🟢 Premium";

    date.innerHTML="Expires in "+days+" day(s)";

    bar.style.width=percent+"%";
    bar.style.background="#22c55e";

}

else{

    status.innerHTML="🔴 Subscription Expired";

    date.innerHTML="Please renew your subscription.";

    bar.style.width="100%";
    bar.style.background="#ef4444";

    renew.style.display="inline-block";

}

    });

});

document.getElementById("renewBtn").onclick = function(){

    window.open(
        "https://wa.me/212682426294?text=Hello%20ClinicPanel,%20I%20would%20like%20to%20renew%20my%20subscription.",
        "_blank"
    );

};
