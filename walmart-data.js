/* Deterministic fictional records. All views and downloads share this model. */
(function (root) {
  'use strict';
  function build(products, source) {
    const prices = [34,14,22,12,9,24,18,16,21,15,11,27];
    const categories = ['Tabletop','Kitchen tools','Storage','Kitchen textiles','Bakeware','Storage','Bath textiles','Bath textiles','Shower','Bath accessories','Bath textiles','Bath accessories'];
    const items = products.map((p,i)=>({...p,index:i,price:prices[i],category:categories[i],supply:i%3===1?'Domestic':'DI',doors:42+i*7,consumerId:'C'+(81001+i),vendorId:'V'+(4101+i)}));
    const itemMap = new Map(items.map(p=>[p.id,p]));
    function enrich(r) {
      const p=itemMap.get(r.product.id),i=p.index,w=r.week;
      const storeSales=r.actual*p.price;
      const onlineUnits=Math.round(r.actual*(.17+(i%4)*.047));
      const onlineSales=onlineUnits*p.price;
      const unmatched=i%5===0?Math.round(onlineSales*.04):0;
      const oneP=Math.round((onlineSales-unmatched)*(p.supply==='DI'?.66:.82));
      const lastYearSales=Math.round((storeSales+onlineSales)/(1.04+.13*Math.sin(i*.7+w*.2)));
      const instock=Math.max(.72,Math.min(.992,.91+.06*Math.sin(i*.6+w*.3)-(r.stock/r.actual<.5?.17:0)));
      const type=i%5===0?'Clearance':i%5===4?'Markup':'Promotion';
      const markdownUnits=Math.round(r.actual*(type==='Clearance'?.16:.05));
      const markdownAmount=Math.round(markdownUnits*p.price*(type==='Clearance'?.35:.14))*(type==='Markup'?-1:1);
      const forward=Array.from({length:4},(_,j)=>{
        const demand=Math.round(p.base*(1.12+.045*j+.07*Math.sin(w*.3+i*.4+j)));
        const orders=Math.round(demand*(i%4===0?.72:i%4===1?1.12:.94)+j*3);
        return {week:w+j+1,demand,orders};
      });
      return {...r,product:p,storeSales,onlineUnits,onlineSales,onlineStock:Math.round(p.stock*(.38+.08*Math.sin(w*.4+i))),oneP,threeP:onlineSales-unmatched-oneP,unmatched,totalSales:storeSales+onlineSales,lastYearSales,instock,doors:p.doors,
        dcStock:Math.round(p.base*(2.7+.3*Math.cos(w+i))),importStock:p.supply==='DI'?Math.round(p.base*(2.1+.2*Math.sin(w+i))):0,
        dcOnOrder:Math.round(p.base*(1.3+.2*Math.cos(w*.5+i))),dcReceived:Math.round(r.actual*(.8+.1*Math.sin(i+w))),dcShipped:Math.round(r.actual*(.94+.1*Math.cos(i+w))),
        dcOOS:Math.round(r.actual*(i%4===0?.09:.012)),returns:Math.round(storeSales*(.012+i%3*.006)),markdownType:type,markdownUnits,markdownAmount,markdownLastYear:Math.round(markdownAmount/(1.08+.12*Math.sin(i+w*.4))),affectedStores:Math.min(p.doors,Math.max(1,Math.round(p.doors*.17))),forward};
    }
    const rows=source.map(enrich);
    const prior=products.map(p=>enrich({product:p,week:0,actual:Math.round(p.base*.72),stock:Math.round(p.stock*1.15),forecast:Math.round(p.base*.74),runWeek:-1}));
    const all=[...prior,...rows];
    const sum=(list,key)=>list.reduce((n,r)=>n+(r[key]??0),0);
    function select(week,scope='overall',item='',supply='all') {return all.filter(r=>r.week===week&&(scope==='overall'||r.product.department===scope)&&(!item||r.product.id===item)&&(supply==='all'||r.product.supply===supply));}
    function totals(list) {
      const out={};
      for(const k of ['actual','stock','storeSales','onlineSales','onlineUnits','onlineStock','oneP','threeP','unmatched','totalSales','lastYearSales','doors','dcStock','importStock','dcOnOrder','dcReceived','dcShipped','dcOOS','returns','markdownAmount','markdownUnits'])out[k]=sum(list,k);
      const matched=list.filter(r=>r.forecast!=null);
      out.forecast=matched.length?sum(matched,'forecast'):null;
      out.matchedActual=matched.length?sum(matched,'actual'):null;
      out.matched=matched.length;out.count=list.length;
      out.instock=list.length?sum(list,'instock')/list.length:null;
      out.cover=out.actual?out.stock/out.actual:null;
      out.itemDoor=out.doors?out.stock/out.doors:null;
      out.forward=Array.from({length:4},(_,j)=>({week:list[0]?.forward[j].week,demand:list.reduce((n,r)=>n+r.forward[j].demand,0),orders:list.reduce((n,r)=>n+r.forward[j].orders,0)}));
      out.demand4=sum(out.forward,'demand');out.orders4=sum(out.forward,'orders');
      out.forwardCover=out.demand4?out.stock/(out.demand4/4):null;
      out.orderCoverage=out.demand4?out.orders4/out.demand4:null;
      return out;
    }
    // OTIF is supplier-wide context, deliberately independent of product/department.
    const onTimeRates=[.935,.913,.951,.889,.902,.942,.960,.927,.947,.966,.951,.973];
    const inFullRates=[.961,.948,.932,.947,.909,.938,.971,.945,.955,.978,.962,.983];
    const otif=Array.from({length:12},(_,i)=>{
      const total=980+i*23,onTime=Math.round(total*onTimeRates[i]),inFull=Math.round(total*inFullRates[i]);
      const both=Math.max(onTime+inFull-total,Math.min(onTime,inFull)-Math.round(total*(.008+.009*(i%4)/3)));
      return {week:i+1,total,onTime,inFull,both};
    });
    function rollup(list,key){return [...new Set(list.map(r=>r.product[key]))].map(name=>({name,...totals(list.filter(r=>r.product[key]===name))}));}
    return {items,rows,all,select,totals,rollup,otif,sum};
  }
  root.WalmartModel={build};
})(typeof window==='undefined'?globalThis:window);
