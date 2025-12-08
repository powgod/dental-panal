// Toast Notification System
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
  },

  show(message, type = "info", title = "", duration = 4000) {
    this.init();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    const titles = {
      success: title || "Success",
      error: title || "Error",
      warning: title || "Warning",
      info: title || "Info",
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="Toast.close(this.parentElement)">×</button>
    `;

    this.container.appendChild(toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.close(toast);
      }, duration);
    }

    return toast;
  },

  success(message, title = "") {
    return this.show(message, "success", title);
  },

  error(message, title = "") {
    return this.show(message, "error", title);
  },

  warning(message, title = "") {
    return this.show(message, "warning", title);
  },

  info(message, title = "") {
    return this.show(message, "info", title);
  },

  close(toast) {
    toast.classList.add("hiding");
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  },
};

// Make Toast globally available
window.Toast = Toast;
