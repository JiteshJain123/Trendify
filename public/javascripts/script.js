
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
