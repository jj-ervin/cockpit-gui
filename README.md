# @cockpit/gui

Host-neutral GUI components for presenting command intents and workspace
panels. The package is independently versioned and has no runtime dependencies
on Cockpit Core, Cockpit Web, provider packages, or sibling repositories.

**Distribution status:** this repository and npm package are private. Public
distribution or publication is not currently authorized. The MIT license in
[LICENSE](LICENSE) grants its stated permissions to recipients of the Software;
private repository/package settings do not rewrite or restrict those license
terms. HBL Creative Studios is the development division of Osprey Strategic
Holdings LLC, the intended copyright holder named in the notice. The available
repository records do not establish a complete rights-transfer chain for all
extracted or contributed material; resolve that provenance before authorizing
public distribution.

## Local package check

The package is private and npm publication is not currently authorized. To
exercise a local packed copy without publishing:

```sh
npm pack
npm install ./cockpit-gui-0.1.4.tgz
```

The package supports Node.js 22 and later for CommonJS or Node ESM imports.
Browser use targets current evergreen Chromium, Firefox, and WebKit engines.
The package itself has no Node runtime dependency; Node is needed by the
consumer only when loading the CommonJS module entry points. CSS is exported as
a stylesheet for a bundler or CSS-aware tool to load.

## Workspace example

```js
import createWorkspaceUI from '@cockpit/gui/workspace';
import '@cockpit/gui/styles.css';

const workspace = createWorkspaceUI({
  document,
  navigationRoot: document.querySelector('#tabs'),
  panelRoot: document.querySelector('#panels'),
  initialId: 'activity',
  items: [
    { id: 'activity', label: 'Activity', state: 'empty' },
    { id: 'service', label: 'Service', state: 'loading' },
  ],
  onNavigate(id) {
    console.log('Selected workspace section:', id);
  },
});

workspace.setPanelState('activity', 'populated', {
  text: 'A host-owned activity summary.',
});
```

The host owns the DOM roots and panel data. `WorkspaceUI` creates accessible
tab and panel relationships, keyboard navigation, and panel state presentation.
See [the package contract](docs/PACKAGE-CONTRACTS.md) for the complete API and a
command palette adapter example.

## Command intents and execution boundary

`CommandPaletteUI` gathers input, presents errors, requires review, and exposes
an explicit approval action. It passes the approved request through the
injected host flow. It does not discover providers, grant authorization, or
execute provider code. The host/provider integration owns those decisions and
effects. UI approval is an interaction state; it is not a security boundary.

## Standalone demo

Open `demo/index.html` in a browser. It uses only files in this repository and
an inert local adapter. Its in-memory state resets on reload and never executes
a provider. It is not an example of a production authorization or host adapter.

## Validation

```sh
npm ci
npm test
npm run test:package
npm run test:browser
```

CI tests unit and package distribution behavior on Node.js 22 and 24. The
browser workflow runs Chromium, Firefox, and WebKit. Accessibility checks include
axe rules, semantics, keyboard/focus, forced-colors emulation, text contrast,
reflow, zoom-style resizing, and target-size checks. They do not certify WCAG
conformance or replace human screen-reader, assistive-technology, device, or
usability evaluation. See the repository's [CKP-GUI-004 results](https://github.com/jj-ervin/cockpit-gui/blob/main/docs/CKP-GUI-004.md)
and [proposed usability protocol](https://github.com/jj-ervin/cockpit-gui/blob/main/docs/CKP-GUI-004-USABILITY-PROTOCOL.md).

## Versioning and changes

The package is pre-1.0.0. Patch releases contain backward-compatible fixes;
minor releases may add backward-compatible exports or behavior; breaking API
changes before 1.0.0 require a minor version increment and a migration note.
After 1.0.0, breaking changes require a major version. Deprecated supported
exports will be documented in the changelog and retained for at least one
minor release before removal, except when a security or legal issue requires
faster action. Every release candidate must update [CHANGELOG.md](CHANGELOG.md).

The supported exports and compatibility details are listed in
[docs/PACKAGE-CONTRACTS.md](docs/PACKAGE-CONTRACTS.md). HBL Creative Studios is
the development division of Osprey Strategic Holdings LLC. The repository's
extraction record and consumer migration gates are in
[CKP-GUI-001](https://github.com/jj-ervin/cockpit-gui/blob/main/docs/CKP-GUI-001.md).

## Adoption status

CKP-GUI-006 is the controlled consumer-pilot review for `0.1.0`. The private
`jj-ervin/cockpit-web` candidate consumes an integrity-pinned package tarball
through the supported workspace and stylesheet exports; it does not import
sibling source or use a development link. See
[the adoption-readiness report](docs/CKP-GUI-006.md).

Merging the CKP-GUI-006 library and consumer PRs after their required checks is
the explicit owner acceptance point. At that point, `@cockpit/gui@0.1.0` is
adoption-ready only within the report's tested private scope and this project
enters maintenance mode. Maintenance means compatible fixes, dependency and
security upkeep, and evidence-backed consumer issues; it does not authorize a
new roadmap, public publication, broad migration, or speculative features.
