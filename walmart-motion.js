/* Stable KPI nodes and a latest-value animation queue. No full-page rescans. */
(()=>{
'use strict';
const root=document.documentElement;
root.classList.add('wm-flip-ready');
const selector=['[data-number]','.wm-revenue-value','.wm-metric strong','.wm-orbit strong','.wm-channel-legend strong','.wm-mix-row strong','.wm-flow article strong','.wm-forward-balance strong','.wm-availability strong','.wm-otif-number','.wm-otif-metrics strong','.wm-markdowns h3','.wm-type-row strong','.metric strong','.diagnostic-stat strong','#planned-stock','#planned-demand','#matched-pos','#attainment','#stock-ratio','.wm-deltas>span','.sku-card-stats b'].join(',');
// Numeric readouts across every reporting layer. Identifiers stay as text.
const textSelector=[
 '.wm-pill','.wm-mix-row small','.wm-flow-link span','.wm-forward-bars button>span',
 '.wm-forward-detail>.overline','.wm-forward-balance small','.wm-availability>span',
 '#otif-context','.wm-otif-weeks button','.wm-type-row small','.wm-md-history button>span',
 '.wm-event-count','.wm-quick-head>div>span','.wm-quick-trend>div>span:last-child',
 '.sku-card-gap','.cell-value','.forecast-cell','.gap-pill','.stock-indicator',
 '#coverage','#run','#week-value','#week-title','#demand-change-label','#inbound-label',
 '#planning-context','#diagnostic-scope','#matched-caption','#products-caption',
 '.error-row>span:last-child','.wm-table td'
].join(',');
const escapeHTML=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function numericText(text){
 let html='',last=0;
 for(const match of String(text).matchAll(/\bW(\d{2})\b|[+−–-]?\$?\d+(?:[,.]\d+)*(?:%|[KMB])?/g)){
  const before=text[match.index-1]||'',after=text[match.index+match[0].length]||'';
  if(!match[1]&&(/[A-Za-z0-9_-]/.test(before)||(/[A-Za-z0-9_]/.test(after)&&after!=='w')))continue;
  const prefix=match[1]?'W':'',value=match[1]||match[0];
  html+=escapeHTML(text.slice(last,match.index))+prefix+'<wm-value data-number>'+escapeHTML(value)+'</wm-value>';
  last=match.index+match[0].length;
 }
 return html+escapeHTML(text.slice(last));
}
function prepareNumbers(source){
 for(const host of source.querySelectorAll(textSelector)){
  for(const node of [...host.childNodes])if(node.nodeType===3&&/\d/.test(node.textContent)){
   const markup=numericText(node.textContent);if(!markup.includes('<wm-value'))continue;
   const wrapper=document.createElement('wm-text');wrapper.innerHTML=markup;node.replaceWith(wrapper);
  }
 }
}
const records=new WeakMap(),markupCache=new WeakMap(),active=new Set(),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const visibility=new IntersectionObserver(entries=>{for(const entry of entries){const r=records.get(entry.target);if(r){r.visible=entry.isIntersecting;if(!r.visible)settle(r);}}});
const motionAllowed=r=>r.visible&&r.host.isConnected&&!r.host.closest('[hidden]')&&!root.classList.contains('motion-off')&&!reduced.matches;
const parse=text=>String(text).match(/^(\s*)([+−–-]?\$?\d[\d,.]*%?)([\s\S]*)$/);
function glyph(char){
 const node=document.createElement('span');node.className=/\d/.test(char)?'wm-digit':'wm-punct';node.dataset.final=char;
 if(/\d/.test(char)){for(const side of ['top','bottom']){const flap=document.createElement('wm-flap');flap.className='wm-flap-'+side;node.append(flap);}}
 return node;
}
function stop(r){clearTimeout(r.timer);r.timer=0;for(const a of r.animations||[])a.cancel();r.animations=[];active.delete(r);for(const d of r.glyphs.children)d.classList.remove('is-flipping');}
function paint(r,value,animate){
 const previous=r.shown||'';
 // One pair of composited flaps per KPI, instead of two layers per digit.
 // The common prefix stays still; only the changed suffix turns.
 if(!r.glyphs.children.length){const prefix=document.createElement('span');prefix.className='wm-punct';r.glyphs.append(prefix,glyph('0'));}
 const prefix=r.glyphs.children[0],reel=r.glyphs.children[1];let split=0;
 if(animate&&previous.length===value.length)while(split<value.length&&previous[split]===value[split])split++;
 prefix.dataset.final=value.slice(0,split);reel.dataset.final=value.slice(split);
 if(animate&&previous!==value){
  reel.dataset.old=previous.slice(split);reel.children[0].dataset.glyph=previous.slice(split);reel.children[1].dataset.glyph=value.slice(split);reel.classList.add('is-flipping');
  r.animations.push(reel.children[0].animate([{transform:'rotateX(0)'},{transform:'rotateX(-90deg)'}],{duration:90,easing:'cubic-bezier(.45,0,.8,.6)',fill:'both'}),reel.children[1].animate([{transform:'rotateX(90deg)'},{transform:'rotateX(0)'}],{duration:90,delay:90,easing:'cubic-bezier(.15,.45,.3,1)',fill:'both'}));
 }
 r.shown=value;
}
function settle(r){stop(r);paint(r,r.latest,false);}
function advance(r){
 if(r.latest===r.shown)return;
 if(!motionAllowed(r)){settle(r);return;}
 paint(r,r.latest,true);active.add(r);
 // Updates arriving during a turn overwrite latest; they never restart that turn.
 r.timer=setTimeout(()=>{stop(r);if(r.host.isConnected)advance(r);},185);
}
function value(r,text){
 if(r.latest===text)return;
 r.latest=text;r.number.dataset.value=text;r.label.textContent=text;
 if(!motionAllowed(r)){settle(r);return;}
 if(!r.timer)advance(r);
}
function removeRecord(host){const r=records.get(host);if(r){stop(r);visibility.unobserve(host);records.delete(host);}}
function numberHost(host,source){
 const first=[...source.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
 const match=first&&parse(first.textContent);if(!match)return false;
 let r=records.get(host);
 if(!r){
  const number=document.createElement('span'),label=document.createElement('span'),glyphs=document.createElement('span'),rest=document.createElement('wm-rest');
  number.className='wm-number';label.className='wm-number-label';glyphs.className='wm-glyphs';glyphs.setAttribute('aria-hidden','true');number.append(label,glyphs);
  const prefix=document.createTextNode(match[1]),suffix=document.createTextNode(match[3]);
  r={host,number,label,glyphs,rest,prefix,suffix,shown:null,latest:match[2],visible:false,timer:0,animations:[]};
  records.set(host,r);host.replaceChildren(prefix,number,suffix,rest);visibility.observe(host);
  number.dataset.value=r.latest;label.textContent=r.latest;paint(r,r.latest,false);
 }
 if(r.prefix.textContent!==match[1])r.prefix.textContent=match[1];
 if(r.suffix.textContent!==match[3])r.suffix.textContent=match[3];
 const tail=document.createDocumentFragment();for(let n=first.nextSibling;n;n=n.nextSibling)tail.append(n.cloneNode(true));
 patchChildren(r.rest,tail);value(r,match[2]);return true;
}
function hydrate(node){
 if(node.nodeType!==1)return;
 if(node.matches(selector))numberHost(node,node.cloneNode(true));
 for(const host of node.querySelectorAll(selector))if(!records.has(host))numberHost(host,host.cloneNode(true));
}
function key(n){if(n.nodeType!==1)return null;return n.id?'id:'+n.id:n.hasAttribute('data-item')?'item:'+n.dataset.item:n.tagName==='TR'&&n.querySelector('[data-item]')?'row:'+n.querySelector('[data-item]').dataset.item:null;}
function compatible(a,b){return a&&a.nodeType===b.nodeType&&(a.nodeType!==1||(a.tagName===b.tagName&&a.namespaceURI===b.namespaceURI));}
function dispose(node){if(node.nodeType!==1)return;removeRecord(node);for(const n of node.querySelectorAll(selector))removeRecord(n);}
function patchNode(current,next){
 if(current.nodeType!==1){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
 for(const attr of [...current.attributes])if(!next.hasAttribute(attr.name)&&attr.name!=='open')current.removeAttribute(attr.name);
 for(const attr of next.attributes)if(current.getAttribute(attr.name)!==attr.value)current.setAttribute(attr.name,attr.value);
 const candidate=current.hasAttribute('data-number')||records.has(current)||current.tagName==='STRONG'||current.tagName==='B'||current.id==='planned-demand'||current.id==='planned-stock'||current.classList.contains('wm-revenue-value')||current.classList.contains('wm-otif-number')||current.parentElement?.classList.contains('wm-deltas')||(current.tagName==='H3'&&current.parentElement?.classList.contains('wm-markdowns'));
 if(candidate&&current.matches(selector)&&numberHost(current,next))return;
 if(records.has(current)){removeRecord(current);current.replaceChildren();}
 patchChildren(current,next);
}
function patchChildren(parent,source){
 const previous=[...parent.childNodes],keyed=new Map(previous.map(n=>[key(n),n]).filter(([k])=>k));
 let cursor=parent.firstChild;
 for(const next of [...source.childNodes]){
  const k=key(next);let current=k?keyed.get(k):cursor&&!key(cursor)?cursor:null;
  if(!compatible(current,next))current=null;
  if(current){if(current!==cursor)parent.insertBefore(current,cursor);patchNode(current,next);}
  else{current=next.cloneNode(true);parent.insertBefore(current,cursor);hydrate(current);}
  cursor=current.nextSibling;
 }
 while(cursor){const next=cursor.nextSibling;dispose(cursor);cursor.remove();cursor=next;}
}
function html(host,markup){if(markupCache.get(host)===markup)return;markupCache.set(host,markup);const template=document.createElement('template');template.innerHTML=markup;prepareNumbers(template.content);patchChildren(host,template.content);}
function set(host,text){
 text=String(text);if(!host)return;
 if(host.matches(textSelector)){html(host,'<wm-text>'+numericText(text)+'</wm-text>');return;}
 if(host.matches(selector)){const source=host.cloneNode(false);source.textContent=text;if(numberHost(host,source))return;}
 removeRecord(host);if(host.textContent!==text)host.textContent=text;
}
function stopAll(){if(root.classList.contains('motion-off')||reduced.matches)for(const r of [...active])settle(r);}
new MutationObserver(stopAll).observe(root,{attributes:true,attributeFilter:['class']});
reduced.addEventListener('change',stopAll);
window.WalmartUI={html,set};prepareNumbers(document.body);hydrate(document.body);
})();
