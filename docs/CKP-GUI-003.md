# CKP-GUI-003 — GUI integration and usability validation

Status: implementation complete on `feature/ckp-gui-003`; review required; not merged or published.

## Scope and boundary

This change integrates the existing command palette and workspace components in
the repository's standalone demo. The integration uses shared in-memory demo
state and an inert local host adapter. It does not import sibling Cockpit source,
add a sibling package, execute a provider, migrate a consumer, or create a
cross-repository runtime dependency.

## Demonstrated workflows

1. Create a local preview, recover from a required-field validation error,
   review it, explicitly approve it, and observe the approved intent in both the
   command log and Activity panel.
2. Clear the command log and observe the same shared state return Activity to
   its empty state.
3. Retry the unavailable demo service through error, loading and recovery
   states, including a repeat check after recovery.
4. Navigate workspace tabs with arrow, Home and End keys; cancel command review
   with Escape and restore focus to the launch control.
5. Render phone (360 px), tablet (768 px) and desktop (1280 px) viewports without
   document-level horizontal overflow.

## Issues found and fixed

- Approved intents previously changed only the command log while Activity stayed
  empty. The demo now renders both surfaces from one in-memory intent list.
- Invalid command parameters previously changed visible status text but did not
  mark or focus the invalid field. The command palette now applies
  `aria-invalid`, exposes an alert, moves focus to the first invalid field, and
  clears the error semantics after a successful review.
- Demo integration logic was embedded in the HTML. It now lives in
  `demo/app.js`, which keeps the standalone wiring inspectable and syntax
  checked without adding it to the package exports.
- The first responsive test assumed the intentionally long identifier must
  overflow at every width. At 1280 px it fits naturally; the test now requires
  actual contained overflow only at the phone breakpoint and still verifies
  document containment at all three widths.

## Accessibility findings

Automated Chromium coverage confirms:

- tablist, tab and tabpanel relationships remain connected by accessible names,
  `aria-controls`, `aria-labelledby` and a single selected tab;
- roving tab focus responds to Arrow keys, Home and End;
- opening command review moves focus to Review, while Escape/cancel restores
  focus to the launch control;
- required-field errors use `role="alert"`, `aria-invalid="true"` and
  first-invalid-field focus, then recover to a polite status;
- explicit approval remains disabled until a valid review;
- loading exposes `aria-busy="true"` and an indeterminate labelled progress
  element; error and recovery states expose alert/status semantics;
- focus-visible styling remains present, and viewport checks found no
  document-level horizontal overflow at 360, 768 or 1280 CSS pixels.

These checks show deterministic semantics and interaction behavior. They do not
prove real assistive-technology usability.

## Verification

Baseline on updated `main` (`3d10ecc`):

- `npm test`: 9 passed, 0 failed.
- `npm run test:browser`: 4 passed, 0 failed.
- Post-merge GitHub Actions: Cockpit GUI CI and Cockpit GUI Browser Proof passed.

Feature branch local verification:

- `npm test`: 10 passed, 0 failed.
- `npm run test:browser`: 6 passed, 0 failed.
- `node --check src/commandPaletteUI.js`: passed.
- `node --check src/workspaceUI.js`: passed.
- `node --check demo/app.js`: passed.
- Visual inspection: 360 × 760 and 1280 × 900 Chromium screenshots showed the
  intended one-column/mobile-tab-row and two-column/desktop layouts.

Hosted verification on [pull request #2](https://github.com/jj-ervin/cockpit-gui/pull/2):

- [Cockpit GUI CI](https://github.com/jj-ervin/cockpit-gui/actions/runs/40162830234): passed in 8 seconds.
- [Cockpit GUI Browser Proof](https://github.com/jj-ervin/cockpit-gui/actions/runs/40162830242): passed in 37 seconds.

## Known limitations and human validation required

- Only Chromium is automated; Firefox, WebKit and platform accessibility APIs
  are not covered.
- No screen-reader session has verified announcement order, verbosity or
  comprehension.
- Contrast has not been measured with a dedicated contrast tool, and high
  contrast/forced-colors modes have not been inspected.
- Keyboard mechanics are verified, but task clarity, label comprehension,
  perceived safety of approval, recovery confidence and workflow efficiency
  require representative human users.
- Touch comfort and the discoverability of the horizontally scrollable mobile
  tab row require physical-device testing.
- Zoom/reflow above the tested viewport configurations and voice-control usage
  remain unverified.
- State is intentionally ephemeral, the service recovery is simulated, and no
  real provider, network, authorization or persistence path is exercised.

Usability claims should therefore remain limited to the automated interaction
contracts and inspected layouts above; overall ease of use and accessibility
conformance require human testing.
