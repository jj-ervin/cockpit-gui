# Cockpit workbench reference set — 2026-11-04

**Status: proposed design reference; owner visual approval pending.** These are static concept screens, not a running Cockpit GUI capture, usability result, implementation proof, or a new governance standard. The source is [workbench-reference.html](workbench-reference.html). Recreate the PNGs with `node docs/reference-screens/capture.mjs` from the repository root. Captured in headless Chromium 141.0.7390.37 at device scale 1 and 100% browser zoom.

| Reference | Viewport | Decision shown |
| --- | --- | --- |
| [Desktop workspace](desktop-workspace-1440x900.png) | 1440 × 900 | Compact title/search, activity rail, project Explorer, dominant document, optional assistant, status. |
| [Smaller desktop workspace](desktop-workspace-1280x800.png) | 1280 × 800 | Same hierarchy at the second contract size. |
| [AI change review](ai-change-review-1440x900.png) | 1440 × 900 | Visible steps, exact proposed words, explicit accept/reject/edit, stop, and return to original. Nothing is applied in this state. |
| [Narrow workspace](narrow-workspace-390x844.png) | 390 × 844 | Document first; Explorer opens from a labeled menu, assistant from the persistent composer. |

Northstar is neutral sample content. Project type, file format, provider, and storage are host owned. The concept borrows familiar workspace conventions without copying a product's branding or assets. Controls in the HTML are visual references; a click on them is not proof of behavior. The reference represents one light theme; the same hierarchy and state meaning must survive a dark theme, forced colors, and 200% zoom.

## Visual and behavior acceptance matrix

Each row is a proposed check for the **running implementation**. Record PASS, FAIL, or NOT TESTED with a screenshot or recording, candidate commit, browser, viewport, tester, and date. Initial state for every row: **NOT TESTED**.

| Area | Observable acceptance criterion | Reference |
| --- | --- | --- |
| Shell hierarchy | Five regions are recognizable; main work is widest at both desktop sizes; optional panels hide and restore without losing the task. | Desktop, smaller desktop |
| Familiar navigation | Back/forward, scoped search, Explorer folders, breadcrumbs, selected/dirty tabs, close, recent work, context menus, and settings have conventional meaning and readable labels. | Desktop |
| Workspace control | Tabs reorder; selection, drag/drop, split view, pointer and keyboard resizing, undo/redo, save/autosave, and session restoration produce visible, recoverable outcomes. No unsaved edit is silently lost. | Desktop |
| Conversation and artifacts | Composer accepts ordinary language and attachments; selected text and artifact preview remain connected to the visible work; context access is explained. | Desktop, narrow |
| AI oversight | Plan/progress, target object, exact proposed change, permission request, approval, rejection, interruption, and reversal are distinct. A suggestion cannot appear as already applied. | AI change review |
| Narrow flow | At 390 × 844, a person can find a project/file, edit or review, open the assistant, attach content, and return to work without hidden or clipped critical actions. | Narrow |
| States and feedback | Empty, loading, saved, unsaved, error, permission denied, stopped, rejected, accepted, and recovery states have plain-language status and a next action; no layout jump or ambiguous color-only signal. | All; additional running-state captures required |
| Icon semantics | Use familiar search, file/folder, history, settings, notification, attachment, split, close, accept and stop symbols. Pair ambiguous icons with labels/tooltips and accessible names; test comprehension with users. | All |
| Readability and adaptation | Calm spacing, stable typography, contrast, focus and target sizes remain usable at 1440 × 900, 1280 × 800, 390 × 844, 200% zoom, light/dark themes, reduced motion and forced colors. | All; additional running-state captures required |
| Universal projects | Repeat the core workflow with software, research, creative and nonsoftware project content without changing the shell's basic semantics or imposing one domain model. | All |

## Evaluation tasks and evidence

Use [CKP-GUI-004 usability protocol](../CKP-GUI-004-USABILITY-PROTOCOL.md) and [CKP-GUI-007 visual acceptance contract](../CKP-GUI-007-VISUAL-ACCEPTANCE.md). Ask real users to: (1) resume a project, find and open a file, (2) make and recover from an edit, (3) ask for a change and inspect/reject or accept it, and (4) repeat the core flow at narrow width. Record task completion, time, errors, confusion, recovery, participant context, and observed accessibility needs. Include keyboard-only and screen-reader task review; run automated accessibility checks as supporting evidence.

Before implementation acceptance, compare **actual running screenshots** with the owner-approved references at the three required viewport sizes. Capture loading, empty, error and recovery states as well as the main workflow; note intentional visual differences. The owner must explicitly approve the reference comparison. Keep separate functional, visual and usability decisions. Current results: **functional NOT TESTED; visual NOT TESTED; usability NOT TESTED; owner approval pending.**
