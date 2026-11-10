/* Native sliders retain their keyboard semantics; updates are coalesced to a frame. */
(()=>{
 'use strict';
 const root=document.documentElement;let active=null;
 const fill=el=>{const min=Number(el.min||0),max=Number(el.max||100);el.style.setProperty('--fill',100*(Number(el.value)-min)/Math.max(1e-9,max-min)+'%');};
 document.querySelectorAll('input[type="range"]').forEach(el=>{
  el.classList.add('smooth-range');fill(el);
  el.addEventListener('input',()=>fill(el),{passive:true});
  el.addEventListener('change',()=>fill(el),{passive:true});
 });
 function finish(){if(!active)return;const el=active;active=null;delete el.dataset.scrubbing;root.classList.remove('range-dragging');if(el.dataset.discreteStep){el.value=Math.max(+el.min,Math.min(+el.max,Math.round(+el.value)));el.dispatchEvent(new Event('change',{bubbles:true}));}fill(el);}
 document.addEventListener('pointerdown',e=>{const el=e.target.closest('input[type="range"]');if(!el)return;if(active&&active!==el)finish();active=el;el.dataset.scrubbing='true';root.classList.add('range-dragging');},{capture:true,passive:true});
 document.addEventListener('pointerup',finish,{capture:true,passive:true});
 document.addEventListener('pointercancel',finish,{capture:true,passive:true});
 addEventListener('blur',finish);
 document.addEventListener('keydown',e=>{const el=e.target;if(!el.matches?.('input[type="range"][data-discrete-step]'))return;let v=Math.round(+el.value);const step=+el.dataset.discreteStep||1;if(['ArrowLeft','ArrowDown'].includes(e.key))v-=step;else if(['ArrowRight','ArrowUp'].includes(e.key))v+=step;else if(e.key==='Home')v=+el.min;else if(e.key==='End')v=+el.max;else if(e.key==='PageUp')v+=step*3;else if(e.key==='PageDown')v-=step*3;else return;e.preventDefault();el.value=Math.max(+el.min,Math.min(+el.max,v));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},true);
})();
