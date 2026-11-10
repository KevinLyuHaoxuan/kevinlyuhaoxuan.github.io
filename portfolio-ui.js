(()=>{
  'use strict';
  const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let preference;try{preference=localStorage.getItem('portfolio-motion')}catch(e){}
  const off=preference==='off'||reduced.matches;
  root.classList.toggle('motion-off',off);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='motion-toggle';
  function motionLabel(){const active=!root.classList.contains('motion-off');toggle.innerHTML='<span>Motion '+(active?'on':'off')+'</span>';toggle.setAttribute('aria-label','Animations '+(active?'on':'off')+'. Toggle motion');toggle.setAttribute('aria-pressed',String(active))}
  motionLabel();document.querySelector('header nav')?.append(toggle);
  toggle.onclick=()=>{root.classList.toggle('motion-off');motionLabel();try{localStorage.setItem('portfolio-motion',root.classList.contains('motion-off')?'off':'on')}catch(e){}};
  reduced.addEventListener('change',e=>{if(e.matches){root.classList.add('motion-off');motionLabel()}});
  document.querySelectorAll('[data-split]').forEach(el=>{
    let i=0;const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){const frag=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word.trim())frag.append(document.createTextNode(word));else{const mask=document.createElement('span'),span=document.createElement('span');mask.className='word-mask';span.className='word-rise';span.style.setProperty('--i',i++);span.textContent=word;mask.append(span);frag.append(mask)}});node.replaceWith(frag)}
  });
  if('IntersectionObserver' in window){root.classList.add('motion-ready');const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');obs.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('[data-reveal]').forEach(el=>obs.observe(el))}
  const progress=document.createElement('div');progress.className='scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
  const top=document.createElement('a');top.href='#top';top.className='back-top';top.setAttribute('aria-label','Back to top');top.textContent='↑';document.body.id=document.body.id||'top';document.body.append(top);
  let scrolling=false;
  function scroll(){const h=document.documentElement.scrollHeight-innerHeight;progress.style.transform='scaleX('+(h>0?scrollY/h:0)+')';top.classList.toggle('visible',scrollY>600);scrolling=false}
  addEventListener('scroll',()=>{if(!scrolling){scrolling=true;requestAnimationFrame(scroll)}},{passive:true});scroll();
  if(matchMedia('(pointer:fine)').matches)document.querySelectorAll('[data-glow]').forEach(el=>{let frame=0,x=0,y=0;el.addEventListener('pointermove',e=>{if(root.classList.contains('motion-off')||root.classList.contains('range-dragging'))return;x=e.clientX;y=e.clientY;if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(root.classList.contains('range-dragging'))return;const r=el.getBoundingClientRect();el.style.setProperty('--mx',x-r.left+'px');el.style.setProperty('--my',y-r.top+'px')})},{passive:true})});
  document.addEventListener('click',e=>{const el=e.target.closest('.button,.quiet,.action');if(!el||root.classList.contains('motion-off'))return;const r=el.getBoundingClientRect(),ripple=document.createElement('span');ripple.className='ripple';ripple.style.left=(e.clientX?r.width/2+(e.clientX-r.left-r.width/2):r.width/2)-6+'px';ripple.style.top=(e.clientY?e.clientY-r.top:r.height/2)-6+'px';ripple.setAttribute('aria-hidden','true');el.append(ripple);setTimeout(()=>ripple.remove(),700)});
  document.querySelectorAll('input[type=range]').forEach(el=>{const fill=()=>el.style.setProperty('--fill',100*(Number(el.value)-Number(el.min||0))/(Number(el.max||100)-Number(el.min||0))+'%');el.addEventListener('input',fill);el.addEventListener('change',fill);new MutationObserver(fill).observe(el,{attributes:true,attributeFilter:['min','max','value']});fill()});
  const toast=document.createElement('div');toast.className='toast';toast.setAttribute('role','status');document.body.append(toast);let timer;
  window.portfolioToast=text=>{clearTimeout(timer);toast.textContent=text;toast.classList.add('show');timer=setTimeout(()=>toast.classList.remove('show'),3000)};
  document.querySelectorAll('#pos,#forecast,#stock,#gap,#finding-mean,.mini-stats strong').forEach(el=>{let animation;new MutationObserver(()=>{animation?.cancel();if(root.classList.contains('motion-off')||root.classList.contains('range-dragging')||root.classList.contains('wm-flip-ready'))return;animation=el.animate([{opacity:.45,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'})}).observe(el,{childList:true})});
  // Progressive custom selects keep the native value and change event as the single source of truth.
  document.querySelectorAll('select').forEach((select,index)=>{
    const label=select.closest('label')?.childNodes[0]?.textContent.trim()||select.getAttribute('aria-label')||'Select';
    const wrap=document.createElement('span');wrap.className='select-wrap';select.before(wrap);wrap.append(select);select.classList.add('native-select');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    const button=document.createElement('button');button.type='button';button.className='select-trigger';button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',label);const menu=document.createElement('span');menu.className='select-menu';menu.setAttribute('role','listbox');menu.setAttribute('aria-label',label);menu.id='select-menu-'+index;menu.hidden=true;button.setAttribute('aria-controls',menu.id);wrap.append(button,menu);let active=select.selectedIndex;
    function sync(){button.innerHTML='';const span=document.createElement('span');span.textContent=select.selectedOptions[0]?.textContent||'';button.append(span);menu.replaceChildren();[...select.options].forEach((option,i)=>{const item=document.createElement('span');item.style.display='block';item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));item.id=menu.id+'-'+i;item.textContent=option.textContent;item.onclick=()=>choose(i);menu.append(item)});active=select.selectedIndex}
    function highlight(){[...menu.children].forEach((e,i)=>e.classList.toggle('highlight',i===active));button.setAttribute('aria-activedescendant',menu.id+'-'+active);menu.children[active]?.scrollIntoView({block:'nearest'})}
    function close(){menu.hidden=true;button.setAttribute('aria-expanded','false');button.removeAttribute('aria-activedescendant')}
    function open(){document.dispatchEvent(new CustomEvent('close-selects'));menu.hidden=false;button.setAttribute('aria-expanded','true');active=select.selectedIndex;highlight()}
    function choose(i){select.selectedIndex=i;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close();button.focus({preventScroll:true})}
    button.onclick=()=>menu.hidden?open():close();button.onkeydown=e=>{if(['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(e.key)){e.preventDefault();if(e.key==='Escape'){close();return}if(menu.hidden){open();return}if(e.key==='Enter'||e.key===' '){choose(active);return}active=e.key==='Home'?0:e.key==='End'?select.options.length-1:Math.max(0,Math.min(select.options.length-1,active+(e.key==='ArrowDown'?1:-1)));highlight()}else if(e.key.length===1){const i=[...select.options].findIndex(o=>o.text.toLowerCase().startsWith(e.key.toLowerCase()));if(i>=0){if(menu.hidden)open();active=i;highlight()}}};
    menu.addEventListener('pointerdown',e=>e.preventDefault());
    wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))close()});document.addEventListener('click',e=>{if(!wrap.contains(e.target))close()});document.addEventListener('close-selects',close);select.addEventListener('change',sync);new MutationObserver(sync).observe(select,{childList:true,subtree:true});select.addEventListener('focus',()=>button.focus({preventScroll:true}));sync();
  });
})();
