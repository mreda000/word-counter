"use strict";
(()=>{
const $=id=>document.getElementById(id),root=$("gameRoot"),title=$("gameTitle"),instructions=$("gameInstructions");
const game=document.body.dataset.game||new URLSearchParams(location.search).get("game");
let cleanup=()=>{};
function node(tag,txt="",cls=""){const x=document.createElement(tag);x.textContent=txt;if(cls)x.className=cls;return x}
function button(txt,fn){const b=node("button",txt);b.type="button";b.addEventListener("click",fn);return b}
function message(){const p=node("p","","message");p.setAttribute("role","status");p.setAttribute("aria-live","polite");return p}
function persist(key,value){try{localStorage.setItem(key,String(value))}catch(e){}}
function stored(key){try{return localStorage.getItem(key)}catch(e){return null}}
function todayUTC(){return new Date().toISOString().slice(0,10)}
const dictionary=["APPLE","BEACH","BRAVE","BRAIN","BREAD","BRICK","CHAIR","CLOUD","DANCE","DREAM","EARTH","FLAME","FRAME","FRUIT","GHOST","GLASS","GRAPE","GREEN","HOUSE","LIGHT","LEMON","MAGIC","MUSIC","NIGHT","OCEAN","PAINT","PARTY","PEACH","PIANO","PLANT","QUEST","QUICK","RIVER","ROBOT","ROUND","SHINE","SMILE","SPACE","SPARK","STONE","STORM","SUGAR","TABLE","TIGER","TRAIN","WATER","WHALE","WORLD","WRITE"];
function scramble(){
 title.textContent="Word Scramble";instructions.textContent="Unscramble as many words as possible. Solve each word to earn points; a hint costs 2 points.";
 const words=["KEYBOARD","LANGUAGE","PUZZLE","CREATIVE","JOURNEY","WRITING","NOTEBOOK","CHALLENGE","LIBRARY","SENTENCE","DISCOVER","MYSTERY","PRACTICE","VICTORY"];
 let score=0,round=0,answer="",seconds=60,timer=null,started=false,done=false;
 const stats=node("div","","scoreline"),points=node("span","Score: 0"),clock=node("span","Time: 60s");stats.append(points,clock);
 const letters=node("div","","scrambled"),input=node("input"),info=message(),actions=node("div");
 input.placeholder="Type the unscrambled word";input.autocomplete="off";input.spellcheck=false;input.setAttribute("aria-label","Your unscrambled word");
 const submit=button("Submit",check),hint=button("Hint (-2 points)",()=>{if(done)return;info.textContent="Hint: "+answer.slice(0,2)+"… ("+answer.length+" letters)";score=Math.max(0,score-2);points.textContent="Score: "+score}),restart=button("New round",reset);
 actions.style.display="flex";actions.style.gap="10px";actions.style.justifyContent="center";actions.style.flexWrap="wrap";actions.append(submit,hint,restart);
 root.replaceChildren(stats,letters,input,actions,info);
 function next(){answer=words[Math.floor(Math.random()*words.length)];let mixed=answer.split("");for(let i=mixed.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[mixed[i],mixed[j]]=[mixed[j],mixed[i]]}if(mixed.join("")===answer)mixed.reverse();letters.textContent=mixed.join(" ");input.value="";input.focus()}
 function finish(){done=true;clearInterval(timer);timer=null;input.disabled=true;submit.disabled=true;hint.disabled=true;info.textContent="Time! Final score: "+score+". Select New round to play again."}
 function check(){if(done)return;if(!started){started=true;timer=setInterval(()=>{seconds--;clock.textContent="Time: "+seconds+"s";if(seconds<=0)finish()},1000)}
 if(input.value.trim().toUpperCase()===answer){score+=10;round++;points.textContent="Score: "+score;info.textContent="Correct! +10 points";next()}else{info.textContent="Not quite! Try again."}}
 function reset(){clearInterval(timer);started=false;done=false;seconds=60;score=0;round=0;points.textContent="Score: 0";clock.textContent="Time: 60s";input.disabled=false;submit.disabled=false;hint.disabled=false;info.textContent="Type the word and select Submit to start the 60-second timer.";next()}
 input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();check()}});cleanup=()=>clearInterval(timer);reset()
}
function daily(){
 title.textContent="Daily Word";instructions.textContent="Guess today's five-letter word in six tries. Green means correct position; gold means the letter exists elsewhere.";
 const date=todayUTC();const key="cmw-daily-"+date;const dayNumber=Math.floor(Date.parse(date+"T00:00:00Z")/86400000);const answer=dictionary[(dayNumber*37+11)%dictionary.length];
 let guesses=[];const previous=stored(key);if(previous){try{guesses=JSON.parse(previous)}catch(e){guesses=[]}}guesses=guesses.filter(x=>typeof x==="string"&&/^[A-Z]{5}$/.test(x)).slice(0,6);
 const grid=node("div"),entry=node("input"),submit=button("Guess",guess),info=message();
 entry.maxLength=5;entry.placeholder="Five-letter word";entry.autocomplete="off";entry.spellcheck=false;entry.setAttribute("aria-label","Enter a five-letter word");root.replaceChildren(grid,entry,submit,info);
 function feedback(word){const marks=Array(5).fill("miss"),remaining={};for(let i=0;i<5;i++){if(word[i]===answer[i])marks[i]="hit";else remaining[answer[i]]=(remaining[answer[i]]||0)+1}for(let i=0;i<5;i++){if(marks[i]==="hit")continue;if(remaining[word[i]]>0){marks[i]="near";remaining[word[i]]--}}return marks}
 function render(){grid.replaceChildren();for(let row=0;row<6;row++){const line=node("div","","word-row"),word=guesses[row]||"",marks=word?feedback(word):[];for(let i=0;i<5;i++)line.append(node("span",word[i]||"","word-cell "+(marks[i]||"")));grid.append(line)}
 const won=guesses.includes(answer),over=won||guesses.length>=6;entry.disabled=over;submit.disabled=over;
 if(won)info.textContent="Great job! You solved today's puzzle in "+guesses.length+" guesses. Come back tomorrow!";
 else if(over)info.textContent="Today's answer was "+answer+". A new word arrives tomorrow!";
 else info.textContent=(6-guesses.length)+" guesses remaining. Your progress is saved in this browser."}
 function guess(){const w=entry.value.trim().toUpperCase();if(!/^[A-Z]{5}$/.test(w)){info.textContent="Enter exactly five letters (A–Z).";return}if(guesses.includes(w)){info.textContent="You already guessed that word.";return}guesses.push(w);persist(key,JSON.stringify(guesses));entry.value="";render();if(!entry.disabled)entry.focus()}
 entry.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();guess()}});render()
}
function reaction(){
 title.textContent="Reaction Time";instructions.textContent="Press start, wait until the box turns green, then tap as fast as you can. Don't click too early!";
 let state="ready",timeout=null,began=0,trials=[],best=Number(stored("cmw-reaction-best"))||0;
 const scores=node("div","","scoreline"),bestText=node("span"),average=node("span","Average: —");scores.append(bestText,average);
 const tap=button("Start test",clicked);tap.className="reaction-button ready";
 const msg=message();root.replaceChildren(scores,tap,msg);bestText.textContent="Personal best: "+(best?best+" ms":"—");msg.textContent="Complete up to five rounds per session.";
 function clicked(){if(state==="ready"||state==="done"){clearTimeout(timeout);tap.className="reaction-button wait";tap.textContent="Wait for green…";state="waiting";msg.textContent="Stay focused…";timeout=setTimeout(()=>{state="go";began=performance.now();tap.className="reaction-button go";tap.textContent="CLICK NOW!"},1200+Math.random()*2400)}
 else if(state==="waiting"){clearTimeout(timeout);state="done";tap.className="reaction-button ready";tap.textContent="Too early! Try again";msg.textContent="False start. Wait for the green screen."}
 else if(state==="go"){const ms=Math.round(performance.now()-began);state="done";trials.push(ms);tap.className="reaction-button ready";tap.textContent=ms+" ms — Go again";if(!best||ms<best){best=ms;persist("cmw-reaction-best",best)}bestText.textContent="Personal best: "+best+" ms";average.textContent="Average: "+Math.round(trials.reduce((a,b)=>a+b,0)/trials.length)+" ms";msg.textContent=trials.length+" reactions completed. Keep practicing!"}}
 cleanup=()=>clearTimeout(timeout)
}
if(game==="scramble")scramble();else if(game==="daily")daily();else if(game==="reaction")reaction();else{title.textContent="Choose a game";instructions.textContent="Pick a game from the hub to begin.";const a=node("a","← Browse games");a.href="/games.html";root.append(a)}
window.addEventListener("pagehide",()=>cleanup());
})();