const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");
const backToTop = document.getElementById("backToTop");
const year = document.getElementById("year");

// Keep the copyright date current across all pages.
if (year) {
  year.textContent = new Date().getFullYear();
}

// Mobile sidebar controls are shared by every page.
function closeMobileMenu() {
  if (!sidebar || !sidebarOverlay || !menuToggle) return;
  sidebar.classList.remove("open");
  sidebarOverlay.classList.add("hidden");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("hidden", !isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  });
}

sidebarOverlay?.addEventListener("click", closeMobileMenu);

// The hero carousel only exists on the home page, so it safely no-ops elsewhere.
const slides = [...document.querySelectorAll("[data-slide]")];
const slideDots = [...document.querySelectorAll("[data-slide-control]")];
let activeSlide = 0;

function showSlide(index) {
  if (!slides.length) return;
  activeSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === activeSlide));
  slideDots.forEach((dot, dotIndex) => {
    dot.className = dotIndex === activeSlide
      ? "slide-dot h-2.5 w-8 rounded-full bg-white"
      : "slide-dot h-2.5 w-2.5 rounded-full bg-white/55";
  });
}

slideDots.forEach((dot) => {
  dot.addEventListener("click", () => showSlide(Number(dot.dataset.slideControl)));
});

if (slides.length) {
  setInterval(() => showSlide(activeSlide + 1), 5200);
}

// IntersectionObserver powers subtle fade-in sections without changing layout.
const fadeSections = [...document.querySelectorAll(".fade-section")];
const observer = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, { threshold: 0.12 })
  : null;

fadeSections.forEach((section) => observer?.observe(section));

function revealVisibleSections() {
  fadeSections.forEach((section) => {
    if (!observer || section.getBoundingClientRect().top < window.innerHeight - 40) {
      section.classList.add("visible");
    }
  });
}

revealVisibleSections();

// Back-to-top is hidden until the visitor scrolls into the page.
window.addEventListener("scroll", () => {
  if (!backToTop) return;
  backToTop.classList.toggle("hidden", window.scrollY < 520);
  backToTop.classList.toggle("flex", window.scrollY >= 520);
});

backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Project gallery lightbox is present on the Projects page.
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

document.querySelectorAll(".gallery-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const thumbnail = trigger.querySelector("img");
    lightboxImage.src = trigger.dataset.full;
    lightboxImage.alt = thumbnail.alt;
    lightbox.classList.add("open");
    lightboxClose.focus();
  });
});

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove("open");
  lightboxImage.src = "";
}

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

// Resume previews open inside an on-page PDF popup instead of navigating away.
const resumeModal = document.getElementById("resumeModal");
const resumeModalFrame = document.getElementById("resumeModalFrame");
const resumeModalTitle = document.getElementById("resumeModalTitle");
const resumeModalClose = document.getElementById("resumeModalClose");

function closeResumeModal() {
  if (!resumeModal || !resumeModalFrame) return;
  resumeModal.classList.add("hidden");
  resumeModal.classList.remove("flex");
  resumeModalFrame.src = "";
}

document.querySelectorAll(".resume-popup-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    if (!resumeModal || !resumeModalFrame || !resumeModalTitle) return;
    resumeModalTitle.textContent = trigger.dataset.title || "Resume Preview";
    resumeModalFrame.src = `${trigger.dataset.pdf}#toolbar=1&navpanes=0`;
    resumeModal.classList.remove("hidden");
    resumeModal.classList.add("flex");
    resumeModalClose?.focus();
  });
});

resumeModalClose?.addEventListener("click", closeResumeModal);
resumeModal?.addEventListener("click", (event) => {
  if (event.target === resumeModal) closeResumeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
    closeResumeModal();
    closeMobileMenu();
  }
});

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

// Contact form validation uses native constraints plus custom accessible messages.
function showFieldError(field, shouldShow) {
  const error = document.querySelector(`[data-error-for="${field.id}"]`);
  if (!error) return;
  error.classList.toggle("hidden", !shouldShow);
  field.setAttribute("aria-invalid", String(shouldShow));
}

contactForm?.addEventListener("submit", (event) => {
  const fields = [...contactForm.querySelectorAll("input, textarea")];
  let formIsValid = true;

  fields.forEach((field) => {
    const fieldIsInvalid = !field.checkValidity();
    showFieldError(field, fieldIsInvalid);
    if (fieldIsInvalid) formIsValid = false;
  });

  formStatus.classList.remove("hidden");
  if (!formIsValid) {
    formStatus.textContent = "Please review the highlighted fields before sending.";
    formStatus.classList.add("text-red-700");
    fields.find((field) => !field.checkValidity())?.focus();
    return;
  }

  formStatus.classList.remove("text-red-700");
  formStatus.textContent = "Sending your message through Formspree...";
});

contactForm?.querySelectorAll("input, textarea").forEach((field) => {
  field.addEventListener("input", () => showFieldError(field, !field.checkValidity() && field.value.length > 0));
});

// Desktop custom cursor follows the pointer and expands over interactive controls.
const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
let cursorX = 0;
let cursorY = 0;
let ringX = 0;
let ringY = 0;

window.addEventListener("mousemove", (event) => {
  if (!cursorDot) return;
  cursorX = event.clientX;
  cursorY = event.clientY;
  cursorDot.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
});

function animateCursor() {
  if (cursorRing) {
    ringX += (cursorX - ringX) * 0.18;
    ringY += (cursorY - ringY) * 0.18;
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
  }
  requestAnimationFrame(animateCursor);
}

animateCursor();

document.querySelectorAll("a, button, input, textarea").forEach((interactiveElement) => {
  interactiveElement.addEventListener("mouseenter", () => cursorRing?.classList.add("cursor-hover"));
  interactiveElement.addEventListener("mouseleave", () => cursorRing?.classList.remove("cursor-hover"));
});
