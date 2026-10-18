import {available,getServices} from "/firebase-client.js";
// Allowlist: only game stats and game settings. Never sync arbitrary localStorage, text drafts or passwords.
const allowed=/^(?:cmw-typing-best-|cmw-aim-best-|cmw-aim-routine-best$|cmw-aim-settings$|cmw-reaction-best$|cmw-pet-chicken-best$|cmw-daily-|cmw-scramble-)/;
function localRecords(){const output={};try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&allowed.test(key)){const v=localStorage.getItem(key);if(v&&v.length<=1600&&Object.keys(output).length<120)output[key]=v}}}catch(e){}return output}
export async function syncProgress(user){
 if(!available||!user)return {synced:false,reason:"not-configured"};
 const {db,firestore}=await getServices();
 const ref=db.doc(firestore,"players",user.uid);
 const snapshot=await db.getDoc(ref);
 const stored=snapshot.exists()?snapshot.data()?.progress:{};
 const existing=stored&&typeof stored==="object"&&!Array.isArray(stored)?stored:{};
 const current=localRecords(),merged={...existing};
 for(const [k,v] of Object.entries(current)){
  if(!allowed.test(k))continue;
  // Lower is better for reaction milliseconds and farm completion time.
  const a=Number(v),b=Number(merged[k]);
  if(merged[k]!==undefined&&Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>0&&(/cmw-reaction-best$|cmw-pet-chicken-best$/.test(k)))merged[k]=String(Math.min(a,b));
  else if(merged[k]!==undefined&&Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>=0&&/^(cmw-aim-|cmw-typing-best-)/.test(k))merged[k]=String(Math.max(a,b));
  else merged[k]=v;
 }
 for(const [k,v] of Object.entries(merged)){if(!allowed.test(k)||typeof v!=="string"||v.length>1600)continue;try{localStorage.setItem(k,v)}catch(e){}}
 // Store only bounded, allowlisted records in Firestore.
 const safe=Object.fromEntries(Object.entries(merged).filter(([k,v])=>allowed.test(k)&&typeof v==="string"&&v.length<=1600).slice(0,120));
 await db.setDoc(ref,{progress:safe,updatedAt:db.serverTimestamp()},{merge:true});
 window.dispatchEvent(new CustomEvent("chickentask-progress-synced"));
 return {synced:true,count:Object.keys(merged).length};
}
export function watchProgress(user,callback=()=>{}){
 if(!available||!user)return ()=>{};
 let busy=false,stopped=false;
 const push=async()=>{if(busy||stopped||document.hidden)return;busy=true;try{const result=await syncProgress(user);callback(null,result)}catch(e){callback(e)}finally{busy=false}};
 // Save at a moderate interval, not per target click or keypress.
 const interval=setInterval(push,30000);
 const onPage=()=>{if(!document.hidden)push()};
 document.addEventListener("visibilitychange",onPage);
 push();
 return ()=>{stopped=true;clearInterval(interval);document.removeEventListener("visibilitychange",onPage)};
}
