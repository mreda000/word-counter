import {firebaseConfig} from "/firebase-config.js";
const version="11.10.0";
const base="https://www.gstatic.com/firebasejs/"+version+"/";
const configured=["apiKey","authDomain","projectId","appId"].every(k=>typeof firebaseConfig[k]==="string"&&firebaseConfig[k].trim()!=="");
let instance=null;
export const available=configured;
export async function getServices(){
 if(!configured)throw new Error("Firebase has not been connected to ChickenTask yet.");
 if(!instance)instance=(async()=>{
  const [{initializeApp,getApps,getApp},auth,db]=await Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]);
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  return {app,auth,db,userAuth:auth.getAuth(app),firestore:db.getFirestore(app)};
 })();
 return instance;
}
export function friendlyError(e){const code=e?.code||"";const known={
 "auth/invalid-email":"Please enter a valid email address.",
 "auth/invalid-credential":"Incorrect email or password.",
 "auth/email-already-in-use":"An account with this email already exists. Try signing in.",
 "auth/weak-password":"Please choose a stronger password (at least six characters).",
 "auth/popup-closed-by-user":"Google sign-in was cancelled.",
 "auth/popup-blocked":"The browser blocked the Google sign-in popup. Allow popups and try again.",
 "auth/unauthorized-domain":"This website is not authorized in Firebase. Add chickentask.com under Authentication > Settings > Authorized domains.",
 "auth/operation-not-allowed":"This sign-in method isn't enabled in your Firebase project.",
 "permission-denied":"Saving is blocked by database rules. Please contact the site owner."
 };return known[code]||"Unable to complete that request. Please try again."}
