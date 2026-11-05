# CKP-GUI-007 — Refined Adaptive Workspace baseline

Status: adopted UX direction, phased implementation; visual and usability acceptance remain open. 2026-11-05.

## Experience

The workspace adapts to the task and the person. **C adaptive density** is the model; **B balanced** is the initial appearance. Balanced uses a welcoming, readable hierarchy. Refined is a finer, more compact choice. Neither mode may shrink text, focus indicators, or targets past accessible use. More spacious and high-contrast presets can follow. Appearance and layout are user choices, not project data.

The recognizable shell has a Home action returning to the dashboard, a left activity rail and explorer, central work, optional right conversation/context, and optional bottom work area. The center remains the largest desktop region. Panels can be resized, reordered, hidden and restored with pointer and keyboard paths. Saved named layout presets include panel state, density, theme, colors, icon style and typography. Reset restores a usable default. A panel may eventually detach into another window or monitor; that requires a host-owned window lifecycle, shared state synchronization, recovery when a window closes or display disappears, and explicit accessibility testing. This is architecture direction, not a shipped API.

The universal composer follows the current task across modules. It accepts natural language, `#` tags, `@` project/file references and `/` CLI commands. A visible scope selector supports web, project and file search, with context suggestions that the user can override. A `+` control opens a labeled attachment picker and its menu; an asset manager may be a separate view. Show the selected context, attachments, destination and action before submission. Searching, drafting and executing are distinct states. The host owns file access, web access, CLI routing, authorization and confirmation; typing a command or attaching a file never grants execution permission.

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

1. **Vertical slice:** host Home navigation and Balanced/Refined density persistence with tests and real browser captures. Keep the existing package API and project data contract intact.
2. **Panel system:** bottom slot, keyboard/pointer resize, hide/restore/reorder and viewport-safe layout state. Test in two distinct hosts before stabilizing a shared API.
3. **Appearance:** theme, colors, icon and typography controls with named presets, validation, reset and migration-safe storage.
4. **Composer:** token parsing, scoped search, attachment picker and host callbacks; add permission review before any executable action.
5. **Detached panels:** optional multiwindow host adapter, synchronized state and recovery. Validate multi-monitor behavior and assistive technology.

Completion of one milestone does not satisfy the CKP-GUI-007 visual/usability gate or authorize merge, release or publication.
