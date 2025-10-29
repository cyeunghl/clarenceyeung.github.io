const currentYear = document.getElementById('year');
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const smoothScrollButtons = document.querySelectorAll('[data-scroll-target]');
for (const button of smoothScrollButtons) {
  button.addEventListener('click', () => {
    const selector = button.getAttribute('data-scroll-target');
    const target = selector ? document.querySelector(selector) : null;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth' });
  });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return (
      !!window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (error) {
    return false;
  }
}

const webGLSupported = isWebGLAvailable();
const lazyContainers = document.querySelectorAll('.webgl-wrapper');
const sceneControllers = new Map();
const heroDNAContainer = document.getElementById('dna-anchor');

async function loadGlobe(target) {
  if (sceneControllers.has(target)) return;
  const module = await import('./globe.js');
  const controller = await module.initGlobe(target, {
    mockDataUrl: 'assets/mock-strava.json',
    activityEndpoint: '/api/strava/activities',
    refreshIntervalDays: 10,
  });
  sceneControllers.set(target, controller);
}

function handleVisibility(entry) {
  const { target, isIntersecting } = entry;
  if (!isIntersecting) {
    const controller = sceneControllers.get(target);
    if (controller && typeof controller.pause === 'function') {
      controller.pause();
    }
    return;
  }

  if (!webGLSupported) {
    const fallback = target.querySelector('.webgl-fallback');
    const placeholder = target.querySelector('.webgl-placeholder');
    if (fallback) fallback.hidden = false;
    if (placeholder) placeholder.style.display = 'none';
    return;
  }

  const type = target.getAttribute('data-lazy');
  const placeholder = target.querySelector('.webgl-placeholder');
  if (placeholder) {
    placeholder.style.opacity = '0';
    placeholder.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
      placeholder.style.display = 'none';
    }, 400);
  }

  if (type === 'globe') {
    loadGlobe(target);
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      handleVisibility(entry);
    }
  },
  {
    root: null,
    rootMargin: '0px',
    threshold: 0.3,
  }
);

for (const container of lazyContainers) {
  observer.observe(container);
}

if (heroDNAContainer) {
  if (!webGLSupported) {
    heroDNAContainer.setAttribute('hidden', '');
  } else {
    import('./dna.js').then((module) => {
      const controller = module.initDNA(heroDNAContainer, {
        reducedMotion: prefersReducedMotion.matches,
        baseSpeed: 0.0085,
      });
      sceneControllers.set(heroDNAContainer, controller);
    });
  }
}

const motionChangeHandler = (event) => {
  for (const controller of sceneControllers.values()) {
    if (typeof controller.setReducedMotion === 'function') {
      controller.setReducedMotion(event.matches);
    }
  }
};

if (typeof prefersReducedMotion.addEventListener === 'function') {
  prefersReducedMotion.addEventListener('change', motionChangeHandler);
} else if (typeof prefersReducedMotion.addListener === 'function') {
  prefersReducedMotion.addListener(motionChangeHandler);
}

document.addEventListener('visibilitychange', () => {
  for (const controller of sceneControllers.values()) {
    if (document.hidden && typeof controller.pause === 'function') {
      controller.pause();
    } else if (!document.hidden && typeof controller.play === 'function') {
      controller.play();
    }
  }
});

window.addEventListener('beforeunload', () => {
  for (const [container, controller] of sceneControllers.entries()) {
    if (controller && typeof controller.destroy === 'function') {
      controller.destroy();
    }
    sceneControllers.delete(container);
  }
});
