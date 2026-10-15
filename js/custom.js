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

  /* ========== 小猫风格-文章卡片交错入场动画 ========== */
  function initCardAnimation() {
    const cards = document.querySelectorAll('.recent-post-item');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
      let delay = 0;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, delay);
          delay += 60;
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    cards.forEach((card) => {
      observer.observe(card);
    });
  }

  /* ========== 小猫风格-阅读进度条 ========== */
  function initReadingProgress() {
    const goUpBtn = document.getElementById('go-up');
    if (!goUpBtn) return;

    let rafId = null;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      const circumference = 2 * Math.PI * 14;
      const offset = circumference - (progress / 100) * circumference;

      goUpBtn.style.setProperty('--progress-offset', `${offset}px`);
      goUpBtn.style.setProperty('--progress-percent', `${progress}%`);

      rafId = requestAnimationFrame(updateProgress);
    }

    updateProgress();

    window.addEventListener('scroll', () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateProgress);
      }
    }, { passive: true });
  }

  /* ========== 小猫风格-图片加载失败占位 ========== */
  function initImageErrorHandling() {
    const images = document.querySelectorAll('#article-container img');

    images.forEach((img) => {
      img.addEventListener('error', () => {
        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="rgba(20,20,25,0.8)" rx="8"/><circle cx="60" cy="55" r="30" fill="none" stroke="%23d4a574" stroke-width="2"/><circle cx="52" cy="50" r="4" fill="%23d4a574"/><circle cx="68" cy="50" r="4" fill="%23d4a574"/><path d="M54 62 Q60 70 66 62" fill="none" stroke="%23d4a574" stroke-width="2" stroke-linecap="round"/><path d="M60 25 L60 15" stroke="%23d4a574" stroke-width="2"/><circle cx="60" cy="12" r="3" fill="%23d4a574"/><path d="M38 42 L42 36" fill="none" stroke="%23d4a574" stroke-width="1.5"/><path d="M78 36 L82 42" fill="none" stroke="%23d4a574" stroke-width="1.5"/><text x="60" y="95" text-anchor="middle" fill="%23d4a574" font-size="12" font-family="sans-serif">图片加载失败啦</text></svg>';
      });
    });
  }

  /* ========== 小猫风格-头像猫耳猫尾装饰注入（极致精致版） ========== */
  function initCatAvatarDecorations() {
    const avatarImg = document.querySelector('.card-widget .avatar-img');
    if (!avatarImg) return;

    const earsHtml = `
      <div class="cat-ears">
        <div class="cat-ear cat-ear-left">
          <div class="cat-ear-inner"></div>
          <div class="cat-ear-fur"></div>
          <div class="cat-ear-tip"></div>
        </div>
        <div class="cat-ear cat-ear-right">
          <div class="cat-ear-inner"></div>
          <div class="cat-ear-fur"></div>
          <div class="cat-ear-tip"></div>
        </div>
      </div>
    `;

    const tailHtml = `
      <div class="cat-tail">
        <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <g class="cat-tail-group">
            <path class="cat-tail-path" d="M10 50 Q20 35 32 38 Q42 42 50 28" />
            <path class="cat-tail-inner" d="M12 48 Q22 35 34 38 Q44 41 48 30" />
            <path class="cat-tail-highlight" d="M14 46 Q24 34 36 37 Q45 40 47 32" />
            <circle class="cat-tail-fluff" cx="12" cy="48" r="4" />
            <circle class="cat-tail-fluff" cx="50" cy="28" r="5" />
            <circle class="cat-tail-fluff" cx="32" cy="38" r="3" />
          </g>
        </svg>
      </div>
    `;

    avatarImg.innerHTML = avatarImg.innerHTML + earsHtml + tailHtml;
    initCatIntermittentAnimations();
  }

  /* ========== 小猫风格-猫耳猫尾间歇性动画（模拟真实猫咪行为） ========== */
  function initCatIntermittentAnimations() {
    const earLeft = document.querySelector('.cat-ear-left');
    const earRight = document.querySelector('.cat-ear-right');
    const tailGroup = document.querySelector('.cat-tail-group');
    const avatarImg = document.querySelector('.card-widget .avatar-img');
    if (!earLeft || !earRight || !tailGroup || !avatarImg) return;

    let earAnimationTimeout = null;
    let tailAnimationTimeout = null;
    let isHovering = false;

    function triggerEarTwitch() {
      if (isHovering) return;
      
      earLeft.style.transform = 'rotate(-15deg) scale(1)';
      earRight.style.transform = 'rotate(15deg) scale(1)';
      
      setTimeout(() => {
        if (isHovering) return;
        earLeft.style.transform = 'rotate(-5deg) scale(0.98)';
        earRight.style.transform = 'rotate(5deg) scale(0.98)';
      }, 50);
      
      setTimeout(() => {
        if (isHovering) return;
        earLeft.style.transform = 'rotate(-18deg) scale(1.02)';
        earRight.style.transform = 'rotate(18deg) scale(1.02)';
      }, 120);
      
      setTimeout(() => {
        if (isHovering) return;
        earLeft.style.transform = 'rotate(-15deg) scale(1)';
        earRight.style.transform = 'rotate(15deg) scale(1)';
        
        if (!isHovering) {
          const nextDelay = 3000 + Math.random() * 5000;
          earAnimationTimeout = setTimeout(triggerEarTwitch, nextDelay);
        }
      }, 400);
    }

    function triggerTailFlick() {
      if (isHovering) return;
      
      tailGroup.style.transform = 'rotate(-8deg)';
      
      setTimeout(() => {
        if (isHovering) return;
        tailGroup.style.transform = 'rotate(12deg)';
      }, 80);
      
      setTimeout(() => {
        if (isHovering) return;
        tailGroup.style.transform = 'rotate(-15deg)';
      }, 200);
      
      setTimeout(() => {
        if (isHovering) return;
        tailGroup.style.transform = 'rotate(8deg)';
      }, 350);
      
      setTimeout(() => {
        if (isHovering) return;
        tailGroup.style.transform = 'rotate(-8deg)';
        
        if (!isHovering) {
          const nextDelay = 4000 + Math.random() * 6000;
          tailAnimationTimeout = setTimeout(triggerTailFlick, nextDelay);
        }
      }, 600);
    }

    function startAnimations() {
      if (earAnimationTimeout) clearTimeout(earAnimationTimeout);
      if (tailAnimationTimeout) clearTimeout(tailAnimationTimeout);
      earAnimationTimeout = setTimeout(triggerEarTwitch, 2000);
      tailAnimationTimeout = setTimeout(triggerTailFlick, 3500);
    }

    avatarImg.addEventListener('mouseenter', () => {
      isHovering = true;
      if (earAnimationTimeout) clearTimeout(earAnimationTimeout);
      if (tailAnimationTimeout) clearTimeout(tailAnimationTimeout);
      earLeft.style.transform = 'rotate(-8deg) scale(0.96)';
      earRight.style.transform = 'rotate(8deg) scale(0.96)';
      tailGroup.style.transform = 'rotate(-15deg)';
    });

    avatarImg.addEventListener('mouseleave', () => {
      isHovering = false;
      earLeft.style.transform = 'rotate(-15deg) scale(1)';
      earRight.style.transform = 'rotate(15deg) scale(1)';
      tailGroup.style.transform = 'rotate(-8deg)';
      setTimeout(startAnimations, 500);
    });

    startAnimations();

    document.addEventListener('pjax:complete', () => {
      if (earAnimationTimeout) clearTimeout(earAnimationTimeout);
      if (tailAnimationTimeout) clearTimeout(tailAnimationTimeout);
      setTimeout(initCatIntermittentAnimations, 100);
    });
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
     使用方案A（小老鼠逃跑）：设置 USE_STAR_EFFECT = false，取消 initMouseClickEffect 注释
     使用方案C（心形特效）：设置 USE_STAR_EFFECT = false，取消 initHeartClickEffect 注释
     使用方案B（星星碎裂）：设置 USE_STAR_EFFECT = true（当前启用）
  */
  const USE_STAR_EFFECT = true;

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
    if (USE_STAR_EFFECT) {
      initStarClickEffect();
    } else {
      initHeartClickEffect();
    }
    initCatAvatarDecorations();
    setupImages();
    updateHeader();
    updateProgress();
    setupLive2DPJAX();
    initCardAnimation();
    initReadingProgress();
    initImageErrorHandling();

    document.addEventListener('mousedown', () => {
      document.body.classList.add('cat-cursor-clicking');
    });
    document.addEventListener('mouseup', () => {
      document.body.classList.remove('cat-cursor-clicking');
    });
    document.addEventListener('mouseleave', () => {
      document.body.classList.remove('cat-cursor-clicking');
    });
  });

  document.addEventListener('pjax:complete', () => {
    setupImages();
    updateHeader();
    updateProgress();
    initCatAvatarDecorations();
    initCardAnimation();
    initReadingProgress();
    initImageErrorHandling();
  });

  if (prefersReduced) {
    document.documentElement.classList.add('reduced-motion');
  }

})();