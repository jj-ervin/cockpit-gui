# Package API and compatibility contract

Status: supported API baseline for private `@cockpit/gui` `0.1.0`; additive `0.1.5` candidate; public
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
| `@cockpit/gui/tabbed-explorer` | `createTabbedExplorerUI(options)` | Provider-backed Explorer tabs and tree navigation. |
| `@cockpit/gui/composer` | `createComposerUI(options)` | Suggestions and local attachment presentation in a host form. |
| `@cockpit/gui/styles.css` | CSS stylesheet | Shared component and responsive styles. |

The JavaScript entry files use CommonJS exports in Node and expose the browser
globals `CockpitCommandPaletteUI`, `CockpitWorkspaceUI`, `CockpitWorkbenchUI`,
`CockpitTabbedExplorerUI` and `CockpitComposerUI` when loaded as plain
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
does not access global persistence services. The frozen API exposes `activate(id)`, `widths()`, `setPanelVisible('explorer'|'context', boolean)`, and `panelVisible('explorer'|'context')`. Hosts own the controls that invoke panel visibility; hiding a panel does not dispose its content. ArrowLeft/ArrowRight resize the side panels from the focused separator, with Shift increasing the step.

The additive `0.1.1` candidate also exposes `dockContext('right'|'bottom')`, `contextDock()`, and `resetLayout()`. A bottom-docked context uses the same host-owned element. Its focused separator uses ArrowUp/ArrowDown (Shift for a larger step), or pointer drag, to resize height. Widths, bottom height, context position and both panel visibility values persist through the optional storage adapter. Existing width-only saved objects remain readable. Reset restores right docking, visible panels and default dimensions. These methods affect presentation only; no content is copied, executed or detached into a new window.

The additive `0.1.2` candidate accepts `dockContext('left')`. Left placement swaps the context and explorer side panes, preserving each pane's host-owned content and saved visibility. Both separators resize the panel they border and expose the correct accessible name and range. This does not create arbitrary panel slots, drag docking, or external-window capability.

The additive `0.1.3` candidate accepts an optional host-owned `bottom` element. When supplied, `setPanelVisible('bottom', boolean)`, `panelVisible('bottom')`, `bottomHeight()` and `setBottomHeight(pixels)` control an independent bottom slot. A separate horizontal separator supports ArrowUp/ArrowDown and pointer resizing; bottom visibility and height persist with the existing layout storage key. Reset hides bottom and restores its default height. The side `context` stays independent and can still swap left/right. A previously saved bottom-docked context is normalized to right placement with bottom visible; `dockContext('bottom')` is unavailable when the separate bottom slot is supplied. Hosts without `bottom` retain the earlier context-bottom API and layout behavior.

## Tabbed Explorer (`0.1.4` candidate)

`@cockpit/gui/tabbed-explorer` exports `createTabbedExplorerUI({document,root,tabs,storage?,storageKey?})`. Each tab has a unique `id`, `label`, optional `icon`, optional `sortOptions`, and a provider. A provider's `getNodes()` returns an array or `{nodes,message}` and may return a promise; `open(node)` handles a host-authorized open action. Nodes use `{id,label,icon?,meta?,children?}`. The GUI treats labels as text and owns no filesystem, Git, asset, conversation or project authority. A missing provider displays an explicit unavailable state.

The component owns icon tabs with labels/tooltips, a per-view filter and sort selector, sibling sorting, nested tree presentation, keyboard tab and tree navigation, and saved view state. `activate(id)`, `activeTab()`, `refresh()`, `setTabVisible(id,boolean)`, `moveTab(id,direction)`, `tabOrder()` and `tabVisible(id)` are exposed for host controls. Its built-in menu can hide, show and reorder tabs. At least one view remains visible. Storage is optional and namespaced. The host must provide stable node IDs, provider data, permissions and meaningful actions. The first slice does not claim filesystem browsing, drag/drop, context menus, virtualized loading or connected Git/conversation history.

## Composer (`0.1.5` candidate)

`@cockpit/gui/composer` exports `createComposerUI({document,form,input,suggestions,attachments,fileInput,getSuggestions?,onAttachmentsChange?})`. It enhances host-owned form elements with keyboard-operable `#`, `@` and `/` suggestions and local attachment chips. `getSuggestions(prefix,query)` supplies host-owned labels; the component filters non-string values and displays at most six. `files()` returns a copy of the selected browser `File` objects. `clearAttachments()` removes them and notifies the host. `clearSuggestions()` dismisses transient suggestions. Enter submits the host form, Shift+Enter inserts a newline, and Escape dismisses suggestions. The host must provide a labeled input, file picker and submission handler. The package neither reads file contents nor uploads, searches, routes commands or grants execution authority.

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
