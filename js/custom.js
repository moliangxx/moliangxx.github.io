// Copy of public/js/custom.js for theme source
(function(){
  'use strict';
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skeletonHtml = `
    <div class="skeleton-screen" id="skeleton-screen" aria-hidden="true">
      <div class="skeleton-card">
        <div class="skeleton-lines">
          <div class="skeleton-line" style="width:70%"></div>
          <div class="skeleton-line" style="width:55%"></div>
          <div class="skeleton-line" style="width:85%"></div>
          <div class="skeleton-line" style="width:60%"></div>
          <div class="skeleton-line" style="width:95%"></div>
        </div>
      </div>
    </div>
  `;
  document.documentElement.insertAdjacentHTML('beforeend', skeletonHtml);
  const removeSkeleton = ()=>{
    const el = document.getElementById('skeleton-screen');
    if(!el) return;
    el.style.transition = 'opacity 280ms ease';
    el.style.opacity = 0;
    setTimeout(()=>el.remove(), 320);
  };
  window.addEventListener('load', ()=>{ setTimeout(removeSkeleton, 200); });
  setTimeout(removeSkeleton, 3000);
  function setupImages(){
    const imgs = document.querySelectorAll('.article-entry img');
    imgs.forEach(img=>{
      try{ if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy'); }catch(e){}
      if(img.complete){ img.classList.add('img-loaded'); }
      else img.addEventListener('load', ()=> img.classList.add('img-loaded'));
      img.addEventListener('click', (e)=>{
        if(prefersReduced) return;
        openImageModal(img.src, img.alt || '');
      });
    });
  }
  function openImageModal(src, alt){
    if(document.querySelector('.image-modal')) return;
    const modal = document.createElement('div'); modal.className='image-modal';
    modal.tabIndex = -1;
    modal.innerHTML = `<div class="inner"><img src="${src}" alt="${alt}"></div><div class="close-hint">Esc 或 点击背景 关闭</div>`;
    document.body.appendChild(modal);
    const close = ()=>{ modal.remove(); document.removeEventListener('keydown', onKey); };
    modal.addEventListener('click', (ev)=>{ if(ev.target===modal) close(); });
    function onKey(e){ if(e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
  }
  const progressBar = document.createElement('div'); progressBar.id='reading-progress'; document.body.appendChild(progressBar);
  function updateProgress(){
    const article = document.querySelector('.article-entry');
    if(!article){ progressBar.style.width = '0'; return; }
    const rect = article.getBoundingClientRect();
    const total = article.scrollHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(window.scrollY - (article.offsetTop - 60), 0), total);
    const pct = total>0? (scrolled/total)*100 : 0;
    progressBar.style.width = pct + '%';
  }
  let rafId = null;
  function onScroll(){ if(rafId) return; rafId = requestAnimationFrame(()=>{ updateProgress(); rafId = null; }); }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  const header = document.getElementById('header');
  function updateHeader(){ if(!header) return; const threshold = 80; if(window.scrollY > threshold) header.classList.add('sticky'); else header.classList.remove('sticky'); }
  window.addEventListener('scroll', ()=>{ if(rafId) return; rafId = requestAnimationFrame(()=>{ updateHeader(); rafId = null; }); }, {passive:true});
  document.addEventListener('DOMContentLoaded', ()=>{ setupImages(); updateHeader(); updateProgress(); });
  document.addEventListener('click', (e)=>{
    const el = e.target.closest('a,button,.main-nav-link');
    if(!el) return;
    el.classList.add('tapped');
    setTimeout(()=>el.classList.remove('tapped'), 160);
  });
  if(prefersReduced){ document.documentElement.classList.add('reduced-motion'); }
})();
