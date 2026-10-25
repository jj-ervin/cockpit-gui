# cockpit-gui

Reusable, host-neutral Cockpit interface components. **Extraction in progress; not a published package.**

## Current module
- `src/commandPaletteUI.js`: staged from `jj-ervin/cockpit/web/commandPaletteUI.js`.
- Provides command selection, parameter field presentation, explicit review and host-intent handoff.
- Receives catalog, DOM, resolver, command interaction, validation, and host integrations via dependency injection. It **does not** execute providers or grant permission.
- `src/workspaceUI.js`: local tab navigation plus reusable populated, empty, loading, error and recovery panel states.
- `src/cockpitGUI.css`: shared responsive shell, contained overflow and visible-focus styling. Narrow layouts switch to a horizontally scrollable tab row rather than compressing panel content.
- `demo/app.js`: standalone integration wiring only. It gives the existing components shared in-memory state without becoming package API or importing another repository.

## Local validation
```sh
npm test
npm run test:browser
node --check src/commandPaletteUI.js
node --check src/workspaceUI.js
node --check demo/app.js
```
The unit tests are contract-level checks. The browser suite verifies the standalone demo in real Chromium, including keyboard navigation, focus restoration, panel recovery, narrow layout and contained overflow; it does not replace upstream consumer or host integration tests.

## Migration rule
Do not remove or redirect `cockpit/web/commandPaletteUI.js` yet. The original Cockpit runtime remains authoritative until explicit, tested consumer cutover. See [CKP-GUI-001](docs/CKP-GUI-001.md) for ownership and release gates.

## Related repositories
- [cockpit](https://github.com/jj-ervin/cockpit) — current operational implementation
- [cockpit-core](https://github.com/jj-ervin/cockpit-core) — shared command/state contracts (planned)
- [cockpit-web](https://github.com/jj-ervin/cockpit-web) — browser consumer (planned)

## Standalone demo

Open `demo/index.html` in a browser. It uses only files within this repository:
the local command palette and workspace modules plus its own inert host adapter.
There are no package imports from another Cockpit repository. Approved command
intents update both the command log and Activity panel through shared in-memory
demo state; clearing the log returns Activity to its empty state.

The demo intentionally does not execute providers. Validation, review, approval,
service recovery and activity history remain local to the page and reset on reload.

Chromium verification: `node --test browser-tests/*.test.js` after installing
the browser-test tooling documented in `.github/workflows/browser.yml`.
See [CKP-GUI-003](docs/CKP-GUI-003.md) for the integration and usability
validation record, accessibility findings and human-testing limits.
