/* Business overview and linked exploration. All data is synthetic. */
(()=>{
'use strict';
const $=id=>document.getElementById(id), model=WalmartModel.build(products,dataset);
const moneyFormat=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const money=n=>n==null?'—':moneyFormat.format(n);
const compactFormat=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1});
const compact=n=>compactFormat.format(n);
const pct=n=>n==null?'—':(n*100).toFixed(1)+'%';
const change=(a,b)=>b?(a/b-1):null;
const delta=n=>n==null?'—':(n>0?'+':'')+pct(n);
const metric=(label,value,sub='')=>`<div class="wm-metric"><span>${label}</span><strong>${value}</strong>${sub?`<small>${sub}</small>`:''}</div>`;
const pill=(text,tone='')=>`<span class="wm-pill ${tone}">${text}</span>`;
const sectionHead=(eyebrow,title,right='')=>`<div class="wm-heading"><div><p class="overline">${eyebrow}</p><h3>${title}</h3></div>${right}</div>`;
const tableHTML=(labels,rows)=>`<div class="wm-table-scroll" tabindex="0" role="region" aria-label="${labels[0]} comparison"><table class="wm-table"><thead><tr>${labels.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${labels.length}" class="wm-empty">No products match this view.</td></tr>`}</tbody></table></div>`;
const iconArrow='<span aria-hidden="true">↗</span>';
let activeModule='sales',supplyFilter='all',salesGroup='category',forwardIndex=0,otifMetric='both';
let salesFocus=false,opsFocus=false,eventType='all',eventSort='impact';
function selected(w=state.week,filter='all'){return model.select(w,state.scope,state.item,filter);}
function salesRows(w=state.week,filter='all'){return model.select(w,state.scope,salesFocus?state.item:'',filter);}
function scopeMode(kind,focused){return `<div class="wm-switch wm-scope-mode" aria-label="${kind} product scope"><button type="button" data-context="${kind}" data-focus="all" aria-pressed="${!focused}">All products</button><button type="button" data-context="${kind}" data-focus="item" aria-pressed="${focused}" ${!state.item?'disabled':''}>Selected product</button></div>`;}
function syncProductHighlight(){const id=state.preview||state.item;document.querySelectorAll('[data-item]').forEach(b=>{const on=b.dataset.item===id;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));b.closest('.pulse-row')?.classList.toggle('is-selected',on);});}
function trend(values,{height=110,color='#c4b0ff',label='Weekly trend',markers=false}={}){
 const width=500,valid=values.filter(v=>v!=null),hi=Math.max(...valid,1)*1.06,lo=Math.min(0,...valid),x=i=>12+i*(width-24)/Math.max(1,values.length-1),y=v=>height-17-(v-lo)/(hi-lo)*(height-34);
 let active=false;const path=values.map((v,i)=>{if(v==null){active=false;return ''}const cmd=active?'L':'M';active=true;return `${cmd}${x(i).toFixed(1)},${y(v).toFixed(1)}`}).join(' ');
 return `<svg class="wm-trend" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><path d="M12 ${height-17}H488" stroke="#ffffff12"/><path class="wm-line" d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${markers?values.map((v,i)=>v==null?'':`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${color}"/>`).join(''):''}</svg>`;
}
function overview(){
 const t=model.totals(selected()),prev=model.totals(selected(state.week-1));
 const history=Array.from({length:12},(_,i)=>model.totals(selected(i+1)).totalSales);
 WalmartUI.html($('overview'),`<div class="wm-overview-top"><div><p class="overline">01 / The weekly picture</p><h2 id="overview-title">A week in motion.</h2></div>${pill('Simulated · '+weekName(state.week))}</div><div class="wm-overview-grid"><div class="wm-revenue"><span class="wm-label">Combined sales</span><div class="wm-revenue-value">${money(t.totalSales)}</div><div class="wm-deltas"><span>${delta(change(t.totalSales,prev.totalSales))} <small>WoW</small></span><span>${delta(change(t.totalSales,t.lastYearSales))} <small>YoY</small></span></div>${trend(history,{label:'Combined sales across twelve simulated weeks'})}<div class="wm-trend-axis"><span>W01</span><span>W12</span></div></div><div class="wm-overview-side">${metric('In-stock',pct(t.instock),'Across selected items')}${metric('Store stock cover',t.cover?.toFixed(2)+' <em>wks</em>','Ending stock / weekly POS')}${metric('Next 4w order support',pct(t.orderCoverage),'Orders / forecast demand')}</div></div><div class="wm-insights"><button type="button" data-story="stock"><i class="wm-signal mint"></i><span>Demand outpaced stock</span>${iconArrow}</button><button type="button" data-story="slow"><i class="wm-signal pink"></i><span>Inventory lingered</span>${iconArrow}</button><button type="button" data-story="missing"><i class="wm-signal blue"></i><span>A forecast went missing</span>${iconArrow}</button></div>`);
}
function groupSales(){
 const list=salesRows(state.week,supplyFilter),groups=model.rollup(list,salesGroup),previous=salesRows(state.week-1,supplyFilter);
 return tableHTML([salesGroup==='category'?'Business category':'Department','Store','eComm','Total','WoW','YoY','Stock cover','MUMD'],groups.map(g=>{
 const old=model.totals(previous.filter(r=>r.product[salesGroup]===g.name));
 return [`<span class="wm-name">${g.name}</span>`,money(g.storeSales),money(g.onlineSales),money(g.totalSales),delta(change(g.totalSales,old.totalSales)),delta(change(g.totalSales,g.lastYearSales)),(g.cover==null?'—':g.cover.toFixed(2))+' wks',money(g.markdownAmount)];
 }));
}
function sales(){
 const t=model.totals(salesRows()),online=t.totalSales?t.onlineSales/t.totalSales:0;
 const parts=[['Store',t.storeSales,'#c6b5ed'],['eComm 1P',t.oneP,'#8ecbd9'],['eComm 3P',t.threeP,'#8ec7ae'],['Unmatched',t.unmatched,'#ae899f']];
 const split=['DI','Domestic'].map(name=>({name,...model.totals(salesRows().filter(r=>r.product.supply===name))}));
 WalmartUI.html($('panel-sales'),`${sectionHead('Channels','Every channel, connected.',pill((salesFocus?activeProduct()?.name:state.scope==='overall'?'All products':state.scope+' / All products')+' · '+weekName(state.week)))}<div class="wm-sales-context">${scopeMode('sales',salesFocus)}</div><div class="wm-channel-grid"><div class="wm-channel-visual"><div class="wm-orbit" style="--online:${online*100}%"><div><strong>${pct(online)}</strong><span>eComm share</span></div></div><div class="wm-channel-legend">${parts.map(([name,value,color])=>`<div><span><i style="background:${color}"></i>${name}</span><strong>${money(value)}</strong></div>`).join('')}</div></div><div class="wm-supply-mix">${sectionHead('Supply model','DI / Domestic')}${split.map(g=>`<div class="wm-mix-row"><div><span>${g.name}</span><strong>${money(g.totalSales)}</strong></div><div class="wm-track"><i style="--length:${(t.totalSales?g.totalSales/t.totalSales*100:0)}%;--color:${g.name==='DI'?'#bca7df':'#91c9b4'}"></i></div><small>${pct(t.totalSales?g.totalSales/t.totalSales:0)} of selected sales · ${(g.cover==null?'—':g.cover.toFixed(2))} weeks of stock${g.count?'':' · No items in selection'}</small></div>`).join('')}<div class="wm-inline-metrics">${metric('Gross returns',money(t.returns))}${metric('Store POS units',units(t.actual))}${metric('eComm stock',units(t.onlineStock))}</div></div></div><div class="wm-breakdown-head"><div class="wm-switch" aria-label="Sales breakdown">${['category','department'].map(g=>`<button type="button" data-group="${g}" aria-pressed="${salesGroup===g}">${g==='category'?'Category':'Department'}</button>`).join('')}</div><div class="wm-switch" aria-label="Supply model filter">${['all','DI','Domestic'].map(g=>`<button type="button" data-supply="${g}" aria-pressed="${supplyFilter===g}">${g==='all'?'All supply':g}</button>`).join('')}</div></div>${groupSales()}<details class="wm-method"><summary>Measures</summary><p>Combined sales = store POS + eComm authorized sales, before returns. 1P / 3P describe the supplier mapping; unmatched stays separate. All amounts and year-ago comparisons are fictional.</p></details>`);
}
function supply(){
 const list=selected(),t=model.totals(list),f=t.forward[forwardIndex],max=Math.max(...t.forward.flatMap(x=>[x.demand,x.orders]),1);
 const lastWeeks=Array.from({length:Math.min(4,state.week)},(_,i)=>state.week-i),hist=lastWeeks.flatMap(w=>selected(w));
 let balanceByItem=list.map(r=>r.stock),unmet=0;
 for(let j=0;j<=forwardIndex;j++)list.forEach((r,i)=>{const next=balanceByItem[i]+r.forward[j].orders-r.forward[j].demand;unmet+=Math.max(0,-next);balanceByItem[i]=Math.max(0,next);});
 WalmartUI.html($('panel-supply'),`${sectionHead('Supply & availability','Follow the flow.',pill('Run '+weekName(state.week)))}<div class="wm-flow"><article><span>01 / Distribution</span><strong>${units(t.dcStock)}</strong><small>Replenishment DC units</small></article><div class="wm-flow-link"><i></i><span><b data-number>${units(t.dcShipped)}</b><small>shipped</small></span></div><article><span>02 / Stores</span><strong>${units(t.stock)}</strong><small>Ending stock units</small></article><div class="wm-flow-link"><i></i><span><b data-number>${pct(t.instock)}</b><small>in-stock</small></span></div><article><span>03 / Customers</span><strong>${units(t.actual)}</strong><small>Weekly POS units</small></article></div><div class="wm-stat-strip">${metric('Import storage',units(t.importStock))}${metric('DC on order',units(t.dcOnOrder))}${metric('DC received',units(t.dcReceived))}${metric('DC out of stock',units(t.dcOOS))}</div><div class="wm-forward-layout"><div><div class="wm-heading"><div><p class="overline">The next four weeks</p><h3>Demand meets arrivals.</h3></div></div><div class="wm-bar-legend"><span><i></i>Forecast</span><span><i></i>Scheduled orders</span></div><div class="wm-forward-bars">${t.forward.map((r,i)=>`<button type="button" data-forward="${i}" aria-pressed="${i===forwardIndex}" aria-label="${weekName(r.week)}, forecast ${r.demand}, scheduled orders ${r.orders}"><div class="wm-bar-pair"><i style="--height:${r.demand/max*100}%"></i><i style="--height:${r.orders/max*100}%"></i></div><span>${weekName(r.week)}</span></button>`).join('')}</div></div><div class="wm-forward-detail" aria-live="polite"><span class="overline">${weekName(f.week)} / Arrival window</span><div class="wm-inline-metrics">${metric('Demand',units(f.demand))}${metric('Orders',units(f.orders))}</div><div class="wm-forward-balance"><span>Projected stock</span><strong>${units(balanceByItem.reduce((a,b)=>a+b,0))}</strong><small>${unmet?units(unmet)+' cumulative unmet units':'Demand covered through '+weekName(f.week)}</small></div></div></div><div class="wm-stat-strip">${metric('4w forecast',units(t.demand4))}${metric('4w order support',pct(t.orderCoverage))}${metric('Forward stock cover',t.forwardCover.toFixed(2)+' <em>wks</em>')}${metric('Stock / item-door',t.itemDoor.toFixed(2))}</div><div class="wm-availability"><span>In-stock</span><div class="wm-track"><i style="--length:${t.instock*100}%;--color:#91c9b4"></i></div><strong>${pct(t.instock)}</strong><span>${lastWeeks.length===4?'Last 4w':lastWeeks.length+'w available'}</span><strong>${pct(model.totals(hist).instock)}</strong></div><details class="wm-method"><summary>Supply assumptions</summary><p>Orders arrive before demand in each target week. Stock carries forward by product; shortages cannot be offset with another product. DC received and shipped are weekly flows. DC and store balances are ending snapshots. Forward cover = store stock / average weekly demand over the next four weeks.</p></details>`);
}
function operationRows(w=state.week){return model.select(w,state.scope,opsFocus?state.item:'');}
const reliabilitySeries=[['both','OTIF','#c4b0ff'],['onTime','On time','#8ecbd9'],['inFull','In full','#91c9b4']];
function otifChart(){
 const rows=model.otif.slice(rangeStart()-1),width=500,height=174,x=i=>40+i*444/(rows.length-1),y=v=>144-(v-.75)/.25*128;
 const grid=[.75,.8,.9,1].map(v=>`<line x1="40" x2="484" y1="${y(v)}" y2="${y(v)}" stroke="#ffffff0b"/><text x="30" y="${y(v)+3}" text-anchor="end">${Math.round(v*100)}%</text>`).join('');
 const paths=reliabilitySeries.map(([key,,color])=>`<path d="${rows.map((r,i)=>`${i?'L':'M'}${x(i)},${y(r[key]/r.total)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${key===otifMetric?2.6:1.6}" opacity="${key===otifMetric?1:.45}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
 const index=state.week-rangeStart(),r=model.otif[state.week-1];
 const dots=reliabilitySeries.map(([key,,color])=>`<circle data-otif-dot="${key}" cx="${x(index)}" cy="${y(r[key]/r.total)}" r="3.5" fill="${color}" stroke="#12101b" stroke-width="2"/>`).join('');
 return `<svg id="otif-chart" class="wm-otif-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="OTIF, on-time and in-full delivery rates. Vertical scale 75 to 100 percent. Select a week below.">${grid}${paths}<line id="otif-crosshair" x1="${x(index)}" x2="${x(index)}" y1="12" y2="144" stroke="#d9c6ee55" stroke-dasharray="3 4"/>${dots}</svg><div class="wm-otif-weeks" style="--weeks:${rows.length}">${rows.map(r=>`<button type="button" data-otif-week="${r.week}" aria-pressed="${r.week===state.week}" aria-label="Inspect reliability in ${weekName(r.week)}">${weekName(r.week)}</button>`).join('')}</div>`;
}
let inspectedOtif="",otifFrame=0;
function otifReadout(week){
 const signature=[week,otifMetric,state.range].join("/");if(signature===inspectedOtif)return;inspectedOtif=signature;
 const r=model.otif[week-1];if(!$('otif-readout'))return;
 WalmartUI.set($('otif-readout'),pct(r[otifMetric]/r.total));
 WalmartUI.set($('otif-context'),`${weekName(week)} · ${units(r[otifMetric])} / ${units(r.total)} eligible deliveries`);
 for(const[key]of reliabilitySeries){WalmartUI.set($('otif-'+key),pct(r[key]/r.total));const dot=document.querySelector(`[data-otif-dot="${key}"]`);dot?.setAttribute('cx',40+(week-rangeStart())*444/(state.range-1));dot?.setAttribute('cy',144-(r[key]/r.total-.75)/.25*128);}
 const x=40+(week-rangeStart())*444/(state.range-1);$('otif-crosshair')?.setAttribute('x1',x);$('otif-crosshair')?.setAttribute('x2',x);
 document.querySelectorAll('[data-otif-week]').forEach(b=>b.classList.toggle('is-inspected',+b.dataset.otifWeek===week));
}
function operations(){
 inspectedOtif="";
 const list=operationRows(),filtered=eventType==='all'?list:list.filter(r=>r.markdownType===eventType),t=model.totals(filtered),o=model.otif[state.week-1];
 const types=['Clearance','Promotion','Markup'].map(name=>({name,rows:list.filter(r=>r.markdownType===name)}));
 const max=Math.max(1,...types.map(g=>Math.abs(model.sum(g.rows,'markdownAmount'))));
 const events=[...filtered].sort((a,b)=>eventSort==='units'?b.markdownUnits-a.markdownUnits:Math.abs(b.markdownAmount)-Math.abs(a.markdownAmount));
 const history=Array.from({length:state.range},(_,i)=>{const w=rangeStart()+i,rr=operationRows(w);return{week:w,amount:model.sum(eventType==='all'?rr:rr.filter(r=>r.markdownType===eventType),'markdownAmount')}}),histMax=Math.max(1,...history.map(r=>Math.abs(r.amount)));
 WalmartUI.html($('panel-operations'),`${sectionHead('Operations','The pressure behind performance.')}
 <div class="wm-operations-grid"><div class="wm-otif"><div class="wm-heading"><h3>Supply reliability</h3>${pill('Supplier-wide')}</div><div class="wm-switch" aria-label="Reliability metric">${reliabilitySeries.map(([key,label,color])=>`<button type="button" data-otif="${key}" aria-pressed="${otifMetric===key}"><i style="background:${color}"></i>${label}</button>`).join('')}</div><div class="wm-otif-number" id="otif-readout">${pct(o[otifMetric]/o.total)}</div><p id="otif-context">${weekName(state.week)} · ${units(o[otifMetric])} / ${units(o.total)} eligible deliveries</p>${otifChart()}<div class="wm-otif-metrics">${reliabilitySeries.map(([key,label,color])=>`<div><span style="color:${color}">${label}</span><strong id="otif-${key}">${pct(o[key]/o.total)}</strong></div>`).join('')}</div><small>Supplier-wide · select a week to inspect</small></div>
 <div class="wm-markdowns"><div class="wm-md-top"><p class="overline">Markup & markdowns</p><button type="button" data-event-type="all" class="wm-small-button" aria-pressed="${eventType==='all'}">All types</button></div><h3>${money(t.markdownAmount)} <span>${eventType==='all'?'net pressure':eventType+' impact'}</span></h3>${types.map(g=>{const amount=model.sum(g.rows,'markdownAmount'),old=model.sum(operationRows(state.week-1).filter(r=>r.markdownType===g.name),'markdownAmount');return `<button type="button" class="wm-type-row ${eventType===g.name?'selected':''}" data-event-type="${g.name}" aria-pressed="${eventType===g.name}"><span><span>${g.name}</span><strong>${money(amount)}</strong></span><span class="wm-track"><i style="--length:${Math.abs(amount)/max*100}%;--color:${amount<0?'#91c9b4':'#d5a5bd'}"></i></span><small>${g.rows.length} products · ${delta(change(Math.abs(amount),Math.abs(old)))} WoW</small></button>`}).join('')}<div class="wm-md-history" aria-label="Weekly markdown pressure">${history.map(r=>`<button type="button" data-pressure-week="${r.week}" aria-pressed="${r.week===state.week}" aria-label="${weekName(r.week)} net pressure ${money(r.amount)}"><i style="--height:${Math.max(4,Math.abs(r.amount)/histMax*100)}%;--bar-color:${r.amount<0?'#91c9b4':'#d5a5bd'}"></i><span>${weekName(r.week)}</span></button>`).join('')}</div><div class="wm-inline-metrics">${metric('Affected units',units(t.markdownUnits))}${metric('Gross returns',money(model.totals(list).returns))}</div></div></div>
 <div class="wm-heading wm-events-head"><div><h3>Item events</h3><span class="wm-event-count">${events.length} ${events.length===1?'product':'products'} · ${weekName(state.week)} · ${state.scope==='overall'?'Overall':state.scope}${eventType==='all'?'':' · '+eventType}</span></div>${scopeMode('operations',opsFocus)}</div><div class="wm-event-sort"><span>Sort</span><div class="wm-switch" aria-label="Event sort">${[['impact','Impact'],['units','Units']].map(([key,label])=>`<button type="button" data-event-sort="${key}" aria-pressed="${eventSort===key}">${label}</button>`).join('')}</div></div>${tableHTML(['Product / supply','Event','Net amount','Units','Stores','% of store sales'],events.map(r=>[`<button type="button" class="wm-text-product" data-item="${r.product.id}" aria-haspopup="dialog">${r.product.name} ${iconArrow}<small>${r.product.supply}</small></button>`,r.markdownType,money(r.markdownAmount),units(r.markdownUnits),units(r.affectedStores),pct(r.markdownAmount/r.storeSales)]))}<details class="wm-method"><summary>Measures</summary><p>OTIF counts deliveries meeting both on-time and in-full criteria. Supplier metrics are independent of product filters. Positive MUMD amounts indicate markdown pressure; markups offset the total. Event types filter the table and weekly bars. All figures are simulated.</p></details>`);
 syncProductHighlight();
}

function setModule(name,focus=false){
 activeModule=name;
 document.querySelectorAll('[data-module]').forEach(b=>{const on=b.dataset.module===name;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;if(on&&focus)b.focus();});
 ['sales','supply','forecast','operations'].forEach(t=>$('panel-'+t).hidden=t!==name);
 renderActive();
 if(name==='forecast')requestAnimationFrame(()=>{drawCharts();updateDiagnostics()});
}
function renderActive(){if(activeModule==='sales')sales();else if(activeModule==='supply')supply();else if(activeModule==='operations')operations();}
let overviewVisible=true,overviewDirty=false;
function render(){
 if(!state.item){salesFocus=false;opsFocus=false;}
 if(overviewVisible){overview();overviewDirty=false}else overviewDirty=true;renderActive();syncProductHighlight();
 WalmartUI.html($('wm-context'),`${state.item?`<button type="button" data-clear-selection>${activeProduct().name} <span aria-hidden="true">×</span></button>`:departments[state.scope]}`);
 document.querySelectorAll('#product-pulse [data-item]').forEach(b=>{b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls','wm-quicklook');});
}
// A quick look is independent of the analysis selection until Explore is chosen.
const quick=document.createElement('div');quick.id='wm-quicklook';quick.className='wm-quicklook';quick.setAttribute('popover','auto');quick.setAttribute('role','dialog');quick.setAttribute('aria-labelledby','quick-title');document.body.append(quick);
let quickAnchor=null,quickId='';
function positionQuick(){
 if(!quick.matches(':popover-open'))return;
 if(innerWidth<=650){quick.style.removeProperty('left');quick.style.removeProperty('top');return;}
 const a=quickAnchor.getBoundingClientRect(),w=quick.offsetWidth,h=quick.offsetHeight;
 const x=a.right+12+w<=innerWidth-16?a.right+12:Math.max(16,a.left-w-12);
 const y=Math.max(16,Math.min(a.top-12,innerHeight-h-16));
 quick.style.left=x+'px';quick.style.top=y+'px';
}
function closeQuick(restore=false){quickAnchor?.setAttribute('aria-expanded','false');if(!quick.matches(':popover-open'))return;quick.hidePopover();if(restore&&quickAnchor?.isConnected)quickAnchor.focus({preventScroll:true});}
function openQuick(button){
 const id=button.dataset.item;if(quick.matches(':popover-open')&&quickId===id){closeQuick(true);return;}
 closeQuick();stopPlayback();quickId=id;quickAnchor=button;state.preview=id;syncProductHighlight();
 const r=model.select(state.week,'overall',id)[0],cover=r.actual?r.stock/r.actual:null,gap=r.forecast!=null&&r.forecast>0?r.actual/r.forecast-1:null;
 WalmartUI.html(quick,`<div class="wm-quick-head">${productIcon(r.product)}<div><span>${r.product.department} · ${weekName(state.week)}</span><h3 id="quick-title">${r.product.name}</h3></div><button type="button" data-close-quick aria-label="Close product preview">×</button></div><div class="wm-quick-metrics">${metric('Actual',units(r.actual))}${metric('Forecast',units(r.forecast))}${metric('Ending stock',units(r.stock))}${metric('Stock cover',cover?.toFixed(2)+' <em>wks</em>')}</div><div class="wm-quick-trend">${productSpark(r.product,280,55,true)}<div><span>Actual / Forecast · 12w</span><span>${gap==null?'Forecast unavailable':delta(gap)+' gap'}</span></div></div><button type="button" class="wm-explore" data-explore-item="${id}">Explore product ${iconArrow}</button>`);
 quick.showPopover();positionQuick();button.setAttribute('aria-expanded','true');
 quick.querySelector('[data-close-quick]').focus({preventScroll:true});
}
quick.addEventListener('toggle',e=>{if(e.newState==='closed'&&quickAnchor)quickAnchor.setAttribute('aria-expanded','false');});
addEventListener('resize',positionQuick);addEventListener('scroll',positionQuick,true);
quick.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeQuick(true);}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.id==='reset-view'){supplyFilter='all';salesFocus=false;opsFocus=false;eventType='all';eventSort='impact';forwardIndex=0;otifMetric='both';render();setModule('sales');return;}
 if(b.dataset.item){openQuick(b);return;}
 if(b.hasAttribute('data-close-quick')){closeQuick(true);return;}
 if(b.dataset.exploreItem){const id=b.dataset.exploreItem;closeQuick();state.item=id;syncSelectors();renderWeek();setModule('forecast');$('explorer-title').setAttribute('tabindex','-1');$('explorer-title').focus({preventScroll:true});focusCharts();return;}
 if(b.dataset.context){if(b.dataset.context==='sales'){salesFocus=b.dataset.focus==='item';sales();}else{opsFocus=b.dataset.focus==='item';eventType='all';operations();}document.querySelector(`[data-context="${b.dataset.context}"][data-focus="${b.dataset.focus}"]`)?.focus({preventScroll:true});return;}
 if(b.dataset.eventType){eventType=b.dataset.eventType;operations();document.querySelector(`[data-event-type="${eventType}"]`)?.focus({preventScroll:true});return;}
 if(b.dataset.eventSort){eventSort=b.dataset.eventSort;operations();document.querySelector(`[data-event-sort="${eventSort}"]`)?.focus({preventScroll:true});return;}
 if(b.dataset.otifWeek||b.dataset.pressureWeek){stopPlayback();const w=Number(b.dataset.otifWeek||b.dataset.pressureWeek),key=b.dataset.otifWeek?'otif':'pressure';changeWeek(w);document.querySelector(`[data-${key}-week="${w}"]`)?.focus({preventScroll:true});return;}
 if(b.dataset.module){closeQuick();setModule(b.dataset.module);return;}
 if(b.dataset.supply){supplyFilter=b.dataset.supply;sales();$('panel-sales').querySelector(`[data-supply="${supplyFilter}"]`).focus({preventScroll:true});return;}
 if(b.dataset.group){salesGroup=b.dataset.group;sales();$('panel-sales').querySelector(`[data-group="${salesGroup}"]`).focus({preventScroll:true});return;}
 if(b.dataset.forward!=null){forwardIndex=+b.dataset.forward;supply();$('panel-supply').querySelector(`[data-forward="${forwardIndex}"]`).focus({preventScroll:true});return;}
 if(b.dataset.otif){otifMetric=b.dataset.otif;operations();$('panel-operations').querySelector(`[data-otif="${otifMetric}"]`).focus({preventScroll:true});return;}
 if(b.hasAttribute('data-clear-selection')){state.item='';state.preview='';syncSelectors();renderWeek();return;}
 if(b.dataset.story){const examples={stock:['D14','D14-104',10],slow:['D20','D20-201',12],missing:['D20','D20-203',9]};stopPlayback();showExample(...examples[b.dataset.story]);setModule('forecast');focusCharts();return;}
 if(b.id==='export')exportRecords();
});
document.querySelector('.wm-tabs').addEventListener('keydown',e=>{const tabs=['sales','supply','forecast','operations'];let i=tabs.indexOf(activeModule);if(e.key==='ArrowRight')i=(i+1)%4;else if(e.key==='ArrowLeft')i=(i+3)%4;else if(e.key==='Home')i=0;else if(e.key==='End')i=3;else return;e.preventDefault();setModule(tabs[i],true);});
document.addEventListener('walmart:change',()=>{closeQuick();render();});
function download(name,content,type){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([content],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function exportRecords(){
 const fields=['data_type','product_id','product_name','department','supply_model','category','week','forecast_run','pos_units','forecast_units','ending_store_units','store_sales_usd','ecomm_sales_usd','ecomm_1p_usd','ecomm_3p_usd','ecomm_unmatched_usd','ecomm_stock_units','instock','dc_oh','import_oh','dc_on_order','dc_received','dc_shipped','dc_oos','returns_usd','mumd_type','mumd_usd','mumd_units','next4_demand_units','next4_order_units'];
 const records=model.rows.filter(r=>inSelection(r)&&r.week>=rangeStart()).map(r=>['synthetic',r.product.id,r.product.name,r.product.department,r.product.supply,r.product.category,weekName(r.week),r.runWeek==null?'':weekName(r.runWeek),r.actual,r.forecast??'',r.stock,r.storeSales,r.onlineSales,r.oneP,r.threeP,r.unmatched,r.onlineStock,r.instock.toFixed(4),r.dcStock,r.importStock,r.dcOnOrder,r.dcReceived,r.dcShipped,r.dcOOS,r.returns,r.markdownType,r.markdownAmount,r.markdownUnits,model.sum(r.forward,'demand'),model.sum(r.forward,'orders')]);
 const csv=[fields,...records].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
 download('walmart-synthetic-'+(state.item||state.scope)+'.csv',csv,'text/csv;charset=utf-8');window.portfolioToast?.('Selected records exported');
}
let otifX=0;
document.addEventListener('pointermove',e=>{const chart=e.target.closest('#otif-chart');if(!chart||e.pointerType==='touch')return;otifX=e.clientX;if(!otifFrame)otifFrame=requestAnimationFrame(()=>{otifFrame=0;const r=chart.getBoundingClientRect(),x=(otifX-r.left)/r.width*500;const w=rangeStart()+Math.round(Math.max(0,Math.min(1,(x-40)/444))*(state.range-1));otifReadout(w)});},{passive:true});
 document.addEventListener('pointerout',e=>{const chart=e.target.closest('#otif-chart');if(chart&&!chart.contains(e.relatedTarget)){cancelAnimationFrame(otifFrame);otifFrame=0;otifReadout(state.week);}});
 document.addEventListener('click',e=>{const chart=e.target.closest('#otif-chart');if(!chart)return;const r=chart.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*500;stopPlayback();changeWeek(rangeStart()+Math.round(Math.max(0,Math.min(1,(x-40)/444))*(state.range-1)));});
 render();setModule('sales');
 new IntersectionObserver(entries=>{overviewVisible=entries[0].isIntersecting;if(overviewVisible&&overviewDirty){overview();overviewDirty=false}},{rootMargin:'100px'}).observe($('overview'));
})();
