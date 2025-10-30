document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('#interactive');

  if (hero && header) {
    const observer = new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-elevated', !entry.isIntersecting);
    }, { threshold: 0.1 });

    observer.observe(hero);
  }

  if (canvas) {
    const canvasObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          canvas.style.opacity = '1';
          canvas.style.pointerEvents = 'auto';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    canvasObserver.observe(canvas);
  }

  const animatedElements = document.querySelectorAll('.project-card, .post-card, .section h2');
  if (animatedElements.length) {
    const fadeObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -10%' });

    animatedElements.forEach(el => {
      el.classList.add('fade-in');
      fadeObserver.observe(el);
    });
  }
});
