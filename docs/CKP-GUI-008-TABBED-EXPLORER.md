# CKP-GUI-008 — Tabbed Explorer

Status: private component candidate, first ProPro consumer. Owner decision: 2026-11-05.

## Interaction contract

The expanded left Explorer has icon tabs across its top for Files, Assets, Projects, Git and Conversations. These tabs change only the Explorer view; they do not replace the center workspace tab strip, bottom tools, or side Conversation. Every icon has a visible tooltip and accessible name. Each view retains its own filter, sort, selected item and expanded nodes. Sorting applies among siblings within a parent, preserving the hierarchy. Users can hide, show and reorder Explorer tabs; at least one remains visible.

Selecting an item asks its provider to open it in the host's appropriate center view. The UI does not infer file, Git, account, conversation or execution authority from a tab click. Providers own data, permissions, availability and actions. A provider may return nodes asynchronously; stale responses must not replace a newer view. Unavailable and empty states must say what data is or is not connected.

## Current private slice

`@cockpit/gui/tabbed-explorer` provides the tab controls, per-view filter and sort, tree rendering, keyboard navigation, settings menu and optional saved view state. It renders provider labels as text. The provider contract and methods are specified in `PACKAGE-CONTRACTS.md`.

ProPro's Projects view reads its browser-local project records and nested title entries; selecting a project or entry opens a center tab. Assets shows browser-local resource, evidence and link titles, with no claim of binary asset storage. Files lists only local documents the user opened in this page session. Git and Conversations explicitly say they are not connected. Those two tabs do not read repositories or chats. ProPro project records retain their version 1 shape; Explorer preferences use a separate storage key.

## Acceptance criteria

- Explorer tab switching leaves the center workspace and right Conversation in place. Home still returns the center to its dashboard view.
- Project and entry nodes open the correct center tabs. Session files appear only after a user chooses a supported local file; closing its center tab removes it from Files.
- Each view keeps its filter, sort and expanded state when switching; preferences survive reload without changing project records.
- Icon tabs and tree nodes work with keyboard focus, arrows, Home/End and Enter. Disclosure buttons have names and touch targets. The tree never inserts provider labels as HTML.
- Desktop and 390px captures show the expanded Explorer without horizontal overflow. Automated WCAG 2.2 AA checks and consumer interaction tests pass.
- Git and Conversations unavailable states are explicit. No command execution, repository read, chat read, upload or account authorization is implied.

## Later milestones

Add permission-scoped folder and file providers, a binary asset library, connected Git and conversation-history adapters, lazy loading for large trees, context menus, safe drag/drop, and provider-specific sorting/grouping. Those require source ownership, permissions, freshness, error/recovery and action contracts before activation. The first slice is not evidence that those data integrations exist.
