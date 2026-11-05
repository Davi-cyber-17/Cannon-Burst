const cv=document.getElementById('c'),ctx=cv.getContext('2d',{alpha:false});
const W=450,H=800,GY=700;
let state='menu',keys={},cannon,bullets,balls,coins,parts,floats,score,coinCount,level,time,spawnT,fireT,lives,best=0;
let broken=0;const MAXGUN=9,PER=10,gunLv=()=>Math.min(MAXGUN,Math.floor(broken/PER));const COLORS=['#00f0ff','#ff2bd6','#b8ff3c','#ffb020','#7c5cff'];
function reset(){
 cannon={x:W/2,w:60,tx:W/2};bullets=[];balls=[];coins=[];parts=[];floats=[];
 score=0;broken=0;coinCount=0;level=1;time=0;spawnT=0;fireT=0;lives=3;
 spawnBall(W/2,-60,70,10,Math.random()<.5?1:-1);
}
function spawnBall(x,y,r,hp,dir){
 balls.push({x,y,r,hp,max:hp,vx:dir*(70+level*4),vy:0,col:COLORS[Math.floor(Math.random()*COLORS.length)],rot:Math.random()*6,spin:(Math.random()-.5)*2});
}
function burst(x,y,col,n){if(parts.length>140)n=4;for(let i=0;i<n;i++){const a=Math.random()*6.28,s=60+Math.random()*180;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,l:.6+Math.random()*.4,col})}}
function hitBall(b,i){
 b.hp-=1;score+=1;
 if(b.hp<=0){
  broken++;if(broken%PER===0&&broken/PER<=MAXGUN)floats.push({x:Math.max(90,Math.min(W-90,b.x)),y:b.y,t:1.2,s:'CANHÃO MELHORADO!'});burst(b.x,b.y,b.col,18);
  const n=3+Math.floor(b.max/15);
  for(let k=0;k<n;k++)coins.push({x:b.x,y:b.y,vx:(Math.random()-.5)*160,vy:-120-Math.random()*120,r:9});
  if(b.r>28){
   const hp=Math.max(1,Math.ceil(b.max/2));
   spawnBall(b.x-10,b.y,b.r*.68,hp,-1);
   spawnBall(b.x+10,b.y,b.r*.68,hp,1);
   balls[balls.length-1].vy=balls[balls.length-2].vy=-220;
  }
  balls.splice(i,1);
  if(coins.length>80)coins.splice(0,coins.length-80);
 }
}
function stepParts(dt){let j=0;for(let i=0;i<parts.length;i++){const p=parts[i];p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;if(p.l>0)parts[j++]=p}parts.length=j}
function stepFloats(dt){let j=0;for(let i=0;i<floats.length;i++){const f=floats[i];f.y-=40*dt;f.t-=dt;if(f.t>0)floats[j++]=f}floats.length=j}
function update(dt){
 time+=dt;level=1+Math.floor(time/20);
 // move
 const sp=420*dt;
 if(keys.ArrowLeft||keys.a)cannon.tx-=sp;
 if(keys.ArrowRight||keys.d)cannon.tx+=sp;
 cannon.tx=Math.max(35,Math.min(W-35,cannon.tx));
 cannon.x+=(cannon.tx-cannon.x)*Math.min(1,dt*18);
 // fire
 fireT-=dt;
 const gl=gunLv(),rate=Math.max(.05,.2-gl*.012),shots=Math.min(6,1+Math.floor((gl+1)/2)),bvy=-(780+gl*40);
 if(fireT<=0){fireT=rate;for(let k=0;k<shots;k++)bullets.push({x:cannon.x+(k-(shots-1)/2)*14,y:GY-50,vy:bvy});}
 {let j=0;for(let i=0;i<bullets.length;i++){const b=bullets[i];b.y+=b.vy*dt;if(b.y>-20)bullets[j++]=b}bullets.length=j}
 // spawn
 spawnT-=dt;
 if(spawnT<=0){spawnT=Math.max(5,12-level*.4);
  const r=45+Math.random()*35, hp=Math.floor(6+level*3+Math.random()*level*2);
  spawnBall(Math.random()<.5?60:W-60,-r,r,hp,Math.random()<.5?1:-1);}
 // balls
 for(let i=balls.length-1;i>=0;i--){
  const b=balls[i];
  b.vy+=400*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=b.spin*dt;
  if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx)}
  if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx)}
  if(b.y>GY-b.r){b.y=GY-b.r;b.vy=-Math.sqrt(2*400*(260+b.r*2.2));}
  // bullets
  for(let j=bullets.length-1;j>=0;j--){
   const bl=bullets[j];
   const dx=bl.x-b.x,dy=bl.y-b.y,rr=b.r+4;
   if(b.y+b.r>0&&dx*dx+dy*dy<rr*rr){
    bullets.splice(j,1);hitBall(b,i);
    if(b.hp<=0)break;
   }
  }
 }
 // cannon collision
 for(const b of balls){
  if(b.hp>0&&Math.abs(b.x-cannon.x)<b.r+26&&b.y+b.r>GY-70&&b.y>0){
   lives=0;burst(cannon.x,GY-30,'#ff9f1c',40);gameOver();return;
  }
 }
 // coins
 for(let i=coins.length-1;i>=0;i--){
  const c=coins[i];
  c.vy+=700*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;
  if(c.x<c.r||c.x>W-c.r)c.vx*=-1;
  if(c.y>GY+10){c.y=GY+10;c.vy=0;c.vx*=.9;c.age=(c.age||0)+dt;if(c.age>5){coins.splice(i,1);continue}}
  if(Math.abs(c.x-cannon.x)<40&&Math.abs(c.y-(GY-20))<45){
   coinCount++;floats.push({x:c.x,y:c.y,t:.7,s:'+1'});coins.splice(i,1);
  }
 }
 stepParts(dt);stepFloats(dt);
}
function gameOver(){
 state='over';best=Math.max(best,score);
 document.getElementById('res').innerHTML='<div><span>PONTOS</span><b>'+score+'</b></div><div><span>MOEDAS</span><b>'+coinCount+'</b></div><div><span>RECORDE</span><b>'+best+'</b></div>';
 document.getElementById('over').classList.remove('hidden');
}
if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};
const PCOLS=COLORS.concat('#ff9f1c');
const FONT='Orbitron,"Segoe UI",Consolas,monospace';
const STARS=Array.from({length:45},()=>({x:Math.random()*W,y:Math.random()*GY,s:1+Math.random()*1.6,v:3+Math.random()*12}));
const wrap=document.getElementById('wrap'),stage=document.getElementById('stage');
const bgC=document.createElement('canvas'),hudC=document.createElement('canvas'),HUD_H=110;
const progGrad=ctx.createLinearGradient(24,0,W-24,0);progGrad.addColorStop(0,'#00f0ff');progGrad.addColorStop(1,'#ff2bd6');
let scale=1,anim=0,hudKey='',hudAt=0,lw=0,lh=0,ldpr=0;

function txt(c,s,x,y,size,col,align,base){c.font='700 '+size+'px '+FONT;c.textAlign=align||'left';c.textBaseline=base||'top';c.fillStyle=col;c.fillText(s,x,y)}
function poly(x,y,r,rot,n){ctx.beginPath();for(let i=0;i<n;i++){const a=rot+i/n*6.283;ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath()}

// fundo estático pré-renderizado (desenhado só quando a tela muda de tamanho)
function buildBg(){
 const b=bgC.getContext('2d');b.setTransform(scale,0,0,scale,0,0);
 let g=b.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#03060f');g.addColorStop(1,'#0c1a3d');
 b.fillStyle=g;b.fillRect(0,0,W,H);
 const hg=b.createRadialGradient(W/2,GY,10,W/2,GY,420);
 hg.addColorStop(0,'rgba(0,240,255,.25)');hg.addColorStop(.5,'rgba(124,92,255,.10)');hg.addColorStop(1,'rgba(0,0,0,0)');
 b.fillStyle=hg;b.fillRect(0,0,W,GY);
 b.strokeStyle='rgba(0,240,255,.07)';b.lineWidth=1;b.beginPath();
 for(let x=0;x<=W;x+=45){b.moveTo(x,0);b.lineTo(x,GY)}
 for(let y=0;y<GY;y+=45){b.moveTo(0,y);b.lineTo(W,y)}
 b.stroke();
 g=b.createLinearGradient(0,GY,0,H);g.addColorStop(0,'#0a1432');g.addColorStop(1,'#04070f');
 b.fillStyle=g;b.fillRect(0,GY,W,H-GY);
 b.strokeStyle='rgba(0,240,255,.35)';b.lineWidth=1.2;b.beginPath();
 for(let i=-9;i<=9;i++){b.moveTo(W/2+i*28,GY);b.lineTo(W/2+i*130,H)}
 b.stroke();
 b.strokeStyle='#00f0ff';
 [[10,.12],[5,.28],[2,1]].forEach(([w,a])=>{b.globalAlpha=a;b.lineWidth=w;b.beginPath();b.moveTo(0,GY);b.lineTo(W,GY);b.stroke()});
 b.globalAlpha=1;
}
function drawBall(b){
 poly(b.x,b.y,b.r+6,b.rot,6);ctx.globalAlpha=.2;ctx.fillStyle=b.col;ctx.fill();ctx.globalAlpha=1;
 poly(b.x,b.y,b.r,b.rot,6);ctx.fillStyle='#0c1636';ctx.fill();
 ctx.lineWidth=3;ctx.strokeStyle=b.col;ctx.stroke();
 poly(b.x,b.y,b.r*.8,-b.rot*1.5,6);ctx.lineWidth=1.5;ctx.globalAlpha=.35;ctx.stroke();ctx.globalAlpha=1;
 ctx.beginPath();ctx.arc(b.x,b.y,b.r*.62,-Math.PI/2,-Math.PI/2+6.283*Math.max(0,b.hp/b.max));
 ctx.lineWidth=3;ctx.stroke();
 txt(ctx,b.hp,b.x,b.y+1,Math.max(13,b.r*.5),'#fff','center','middle');
}
function drawCannon(){
 const x=cannon.x,y=GY;
 ctx.lineWidth=2.5;ctx.strokeStyle='#00f0ff';ctx.fillStyle='#0e1a38';
 ctx.beginPath();ctx.roundRect(x-11,y-68,22,46,4);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(x-32,y-12);ctx.lineTo(x-22,y-42);ctx.lineTo(x+22,y-42);ctx.lineTo(x+32,y-12);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#00f0ff';ctx.fillRect(x-7,y-68,14,5);
 ctx.fillStyle='rgba(255,43,214,.3)';ctx.beginPath();ctx.arc(x,y-28,9,0,7);ctx.fill();
 ctx.fillStyle='#ff2bd6';ctx.beginPath();ctx.arc(x,y-28,5,0,7);ctx.fill();
 [-30,30].forEach(o=>{
  poly(x+o,y-10,15,x*.05,6);ctx.fillStyle='#0a1330';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#00f0ff';ctx.stroke();
  ctx.lineWidth=1.5;ctx.strokeStyle='rgba(0,240,255,.6)';ctx.beginPath();
  for(let k=0;k<3;k++){const a=k*Math.PI/3+x*.05;ctx.moveTo(x+o+Math.cos(a)*14,y-10+Math.sin(a)*14);ctx.lineTo(x+o-Math.cos(a)*14,y-10-Math.sin(a)*14)}
  ctx.stroke();
 });
}
// HUD pré-renderizado: só é refeito quando algum valor muda
function renderHUD(lv){
 const h=hudC.getContext('2d');h.setTransform(scale,0,0,scale,0,0);h.clearRect(0,0,W,HUD_H);
 h.fillStyle='rgba(6,12,32,.7)';h.strokeStyle='rgba(0,240,255,.55)';h.lineWidth=1.5;
 h.beginPath();h.roundRect(10,10,W-20,62,10);h.fill();h.stroke();
 txt(h,'PONTOS',24,20,10,'#00f0ff');txt(h,score,24,34,24,'#fff');
 txt(h,'NÍVEL',W/2,20,10,'#ff2bd6','center');txt(h,level,W/2,34,24,'#fff','center');
 txt(h,'MOEDAS',W-24,20,10,'#ffd23f','right');txt(h,coinCount,W-24,34,24,'#fff','right');
 h.fillStyle='rgba(255,255,255,.1)';h.fillRect(24,64,W-48,3);
 const s='CANHÃO NV '+lv+(lv>MAXGUN?' MAX':'');
 h.font='700 11px '+FONT;const w=h.measureText(s).width+20;
 h.fillStyle='rgba(6,12,32,.7)';h.strokeStyle='rgba(0,240,255,.45)';
 h.beginPath();h.roundRect(10,80,w,24,6);h.fill();h.stroke();
 txt(h,s,20,86,11,'#00f0ff');
}
function drawHUD(){
 const lv=1+gunLv(),key=score+'|'+level+'|'+coinCount+'|'+lv;
 const now=performance.now();
 if(key!==hudKey&&now-hudAt>100){hudKey=key;hudAt=now;renderHUD(lv)}
 ctx.drawImage(hudC,0,0,W,HUD_H);
 ctx.fillStyle=progGrad;ctx.fillRect(24,64,(W-48)*((time%20)/20),3);
}
function draw(){
 ctx.setTransform(scale,0,0,scale,0,0);
 ctx.drawImage(bgC,0,0,W,H);
 ctx.fillStyle='rgba(191,233,255,.6)';ctx.beginPath();
 for(const s of STARS)ctx.rect(s.x,(s.y+anim*s.v)%GY,s.s,s.s);
 ctx.fill();
 ctx.strokeStyle='rgba(0,240,255,.3)';ctx.lineWidth=1.2;ctx.beginPath();
 const f=(anim*.6)%1;
 for(let k=0;k<7;k++){const p=(k+f)/7,y=GY+(H-GY)*p*p;ctx.moveTo(0,y);ctx.lineTo(W,y)}
 ctx.stroke();
 if(bullets.length){
  ctx.fillStyle='rgba(0,240,255,.3)';ctx.beginPath();
  for(const b of bullets)ctx.rect(b.x-4,b.y-12,8,24);
  ctx.fill();
  ctx.fillStyle='#bdfcff';ctx.beginPath();
  for(const b of bullets)ctx.rect(b.x-1.5,b.y-10,3,20);
  ctx.fill();
 }
 for(const b of balls)drawBall(b);
 if(coins.length){
  ctx.beginPath();
  for(const c of coins){ctx.moveTo(c.x+c.r,c.y);for(let i=1;i<6;i++){const a=i*1.0472;ctx.lineTo(c.x+Math.cos(a)*c.r,c.y+Math.sin(a)*c.r)}ctx.closePath()}
  ctx.fillStyle='#ffc21f';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff3b0';ctx.stroke();
  ctx.beginPath();for(const c of coins)ctx.rect(c.x-2,c.y-4,4,8);
  ctx.fillStyle='#7a5200';ctx.fill();
 }
 if(state!=='over')drawCannon();
 if(parts.length)for(const col of PCOLS){
  let any=false;ctx.beginPath();
  for(const p of parts){if(p.col!==col)continue;const z=6*Math.min(1,p.l*1.6);ctx.rect(p.x-z/2,p.y-z/2,z,z);any=true}
  if(any){ctx.fillStyle=col;ctx.fill()}
 }
 for(const f of floats){
  const up=f.s.length>3;
  ctx.globalAlpha=Math.min(1,f.t/.7);
  txt(ctx,f.s,f.x,f.y,up?14:16,up?'#ff2bd6':'#fff','center','middle');
 }
 ctx.globalAlpha=1;
 drawHUD();
}

function resize(){
 const cs=getComputedStyle(wrap);
 const aw=wrap.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
 const ah=wrap.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
 const w=Math.max(1,Math.floor(Math.min(aw,ah*W/H))),h=Math.floor(w*H/W);
 const dpr=Math.max(1,Math.min(window.devicePixelRatio||1,1.5,720/w));
 if(w===lw&&h===lh&&dpr===ldpr)return; // evita recriar o canvas à toa
 lw=w;lh=h;ldpr=dpr;
 stage.style.width=w+'px';stage.style.height=h+'px';
 stage.style.setProperty('--u',(h/H)+'px');
 cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
 scale=cv.width/W;
 bgC.width=cv.width;bgC.height=cv.height;buildBg();
 hudC.width=Math.ceil(W*scale);hudC.height=Math.ceil(HUD_H*scale);hudKey='';hudAt=0;
}
addEventListener('resize',resize);
addEventListener('orientationchange',()=>setTimeout(resize,150));
if(window.visualViewport)visualViewport.addEventListener('resize',resize);

let last=0;
function loop(t){
 const dt=Math.min(.05,(t-last)/1000||0);last=t;anim+=dt;
 if(state==='play'){
  if(dt>.026){update(dt/2);if(state==='play')update(dt/2)}else update(dt);
 }else if(state==='over'){stepParts(dt);}
 if(cannon)draw();
 requestAnimationFrame(loop);
}
function pointer(e){
 const r=cv.getBoundingClientRect();
 if(cannon)cannon.tx=(e.clientX-r.left)/r.width*W;
}
cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId)}catch(_){}pointer(e)});
cv.addEventListener('pointermove',pointer);
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{keys[e.key]=true;keys[e.key.toLowerCase()]=true;if(e.key.startsWith('Arrow'))e.preventDefault()});
addEventListener('keyup',e=>{keys[e.key]=false;keys[e.key.toLowerCase()]=false});
addEventListener('blur',()=>{keys={}});
function start(){
 reset();state='play';
 document.getElementById('menu').classList.add('hidden');
 document.getElementById('over').classList.add('hidden');
}
document.getElementById('play').onclick=start;
document.getElementById('again').onclick=start;
resize();reset();requestAnimationFrame(loop);
