(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fmt=n=>Math.round(n).toLocaleString('en-US');
const eur=new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'});

/* ---------- toast ---------- */
let tT; function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(tT);tT=setTimeout(()=>t.hidden=true,3200);}

/* ---------- router ---------- */
const pages=$$('.page');
let pendingAnchor=null;
function route(){
  let id=(location.hash||'#home').slice(1);
  if(id==='dance'){id='bees';pendingAnchor='dance';}
  if(!document.getElementById('page-'+id)) id='home';
  pages.forEach(p=>p.hidden=p.dataset.page!==id);
  $$('[data-nav]').forEach(a=>{if(a.dataset.nav===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('#navLinks').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');
  if(pendingAnchor){const el=document.getElementById(pendingAnchor);pendingAnchor=null;requestAnimationFrame(()=>el&&el.scrollIntoView({behavior:reduce?'auto':'smooth'}));}
  else window.scrollTo(0,0);
  requestAnimationFrame(()=>{if(id==='home')hero.resize();if(id==='bees')waggle.resize();});
}
window.addEventListener('hashchange',route);

$('#menuBtn').addEventListener('click',e=>{const n=$('#navLinks');const o=n.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',o);});

/* ---------- hero comb canvas ---------- */
const hero=(function(){
  const c=$('#comb'),ctx=c.getContext('2d');
  let W=0,H=0,R=26,cells=[],bees=[],col={},last=0,t0=performance.now();
  function colors(){col={fill:css('--comb-fill'),cap:css('--comb-cap'),line:css('--band-line'),ink:css('--band-ink'),pollen:css('--pollen'),wing:css('--wing')};}
  function resize(){
    const dpr=Math.min(2,devicePixelRatio||1);W=c.clientWidth;H=c.clientHeight;if(!W||!H)return;
    c.width=W*dpr;c.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    R=W<640?20:28;const w=R*1.5,h=Math.sqrt(3)*R;cells=[];
    for(let i=-1;i*w<W+R;i++)for(let j=-1;j*h<H+h;j++){
      const r=Math.random();cells.push({x:i*w,y:j*h+(i&1?h/2:0),lv:r<.42?0:r<.72?Math.random()*.9:1,cap:r>.86?1:0,rate:.00004+Math.random()*.00012});
    }
    bees=Array.from({length:W<640?3:5},()=>({ph:Math.random()*6.28,sp:.00018+Math.random()*.00016,ax:.18+Math.random()*.16,ay:.22+Math.random()*.16,cx:.6+Math.random()*.25,cy:.3+Math.random()*.4}));
    colors();draw(performance.now());
  }
  function hex(x,y,r){ctx.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k;ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}ctx.closePath();}
  function bee(x,y,ang,t){
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);
    const f=reduce?1:.6+.4*Math.abs(Math.sin(t*.09));
    ctx.fillStyle=col.wing;ctx.beginPath();ctx.ellipse(-1,-6*f,5,7*f,-.3,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(-1,6*f,5,7*f,.3,0,7);ctx.fill();
    ctx.fillStyle=col.ink;ctx.beginPath();ctx.ellipse(0,0,9,5.5,0,0,7);ctx.fill();
    ctx.fillStyle=col.pollen;ctx.fillRect(-4,-4.6,2.4,9.2);ctx.fillRect(1,-5,2.4,10);
    ctx.fillStyle=col.ink;ctx.beginPath();ctx.arc(9,0,3.5,0,7);ctx.fill();
    ctx.restore();
  }
  function draw(t){
    ctx.clearRect(0,0,W,H);const r=R-1.5;
    for(const cl of cells){
      hex(cl.x,cl.y,r);
      if(cl.cap){ctx.fillStyle=col.cap;ctx.fill();}
      else if(cl.lv>0){ctx.save();ctx.clip();ctx.fillStyle=col.fill;const top=cl.y+r-(2*r*cl.lv);ctx.fillRect(cl.x-r,top,2*r,cl.y+r-top+1);ctx.restore();hex(cl.x,cl.y,r);}
      ctx.strokeStyle=col.line;ctx.lineWidth=1.5;ctx.stroke();
    }
    for(const b of bees){
      const a=t*b.sp+b.ph,x=W*(b.cx+b.ax*Math.sin(a)),y=H*(b.cy+b.ay*Math.sin(2*a));
      const dx=b.ax*W*Math.cos(a),dy=2*b.ay*H*Math.cos(2*a);bee(x,y,Math.atan2(dy,dx),t);
    }
  }
  function loop(t){
    const dt=Math.min(64,t-(last||t));last=t;
    if(W&&c.offsetParent!==null&&!document.hidden){
      if((t-t0)>1000){colors();t0=t;}
      for(const cl of cells){
        if(cl.cap){if(Math.random()<.00004*dt){cl.cap=0;cl.lv=0;}continue;}
        if(cl.lv>0){cl.lv+=cl.rate*dt;if(cl.lv>=1){cl.lv=1;if(Math.random()<.004*dt)cl.cap=1;}}
        else if(Math.random()<.00003*dt)cl.lv=.02;
      }
      draw(t);
    }
    requestAnimationFrame(loop);
  }
  addEventListener('resize',()=>{if(c.offsetParent!==null)resize();});
  if(!reduce)requestAnimationFrame(loop);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{colors();draw(performance.now());});
  return {resize};
})();

/* ---------- spoon calculator ---------- */
function spoons(){
  const n=+$('#spoons').value;$('#spoonsVal').textContent=n;
  $('#outBees').textContent=fmt(n*12);
  $('#outFlowers').textContent=fmt(Math.round(n*2e6*7/454/100)*100);
  $('#outKm').textContent=fmt(Math.round(n*88500*7/454/10)*10)+' km';
  $('#swarm').innerHTML='<i></i>'.repeat(n*12);
}
$('#spoons').addEventListener('input',spoons);spoons();

/* ---------- bee drawings ---------- */
let beeId=0;
function beeSVG(mm,kind){
  const s=mm*5.2,hr=s*.11,tr=s*.15,al=s*.56,ah=kind==='drone'?s*.2:s*.17;
  const x0=4,cy=44,hx=x0+hr,tx=hx+hr+tr*.85,ax=tx+tr*.7+al/2,id='ab'+(beeId++);
  const W=Math.ceil(ax+al/2+6);
  let stripes='';for(let k=0;k<4;k++){const sx=ax-al*.25+k*al*.17;stripes+=`<rect x="${sx.toFixed(1)}" y="0" width="${(al*.075).toFixed(1)}" height="90" style="fill:var(--ink)"/>`;}
  const eye=kind==='drone'?`<ellipse cx="${hx-1}" cy="${cy-hr*.4}" rx="${hr*.7}" ry="${hr*.8}" style="fill:var(--muted)"/>`:'';
  return `<svg viewBox="0 0 ${W} 84" style="height:84px;width:${W}px" aria-hidden="true">
    <ellipse cx="${tx+tr*.4}" cy="${cy-tr*1.4}" rx="${s*.26}" ry="${s*.1}" transform="rotate(-14 ${tx} ${cy})" style="fill:var(--line)" opacity=".9"/>
    <clipPath id="${id}"><ellipse cx="${ax}" cy="${cy}" rx="${al/2}" ry="${ah}"/></clipPath>
    <ellipse cx="${ax}" cy="${cy}" rx="${al/2}" ry="${ah}" style="fill:var(--pollen)"/>
    <g clip-path="url(#${id})">${stripes}</g>
    <circle cx="${tx}" cy="${cy}" r="${tr}" style="fill:var(--ink)"/>
    <circle cx="${hx}" cy="${cy}" r="${hr}" style="fill:var(--ink)"/>${eye}
    <line x1="${x0}" y1="78" x2="${x0+s}" y2="78" style="stroke:var(--muted)" stroke-width="1.5"/>
    <line x1="${x0}" y1="74" x2="${x0}" y2="82" style="stroke:var(--muted)" stroke-width="1.5"/>
    <line x1="${x0+s}" y1="74" x2="${x0+s}" y2="82" style="stroke:var(--muted)" stroke-width="1.5"/>
  </svg>`;
}
$$('[data-bee]').forEach(el=>el.innerHTML=beeSVG(+el.dataset.bee,el.dataset.kind));

/* ---------- development chart ---------- */
(function(){
  const segC=['var(--wax)','var(--pollen)','var(--honey)'];
  const rows=[['Queen',[3,5.5,7.5]],['Worker',[3,6,12]],['Drone',[3,6.5,14.5]]],max=24;
  let h=`<div class="legend"><span><i style="background:${segC[0]};outline:1px solid var(--line)"></i>Egg</span><span><i style="background:${segC[1]}"></i>Larva</span><span><i style="background:${segC[2]}"></i>Pupa</span></div>`;
  rows.forEach(([n,d])=>{const tot=d.reduce((a,b)=>a+b,0);
    h+=`<div class="brow"><span class="nm">${n}</span><div class="track"><div class="bar" style="width:${tot/max*100}%">${d.map((v,i)=>`<div class="seg" style="width:${v/tot*100}%;background:${segC[i]}">${v}d</div>`).join('')}</div></div><span class="tot">${tot} days</span></div>`;});
  h+='<div class="axis" aria-hidden="true">'+[0,4,8,12,16,20,24].map(v=>`<span style="left:${v/max*100}%">${v}</span>`).join('')+'</div>';
  const el=$('#devChart');el.innerHTML=h;el.setAttribute('role','img');el.setAttribute('aria-label','Development days. Queen: egg 3, larva 5.5, pupa 7.5, total 16. Worker: 3, 6, 12, total 21. Drone: 3, 6.5, 14.5, total 24.');
})();

/* ---------- worker career ---------- */
(function(){
  const jobs=[
    ['Cleaner',1,2,'Polishes empty cells so the queen will lay in them.','var(--wax)'],
    ['Nurse',3,11,'Feeds larvae brood food and royal jelly, and tends the queen.','#F3D57A'],
    ['Builder',12,17,'Makes wax, builds comb, and packs pollen and nectar.','var(--pollen)'],
    ['Guard',18,21,'Checks the scent of every bee at the entrance.','#E2A63A'],
    ['Forager',22,42,'Collects nectar, pollen, water and resin until her wings wear out.','var(--honey)']];
  const total=42;
  $('#careerBar').innerHTML=jobs.map(j=>`<div style="flex:${j[2]-j[1]+1} 1 0;background:${j[4]}">${j[2]-j[1]+1>=4?j[0]:''}</div>`).join('');
  $('#careerList').innerHTML=jobs.map(j=>`<li><span class="d"><i style="background:${j[4]}"></i>Days ${j[1]}â${j[2]===42?'~42':j[2]}</span><h4>${j[0]}</h4><p class="muted">${j[3]}</p></li>`).join('');
})();

/* ---------- waggle dance ---------- */
const waggle=(function(){
  const c=$('#waggle'),ctx=c.getContext('2d');let W=0,H=0,col={},start=performance.now(),tc=0;
  const A=$('#wAngle'),D=$('#wDist');
  function colors(){col={bg:css('--bg'),line:css('--line'),ink:css('--ink'),muted:css('--muted'),heather:css('--heather'),pollen:css('--pollen'),honey:css('--honey'),wing:css('--wing')};}
  function resize(){const dpr=Math.min(2,devicePixelRatio||1);W=c.clientWidth;H=Math.round(W*.75);if(!W)return;c.width=W*dpr;c.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);colors();draw(performance.now());}
  function text(){
    const a=+A.value,d=+D.value;
    $('#wAngleOut').textContent=(a>0?'+':'')+a+'Â°';
    const dl=d>=1000?(d/1000).toFixed(1)+' km':d+' m';$('#wDistOut').textContent=dl;
    let dir=a===0?'straight toward the sun':Math.abs(a)===180?'directly away from the sun':`${Math.abs(a)}Â° ${a>0?'right':'left'} of the sun`;
    $('#wRead').textContent=`Fly ${dir} for about ${dl}.`;
    $('#wSub').textContent=`Waggle run â ${Math.max(.1,d/1000).toFixed(1)} s, pointing ${a===0?'straight up':Math.abs(a)===180?'straight down':Math.abs(a)+'Â° '+(a>0?'right':'left')+' of vertical'} on the comb.`;
  }
  function geom(){
    const th=(+A.value)*Math.PI/180,d=+D.value,cx=W*.5,cy=H*.54;
    const L=Math.min(W,H)*(.16+.36*(d-100)/4900);
    const dx=Math.sin(th),dy=-Math.cos(th),nx=Math.cos(th),ny=Math.sin(th);
    return {cx,cy,L,dx,dy,nx,ny,th,Tw:Math.max(350,d),Tr:900};
  }
  function pathPt(g,ph,side){ // semicircle from B back to A
    const p=Math.PI*ph,h=g.L/2;return [g.cx+h*(g.dx*Math.cos(p)+g.nx*Math.sin(p)*side),g.cy+h*(g.dy*Math.cos(p)+g.ny*Math.sin(p)*side),p];
  }
  function drawBee(x,y,ang,t,wag){
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);
    const s=Math.max(.8,W/560);ctx.scale(s,s);
    const f=wag?.5+.5*Math.abs(Math.sin(t*.06)):.85;
    ctx.fillStyle=col.wing;ctx.strokeStyle=col.muted;ctx.lineWidth=.6;
    ctx.beginPath();ctx.ellipse(-2,-7*f,6,8*f,-.35,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(-2,7*f,6,8*f,.35,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=col.pollen;ctx.beginPath();ctx.ellipse(-4,0,10,6,0,0,7);ctx.fill();
    ctx.fillStyle=col.ink;ctx.fillRect(-9,-6,2.6,12);ctx.fillRect(-4,-6.3,2.6,12.6);ctx.fillRect(1,-6,2.4,12);
    ctx.beginPath();ctx.arc(8,0,5,0,7);ctx.fill();ctx.beginPath();ctx.arc(14,0,3.6,0,7);ctx.fill();
    ctx.restore();
  }
  function draw(t){
    if(!W)return;const g=geom();ctx.clearRect(0,0,W,H);ctx.fillStyle=col.bg;ctx.fillRect(0,0,W,H);
    const R=W<500?16:22,w=R*1.5,h=Math.sqrt(3)*R;ctx.strokeStyle=col.line;ctx.lineWidth=1;
    for(let i=-1;i*w<W+R;i++)for(let j=-1;j*h<H+h;j++){const x=i*w,y=j*h+(i&1?h/2:0);ctx.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k;ctx.lineTo(x+(R-1)*Math.cos(a),y+(R-1)*Math.sin(a));}ctx.closePath();ctx.stroke();}
    // gravity / sun reference
    const fs=Math.max(11,W/48);ctx.font=`500 ${fs}px "DM Mono", monospace`;
    ctx.strokeStyle=col.muted;ctx.fillStyle=col.muted;ctx.lineWidth=1.5;ctx.setLineDash([4,5]);
    ctx.beginPath();ctx.moveTo(g.cx,g.cy-g.L/2-10);ctx.lineTo(g.cx,Math.max(fs*2.6,g.cy-g.L/2-H*.3));ctx.stroke();ctx.setLineDash([]);
    ctx.textAlign='center';ctx.fillText('UP = SUN',g.cx,fs*1.6);
    // figure eight
    const Ax=g.cx-g.dx*g.L/2,Ay=g.cy-g.dy*g.L/2,Bx=g.cx+g.dx*g.L/2,By=g.cy+g.dy*g.L/2;
    ctx.strokeStyle=col.muted;ctx.lineWidth=2;ctx.setLineDash([3,6]);
    [1,-1].forEach(sd=>{ctx.beginPath();for(let k=0;k<=40;k++){const p=pathPt(g,k/40,sd);k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();});
    ctx.setLineDash([]);ctx.strokeStyle=col.heather;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(Ax,Ay);ctx.lineTo(Bx,By);ctx.stroke();
    // arrowhead
    const ah=10;ctx.fillStyle=col.heather;ctx.beginPath();ctx.moveTo(Bx+g.dx*ah,By+g.dy*ah);ctx.lineTo(Bx-g.nx*ah*.7,By-g.ny*ah*.7);ctx.lineTo(Bx+g.nx*ah*.7,By+g.ny*ah*.7);ctx.closePath();ctx.fill();
    // angle arc
    if(g.th!==0){ctx.strokeStyle=col.heather;ctx.lineWidth=1.5;ctx.beginPath();const r=Math.min(46,g.L*.35);ctx.arc(g.cx,g.cy,r,-Math.PI/2,-Math.PI/2+g.th,g.th<0);ctx.stroke();}
    // compass
    const cr=Math.max(30,W*.07),ccx=W-cr-14,ccy=H-cr-14;
    ctx.fillStyle=col.bg;ctx.strokeStyle=col.line;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ccx,ccy,cr,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=col.honey;ctx.beginPath();ctx.arc(ccx,ccy-cr+2,6,0,7);ctx.fill();
    ctx.fillStyle=col.heather;ctx.beginPath();ctx.arc(ccx+Math.sin(g.th)*(cr-2),ccy-Math.cos(g.th)*(cr-2),5,0,7);ctx.fill();
    ctx.fillStyle=col.ink;ctx.beginPath();ctx.arc(ccx,ccy,3,0,7);ctx.fill();
    ctx.font=`500 ${Math.max(9,fs*.8)}px "DM Mono", monospace`;ctx.fillStyle=col.muted;ctx.fillText('SKY VIEW',ccx,ccy+cr+12>H?ccy-cr-6:ccy+cr+12);
    // bee position
    const cyc=2*(g.Tw+g.Tr),tt=reduce?g.Tw*.5:((t-start)%cyc);let x,y,ang,wag=false;
    const seg=tt<g.Tw?0:tt<g.Tw+g.Tr?1:tt<2*g.Tw+g.Tr?2:3;
    if(seg===0||seg===2){const u=(seg===0?tt:tt-g.Tw-g.Tr)/g.Tw;const j=reduce?0:Math.sin(t*.07)*Math.min(7,g.L*.06);x=Ax+(Bx-Ax)*u+g.nx*j;y=Ay+(By-Ay)*u+g.ny*j;ang=Math.atan2(g.dy,g.dx)+(reduce?0:Math.sin(t*.07)*.35);wag=true;}
    else{const u=(seg===1?tt-g.Tw:tt-2*g.Tw-g.Tr)/g.Tr,sd=seg===1?1:-1,p=pathPt(g,u,sd);x=p[0];y=p[1];
      const tx=-g.dx*Math.sin(p[2])+g.nx*Math.cos(p[2])*sd,ty=-g.dy*Math.sin(p[2])+g.ny*Math.cos(p[2])*sd;ang=Math.atan2(ty,tx);}
    drawBee(x,y,ang,t,wag);
  }
  function loop(t){if(W&&c.offsetParent!==null&&!document.hidden){if(++tc%60===0)colors();draw(t);}requestAnimationFrame(loop);}
  [A,D].forEach(i=>i.addEventListener('input',()=>{text();start=performance.now();if(reduce)draw(performance.now());}));
  addEventListener('resize',()=>{if(c.offsetParent!==null)resize();});
  text();if(!reduce)requestAnimationFrame(loop);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{colors();draw(performance.now());});
  return {resize};
})();

/* ---------- Pfund scale & varietals ---------- */
const stops=[[0,[247,241,200]],[17,[242,222,138]],[34,[235,196,88]],[50,[224,164,46]],[85,[194,122,23]],[114,[142,77,14]],[140,[78,38,6]]];
function pfund(mm){for(let i=1;i<stops.length;i++){if(mm<=stops[i][0]){const [a,ca]=stops[i-1],[b,cb]=stops[i],u=(mm-a)/(b-a);return 'rgb('+ca.map((v,k)=>Math.round(v+(cb[k]-v)*u)).join(',')+')';}}return 'rgb(78,38,6)';}
const grad='linear-gradient(90deg,'+stops.map(s=>pfund(s[0])+' '+(s[0]/140*100).toFixed(1)+'%').join(',')+')';
$('#pfundBar').style.background=grad;
const classes=[[0,8,'Water white'],[8,17,'Extra white'],[17,34,'White'],[34,50,'Extra light amber'],[50,85,'Light amber'],[85,114,'Amber'],[114,140,'Dark amber']];
$('#pfundTicks').innerHTML=[0,8,17,34,50,85,114,140].map(v=>`<span style="left:${v/140*100}%">${v}</span>`).join('')+classes.filter(c=>c[1]-c[0]>=16).map(c=>`<span class="lbl" style="left:${(c[0]+c[1])/2/140*100}%;top:15px">${c[2]}</span>`).join('');
function pclass(mm){return (classes.find(c=>mm<=c[1])||classes[6])[2];}
const vars=[['Acacia (black locust)',6,'Clean, mild, a hint of vanilla','Very slowly'],['Rapeseed',12,'Mild and sweet, sets creamy','Within days'],['Clover',22,'Sweet, grassy, the classic table honey','Medium'],['Orange blossom',30,'Floral with a citrus nose','Medium'],['Lavender',42,'Herbal and gently floral','Medium'],['Wildflower',70,'Changes with the meadow and the month','Varies'],['MÄnuka',95,'Earthy, mineral, very thick','Slowly; gels when still'],['Heather (ling)',108,'Smoky and bittersweet','Gels like jelly'],['Chestnut',125,'Bitter, tannic, long finish','Slowly'],['Buckwheat',140,'Malty, like molasses','Medium']];
$('#varTable').innerHTML=vars.map(v=>`<tr><td class="nm"><span class="sw" style="background:${pfund(v[1])}"></span>${v[0]}</td><td><div style="display:flex;align-items:center;gap:.8rem"><div class="mini" style="background:${grad}" aria-hidden="true"><b style="left:${v[1]/140*100}%"></b></div><span class="mm">${v[1]} mm</span></div></td><td><span class="pill">${pclass(v[1])}</span></td><td>${v[2]}</td><td>${v[3]}</td></tr>`).join('');

/* ---------- shop ---------- */
const products=[
  {id:'acacia',n:'Spring Acacia',cat:'honey',p:9,size:'250 g',mm:6,d:'Pale, runny and mild. Stays liquid for months.',type:'jar'},
  {id:'wild',n:'Summer Wildflower',cat:'honey',p:12,size:'500 g',mm:70,d:'Whatever the meadow offered in June and July.',type:'jar'},
  {id:'lav',n:'Lavender',cat:'honey',p:11,size:'250 g',mm:42,d:'Herbal and floral, lovely with goat cheese.',type:'jar'},
  {id:'chest',n:'Autumn Chestnut',cat:'honey',p:10,size:'250 g',mm:125,d:'Dark and bitter-edged. For cheese boards and stews.',type:'jar'},
  {id:'ivy',n:'Ivy Set Honey',cat:'honey',p:8,size:'250 g',mm:30,d:'Last flow of the year, naturally set and spreadable.',type:'jar'},
  {id:'comb',n:'Cut Comb',cat:'comb',p:18,size:'400 g',mm:50,d:'Honey still sealed in its wax. Eat the lot.',type:'comb'},
  {id:'candle',n:'Beeswax Candles',cat:'wax',p:14,size:'pair',mm:34,d:'Hand-dipped tapers that burn slow and smell of honey.',type:'candle'},
  {id:'adopt',n:'Adopt a Hive',cat:'gift',p:45,size:'1 year',mm:85,d:'Inspection notes, photos, a jar from your hive and an open day.',type:'adopt'}];
function prodSVG(pr){
  const c=pfund(pr.mm);
  if(pr.type==='jar')return `<svg viewBox="0 0 80 100" aria-hidden="true"><rect x="16" y="4" width="48" height="14" rx="3" fill="currentColor"/><path d="M12 22h56a6 6 0 0 1 6 6v58a10 10 0 0 1-10 10H16A10 10 0 0 1 6 86V28a6 6 0 0 1 6-6z" fill="${c}"/><path d="M14 32v46" stroke="#fff" stroke-opacity=".4" stroke-width="5" stroke-linecap="round"/><polygon points="30,46 50,46 59,61 50,76 30,76 21,61" style="fill:var(--surface)"/><polygon points="35,54 45,54 49,61 45,68 35,68 31,61" fill="${c}"/></svg>`;
  if(pr.type==='comb'){let s='';const R=9,w=R*1.5,h=Math.sqrt(3)*R;for(let i=0;i<6;i++)for(let j=0;j<5;j++){const x=12+i*w,y=12+j*h+(i&1?h/2:0);const pts=[0,1,2,3,4,5].map(k=>{const a=Math.PI/3*k;return (x+(R-1)*Math.cos(a)).toFixed(1)+','+(y+(R-1)*Math.sin(a)).toFixed(1);}).join(' ');s+=`<polygon points="${pts}" fill="${(i*5+j)%4===1?'#FFF0BE':c}" stroke="#8E4D0E" stroke-opacity=".35"/>`;}return `<svg viewBox="0 0 102 100" aria-hidden="true">${s}</svg>`;}
  if(pr.type==='candle')return `<svg viewBox="0 0 80 100" aria-hidden="true"><path d="M30 14c3 4 3 7 0 9-3-2-3-5 0-9z M52 10c3 4 3 7 0 9-3-2-3-5 0-9z" fill="#E9A52A"/><line x1="30" y1="23" x2="30" y2="28" stroke="currentColor" stroke-width="1.5"/><line x1="52" y1="19" x2="52" y2="24" stroke="currentColor" stroke-width="1.5"/><rect x="23" y="28" width="14" height="66" rx="3" fill="#EFCB6A"/><rect x="45" y="24" width="14" height="70" rx="3" fill="#EFCB6A"/><rect x="25" y="28" width="3" height="66" fill="#fff" opacity=".35"/><rect x="47" y="24" width="3" height="70" fill="#fff" opacity=".35"/></svg>`;
  return `<svg viewBox="0 0 90 100" aria-hidden="true"><polygon points="22,6 68,6 88,46 68,86 22,86 2,46" fill="${c}"/><rect x="26" y="40" width="38" height="5" rx="2" fill="currentColor" opacity=".7"/><rect x="26" y="52" width="38" height="5" rx="2" fill="currentColor" opacity=".7"/><rect x="35" y="62" width="20" height="10" rx="2" fill="currentColor"/><path d="M45 20l7 12H38z" fill="currentColor"/></svg>`;
}
let cart={};try{cart=JSON.parse(localStorage.getItem('cc-cart')||'{}')||{};}catch(e){cart={};}
function saveCart(){try{localStorage.setItem('cc-cart',JSON.stringify(cart));}catch(e){}}
function renderShop(f){
  $('#shopGrid').innerHTML=products.filter(p=>f==='all'||p.cat===f).map(p=>`<article class="prod"><div class="prod-fig">${prodSVG(p)}</div><div class="prod-top"><h3>${p.n}</h3><span class="price">${eur.format(p.p)}</span></div><div class="meta"><span class="pill">${p.size}</span>${p.cat==='honey'?`<span class="pill">${p.mm} mm Pfund</span>`:''}</div><p>${p.d}</p><button class="btn btn-honey btn-sm" type="button" data-add="${p.id}">Add to cart</button></article>`).join('');
}
renderShop('all');
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',x===b));renderShop(b.dataset.filter);}));
$('#shopGrid').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;cart[b.dataset.add]=(cart[b.dataset.add]||0)+1;saveCart();renderCart();const p=products.find(x=>x.id===b.dataset.add);toast(`${p.n} added to cart`);});
function renderCart(){
  const ids=Object.keys(cart).filter(k=>cart[k]>0&&products.find(p=>p.id===k));
  const count=ids.reduce((a,k)=>a+cart[k],0);$('#cartCount').textContent=count;
  $('#cartList').innerHTML=ids.length?ids.map(k=>{const p=products.find(x=>x.id===k);return `<li><div><strong>${p.n}</strong><div class="hint">${p.size} Â· ${eur.format(p.p)}</div></div><span class="price">${eur.format(p.p*cart[k])}</span><div class="qty"><button type="button" data-q="-1" data-id="${k}" aria-label="Remove one ${p.n}">â</button><span>${cart[k]}</span><button type="button" data-q="1" data-id="${k}" aria-label="Add one ${p.n}">+</button></div></li>`;}).join(''):'<li style="display:block;border:0"><p class="muted">Your cart is empty. Pick a jar from the shelf.</p><a class="btn btn-line btn-sm" href="#shop" style="margin-top:1rem" data-close>Browse the shop</a></li>';
  $('#cartTotal').textContent=eur.format(ids.reduce((a,k)=>a+products.find(p=>p.id===k).p*cart[k],0));
  $('#checkoutBtn').disabled=!ids.length;$('#checkoutBtn').style.opacity=ids.length?1:.5;
}
$('#cartList').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(b){cart[b.dataset.id]=Math.max(0,(cart[b.dataset.id]||0)+ +b.dataset.q);saveCart();renderCart();$('#checkoutMsg').hidden=true;}if(e.target.closest('[data-close]'))closeCart();});
function openCart(){$('#drawer').hidden=false;$('#scrim').hidden=false;$('#checkoutMsg').hidden=true;$('#closeCart').focus();}
function closeCart(){$('#drawer').hidden=true;$('#scrim').hidden=true;$('#cartBtn').focus();}
$('#cartBtn').addEventListener('click',openCart);$('#closeCart').addEventListener('click',closeCart);$('#scrim').addEventListener('click',closeCart);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#drawer').hidden)closeCart();});
$('#checkoutBtn').addEventListener('click',()=>{$('#checkoutMsg').hidden=false;});
renderCart();

/* ---------- forms ---------- */
const emailOK=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
function setErr(input,msg){const e=input.closest('.field,form').querySelector('.err');if(msg){input.setAttribute('aria-invalid','true');if(e)e.textContent=msg;}else{input.removeAttribute('aria-invalid');if(e)e.textContent='';}return !msg;}
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// password meter
function score(p){let s=0;if(p.length>=8)s++;if(p.length>=12)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))s++;if(/\d/.test(p)&&/[^A-Za-z0-9]/.test(p))s++;if(p.length<8)s=Math.min(s,1);return s;}
$('#jPass').addEventListener('input',e=>{const p=e.target.value,s=score(p);$$('#meter i').forEach((i,k)=>i.classList.toggle('on',k<s));$('#meterLbl').textContent=!p?'At least 8 characters':p.length<8?'Too short':['Weak','Weak','Fair','Strong','Very strong'][s];});

$('#joinForm').addEventListener('submit',e=>{
  e.preventDefault();const n=$('#jName'),m=$('#jEmail'),p=$('#jPass'),t=$('#jTerms');
  let ok=setErr(n,n.value.trim()?'':'Enter your first name.');
  ok=setErr(m,!m.value.trim()?'Enter your email address.':emailOK(m.value.trim())?'':'That email looks incomplete. Check for an @ and a domain like .com.')&&ok;
  ok=setErr(p,p.value.length<8?'Use at least 8 characters.':'')&&ok;
  ok=setErr(t,t.checked?'':'Tick this box so we can send your hive notes.')&&ok;
  if(!ok){$('#joinForm [aria-invalid="true"]').focus();return;}
  const tier=$('input[name="tier"]:checked').value;
  const ints=[['#iBasics','beekeeping basics'],['#iRecipes','honey recipes'],['#iGarden','pollinator gardening'],['#iMead','mead making']].filter(i=>$(i[0]).checked).map(i=>i[1]);
  $('#joinHello').textContent=`Welcome to the hive, ${n.value.trim()}`;
  $('#joinSummary').innerHTML=`You picked the <strong>${esc(tier)}</strong> membership${ints.length?` with notes on ${esc(ints.join(', '))}`:''}. Hive notes will go to <strong>${esc(m.value.trim())}</strong>.`;
  $('#joinForm').hidden=true;$('#joinDone').hidden=false;
});
$('#joinAgain').addEventListener('click',()=>{$('#joinForm').reset();$('#jPass').dispatchEvent(new Event('input'));$('#joinDone').hidden=true;$('#joinForm').hidden=false;});

$('#loginForm').addEventListener('submit',e=>{
  e.preventDefault();const m=$('#lEmail'),p=$('#lPass');
  let ok=setErr(m,!m.value.trim()?'Enter your email address.':emailOK(m.value.trim())?'':'That email looks incomplete.');
  ok=setErr(p,p.value?'':'Enter your password.')&&ok;
  const msg=$('#loginMsg');
  if(!ok){msg.hidden=true;return;}
  msg.hidden=false;msg.innerHTML=`We couldn't find an account with that email and password. Check for typos, or <a href="#join">join the hive</a> if you're new.`;
});
$('#forgotBtn').addEventListener('click',()=>{const f=$('#forgotForm');f.hidden=!f.hidden;if(!f.hidden){$('#fEmail').value=$('#lEmail').value;$('#fEmail').focus();}});
$('#forgotForm').addEventListener('submit',e=>{e.preventDefault();const m=$('#fEmail');if(!setErr(m,emailOK(m.value.trim())?'':'Enter the email you signed up with.'))return;$('#loginMsg').hidden=false;$('#loginMsg').textContent=`If there's an account for ${m.value.trim()}, a reset link is on its way.`;$('#forgotForm').hidden=true;});

$('#cMsg').addEventListener('input',e=>$('#cCount').textContent=`${e.target.value.length} / 800`);
$('#contactForm').addEventListener('submit',e=>{
  e.preventDefault();const n=$('#cName'),m=$('#cEmail'),t=$('#cTopic'),g=$('#cMsg');
  let ok=setErr(n,n.value.trim()?'':'Enter your name.');
  ok=setErr(m,!m.value.trim()?'Enter your email so we can reply.':emailOK(m.value.trim())?'':'That email looks incomplete.')&&ok;
  ok=setErr(t,t.value?'':'Choose a topic so it reaches the right beekeeper.')&&ok;
  ok=setErr(g,g.value.trim().length<10?'Write at least a sentence (10 characters).':'')&&ok;
  if(!ok){$('#contactForm [aria-invalid="true"]').focus();return;}
  $('#contactSummary').innerHTML=`Thanks, ${esc(n.value.trim())}. We've got your note about <strong>${esc(t.value.toLowerCase())}</strong> and will reply to ${esc(m.value.trim())}.`;
  $('#contactForm').hidden=true;$('#contactDone').hidden=false;
});
$('#contactAgain').addEventListener('click',()=>{$('#contactForm').reset();$('#cCount').textContent='0 / 800';$('#contactDone').hidden=true;$('#contactForm').hidden=false;});

$('#copyMail').addEventListener('click',()=>{const t=$('#mailAddr').textContent;try{navigator.clipboard.writeText(t).then(()=>toast('Email address copied'),()=>sel());}catch(e){sel();}function sel(){const r=document.createRange();r.selectNodeContents($('#mailAddr'));const s=getSelection();s.removeAllRanges();s.addRange(r);toast('Address selected. Copy it with your keyboard.');}});

$('#newsForm').addEventListener('submit',e=>{e.preventDefault();const m=$('#nEmail');if(!setErr(m,emailOK(m.value.trim())?'':'Enter a valid email address.'))return;toast('Subscribed. Your first hive notes arrive next season.');m.value='';});

route();
})();
