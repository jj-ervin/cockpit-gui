# CKP-GUI-004 — Accessibility, cross-browser and usability validation

Status: implementation prepared on `feature/ckp-gui-004`; review requested; not merged or published.

## Scope and boundaries

This change adds automated checks for the standalone demo's WCAG 2.2 AA
semantics, keyboard and focus behavior, forced-colors contrast, reflow and mobile
tab discoverability. The existing browser proof now runs in Chromium, Firefox,
and WebKit. It adds no sibling repository or runtime dependency. `axe-core` and
Playwright are development-only test dependencies; package files remain limited
to `src/`.

The representative usability session protocol is in
`docs/CKP-GUI-004-USABILITY-PROTOCOL.md`. It is proposed and has not been run.

## Baseline and post-change verification

Baseline was measured on updated `origin/main` at `647358f` before CKP-GUI-004
changes:

- `npm test`: 10 passed, 0 failed.
- `npm run test:browser`: 6 passed, 0 failed in Chromium.
- Firefox and WebKit had no baseline suite runs.

Post-change results:

- `npm test`: 10 passed, 0 failed.
- Browser suite: 11 passed, 0 failed in Chromium; 11 passed, 0 failed in
  Firefox; 11 passed, 0 failed in WebKit.
- axe ran WCAG 2.0, 2.1 and 2.2 A/AA-tagged rules over six states in each
  browser: initial, input error, review recovery, submitted, service error, and
  service recovery. All 18 state/browser audits reported zero violations.
- Additional browser checks cover tab/panel naming and relationships, roving
  keyboard navigation, invalid-field focus and recovery, Escape behavior,
  forced-colors focus and computed contrast, 320 CSS pixel reflow, 200 percent
  text resizing, 24 by 24 CSS pixel visible target bounds, and mobile tab-row
  focus visibility.
- Existing viewport checks continue to cover 360, 768, and 1280 CSS pixels.
- Syntax checks pass for the component and demo scripts. Package dry-run lists
  only the five existing public package files; tests, docs, and private DEV-DOCS
  are excluded.

Cross-browser verification exposed two issues and both were fixed in scope:

- The pre-existing service retry test had a race: its 50 ms demo timer could
  finish before a slow browser observed `loading`. The test now uses Playwright's
  clock to pause and advance simulated time; demo timing was not changed.
- Hosted Linux browsers showed keyboard focus could leave the Service tab
  partially clipped in the horizontally scrollable mobile tab row. Workspace
  activation now scrolls the focused tab into view. The regression check reaches
  Service with the End key and verifies the focused tab is visible.

## Accessibility findings and limits

Automated browser checks passed for the listed states and semantics. axe is a
detector, not a WCAG conformance certificate, and its forced-colors contrast
algorithm did not model Chromium's emulated system colors reliably. The
forced-colors check therefore separately verifies the rendered text and focus
outline contrast values from computed system colors.

No screen-reader, voice-control, real operating-system high-contrast, physical
touch-device, or human usability sessions were conducted. Browser emulation and
the 320 CSS pixel reflow check do not establish behavior at native 400 percent
browser zoom, operating-system magnification, or on actual touch hardware.

Human validation remains outstanding for announcement order and comprehension,
task clarity, approval-boundary understanding, error recovery confidence, mobile
tab discoverability by touch, and perceived workflow effort. No human findings
are claimed. The review should also confirm hosted Firefox/WebKit CI results.

## Residual risks

- axe cannot detect every semantic, cognitive, or assistive-technology barrier.
- Forced-colors behavior varies by platform and user settings; only browser
  emulation and computed styles were inspected.
- 24 by 24 CSS pixel bounds do not prove comfortable physical touch targets or
  spacing exceptions on a device.
- Human testing may identify issues that automated checks cannot model.
- The demo remains local and inert; it does not validate real providers,
  authorization, network behavior, persistence, or a consuming host.
