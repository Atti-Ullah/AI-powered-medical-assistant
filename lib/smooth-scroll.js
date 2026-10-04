// Eased page scrolling driven by requestAnimationFrame.
// Each frame uses behavior: "instant" so the global CSS `scroll-behavior: smooth` can't fight it.

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let activeFrame = 0;
let cancelListeners = null;

export function cancelSmoothScroll() {
  if (activeFrame) cancelAnimationFrame(activeFrame);
  activeFrame = 0;
  if (cancelListeners) {
    cancelListeners();
    cancelListeners = null;
  }
}

export function smoothScrollTo(targetY, { duration } = {}) {
  cancelSmoothScroll();

  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const to = Math.max(0, Math.min(targetY, maxY));
  const from = window.scrollY;
  const distance = to - from;
  if (Math.abs(distance) < 2) return;

  // Respect the OS reduced-motion setting
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: to, behavior: "instant" });
    return;
  }

  // Longer trips take a little longer, within sensible bounds
  const total = duration ?? Math.min(1100, Math.max(550, Math.abs(distance) * 0.45));
  const start = performance.now();

  // Any manual scroll input stops the animation so the user is never fought
  const stop = () => cancelSmoothScroll();
  const events = ["wheel", "touchstart", "keydown", "mousedown"];
  events.forEach((name) => window.addEventListener(name, stop, { passive: true, once: true }));
  cancelListeners = () => events.forEach((name) => window.removeEventListener(name, stop));

  const step = (now) => {
    const progress = Math.min(1, (now - start) / total);
    window.scrollTo({ top: from + distance * easeInOutCubic(progress), behavior: "instant" });
    if (progress < 1) {
      activeFrame = requestAnimationFrame(step);
    } else {
      activeFrame = 0;
      cancelSmoothScroll();
    }
  };
  activeFrame = requestAnimationFrame(step);
}

// Scroll so `element` sits just below the fixed navbar
export function smoothScrollToElement(element, { offset = 72, duration } = {}) {
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  smoothScrollTo(top, { duration });
}
