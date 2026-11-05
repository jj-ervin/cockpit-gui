# CKP-GUI-PROP-001 — Adaptive collection UI consumer proposal

Status: **Proposal only — no API or implementation accepted**  
Date: 2026-11-04  
Proposed consumer: [ProPro](https://github.com/jj-ervin/project-portal), alongside Portable Studio.

## Why this exists

ProPro adopted a welcoming **Adaptive Workspace** experience with large rounded project tiles as the default and user-selectable Large, Mini, Grid and List collection presentations. This is a candidate *generic UI requirement*, not a request to embed ProPro project semantics in Cockpit GUI.

The current `@cockpit/gui@0.1.0` main-branch package exports command palette, workspace, and stylesheet entries. No generic collection/card API is advertised in `package.json`. Existing CKP-GUI-006 maintenance and private-distribution boundaries remain in force. Do not claim implementation or public distribution approval.

## Proposed shared capabilities (subject to consumer audit)

- Host-neutral card surface with design-token-controlled radius (initial visual target: 12–16px), spacing, hover/focus/selected/disabled states, accessible activation, and safe nested actions.
- Host-neutral collection layout with **Large, Mini, Grid, List** modes; responsive columns and predictable keyboard/focus behavior.
- Separate **per-item collapsed/minimized state** from collection-wide Mini mode.
- Controlled view-mode and per-item-state APIs; host owns persistent preferences, content, data and filtering/sorting.
- Generic toolbar/view-switch control with meaningful labels and accessible state.
- Consistent navigation, selection and actions across presentations.
- Layout state must not mutate host records; preserve selection, filter, sort, grouping and scroll where practical.
- Consumer-defined card content: ProPro supplies project status/progress; Portable Studio supplies creative document/asset data. No `Project`, `Repository`, or `CreativeAsset` dependency in the shared UI.
- Explicit Simple/Standard/Advanced workspace presentation choices should compose existing primitives where possible, rather than create parallel application shells.

## Proposed API shape — illustrative, NOT an approved export

```js
// Host-owned state; illustrative only. Do not import this until implemented.
const collection = createCollectionUI({
  root,
  mode: 'large', // large | mini | grid | list
  items,
  collapsedIds: new Set(),
  renderItem(item, context) { /* host-owned content */ },
  onModeChange(mode) { /* host persists preference */ },
  onCollapsedChange(ids) { /* host persists per-item state */ },
  onActivate(id) { /* host navigation */ },
});
```

The audit must first decide whether a new primitive is justified, whether existing Cockpit GUI exports can be composed, and whether any responsibility belongs to Cockpit Tab. Avoid speculative API stabilization.

## Visual/HCI acceptance

1. Large rounded cards are spacious and readable; no dense IDE-first default.
2. Four collection views work with the same content and actions.
3. One tile can collapse while neighboring tiles stay expanded.
4. Responsive screenshots at 375, 768, 1280 and 1920px; no clipping, overlap or unintended horizontal scrolling.
5. Visible keyboard focus, accessible labels/states and applicable WCAG 2.2 AA checks.
6. Mode switching preserves host selection, filters and active context.
7. Generic behavior validated with **at least two distinct consumers**, not ProPro alone.
8. Browser visual inspection and task-based usability evidence required; automated test counts are insufficient.

## Ownership and release gates

- Cockpit GUI: generic presentation, tokens, interaction and accessibility.
- ProPro: domain records, project actions, saved preferences and content.
- Portable Studio: creative-domain content and actions.
- Cockpit Tab: ownership of workspace/tab lifecycle must be verified from source before moving code.
- Do not alter existing public exports or release/package status as part of documentation.
- Any implementation needs separate scope approval, compatibility review, unit/browser tests, package test, consumer regression, changelog/version decision and rights/provenance review where relevant.
- The consumer audit should inspect current PRs/branches before assuming main is the newest workbench.

## Next steps

1. Inspect main and active workbench branches/PRs in cockpit-gui and Portable Studio.
2. Compare current exported capabilities against the ProPro UX contract.
3. Document reuse vs gaps, responsibilities and smallest viable generic extension.
4. Only then implement a bounded shared component and test it with both consumers.

Reference: ProPro `docs/PROP-CKP-001-ADAPTIVE-WORKSPACE.md` on its integration-design branch.
