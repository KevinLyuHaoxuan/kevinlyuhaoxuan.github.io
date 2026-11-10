(()=>{
'use strict';
const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(pointer:fine)'),enabled=()=>!root.classList.contains('motion-off')&&!root.classList.contains('range-dragging')&&!reduce.matches;
document.querySelectorAll('[data-letterplay]').forEach(el=>{
 const nodes=[],walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode())nodes.push(walk.currentNode);let index=0;
 nodes.forEach(node=>{const f=document.createDocumentFragment();for(const word of node.textContent.split(/(\s+)/)){if(!word.trim()){f.append(document.createTextNode(word));continue}const w=document.createElement('span');w.className='glyph-word';for(const char of word){const span=document.createElement('span');span.className='glyph';span.style.setProperty('--letter',index++);span.textContent=char;w.append(span)}f.append(w)}node.replaceWith(f)});
});
if(fine.matches){
 document.querySelectorAll('.project-card').forEach(card=>{let raf=0;card.addEventListener('pointermove',e=>{if(!enabled())return;const r=card.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{card.style.setProperty('--tilt-x',(0.5-py)*3+'deg');card.style.setProperty('--tilt-y',(px-.5)*3+'deg');card.style.setProperty('--shine',px*100+'%')})});card.addEventListener('pointerleave',()=>{cancelAnimationFrame(raf);card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg')})});
}
// A short-lived, bounded trail. It never captures clicks and sleeps when the pointer stops.
if(fine.matches&&!reduce.matches){
 const canvas=document.createElement('canvas');canvas.id='cursor-trail';canvas.setAttribute('aria-hidden','true');canvas.setAttribute('role','presentation');document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return}
 let w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5),raf=0,lastTime=0,lastMove=0,px=null,py=null,particles=[],tail=[],color='190,168,255';
 if(document.body.classList.contains('fraud-page'))color='153,216,242';if(document.body.classList.contains('dategpt-page'))color='237,168,211';
 function size(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}size();addEventListener('resize',size,{passive:true});
 function clear(){cancelAnimationFrame(raf);raf=0;particles=[];tail=[];px=py=null;ctx.clearRect(0,0,w,h)}
 function tick(now){raf=0;if(!enabled()||document.hidden){clear();return}const dt=Math.min(32,now-(lastTime||now));lastTime=now;ctx.clearRect(0,0,w,h);tail=tail.filter(p=>now-p.t<430);particles=particles.filter(p=>p.life>0);
  ctx.globalCompositeOperation='lighter';
  for(let i=1;i<tail.length;i++){const a=tail[i-1],b=tail[i],alpha=(1-(now-b.t)/430)*.22;ctx.strokeStyle='rgba('+color+','+alpha+')';ctx.lineWidth=.5+i/tail.length*1.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  for(const p of particles){p.life-=dt;p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;p.vy+=.007;const alpha=Math.max(0,p.life/p.max);ctx.fillStyle='rgba('+color+','+alpha*.65+')';ctx.beginPath();ctx.arc(p.x,p.y,p.r*alpha,0,Math.PI*2);ctx.fill()}
  if(px!=null&&now-lastMove<600){const alpha=Math.max(0,1-(now-lastMove)/600),g=ctx.createRadialGradient(px,py,0,px,py,22);g.addColorStop(0,'rgba('+color+','+.16*alpha+')');g.addColorStop(1,'rgba('+color+',0)');ctx.fillStyle=g;ctx.fillRect(px-22,py-22,44,44)}
  ctx.globalCompositeOperation='source-over';if(particles.length||tail.length||now-lastMove<600)raf=requestAnimationFrame(tick);
 }
 document.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!enabled())return;const now=performance.now(),distance=px==null?0:Math.hypot(e.clientX-px,e.clientY-py);px=e.clientX;py=e.clientY;lastMove=now;tail.push({x:px,y:py,t:now});if(tail.length>28)tail.shift();const count=Math.min(3,Math.ceil(distance/9));for(let i=0;i<count;i++){const life=320+Math.random()*340;particles.push({x:px+(Math.random()-.5)*9,y:py+(Math.random()-.5)*9,vx:(Math.random()-.5)*.65,vy:(Math.random()-.5)*.65,life,max:life,r:.7+Math.random()*1.1})}if(particles.length>80)particles.splice(0,particles.length-80);if(!raf){lastTime=now;raf=requestAnimationFrame(tick)}},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});new MutationObserver(()=>{if(!enabled())clear()}).observe(root,{attributes:true,attributeFilter:['class']});reduce.addEventListener('change',e=>{if(e.matches)clear()});
}
})();
