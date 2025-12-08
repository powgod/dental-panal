function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

// Mobile menu toggle functionality
document.addEventListener("DOMContentLoaded", function () {
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
});
