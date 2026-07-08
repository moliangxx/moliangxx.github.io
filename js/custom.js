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

  /* ========== 页面切换过渡动画控制 ========== */
  function initReimuTransition() {
    if (prefersReduced) return;

    const TRANSITION_DURATION = 300;
    const ENTER_DURATION = 350;
    let isTransitioning = false;

    function triggerExitAnimation() {
      if (isTransitioning) return;
      isTransitioning = true;

      document.body.classList.add('reimu-transitioning');

      const contents = document.querySelectorAll('.layout_page, .layout_post, #aside_content');
      contents.forEach(el => {
        el.classList.remove('reimu-transition-enter', 'reimu-transition-enter-active');
        el.classList.add('reimu-transition-exit');
        requestAnimationFrame(() => {
          el.classList.add('reimu-transition-exit-active');
        });
      });
    }

    function triggerEnterAnimation() {
      setTimeout(() => {
        const contents = document.querySelectorAll('.layout_page, .layout_post, #aside_content');
        contents.forEach(el => {
          el.classList.remove('reimu-transition-exit', 'reimu-transition-exit-active');
          el.classList.add('reimu-transition-enter');
        });

        requestAnimationFrame(() => {
          contents.forEach(el => {
            el.classList.add('reimu-transition-enter-active');
          });

          setTimeout(() => {
            contents.forEach(el => {
              el.classList.remove('reimu-transition-enter', 'reimu-transition-enter-active');
            });
            document.body.classList.remove('reimu-transitioning');
            isTransitioning = false;
          }, ENTER_DURATION);
        });
      }, TRANSITION_DURATION);
    }

    function initFirstLoadAnimation() {
      const contents = document.querySelectorAll('.layout_page, .layout_post, #aside_content');
      contents.forEach(el => {
        el.classList.add('reimu-transition-enter');
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          contents.forEach(el => {
            el.classList.add('reimu-transition-enter-active');
          });

          setTimeout(() => {
            contents.forEach(el => {
              el.classList.remove('reimu-transition-enter', 'reimu-transition-enter-active');
            });
          }, ENTER_DURATION);
        });
      });
    }

    document.addEventListener('pjax:send', () => {
      triggerExitAnimation();
    });

    document.addEventListener('pjax:complete', () => {
      triggerEnterAnimation();
    });

    document.addEventListener('DOMContentLoaded', () => {
      initFirstLoadAnimation();
    });
  }

  initReimuTransition();

  /* ========== 舞台幕布转场控制逻辑（最终优化版） ========== */
  function initStageCurtainTransition() {
    if (prefersReduced) return;

    const CURTAIN_DURATION = 350;
    const LOADER_FADE_DURATION = 200;
    const STAY_DURATION = 200;
    const TIMEOUT_MAX = 8000;
    let isTransitioning = false;
    let timeoutIds = [];
    let pjaxCompleted = false;
    let transitionStartTime = 0;

    function clearAllTimeouts() {
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds = [];
    }

    function createCurtainElements() {
      const container = document.createElement('div');
      container.id = 'stage-curtain';

      const leftCurtain = document.createElement('div');
      leftCurtain.className = 'stage-curtain-left';

      const rightCurtain = document.createElement('div');
      rightCurtain.className = 'stage-curtain-right';

      container.appendChild(leftCurtain);
      container.appendChild(rightCurtain);
      document.body.appendChild(container);

      return container;
    }

    function createLoaderElement() {
      const loader = document.createElement('div');
      loader.id = 'stage-loader';
      loader.innerHTML = `
        <div class="stage-loader-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g class="stage-loader-ring">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,215,180,0.3)" stroke-width="2.5"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,215,180,0.85)" stroke-width="2.5" stroke-dasharray="50 170" stroke-linecap="round" transform="rotate(-90 50 50)"/>
            </g>
            <g class="stage-loader-inner">
              <polygon points="50,15 53,30 68,30 57,40 62,55 50,45 38,55 43,40 32,30 47,30" fill="#ffd700"/>
              <polygon points="50,20 52,28 62,28 54,35 57,48 50,41 43,48 46,35 38,28 48,28" fill="#fffacd"/>
              <circle cx="35" cy="25" r="3" fill="#ffb6c1" opacity="0.6"/>
              <circle cx="65" cy="35" r="2.5" fill="#dda0dd" opacity="0.6"/>
              <circle cx="40" cy="60" r="2" fill="#ffd700" opacity="0.5"/>
              <circle cx="60" cy="20" r="2" fill="#ffb6c1" opacity="0.5"/>
              <circle cx="70" cy="50" r="2" fill="#fff" opacity="0.4"/>
            </g>
          </svg>
        </div>
        <div class="stage-loader-text" id="stage-loading-text">
          <span class="loading-cursor"></span>
        </div>
      `;
      document.body.appendChild(loader);
      return loader;
    }

    function renderTypingText(text) {
      let html = '';
      for (let i = 0; i < text.length; i++) {
        html += `<span class="typing-char" style="animation-delay: ${i * 0.08}s">${text[i]}</span>`;
      }
      html += '<span class="loading-cursor"></span>';
      return html;
    }

    let curtainContainer = null;
    let loaderElement = null;
    let loadingTextElement = null;

    function initElements() {
      if (!curtainContainer) {
        curtainContainer = createCurtainElements();
      }
      if (!loaderElement) {
        loaderElement = createLoaderElement();
      }
      if (!loadingTextElement) {
        loadingTextElement = document.getElementById('stage-loading-text');
      }
    }

    function cleanupElements() {
      if (loaderElement) {
        loaderElement.classList.remove('visible', 'hidden');
      }
      if (loadingTextElement) {
        loadingTextElement.classList.remove('visible', 'typing');
        loadingTextElement.innerHTML = '<span class="loading-cursor"></span>';
      }
    }

    function resetState() {
      clearAllTimeouts();
      pjaxCompleted = false;
      isTransitioning = false;
      transitionStartTime = 0;

      if (curtainContainer) {
        curtainContainer.classList.remove('closing', 'opening');
        curtainContainer.classList.add('finished');
        setTimeout(() => {
          curtainContainer.classList.remove('finished');
        }, 400);
      }

      cleanupElements();
    }

    function startOpeningSequence() {
      if (!isTransitioning) return;

      if (loaderElement) {
        loaderElement.classList.remove('visible');
        loaderElement.classList.add('hidden');
      }

      if (loadingTextElement) {
        loadingTextElement.classList.remove('visible', 'typing');
      }

      setTimeout(() => {
        if (!curtainContainer) return;
        curtainContainer.classList.remove('closing');
        curtainContainer.classList.add('opening');

        setTimeout(() => {
          resetState();
        }, CURTAIN_DURATION);
      }, LOADER_FADE_DURATION);
    }

    function startClosingSequence() {
      if (!curtainContainer) return;
      curtainContainer.classList.remove('finished');
      curtainContainer.classList.add('closing');

      setTimeout(() => {
        if (!isTransitioning) return;

        if (loaderElement) {
          loaderElement.classList.add('visible');
          loaderElement.classList.remove('hidden');
        }

        if (loadingTextElement) {
          loadingTextElement.innerHTML = renderTypingText('正在前往下一页 ✨');
          loadingTextElement.classList.add('visible', 'typing');
        }
      }, CURTAIN_DURATION / 2);

      timeoutIds.push(setTimeout(() => {
        if (pjaxCompleted && isTransitioning) {
          startOpeningSequence();
        }
      }, CURTAIN_DURATION + STAY_DURATION));

      timeoutIds.push(setTimeout(() => {
        if (isTransitioning) {
          startOpeningSequence();
        }
      }, TIMEOUT_MAX));
    }

    function handlePjaxSend() {
      if (isTransitioning) {
        resetState();
      }

      initElements();
      isTransitioning = true;
      pjaxCompleted = false;
      transitionStartTime = Date.now();

      startClosingSequence();
    }

    function handlePjaxComplete() {
      if (!isTransitioning) return;

      pjaxCompleted = true;

      const elapsed = Date.now() - transitionStartTime;
      const remaining = Math.max(0, CURTAIN_DURATION + STAY_DURATION - elapsed);

      if (remaining <= 0) {
        startOpeningSequence();
      }
    }

    function handlePjaxError() {
      if (!isTransitioning) return;

      pjaxCompleted = true;
      startOpeningSequence();
    }

    document.addEventListener('pjax:send', handlePjaxSend);
    document.addEventListener('pjax:complete', handlePjaxComplete);
    document.addEventListener('pjax:error', handlePjaxError);
  }

  initStageCurtainTransition();

})();