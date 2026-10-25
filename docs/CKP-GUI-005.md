# CKP-GUI-005 — Package stabilization and release readiness

Status: release candidate prepared for review; not published, tagged, released,
or merged.

## Baseline

Baseline commit: `a050fc2` (main after CKP-GUI-GOV-001 and CKP-GUI-004 merges).
Before package changes: unit tests 10/10; browser tests 11/11 in Chromium,
Firefox and WebKit. `npm pack --dry-run --json` contained five files: README,
package metadata, the two JavaScript modules, and the CSS file. Local browser
tools were installed from the committed lockfile with `npm ci` (zero reported
vulnerabilities); the first browser invocation before install failed because
the local checkout lacked `axe-core`, not because of a test failure. Package
metadata was still version `0.0.0`, marked private, and had no declared license.

## Package decisions

- Preserve package identity `@cockpit/gui` and the CommonJS/UMD implementation.
- Set initial package candidate version to `0.1.0`; the API is usable and
  documented, while consumer cutovers and human usability validation remain
  outside this package release. Pre-1.0 SemVer and deprecation policy are in the
  README and API contract.
- Export the root command palette factory, explicit command palette and
  workspace subpaths, and shared CSS. No deep source imports are supported.
- Declare Node.js 22+ as the supported package tooling/runtime floor. CI checks
  Node 22 and 24; browser support is current evergreen Chromium, Firefox and
  WebKit as exercised by Playwright CI, without a promise about older releases.
- Apply MIT as recommended. The initial author handle `jj-ervin` is used in the
  notice; confirm the legal person/company name before first publication.
- Keep runtime dependencies empty. `axe-core` and Playwright remain dev-only.
- Restrict npm files to README, changelog, license, the public API contract, and
  `src/`. Private DEV-DOCS, demo, tests, workflows and internal reports are
  excluded.

## Issues found and fixed

- The demo supplied its own focus outline, while the exported component
  stylesheet did not. The package now includes a visible focus outline for
  navigation tabs, panels and command inputs, plus a forced-colors system-color
  override.
- Firefox's emulated forced-colors `Highlight` color measured below the
  existing 3:1 focus-indicator threshold against its canvas. The package uses
  `CanvasText` for forced-colors focus instead; the focused regression test now
  passes in Firefox.

## Validation and release gates

On the feature branch after changes:

- `npm ci`: passed; zero reported vulnerabilities.
- `npm test`: 10 passed, 0 failed.
- `npm run test:package`: 1 passed, 0 failed. It created the actual tarball,
  installed it offline in a temporary consumer with scripts disabled, and
  verified CommonJS, Node ESM default imports, UMD browser globals, stylesheet
  export, package metadata, and absence of runtime dependencies.
- `npm run test:browser`: 11 passed in each of Chromium, Firefox, and WebKit.
- 18 axe audits (six states in each browser): zero reported violations.
- `npm pack --dry-run --json`: exactly eight files — `CHANGELOG.md`, `LICENSE`,
  `README.md`, `package.json`, `docs/PACKAGE-CONTRACTS.md`, CSS, and the two
  JavaScript modules under `src/`.
  The exact-file allowlist is also asserted by the consumer test. No demos,
  tests, workflows, or private DEV-DOCS enter the tarball.
- Existing CKP-GUI-004 interaction checks remain in the browser suite; no human
  or assistive-technology observations are claimed.
- Hosted CI passed at code commit `22b0b45`: unit and package jobs on Node 22
  and 24, and browser proof in Chromium, Firefox and WebKit. The report-only
  closeout commit that follows will receive its own CI run.

First publication requires explicit owner approval that `jj-ervin` is the
correct legal copyright holder (or a correction to the notice), confirmation of
the MIT rights for all included code, the `0.1.0` changelog/version, public npm
destination/access for `@cockpit/gui`, and the act of running
`npm publish --access public`. A Git tag or GitHub release also requires its
own explicit approval. This work does not publish, tag, create a GitHub
release, merge, or migrate a consumer.

## Known limitations and residual risks

- No consuming application has been migrated or integration-tested; the
  original Cockpit runtime remains authoritative until a separate approved
  consumer cutover.
- Human usability and actual screen-reader/assistive-technology sessions have
  not been conducted. CKP-GUI-004 lists the remaining checks.
- Browser tests use current Playwright engines and emulation, not a full
  historical version-support matrix or physical devices.
- There is no TypeScript declaration surface, framework wrapper, SSR guarantee,
  or deep-import compatibility promise.
- CSS consumer loading depends on the consumer's bundler or CSS tooling.
- UI approval is an interaction affordance; host/provider authorization and
  execution remain outside this package.
- Copyright notice holder should be confirmed as an owner identity before
  publication.
