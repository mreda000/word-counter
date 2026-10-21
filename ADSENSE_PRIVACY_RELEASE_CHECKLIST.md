# AdSense and privacy release checklist

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
