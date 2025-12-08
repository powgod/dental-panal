function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

// Mobile menu toggle functionality
document.addEventListener("DOMContentLoaded", function () {
  // Ensure Profile menu link exists in sidebar
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    const hasProfileLink = sidebar.querySelector(
      'a.menu-link[href="profile.html"]'
    );
    if (!hasProfileLink) {
      const logoutContainer = sidebar.querySelector(".logout-container");
      const profileLink = document.createElement("a");
      profileLink.href = "profile.html";
      profileLink.className = "menu-link";
      profileLink.innerHTML = `<i class="fa fa-user-circle"></i> Profile`;
      if (logoutContainer) {
        sidebar.insertBefore(profileLink, logoutContainer);
      } else {
        sidebar.appendChild(profileLink);
      }
    }
  }

  // Create mobile menu toggle button if it doesn't exist
  if (!document.querySelector(".menu-toggle")) {
    const menuToggle = document.createElement("button");
    menuToggle.className = "menu-toggle";
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    menuToggle.setAttribute("aria-label", "Toggle menu");
    document.body.appendChild(menuToggle);

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);

    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
      // Toggle sidebar on button click
      menuToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
        this.innerHTML = sidebar.classList.contains("active")
          ? '<i class="fas fa-times"></i>'
          : '<i class="fas fa-bars"></i>';
      });

      // Close sidebar when clicking overlay
      overlay.addEventListener("click", function () {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      });

      // Close sidebar when clicking on menu links
      const menuLinks = sidebar.querySelectorAll(".menu-link");
      menuLinks.forEach((link) => {
        link.addEventListener("click", function () {
          if (window.innerWidth <= 768) {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
          }
        });
      });
    }
  }

  // Insert a lightweight profile chip at the top of the page (except dashboard hero pages)
  const content = document.querySelector(".content");
  const hasDashboardHero = document.querySelector(".dashboard-hero");
  if (content && !hasDashboardHero) {
    let headerRow = content.querySelector(".page-header-row");
    if (!headerRow) {
      const firstHeading = content.querySelector("h1");
      headerRow = document.createElement("div");
      headerRow.className = "page-header-row";

      // If the H1 lives inside a <header> (with action buttons), move the whole
      // header children so we keep the existing controls together.
      const headerParent =
        firstHeading && firstHeading.parentElement?.tagName === "HEADER"
          ? firstHeading.parentElement
          : null;

      if (headerParent) {
        while (headerParent.firstChild) {
          headerRow.appendChild(headerParent.firstChild);
        }
        headerParent.remove();
      } else if (firstHeading) {
        headerRow.appendChild(firstHeading);
      } else {
        const fallback = document.createElement("h1");
        fallback.textContent = document.title || "Dashboard";
        headerRow.appendChild(fallback);
      }

      if (content.firstChild) {
        content.insertBefore(headerRow, content.firstChild);
      } else {
        content.appendChild(headerRow);
      }
    }

    if (!headerRow.querySelector("#globalProfileChip")) {
      const profileChip = document.createElement("div");
      profileChip.id = "globalProfileChip";
      profileChip.className = "profile-chip";
      profileChip.innerHTML = `
        <div class="avatar">?</div>
        <div>
          <strong>Loading...</strong>
          <div class="muted">Profile</div>
        </div>
      `;
      headerRow.appendChild(profileChip);
    }
  }

  // Collapsible toggles (data-toggle-target)
  document.body.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-toggle-target]");
    if (!toggle) return;
    const targetId = toggle.getAttribute("data-toggle-target");
    const target = document.getElementById(targetId);
    if (!target) return;
    target.classList.toggle("hidden");
  });

  // Keep uid in localStorage and hydrate profile chip
  if (typeof firebase !== "undefined" && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      if (!user) return;
      localStorage.setItem("uid", user.uid);
      const chip = document.getElementById("globalProfileChip");
      if (chip && firebase.database) {
        firebase
          .database()
          .ref("profiles/" + user.uid)
          .once("value")
          .then((snap) => {
            const profile = snap.val() || {};
            chip.querySelector(".avatar").textContent = (
              profile.name || user.email || "?"
            )
              .charAt(0)
              .toUpperCase();
            chip.querySelector("strong").textContent =
              profile.name || user.email || "Profile";
            chip.querySelector(".muted").textContent =
              profile.specialization || profile.phone || "Active";
          });
      }
    });
  }
});
