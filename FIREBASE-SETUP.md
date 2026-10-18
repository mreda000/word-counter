# ChickenTask Firebase setup and verification

Project: website-7c1a3. Database: `default` (Enterprise, Native Mode), location `nam5`. This is a named database, not `(default)`; firebase-client.js must explicitly select it.

## Verified on October 18, 2026
- Email/Password and Google providers are enabled.
- chickentask.com was already authorized.
- deploy-preview-3--moodywordcounter.netlify.app was added and confirmed.
- Google sign-in succeeded on the existing PR preview.
- Firestore was provisioned in production mode, initially denying all client access.
- The current firestore.rules was published successfully through Firebase Console.
- Rules Playground: unauthenticated get denied; owner get allowed; other-user get denied; other-user create denied; owner create with extra isAdmin field and missing required fields denied.
- Google logout returned to the signed-out form; an invalid email/password attempt was rejected with Incorrect email or password.
- Owner update with the invalid test document was denied.
- Local regression tests pass for bounded allowlisted records, best-score merging, account-switch cancellation, and stopped-watcher cancellation.

## Authorized preview verification
The user authorized a test-preview deployment. Commit 3a6a403001291bbb9d985dfc43ee56b5aac4bc2d deployed successfully at https://deploy-preview-3--moodywordcounter.netlify.app/account.html . Google sign-in, explicit save, and account persistence/sync after reload succeeded. An actual reaction-game score was confirmed in the authenticated owner's Firestore document. Production/main was not modified.

## Production release remains blocked
Do not merge or deploy to production yet. The current preview explicitly selects the named database `default` and cloud saving has been verified against Firestore. Restore in a clean browser remains outstanding.
Successful email registration/login, password reset, second-browser restore, concurrent-device writes, and mobile Safari/Chrome remain unverified. Only Google sign-in was exercised successfully.

After the authorized deployment, the PR title again contains [skip netlify] to suppress additional automatic Deploy Previews. Keep it until another preview deployment is authorized. Commit messages also contain [skip netlify]. See https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/#skip-a-deploy

To publish only Firestore rules later, use Firebase CLI with project website-7c1a3 and `deploy --only firestore:rules`. firebase.json explicitly targets the named database. Never run an unscoped site deployment as part of rule publication.

## Data and limits
Progress is stored only at players/{uid}. Rules allow authenticated owners to read/delete their document and create/update only with progress (a map of at most 120 records) and updatedAt (the server timestamp). Other document paths are denied. Individual nested progress keys/values are sanitized in the client; the rules do not validate every nested value.
Scores are browser-generated and are unsuitable for trusted public leaderboards. Local records remain shared by accounts using the same browser profile; do not assume signing out clears local game data.
The account-switch fix prevents an in-flight sync from restoring an old account's records after logout or account switching. The account page uses one automatic sync watcher. Concurrent-device save conflicts still require verification.
Guest games remain usable without Firebase. Production/main was not modified.
