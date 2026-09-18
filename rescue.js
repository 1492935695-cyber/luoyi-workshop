(function(){
'use strict';
const $=id=>document.getElementById(id),S=window.RescueState,C=window.RescueContent,KEY='luoyi-pond-rescue-v2';
const names=C?.cast.map(c=>c.name)||[];
let saved={},storageAvailable=true;
try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
if(!saved||typeof saved!=='object')saved={};
let state=S&&S.check(saved.current)?saved.current:S?.fresh();
let records=Array.isArray(saved.records)?saved.records.slice(-30):[];
let legacyRecords=Array.isArray(saved.legacyRecords)?saved.legacyRecords:[],legacyCurrent=saved.legacyCurrent||null;
if(!saved.version)try{const old=JSON.parse(localStorage.getItem('luoyi-pond-rescue-v1')||'{}');legacyRecords=Array.isArray(old.records)?old.records:[];legacyCurrent=old.current||null}catch{}
let muted=!!saved.muted,paused=false,journey=null,worldReady=false,showFinishAt=0;
let elapsed=0,lastTime=performance.now(),currentLine='welcome',voiceSpeaker='captain',needsStart=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio=new Audio();audio.preload='auto';let audioTimer=0,voiceToken=0,voiceQueue=[],voicePurpose='feedback';
const lines=C?.lines||{};
function iconize(){window.lucide?.createIcons()}
function stopVoice(){voiceToken++;clearTimeout(audioTimer);voiceQueue=[];voicePurpose='feedback';audio.pause();audio.removeAttribute('src');audio.load()}
function voiceFailed(token){if(token!==voiceToken)return;clearTimeout(audioTimer);audio.pause();voiceQueue=[];voicePurpose='feedback';$('voiceRetry').hidden=muted}
function playLine(key){
 currentLine=key;const line=lines[key];$('speaker').textContent=line[0];$('message').textContent=line[1];voiceSpeaker=line[2];
 if(muted||paused)return;const token=++voiceToken;clearTimeout(audioTimer);audio.src='rescue-audio-v2/'+key+'.mp3';
 audioTimer=setTimeout(()=>voiceFailed(token),8000);audio.play().catch(()=>voiceFailed(token));
}
function say(key,purpose='feedback'){if(voicePurpose==='rules'&&purpose==='feedback'&&!muted)return false;stopVoice();voicePurpose=purpose;playLine(key);return true}
function speakRules(){stopVoice();$('voiceRetry').hidden=true;voicePurpose='rules';voiceQueue=S.level(state).intro.slice();playLine(voiceQueue.shift())}
audio.addEventListener('playing',()=>{clearTimeout(audioTimer);$('voiceRetry').hidden=true});
audio.addEventListener('waiting',()=>{const token=voiceToken;clearTimeout(audioTimer);audioTimer=setTimeout(()=>voiceFailed(token),8000)});
audio.addEventListener('error',()=>voiceFailed(voiceToken));
audio.addEventListener('ended',()=>{clearTimeout(audioTimer);if(voiceQueue.length)playLine(voiceQueue.shift());else{const wasRules=voicePurpose==='rules';voicePurpose='feedback';if(wasRules&&state.status==='done')say(S.goal(state)?S.level(state).win:'budgetMiss')}});
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:2,current:state,records,legacyRecords,legacyCurrent,muted}));storageAvailable=true}catch{storageAvailable=false}$('storageWarning').hidden=storageAvailable}
let soundContext;
function tone(high=false){if(muted)return;try{soundContext||=new(window.AudioContext||window.webkitAudioContext)();soundContext.resume().catch(()=>{});const o=soundContext.createOscillator(),g=soundContext.createGain();o.type='sine';o.frequency.setValueAtTime(high?760:520,soundContext.currentTime);o.frequency.exponentialRampToValueAtTime(high?1020:350,soundContext.currentTime+.12);g.gain.setValueAtTime(.055,soundContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,soundContext.currentTime+.16);o.connect(g).connect(soundContext.destination);o.start();o.stop(soundContext.currentTime+.17)}catch{}}
function fatal(){worldReady=false;$('loading').hidden=true;$('fatal').hidden=false;$('go').disabled=true;iconize()}
if(!window.THREE||!S||!C||window.rescueLoadError){fatal();return}
const T=THREE,stage=$('stage'),canvas=$('world');let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true})}catch{fatal();return}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;
const scene=new T.Scene();scene.background=new T.Color('#cdeadd');scene.fog=new T.Fog('#cdeadd',30,65);
const camera=new T.OrthographicCamera(-8,8,9,-9,.1,100);camera.position.set(0,17,18.2);camera.lookAt(0,.4,-3.2);
scene.add(new T.HemisphereLight('#fff6e7','#6d9e87',1.45));const sun=new T.DirectionalLight('#fff3cf',1.65);sun.position.set(-9,18,11);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-13,right:13,top:17,bottom:-13,near:1,far:55});sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;sun.shadow.radius=3;scene.add(sun);
const mats=new Map(),sph=new T.SphereGeometry(1,24,16);
function material(color,opts={}){const k=color+JSON.stringify(opts);if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color,roughness:.79,...opts}));return mats.get(k)}
function mesh(parent,geo,color,pos=[0,0,0],scale=[1,1,1],opts={}){const m=new T.Mesh(geo,material(color,opts));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ball(p,c,pos,scale,opts){return mesh(p,sph,c,pos,scale,opts)}
function box(p,c,pos,scale){return mesh(p,new T.BoxGeometry(1,1,1),c,pos,scale)}
function cyl(p,c,pos,r,h,rt=r,n=20){return mesh(p,new T.CylinderGeometry(rt,r,h,n),c,pos)}
function tube(p,c,points,r=.04){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));return mesh(p,new T.TubeGeometry(curve,24,r,7,false),c)}
function flat(p,c,x,z,r){const m=mesh(p,new T.CircleGeometry(r,36),c,[x,.075,z]);m.rotation.x=-Math.PI/2;return m}
const water=new T.Mesh(new T.PlaneGeometry(70,70,55,55),new T.MeshStandardMaterial({color:'#49bfc1',roughness:.28,metalness:.18}));water.rotation.x=-Math.PI/2;water.position.y=-.13;water.receiveShadow=true;scene.add(water);
const positions=water.geometry.attributes.position,baseWater=positions.array.slice();
function bank(z,far){const g=new T.Group();g.position.set(0,-.05,z);scene.add(g);box(g,'#60945e',[0,-.6,0],[34,1.3,12]);box(g,far?'#8ebc75':'#b0cc81',[0,.02,0],[34,.15,12]);for(let i=0;i<15;i++){const x=-16+i*2.3;if(Math.abs(x)>6.7)ball(g,'#779c66',[x,-.05,far?5.95:-5.95],[1.5,.4,.5])}return g}
bank(-13,true);bank(12,false);
function dock(z,far){const g=new T.Group();g.position.z=z;scene.add(g);for(let i=0;i<13;i++)box(g,i%2?'#e8bd78':'#efca8e',[-6+i,0,0],[.96,.23,far?3.6:4.0]);for(const x of[-6.25,6.25])for(const zz of[-1.55,1.55]){cyl(g,'#bd8751',[x,-.25,zz],.15,1.2);ball(g,'#e3b66e',[x,.36,zz],[.2,.12,.2])}return g}
dock(5.45,false);dock(-7.05,true);
function leaf(x,z,r=1,flower=false){const g=new T.Group();g.position.set(x,-.01,z);scene.add(g);const shape=new T.Shape();shape.moveTo(0,0);for(let i=0;i<=36;i++){const a=.19+i*(Math.PI*2-.38)/36;shape.lineTo(Math.cos(a)*r,Math.sin(a)*r)}shape.lineTo(0,0);const m=mesh(g,new T.ShapeGeometry(shape),'#287f62');m.rotation.x=-Math.PI/2;for(let k=0;k<7;k++){const a=.35+k*.78;tube(g,'#75b27b',[[0,.03,0],[Math.cos(a)*r*.7,.05,Math.sin(a)*r*.7]],.012)}if(flower){for(let k=0;k<9;k++){const a=k/9*Math.PI*2;const p=ball(g,k%2?'#ffb3c2':'#f47f9e',[Math.cos(a)*.23,.25,Math.sin(a)*.23],[.16,.32,.11]);p.rotation.z=-Math.cos(a)*.5;p.rotation.x=Math.sin(a)*.5}ball(g,'#efcc61',[0,.39,0],[.13,.1,.13])}}
[[-7,-3,1.25,true],[7,-1,1.05,true],[-6.9,1.4,.65,false],[6.6,-4.9,.9,false],[-4.7,-3.4,.45,false],[4.8,2.1,.5,false],[-9.7,-.9,.7,false]].forEach(v=>leaf(...v));
function tree(x,z,s=1,pink=false){const g=new T.Group();g.position.set(x,.1,z);g.scale.setScalar(s);scene.add(g);cyl(g,'#96704d',[0,1,0],.2,2,.13);tube(g,'#96704d',[[0,1.2,0],[-.6,2,0],[-.85,2.5,0]],.1);for(const [xx,yy,zz,r]of[[0,3,0,1.35],[-.7,2.5,.3,1],[.8,2.65,-.2,1.05]])ball(g,pink?'#eeaaa9':(xx<0?'#599a72':'#76b57d'),[xx,yy,zz],[r,r*.8,r]);}
for(const x of[-10,-7.8,7.8,10.3]){tree(x,-11,1.4,x>9);tree(x,10,.9,x<-9)}tree(-4.9,-13,1.5,true);tree(3.8,-14,1.6);
// A small tiled pavilion and picnic props establish the destination without covering passengers.
const pavilion=new T.Group();pavilion.position.set(0,.2,-11.5);scene.add(pavilion);for(const x of[-1.4,1.4])for(const z of[-.9,.9])cyl(pavilion,'#ca7854',[x,1.05,z],.1,2.1);const roof=mesh(pavilion,new T.ConeGeometry(2.55,.85,4),'#427c78',[0,2.5,0],[1,1,.72]);roof.rotation.y=Math.PI/4;cyl(pavilion,'#e8bb59',[0,3.04,0],.09,.3);box(pavilion,'#f2d4a0',[0,.04,0],[3.7,.14,2.6]);
const picnic=box(scene,'#e07f8b',[0,.09,-9.15],[3.9,.045,1.3]);for(let i=0;i<5;i++)for(let j=0;j<2;j++)box(scene,(i+j)%2?'#f8e7d6':'#f1a4a4',[-1.5+i*.74,.12,-9.5+j*.65],[.72,.012,.62]);cyl(scene,'#fff4df',[-.8,.2,-9.1],.3,.08);ball(scene,'#efb145',[-.8,.3,-9.1],[.2,.12,.18]);
// All five passengers share scale, not identity: silhouettes, faces and clothes differ.
const animals=[],eyeSets=[];
function animal(kind){
 const root=new T.Group(),body=new T.Group();root.add(body);const skin=['#fff4df','#ffd666','#b98559','#bdc4cb','#e58f62'][kind],clothes=['#ea8f9c','#3a9b9c','#588fb0','#c991b2','#76996f'][kind];
 const torso=ball(body,clothes,[0,.69,0],[.49,.63,.36]);ball(body,skin,[0,1.47,.04],[.61,.57,.5]);
 const ears=[];
 if(kind===0){for(const side of[-1,1]){const ear=ball(body,skin,[side*.29,2.15,-.02],[.19,.59,.15]);ear.rotation.z=side*-.15;ball(ear,'#eca4a9',[0,.05,.82],[.53,.76,.25]);ears.push(ear)}}
 if(kind===1){ball(body,'#f0a636',[0,1.29,.57],[.35,.13,.29]);for(let k=0;k<3;k++)ball(body,skin,[k*.12-.12,2.0,0],[.1,.22,.12]);}
 if(kind===2){for(const side of[-1,1]){ball(body,skin,[side*.52,1.91,-.04],[.24,.24,.14]);ball(body,'#d1a484',[side*.53,1.91,.09],[.13,.14,.03])}ball(body,'#edcda9',[0,1.23,.46],[.36,.25,.11])}
 if(kind===3||kind===4){for(const side of[-1,1]){const ear=mesh(body,new T.ConeGeometry(.28,.58,3),skin,[side*.43,1.98,-.02]);ear.rotation.z=side*-.21;const inside=mesh(body,new T.ConeGeometry(.16,.34,3),'#eab6a6',[side*.44,2.0,.13]);inside.rotation.z=side*-.21}ball(body,'#ffefd8',[0,1.2,.45],[.43,.25,.12]);if(kind===4){const tail=ball(body,skin,[.62,.5,-.22],[.24,.63,.27]);tail.rotation.z=-.8;ball(tail,'#ffefd8',[0,.64,0],[.9,.37,.9])}}
 const eyes=new T.Group();body.add(eyes);for(const side of[-1,1]){ball(eyes,'#292f34',[side*.235,1.53,.492],[.086,.112,.044]);ball(eyes,'#fffaf4',[side*.215,1.565,.531],[.023,.028,.016]);ball(body,'#eaa094',[side*.41,1.28,.43],[.106,.055,.025])}eyeSets.push({eyes,kind});
 if(kind!==1)ball(body,'#624447',[0,1.35,.584],[.076,.052,.039]);
 const mouth=ball(body,'#9c575a',[0,1.17,.555],[.1,.025,.018]);
 for(const side of[-1,1]){ball(body,skin,[side*.53,.65,.03],[.17,.34,.17]);ball(body,'#625f60',[side*.24,.16,.16],[.23,.15,.32]);tube(body,'#fff0cc',[[side*.22,1.0,.27],[side*.25,.59,.36]],.027)}
 ball(body,'#fff3da',[0,.6,.364],[.17,.19,.025]);ball(body,'#e4b954',[0,.91,.33],[.035,.035,.022]);
 if(kind===0){const bow=new T.Group();bow.position.set(.4,1.95,.23);body.add(bow);ball(bow,'#d95071',[-.12,0,0],[.17,.1,.075]);ball(bow,'#d95071',[.12,0,0],[.17,.1,.075]);ball(bow,'#ffd677',[0,0,.04],[.06,.06,.04])}
 if(kind===1){const scarf=mesh(body,new T.TorusGeometry(.34,.06,8,24),'#fff0cb',[0,1.03,0]);scarf.rotation.x=Math.PI/2;box(body,'#fff0cb',[.2,.78,.38],[.13,.42,.035])}
 root.userData={body,torso,mouth,ears,kind,moving:null};scene.add(root);return root;
}
for(let i=0;i<5;i++){const a=animal(i);a.scale.setScalar(1.18);animals.push(a)}
const boat=new T.Group();scene.add(boat);boat.position.set(0,-.02,.5);
const hullShape=new T.Shape();hullShape.moveTo(-4.5,0);hullShape.bezierCurveTo(-3.4,-1.55,3.4,-1.55,4.5,0);hullShape.bezierCurveTo(3.4,1.55,-3.4,1.55,-4.5,0);
const hull=mesh(boat,new T.ExtrudeGeometry(hullShape,{depth:.48,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.15,bevelThickness:.1}),'#d6924e',[0,.31,0]);hull.rotation.x=Math.PI/2;
for(let i=0;i<17;i++)box(boat,i%2?'#efc683':'#e6b874',[-3.6+i*.45,.37,0],[.42,.07,1.45]);
const seatPositions=[-2.3,0,2.3],seats=[];
for(const x of seatPositions){const seat=new T.Group();seat.position.set(x,.45,0);boat.add(seat);cyl(seat,'#0e6666',[0,0,0],.68,.10);cyl(seat,'#ffe095',[0,.065,0],.55,.10);const ring=mesh(seat,new T.TorusGeometry(.60,.045,8,32),'#fffbea',[0,.14,0]);ring.rotation.x=-Math.PI/2;seats.push(seat)}
tube(boat,'#814e38',[[-4,.35,.55],[-3.3,.55,.95],[0,.54,1.04],[3.3,.55,.95],[4,.35,.55]],.075);tube(boat,'#814e38',[[-4,.35,-.55],[-3.3,.55,-.95],[0,.54,-1.04],[3.3,.55,-.95],[4,.35,-.55]],.075);
const oars=[];for(const side of[-1,1]){const oar=new T.Group();oar.position.set(side*3.6,.45,.05);boat.add(oar);const shaft=cyl(oar,'#e7bc7b',[side*.55,0,.5],.055,2.2);shaft.rotation.z=side*.9;shaft.rotation.x=.75;const blade=ball(oar,'#b27449',[side*1.4,-.3,1.05],[.25,.065,.48]);oars.push(oar)}
const captain=new T.Group();captain.position.set(3.6,.43,-.1);captain.scale.setScalar(.72);boat.add(captain);ball(captain,'#6b9d69',[0,.34,0],[.29,.39,.27]);ball(captain,'#a8c87c',[0,.84,0],[.34,.31,.3]);for(const side of[-1,1]){ball(captain,'#203f35',[side*.13,.9,.27],[.035,.05,.025]);ball(captain,'#a8c87c',[side*.31,.42,.04],[.13,.17,.12])}const hat=mesh(captain,new T.ConeGeometry(.54,.2,32),'#e8c979',[0,1.14,0]);const captainMouth=ball(captain,'#456544',[0,.71,.28],[.08,.018,.015]);
const basket=new T.Group();scene.add(basket);box(basket,'#ea9f4d',[0,.28,0],[1.05,.56,.8]);box(basket,'#fbe5a3',[0,.6,0],[1.16,.10,.9]);tube(basket,'#744a38',[[-.47,.58,0],[-.45,1.02,0],[0,1.18,0],[.45,1.02,0],[.47,.58,0]],.07);box(basket,'#5e9cbe',[0,.28,.42],[.22,.56,.045]);
const ripples=[];for(let i=0;i<17;i++){const x=-10+(i*5.27)%20,z=-5+(i*3.17)%9;const r=mesh(scene,new T.TorusGeometry(.24+(i%3)*.16,.012,5,32),'#c8f2e7',[x,-.055,z],undefined,{transparent:true,opacity:.42});r.rotation.x=-Math.PI/2;r.userData.phase=i;r.castShadow=false;ripples.push(r)}
const dragonfly=new T.Group();scene.add(dragonfly);ball(dragonfly,'#498365',[0,0,0],[.045,.045,.31]);ball(dragonfly,'#6cad58',[0,0,.26],[.1,.08,.10]);const wings=[];for(const side of[-1,1])for(const z of[-.11,.07]){const wing=ball(dragonfly,'#e8f7fd',[side*.22,0,z],[.27,.016,.07],{transparent:true,opacity:.8});wings.push(wing)}
const targets=[],nameLabels=[];
for(let i=0;i<5;i++){const b=document.createElement('button');b.className='passenger';b.id='passenger-'+i;b.setAttribute('aria-label',names[i]+'上船');b.innerHTML='<span class="mark"><i data-lucide="plus"></i></span>';b.addEventListener('click',()=>select(i));$('targets').appendChild(b);targets.push(b);const label=document.createElement('span');label.className='actor-name';label.textContent=names[i];$('nameLabels').appendChild(label);nameLabels.push(label)}
function seatX(k){return S.level(state).seats===2?[-1.55,1.55][k]:seatPositions[k]}
function syncWorld(){const l=S.level(state);animals.forEach((a,i)=>{a.visible=l.ids.includes(i);nameLabels[i].hidden=!a.visible;nameLabels[i].classList.toggle('pair',l.pair?.includes(i)||false)});seats.forEach((s,i)=>{s.visible=i<l.seats;if(s.visible)s.position.x=seatX(i)});basket.visible=l.kind==='cargo';scene.background.set(l.id==='home'?'#f6dccb':'#cdeadd');water.material.color.set(l.id==='home'?'#7cbabd':'#49bfc1')}
function anchor(id,aboard=state.aboard,arrived=state.arrived){if(aboard.includes(id))return new T.Vector3(seatX(aboard.indexOf(id)),.52,boat.position.z);const ids=S.level(state).ids,x=(ids.indexOf(id)-(ids.length-1)/2)*2.6;return new T.Vector3(x,.15,arrived.includes(id)?-6.75:5.4)}
function reposition(animate=true){animals.forEach((a,i)=>{const dest=anchor(i);a.userData.moving=animate&&a.position.distanceTo(dest)>.01?{from:a.position.clone(),to:dest,start:elapsed}:null;if(!animate)a.position.copy(dest)})}
function activate(){needsStart=false;state.started=true;S.event(state,'start');save();speakRules();updateUI()}
function select(id){
 if(!worldReady||paused||journey||state.status==='done')return;
 if(needsStart)activate();
 const result=S.toggle(state,id);if(result==='ignored')return;
 if(result==='full'){say('full');tone(false);seats.forEach(s=>s.userData.pulse=elapsed);save();return}
 if(voicePurpose!=='rules'||muted)stopVoice();tone(result==='board');reposition();save();updateUI();
 if(voicePurpose!=='rules'){$('speaker').textContent='珞伊的安排';$('message').innerHTML=`<ruby>船上<rt>chuán shàng</rt></ruby> ${state.aboard.length} <ruby>位<rt>wèi</rt></ruby>，<ruby>等船<rt>děng chuán</rt></ruby> ${state.shore.length} <ruby>位<rt>wèi</rt></ruby>。`}
}
function updateUI(){
 const l=S.level(state),index=C.levels.indexOf(l);
 $('shoreCount').textContent=state.shore.length;$('boatCount').textContent=state.aboard.length;$('farCount').textContent=state.arrived.length;
 $('boatLimit').textContent='/ '+S.capacity(state);$('tripFlag').hidden=false;$('modeLabel').textContent=(index+1)+'/6 · '+l.title;$('tripCount').textContent='已送 '+state.trips.length+' 趟';
 $('missionRule').hidden=false;$('missionRule').textContent=l.rule;
 ['shoreLabel','boatLabel','farLabel'].forEach(x=>$(x).hidden=!state.started);
 $('cargoLabel').hidden=true;
 $('hint').hidden=needsStart;$('replay').hidden=needsStart;$('undo').hidden=needsStart||!state.history.length;
 $('undo').disabled=!!journey;$('hint').disabled=!!journey;$('replay').disabled=!!journey;
 $('go').disabled=!worldReady||!!journey;
 $('go').querySelector('span').textContent=needsStart?(state.started?'继续航行':'开始航行'):state.status==='done'?'看看安排':journey?'航行中':'出发';
 targets.forEach((b,i)=>{const aboard=state.aboard.includes(i);b.hidden=!l.ids.includes(i)||!!journey||state.arrived.includes(i)||state.status==='done';b.classList.toggle('onboard',aboard);b.setAttribute('aria-label',names[i]+(aboard?'下船':'上船'));b.setAttribute('aria-pressed',String(aboard));const mark=b.querySelector('.mark');mark.innerHTML='<i data-lucide="'+(aboard?'minus':'plus')+'"></i>'});iconize();
}
function startSail(){
 if(!worldReady||paused||journey)return;
 if(needsStart){activate();if(state.status==='done')finish();return}
 if(state.status==='done'){finish();return}
 const error=S.departureError(state);if(error){if(error!=='empty'){state.rulePrompts++;S.event(state,'rulePrompt',{reason:error});save()}say(error,'correction');return}
 if(voicePurpose!=='rules'||muted)stopVoice();tone(true);const ids=state.aboard.slice();
 // Persist the launch checkpoint. Reloading mid-crossing restores the same departure, never invents a completed trip.
 journey={ids,start:elapsed,phase:'out',boatStart:.5,boatEnd:-4.95};
 animals.forEach((a,i)=>{if(ids.includes(i)){a.position.copy(anchor(i));a.userData.moving=null}});
 if(voicePurpose!=='rules'){$('speaker').textContent='王老师';$('message').textContent='出发！我们去对岸野餐。'}updateUI();
}
function landed(){
 const ids=journey.ids;S.sail(state);journey={ids:[],phase:'back',start:elapsed,boatStart:-4.95,boatEnd:.5};reposition(true);save();
 const l=S.level(state);
 if(state.status==='done'){archive();say(S.goal(state)?l.win:'budgetMiss');showFinishAt=elapsed+1.5}
 else if(l.kind==='cargo'&&state.trips.length===1)say('cargoArrived');
 else if(!S.budgetAtRisk(state))say('arrived');
 updateUI();
}
function finish(){
 if($('finish').open||paused)return;showFinishAt=0;
 const l=S.level(state),met=S.goal(state);$('finishText').textContent='你用了 '+state.trips.length+' 趟，把 '+l.ids.length+' 位伙伴都送到了。'+(!met?'这次的约定是 '+l.maxTrips+' 趟以内。':'');
 $('journey').replaceChildren();state.trips.forEach((trip,i)=>{const div=document.createElement('div');div.className='trip-group';const label=document.createElement('span');label.textContent='第'+(i+1)+'趟';const n=document.createElement('b');n.textContent=trip.length;const dots=document.createElement('div');dots.className='trip-dots';trip.forEach(()=>dots.appendChild(document.createElement('i')));div.append(label,n,dots);$('journey').appendChild(div)});
 $('reflection').innerHTML='<ruby>合起来<rt>hé qǐ lái</rt></ruby>：'+state.trips.map(t=>t.length).join(' + ')+' = '+l.ids.length+'。';
 if(l.kind==='pair')$('reflection').append(document.createTextNode('李欣袆和杨诗然同船到了。'));
 $('next').querySelector('span').textContent=l===C.levels.at(-1)?'去冒险地图':'下一段冒险';$('finish').showModal();
}
function archive(){if(!state.started)return;records=records.filter(r=>r.id!==state.id);records.push(S.summary(state));records=records.slice(-30);save()}
function newRound(index){archive();stopVoice();journey=null;paused=false;showFinishAt=0;boat.position.z=.5;state=S.fresh(index);needsStart=false;state.started=true;syncWorld();reposition(false);updateUI();save();speakRules()}
function undo(){if(journey||paused)return;if(!S.undo(state))return;records=records.filter(r=>r.id!==state.id);showFinishAt=0;reposition();updateUI();save();say('undo')}
function openMenu(){if(!worldReady)return;paused=true;audio.pause();$('menu').showModal()}
function resumeVoice(){if(audio.getAttribute('src')&&!muted)audio.play().catch(()=>voiceFailed(voiceToken))}
function closeMenu(){if($('menu').open)$('menu').close();paused=false;resumeVoice()}
function rest(){stopVoice();['finish','menu'].forEach(id=>$(id).open&&$(id).close());paused=true;$('restPanel').showModal();save()}
function showReport(){
 paused=true;audio.pause();$('reportBody').replaceChildren();const list=[...records];if(state.started&&!list.some(r=>r.id===state.id))list.push(S.summary(state));
 if(!list.length)$('reportBody').textContent='还没有开始航行。';
 list.slice(-10).reverse().forEach(r=>{const row=document.createElement('div');row.className='report-row';const h=document.createElement('h3');h.textContent=r.title+(r.complete?' · 已到岸':' · 未完成');const p=document.createElement('p');p.textContent='每趟接送：'+(r.trips.join('、')||'尚未出发')+'。使用线索 '+r.hints+' 次，条件提醒 '+r.rulePrompts+' 次，调整 '+r.revisions+' 次。';const note=document.createElement('small');note.textContent=(r.goalMet?'本轮达成场景条件。':'本轮尚未达成场景条件。')+' '+r.topic+'；不代表独立掌握。';row.append(h,p,note);$('reportBody').appendChild(row)});
 if(legacyRecords.length){const p=document.createElement('p');p.textContent='另保留旧版 '+legacyRecords.length+' 条记录，随导出文件一起保存，不算作新版冒险完成。';$('reportBody').appendChild(p)}
 $('parentPanel').showModal();
}
$('go').onclick=startSail;$('undo').onclick=undo;$('hint').onclick=()=>{state.hints++;S.event(state,'hint');save();say(S.level(state).hint,'requested')};$('replay').onclick=speakRules;$('voiceRetry').onclick=speakRules;
$('sound').onclick=()=>{muted=!muted;if(muted){stopVoice();$('voiceRetry').hidden=true}else if(state.started)speakRules();$('sound').setAttribute('aria-label',muted?'开启声音':'关闭声音');$('sound').title=muted?'开启声音':'关闭声音';$('sound').innerHTML='<i data-lucide="'+(muted?'volume-x':'volume-2')+'"></i>';iconize();save()};
$('pause').onclick=openMenu;$('resume').onclick=closeMenu;$('menu').addEventListener('cancel',()=>{paused=false;resumeVoice()});$('reset').onclick=()=>{closeMenu();newRound(C.levels.indexOf(S.level(state)))};$('end').onclick=rest;$('rest').onclick=rest;$('backFromRest').onclick=()=>{$('restPanel').close();paused=false;if(state.status==='done')finish();else updateUI()};
function missions(){stopVoice();paused=true;$('menu').close();$('finish').close();$('missionList').replaceChildren();C.levels.forEach((l,i)=>{const b=document.createElement('button');b.setAttribute('aria-current',String(l.id===state.levelId));b.dataset.level=l.id;const span=document.createElement('span');span.textContent=(i+1)+' · '+l.title;const small=document.createElement('small');small.textContent=l.rule;span.appendChild(small);b.appendChild(span);b.onclick=()=>{$('missionPanel').close();newRound(i)};$('missionList').appendChild(b)});$('missionPanel').showModal()}
$('chooseMission').onclick=missions;$('closeMissions').onclick=()=>{$('missionPanel').close();paused=false;if(state.status==='done')finish()};$('missionPanel').addEventListener('cancel',()=>{paused=false;if(state.status==='done')setTimeout(finish,0)});
$('next').onclick=()=>{const index=C.levels.indexOf(S.level(state));$('finish').close();if(index===C.levels.length-1)missions();else newRound(index+1)};$('retry').onclick=()=>{$('finish').close();newRound(C.levels.indexOf(S.level(state)))};
$('report').onclick=showReport;$('reportFromFinish').onclick=showReport;$('closeReport').onclick=()=>{$('parentPanel').close();paused=$('menu').open||$('restPanel').open;if(!paused)resumeVoice()};$('parentPanel').addEventListener('cancel',()=>{paused=$('menu').open||$('restPanel').open;if(!paused)resumeVoice()});$('restPanel').addEventListener('cancel',()=>{paused=false});
$('exportReport').onclick=()=>{const payload={title:'珞伊荷塘探索记录',version:2,scope:'数学第20至21页分与合选练与条件推理拓展；操作记录不是掌握评估；本设备保存',current:S.summary(state),rounds:records,legacyRecords,legacyCurrent};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='珞伊-荷塘探索记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&worldReady&&!paused&&!$('finish').open)openMenu()});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stopVoice();fatal()});
function resize(){const w=stage.clientWidth,h=stage.clientHeight,aspect=w/h;renderer.setSize(w,h,false);let width=aspect>1.6?18.3:14.8;const height=Math.max(13.8,width/aspect);width=height*aspect;camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(stage);resize();
function project(v){const p=v.clone().project(camera);return {x:(p.x+1)*stage.clientWidth/2,y:(1-p.y)*stage.clientHeight/2}}
function positionLabel(id,v,dx=0,dy=0){const p=project(v),label=$(id),half=label.offsetHeight/2,y=Math.max(half+3,Math.min(stage.clientHeight-half-3,p.y+dy));label.style.left=(p.x+dx)+'px';label.style.top=y+'px';label.style.setProperty('--counter-y',y+'px')}
function targetsUpdate(){animals.forEach((a,i)=>{const p=project(a.position.clone().add(new T.Vector3(0,1.5,0)));targets[i].style.left=p.x+'px';targets[i].style.top=p.y+'px';const name=project(a.position.clone().add(new T.Vector3(0,-.22,.35)));nameLabels[i].style.left=name.x+'px';nameLabels[i].style.top=name.y+'px'});}
function frame(now){
 const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(!paused)elapsed+=dt;
 if(!paused&&worldReady){
  if(journey){const dur=reduced?.8:2.2,p=Math.min(1,(elapsed-journey.start)/dur),q=p*p*(3-2*p);boat.position.z=T.MathUtils.lerp(journey.boatStart,journey.boatEnd,q);if(journey.phase==='out')journey.ids.forEach((id,k)=>animals[id].position.set(seatX(k),.52,boat.position.z));if(p===1){if(journey.phase==='out')landed();else{journey=null;boat.position.z=.5;updateUI();if(S.budgetAtRisk(state)&&say(S.level(state).hint)){state.rulePrompts++;S.event(state,'budgetReminder');save()}}}}
  animals.forEach((a,i)=>{const data=a.userData,m=data.moving;if(m){const p=Math.min(1,(elapsed-m.start)/.30),q=1-Math.pow(1-p,3);a.position.lerpVectors(m.from,m.to,q);a.position.y+=reduced?0:Math.sin(p*Math.PI)*.33;if(p===1)data.moving=null}data.body.rotation.z=reduced?0:Math.sin(elapsed*1.7+i)*.022;data.torso.scale.y=.63+(reduced?0:Math.sin(elapsed*2+i)*.013);const talking=!audio.paused&&voiceSpeaker===C.cast[i].role;data.mouth.scale.y=talking?.025+Math.abs(Math.sin(elapsed*18))*.055:.025;data.ears.forEach((e,j)=>e.rotation.z=(j===0?.15:-.15)+(reduced?0:Math.sin(elapsed*1.6+i)*.025));});
  if(basket.visible)basket.position.set(state.trips.length?2.5:2.3,state.trips.length?.18:.62,state.trips.length?-8.8:boat.position.z);
  const talking=!audio.paused&&voiceSpeaker==='captain';captainMouth.scale.y=talking?.018+Math.abs(Math.sin(elapsed*18))*.04:.018;
  if(!reduced){boat.rotation.z=Math.sin(elapsed*1.5)*.012;boat.position.y=Math.sin(elapsed*1.6)*.025;oars.forEach((o,i)=>o.rotation.y=journey?Math.sin(elapsed*5+i*Math.PI)*.22:Math.sin(elapsed)*.025);dragonfly.position.set(-4.8+Math.sin(elapsed*.43)*1.3,2.5+Math.sin(elapsed*.8)*.3,-2.6);dragonfly.rotation.y=Math.sin(elapsed*.43)*.5;wings.forEach((w,i)=>w.rotation.z=Math.sin(elapsed*40)*(i<2?.24:-.24));ripples.forEach((r,i)=>{const phase=(elapsed*.23+i*.17)%1;r.scale.setScalar(.7+phase);r.material.opacity=.22+Math.sin(phase*Math.PI)*.2});for(let i=0;i<positions.count;i++)positions.setZ(i,Math.sin(baseWater[i*3]*.7+elapsed*.7)*Math.cos(baseWater[i*3+1]*.8+elapsed*.5)*.037);positions.needsUpdate=true;}
  seats.forEach(s=>{const p=s.userData.pulse;const boost=p&&elapsed-p<.5?Math.sin((elapsed-p)*Math.PI*4)*.04:0;s.scale.setScalar(1+boost)});
  if(showFinishAt&&elapsed>=showFinishAt&&!journey)finish();
 }
 targetsUpdate();renderer.render(scene,camera);requestAnimationFrame(frame);
}
syncWorld();reposition(false);worldReady=true;clearTimeout(window.rescueWatchdog);$('loading').hidden=true;$('fatal').hidden=true;updateUI();if(muted){$('sound').setAttribute('aria-label','开启声音');$('sound').title='开启声音';$('sound').innerHTML='<i data-lucide="volume-x"></i>'}iconize();
if(state.status==='done'){showFinishAt=.9;$('message').textContent='珞伊，你上次的安排还在这里。'}else if(state.started){$('message').textContent='珞伊，小船停在这里，继续你的安排吧。'}else{$('speaker').textContent='小兔';$('message').textContent='珞伊，和小兔、朋友们一起去野餐吧！'}
requestAnimationFrame(frame);
window.rescueInspect=()=>({state:S.clone(state),records:S.clone(records),legacyCount:legacyRecords.length,capacity:S.capacity(state),goalMet:S.goal(state),journey:journey?{phase:journey.phase,ids:journey.ids,boatZ:boat.position.z}:null,paused,elapsed,muted,storageAvailable,worldReady,needsStart,voice:{time:audio.currentTime,playing:!audio.paused,source:audio.getAttribute('src'),purpose:voicePurpose,queue:voiceQueue.slice()},seats:seats.filter(s=>s.visible).map(s=>s.position.toArray()),basket:{visible:basket.visible,position:basket.position.toArray()},positions:animals.map((a,i)=>({id:i,visible:a.visible,world:a.position.toArray(),screen:project(a.position.clone().add(new T.Vector3(0,1.3,0)))})),canvas:{width:canvas.width,height:canvas.height}});
})();
