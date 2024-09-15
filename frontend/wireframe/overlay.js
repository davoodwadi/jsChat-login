// Get the modal
const overlay = document.getElementById("overlay");

// Get the button that opens the modal
const subscribeBtn = document.getElementById("subscribeBtn");

// Get the <span> element that closes the modal
const closeBtn = document.getElementById("closeBtn");

// When the user clicks on the button, open the modal
subscribeBtn.onclick = function () {
  overlay.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
closeBtn.onclick = function () {
  overlay.style.display = "none";
};

// When the user clicks anywhere outside of the overlay content, close it
window.onclick = function (event) {
  if (event.target === overlay) {
    overlay.style.display = "none";
  }
};

// Handle subscription button clicks
const planButtons = document.querySelectorAll(".plan-subscribe");
planButtons.forEach((button) => {
  button.onclick = function () {
    const planType = this.dataset.plan;
    // Handle the subscription logic here (make an API call, etc.)
    alert(`Subscribed to ${planType} plan!`);
    overlay.style.display = "none"; // Close overlay
  };
});
