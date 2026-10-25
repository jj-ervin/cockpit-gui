# CKP-GUI-001 — Initial GUI extraction boundary

Status: staged source copy; consumer cutover NOT performed; release NOT approved.

## Provenance
- Original: `jj-ervin/cockpit:web/commandPaletteUI.js` on `main`, inspected 2026-10-24.
- Staged destination: `jj-ervin/cockpit-gui:src/commandPaletteUI.js`.
- The source is retained in `cockpit` to avoid breaking its existing web runtime.
- The standalone test is a small contract smoke test, not equivalent to Cockpit's integration/browser test suite.

## Ownership
- `cockpit-core`: platform-neutral command intent, resolution, parameter validation, state contracts.
- `cockpit-gui`: reusable presentational components and UI interaction (no provider execution or approval authority).
- `cockpit-web`: web app bootstrap, browser routes, adapter wiring and hosting.
- `cockpit-tab`: tabbed workspace behavior; `cockpit-vscode`: editor host adapter.
- `cockpit-registry`: discovery metadata, not execution authorization.
- `cockpit`: existing authoritative runtime until each consumer cutover is verified.

## Follow-up gates
1. Run `npm test` here and the upstream `web` and `host-web` suites.
2. Check browser loading, UMD/CommonJS contracts and exact dependency injection.
3. Align package name, version strategy, license and distribution permissions.
4. Migrate one consumer via explicit dependency; no duplicate divergent logic.
5. Only after CI, integration and owner approval remove superseded source.

Do not represent staged code as published, production-ready or migrated.
