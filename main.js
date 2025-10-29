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

const stravaApiBase =
  (typeof window !== 'undefined' && window.STRAVA_API_BASE) || '';
const normalizedApiBase = stravaApiBase.replace(/\/$/, '');
const stravaAuthUrl =
  (typeof window !== 'undefined' && window.STRAVA_CONNECT_URL) ||
  (normalizedApiBase ? `${normalizedApiBase}/oauth/start` : '');

async function loadGlobe(target) {
  if (sceneControllers.has(target)) return;
  const module = await import('./globe.js');
  const controller = await module.initGlobe(target, {
    mockDataUrl: 'assets/mock-strava.json',
    refreshIntervalDays: 10,
    apiBase: normalizedApiBase,
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

const dnaOverlay = document.getElementById('dna-overlay');
if (dnaOverlay) {
  if (!webGLSupported) {
    dnaOverlay.classList.add('dna-overlay--fallback');
    dnaOverlay.textContent = 'WebGL required for helix';
  } else {
    import('./dna.js').then((module) => {
      const controller = module.initDNA(dnaOverlay, {
        reducedMotion: prefersReducedMotion.matches,
      });
      sceneControllers.set(dnaOverlay, controller);
    });
  }
}

const stravaConnectButton = document.getElementById('strava-connect');
if (stravaConnectButton) {
  if (!stravaAuthUrl) {
    stravaConnectButton.disabled = true;
    stravaConnectButton.textContent = 'Using mock Strava data';
    stravaConnectButton.setAttribute('aria-disabled', 'true');
    stravaConnectButton.title = 'Configure STRAVA_API_BASE to enable live data';
  } else {
    stravaConnectButton.addEventListener('click', () => {
      window.open(stravaAuthUrl, '_blank', 'noopener');
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
