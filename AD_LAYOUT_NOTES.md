# Manual ad layout — 2026-10-28

## Behavior

- `site.js` loads `ad-layout.js`, which waits for `ad-layout.css` before requesting manual ads.
- Publisher `ca-pub-4432960986920022` is preserved. Account inspection confirmed sidebar slot `4311141403` is fixed 160x600. A separate responsive Display unit, `4877112993` (ChickenTask bottom responsive), was created for the bottom placement on October 28, 2026.
- Public content pages with a `main` element get one normal-flow bottom placement, regardless of viewport width or side-rail availability. This includes the four newer tools and gameplay pages.
- Two non-sticky 160x600 side units are added only if both sides have at least 160 CSS pixels of clearance from the entire main content and the main region is tall enough. On a centered 1120px main, this requires approximately 1796px of usable viewport width; a 1320px main requires approximately 1996px. Scrollbars and actual page layout can affect these thresholds.
- The bottom ad panel has 160px of vertical clearance from main content. It has an explicit responsive width, no fixed-height clipping, and no full-width expansion outside its wrapper.
- Account, privacy, credits, private/vendor/test paths, 404 pages, and explicit `data-ads="off"` screens are excluded from manual placements. Existing Auto ads on those pages are not controlled by this code.
- Side units hide when space is insufficient or fullscreen/pointer-lock gameplay is active. No ad is refreshed during resizing or gameplay. Each slot is requested at most once per page load.
- Google-reported unfilled units collapse; request failures are logged without automatic retries. The Google loader is inserted only when missing.

## Verification performed

`node --check site.js` and `node --check ad-layout.js` passed.

`python tests/ad-layout.browser.py` passed 102 route/viewport combinations across widths from 320 to 2560px, plus exclusions, deduplication, resizing without repeat requests, expanded main content, fullscreen/pointer lock, short pages, and unfilled collapse.

The browser test uses offline Chromium DOM fixtures matching the standard 1120px and wide 1320px main containers. CSS loading and ad responses are simulated; the placement source is evaluated unchanged. It does not run the complete live games, generate real ad impressions, verify deployment, or prove policy compliance. Install Playwright and Chromium to run it. The test writes local `test-output/` screenshots and JSON results.

## Still requires account/live verification

1. Use fixed 160x600 sidebar slot `4311141403` and responsive bottom slot `4877112993`. These IDs were verified in the account; never invent a replacement ID.
2. Verify the site status is Ready and check Policy center/serving limitations. A publisher script or ads.txt does not prove approval.
3. Review Auto ads formats, page/area exclusions, and ad-size optimization. Auto ads can create additional placements outside this layout's control. Avoid overlay formats where they obstruct controls, and keep total advertising below publisher content.
4. Verify the certified CMP and regional consent configuration. This layout does not create, reset, or override consent signals.
5. Confirm the production deployment contains these files, then test actual mobile/tablet/desktop pages, filled ads, orientation changes, download buttons, and game controls. Do not click your own ads while testing.

Official references:
- https://support.google.com/adsense/answer/2768340
- https://support.google.com/adsense/answer/9183362
- https://support.google.com/adsense/answer/9183460
- https://support.google.com/adsense/answer/9183363
- https://support.google.com/adsense/answer/10502938

