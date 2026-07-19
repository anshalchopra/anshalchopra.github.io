document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const siteHeader = document.querySelector(".site-header");
const scrollProgress = document.querySelector("#scroll-progress");
const currentYear = document.querySelector("#current-year");

window.requestAnimationFrame(() => {
  document.documentElement.classList.add("page-ready");
});

function updateScrollUI() {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 40);

  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;

  if (scrollProgress) {
    scrollProgress.style.width = `${progress}%`;
  }
}

window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const carousel = document.querySelector(".hero-carousel");

if (carousel) {
  const slides = [...carousel.querySelectorAll(".hero-slide")];
  const previousButton = carousel.querySelector('[data-carousel="previous"]');
  const nextButton = carousel.querySelector('[data-carousel="next"]');
  const pauseButton = carousel.querySelector('[data-carousel="pause"]');
  const currentSlideLabel = carousel.querySelector("[data-carousel-current]");
  const carouselPagination = carousel.querySelector(".carousel-pagination");
  const progressBar = carousel.querySelector(".carousel-progress span");

  let activeSlide = 0;
  let rotationTimer;
  let announcementTimer;
  let isInteracting = false;
  let isPaused = prefersReducedMotion.matches;

  function showSlide(index, announce = false) {
    activeSlide = (index + slides.length) % slides.length;

    if (announce) {
      window.clearTimeout(announcementTimer);
      carouselPagination?.setAttribute("aria-live", "polite");
    }

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeSlide;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    if (currentSlideLabel) {
      currentSlideLabel.textContent = String(activeSlide + 1).padStart(2, "0");
    }

    if (progressBar) {
      progressBar.style.width = `${((activeSlide + 1) / slides.length) * 100}%`;
    }

    if (announce && !isPaused) {
      announcementTimer = window.setTimeout(() => {
        carouselPagination?.setAttribute("aria-live", "off");
      }, 1200);
    }
  }

  function stopRotation() {
    window.clearInterval(rotationTimer);
  }

  function startRotation() {
    stopRotation();

    if (!isPaused && !isInteracting && !document.hidden) {
      rotationTimer = window.setInterval(() => showSlide(activeSlide + 1), 6500);
    }
  }

  function setPaused(paused) {
    isPaused = paused;
    carouselPagination?.setAttribute("aria-live", paused ? "polite" : "off");

    if (pauseButton) {
      pauseButton.textContent = paused ? "Play" : "Pause";
      pauseButton.setAttribute(
        "aria-label",
        paused ? "Start automatic rotation" : "Pause automatic rotation"
      );
    }

    startRotation();
  }

  previousButton?.addEventListener("click", () => {
    showSlide(activeSlide - 1, true);
    startRotation();
  });

  nextButton?.addEventListener("click", () => {
    showSlide(activeSlide + 1, true);
    startRotation();
  });

  pauseButton?.addEventListener("click", () => setPaused(!isPaused));

  carousel.addEventListener("mouseenter", () => {
    isInteracting = true;
    stopRotation();
  });

  carousel.addEventListener("mouseleave", () => {
    isInteracting = false;
    startRotation();
  });

  carousel.addEventListener("focusin", () => {
    isInteracting = true;
    stopRotation();
  });

  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      isInteracting = false;
      startRotation();
    }
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(activeSlide - 1, true);
      startRotation();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(activeSlide + 1, true);
      startRotation();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopRotation();
    } else {
      startRotation();
    }
  });

  prefersReducedMotion.addEventListener("change", (event) => setPaused(event.matches));
  showSlide(0);
  setPaused(isPaused);
}

const revealSections = [...document.querySelectorAll(".reveal-section")];

if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
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
    { threshold: 0.1 }
  );

  revealSections.forEach((section) => revealObserver.observe(section));
}

const navLinks = [...document.querySelectorAll(".nav-links a")];
const navigationTargets = ["home", "about", "work", "blogs", "contact"]
  .map((id) => ({ id, element: document.getElementById(id) }))
  .filter(({ element }) => element);

function setActiveNavigation(id) {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

if ("IntersectionObserver" in window) {
  const navigationObserver = new IntersectionObserver(
    () => {
      const visibleTarget = navigationTargets
        .filter(({ element }) => {
          const rect = element.getBoundingClientRect();
          return rect.bottom > window.innerHeight * 0.24 && rect.top < window.innerHeight * 0.68;
        })
        .sort((a, b) => {
          const aDistance = Math.abs(a.element.getBoundingClientRect().top - window.innerHeight * 0.28);
          const bDistance = Math.abs(b.element.getBoundingClientRect().top - window.innerHeight * 0.28);
          return aDistance - bDistance;
        })[0];

      if (visibleTarget) {
        setActiveNavigation(visibleTarget.id);
      }
    },
    { rootMargin: "-28% 0px -56%", threshold: 0 }
  );

  navigationTargets.forEach(({ element }) => navigationObserver.observe(element));
}

setActiveNavigation("home");

const internalNavigationLinks = [
  ...document.querySelectorAll('a[href^="#"]:not(.skip-link)')
];

internalNavigationLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);

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
    window.setTimeout(() => target.classList.remove("section-arrival"), 700);
  });
});
