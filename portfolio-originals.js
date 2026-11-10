(() => {
  const gallery=document.querySelector('.studio-originals');if(!gallery)return;
  const tabs=[...gallery.querySelectorAll('[role="tab"]')],panels=[...gallery.querySelectorAll('[role="tabpanel"]')];
  const behavior=()=>document.documentElement.classList.contains('motion-off')||matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth';
  function select(tab,focus=false){
    tabs.forEach(item=>{const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1});
    panels.forEach(panel=>panel.hidden=panel.id!==tab.getAttribute('aria-controls'));
    if(focus)tab.focus({preventScroll:true});
    tab.scrollIntoView({behavior:behavior(),block:'nearest',inline:'nearest'});
    const panel=gallery.querySelector('#'+tab.getAttribute('aria-controls'));panel.dispatchEvent(new Event('flow:show'));
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>select(tab));
    tab.addEventListener('keydown',e=>{const next=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i-1+tabs.length)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:-1;if(next>=0){e.preventDefault();select(tabs[next],true)}});
  });
  for(const panel of panels){
    const strip=panel.querySelector('.originals-screen-strip');if(!strip)continue;
    const screens=[...strip.children],steps=[...panel.querySelectorAll('[data-stage]')],prev=panel.querySelector('[data-flow-prev]'),next=panel.querySelector('[data-flow-next]');let current=0,raf=0;
    function active(index){current=index;screens.forEach((screen,i)=>screen.classList.toggle('is-current',i===index));steps.forEach((step,i)=>step.setAttribute('aria-pressed',String(index===i)));prev.disabled=index===0;next.disabled=index===screens.length-1;}
    function go(index){index=Math.max(0,Math.min(screens.length-1,index));active(index);const left=screens[index].offsetLeft-screens[0].offsetLeft;strip.scrollTo({left,behavior:behavior()});}
    steps.forEach((step,i)=>step.addEventListener('click',()=>go(i)));prev.onclick=()=>go(current-1);next.onclick=()=>go(current+1);
    strip.addEventListener('keydown',e=>{if(e.target!==strip)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(current+(e.key==='ArrowRight'?1:-1))}});
    strip.addEventListener('scroll',()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(strip.scrollWidth<=strip.clientWidth+2)return;const gap=screens[1].offsetLeft-screens[0].offsetLeft;active(Math.max(0,Math.min(screens.length-1,Math.round(strip.scrollLeft/gap))))})},{passive:true});
    panel.addEventListener('flow:show',()=>active(current));active(0);
  }
})();
