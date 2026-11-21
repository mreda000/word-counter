# AdSense and privacy release checklist

## November 21 content remediation

- Replaced six older writing articles with distinct, original worked guides tied to the actual word counter. Removed unsupported word-count/SEO claims and unverified first-person stories. Updated the guide index, About page, general instructions, FAQ, homepage and tools hub to describe the current product and useful workflows.
- Added two explicit, editable word-counter examples, precise measurement rules, calculation limits and troubleshooting. Restored the missing shared site script on that page, including its existing manual side/bottom ad initialization and consent-gated analytics. Removed duplicate theme/particle setup and corrected duration rounding at minute boundaries.
- Preserved the existing manual ad unit IDs and layout protections. Replaced the obsolete arcade wrapper with standard legacy-link redirects and a noindex, ad-free fallback that only sends visitors to the complete game pages. Removed the obsolete wrapper from the sitemap; the real game pages and their ads remain.
- Four Node suites passed, including actual-analyzer examples, draft replacement/cancellation, shared theme/ad initialization, calculation boundaries and saved-progress behavior. Changed HTML passed structure, unique ID, local link/anchor and JSON-LD checks. No new third-party packages or external artwork were introduced.
- The existing Chromium suites could not launch in the editing environment (`socket() failed: Operation not permitted`); this is not a passing automated browser test. A separate live browser verified the counter example and guide layouts at 337, 770 and 1348 CSS-pixel widths using browser zoom. This checks responsive layout, not physical mobile/tablet hardware. Public HTTP comparisons confirmed the 14 changed HTML pages, guide CSS, sitemap and six legacy redirects were deployed after PR #11.
- Live resizing exposed an existing 952px Google bottom-ad host overflowing an 899px viewport. The follow-up guard hides the entire responsive placement when the rendered unit exceeds available width, retaining its size while hidden and restoring the same unit when it fits. It reserves only scrollbar space actually observed to prevent scrollbar removal from causing a repeated hide/show loop. It does not clip, scale, refresh or inspect iframe contents. A focused Node regression test reproduces the 977px document overflow and verifies collapse, restoration without an extra request, mobile initial sizing, late rendering, unfilled collapse and stable observer scheduling, including changing scrollbar gutters. Verify the follow-up in production before treating that browser issue as resolved.
- These fixes address identified source/content issues, not a blanket copyright, security or policy clearance. Account-side CMP publication, Auto ads and the site's current approval state still need direct account evidence. Do not describe the site as approved unless AdSense > Sites shows Ready for chickentask.com.

## October 28 remediation

- ChickenTask was rejected for Low value content, while ads.txt was Authorized and Policy center reported No current issues. Approval remains a Google review decision.
- Created responsive bottom Display unit `4877112993`; retained fixed 160x600 sidebar unit `4311141403`. Manual layout keeps its existing 160px clearance and fullscreen/pointer-lock protections.
- Added original instructions, scoring examples, practice routines and limitations to six game pages. Corrected the reaction game's misleading five-round-limit copy.
- All 34 public HTML pages load `privacy.js` synchronously before any advertising loader. It sets consent defaults before tags. Optional GA4 is not downloaded until an explicit analytics opt-in; consent can be withdrawn through the footer and expires after 180 days. Advertising consent remains owned by Google's CMP, separately from analytics.
- Updated privacy disclosures to describe those actual choices. The analytics panel is not a replacement for a certified advertising CMP.
- Local Chromium tests use blocked external resources and mocked ad responses. They verify no GA4 request before opt-in, load-once behavior, withdrawal across reload, expiry, bootstrap order, placement unit IDs, clearance and overflow at 390, 820, 1500, 2050 and 2560px.
- Before requesting a new site review: verify the deployed guides and privacy files, published ChickenTask regional messages, and regional behavior. Do not check the fixed-issues declaration on an unchanged deployment.

The changes in this branch reduce known code-level risks but do not certify compliance or approval.

## Required account checks (not verifiable from GitHub)

1. In AdSense > Privacy & messaging, configure and publish an appropriate Google-certified IAB TCF CMP for EEA, UK and Swiss traffic. Check applicable US-state privacy messages too. Verify with a regional test. A generic cookie banner is not a substitute.
2. In AdSense > Privacy & messaging > European regulations > Settings, review consent mode for advertising and analytics. Confirm GA4 respects applicable consent choices; review whether any analytics scripts must be gated before consent in relevant regions.
3. In AdSense > Ads, check Auto ads and any vignette, anchor, and side-rail formats on gameplay pages. Disable or exclude placements that overlap games or invite accidental clicks. The site-wide AdSense loader remains enabled in HTML pages and can still render Auto ads.
4. Check AdSense Policy center for any notices and confirm the site is approved before relying on earnings.
5. Verify https://chickentask.com/ads.txt is publicly served and matches the account's publisher ID.

## Release checks

- Test gameplay and ad positions at mobile, tablet, 1500px desktop and ultrawide widths, especially Aim Trainer and Pet the Chicken.
- Confirm no advertisements overlay play, pause, fire, download, or navigation controls.
- Verify privacy-policy statements match deployed Firebase, analytics and advertising behavior.
- Check that library notices are accurate and any newly added assets have redistribution rights.
- Run existing JavaScript tests, then inspect the live site after deploying.

Official references:
- https://support.google.com/adsense/answer/2768340
- https://support.google.com/adsense/answer/13554116
- https://support.google.com/adsense/answer/16053245

