(()=>{'use strict';
const root=document.documentElement,media=matchMedia('(prefers-reduced-motion:reduce)'),items=new Set();let raf=0,last=0,time=0;
const moving=()=>!media.matches&&!root.classList.contains('motion-off')&&!document.hidden;
function loop(now){raf=0;const dt=Math.min(50,now-(last||now));last=now;if(moving())time+=dt/1000;for(const item of items)if(item.visible)item.draw(time);if(moving()&&[...items].some(i=>i.visible))raf=requestAnimationFrame(loop)}
function wake(){if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}}
const observer=new IntersectionObserver(entries=>{for(const e of entries){const item=[...items].find(i=>i.canvas===e.target);if(item)item.visible=e.isIntersecting}wake()},{rootMargin:'40px'});
new MutationObserver(wake).observe(root,{attributes:true,attributeFilter:['class']});media.addEventListener('change',wake);document.addEventListener('visibilitychange',wake);
function mount(canvas,options={}){const ctx=canvas.getContext('2d');if(!ctx)return{update(){}};let w=0,h=0,dpr=1,opts={kind:'orbit',color:[199,145,212],rate:.8,energy:.5,tone:'Warm',seed:0,...options},px=0,py=0;const item={canvas,visible:false,draw};items.add(item);observer.observe(canvas);
 function size(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(time);wake()}new ResizeObserver(size).observe(canvas);size();
 function color(a,white=0){return'rgba('+opts.color.map(c=>Math.round(c+(255-c)*white)).join(',')+','+a+')'}
 function path(points,alpha,width=.65,white=0){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.lineWidth=width;ctx.strokeStyle=color(alpha,white);ctx.stroke()}
 function dot(x,y,r,alpha){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color(alpha,.5);ctx.fill()}
 function draw(t){if(!w||!h)return;ctx.clearRect(0,0,w,h);const cx=w/2+px*5,cy=h/2+py*3,scale=Math.min(w*.40,h*.49),kind=opts.kind,speed=.24+opts.energy*.43,clock=t*speed+opts.seed*.43;
  const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*1.4);glow.addColorStop(0,color(.035));glow.addColorStop(.5,color(.025));glow.addColorStop(1,color(0));ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
  function project(x,y,z){const a=.48+Math.sin(clock*.2)*.13+py*.15,b=clock*.12+px*.2,xx=x*Math.cos(b)+z*Math.sin(b),zz=z*Math.cos(b)-x*Math.sin(b),yy=y*Math.cos(a)-zz*Math.sin(a),z2=y*Math.sin(a)+zz*Math.cos(a),p=3.4/(3.4-z2);return[cx+xx*scale*p,cy+yy*scale*p]}
  if(kind==='tp'||kind==='orbit'){
   const aura=kind==='orbit',rings=aura?32:24,N=84;
   for(let k=0;k<rings;k++){const v=k/rings*Math.PI*2,points=[];for(let j=0;j<=N;j++){const u=j/N*Math.PI*2;
     const twist=aura?(opts.tone==='Playful'?3:opts.tone==='Thoughtful'?5:2):0;
     const major=aura?.64+.08*Math.sin(u*twist+clock):.63,minor=aura?.23+.04*Math.sin(u*3-clock):.19+opts.rate*.035;
     const x=(major+minor*Math.cos(v+clock*.2))*Math.cos(u),y=(major+minor*Math.cos(v+clock*.2))*Math.sin(u),z=minor*Math.sin(v+clock*.2)+(aura?.16*Math.sin(u*twist+clock):0);
     points.push(project(x,y,z));}
    path(points,.10+.25*Math.pow((Math.cos(v-clock)+1)/2,3),.65,k%4===0?.5:0);
   }
   for(let k=0;k<7;k++){let a=k*2.399+clock*(k%2?1:-1)*.32,r=.68+.2*Math.sin(k+clock*.4);const p=project(Math.cos(a)*r,Math.sin(a)*r,Math.sin(a*2)*.18);dot(...p,1.4,.55)}
  }else if(kind==='fn'){
   for(let k=0;k<27;k++){const points=[],v=k/27*Math.PI*2;for(let j=0;j<=68;j++){let a=.40+j/68*4.65,r=.63+.18*Math.cos(v);points.push(project(Math.cos(a)*r,Math.sin(a)*r,.18*Math.sin(v)))}path(points,.09+.29*(Math.sin(v+clock)*.5+.5),.65,k%5===0?.4:0)}
   for(let k=0;k<11;k++){const points=[];for(let j=0;j<40;j++){let q=j/39;points.push([cx+scale*(.38+q*.95),cy-scale*.25+Math.sin(q*2.6+k*.1)*scale*.35+(k-5)*2])}path(points,.06+.12*(k%3/3),.6);const q=(clock*.2+k*.13)%1;dot(cx+scale*(.38+q*.95),cy-scale*.25+Math.sin(q*2.6+k*.1)*scale*.35+(k-5)*2,1.2,opts.rate*.7+.15)}
  }else if(kind==='fp'){
   for(let k=0;k<32;k++){const points=[],r=.28+Math.min(.16,Math.sqrt(opts.rate)*1.5)+k*.011,a=(k/32-.5)*1.9+clock*.12;for(let j=0;j<=100;j++){const u=j/100*Math.PI*2,x=Math.cos(u)*r*1.6,y=Math.sin(u)*r*.65;points.push(project(x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),Math.sin(u*2+clock)*.16))}path(points,.10+.20*Math.pow((Math.sin(k*.3+clock)+1)/2,3),.75,k%3===0?.65:0)}
   for(let k=0;k<5;k++){let a=clock*.5+k*1.9;dot(...project(Math.cos(a)*.7,Math.sin(a)*.2,Math.sin(a)*.15),1.4,.55)}
  }else if(kind==='tn'){
   for(let k=0;k<29;k++){const points=[];for(let j=0;j<100;j++){const u=j/99,x=(u-.5)*2.1,y=(k-14)*.019+Math.sin(u*6.2-clock+k*.038)*(.23+Math.min(.22,Math.sqrt(1-opts.rate)*2)),z=Math.sin(u*6.2-clock+k*.038)*.27;points.push(project(x,y,z))}path(points,.08+.26*Math.pow((Math.sin(k*.22+clock)+1)/2,3),.7,k%3===0?.65:0)}
   for(let k=0;k<9;k++){const u=(clock*.18+k*.103)%1;dot(...project((u-.5)*2.1,(k-4)*.05+Math.sin(u*6.2-clock+k*.1)*.29,0),1.1,.45)}
  }
  if(kind==='orbit'){for(let k=0;k<23;k++){const a=k*2.399+clock*.03,r=scale*(.96+.2*Math.sin(k*1.7));dot(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.75,.6,.13+.18*(Math.sin(clock+k)+1)/2)}}
  ctx.globalCompositeOperation='source-over';
 }
 canvas.parentElement.addEventListener('pointermove',e=>{if(!moving()||e.pointerType!=='mouse')return;const r=canvas.getBoundingClientRect();px=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));py=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));wake()},{passive:true});canvas.parentElement.addEventListener('pointerleave',()=>{px=py=0;wake()});
 return{update(next){opts={...opts,...next};wake()},draw:()=>draw(time)};
}
window.PortfolioSculptures={mount};
})();
