const ADMIN_UID = "RA8SwytBJdX59G8BpQcgOSSNrHJ3";

firebase.auth().onAuthStateChanged(user => {

    if (!user) {

        location.href = "index.html";
        return;

    }

    if (user.uid !== ADMIN_UID) {

    alert("Access denied.");

    location.href = "dashboard.html";

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

            div.className = "admin-clinic-card";

            div.innerHTML = `
            
            <div class="admin-header">
            
                <div>
            
                    <h3>${data.clinic || "Unnamed Clinic"}</h3>
            
                    <small>${data.name || "-"}</small>
            
                </div>
            
                <span class="status-badge">
            
                    ${data.subscription?.status || "No Subscription"}
            
                </span>
            
            </div>
            
            <div class="admin-actions">
            
                <button class="primary-btn"
                    onclick="manage('${uid}')">
            
                    Manage Subscription
            
                </button>
            
            </div>
            
            `;

            container.appendChild(div);

        });

    });

}
window.manage = function(uid) {

    const days = prompt(
        "Subscription:\n\n30 = 30 Days\n90 = 90 Days\n365 = 1 Year\n\nEnter number of days:"
    );

    if (!days) return;

    const end = Date.now() + (Number(days) * 86400000);

    firebase.database()
        .ref("profiles/" + uid + "/subscription")
        .update({

            status: "active",

            subscriptionEnd: end

        })
        .then(() => {

            alert("Subscription updated successfully.");

            loadClinics();

        })
        .catch(err => {

            alert(err.message);

        });

};
