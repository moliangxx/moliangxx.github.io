/* ============================================================
   Warm Winter · 悬浮音乐播放器
   内核：APlayer 1.10.1（由 _config.butterfly.yml 的 inject 引入）
   歌单：Meting API（网易云公开接口，返回 name/artist/url/pic）
   本文件只负责容器、拖动、折叠与懒加载，不实现播放内核。
   容器挂在 body 下（不在 #body-wrap 内），pjax 切页不会替换它，
   因此播放可以跨页面继续。
   ============================================================ */
(function () {
  'use strict';

  var PLAYLIST_API = 'https://api.injahow.cn/meting/?server=netease&type=playlist&id=3778678';
  var POS_KEY = 'wmp-pos';
  var FOLD_KEY = 'wmp-folded';
  var MAX_TRACKS = 80;

  var root = null;
  var aplayer = null;
  var loading = false;
  var apTries = 0;
  var drag = null;
  var clampRaf = null;

  function readPos() {
    try {
      var v = JSON.parse(localStorage.getItem(POS_KEY));
      if (v && isFinite(v.x) && isFinite(v.y)) return v;
    } catch (err) {}
    return null;
  }

  function savePos(pos) {
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch (err) {}
  }

  function saveFold(folded) {
    try { localStorage.setItem(FOLD_KEY, folded ? '1' : '0'); } catch (err) {}
  }

  /* ---------------- 容器 ---------------- */
  function build() {
    if (root) return;

    root = document.createElement('div');
    root.id = 'wmp';
    root.className = 'wmp';
    root.innerHTML =
      '<div class="wmp-head">' +
      '  <span class="wmp-grip" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '  <span class="wmp-name">暖冬电台</span>' +
      '  <span class="wmp-meta" aria-hidden="true"></span>' +
      '  <button class="wmp-btn wmp-fold" type="button" aria-label="收起播放器" title="收起播放器">' +
      '    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '  </button>' +
      '</div>' +
      '<div class="wmp-body"><div class="wmp-aplayer" id="wmp-aplayer"></div></div>' +
      '<button class="wmp-fab" type="button" aria-label="展开播放器" title="展开播放器">' +
      '  <svg viewBox="0 0 24 24" aria-hidden="true">' +
      '    <path d="M9 17.4V5.6l9.8-1.7v10.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '    <circle cx="6.4" cy="17.6" r="2.7" fill="currentColor"/>' +
      '    <circle cx="16.2" cy="15.2" r="2.7" fill="currentColor"/>' +
      '  </svg>' +
      '</button>';

    document.body.appendChild(root);

    // 手机上默认收成小胶囊，避免展开面板与看板娘/右侧按钮打架
    var storedFold = null;
    try { storedFold = localStorage.getItem(FOLD_KEY); } catch (err) {}
    var folded = storedFold === null ? window.innerWidth <= 768 : storedFold === '1';

    root.classList.toggle('is-collapsed', folded);
    root.querySelector('.wmp-fold').setAttribute('aria-expanded', String(!folded));

    var pos = readPos();
    if (pos) {
      root.style.left = pos.x + 'px';
      root.style.top = pos.y + 'px';
      root.style.right = 'auto';
      root.style.bottom = 'auto';
      scheduleClamp();
    }

    bindDrag();
    root.querySelector('.wmp-fold').addEventListener('click', function (e) {
      e.preventDefault();
      setFold(true);
    });

    if (!folded) ensurePlayer();
  }

  /* ---------------- 折叠 / 展开 ---------------- */
  // 展开后的面板宽度：与 winter.css 的 width / max-width 保持一致
  function expandedWidth() {
    var vw = window.innerWidth;
    if (vw <= 768) return Math.min(320, vw - 74);
    return Math.min(320, vw - 56);
  }

  function setFold(folded) {
    if (!root) return;
    var rect = root.getBoundingClientRect();
    var inline = !!root.style.left;

    root.classList.toggle('is-collapsed', folded);
    saveFold(folded);

    var btn = root.querySelector('.wmp-fold');
    if (btn) {
      btn.setAttribute('aria-expanded', String(!folded));
      btn.setAttribute('aria-label', folded ? '展开播放器' : '收起播放器');
    }

    // 拖动过（left/top 定位）时，以“右下角”为锚点收缩/展开，避免展开后冲出屏幕
    if (inline) {
      var w = folded ? 52 : expandedWidth();
      var h = folded ? 52 : root.offsetHeight;
      var left = Math.max(6, Math.min(rect.right - w, window.innerWidth - w - 6));
      var top = Math.max(6, Math.min(rect.bottom - h, window.innerHeight - h - 6));
      root.style.left = left + 'px';
      root.style.top = top + 'px';
      savePos({ x: Math.round(left), y: Math.round(top) });
    }

    if (!folded) ensurePlayer();
  }

  /* ---------------- 拖动 ---------------- */
  function bindDrag() {
    root.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('.wmp-btn')) return;
      var onHead = e.target.closest('.wmp-head');
      var onFab = e.target.closest('.wmp-fab');
      if (!onHead && !onFab) return;

      var rect = root.getBoundingClientRect();
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        left: rect.left,
        top: rect.top,
        w: rect.width,
        h: rect.height,
        moved: false,
        fromFab: !!onFab
      };

      // 统一改成 left/top 定位，避免拖动时被 right/bottom 拉回
      root.style.left = rect.left + 'px';
      root.style.top = rect.top + 'px';
      root.style.right = 'auto';
      root.style.bottom = 'auto';
      root.classList.add('is-dragging');
      e.preventDefault();
    });

    window.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) drag.moved = true;
      moveTo(drag.left + dx, drag.top + dy, drag.w, drag.h);
      if (drag.moved) e.preventDefault();
    }, { passive: false });

    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var wasFab = drag.fromFab;
      var moved = drag.moved;
      drag = null;
      root.classList.remove('is-dragging');

      var rect = root.getBoundingClientRect();
      savePos({ x: Math.round(rect.left), y: Math.round(rect.top) });

      if (wasFab && !moved) setFold(false);
    }

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    window.addEventListener('resize', scheduleClamp, { passive: true });
  }

  function moveTo(left, top, w, h) {
    var m = 6;
    var maxL = Math.max(m, window.innerWidth - w - m);
    var maxT = Math.max(m, window.innerHeight - h - m);
    root.style.left = Math.min(maxL, Math.max(m, left)) + 'px';
    root.style.top = Math.min(maxT, Math.max(m, top)) + 'px';
  }

  function scheduleClamp() {
    if (clampRaf) return;
    clampRaf = requestAnimationFrame(function () {
      clampRaf = null;
      clampToViewport();
    });
  }

  function clampToViewport() {
    if (!root || !root.style.left) return;
    var rect = root.getBoundingClientRect();
    moveTo(rect.left, rect.top, rect.width, rect.height);
    savePos({ x: parseFloat(root.style.left), y: parseFloat(root.style.top) });
  }

  /* ---------------- 歌单与 APlayer ---------------- */
  function ensurePlayer() {
    if (aplayer || loading) return;

    if (!window.APlayer) {
      if (apTries++ > 24) {
        showError('播放器脚本加载失败');
        return;
      }
      setTimeout(ensurePlayer, 250);
      return;
    }

    loading = true;
    root.classList.add('is-loading');

    fetch(PLAYLIST_API, { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var tracks = normalize(data);
        if (!tracks.length) throw new Error('empty playlist');

        aplayer = new window.APlayer({
          container: root.querySelector('#wmp-aplayer'),
          audio: tracks,
          theme: '#f2b36d',
          lrcType: 0,
          autoplay: false,
          preload: 'none',
          loop: 'all',
          order: 'random',
          volume: 0.55,
          listFolded: true,
          listMaxHeight: '170px',
          storageName: 'wmp-aplayer-setting'
        });

        aplayer.on('play', function () { root.classList.add('is-playing'); });
        aplayer.on('pause', function () { root.classList.remove('is-playing'); });
        aplayer.on('ended', function () { root.classList.remove('is-playing'); });

        // 播放列表展开后若超出屏幕底部，把面板整体上移。
        // 列表高度是渐变出来的，动画期间逐帧校正，最终贴住底边
        aplayer.on('listshow', function () {
          if (!root.style.top) return;
          var deadline = Date.now() + 700;
          (function settle() {
            var visible = window.innerHeight - 6;
            var rect = root.getBoundingClientRect();
            if (rect.bottom > visible) {
              root.style.top = Math.max(6, visible - rect.height) + 'px';
              savePos({ x: parseFloat(root.style.left), y: parseFloat(root.style.top) });
            }
            if (Date.now() < deadline) requestAnimationFrame(settle);
          })();
        });

        var meta = root.querySelector('.wmp-meta');
        if (meta) meta.textContent = tracks.length + ' 首';

        root.classList.remove('is-loading');
        loading = false;
      })
      .catch(function (err) {
        loading = false;
        root.classList.remove('is-loading');
        showError(err && err.message === 'empty playlist' ? '歌单为空' : '歌单加载失败');
      });
  }

  function normalize(data) {
    if (!Array.isArray(data)) return [];
    return data.slice(0, MAX_TRACKS).filter(function (item) {
      return item && item.url && item.name;
    }).map(function (item) {
      return {
        name: item.name,
        artist: item.artist || '未知歌手',
        url: item.url,
        cover: item.pic || ''
      };
    });
  }

  function showError(msg) {
    var body = root.querySelector('.wmp-body');
    var meta = root.querySelector('.wmp-meta');
    if (meta) meta.textContent = '';
    body.innerHTML =
      '<div class="wmp-error">' +
      '  <span>' + msg + '</span>' +
      '  <button type="button" class="wmp-retry">重试</button>' +
      '</div>';

    body.querySelector('.wmp-retry').addEventListener('click', function () {
      body.innerHTML = '<div class="wmp-aplayer" id="wmp-aplayer"></div>';
      ensurePlayer();
    });
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', boot);
      return;
    }
    build();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
