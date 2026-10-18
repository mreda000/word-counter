# ChickenTask Firebase setup
Firebase is NOT connected until the following steps are completed.
1. In https://console.firebase.google.com/ create/open a Firebase project and register a Web app under Project settings > Your apps.
2. Copy the web app's apiKey, authDomain, projectId and appId into firebase-config.js. Do not share a Google password, service-account private key or Admin SDK secret.
3. In Authentication > Sign-in method enable Google (choose a support email) and Email/Password.
4. In Authentication > Settings > Authorized domains add chickentask.com and any Netlify deploy-preview hostname where you test Google sign-in.
5. In Firestore Database, create a database and publish the contents of firestore.rules under Rules. Do not grant public write access.
6. On a preview test Google sign-in, email/password registration and login, password reset, logout, guest play, and saved score syncing across two browsers. Check mobile Safari and Chrome.
7. Update privacy disclosures for Firebase Authentication and Firestore before publishing accounts.

Cloud progress is stored at players/{uid}; only allowlisted game-local storage keys are synchronized. Signed-in game pages check for updated progress about every 30 seconds while visible. Guest games still work with no Firebase connection.
Cloud saves cannot be used for trustworthy public leaderboards: scores originate from the user's browser, not a secure game server.
On shared devices, existing browser game records can be associated with whichever account signs in. Consider a separate browser profile for each player.
Firebase Spark free quotas apply. Do not deploy publicly before testing login and Firestore rules.