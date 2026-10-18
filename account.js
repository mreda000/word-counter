import {available,getServices,friendlyError} from "/firebase-client.js";
import {syncProgress,watchProgress} from "/player-progress.js";
const $=id=>document.getElementById(id);
const setup=$("accountSetup"),busy=$("accountBusy"),out=$("signedOut"),inside=$("signedIn"),message=$("accountMessage");
let services=null,register=false,unsubscribeSync=null;
const tell=s=>{message.textContent=s};
function switchMode(){register=!register;$("formTitle").textContent=register?"Join the coop!":"Welcome back!";$("formSubtitle").textContent=register?"Create your free player account.":"Sign in to sync your game progress.";$("submitLogin").textContent=register?"Create account":"Sign in";$("toggleMode").textContent=register?"Already registered? Sign in":"New here? Create an account";$("playerPassword").autocomplete=register?"new-password":"current-password"}
$("toggleMode").addEventListener("click",switchMode);
function setBusy(value){for(const b of [$("submitLogin"),$("googleLogin"),$("logoutBtn"),$("syncNow"),$("resetPassword")])b.disabled=value}
function signed(user){out.hidden=!!user;inside.hidden=!user;busy.hidden=true;if(unsubscribeSync){unsubscribeSync();unsubscribeSync=null}
 if(!user)return;
 $("playerName").textContent=user.displayName||"ChickenTask player";$("playerAddress").textContent=user.email||"Signed in";
 const avatar=$("playerAvatar");avatar.textContent="🐔";if(user.photoURL){const img=document.createElement("img");img.src=user.photoURL;img.alt="";img.referrerPolicy="no-referrer";avatar.replaceChildren(img)}
 $("syncLabel").textContent="Syncing…";
 unsubscribeSync=watchProgress(user,(error,result)=>{$("syncLabel").textContent=error?"Retrying later":result?.synced?"Saved to cloud":"Local only"});
}
async function run(action){setBusy(true);tell("");try{await action()}catch(e){tell(friendlyError(e))}finally{setBusy(false)}}
async function init(){
 if(!available){busy.hidden=true;setup.hidden=false;out.hidden=true;inside.hidden=true;return}
 try{services=await getServices();services.auth.onAuthStateChanged(services.userAuth,user=>signed(user),e=>{busy.hidden=true;tell(friendlyError(e))})}
 catch(e){busy.hidden=true;setup.hidden=false;tell("Firebase could not load. Please try again later.")}
}
$("accountForm").addEventListener("submit",e=>{e.preventDefault();if(!services)return;const email=$("playerEmail").value.trim(),password=$("playerPassword").value;run(async()=>{if(register)await services.auth.createUserWithEmailAndPassword(services.userAuth,email,password);else await services.auth.signInWithEmailAndPassword(services.userAuth,email,password)})});
$("googleLogin").addEventListener("click",()=>{if(!services)return;run(async()=>{const provider=new services.auth.GoogleAuthProvider();await services.auth.signInWithPopup(services.userAuth,provider)})});
$("resetPassword").addEventListener("click",()=>{if(!services)return;const email=$("playerEmail").value.trim();if(!email){tell("Enter your email address first.");return}run(async()=>{await services.auth.sendPasswordResetEmail(services.userAuth,email);tell("If your address is registered, check your email for a reset link.")})});
$("logoutBtn").addEventListener("click",()=>{if(services)run(()=>services.auth.signOut(services.userAuth))});
$("syncNow").addEventListener("click",()=>{const u=services?.userAuth.currentUser;if(!u)return;run(async()=>{const r=await syncProgress(u);$("syncLabel").textContent="Saved to cloud";tell(r.count+" game records synced.")})});
init();
