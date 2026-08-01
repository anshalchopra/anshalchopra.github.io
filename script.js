document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const progress = document.querySelector(".scroll-progress");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

function updateProgress() {
  if (!progress) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progress.style.width = `${percent}%`;
}

let progressFrame;
window.addEventListener("scroll", () => {
  if (progressFrame) return;
  progressFrame = window.requestAnimationFrame(() => {
    updateProgress();
    progressFrame = null;
  });
}, { passive: true });
updateProgress();

function setNavOpen(isOpen, restoreFocus = false) {
  if (!navToggle || !navLinks) return;
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.querySelector("span").textContent = isOpen ? "Close" : "Menu";
  navLinks.classList.toggle("is-open", isOpen);
  if (restoreFocus) navToggle.focus();
}

navToggle?.addEventListener("click", () => {
  setNavOpen(navToggle.getAttribute("aria-expanded") !== "true");
});

navLinks?.addEventListener("click", () => {
  setNavOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navToggle?.getAttribute("aria-expanded") === "true") setNavOpen(false, true);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 780) setNavOpen(false);
});

const reveals = [...document.querySelectorAll(".reveal")];

reveals.forEach((element, index) => {
  element.style.setProperty("--reveal-delay", `${(index % 3) * 35}ms`);
});

if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries, revealObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

  reveals.forEach((element) => observer.observe(element));
}

const contactForm = document.querySelector("[data-contact-form]");

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const note = contactForm.querySelector(".form-note");
  if (note) note.textContent = "Your message looks ready. This preview does not send yet.";
});
