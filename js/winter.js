/* ============================================================
   Warm Winter · 交互与氛围脚本
   依赖：Hexo Butterfly + pjax（已启用）
   与 custom.js 共存：本文件只做增量增强，不替换原有效果
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var overlay = null;
  var overlayTimer = null;
  var overlayMaxTimer = null;
  var overlayShownAt = 0;
  var overlayActive = false;
  var overlayFading = false;
  var transitionsBound = false;
  var TRANSITION_MIN_SHOW = 560;  // 遮罩至少停留时长，保证看清文案
  var TRANSITION_OUT_MS = 620;    // 与 CSS .is-out 的 560/300ms 过渡匹配
  var TRANSITION_MAX_WAIT = 2600; // 网络异常兜底，避免一直黑屏
  var particlesStarted = false;
  var cursorStateBound = false;
  var themeClickBound = false;
  var heroScrollHandler = null;
  var revealObserver = null;
  var revealFallbackTimer = null;

  /* ---------------- 页面转场 ---------------- */
  function ensureOverlay() {
    if (prefersReduced) return null;
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'winter-transition';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="wt-inner">' +
      '  <div class="wt-flake">' +
      '    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '      <g fill="none" stroke="#ffe6c4" stroke-width="2.2" stroke-linecap="round">' +
      '        <path d="M32 4v56M8.3 18l47.4 28M8.3 46l47.4-28"/>' +
      '        <path d="M32 14l-7-6M32 14l7-6M32 50l-7 6M32 50l7 6" stroke-width="1.6"/>' +
      '        <path d="M15.5 24l-9-1.5M15.5 24l-1.5-9M48.5 40l9 1.5M48.5 40l1.5 9" stroke-width="1.6"/>' +
      '        <path d="M15.5 40l-9 1.5M15.5 40l-1.5 9M48.5 24l9-1.5M48.5 24l1.5-9" stroke-width="1.6"/>' +
      '      </g>' +
      '      <circle cx="32" cy="32" r="5" fill="rgba(242,179,109,.55)"/>' +
      '      <circle cx="32" cy="32" r="3" fill="#fffdf7"/>' +
      '    </svg>' +
      '  </div>' +
      '  <div class="wt-text">LiangMo正在迎着风雪赶来</div>' +
      '  <div class="wt-line"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function transitionIn() {
    var el = ensureOverlay();
    if (!el) return;
    // 已经在转场中：忽略重复的 send，避免同一块幕布被反复重播
    if (overlayActive) return;
    overlayActive = true;
    overlayFading = false;
    overlayShownAt = Date.now();
    clearTimeout(overlayTimer);
    clearTimeout(overlayMaxTimer);
    el.classList.remove('is-out');
    // 强制重排，保证连续跳转时幕布动画能重新开始
    void el.offsetWidth;
    el.classList.add('is-in');
    // 兜底：Pjax 卡住时也必须收尾，不能一直黑屏
    overlayMaxTimer = setTimeout(transitionOut, TRANSITION_MAX_WAIT);
  }

  function transitionOut() {
    var el = overlay;
    if (!el || !overlayActive || overlayFading) return;
    overlayFading = true;
    clearTimeout(overlayMaxTimer);
    clearTimeout(overlayTimer);
    // 关键：pjax:complete 往往在 send 后几十毫秒就来，
    // 如果立刻淡出，幕布还没画出来就退场（看起来“没有动画”）。
    // 这里保证至少停留 TRANSITION_MIN_SHOW，再开始淡出。
    var elapsed = Date.now() - overlayShownAt;
    var wait = Math.max(0, TRANSITION_MIN_SHOW - elapsed);
    overlayTimer = setTimeout(function () {
      el.classList.remove('is-in');
      el.classList.add('is-out');
      overlayTimer = setTimeout(function () {
        if (!el) return;
        el.classList.remove('is-out');
        overlayActive = false;
        overlayFading = false;
      }, TRANSITION_OUT_MS);
    }, wait);
  }

  function bindTransitions() {
    if (prefersReduced || transitionsBound) return;
    transitionsBound = true;

    // 预建幕布：第一次点击时不用等节点创建，遮罩可以立刻出现
    ensureOverlay();

    document.addEventListener('pjax:send', transitionIn);

    document.addEventListener('pjax:complete', function () {
      if (!overlayActive) return;
      transitionOut();
    });

    document.addEventListener('pjax:error', function () {
      if (!overlayActive) return;
      transitionOut();
    });
  }

  /* ---------------- 自动粒子雪景 ---------------- */
  function initParticles() {
    if (prefersReduced || particlesStarted) return;
    if (!document.body) return;
    particlesStarted = true;

    var canvas = document.createElement('canvas');
    canvas.id = 'winter-particles';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var w = 0;
    var h = 0;
    var flakes = [];
    var embers = [];
    var rafId = null;
    var pointerX = 0;
    var pointerY = 0;
    var smoothX = 0;
    var smoothY = 0;
    var time = 0;

    function sizeCanvas() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function makeFlake(depth) {
      var near = depth === 2;
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        r: near ? 1.9 + Math.random() * 1.9 : depth === 1 ? 1.2 + Math.random() * 1.2 : 0.6 + Math.random() * 0.9,
        vy: near ? 1.15 + Math.random() * 1.15 : depth === 1 ? 0.6 + Math.random() * 0.7 : 0.22 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * (near ? 0.75 : 0.4),
        swing: Math.random() * Math.PI * 2,
        swingSpeed: 0.006 + Math.random() * 0.012,
        alpha: near ? 0.35 + Math.random() * 0.45 : depth === 1 ? 0.22 + Math.random() * 0.34 : 0.12 + Math.random() * 0.2,
        depth: depth,
        star: near && Math.random() > 0.55
      };
    }

    function buildField() {
      flakes = [];
      embers = [];
      var area = w * h;
      var base = Math.min(96, Math.max(34, Math.round(area / 17000)));
      for (var i = 0; i < base; i++) flakes.push(makeFlake(0));
      for (var j = 0; j < Math.round(base * 0.55); j++) flakes.push(makeFlake(1));
      for (var k = 0; k < Math.round(base * 0.28); k++) flakes.push(makeFlake(2));

      var emberCount = w < 700 ? 6 : 14;
      for (var e = 0; e < emberCount; e++) {
        embers.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1 + Math.random() * 2.4,
          vy: -(0.08 + Math.random() * 0.22),
          vx: (Math.random() - 0.5) * 0.14,
          phase: Math.random() * Math.PI * 2,
          speed: 0.006 + Math.random() * 0.01,
          alpha: 0.25 + Math.random() * 0.35
        });
      }
    }

    function drawStarFlake(x, y, r, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 0.0004 + x);
      ctx.strokeStyle = 'rgba(255, 248, 235, ' + alpha + ')';
      ctx.lineWidth = 0.8;
      for (var i = 0; i < 3; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(-r * 1.4, 0);
        ctx.lineTo(r * 1.4, 0);
        ctx.stroke();
      }
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      time = performance.now();

      // 近景偏移，形成视差
      smoothX += (pointerX - smoothX) * 0.045;
      smoothY += (pointerY - smoothY) * 0.045;

      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.swing += f.swingSpeed;
        f.x += f.vx + Math.sin(f.swing) * (0.14 + f.depth * 0.1);
        f.y += f.vy;
        if (f.y > h + 12) {
          f.y = -12;
          f.x = Math.random() * w;
        }
        if (f.x > w + 14) f.x = -14;
        if (f.x < -14) f.x = w + 14;

        var px = f.x + smoothX * f.depth * 0.55;
        var py = f.y + smoothY * f.depth * 0.45;

        if (f.star) {
          drawStarFlake(px, py, f.r, f.alpha);
        } else {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255, 250, 240, ' + f.alpha + ')';
          ctx.arc(px, py, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (var j = 0; j < embers.length; j++) {
        var em = embers[j];
        em.phase += em.speed;
        em.y += em.vy;
        em.x += em.vx + Math.sin(em.phase) * 0.22;
        if (em.y < -16) {
          em.y = h + 16;
          em.x = Math.random() * w;
        }
        var glow = 0.5 + Math.sin(em.phase) * 0.5;
        var alpha = em.alpha * (0.5 + glow * 0.5);
        var grad = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, em.r * 7);
        grad.addColorStop(0, 'rgba(255, 214, 160, ' + alpha + ')');
        grad.addColorStop(1, 'rgba(242, 179, 109, 0)');
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(em.x, em.y, em.r * 7, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (rafId) return;
      rafId = requestAnimationFrame(draw);
    }

    function stop() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    function resize() {
      sizeCanvas();
      buildField();
    }

    sizeCanvas();
    buildField();
    start();
    requestAnimationFrame(function () {
      canvas.classList.add('is-ready');
    });

    window.addEventListener('resize', resize, { passive: true });

    if (hasFinePointer) {
      window.addEventListener('pointermove', function (e) {
        pointerX = (e.clientX / w - 0.5) * 26;
        pointerY = (e.clientY / h - 0.5) * 18;
      }, { passive: true });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });
  }

  /* ---------------- 指针光晕 ---------------- */
  function initCursorGlow() {
    if (prefersReduced || !hasFinePointer) return;

    var glow = document.createElement('div');
    glow.id = 'winter-cursor-glow';
    document.body.appendChild(glow);

    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var tx = x;
    var ty = y;
    var ticking = false;

    function loop() {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      glow.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
      if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) {
        requestAnimationFrame(loop);
      } else {
        ticking = false;
      }
    }

    function onMove(e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(loop);
      }
    }

    window.addEventListener('pointermove', function (e) {
      glow.classList.add('is-on');
      onMove(e);
    }, { passive: true });

    document.addEventListener('pointerdown', function () {
      glow.classList.add('is-press');
    });

    document.addEventListener('pointerup', function () {
      glow.classList.remove('is-press');
    });

    document.addEventListener('pointerleave', function () {
      glow.classList.remove('is-on');
    });
  }

  /* ---------------- 自定义光标状态 ---------------- */
  function initCursorState() {
    if (!hasFinePointer) return;
    document.documentElement.classList.add('winter-cursor');
    if (cursorStateBound) return;
    cursorStateBound = true;

    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest('input, textarea, select')) return;
      document.documentElement.classList.add('winter-pressing');
    });

    document.addEventListener('pointerup', function () {
      document.documentElement.classList.remove('winter-pressing');
    });

    document.addEventListener('pointercancel', function () {
      document.documentElement.classList.remove('winter-pressing');
    });
  }

  /* ---------------- 卡片 / 导航光斑跟随 ---------------- */
  function initSpotlight() {
    if (prefersReduced || !hasFinePointer) return;
    var pending = null;
    var raf = null;

    function apply() {
      raf = null;
      if (!pending) return;
      var card = pending.card;
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (pending.x - rect.left) + 'px');
      card.style.setProperty('--my', (pending.y - rect.top) + 'px');
      pending = null;
    }

    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest('.recent-post-item, .card-widget');
      if (!card) return;
      pending = { card: card, x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
  }

  /* ---------------- 磁吸控件 ---------------- */
  function initMagnetic() {
    if (prefersReduced || !hasFinePointer) return;

    function bind(el) {
      if (el.dataset.wMagnetic) return;
      el.dataset.wMagnetic = '1';
      var raf = null;
      var dx = 0;
      var dy = 0;

      function apply() {
        raf = null;
        el.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0)';
      }

      el.addEventListener('pointermove', function (e) {
        var rect = el.getBoundingClientRect();
        var relX = e.clientX - rect.left - rect.width / 2;
        var relY = e.clientY - rect.top - rect.height / 2;
        dx = Math.max(-3.5, Math.min(3.5, relX * 0.08));
        dy = Math.max(-2.5, Math.min(2.5, relY * 0.14));
        if (!raf) raf = requestAnimationFrame(apply);
      });

      el.addEventListener('pointerleave', function () {
        dx = 0;
        dy = 0;
        el.style.removeProperty('transform');
        if (!el.getAttribute('style')) el.removeAttribute('style');
      });
    }

    function bindAll() {
      document.querySelectorAll('#nav a, #pagination a, #rightside button, .winter-magnetic').forEach(bind);
    }

    bindAll();
    document.addEventListener('pjax:complete', bindAll);
  }

  /* ---------------- 空属性清理 ---------------- */
  function cleanEmptyAttrs() {
    document.querySelectorAll('#nav [class=""], #nav [style=""], #sidebar-menus [class=""], #sidebar-menus [style=""]').forEach(function (el) {
      if (!el.getAttribute('class')) el.removeAttribute('class');
      if (!el.getAttribute('style')) el.removeAttribute('style');
    });
  }

  /* ---------------- 点击水波纹 ---------------- */
  function initRipple() {
    if (prefersReduced) return;

    document.addEventListener('pointerdown', function (e) {
      var target = e.target.closest('a, button, .btn, #pagination a, .rightside-item');
      if (!target) return;
      if (e.target.closest('input, textarea, select')) return;

      var span = document.createElement('span');
      span.className = 'winter-ripple';
      var size = Math.max(76, Math.min(180, target.getBoundingClientRect().width * 1.4));
      span.style.position = 'fixed';
      span.style.left = e.clientX + 'px';
      span.style.top = e.clientY + 'px';
      span.style.width = size + 'px';
      span.style.height = size + 'px';
      document.body.appendChild(span);
      span.addEventListener('animationend', function () {
        span.remove();
      });
      setTimeout(function () {
        if (span.parentNode) span.remove();
      }, 800);
    }, { passive: true });
  }

  /* ---------------- 内容进场 ---------------- */
  function initReveal() {
    if (prefersReduced) return;

    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (revealFallbackTimer) {
      clearTimeout(revealFallbackTimer);
      revealFallbackTimer = null;
    }

    var root = document.documentElement;
    var targets = document.querySelectorAll('#article-container > *');
    if (!targets.length) return;

    try {
      root.classList.add('winter-reveal-ready');

      var observer = new IntersectionObserver(function (entries) {
        var delay = 0;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          setTimeout(function () {
            el.classList.add('is-revealed');
          }, delay);
          delay += 45;
          observer.unobserve(el);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

      revealObserver = observer;

      targets.forEach(function (el) {
        observer.observe(el);
      });

      // 兜底：图片/字体导致布局变化时也能全部显形
      revealFallbackTimer = setTimeout(function () {
        document.querySelectorAll('#article-container > *:not(.is-revealed)').forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight + 100) {
            el.classList.add('is-revealed');
          }
        });
      }, 1200);
    } catch (err) {
      root.classList.remove('winter-reveal-ready');
      targets.forEach(function (el) {
        el.classList.add('is-revealed');
      });
    }
  }

  /* ---------------- 首屏视差 ---------------- */
  function initHeroParallax() {
    if (heroScrollHandler) {
      window.removeEventListener('scroll', heroScrollHandler);
      heroScrollHandler = null;
    }
    if (prefersReduced) return;
    var header = document.getElementById('page-header');
    var info = document.getElementById('site-info');
    if (!header || !info || !header.classList.contains('full_page')) return;

    var raf = null;

    function update() {
      raf = null;
      var y = window.scrollY || window.pageYOffset;
      if (y > window.innerHeight * 1.1) return;
      info.style.transform = 'translate3d(0, ' + y * 0.16 + 'px, 0)';
      info.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.72)));
    }

    heroScrollHandler = function () {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', heroScrollHandler, { passive: true });

    update();
  }

  /* ---------------- 日间 / 夜间两套主题 ---------------- */
  function initThemeToggle() {
    var root = document.documentElement;
    var KEY = 'winter-theme';

    function apply(mode) {
      var isDay = mode === 'day';
      root.classList.toggle('winter-day', isDay);
      root.setAttribute('data-winter-theme', isDay ? 'day' : 'night');
      var btn = document.getElementById('winter-theme-toggle');
      if (btn) {
        btn.setAttribute('aria-pressed', isDay ? 'true' : 'false');
        btn.setAttribute('title', isDay ? '切换到暖冬夜' : '切换到雪日间');
      }
    }

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (err) {}
    apply(saved === 'day' ? 'day' : 'night');

    if (document.getElementById('winter-theme-toggle')) {
      bindThemeClick();
      return;
    }

    var btn = document.createElement('button');
    btn.id = 'winter-theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', '切换日间与夜间主题');
    btn.innerHTML =
      '<span class="wt-sun" aria-hidden="true">' +
      '  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '    <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '    <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
      '      <path d="M12 2.4v2.6M12 19v2.6M2.4 12h2.6M19 12h2.6M5 5l1.9 1.9M17.1 17.1L19 19M19 5l-1.9 1.9M6.9 17.1L5 19"/>' +
      '    </g>' +
      '  </svg>' +
      '</span>' +
      '<span class="wt-moon" aria-hidden="true">' +
      '  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '    <path d="M15.6 3.1a8.9 8.9 0 1 0 5.3 14.2A9.7 9.7 0 0 1 15.6 3.1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      '    <circle cx="18.4" cy="5.6" r="1" fill="currentColor"/>' +
      '    <circle cx="20.6" cy="9.2" r=".7" fill="currentColor" opacity=".7"/>' +
      '  </svg>' +
      '</span>';
    document.body.appendChild(btn);

    bindThemeClick();
  }

  /* 文档级委托：点击内层 SVG 也能命中，且 pjax 后不会重复绑定 */
  function bindThemeClick() {
    if (themeClickBound) return;
    themeClickBound = true;

    document.addEventListener('click', function (e) {
      var hit = e.target && e.target.closest ? e.target.closest('#winter-theme-toggle') : null;
      if (!hit) return;
      var root = document.documentElement;
      var next = root.classList.contains('winter-day') ? 'night' : 'day';
      root.classList.toggle('winter-day', next === 'day');
      root.setAttribute('data-winter-theme', next);
      hit.setAttribute('aria-pressed', next === 'day' ? 'true' : 'false');
      hit.setAttribute('title', next === 'day' ? '切换到暖冬夜' : '切换到雪日间');
      try { localStorage.setItem('winter-theme', next); } catch (err) {}
    }, true);
  }

  /* ---------------- 点击雪花特效（替换原星星） ---------------- */
  function initSnowClick() {
    if (prefersReduced) return;
    if (document.getElementById('winter-snowclick')) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'winter-snowclick';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var W = 0;
    var H = 0;
    var flakes = [];
    var raf = null;
    var flakeInk = '255, 250, 240';

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function drawFlake(x, y, r, alpha, rot, lw) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = 'rgba(' + flakeInk + ', ' + alpha + ')';
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      for (var i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r);
        ctx.stroke();
        if (r > 5) {
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.62);
          ctx.lineTo(r * 0.24, -r * 0.86);
          ctx.moveTo(0, -r * 0.62);
          ctx.lineTo(-r * 0.24, -r * 0.86);
          ctx.stroke();
        }
      }
      if (r > 5) {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(242, 179, 109, ' + alpha * 0.9 + ')';
        ctx.fill();
      }
      ctx.restore();
    }

    function spawn(x, y) {
      var now = performance.now();
      flakes.push({
        type: 'core',
        x: x,
        y: y,
        max: 26,
        rot: Math.random() * Math.PI,
        start: now,
        dur: 460
      });

      var count = 14;
      for (var i = 0; i < count; i++) {
        var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        var speed = 2 + Math.random() * 3.6;
        flakes.push({
          type: 'shard',
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          r: 2.4 + Math.random() * 2.6,
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.08,
          start: now + 90,
          dur: 620 + Math.random() * 260,
          alpha: 0.7 + Math.random() * 0.3
        });
      }

      if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick(now) {
      ctx.clearRect(0, 0, W, H);
      flakes = flakes.filter(function (p) {
        var t = (now - p.start) / p.dur;
        if (t < 0 || t >= 1) return t < 0;

        if (p.type === 'core') {
          var grow = t < 0.4 ? t / 0.4 : 1;
          var fade = t < 0.4 ? 0 : (t - 0.4) / 0.6;
          var radius = 6 + (p.max - 6) * grow * (1 - fade * 0.55);
          drawFlake(p.x, p.y, radius, (1 - fade) * 0.95, p.rot + t * 1.4, 1.5);
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.02;
          p.vx *= 0.982;
          p.vy *= 0.982;
          drawFlake(p.x, p.y, p.r * (1 - t * 0.4), (1 - t) * p.alpha, p.rot + t * p.spin, 1);
        }
        return true;
      });

      if (flakes.length) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    function onClick(e) {
      if (e.target.closest('input, textarea, select')) return;
      try {
        var ink = getComputedStyle(document.documentElement).getPropertyValue('--w-click-flake').trim();
        if (ink) flakeInk = ink;
      } catch (err) {}
      spawn(e.clientX, e.clientY);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('click', onClick);
  }

  /* ---------------- Pjax 后重置 ---------------- */
  function onPjaxComplete() {
    initReveal();
    initHeroParallax();
    initCursorState();
    cleanEmptyAttrs();
    var info = document.getElementById('site-info');
    if (info) info.style.transform = '';
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    if (!prefersReduced) {
      bindTransitions();
      initParticles();
    }
    initCursorState();
    initCursorGlow();
    initSpotlight();
    initMagnetic();
    cleanEmptyAttrs();
    initRipple();
    initSnowClick();
    initThemeToggle();
    initReveal();
    initHeroParallax();

    document.addEventListener('pjax:complete', onPjaxComplete);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
