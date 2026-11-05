# CKP-GUI-007 — Refined Adaptive Workspace baseline

Status: adopted UX direction, phased implementation; visual and usability acceptance remain open. 2026-11-05.

## Experience

The workspace adapts to the task and the person. **C adaptive density** is the model; **B balanced** is the initial appearance. Balanced uses a welcoming, readable hierarchy. Refined is a finer, more compact choice. Neither mode may shrink text, focus indicators, or targets past accessible use. More spacious and high-contrast presets can follow. Appearance and layout are user choices, not project data.

The recognizable shell has a Home action returning to the dashboard, a left activity rail and explorer, central work, optional right conversation/context, and optional bottom work area. The center remains the largest desktop region. Panels can be resized, reordered, hidden and restored with pointer and keyboard paths. Saved named layout presets include panel state, density, theme, colors, icon style and typography. Reset restores a usable default. A panel may eventually detach into another window or monitor; that requires a host-owned window lifecycle, shared state synchronization, recovery when a window closes or display disappears, and explicit accessibility testing. This is architecture direction, not a shipped API.

Panel placement and visibility controls belong together in the global top bar, using a compact, labeled icon group for the primary sidebar, bottom panel and secondary sidebar. The pane itself holds its task content. The top controls expose their current state, work by keyboard, remain reachable at narrow widths and include a clear layout reset. Hosts may style the controls, while Cockpit GUI owns the reusable panel behavior.

The universal composer follows the current task across modules. It accepts natural language, `#` tags, `@` project/file references and `/` CLI commands. A visible scope selector supports web, project and file search, with context suggestions that the user can override. A `+` control opens a labeled attachment picker and its menu; an asset manager may be a separate view. Show the selected context, attachments, destination and action before submission. Searching, drafting and executing are distinct states. The host owns file access, web access, CLI routing, authorization and confirmation; typing a command or attaching a file never grants execution permission.

**Initial visual target:** Soft Precision, with a neutral foundation, restrained accent color, 13–14px readable base text, a 48–56px activity rail, 40–48px title bar, compact 36–40px inputs, 5–7px control radius and 12–16px dashboard-card radius. These are prototype targets, subject to contrast, zoom, touch and human legibility review. The shell should feel precise while project cards remain welcoming. The initial appearance is a composed screen, not a settings toggle.

Use familiar icons with accessible names and tooltips. Keep task flow obvious through progressive disclosure: primary actions remain visible, advanced controls live in menus or settings, and empty/error/recovery states explain the next action. Support keyboard, screen reader, focus restoration, 200% zoom, narrow screens, forced colors, reduced motion and readable contrast from the first slice.

## Ownership

- Cockpit GUI owns generic presentation, focus, resize/docking interaction and component accessibility.
- Each host owns project/file records, navigation meaning, saved preferences, authorization, command execution, search providers, attachments and window lifecycle.
- Cockpit Tab may own tab and split lifecycle after a source and compatibility review; this document does not assign it by inference.
- ProPro remains an independent consumer. Its current dashboard and Large/Mini/Grid/List cards are host-owned pending a second-consumer case for a generic collection API.

## Acceptance criteria

1. Home returns to the host dashboard from an open task, with a clear name and focus destination; records and unsaved work are preserved or guarded.
2. Balanced is the default. Density and appearance changes preview immediately, persist per user, survive reload, and reset. Content, selected item and storage schema remain intact.
3. Desktop left/center/right/bottom panels resize, move, hide and restore by pointer and keyboard. The center never collapses below its usable minimum; narrow view offers a deliberate panel switcher.
4. Presets restore valid layouts after restart or changed viewport. Detached windows fail back into the main window without lost content or hidden actions.
5. Composer token suggestions and scope selection are keyboard accessible; ambiguous references resolve visibly. Attachment picker supports cancel/remove and exposes file name, size and access context.
6. A proposed CLI or file-changing action presents exact target and permission state. Rejection/cancel leaves data untouched; execution uses the host's existing policy. Search and ordinary messages do not silently invoke commands.
7. At 1440×900, 1280×800 and 390×844, plus 200% zoom, no clipped controls, overlap or unintended page overflow. Light/dark/forced-colors and reduced-motion states remain legible.
8. Automated unit, browser, accessibility and package/consumer regression checks pass. Human keyboard, screen-reader and task-based usability review plus owner comparison to approved running screenshots are recorded separately under [the visual acceptance contract](CKP-GUI-007-VISUAL-ACCEPTANCE.md).

## Coding milestones

1. **Visual workspace slice:** make Refined Balanced the actual default shell: compact title/search, persistent activity rail, useful central dashboard, visible contextual conversation pane and a composer with local search and attachment selection. Home returns to the dashboard. Test the running screen and preserve project data. Density is one later appearance option, not this milestone's product outcome.
2. **Panel system:** bottom slot, keyboard/pointer resize, hide/restore/reorder and viewport-safe layout state. Test in two distinct hosts before stabilizing a shared API.
3. **Appearance:** theme, colors, icon and typography controls with named presets, validation, reset and migration-safe storage.
4. **Composer:** token parsing, scoped search, attachment picker and host callbacks; add permission review before any executable action.
5. **Detached panels:** optional multiwindow host adapter, synchronized state and recovery. Validate multi-monitor behavior and assistive technology.

Completion of one milestone does not satisfy the CKP-GUI-007 visual/usability gate or authorize merge, release or publication.

## Right/bottom docking candidate — 2026-11-05

The private `0.1.1` candidate adds context-panel right/bottom docking, keyboard and pointer resizing in either position, persisted panel visibility and layout reset. ProPro consumes a pinned packed artifact and exposes the controls in its Layout menu and conversation header. The same context element moves by CSS region placement; project data and composer content remain host-owned. This does not implement drag-and-drop, arbitrary pane reordering, detached windows or multi-monitor synchronization. Those remain in the panel-system and detached-panel milestones above. Running visual and accessibility evidence belongs in ProPro's consumer report.

## Tabbed utility pane and side swap candidate — 2026-11-05

The private `0.1.2` candidate adds left placement for the context pane, swapping it with Explorer while retaining the existing right/bottom placements and persisted layout. ProPro owns a tabbed utility surface inside that pane: Conversation, a non-executing CLI scratchpad, Problems and browser-local Notes. The selected tab and notes have storage keys separate from project records. The top layout menu performs the side swap; top layout icons operate on the panes occupying each region. Email, calendar and arbitrary host widgets are future pinning adapters requiring distinct data, permission, lifecycle and security contracts. No live terminal, external account connection, detached window or arbitrary three-way panel assignment is claimed in this slice.

## Center workspace tabs clarification — 2026-11-05

The center is an editor and viewer region, not a dashboard page beside tool panes. Home returns to the dashboard there as a dedicated view; the user may explicitly open it as a tab. Opening a project, local document, code file, Markdown file, PDF, terminal session, agent session or web view creates or activates a center work tab when that host capability exists. Tabs can be selected, closed and revisited without relocating the surrounding panes; their lifecycle, dirty state, save/recovery behavior, file permissions and provider authority belong to the host or a separately reviewed tab component. A CLI scratchpad or conversation may have a center work view and a compact panel view as separate presentations of an underlying host session, but this does not imply that a bottom-panel function itself is docked into another pane.

The activity rail chooses which left-side tool view is expanded, such as Projects or Search. The left explorer, bottom utility panel and right conversation panel are independent regions whose visibility, size and placement can be pinned or swapped by user preference. A pane position is not a tab destination or a content type. The current ProPro slice shows Home as a center view and opens projects, a local-only CLI preview, and read-only local text/Markdown/code/PDF previews in center tabs. Live terminal execution, agent-session continuity, web embedding, writable file editors, arbitrary pane assignments and detached windows require later host contracts and acceptance checks.

## Home dashboard behavior correction — 2026-11-05

Home is a command that returns the center to the main dashboard view, not a mandatory dashboard tab. The dashboard is a customizable landing space for project views and, later, host-owned widgets and shortcuts. Its current card view and minimized cards are the first preferences; a broader widget/layout model remains unimplemented. Open work tabs remain available through a Resume work action after Home. A user may explicitly open or pin the dashboard as a normal center tab. Returning Home still shows the full dashboard view without an editor tab strip. Pane placement and utility-panel tabs remain independent of this center-view choice.

## Home pins and Workspace navigation — 2026-11-05

The activity rail has distinct Home and Workspace destinations. Home shows the dashboard; Workspace resumes the most recent work tab or opens an empty work view. This is navigation, not a global toggle that moves or destroys panes. A dashboard tab remains optional. The dashboard may pin project and entry shortcuts, tools/features, assets, graphical summaries and source-backed live data as host capabilities mature. A pin has a stable target, title, owner/source, open action, availability state and unpin action. Pinning a view never grants file, network or command-execution authority. Visualizations must name their source and freshness and show loading, stale, empty and error states where applicable; user-configured refresh and permissions belong to the host/provider contract. ProPro's first slice pins local projects and project entries and offers a small chart derived only from browser-local project records. It does not claim live external data, arbitrary widgets, executable tools or binary asset persistence.

## Independent bottom pane correction — 2026-11-05

The top bottom-panel control opens a bottom region of its own. It does not redock Conversation. CLI scratchpad, Problems and Notes are tabs in that bottom region; Conversation and its composer remain in the side pane. Both regions can be open at once and their top controls toggle them independently. Side swapping exchanges Explorer and Conversation only. This corrects the earlier `0.1.2` host interpretation above, where utility tabs were placed inside Conversation and the context pane itself was docked to the bottom.

Acceptance for the corrected slice: opening or closing bottom tools leaves Conversation in place; closing Conversation leaves bottom tools in place; tab choice, pane visibility and bottom height survive reload; reset restores default placement; keyboard and pointer resizing work; narrow layouts remain readable; no project records change when layout changes. ProPro implements and visually verifies this as a host-owned bottom region while the reusable Cockpit GUI bottom-region API remains a later package milestone. The package's legacy context-bottom capability is not used for this UX.
