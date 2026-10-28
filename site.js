(()=>{const root=document.documentElement,btn=document.getElementById("themeToggle");function sync(){btn.textContent=root.dataset.theme==="dark"?"☀ Light mode":"☾ Dark mode"}btn.addEventListener("click",()=>{const v=root.dataset.theme==="dark"?"light":"dark";root.dataset.theme=v;try{localStorage.setItem("cmw-theme",v)}catch(e){}sync()});sync();document.getElementById("year").textContent=new Date().getFullYear();const layer=document.getElementById("ambient");for(let i=0;i<24;i++){const dot=document.createElement("span");dot.className="ambient-dot";dot.style.setProperty("--x",((i*47.13+11)%100)+"%");dot.style.setProperty("--y",((i*29.7+17)%100)+"%");dot.style.setProperty("--size",(i%4+2)+"px");dot.style.setProperty("--duration",(17+i%11)+"s");dot.style.setProperty("--delay",(-i*1.9)+"s");layer.appendChild(dot)}})();
// Optional account entry and cloud progress syncing. Guest games still work when Firebase isn't configured.
(()=>{const nav=document.querySelector(".nav-actions");if(!nav)return;const a=document.createElement("a");a.href="/account.html";a.textContent="Sign in";a.className="account-nav-link";a.setAttribute("aria-label","Player account and sign in");nav.append(a);
import("/firebase-client.js").then(async client=>{if(!client.available)return;const {getServices}=client;const s=await getServices();const progress=await import("/player-progress.js");let stop=()=>{};
s.auth.onAuthStateChanged(s.userAuth,user=>{stop();stop=()=>{};a.textContent=user?"My account":"Sign in";if(user&&!document.getElementById("accountForm"))stop=progress.watchProgress(user)});
}).catch(()=>{/* Never block navigation or guest play if Firebase is unreachable. */});})();

// Manual placement layout: optional side units plus a bottom unit at all widths.
// Auto ads and consent messages remain controlled by the AdSense account.
(()=>{if(document.querySelector('script[data-ct-ad-layout]'))return;const s=document.createElement('script');s.src='/ad-layout.js?v=20261028';s.defer=true;s.dataset.ctAdLayout='';document.head.appendChild(s)})();

// GA4 is shared by all pages that load the site's common JavaScript.
(()=>{if(document.querySelector('script[data-chickentask-analytics]'))return;const s=document.createElement('script');s.src='/analytics.js?v=20261028';s.defer=true;s.dataset.chickentaskAnalytics='';document.head.appendChild(s)})();

