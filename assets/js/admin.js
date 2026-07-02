
const ADMIN_UID = "RA8SwytBJdX59G8BpQcgOSSNrHJ3";
let selectedClinicUID = null;
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

                       Manage

                </button>
            
            </div>
            
            `;

            container.appendChild(div);

        });

    });

}
window.manage = function(uid){

    selectedClinicUID = uid;

    firebase.database()

    .ref("profiles/"+uid)

    .once("value")

    .then(snapshot=>{

        const p = snapshot.val();

        document.getElementById("adminClinicTitle").innerHTML =
            p.clinic || "Clinic";

        document.getElementById("adminStatus").innerHTML =
            "Status : " +
            (p.subscription?.status || "None");

        document.getElementById("adminModal").style.display="flex";

    });

}
window.closeAdminModal=function(){

    document.getElementById("adminModal").style.display="none";

}
window.extendSubscription=function(days){

    const ref=firebase.database()

    .ref("profiles/"+selectedClinicUID+"/subscription");

    ref.once("value").then(snapshot=>{

        const sub=snapshot.val()||{};

        const now=Date.now();

        const start=

            sub.subscriptionEnd && sub.subscriptionEnd>now

            ? sub.subscriptionEnd

            : now;

        ref.update({

            status:"active",

            subscriptionEnd:start+(days*86400000)

        })

        .then(()=>{

            alert("Subscription updated.");

            closeAdminModal();

            loadClinics();

        });

    });

}
window.startTrial=function(){

    firebase.database()

    .ref("profiles/"+selectedClinicUID+"/subscription")

    .update({

        status:"trial",

        trialEnd:Date.now()+14*86400000

    })

    .then(()=>{

        alert("Trial started.");

        closeAdminModal();

        loadClinics();

    });

}
window.expireSubscription=function(){

    firebase.database()

    .ref("profiles/"+selectedClinicUID+"/subscription")

    .update({

        status:"expired",

        subscriptionEnd:Date.now()

    })

    .then(()=>{

        alert("Subscription expired.");

        closeAdminModal();

        loadClinics();

    });

}
