window.loadMeting = window.loadMeting || function () {};

(function () {
  'use strict';

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initStarClickEffect() {
    if (prefersReduced) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    let particles = [];
    let animationId = null;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const warmColors = [
      '#f5f0e8',
      '#f5d7a8',
      '#d4a574',
      '#ff9f7f',
      '#ffb88a',
      '#ffd966',
      '#ffe4c4'
    ];

    function drawStar(ctx, x, y, size, rotation, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.4, -size * 0.4);
      ctx.lineTo(size, 0);
      ctx.lineTo(size * 0.4, size * 0.4);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.4, size * 0.4);
      ctx.lineTo(-size, 0);
      ctx.lineTo(-size * 0.4, -size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function createParticles(x, y) {
      const centerStar = {
        x: x,
        y: y,
        size: 4,
        maxSize: 24,
        opacity: 1,
        phase: 'expand',
        rotation: Math.PI / 4,
        color: '#ffffff',
        startTime: performance.now()
      };
      particles.push(centerStar);

      const particleCount = 12 + Math.floor(Math.random() * 5);
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 4;
        const size = 2 + Math.random() * 4;

        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: size,
          opacity: 1,
          rotation: Math.PI / 4 + Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          color: warmColors[Math.floor(Math.random() * warmColors.length)],
          startTime: performance.now() + 150,
          duration: 650 + Math.random() * 150
        });
      }
    }

    function animate() {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles = particles.filter(p => {
        const elapsed = now - p.startTime;

        if (p.phase === 'expand') {
          const expandProgress = Math.min(elapsed / 150, 1);
          p.size = 4 + (p.maxSize - 4) * expandProgress;
          p.opacity = 1;

          if (expandProgress >= 1) {
            p.phase = 'shrink';
            p.startTime = now;
          }
        } else if (p.phase === 'shrink') {
          const shrinkProgress = Math.min(elapsed / 100, 1);
          p.size = p.maxSize * (1 - shrinkProgress);
          p.opacity = 1 - shrinkProgress;

          if (shrinkProgress >= 1) {
            return false;
          }
        } else {
          const progress = elapsed / p.duration;
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.rotation += p.rotationSpeed;
          p.opacity = 1 - progress;

          if (progress >= 1) {
            return false;
          }
        }

        drawStar(ctx, p.x, p.y, p.size, p.rotation, p.color);
        return true;
      });

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        animationId = null;
      }
    }

    function handleClick(e) {
      const x = e.clientX || e.touches?.[0]?.clientX || 0;
      const y = e.clientY || e.touches?.[0]?.clientY || 0;
      createParticles(x, y);
      if (!animationId) {
        animate();
      }
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleClick, { passive: true });
  }

  function initPageAnimation() {
    if (prefersReduced) return;

    const content = document.querySelector('.layout_page, .layout_post');
    if (content) {
      content.classList.add('page-enter-from');
      content.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

      requestAnimationFrame(() => {
        content.classList.remove('page-enter-from');
      });
    }
  }

  function setupPJAXAnimation() {
    if (prefersReduced || typeof window.pjax === 'undefined') return;

    window.pjax.on('send', () => {
      const content = document.querySelector('.layout_page, .layout_post');
      if (content) {
        content.classList.add('page-leave-to');
        content.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      }
    });

    window.pjax.on('complete', () => {
      const content = document.querySelector('.layout_page, .layout_post');
      if (content) {
        content.classList.add('page-enter-from');
        content.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        requestAnimationFrame(() => {
          content.classList.remove('page-enter-from', 'page-leave-to');
        });
      }
    });
  }

  function setupLive2DPJAX() {
    if (typeof window.pjax === 'undefined') return;

    window.pjax.on('send', () => {
      const live2d = document.querySelector('#live2d-widget');
      if (live2d) {
        live2d.style.visibility = 'hidden';
      }
    });

    window.pjax.on('complete', () => {
      const live2d = document.querySelector('#live2d-widget');
      if (live2d) {
        live2d.style.visibility = 'visible';
      }
    });
  }

  function setupImages() {
    const imgs = document.querySelectorAll('.article-entry img');
    imgs.forEach(img => {
      try {
        if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      } catch (e) {}
      if (img.complete) {
        img.classList.add('img-loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('img-loaded'));
      }
    });
  }

  const progressBar = document.createElement('div');
  progressBar.id = 'reading-progress';
  progressBar.style.position = 'fixed';
  progressBar.style.left = '0';
  progressBar.style.top = '0';
  progressBar.style.height = '3px';
  progressBar.style.background = 'linear-gradient(90deg, #d4a574, #f5d7a8)';
  progressBar.style.width = '0';
  progressBar.style.zIndex = '9999';
  progressBar.style.transition = 'width 120ms linear';
  document.body.appendChild(progressBar);

  function updateProgress() {
    const article = document.querySelector('.article-entry');
    if (!article) {
      progressBar.style.width = '0';
      return;
    }
    const rect = article.getBoundingClientRect();
    const total = article.scrollHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(window.scrollY - (article.offsetTop - 60), 0), total);
    const pct = total > 0 ? (scrolled / total) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  let rafId = null;
  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateProgress();
      rafId = null;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  const header = document.getElementById('header');
  function updateHeader() {
    if (!header) return;
    const threshold = 80;
    if (window.scrollY > threshold) {
      header.classList.add('sticky');
    } else {
      header.classList.remove('sticky');
    }
  }

  window.addEventListener('scroll', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateHeader();
      rafId = null;
    });
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', () => {
    initStarClickEffect();
    initPageAnimation();
    setupImages();
    updateHeader();
    updateProgress();
    setupPJAXAnimation();
    setupLive2DPJAX();
  });

  document.addEventListener('pjax:complete', () => {
    setupImages();
    updateHeader();
    updateProgress();
  });

  if (prefersReduced) {
    document.documentElement.classList.add('reduced-motion');
  }

})();