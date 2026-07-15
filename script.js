document.documentElement.classList.add("js");

const currentYear = document.querySelector("#current-year");

currentYear.textContent = new Date().getFullYear();

const carousel = document.querySelector(".hero-carousel");
const slides = [...carousel.querySelectorAll(".hero-slide")];
const previousButton = carousel.querySelector('[data-carousel="previous"]');
const pauseButton = carousel.querySelector('[data-carousel="pause"]');
const currentSlideLabel = carousel.querySelector("[data-carousel-current]");
const progressBar = carousel.querySelector(".carousel-progress span");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeSlide = 0;
let rotationTimer;
let isPaused = prefersReducedMotion.matches;

function showSlide(index) {
  activeSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeSlide;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  currentSlideLabel.textContent = String(activeSlide + 1).padStart(2, "0");
  progressBar.style.width = `${((activeSlide + 1) / slides.length) * 100}%`;
}

function stopRotation() {
  window.clearInterval(rotationTimer);
}

function startRotation() {
  stopRotation();

  if (!isPaused) {
    rotationTimer = window.setInterval(() => showSlide(activeSlide + 1), 6500);
  }
}

function setPaused(paused) {
  isPaused = paused;
  pauseButton.textContent = paused ? "Play" : "Pause";
  pauseButton.setAttribute(
    "aria-label",
    paused ? "Start automatic rotation" : "Pause automatic rotation"
  );
  startRotation();
}

previousButton.addEventListener("click", () => {
  showSlide(activeSlide - 1);
  startRotation();
});

pauseButton.addEventListener("click", () => setPaused(!isPaused));

carousel.addEventListener("mouseenter", stopRotation);
carousel.addEventListener("mouseleave", startRotation);
carousel.addEventListener("focusin", stopRotation);
carousel.addEventListener("focusout", startRotation);
carousel.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    showSlide(activeSlide - 1);
  }

  if (event.key === "ArrowRight") {
    showSlide(activeSlide + 1);
  }
});

prefersReducedMotion.addEventListener("change", (event) => setPaused(event.matches));
setPaused(isPaused);

const revealSections = [...document.querySelectorAll(".reveal-section")];

if (prefersReducedMotion.matches) {
  revealSections.forEach((section) => section.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealSections.forEach((section) => revealObserver.observe(section));
}

const navLinks = [...document.querySelectorAll(".nav-links a")];
const navigationTargets = [
  { element: document.querySelector(".hero-carousel"), id: "home" },
  { element: document.querySelector("#work"), id: "work" },
  { element: document.querySelector("#blogs"), id: "blogs" },
  { element: document.querySelector("#contact"), id: "contact" }
];

function setActiveNavigation(id) {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

const navigationObserver = new IntersectionObserver(
  (entries) => {
    const visibleEntry = entries.find((entry) => entry.isIntersecting);

    if (visibleEntry) {
      const target = navigationTargets.find(({ element }) => element === visibleEntry.target);
      setActiveNavigation(target.id);
    }
  },
  { rootMargin: "-30% 0px -55%", threshold: 0 }
);

navigationTargets.forEach(({ element }) => navigationObserver.observe(element));
setActiveNavigation("home");

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href").slice(1);
    const target = navigationTargets.find((item) => item.id === id)?.element;

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: "start"
    });
    window.history.replaceState(null, "", `#${id}`);
    setActiveNavigation(id);

    target.classList.remove("section-arrival");
    window.requestAnimationFrame(() => target.classList.add("section-arrival"));
    window.setTimeout(() => target.classList.remove("section-arrival"), 600);
  });
});
