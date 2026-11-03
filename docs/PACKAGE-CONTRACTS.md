# Package API and compatibility contract

Status: supported API proposal for private `@cockpit/gui` `0.1.0`; public
distribution and npm publication are not currently authorized. The npm
`exports` map is the authority for package entry points. Files under `src/` that
are not exported are implementation details.

## Supported entry points

| Import | Export | Contract |
| --- | --- | --- |
| `@cockpit/gui` | `createCommandPaletteUI(options)` | Root compatibility entry and alias of the command palette factory. |
| `@cockpit/gui/command-palette` | `createCommandPaletteUI(options)` | Explicit command palette entry. |
| `@cockpit/gui/workspace` | `createWorkspaceUI(options)` | Workspace tabs and panel state presentation. |
| `@cockpit/gui/workbench` | `createWorkbenchUI(options)` | Reusable workbench shell, activity rail and resizable side panels. |
| `@cockpit/gui/styles.css` | CSS stylesheet | Shared component and responsive styles. |

The JavaScript entry files use CommonJS exports in Node and expose the browser
globals `CockpitCommandPaletteUI` and `CockpitWorkspaceUI` when loaded as plain
scripts. Node ESM consumers can default-import the CommonJS factories. Named
ESM exports, TypeScript declarations, React/Vue wrappers, and deep imports are
not supported in `0.1.x`.

## Command palette

Required options:

- `document`: host document used to create UI nodes.
- `root`: host-owned element where the review panel is attached.
- `list`: required slot retained by the current factory signature; this
  component does not currently render catalog rows into it.
- `catalog`: object with `providers[]`; each provider has `name` and
  `commands[]`; each command has `id` and `title`.
- `flowFactory`: creates the host's command interaction flow.
- `resolverFactory(catalog)`: resolves command IDs and schemas.
- `commandInterfaceFactory({host, resolve})`: adapts the host's existing
  command interface.
- `parameterInteractionFactory(schema)`: returns a value with `fields()`.
- `reviewFactory()`: supplies the host's review adapter.
- `host`: opaque host-owned value passed to `commandInterfaceFactory`.

The flow returned by `flowFactory` supplies `select(id)`,
`parameterize(request, values)`, `review(request, result)`,
`approve(reviewed)`, and `invoke(approved)`. `select` returns an `ok` result and
the parameter schema; failed parameterization returns `ok: false` with optional
field errors. The parameter interaction adapter returns `fields()`; each field
may supply `id`, `label`, `required`, and `type` (`text`, `number`, or
`boolean`). These adapters connect the view to a host's existing contracts; the
package does not prescribe a catalog, validation, or authorization schema.

Optional callbacks: `onInvoke()` runs after the injected flow's synchronous
`invoke` call returns; `onInvokeError(error)` observes a synchronously thrown
submission error.

The factory returns a frozen object with `select(id, trigger?)`, `refresh()`,
and `close()`. Selection renders an input panel. Review validates through the
injected flow; failed validation marks and focuses invalid fields and announces
an error. Successful review enables explicit approval. Approval passes the
approved request through the host flow's `invoke` method. Escape and Cancel
close the panel and restore focus to the trigger when it remains in the DOM.
`refresh()` closes an active panel if its command is no longer in the catalog.
The optional callbacks observe synchronous invocation completion and thrown
errors. A host adapter that returns a promise must handle rejected promises at
the host boundary; this component does not await asynchronous provider work.

The UI never calls provider code directly and does not own authentication,
authorization policy, provider discovery, durable state, or audit storage. The
host adapter must validate and authorize independently of the visual approval
step. No host event bus or provider event contract is implied by this package.

Minimal host wiring (the intent handler is deliberately a host callback):

```js
import createCommandPaletteUI from '@cockpit/gui/command-palette';
import '@cockpit/gui/styles.css';

const catalog = {
  providers: [{
    name: 'Local examples',
    commands: [{ id: 'demo.preview', title: 'Preview' }],
  }],
};
const schema = { fields: [{ id: 'target', label: 'Target', required: true }] };
const host = {
  submitApprovedIntent(intent) {
    // Apply the application's existing authorization and audit policy here.
    console.log('Host received reviewed intent:', intent);
  },
};

const palette = createCommandPaletteUI({
  document,
  root: document.querySelector('#command-review'),
  list: document.querySelector('#command-list'),
  catalog,
  host,
  resolverFactory: () => ({
    resolve: id => id === 'demo.preview' ? { parameterSchema: schema } : null,
  }),
  commandInterfaceFactory: ({ host: currentHost }) => ({
    submitIntent: intent => currentHost.submitApprovedIntent(intent),
  }),
  parameterInteractionFactory: currentSchema => ({ fields: () => currentSchema.fields }),
  reviewFactory: () => ({}),
  flowFactory: ({ commandInterface }) => ({
    select: id => ({ ok: true, id, parameterSchema: schema }),
    parameterize: (request, values) => values.target
      ? { ok: true, parameters: values }
      : { ok: false, errors: [{ field: 'target', error: 'Required.' }] },
    review: (request, result) => ({ id: request.id, parameters: result.parameters }),
    approve: reviewed => ({ ...reviewed, approved: true }),
    invoke: intent => commandInterface.submitIntent(intent),
  }),
});

palette.select('demo.preview', document.querySelector('#open-preview'));
```

This sample leaves validation/review mechanics in an injected host flow and
routes submission to a host callback. That callback is where existing policy
must be applied; the UI's approval button does not authorize execution.

## Workspace

Required options:

- `document`, `navigationRoot`, `panelRoot`.
- Non-empty `items[]` with unique, stable `id` and non-empty `label`; optional
  `title`, `state`, and `payload`.

Optional options: `initialId`, `navigationLabel`, and `onNavigate(id)`. Supported
panel states are `populated`, `empty`, `loading`, `error`, and `recovery`.
Payloads may provide `text`, a DOM `node`, a `render(target)` callback, title and
message, and state-specific retry options. `onRetry(api, id)` receives the
frozen workspace API and the item ID.

The factory returns a frozen API: `activate(id, moveFocus?)`, `activeId()`,
`setPanelState(id, state, payload?)`, and `panel(id)`. Navigation uses a labelled
tablist, linked tabs and tabpanels, roving tab focus, arrow keys, Home/End, and
visible focus styling from the shared CSS entry. Loading uses `aria-busy`; error
states use an alert; other status panels use a status role. The host owns item
data and decides when to update panel state.

## Workbench (CKP-GUI-007 candidate)

`createWorkbenchUI(options)` takes the host-owned `document`, `layout`,
`explorer`, `content`, and `context` elements. These elements remain owned
by the consuming application; the workbench applies portable slot classes,
creates an accessible activity rail and two resizable separators, and persists
side-panel widths when the optional host `storage` adapter is provided.

Optional `activities: [{id, label, glyph}]` customize the activity rail,
`initialActivity` selects its initial state, `onActivity(id)` routes
navigation back to the host, and `storageKey` namespaces local layout widths.
Storage has the `getItem`/`setItem` interface and is injected; the workbench
does not access global persistence services. The frozen API exposes
`activate(id)` and `widths()`. ArrowLeft/ArrowRight resize the side panels
from the focused separator, with Shift increasing the step.

The workbench does **not** handle project files, document writes, application
authorization, or AI provider access. Its initial version also does **not**
claim completed split editors, drag-and-drop docking, or full UX acceptance.
Those remain separate acceptance gates.

## Compatibility and deprecation

For `0.1.x`, exported names, required inputs, returned methods, DOM accessibility
relationships, and the intent handoff boundary are supported. Additive optional
inputs and exports are compatible. A breaking change before `1.0.0` increments
the minor version and includes a changelog migration entry. Once `1.0.0` is
approved, breaking changes increment the major version. A deprecated export is
marked in docs and the changelog and remains available for one minor release
before removal unless security or legal obligations require an earlier removal.
Unexported implementation details and generated DOM not listed above are not
stable APIs.

## Accessibility and host assumptions

The components generate labels and relationships and implement tested keyboard,
focus, error, recovery, forced-colors and responsive behaviors. Hosts must
supply meaningful labels, valid unique item IDs, appropriate content, and their
own authorization and status policy. Hosts that override the component CSS are
responsible for preserving its focus visibility and forced-colors treatment.
Automated axe/browser checks do not prove WCAG conformance.
Real screen-reader, operating-system high-contrast, magnification, native zoom,
physical touch and human usability checks remain open.

## Licensing

The package's stated license is MIT. HBL Creative Studios is the development
division of Osprey Strategic Holdings LLC, the intended copyright holder named
in `LICENSE`. The repository's package-private setting controls registry
publication workflow; it does not alter the permissions MIT grants to recipients
of copies. Public distribution or publication is not currently authorized.

The original extraction history is recorded in `docs/CKP-GUI-001.md`: the
initial staged file was an eight-line wrapper from `jj-ervin/cockpit`, followed
by later work recorded in this repository. Git author metadata and that history
do not, by themselves, verify an assignment or other rights transfer to the LLC
for every included contribution. Rights-transfer documents were not present in
the reviewed repository records. Verify the chain of title, including the
upstream-origin material and contributions, before approving public distribution.
