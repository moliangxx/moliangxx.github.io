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

  /* ========== 小猫风格-头像猫耳猫尾装饰注入 ========== */
  function initCatAvatarDecorations() {
    const avatarImg = document.querySelector('.card-widget .avatar-img');
    if (!avatarImg) return;

    const earsHtml = `
      <div class="cat-ears">
        <div class="cat-ear cat-ear-left">
          <div class="cat-ear-inner"></div>
        </div>
        <div class="cat-ear cat-ear-right">
          <div class="cat-ear-inner"></div>
        </div>
      </div>
    `;

    const tailHtml = `
      <div class="cat-tail">
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <path class="cat-tail-path" d="M5 35 Q15 20 25 25 Q30 28 35 15" />
        </svg>
      </div>
    `;

    avatarImg.innerHTML = avatarImg.innerHTML + earsHtml + tailHtml;
  }

  /* ========== 小猫风格-小老鼠逃跑点击特效（方案A - 保留备用） ========== */
  function initMouseClickEffect() {
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

    let mice = [];
    let animationId = null;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function drawMouse(ctx, x, y, size, rotation, opacity) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgba(212, 165, 116, ${opacity})`;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-size * 0.3, -size * 0.5);
      ctx.lineTo(-size * 0.2, -size * 0.7);
      ctx.moveTo(size * 0.3, -size * 0.5);
      ctx.lineTo(size * 0.2, -size * 0.7);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-size * 0.2, -size * 0.1, size * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 165, 116, ${opacity})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.2, -size * 0.1, size * 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-size * 0.5, size * 0.1);
      ctx.lineTo(-size * 0.9, size * 0.2);
      ctx.moveTo(size * 0.5, size * 0.1);
      ctx.lineTo(size * 0.9, size * 0.2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, size * 0.5);
      ctx.bezierCurveTo(size * 0.3, size * 0.7, size * 0.5, size * 0.6, size * 0.6, size * 0.3);
      ctx.stroke();

      ctx.restore();
    }

    function createMouse(x, y) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 20;

      mice.push({
        x: x,
        y: y,
        targetX: x + Math.cos(angle) * distance,
        targetY: y + Math.sin(angle) * distance,
        size: 10 + Math.random() * 4,
        rotation: angle - Math.PI / 2,
        startTime: performance.now(),
        duration: 500 + Math.random() * 200,
        bounceOffset: 0
      });
    }

    function animate() {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      mice = mice.filter(mouse => {
        const elapsed = now - mouse.startTime;
        const progress = Math.min(elapsed / mouse.duration, 1);

        mouse.bounceOffset = Math.sin(progress * Math.PI * 3) * 4;

        const eased = 1 - Math.pow(1 - progress, 3);
        const currentX = mouse.x + (mouse.targetX - mouse.x) * eased;
        const currentY = mouse.y + (mouse.targetY - mouse.y) * eased + mouse.bounceOffset;

        const opacity = 1 - progress;
        const scale = 1 - progress * 0.4;

        drawMouse(ctx, currentX, currentY, mouse.size * scale, mouse.rotation, opacity);

        return progress < 1;
      });

      if (mice.length > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        animationId = null;
      }
    }

    function handleClick(e) {
      const x = e.clientX || e.touches?.[0]?.clientX || 0;
      const y = e.clientY || e.touches?.[0]?.clientY || 0;

      if (e.target.closest('input') || e.target.closest('textarea')) return;

      createMouse(x, y);
      if (!animationId) {
        animate();
      }
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleClick, { passive: true });
  }

  /* ========== 心形点击特效（方案C - 当前启用） ========== */
  function initHeartClickEffect() {
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

    let hearts = [];
    let particles = [];
    let animationId = null;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function drawHeart(ctx, x, y, size, opacity) {
      ctx.save();
      ctx.translate(x, y);
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(0.4, `rgba(255, 182, 193, ${opacity})`);
      gradient.addColorStop(1, `rgba(212, 165, 116, ${opacity})`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.3);
      ctx.bezierCurveTo(size * 0.8, -size * 0.5, size * 1.2, size * 0.1, 0, size * 1.2);
      ctx.bezierCurveTo(-size * 1.2, size * 0.1, -size * 0.8, -size * 0.5, 0, size * 0.3);
      ctx.fill();
      
      ctx.restore();
    }

    function drawParticle(ctx, x, y, size, opacity, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function createHeart(x, y) {
      hearts.push({
        x: x,
        y: y,
        size: 15 + Math.random() * 10,
        startTime: performance.now(),
        duration: 800 + Math.random() * 400,
        velocityY: -2 - Math.random() * 3,
        velocityX: (Math.random() - 0.5) * 2,
        rotation: (Math.random() - 0.5) * 0.5
      });

      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.3;
        const speed = 2 + Math.random() * 3;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 3,
          startTime: performance.now(),
          duration: 600 + Math.random() * 200,
          color: Math.random() > 0.5 ? '#ffb6c1' : '#f5d7a8'
        });
      }
    }

    function animate() {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      hearts = hearts.filter(heart => {
        const elapsed = now - heart.startTime;
        const progress = Math.min(elapsed / heart.duration, 1);
        
        heart.x += heart.velocityX;
        heart.y += heart.velocityY;
        heart.velocityY += 0.05;

        const opacity = 1 - progress;
        const scale = 0.8 + progress * 0.4;

        drawHeart(ctx, heart.x, heart.y, heart.size * scale, opacity);

        return progress < 1;
      });

      particles = particles.filter(particle => {
        const elapsed = now - particle.startTime;
        const progress = Math.min(elapsed / particle.duration, 1);
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.03;

        const opacity = 1 - progress;

        drawParticle(ctx, particle.x, particle.y, particle.size * (1 - progress * 0.5), opacity, particle.color);

        return progress < 1;
      });

      if (hearts.length > 0 || particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        animationId = null;
      }
    }

    function handleClick(e) {
      const x = e.clientX || e.touches?.[0]?.clientX || 0;
      const y = e.clientY || e.touches?.[0]?.clientY || 0;

      if (e.target.closest('input') || e.target.closest('textarea')) return;

      createHeart(x, y);
      if (!animationId) {
        animate();
      }
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleClick, { passive: true });
  }

  /* ========== 开关配置：点击特效切换 ========== */
  /* 
     使用方案A（小老鼠逃跑）：设置 USE_HEART_EFFECT = false，取消 initMouseClickEffect 注释
     使用方案C（心形特效）：设置 USE_HEART_EFFECT = true（当前启用）
  */
  const USE_HEART_EFFECT = true;

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
    if (USE_HEART_EFFECT) {
      initHeartClickEffect();
    } else {
      initMouseClickEffect();
    }
    initCatAvatarDecorations();
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
    initCatAvatarDecorations();
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
    const STAY_DURATION = 400;
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
          <svg viewBox="0 0 120 55" xmlns="http://www.w3.org/2000/svg">
            <g class="cat-chase-mouse" transform="translate(30, 25)">
              <ellipse cx="0" cy="0" rx="8" ry="7" fill="#f5d7a8" stroke="#d4a574" stroke-width="1.5"/>
              <ellipse cx="-4" cy="-5" rx="3" ry="4" fill="#ffb6c1" stroke="#d4a574" stroke-width="1"/>
              <ellipse cx="4" cy="-5" rx="3" ry="4" fill="#ffb6c1" stroke="#d4a574" stroke-width="1"/>
              <circle cx="-3" cy="-1" r="2" fill="#333"/>
              <circle cx="3" cy="-1" r="2" fill="#333"/>
              <circle cx="-2.5" cy="-1.5" r="0.8" fill="#fff"/>
              <circle cx="3.5" cy="-1.5" r="0.8" fill="#fff"/>
              <circle cx="0" cy="2" r="1.5" fill="#ffb6c1"/>
              <line x1="-6" y1="2" x2="-10" y2="1" stroke="#d4a574" stroke-width="1"/>
              <line x1="6" y1="2" x2="10" y2="1" stroke="#d4a574" stroke-width="1"/>
              <path class="mouse-tail" d="M0 6 Q5 12 8 18 Q5 14 0 10" fill="none" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round"/>
            </g>
            <g class="cat-chase-cat" transform="translate(75, 25)">
              <ellipse cx="0" cy="0" rx="10" ry="9" fill="#f5d7a8" stroke="#d4a574" stroke-width="1.5"/>
              <ellipse cx="-5" cy="-7" rx="4" ry="5" fill="#ffb6c1" stroke="#d4a574" stroke-width="1"/>
              <ellipse cx="5" cy="-7" rx="4" ry="5" fill="#ffb6c1" stroke="#d4a574" stroke-width="1"/>
              <circle cx="-4" cy="-1" r="3" fill="#333"/>
              <circle cx="4" cy="-1" r="3" fill="#333"/>
              <circle cx="-3.5" cy="-1.8" r="1" fill="#fff"/>
              <circle cx="4.5" cy="-1.8" r="1" fill="#fff"/>
              <circle cx="0" cy="2" r="2" fill="#ffb6c1"/>
              <path d="M-2 4 Q0 6 2 4" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="-7" y1="1" x2="-12" y2="0" stroke="#d4a574" stroke-width="1"/>
              <line x1="-7" y1="3" x2="-12" y2="3" stroke="#d4a574" stroke-width="1"/>
              <line x1="7" y1="1" x2="12" y2="0" stroke="#d4a574" stroke-width="1"/>
              <line x1="7" y1="3" x2="12" y2="3" stroke="#d4a574" stroke-width="1"/>
              <path class="cat-paw-left" d="M-7 6 Q-9 8 -8 10" fill="none" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round"/>
              <path class="cat-paw-right" d="M7 6 Q9 8 8 10" fill="none" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round"/>
              <path class="cat-tail" d="M3 6 Q10 10 8 18 Q6 14 3 12" fill="none" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round"/>
            </g>
            <circle class="cat-chase-trail trail-1" cx="50" cy="28" r="2" fill="rgba(212,165,116,0.5)"/>
            <circle class="cat-chase-trail trail-2" cx="55" cy="24" r="1.5" fill="rgba(212,165,116,0.35)"/>
            <circle class="cat-chase-trail trail-3" cx="60" cy="27" r="1" fill="rgba(212,165,116,0.2)"/>
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
          loadingTextElement.innerHTML = renderTypingText('小猫正在飞奔过来~');
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