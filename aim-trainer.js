"use strict";
(()=>{
 const $=id=>document.getElementById(id),canvas=$("aimCanvas"),ctx=canvas.getContext("2d",{alpha:false}),arena=$("arena");
 if(!ctx){$("status").textContent="Your browser does not support the canvas needed for this game.";return}
 const ids=["preset","mode","duration","targetSize","speed","targetCount","targetColor","crosshair","showTrails","sound","missPenalty"];
 const controls=Object.fromEntries(ids.map(id=>[id,$(id)]));
 const presets={
  valorant:{mode:"flick",duration:"30",targetSize:"19",speed:"3",targetCount:"1",targetColor:"#ff525e",crosshair:"cross"},
  cs2:{mode:"switch",duration:"60",targetSize:"24",speed:"4",targetCount:"5",targetColor:"#ffb348",crosshair:"cross"},
  tracking:{mode:"tracking",duration:"60",targetSize:"33",speed:"5",targetCount:"1",targetColor:"#65d6ff",crosshair:"dot"}
 };
 let width=0,height=0,dpr=1,targets=[],effects=[],pointer={x:-999,y:-999,inside:false},running=false,paused=false,raf=0;
 let endTime=0,pauseStarted=0,startTime=0,lastFrame=0,totalPaused=0,hits=0,shots=0,misses=0,trackedSeconds=0,engagedSeconds=0,combo=0,longest=0,score=0,elapsed=0,roundLength=30,completed=false;
 let audio=null;
 const routineStages=[
  {name:"Flick Shots",mode:"flick",radius:23,speed:2,count:1,color:"#ff525e",tip:"Snap to the center of every target."},
  {name:"Target Switching",mode:"switch",radius:24,speed:3,count:5,color:"#ffb348",tip:"Move quickly between different targets."},
  {name:"Moving Targets",mode:"moving",radius:29,speed:5,count:3,color:"#90d96d",tip:"Time each click while the targets move."},
  {name:"Smooth Tracking",mode:"tracking",radius:34,speed:5,count:1,color:"#65d6ff",tip:"Hold your cursor over the moving target."}
 ];
 const routineDuration=75;
 let routineActive=false,routineIndex=0,routineDone=[],routinePaused=false;
 function showRoutine(){
  $("routineProgress").hidden=!routineActive;
  const elapsedTotal=routineIndex*routineDuration+elapsed;
  $("routineLabel").textContent="5-minute warm-up · "+(routineIndex+1)+"/4 · "+routineStages[routineIndex].name+" · "+Math.max(0,Math.ceil(300-elapsedTotal))+"s remaining";
  $("routineFill").style.width=Math.min(100,Math.max(0,elapsedTotal/300*100))+"%";
  [...$("warmupSteps").children].forEach((n,i)=>n.classList.toggle("active",routineActive&&i===routineIndex));
  $("warmupBtn").textContent=routineActive?"■ End warm-up":"▶ Start 5-minute warm-up";
 }
 function abortRoutine(){routineActive=false;routineDone=[];routineIndex=0;routinePaused=false;$("routineProgress").hidden=true;[...$("warmupSteps").children].forEach(n=>n.classList.remove("active"));$("warmupBtn").textContent="▶ Start 5-minute warm-up"}
 function applyStage(){
  const s=routineStages[routineIndex];controls.mode.value=s.mode;controls.targetSize.value=String(s.radius);controls.speed.value=String(s.speed);controls.targetCount.value=String(s.count);controls.targetColor.value=s.color;controls.preset.value="custom";updateLabels()
 }
 function beginRoutine(){
  abortRoutine();routineActive=true;routineIndex=0;applyStage();start(true);showRoutine();
 }
 function completeStage(){
  const metrics=getMetrics(),stage=routineStages[routineIndex];
  routineDone.push({name:stage.name,mode:stage.mode,score:metrics.score,accuracy:metrics.acc,hits,shots,tracking:trackedSeconds,engaged:engagedSeconds,rate:metrics.rate});
  if(routineIndex<routineStages.length-1){
   routineIndex++;applyStage();start(true);showRoutine();setStatus("Drill "+(routineIndex+1)+"/4: "+routineStages[routineIndex].name+" — "+routineStages[routineIndex].tip);
  }else completeRoutine();
 }
 function completeRoutine(){
  const records=routineDone.slice(),total=records.reduce((a,r)=>a+r.score,0),click=records.filter(r=>r.mode!=="tracking"),shotTotal=click.reduce((a,r)=>a+r.shots,0),hitTotal=click.reduce((a,r)=>a+r.hits,0),clickAccuracy=shotTotal?Math.round(100*hitTotal/shotTotal):0,track=records.find(r=>r.mode==="tracking"),trackAccuracy=track?track.accuracy:0;
  running=false;paused=false;completed=true;cancelAnimationFrame(raf);
  const prev=Number((()=>{try{return localStorage.getItem("cmw-aim-routine-best")}catch(e){return 0}})())||0;
  if(total>prev){try{localStorage.setItem("cmw-aim-routine-best",String(total))}catch(e){}}
  abortRoutine();$("pauseBtn").disabled=true;showOverlay("Warm-up complete!","Five minutes completed · Total score: "+total+" · Click accuracy: "+clickAccuracy+"%","Run again →");
  $("results").hidden=false;$("resultsTitle").textContent="5-minute warm-up report";
  $("resultDetails").textContent="Overall score: "+total+" · Click accuracy: "+clickAccuracy+"% · Tracking coverage: "+trackAccuracy+"%";
  $("resultTip").textContent=total>prev?"🏆 New five-minute personal best!":"Personal best: "+prev+" points. Keep practicing before your next match.";
  const report=$("routineReport");report.replaceChildren();
  records.forEach(r=>{const p=document.createElement("p");p.className="routine-results";const strong=document.createElement("strong");strong.textContent=r.name+" — "+r.score+" points";p.append(strong,document.createTextNode(" · "+(r.mode==="tracking"?r.tracking.toFixed(1)+"s on target ("+r.accuracy+"% coverage)":r.hits+" hits · "+r.accuracy+"% accuracy")));report.append(p)});
  setStatus("Your warm-up is complete. Review the drill breakdown or play again.");
 }
 
 const setting=()=>({
  mode:controls.mode.value,
  duration:Number(controls.duration.value),
  radius:Number(controls.targetSize.value),
  speed:Number(controls.speed.value),
  count:Number(controls.targetCount.value),
  color:controls.targetColor.value,
  crosshair:controls.crosshair.value,
  trails:controls.showTrails.checked,
  sound:controls.sound.checked,
  penalty:controls.missPenalty.checked
 });
 function savedBest(){try{return Number(localStorage.getItem("cmw-aim-best-"+controls.mode.value+"-"+controls.duration.value))||0}catch(e){return 0}}
 function saveBest(value){try{localStorage.setItem("cmw-aim-best-"+controls.mode.value+"-"+controls.duration.value,String(value))}catch(e){}}
 function setStatus(s){$("status").textContent=s}
 function updateLabels(){$("sizeLabel").textContent=controls.targetSize.value+" px radius";$("speedLabel").textContent=controls.speed.value+" / 10";$("bestStat").textContent=savedBest()||"—"}
 function configurePreset(name){const config=presets[name];if(!config)return;for(const [k,v] of Object.entries(config))controls[k].value=v;saveDefaults(false);resetRound()}
 function saveDefaults(custom=true){if(custom)controls.preset.value="custom";try{localStorage.setItem("cmw-aim-settings",JSON.stringify(Object.fromEntries(ids.map(k=>[k,controls[k].type==="checkbox"?controls[k].checked:controls[k].value]))))}catch(e){}updateLabels()}
 function restore(){try{const saved=JSON.parse(localStorage.getItem("cmw-aim-settings"));if(saved&&typeof saved==="object"){for(const k of ids){if(saved[k]!==undefined){if(controls[k].type==="checkbox")controls[k].checked=Boolean(saved[k]);else if([...controls[k].options||[]].length){if([...controls[k].options].some(o=>o.value===saved[k]))controls[k].value=saved[k]}else controls[k].value=saved[k]}}controls.preset.value="custom";return}}catch(e){}configurePreset("valorant")}
 function resize(){const r=arena.getBoundingClientRect();width=Math.max(200,r.width);height=Math.max(200,r.height);dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);targets.forEach(t=>{t.x=Math.min(width-t.r-6,Math.max(t.r+6,t.x));t.y=Math.min(height-t.r-6,Math.max(t.r+6,t.y))});draw()}
 function randomTarget(exclude=[]){const s=setting(),r=Math.min(s.radius,Math.max(12,Math.min(width,height)/7)),pad=r+9;let x=width/2,y=height/2;for(let i=0;i<35;i++){x=pad+Math.random()*Math.max(1,width-2*pad);y=pad+Math.random()*Math.max(1,height-2*pad);if(exclude.every(t=>Math.hypot(x-t.x,y-t.y)>r+t.r+18))break}const angle=Math.random()*Math.PI*2,velocity=26+s.speed*20;return {x,y,r,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,phase:Math.random()*7}}
 function fillTargets(){targets=[];const n=setting().mode==="flick"?1:setting().count;for(let i=0;i<n;i++)targets.push(randomTarget(targets))}
 function showOverlay(title,message,buttonText){$("overlayTitle").textContent=title;$("overlayMessage").textContent=message;$("overlayStart").textContent=buttonText;$("arenaOverlay").hidden=false}
 function hideOverlay(){$("arenaOverlay").hidden=true}
 function resetRound(){cancelAnimationFrame(raf);running=false;paused=false;completed=false;elapsed=0;hits=0;shots=0;misses=0;trackedSeconds=0;engagedSeconds=0;combo=0;longest=0;score=0;effects=[];targets=[];pointer.inside=false;roundLength=setting().duration;$("results").hidden=true;$("resultsTitle").textContent="Round complete";$("routineReport").replaceChildren();$("pauseBtn").disabled=true;$("pauseBtn").textContent="Pause";showOverlay("Ready to warm up?","Choose your settings, then hit Start. Click targets to score; tracking mode rewards keeping the cursor on a moving target.","Start training →");setStatus("Mouse recommended · Space pauses during a round · Esc exits fullscreen");updateStats();draw()}
 function start(fromRoutine=false){if(!fromRoutine&&routineActive)abortRoutine();cancelAnimationFrame(raf);resetRound();if(fromRoutine)roundLength=routineDuration;running=true;paused=false;startTime=performance.now();lastFrame=startTime;endTime=startTime+roundLength*1000;totalPaused=0;fillTargets();hideOverlay();$("pauseBtn").disabled=false;setStatus(setting().mode==="tracking"?"Keep your cursor on moving targets to earn points.":"Click the targets as quickly and accurately as possible.");raf=requestAnimationFrame(frame)}
 function pause(){if(!running)return;if(!paused){paused=true;pauseStarted=performance.now();$("pauseBtn").textContent="Resume";showOverlay("Paused","Your timer is paused. Resume whenever you're ready.","Resume →");cancelAnimationFrame(raf);setStatus("Training paused")}else{const now=performance.now();endTime+=now-pauseStarted;totalPaused+=now-pauseStarted;lastFrame=now;paused=false;$("pauseBtn").textContent="Pause";hideOverlay();setStatus("Training resumed");raf=requestAnimationFrame(frame)}}
 function getMetrics(){const mode=setting().mode,acc=mode==="tracking"?(engagedSeconds>0?Math.round(100*trackedSeconds/engagedSeconds):0):(shots?Math.round(100*hits/shots):0);return {acc,rate:elapsed>0?hits/elapsed:0,score:Math.max(0,Math.round(score))}}
 function updateStats(){const m=getMetrics();$("timeStat").textContent=Math.max(0,Math.ceil(roundLength-elapsed))+"s";$("hitStat").textContent=setting().mode==="tracking"?trackedSeconds.toFixed(1)+"s":String(hits);$("accuracyStat").textContent=hits||shots||engagedSeconds?m.acc+"%":"—";$("rateStat").textContent=setting().mode==="tracking"?(trackedSeconds/Math.max(elapsed,.001)*100).toFixed(0)+"%":m.rate.toFixed(2);$("bestStat").textContent=savedBest()||"—"}
 function finish(){if(!running)return;if(routineActive){completeStage();return}running=false;paused=false;completed=true;cancelAnimationFrame(raf);elapsed=roundLength;const m=getMetrics(),old=savedBest(),newBest=m.score>old;if(newBest)saveBest(m.score);updateStats();$("pauseBtn").disabled=true;showOverlay("Warm-up complete!","Score: "+m.score+" · Accuracy: "+m.acc+"% · "+(setting().mode==="tracking"?"Tracked: "+trackedSeconds.toFixed(1)+"s":"Hits: "+hits+" / Shots: "+shots),"Play again →");$("results").hidden=false;$("resultDetails").textContent="Score: "+m.score+" · "+(setting().mode==="tracking"?"Target coverage: "+m.acc+"%":"Accuracy: "+m.acc+"% · Hits/sec: "+m.rate.toFixed(2)+" · Best combo: "+longest);$("resultTip").textContent=newBest?"🏆 New personal best for this mode and duration!":"Tip: Lower target size or increase speed as your accuracy improves.";setStatus("Round finished. Choose Play again or change your settings.")}
 function sound(hit){if(!setting().sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type="sine";o.frequency.value=hit?690:220;g.gain.value=.04;g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.07);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.07)}catch(e){}}
 function hitFeedback(x,y,hit){if(!setting().trails)return;effects.push({x,y,hit,life:.30})}
 function shoot(x,y){if(!running||paused||setting().mode==="tracking")return;shots++;let closest=-1;for(let i=targets.length-1;i>=0;i--){const t=targets[i];if(Math.hypot(x-t.x,y-t.y)<=t.r){closest=i;break}}
 if(closest>=0){hits++;combo++;longest=Math.max(longest,combo);score+=100+Math.min(50,(combo-1)*5);hitFeedback(x,y,true);sound(true);targets.splice(closest,1);targets.push(randomTarget(targets))}else{misses++;combo=0;if(setting().penalty)score=Math.max(0,score-35);hitFeedback(x,y,false);sound(false)}updateStats()}
 function moveTargets(dt){const mode=setting().mode;if(mode==="flick"||mode==="switch")return;for(const t of targets){t.x+=t.vx*dt;t.y+=t.vy*dt;const pad=t.r+7;if(t.x<pad){t.x=pad;t.vx=Math.abs(t.vx)}if(t.x>width-pad){t.x=width-pad;t.vx=-Math.abs(t.vx)}if(t.y<pad){t.y=pad;t.vy=Math.abs(t.vy)}if(t.y>height-pad){t.y=height-pad;t.vy=-Math.abs(t.vy)}}}
 function frame(now){if(!running||paused)return;const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;elapsed=Math.min(roundLength,(now-startTime-totalPaused)/1000);if(elapsed>=roundLength){finish();return}if(routineActive)showRoutine()
 moveTargets(dt);if(setting().mode==="tracking"){engagedSeconds+=dt;const on=pointer.inside&&targets.some(t=>Math.hypot(pointer.x-t.x,pointer.y-t.y)<=t.r);if(on){trackedSeconds+=dt;score+=dt*100;hits=Math.round(trackedSeconds*10)}}effects.forEach(e=>e.life-=dt);effects=effects.filter(e=>e.life>0);draw();updateStats();raf=requestAnimationFrame(frame)}
 function draw(){if(!width||!height)return;ctx.fillStyle="#101823";ctx.fillRect(0,0,width,height);ctx.strokeStyle="rgba(130,160,200,.11)";ctx.lineWidth=1;const gap=44;for(let x=0;x<width;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke()}for(let y=0;y<height;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}
 const s=setting();for(const t of targets){ctx.beginPath();ctx.arc(t.x,t.y,t.r+5,0,Math.PI*2);ctx.strokeStyle="rgba(255,255,255,.23)";ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill();ctx.beginPath();ctx.arc(t.x,t.y,Math.max(3,t.r*.28),0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,.78)";ctx.fill()}
 for(const e of effects){ctx.beginPath();ctx.arc(e.x,e.y,14+(1-e.life/.30)*19,0,Math.PI*2);ctx.strokeStyle=e.hit?"rgba(89,245,155,"+(e.life/.30)+")":"rgba(255,90,90,"+(e.life/.30)+")";ctx.lineWidth=2;ctx.stroke()}
 if(pointer.inside&&s.crosshair!=="none"){ctx.save();ctx.strokeStyle="#f8fbff";ctx.fillStyle="#f8fbff";ctx.lineWidth=2;ctx.shadowColor="#000";ctx.shadowBlur=4;const x=pointer.x,y=pointer.y;if(s.crosshair==="dot"){ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill()}else if(s.crosshair==="ring"){ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.stroke()}else{ctx.beginPath();ctx.moveTo(x-13,y);ctx.lineTo(x-5,y);ctx.moveTo(x+5,y);ctx.lineTo(x+13,y);ctx.moveTo(x,y-13);ctx.lineTo(x,y-5);ctx.moveTo(x,y+5);ctx.lineTo(x,y+13);ctx.stroke()}ctx.restore()}}
 function pointerCoords(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(width/r.width),y:(e.clientY-r.top)*(height/r.height)}}
 canvas.addEventListener("pointermove",e=>{const p=pointerCoords(e);pointer={...p,inside:true};if(!running)draw()});
 canvas.addEventListener("pointerleave",()=>{pointer.inside=false;if(!running)draw()});
 canvas.addEventListener("pointerdown",e=>{if(e.button!==0)return;const p=pointerCoords(e);pointer={...p,inside:true};shoot(p.x,p.y);if(!running)draw()});
 controls.preset.addEventListener("change",()=>{if(controls.preset.value==="custom")return;if(routineActive)abortRoutine();configurePreset(controls.preset.value)});
 for(const k of ids){const c=controls[k];c.addEventListener(k==="targetSize"||k==="speed"?"input":"change",()=>{if(routineActive)abortRoutine();saveDefaults();resetRound()})}
 $("resetSettings").addEventListener("click",()=>{if(routineActive)abortRoutine();controls.preset.value="valorant";controls.showTrails.checked=true;controls.missPenalty.checked=true;controls.sound.checked=false;configurePreset("valorant")});
 $("warmupBtn").addEventListener("click",()=>{if(routineActive){abortRoutine();resetRound();setStatus("Guided warm-up ended.")}else beginRoutine()});$("startBtn").addEventListener("click",()=>start(false));$("overlayStart").addEventListener("click",()=>{if(paused)pause();else if(completed&&$("resultsTitle").textContent==="5-minute warm-up report")beginRoutine();else start(false)});$("pauseBtn").addEventListener("click",pause);
 $("fullscreenBtn").addEventListener("click",async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await arena.requestFullscreen()}catch(e){setStatus("Fullscreen was blocked by the browser.")}});
 document.addEventListener("keydown",e=>{if(e.code==="Space"&&running&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLSelectElement)&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();pause()}});
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&running&&!paused)pause()});
 if(typeof ResizeObserver!=="undefined"){new ResizeObserver(resize).observe(arena)}else window.addEventListener("resize",resize);
 restore();updateLabels();resize();resetRound();showRoutine();
})();
