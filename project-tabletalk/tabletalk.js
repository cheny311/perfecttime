// tableTalk slider: inline preview + lightbox with arrows
document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".radio-slider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".slide"));
  if (!slides.length) return;

  const prevBtn = slider.querySelector(".slider-arrow.prev");
  const nextBtn = slider.querySelector(".slider-arrow.next");

  const lightbox = document.getElementById("recipe-lightbox");
  const lbImg = lightbox?.querySelector(".lightbox-image");
  const lbPrev = lightbox?.querySelector(".lightbox-arrow.prev");
  const lbNext = lightbox?.querySelector(".lightbox-arrow.next");
  const lbClose = lightbox?.querySelector(".lightbox-close");
  const lbBackdrop = lightbox?.querySelector(".lightbox-backdrop");

  let index = Number(slider.dataset.start || 0);
  index = Math.max(0, Math.min(index, slides.length - 1));

  function showInline(i) {
    slides.forEach((el, idx) => el.classList.toggle("active", idx === i));
  }

  function showLightbox(i) {
    if (!lbImg) return;
    lbImg.src = slides[i].getAttribute("src");
    lbImg.alt = slides[i].getAttribute("alt") || "";
  }

  function openLightbox(i) {
    if (!lightbox) return;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    showLightbox(i);
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
  }

  function prev() {
    index = (index - 1 + slides.length) % slides.length;
    showInline(index);
    if (lightbox?.classList.contains("open")) {
      showLightbox(index);
    }
  }

  function next() {
    index = (index + 1) % slides.length;
    showInline(index);
    if (lightbox?.classList.contains("open")) {
      showLightbox(index);
    }
  }

  // init inline
  slider.classList.add("js-ready");
  showInline(index);

  // inline controls
  prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    prev();
  });
  
  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    next();
  });

  // open lightbox on slide click
  slides.forEach(slide => {
    slide.addEventListener("click", () => openLightbox(index));
  });

  // lightbox controls
  lbPrev?.addEventListener("click", prev);
  lbNext?.addEventListener("click", next);
  lbClose?.addEventListener("click", closeLightbox);
  lbBackdrop?.addEventListener("click", closeLightbox);
  
  window.addEventListener("keydown", (e) => {
    if (!lightbox?.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });
});