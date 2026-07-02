const ADMIN_UID = "Ixttf55E47Zl9n6ggRMYUBkqYT62";

firebase.auth().onAuthStateChanged(user => {

    if (!user) {

        location.href = "index.html";
        return;

    }

    console.log("Current UID:", user.uid);
console.log("Admin UID:", ADMIN_UID);

if (user.uid !== ADMIN_UID) {

    alert(
        "Access denied\n\nCurrent:\n" +
        user.uid +
        "\n\nAdmin:\n" +
        ADMIN_UID
    );

    return;

}

    loadClinics();

});

function loadClinics(){

    firebase.database().ref("profiles").once("value")

    .then(snapshot=>{

        const profiles=snapshot.val() || {};

        const container=document.getElementById("clinicList");

        container.innerHTML="";

        Object.entries(profiles).forEach(([uid,data])=>{

            const div=document.createElement("div");

            div.innerHTML=`

                <hr>

                <b>${data.clinicName || "No Clinic Name"}</b><br>

                Doctor : ${data.name || "-"}<br>

                Status : ${data.subscription?.status || "-"}<br>

                <button onclick="manage('${uid}')">

                    Manage

                </button>

            `;

            container.appendChild(div);

        });

    });

}
