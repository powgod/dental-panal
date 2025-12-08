document.addEventListener("DOMContentLoaded", () => {
  const uid = localStorage.getItem("uid");
  if (!uid) {
    Toast.error("User not logged in");
    window.location.href = "index.html";
    return;
  }

  const db = firebase.database();
  const storage = firebase.storage();
  const medicalRef = db.ref("medicalHistory/" + uid);
  const detailsForm = document.getElementById("detailsForm");

  let patientImages = []; // Store image URLs

  // Expand/collapse sections
  document.querySelectorAll(".section h2").forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      content.style.display =
        content.style.display === "block" ? "none" : "block";
    });
  });

  // Check if editing an existing patient
  const selectedKey = localStorage.getItem("selectedPatientKey");

  if (selectedKey) {
    // Load patient data from Firebase
    medicalRef
      .child(selectedKey)
      .once("value")
      .then((snapshot) => {
        const patient = snapshot.val();
        if (patient) {
          for (const key in patient) {
            if (key !== "images" && key !== "dateCreated") {
              const field = document.getElementById(key);
              if (field) field.value = patient[key];
            }
          }
          // Load existing images
          if (patient.images && Array.isArray(patient.images)) {
            patientImages = patient.images;
            displayImages();
          }
        }
      });
  }

  // Image upload handling
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  imageInput.addEventListener("change", async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    for (let file of files) {
      if (!file.type.startsWith("image/")) continue;

      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target.result;

          // Upload to Firebase Storage with simpler path
          const timestamp = Date.now();
          const fileName = `patient_images/${uid}_${timestamp}_${file.name}`;
          const storageRef = storage.ref(fileName);

          await storageRef.putString(base64, "data_url");
          const downloadURL = await storageRef.getDownloadURL();

          patientImages.push({
            url: downloadURL,
            fileName: fileName,
            uploadedAt: new Date().toISOString(),
          });

          displayImages();
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error uploading image:", error);
        Toast.error("Error uploading image: " + error.message);
      }
    }

    imageInput.value = ""; // Reset input
  });

  // Display images
  function displayImages() {
    imagePreview.innerHTML = "";
    patientImages.forEach((img, index) => {
      const imgDiv = document.createElement("div");
      imgDiv.className = "image-item";
      imgDiv.innerHTML = `
        <img src="${img.url}" alt="Patient image">
        <button class="delete-img" onclick="deleteImage(${index})">×</button>
      `;
      imagePreview.appendChild(imgDiv);
    });
  }

  // Delete image function
  window.deleteImage = async function (index) {
    if (!confirm("Delete this image?")) return;

    try {
      const img = patientImages[index];
      const storageRef = storage.ref(img.fileName);
      await storageRef.delete();
      patientImages.splice(index, 1);
      displayImages();
    } catch (error) {
      console.error("Error deleting image:", error);
      Toast.error("Error deleting image: " + error.message);
    }
  };

  // Handle form submission
  detailsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Collect all form data dynamically
    const patient = {};
    detailsForm.querySelectorAll("input, textarea, select").forEach((field) => {
      patient[field.id] = field.value;
    });

    patient.dateCreated = new Date().toLocaleString();
    patient.images = patientImages; // Add images array

    if (selectedKey) {
      // Update existing patient
      medicalRef
        .child(selectedKey)
        .set(patient)
        .then(() => {
          Toast.success("Patient details updated successfully!");
          localStorage.removeItem("selectedPatientKey");
          window.location.href = "medical_history.html";
        })
        .catch((err) =>
          Toast.error("Error updating patient details: " + err.message)
        );
    } else {
      // Add new patient
      console.log("Adding new patient with data:", patient);
      medicalRef
        .push(patient)
        .then(() => {
          console.log("Patient added successfully!");
          Toast.success("Patient added successfully!");
          detailsForm.reset();
          patientImages = [];
          setTimeout(() => {
            window.location.href = "medical_history.html";
          }, 1000);
        })
        .catch((err) => {
          console.error("Error saving patient:", err);
          Toast.error("Error saving patient details: " + err.message);
        });
    }
  });

  // Optional: logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("uid");
      window.location.href = "index.html";
    });
  }
});
