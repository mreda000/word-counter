import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
const $=id=>document.getElementById(id);
const frameEl=$("chickenFrame"),overlay=$("chickenOverlay"),startButton=$("chickenStart"),prompt=$("petPrompt"),message=$("petMessage");
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa8d9f7);scene.fog=new THREE.Fog(0xa8d9f7,38,115);
const camera=new THREE.PerspectiveCamera(76,1,.08,150);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
frameEl.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xf4faff,0x70904b,2.3));
const sun=new THREE.DirectionalLight(0xfff1cf,2.4);sun.position.set(-23,42,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.normalBias=.02;scene.add(sun);
const mat=(c,r=1)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const grass=mat(0x73b65f),dirt=mat(0xcaa075),wood=mat(0x9f653e),darkWood=mat(0x73432b),white=mat(0xfaf0da),roof=mat(0x924638),red=mat(0xc44d3d),yellow=mat(0xffc647),black=mat(0x272829),pink=mat(0xffb5a1),leaf=mat(0x4f9341),trunk=mat(0x775238),stone=mat(0x999b8b);
const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,12,9),cone=new THREE.ConeGeometry(1,1,6),cylinder=new THREE.CylinderGeometry(1,1,1,9);
function mesh(geometry,material,parent=scene,x=0,y=0,z=0){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(w,h,d,material,x,y,z,parent=scene){const o=mesh(cube,material,parent,x,y,z);o.scale.set(w,h,d);return o}
function ball(sx,sy,sz,material,x,y,z,parent=scene){const o=mesh(sphere,material,parent,x,y,z);o.scale.set(sx,sy,sz);return o}
const ground=box(180,.5,180,grass,0,-.3,0);ground.castShadow=false;
const obstacles=[];
function obstacle(x,z,w,d){obstacles.push({x,z,w,d})}
for(let i=-1;i<=1;i++){box(4,.035,125,dirt,i*3,-.03,0);box(115,.035,4,dirt,0,-.02,i*3)}
function barn(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(12,6,9,red,0,3,0,g);const r1=box(8,.55,10.8,roof,-3.1,7.2,0,g);r1.rotation.z=-.58;const r2=box(8,.55,10.8,roof,3.1,7.2,0,g);r2.rotation.z=.58;box(3.6,4,.18,darkWood,0,2,4.6,g);box(.16,4,.28,wood,0,2,4.78,g);box(3.65,.16,.28,wood,0,2,4.78,g);box(1.8,1.6,.2,white,-3.3,4.2,4.6,g);obstacle(x,z,12,9)}
barn(-24,-24);
function shed(x,z){box(6,3.3,5,wood,x,1.65,z);box(7,.5,6,roof,x,3.6,z);box(2.3,2.6,.2,darkWood,x,1.3,z+2.6);obstacle(x,z,6,5)}shed(22,-22);
function fenceSegment(x,z,axis){if(axis==="x"){box(3.8,.15,.16,wood,x,1.05,z);box(3.8,.15,.16,wood,x,.55,z);box(.22,1.7,.22,darkWood,x-1.8,.9,z)}else{box(.16,.15,3.8,wood,x,1.05,z);box(.16,.15,3.8,wood,x,.55,z);box(.22,1.7,.22,darkWood,x,.9,z-1.8)}}
for(let n=-12;n<=12;n++){if(Math.abs(n)>2){fenceSegment(n*3.8,-48,"x");fenceSegment(n*3.8,48,"x")}fenceSegment(-48,n*3.8,"z");fenceSegment(48,n*3.8,"z")}
function tree(x,z,scale=1){const t=new THREE.Group();t.position.set(x,0,z);t.scale.setScalar(scale);scene.add(t);mesh(cylinder,trunk,t,0,2,0).scale.set(.42,4,.42);ball(2.1,2.5,2.1,leaf,0,5.3,0,t);ball(1.8,1.6,1.8,leaf,1.3,5.8,.3,t);ball(1.8,1.5,1.8,leaf,-1.1,5.8,-.4,t);obstacle(x,z,2*scale,2*scale)}
const treeSpots=[[-39,-34],[-34,0],[-39,31],[-20,38],[-3,-37],[11,-34],[36,-34],[38,-7],[36,17],[27,36],[4,39],[-39,15],[-14,-10],[13,15]];
treeSpots.forEach(([x,z],i)=>tree(x,z,.7+(i%3)*.16));
function hay(x,z){const o=mesh(cylinder,yellow,scene,x,.7,z);o.scale.set(1.4,.7,1.4);o.rotation.z=Math.PI/2;obstacle(x,z,2.5,2.5)}
hay(-16,-27);hay(-13,-27);hay(26,-10);hay(29,-10);
function flowers(x,z,color){for(let i=0;i<8;i++){const xx=x+(i%4)*.63,zz=z+Math.floor(i/4)*.62;box(.055,.55,.055,leaf,xx,.3,zz);ball(.18,.13,.18,color,.0+xx,.63,zz)}}
flowers(-10,8,yellow);flowers(14,30,pink);flowers(-27,15,white);flowers(25,6,yellow);
function chicken(x,z,index){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const feather=mat([0xfef7e2,0xfaf1dc,0xe3aa73,0xe5e2d6][index%4]);const wing=mat([0xf2e8d5,0xe7d8bd,0xc68e5a,0xd0d0c4][index%4]);
ball(.62,.66,.78,feather,0,.75,0,g);ball(.4,.41,.41,feather,0,1.36,-.45,g);
ball(.34,.33,.13,wing,-.52,.83,0,g);ball(.34,.33,.13,wing,.52,.83,0,g);
const comb=ball(.16,.21,.1,red,0,1.79,-.53,g);comb.rotation.z=.25;
ball(.09,.1,.055,black,-.32,1.43,-.77,g);ball(.09,.1,.055,black,.32,1.43,-.77,g);
const beak=mesh(cone,yellow,g,0,1.26,-.88);beak.scale.set(.21,.34,.21);beak.rotation.x=-Math.PI/2;
const wattle=ball(.12,.16,.13,red,0,1.02,-.78,g);
box(.11,.39,.12,yellow,-.26,.21,.15,g);box(.11,.39,.12,yellow,.26,.21,.15,g);
for(const dx of [-.26,.26])for(const k of [-1,0,1])box(.065,.08,.27,yellow,dx+k*.085,.045,-.15,g);
const tail=mesh(cone,wing,g,0,1.13,.68);tail.scale.set(.37,.6,.27);tail.rotation.x=.45;
const heart=mesh(sphere,mat(0xff6e94),g,0,2.23,0);heart.scale.set(.18,.18,.18);heart.visible=false;
return {g,heart,origin:new THREE.Vector2(x,z),speed:.4+Math.random()*.3,heading:Math.random()*Math.PI*2,turn:Math.random()*5,phase:Math.random()*7,petted:false,heartUntil:0}}
const spots=[[-3,-9],[8,-11],[-16,4],[18,7],[28,27],[-29,29],[-31,-15],[4,28],[30,-28],[-7,-32],[0,10],[-24,8]];
const chickens=spots.map(([x,z],i)=>chicken(x,z,i));
const player=new THREE.Vector3(0,1.7,20);
camera.position.copy(player);
let yaw=0,pitch=0,playing=false,won=false,startedAt=0,elapsedBefore=0,petted=0,last=performance.now(),clockTime=0,animation=0,toastTime=0;
const keys=new Set(),clock=new THREE.Clock(),ray=new THREE.Raycaster();
const farmer=new THREE.Group();camera.add(farmer);scene.add(camera);
const sleeve=mat(0x47739d),skin=mat(0xe3ae7f);
for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.53,-.42,-.65);farmer.add(arm);const upper=box(.28,.52,.29,sleeve,side*.06,-.19,0,arm);upper.rotation.x=-.26;const hand=box(.24,.3,.25,skin,side*.07,-.54,-.08,arm);arm.userData.side=side;arm.userData.upper=upper;arm.userData.hand=hand}
function collision(x,z){if(x< -45.5||x>45.5||z< -45.5||z>45.5)return true;return obstacles.some(o=>Math.abs(x-o.x)<o.w/2+.55&&Math.abs(z-o.z)<o.d/2+.55)}
function resize(){const w=frameEl.clientWidth,h=frameEl.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
new ResizeObserver(resize).observe(frameEl);resize();
function seconds(){return Math.floor(elapsedBefore+(playing?(performance.now()-startedAt)/1000:0))}
function stamp(t){return Math.floor(t/60)+":"+String(t%60).padStart(2,"0")}
function saveBest(t){try{const old=Number(localStorage.getItem("cmw-pet-chicken-best"));if(!old||t<old)localStorage.setItem("cmw-pet-chicken-best",String(t))}catch(e){}}
function best(){try{return Number(localStorage.getItem("cmw-pet-chicken-best"))||0}catch(e){return 0}}
function showOverlay(title,description,button){$("chickenTitle").textContent=title;$("chickenDescription").textContent=description;startButton.textContent=button;overlay.hidden=false;prompt.hidden=true}
function startGame(){if(won){reset()}renderer.domElement.requestPointerLock?.()}
function reset(){petted=0;won=false;elapsedBefore=0;player.set(0,1.7,20);yaw=0;pitch=0;chickens.forEach((c,i)=>{c.petted=false;c.heart.visible=false;c.g.position.set(spots[i][0],0,spots[i][1]);c.heading=Math.random()*Math.PI*2});$("petCount").textContent="🐔 Chickens petted: 0 / "+chickens.length}
function nearest(){let candidate=null,dist=2.9;const forward=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);for(const c of chickens){if(c.petted)continue;const dx=c.g.position.x-player.x,dz=c.g.position.z-player.z,d=Math.hypot(dx,dz);if(d>dist)continue;const v=new THREE.Vector3(dx,0,dz).normalize();const look=new THREE.Vector3(forward.x,0,forward.z).normalize();if(v.dot(look)<.42)continue;dist=d;candidate=c}return candidate}
function toast(s){message.textContent=s;message.hidden=false;toastTime=performance.now()+1900}
function pet(){if(!playing||won)return;const c=nearest();if(!c)return toast("Get closer and face a chicken!");c.petted=true;c.heart.visible=true;c.heartUntil=performance.now()+1800;petted++;animation=.32;$("petCount").textContent="🐔 Chickens petted: "+petted+" / "+chickens.length;toast(["Bawk! ❤️","Happy clucks! 🐣","A very loved chicken! 💛","Cluck yeah! 🐔"][petted%4]);if(petted===chickens.length){const t=seconds();saveBest(t);won=true;elapsedBefore=t;playing=false;document.exitPointerLock?.();showOverlay("Every chicken is happy! 🐔","You found and petted all "+petted+" chickens in "+stamp(t)+". "+(best()?"Your best time: "+stamp(best())+". ":"")+"Want another round?","Play again →")}}
startButton.addEventListener("click",startGame);
renderer.domElement.addEventListener("click",()=>{if(document.pointerLockElement===renderer.domElement)pet();else if(!won)renderer.domElement.requestPointerLock?.()});
document.addEventListener("pointerlockchange",()=>{const locked=document.pointerLockElement===renderer.domElement;if(locked){playing=true;overlay.hidden=true;startedAt=performance.now();$("chickenStatus").textContent="Find chickens, approach them and click while facing them."}else if(playing){elapsedBefore=seconds();playing=false;showOverlay("Farm paused","You've petted "+petted+" of "+chickens.length+" chickens. Jump back in when you're ready.","Resume exploring →")}});
document.addEventListener("pointerlockerror",()=>{showOverlay("Mouse control unavailable","Your browser blocked mouse lock. Try clicking Enter the farm again in a desktop browser.","Try again")});
document.addEventListener("mousemove",e=>{if(!playing)return;yaw-=e.movementX*.0022;pitch=Math.max(-1.35,Math.min(1.35,pitch-e.movementY*.0022))});
document.addEventListener("keydown",e=>{if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)&&document.pointerLockElement===renderer.domElement)e.preventDefault();keys.add(e.code)});
document.addEventListener("keyup",e=>keys.delete(e.code));
window.addEventListener("blur",()=>keys.clear());
function updateChickens(dt,t){for(const c of chickens){if(!c.petted){c.turn-=dt;if(c.turn<0){c.heading+=(Math.random()-.5)*1.9;c.turn=1.4+Math.random()*3}const mx=Math.sin(c.heading)*dt*c.speed,mz=Math.cos(c.heading)*dt*c.speed,nx=c.g.position.x+mx,nz=c.g.position.z+mz;if(!collision(nx,nz)&&Math.hypot(nx-c.origin.x,nz-c.origin.y)<9){c.g.position.x=nx;c.g.position.z=nz}else{c.heading+=Math.PI*.75;c.turn=.8}c.g.rotation.y=c.heading+Math.PI;c.g.position.y=Math.sin(t*9+c.phase)*.025}else{c.g.position.y=.04+Math.sin(t*3+c.phase)*.025;c.heart.visible=performance.now()<c.heartUntil;if(c.heart.visible)c.heart.position.y=2.23+Math.sin(t*7)*.2}}}
function update(dt,t){if(playing){const forward=(keys.has("KeyW")||keys.has("ArrowUp")?1:0)-(keys.has("KeyS")||keys.has("ArrowDown")?1:0),right=(keys.has("KeyD")||keys.has("ArrowRight")?1:0)-(keys.has("KeyA")||keys.has("ArrowLeft")?1:0);const len=Math.hypot(forward,right)||1,spd=keys.has("ShiftLeft")||keys.has("ShiftRight")?8:4.4;const vx=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)/len*dt*spd,vz=(-Math.cos(yaw)*forward-Math.sin(yaw)*right)/len*dt*spd;if(!collision(player.x+vx,player.z))player.x+=vx;if(!collision(player.x,player.z+vz))player.z+=vz;const moving=forward!==0||right!==0;player.y=1.7+(moving?Math.sin(t*11)*.048:0);animation=Math.max(0,animation-dt);farmer.rotation.x=animation>0?-.85*Math.sin((.32-animation)/.32*Math.PI):0;farmer.position.y=moving?Math.sin(t*11)*.025:0;camera.rotation.order="YXZ";camera.rotation.y=yaw;camera.rotation.x=pitch;camera.position.copy(player);prompt.hidden=!nearest();$("timer").textContent="⏱ "+stamp(seconds());}if(!message.hidden&&performance.now()>toastTime)message.hidden=true;updateChickens(dt,t)}
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.055);clockTime+=dt;update(dt,clockTime);renderer.render(scene,camera)}
showOverlay("Pet the Chicken","You're a farmer on a mission. Explore the farm, find 12 wandering chickens, and pet them all!","Enter the farm →");
loop();
