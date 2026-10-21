(()=>{const root=document.documentElement,btn=document.getElementById("themeToggle");function sync(){btn.textContent=root.dataset.theme==="dark"?"☀ Light mode":"☾ Dark mode"}btn.addEventListener("click",()=>{const v=root.dataset.theme==="dark"?"light":"dark";root.dataset.theme=v;try{localStorage.setItem("cmw-theme",v)}catch(e){}sync()});sync();document.getElementById("year").textContent=new Date().getFullYear();const layer=document.getElementById("ambient");for(let i=0;i<24;i++){const dot=document.createElement("span");dot.className="ambient-dot";dot.style.setProperty("--x",((i*47.13+11)%100)+"%");dot.style.setProperty("--y",((i*29.7+17)%100)+"%");dot.style.setProperty("--size",(i%4+2)+"px");dot.style.setProperty("--duration",(17+i%11)+"s");dot.style.setProperty("--delay",(-i*1.9)+"s");layer.appendChild(dot)}})();
// Optional account entry and cloud progress syncing. Guest games still work when Firebase isn't configured.
(()=>{const nav=document.querySelector(".nav-actions");if(!nav)return;const a=document.createElement("a");a.href="/account.html";a.textContent="Sign in";a.className="account-nav-link";a.setAttribute("aria-label","Player account and sign in");nav.append(a);
import("/firebase-client.js").then(async client=>{if(!client.available)return;const {getServices}=client;const s=await getServices();const progress=await import("/player-progress.js");let stop=()=>{};
s.auth.onAuthStateChanged(s.userAuth,user=>{stop();stop=()=>{};a.textContent=user?"My account":"Sign in";if(user&&!document.getElementById("accountForm"))stop=progress.watchProgress(user)});
}).catch(()=>{/* Never block navigation or guest play if Firebase is unreachable. */});})();

// Keep manual ads on utility pages only, away from game controls.
(()=>{
 const allowed=new Set(["/","/word-counter","/image-compressor","/qr-code-generator","/grade-calculator","/random-team-generator","/gaming-name-generator","/tools","/blog","/faq","/how-to-use"]);
 const path=location.pathname.replace(/\.html$/,"").replace(/\/$/,"")||"/";
 if(!allowed.has(path)||document.querySelector(".ct-ad-rail"))return;
 // A dedicated responsive unit appears after the main content on phones/tablets.
 // Keep the slot outside tools, forms and interactive controls.
 const narrow=matchMedia("(max-width:1699px)");
 const mainContainer=document.querySelector("main");
 if(mainContainer){
  const wrap=document.createElement("aside");
  wrap.className="ct-responsive-ad";wrap.setAttribute("aria-label","Advertisement");
  const heading=document.createElement("div");heading.className="ct-responsive-ad__label";heading.textContent="Advertisement";
  const slot=document.createElement("div");slot.className="ct-responsive-ad__slot";
  wrap.append(heading,slot);mainContainer.insertAdjacentElement("afterend",wrap);
  let loaded=false;
  function loadResponsive(){
   if(!narrow.matches||loaded)return;
   loaded=true;
   const ad=document.createElement("ins");ad.className="adsbygoogle";
   ad.style.display="block";ad.dataset.adClient="ca-pub-4432960986920022";
   ad.dataset.adSlot="4311141403";ad.dataset.adFormat="auto";
   ad.dataset.fullWidthResponsive="true";slot.append(ad);
   try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}
  }
  loadResponsive();narrow.addEventListener("change",loadResponsive);
 }
 const wide=matchMedia("(min-width:1700px)");
 const main=document.querySelector("main .shell")||document.querySelector("main");
 if(!main)return;
 const rails=[];
 for(const side of ["left","right"]){
  const rail=document.createElement("aside");rail.className="ct-ad-rail ct-ad-rail--"+side;
  rail.setAttribute("aria-label","Advertisement");
  const label=document.createElement("span");label.className="ct-ad-rail__label";label.textContent="Advertisement";
  const holder=document.createElement("div");holder.className="ct-ad-rail__slot";
  rail.append(label,holder);document.body.append(rail);rails.push({rail,holder});
 }
 let initialized=false;
 function refresh(){
  const rect=main.getBoundingClientRect();
  const safe=wide.matches&&rect.left>=300&&(innerWidth-rect.right)>=300;
  for(const {rail} of rails)rail.style.display=safe?"block":"none";
  if(!safe||initialized)return;
  initialized=true;
  for(const {holder} of rails){
   const ad=document.createElement("ins");ad.className="adsbygoogle";
   ad.style.cssText="display:inline-block;width:160px;height:600px";
   ad.dataset.adClient="ca-pub-4432960986920022";ad.dataset.adSlot="4311141403";
   holder.append(ad);
   try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}
  }
 }
 refresh();wide.addEventListener("change",refresh);addEventListener("resize",refresh,{passive:true});
})();

// GA4 is shared by all pages that load the site's common JavaScript.
(()=>{if(document.querySelector('script[data-chickentask-analytics]'))return;const s=document.createElement('script');s.src='/analytics.js';s.defer=true;s.dataset.chickentaskAnalytics='';document.head.appendChild(s)})();
