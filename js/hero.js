// Simple typewriter loop and optional mouse parallax
(function(){
  const phrases = ["不想上早八"];
  const el = document.getElementById('typed-text');
  const TYPING_SPEED = 120; // ms per char
  const DELETING_SPEED = 60;
  const HOLD_DELAY = 1400; // hold full phrase

  let pi = 0, ci = 0, deleting = false;

  function tick(){
    const phrase = phrases[pi];
    if(!deleting){
      el.textContent = phrase.slice(0, ci+1);
      ci++;
      if(ci === phrase.length){
        deleting = true;
        setTimeout(tick, HOLD_DELAY);
        return;
      }
      setTimeout(tick, TYPING_SPEED);
    } else {
      el.textContent = phrase.slice(0, ci-1);
      ci--;
      if(ci === 0){
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, DELETING_SPEED);
    }
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    if(el) tick();

    // optional mouse parallax: set CSS variables on hero element
    const hero = document.querySelector('.hero');
    const bg = document.querySelector('.hero-bg');
    if(hero && bg){
      hero.addEventListener('mousemove', (e)=>{
        const rect = hero.getBoundingClientRect();
        const mx = e.clientX - rect.left - rect.width/2;
        const my = e.clientY - rect.top - rect.height/2;
        hero.style.setProperty('--mx', mx);
        hero.style.setProperty('--my', my);
        hero.setAttribute('data-mx','1');
      });
      hero.addEventListener('mouseleave', ()=>{
        hero.style.setProperty('--mx', 0);
        hero.style.setProperty('--my', 0);
        hero.removeAttribute('data-mx');
      });
    }
  });
})();
