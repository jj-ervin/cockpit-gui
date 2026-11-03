# CKP-GUI-007 — Visual and Usability Acceptance Contract

**Status:** Proposed acceptance gate; not yet satisfied. Applies to Cockpit GUI workbench and each consuming application. This document is not a claim of certification or visual approval.

## Intended experience
Cockpit GUI is the reusable, accessible, friendly, VS Code-inspired workbench adopted by independently running applications. Cockpit Tab remains a separate optional application/workspace host. Portable Studio is a consumer.

A person should recognize how to switch activities, browse projects, open documents, work in editors, use an assistant, and recover their layout without reading architecture documentation.

## Reference and evidence
Before a visual acceptance decision, attach a dated reference capture/mockup that the owner explicitly approves, plus current screenshots **of the running implementation** at 1440×900 and 1280×800, and a narrow 390×844 viewport. Attach the source commit, browser engine and zoom, screenshots or recordings, test commands, reviewer and date. A screenshot generated from a concept is not implementation evidence.

Review each screenshot side by side with the approved reference. Changes in composition, major region hierarchy, visual density, typography, color and behavior require a recorded explanation; do not infer approval from passing automated tests.

## Visual criteria — all required
- [ ] **Recognizable shell:** compact title/title-action bar, narrow left activity rail, project Explorer, central editor/documents, optional right assistant/context region and status bar. No prominent marketing-style page header, giant section buttons, or unrelated dashboard layout.
- [ ] **Editor priority:** when side panels are shown at desktop width, the center is visibly the largest work region and does not collapse into a narrow strip. Panels can be hidden without stranding the work.
- [ ] **Navigation hierarchy:** activity rail changes workspace context; Explorer uses identifiable folders/files; editor tabs clearly distinguish open, selected and dirty state; assistant is consistently located and labeled.
- [ ] **Controls:** consistent control heights, corner radii, spacing, typography and icon vocabulary; obvious hover, active, disabled and focus states; no cramped or gratuitously oversized controls.
- [ ] **Fit:** no clipped labels, overlapping regions, zero-width columns, unintended horizontal scrolling, inaccessible off-screen actions or competing page-wide scrollbars at the reference viewports.
- [ ] **Responsiveness:** desktop composition remains usable at 1440×900 and 1280×800; at 390×844, primary task flow remains accessible through deliberate stacking/collapse with no lost controls.
- [ ] **Accessibility presentation:** 200% zoom/reflow, visible keyboard focus, readable contrast, meaningful labels, screen-reader task review and reduced-motion/forced-colors where appropriate.
- [ ] **Legibility:** titles, selected file, document state, validation/error, save status and assistant/provider status communicate through readable text rather than color alone.
- [ ] **Consistency:** independent consumer apps should share the recognizable Cockpit workbench, but keep their own content and domain logic.

## Interaction acceptance — all required
- [ ] Start/open a project, locate a manuscript in the Explorer, open it in a tab, move between tabs and close a tab safely.
- [ ] Make an unsaved edit, navigate to another view, and verify data-loss warning or preservation; save/reopen and verify persistence.
- [ ] Hide/show Explorer and assistant/context; resize panels with pointer **and keyboard**; reload and verify restoration.
- [ ] Perform a task using keyboard only; verify order, focus visibility and focus restoration.
- [ ] Test loading, empty, error and recovery states without layout jumps or blocked actions.
- [ ] Repeat the core workflow on the narrow viewport; test at 200% zoom.
- [ ] Run automated functional, accessibility and visual browser checks on the candidate commit; manually inspect actual browser evidence.

## Decision gate
Record a separate **functional**, **visual**, and **usability** result: PASS, FAIL, or NOT TESTED. Overall acceptance is PASS only when all three PASS and the owner approves the visual reference comparison. CI success alone is never visual acceptance. A FAILED or NOT TESTED category blocks acceptance, merge/release claims and adoption-ready claims; keep changes in draft review.

For each defect record screenshot, viewport, reproduction steps, expected result, actual result, severity, owner and verification link. Do not weaken tests to hide visible defects. Preserve consumer data and project independence throughout corrections.
