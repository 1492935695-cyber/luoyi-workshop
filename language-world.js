(function(){
'use strict';
window.createLanguageWorld=function({canvas,stage,onFrame}){
const T=THREE,renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new T.Scene();scene.background=new T.Color('#bfe4de');scene.fog=new T.Fog('#bfe4de',23,47);const camera=new T.OrthographicCamera(-5.4,5.4,7,-7,.1,90);camera.position.set(0,7,18);camera.lookAt(0,1.4,0);scene.add(new T.HemisphereLight('#fff6de','#75a48d',1.65));const sun=new T.DirectionalLight('#fff2cd',1.5);sun.position.set(-6,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12});sun.shadow.bias=-.0003;scene.add(sun);
const materials=new Map(),sphere=new T.SphereGeometry(1,24,16);
function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.75}));return materials.get(c)}
function shape(parent,geo,c,p=[0,0,0],s=[1,1,1]){const m=new T.Mesh(geo,mat(c));m.position.set(...p);m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
const ball=(p,c,pos,scale)=>shape(p,sphere,c,pos,scale),box=(p,c,pos,scale)=>shape(p,new T.BoxGeometry(1,1,1),c,pos,scale);
function tube(p,c,points,r=.035){return shape(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),20,r,6,false),c)}
const water=shape(scene,new T.PlaneGeometry(100,100),'#60bec2',[0,-.8,0]);water.rotation.x=-Math.PI/2;
const island=shape(scene,new T.CylinderGeometry(8.6,9,1.1,64),'#79b17c',[0,-.6,-.3],[1,1,.7]);const lawn=shape(scene,new T.CylinderGeometry(8.5,8.5,.07,64),'#aecb87',[0,-.03,-.3],[1,1,.7]);
for(let i=0;i<15;i++)box(scene,i%2?'#e6ca91':'#efdab0',[-7+i,0,1],[.98,.11,4]);
function tree(x,z,pink){const g=new T.Group();g.position.set(x,0,z);scene.add(g);shape(g,new T.CylinderGeometry(.1,.2,2.8,12),'#a07d53',[0,1.4,0]);for(let k=0;k<3;k++)ball(g,pink?(k%2?'#f2c0ae':'#eaa5a7'):(k%2?'#659c74':'#8ab886'),[(k-1)*.7,2.8+k*.22,0],[1.1,.9,.8]);return g}
const trees=[tree(-5,-3,false),tree(5,-3,true),tree(-7,0,false),tree(7,-1,false),tree(0,-5,true)];
const pavilion=new T.Group();pavilion.position.set(0,0,-5);scene.add(pavilion);for(const x of[-1.1,1.1])shape(pavilion,new T.CylinderGeometry(.1,.1,2.1,12),'#c78b5b',[x,1.05,0]);const roof=shape(pavilion,new T.ConeGeometry(2.2,.9,4),'#3e847e',[0,2.6,0],[1,1,.7]);roof.rotation.y=Math.PI/4;
function leaf(x,z,s){const g=new T.Group();scene.add(g);g.position.set(x,-.65,z);const sh=new T.Shape();sh.moveTo(0,0);for(let i=0;i<=36;i++){const a=.22+i*(Math.PI*2-.44)/36;sh.lineTo(Math.cos(a)*s,Math.sin(a)*s)}sh.lineTo(0,0);const l=shape(g,new T.ShapeGeometry(sh),'#368d6a');l.rotation.x=-Math.PI/2;for(let k=0;k<7;k++){const a=k*.9;tube(g,'#83b67b',[[0,.02,0],[Math.cos(a)*s*.9,.02,Math.sin(a)*s*.9]],.013)}for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ball(g,'#f4aab7',[Math.cos(a)*.2,.17,Math.sin(a)*.2],[.14,.26,.12])}}
leaf(-4.7,5.6,.85);leaf(4.6,5.5,1);leaf(-6.4,3.7,.8);leaf(6.2,4,.7);
const animals={};
function animal(c){const root=new T.Group(),body=new T.Group();root.add(body);const k=c.kind,skin=['#fff4df','#ffd666','#b98559','#bdc4cb','#e58f62'][k],clothes=['#ea8f9c','#3a9b9c','#588fb0','#c991b2','#76996f'][k];
ball(body,clothes,[0,.69,0],[.49,.63,.36]);ball(body,skin,[0,1.47,.04],[.61,.57,.5]);
if(k===0)for(const s of[-1,1]){const e=ball(body,skin,[s*.29,2.15,-.02],[.19,.59,.15]);e.rotation.z=s*-.15;ball(e,'#eca4a9',[0,.05,.82],[.53,.76,.25])}
if(k===1){ball(body,'#eda934',[0,1.29,.57],[.34,.12,.22]);for(let n=0;n<3;n++)ball(body,skin,[n*.12-.12,2,0],[.09,.20,.12])}
if(k===2)for(const s of[-1,1]){ball(body,skin,[s*.52,1.91,-.04],[.24,.24,.14]);ball(body,'#d1a484',[s*.53,1.91,.09],[.13,.14,.03])}
if(k>=3)for(const s of[-1,1]){const e=shape(body,new T.ConeGeometry(.28,.58,3),skin,[s*.43,1.98,-.02]);e.rotation.z=s*-.21;const n=shape(body,new T.ConeGeometry(.16,.34,3),'#eab6a6',[s*.44,2,.13]);n.rotation.z=s*-.21}
if(k===4){const tail=ball(body,skin,[.6,.5,-.22],[.24,.63,.27]);tail.rotation.z=-.8;ball(tail,'#fff2dc',[0,.64,0],[.9,.37,.9])}
const eyes=new T.Group();body.add(eyes);for(const s of[-1,1]){ball(eyes,'#293536',[s*.235,1.53,.51],[.086,.112,.044]);ball(eyes,'#fffaf4',[s*.215,1.565,.55],[.023,.028,.016]);ball(body,'#eaa094',[s*.41,1.28,.43],[.106,.055,.025]);ball(body,skin,[s*.53,.65,.03],[.17,.34,.17]);ball(body,'#675e55',[s*.24,.15,.13],[.23,.15,.3])}
if(k!==1)ball(body,'#63484a',[0,1.35,.59],[.07,.05,.035]);const mouth=ball(body,'#8b4a48',[0,1.18,.56],[.1,.025,.018]);ball(body,'#fff0d6',[0,.64,.354],[.19,.21,.025]);
if(k===0){ball(body,'#cf596f',[.28,2,.22],[.17,.11,.08]);ball(body,'#cf596f',[.5,2,.22],[.17,.11,.08])}if(k===1)box(body,'#fff1bf',[.19,.78,.4],[.15,.45,.045]);
root.scale.setScalar(1.26);root.userData={id:c.id,body,mouth,eyes};scene.add(root);animals[c.id]=root;return root}
LanguageContent.cast.forEach(animal);
const kite=new T.Group();scene.add(kite);const diamond=new T.Shape();diamond.moveTo(0,.8);diamond.lineTo(.6,0);diamond.lineTo(0,-.8);diamond.lineTo(-.6,0);diamond.closePath();const paper=shape(kite,new T.ShapeGeometry(diamond),'#f8c56d');paper.material.side=T.DoubleSide;box(kite,'#bd8652',[0,0,-.025],[.026,1.63,.035]);box(kite,'#bd8652',[0,0,-.025],[1.24,.026,.035]);ball(kite,'#70a55e',[0,.05,.04],[.045,.2,.025]);for(const s of[-1,1])for(const y of[-.03,.18])ball(kite,'#d8f0e9',[s*.16,y,.03],[.21,.07,.02]);const tail=tube(kite,'#d87086',[[0,-.8,0],[.22,-1.15,0],[-.16,-1.5,0],[.05,-1.8,0]],.035);tail.visible=false;
const dragonfly=new T.Group();scene.add(dragonfly);ball(dragonfly,'#416f4d',[0,0,0],[.055,.05,.3]);for(const s of[-1,1])for(const z of[-.1,.1])ball(dragonfly,'#d7edf7',[s*.2,0,z],[.26,.017,.065]);
let time=0,last=performance.now(),paused=false,talking=null,round=LanguageContent.rounds[0],moving=null,recipient=null,flying=false,width=0,height=0;
function project(v){const p=v.clone().project(camera);return {x:(p.x*.5+.5)*stage.clientWidth,y:(-.5*p.y+.5)*stage.clientHeight}}
function home(){return new T.Vector3(0,4.25,-1)}
function locations(){return round.cast.map(id=>{const a=animals[id];return {id,point:project(a.position.clone().add(new T.Vector3(0,1.4,0))),foot:project(a.position.clone().add(new T.Vector3(0,-.14,0)))}})}
function setRound(r,index=0){round=r;recipient=null;flying=false;moving=null;tail.visible=index>0;animals&&Object.values(animals).forEach(a=>a.visible=false);r.cast.forEach((id,i)=>{const a=animals[id];a.visible=true;a.position.set((i-1)*2.95,0,.2)});scene.background.set(index===4?'#ecd9c1':'#c5e4df');scene.fog.color.copy(scene.background);water.material.color.set(index===4?'#8bbfc2':'#60bec2');lawn.material.color.set(index===3?'#98b985':'#aecb87');trees.forEach((t,i)=>t.rotation.y=index*.6+i);kite.position.copy(home());onFrame?.(locations());}
function move(id,celebrate=false){recipient=id;flying=celebrate;const a=id?animals[id]:null;const to=a?new T.Vector3(a.position.x,celebrate?3.6:2.6,1):home();moving={from:kite.position.clone(),to,start:time};if(celebrate)tail.visible=true}
function update(now){requestAnimationFrame(update);const dt=Math.min(.04,(now-last)/1000);last=now;if(!paused)time+=dt;const w=stage.clientWidth,h=stage.clientHeight;if(w!==width||h!==height){width=w;height=h;const halfW=Math.max(5.4,5.0*w/h),halfH=halfW*h/w;camera.left=-halfW;camera.right=halfW;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
if(!paused){for(const a of Object.values(animals)){a.userData.body.rotation.z=Math.sin(time*1.8+a.position.x)*.024;a.userData.mouth.scale.y=talking===a.userData.id?.025+Math.abs(Math.sin(time*16))*.045:.025;a.userData.eyes.scale.y=(time%5<.12)?.2:1}
if(moving){const p=Math.min(1,(time-moving.start)/.32),q=1-(1-p)**3;kite.position.lerpVectors(moving.from,moving.to,q);kite.position.y+=Math.sin(p*Math.PI)*.25;if(p===1)moving=null}else if(flying)kite.position.y=3.6+Math.sin(time*2)*.18;kite.rotation.z=Math.sin(time*2)*.08;dragonfly.position.set(Math.sin(time*.25)*5,4.8+Math.sin(time)*.13,-3);dragonfly.rotation.y=time*.2;}
renderer.render(scene,camera);onFrame?.(round.cast.map(id=>{const a=animals[id];return {id,point:project(a.position.clone().add(new T.Vector3(0,1.4,0))),foot:project(a.position.clone().add(new T.Vector3(0,-.14,0)))}}));}
setRound(round);requestAnimationFrame(update);return {setRound,move,project,setTalking:id=>talking=id,setPaused:v=>paused=v,inspect:()=>({recipient,kite:kite.position.toArray(),moving:!!moving,cast:round.cast.slice(),paused,time,canvas:[canvas.width,canvas.height]})};
};
})();
