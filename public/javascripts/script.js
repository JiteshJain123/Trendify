
document.addEventListener("DOMContentLoaded", function () {
  const deleteLinks = document.querySelectorAll(".confirm-delete");

  deleteLinks.forEach(link => {
    link.addEventListener("click", function (event) {
      const confirmed = confirm("Are you sure you want to delete this product?");
      if (!confirmed) {
        event.preventDefault(); // Stop redirection if user clicks "Cancel"
      }
    });
  });
});

 const showLoginBtn = document.getElementById("show-login");
  const showRegisterBtn = document.getElementById("show-register");

  if (showLoginBtn && showRegisterBtn) {
    showLoginBtn.addEventListener("click", function () {
      document.getElementById("register-section").classList.add("hidden");
      document.getElementById("login-section").classList.remove("hidden");
    });

    showRegisterBtn.addEventListener("click", function () {
      document.getElementById("login-section").classList.add("hidden");
      document.getElementById("register-section").classList.remove("hidden");
    });
  }
