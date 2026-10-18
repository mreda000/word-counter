"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const samples={
 easy:[
 "The morning sun shines through the window as a new day begins. You take a deep breath and start to write. Every word is a small step toward a bigger goal. Practice a little every day and you will see how much you can improve.",
 "A quiet walk in the park can help clear your mind. Birds sing in the trees while the wind moves the leaves. Take your time and enjoy each moment. Simple habits can make a big difference when you repeat them every day.",
 "Good ideas often begin with a simple question. What could you learn today? Try something new and keep going when it feels hard. Small changes can turn into great progress if you stay curious and give yourself time."
 ],
 medium:[
 "Learning to type quickly is like learning a musical instrument. At first, every movement requires attention, but consistent practice builds a comfortable rhythm. Focus on accuracy before speed, relax your shoulders, and let your fingers find their own pace.",
 "Creative projects thrive when curiosity meets consistency. A short daily session can produce surprising results over several months. Remember to review your progress, celebrate improvements, and experiment with different approaches whenever your motivation needs a little spark.",
 "Technology changes how we work, communicate, and explore ideas. Yet the most useful skills are surprisingly timeless: clear thinking, patience, adaptability, and the ability to explain complex topics in simple language that anyone can understand."
 ],
 hard:[
 "Precision matters: a 17% improvement doesn't appear overnight! Can you manage punctuation, numbers (42, 108, and 365), and unusual combinations without losing your rhythm? The challenge isn't just speed—it's steady, deliberate control.",
 "At 9:45 a.m., the project manager reviewed three estimates: $1,250.00, $980.75, and $2,410.50. \"Which option works best?\" she asked. Everyone paused, compared the details, and reached a decision—carefully.",
 "Efficient communication requires more than quick fingers; it demands focus, clarity, and confidence. Consider this: if your accuracy slips from 98% to 87%, is a faster result actually better? Try again—and measure both."
 ]};
 let target="",startTime=null,deadline=0,timer=null,finished=false,lastSeconds=0;
 const input=$("typingInput"),duration=$("duration"),difficulty=$("difficulty"),passage=$("passage");
 function key(){return "cmw-typing-best-"+difficulty.value+"-"+duration.value}
 function best(){try{return Math.max(0,Number(localStorage.getItem(key()))||0)}catch(e){return 0}}
 function showBest(){$("personalBest").textContent=best()?best()+" WPM":"—"}
 function createText(){const choices=samples[difficulty.value];let parts=[];for(let i=0;i<14;i++)parts.push(choices[(i+Math.floor(Math.random()*choices.length))%choices.length]);return parts.join(" ")}
 function stats(){
 const typed=input.value,elapsed=startTime?Math.min(Number(duration.value),(Date.now()-startTime)/1000):0;
 let correct=0;for(let i=0;i<typed.length;i++)if(typed[i]===target[i])correct++;
 const accuracy=typed.length?Math.round(correct/typed.length*100):100;
 const wpm=elapsed>0?Math.round((correct/5)/(elapsed/60)):0;
 return {correct,accuracy,wpm,elapsed};
 }
 function renderText(){
 const typed=input.value,fragment=document.createDocumentFragment();
 // Draw only the part surrounding the typing cursor for smoother performance.
 const end=Math.min(target.length,Math.max(260,typed.length+160));
 for(let i=0;i<end;i++){
  const span=document.createElement("span");span.textContent=target[i];
  if(i<typed.length)span.className=typed[i]===target[i]?"correct":"wrong";
  else if(i===typed.length&&!finished)span.className="current";
  fragment.appendChild(span);
 }
 passage.replaceChildren(fragment);
 }
 function update(){
 const s=stats();$("wpm").textContent=s.wpm+" WPM";$("accuracy").textContent=s.accuracy+"%";
 const left=startTime?Math.max(0,Math.ceil((deadline-Date.now())/1000)):Number(duration.value);
 $("timeLeft").textContent=left+"s";renderText();
 if(startTime&&Date.now()>=deadline)endGame();
 else if(input.value.length>=target.length)endGame();
 }
 function stopTimer(){if(timer!==null){clearInterval(timer);timer=null}}
 function reset(){
 stopTimer();startTime=null;deadline=0;finished=false;lastSeconds=Number(duration.value);
 target=createText();input.value="";input.maxLength=target.length;input.disabled=false;
 $("results").hidden=true;$("gameMessage").textContent="Ready when you are. Type the passage as accurately as you can.";
 showBest();update();
 }
 function endGame(){
 if(finished)return;
 finished=true;stopTimer();
 const s=stats();input.disabled=true;
 const previous=best();let record=false;
 if(s.wpm>previous&&s.correct>0){try{localStorage.setItem(key(),String(s.wpm));record=true}catch(e){}}
 showBest();renderText();$("timeLeft").textContent="0s";
 $("resultSummary").textContent="You typed "+s.wpm+" WPM with "+s.accuracy+"% accuracy ("+s.correct+" correct characters).";
 $("bestMessage").textContent=record?"🏆 New personal best!":"Give it another try to beat your best!";
 $("results").hidden=false;$("gameMessage").textContent="Challenge finished!";
 }
 input.addEventListener("input",()=>{
  if(finished)return;
  if(startTime===null&&input.value.length){
   startTime=Date.now();deadline=startTime+Number(duration.value)*1000;
   timer=setInterval(update,100);
   $("gameMessage").textContent="You're doing great. Keep going!";
  }
  update();
 });
 duration.addEventListener("change",reset);difficulty.addEventListener("change",reset);
 $("restart").addEventListener("click",()=>{reset();input.focus()});
 $("playAgain").addEventListener("click",()=>{reset();input.focus()});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&startTime&&!finished)update()});
 reset();
})();