document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".carousel-track");
  const items = Array.from(track.children);
  const nextButton = document.querySelector(".carousel-next");
  const prevButton = document.querySelector(".carousel-prev");

  let currentIndex = 0;

  const updateCarousel = () => {
    const offset = -currentIndex * 100;
    track.style.transform = `translateX(${offset}%)`;
  };

  nextButton.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % items.length;
    updateCarousel();
  });

  prevButton.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateCarousel();
  });
});
