# Cockpit GUI human-centered interaction and visual acceptance — project baseline

Status: ADOPTED AS COCKPIT GUI PROJECT GUIDANCE. These requirements guide workbench implementation now; no RFC, outside standard, DCP/DXP reconciliation, or additional approval process is required to proceed. This is not a claim of conformance to any external standard.

## Experience contract
A welcoming conversational workspace combining familiar desktop navigation and direct manipulation with optional professional tools. Preserve application independence and avoid forced coupling to other products.

## Familiar interaction requirements
- Predictable Home, Projects, Search, Recent, Settings and Help navigation.
- File/project explorer, tabs, breadcrumbs, history, split views, contextual actions and resizable panels where applicable.
- Persistent work context and visible save, operation, failure and recovery status.
- Conversation and direct editing are complementary; AI changes are inspectable, interruptible and reversible where supported.
- Simple initial experience with discoverable advanced functionality, not separate rigid user classes.

## Iconography and semantics
- Prefer common, recognized metaphors (search magnifier, settings gear, folder, trash, plus, close, back).
- Maintain a canonical action-to-icon-to-label-to-accessible-name mapping.
- Never use the same glyph for contradictory actions; do not rely on glyph or color alone for critical meaning.
- Icon-only controls require accessible names and appropriate visible labels/tooltips based on context; touch users cannot depend on hover.
- Use one coherent icon family per surface; platform-specific exceptions require rationale. Icon library selection is implementation-specific, not governance-mandated.

## Before coding
Record target users and tasks, navigation model, wireframes, approved viewport references, interaction states, icon mappings, accessibility targets, and measurable usability/visual acceptance criteria.

## Acceptance evidence
- Rendered screenshots at agreed desktop/tablet/mobile sizes, compared against references.
- Keyboard-only and assistive-technology checks; focus, labels, contrast and responsive reflow.
- Tested states: empty, populated, loading, errors, disabled, pending, success and recovery.
- Real user task tests: navigation comprehension, project opening, artifact editing, AI change review, return-to-work continuity.
- Document deviations; do not equate green CI with visual or usability acceptance.

## External standards
Future Governance Commons HCI/A11Y work and DCP/DXP integration are optional, independent efforts. They do not gate Cockpit GUI design, implementation, testing, release, or project-level acceptance. Any external conformance claim requires separate evidence.

## Full workspace design baseline
This baseline covers the complete earlier GUI direction, not merely iconography.

### Five-region shell
1. Global navigation: Home, Projects, Conversations, Search, Activity and Settings with understandable labels.
2. Explorer/organizer: folders, files, tasks, conversations, sources and artifacts; friendly project overview or advanced tree view.
3. Primary workspace: conversation, document/code editor, visual preview, research surface or dashboard; the content area dominates.
4. Optional contextual panel: assistant, selected-item details, references, task progress and properties; hide when not useful.
5. Restrained status feedback: save, connection, running tasks, errors, recovery and approval needs.

### Essential interaction and experience patterns
- Browser-like reorderable tabs, back/forward, breadcrumbs, recent items and persistent workspace restoration.
- Explorer selection, context menus, search, drag/drop, split view, resize, undo/redo and keyboard shortcuts.
- Natural-language conversation as a universal entry point, with attachment support and artifact-adjacent assistance; never remove direct editing.
- Inspectable AI actions, clear permissions, visible progress, pause/stop, diff/review and reversibility where supported.
- Progressive complexity: simple onboarding, standard project work and optional advanced editor/terminal/agent features; no rigid user tiers.
- Multiple appropriate project views (list, board, calendar, timeline, document) when needed, without duplicating data.
- Calm professional hierarchy, typography, spacing, icon consistency, light/dark themes and responsive, device-appropriate layout.
- Inclusive interaction: accessible labels, focus/keyboard, screen readers, contrast, scalable text and reduced motion.

### Prioritized feature tiers
**Initial baseline:** familiar navigation/explorer; tabs/restoration; conversational input; search/contextual actions; autosave/undo/recovery; resizable panels/split views; artifact preview; visible AI progress/approvals.
**Subsequent:** alternative project views, advanced personalization.
**Optional specialization:** terminal, Git/source control, multi-agent orchestration, extensions.

### Visual acceptance before implementation
For each target screen, approve a wireframe and representative visual reference, viewport and responsive expectations, component states, icon/label semantics, keyboard/touch contracts and usability task criteria. Test actual rendered output against the approved references; CI green alone does not establish usability or visual fidelity. Record evidence and deviations. Adoption of this baseline does not assert that Cockpit GUI already meets these requirements.

### Additional experience decisions to preserve
The five experience outcomes are familiarity, predictability, user control, continuity, and recoverability. Validate them with declared people and tasks rather than assuming every user expects every pattern. Borrow learned behavior from file managers, browsers, document editors, messaging tools, and AI assistants without copying their branding or assets.

- Keep notifications quiet and actionable. Explain where content is stored, what the assistant can access, what changed, and whether an operation or save succeeded.
- Restore work in a device-appropriate way: desktop can prioritize multitasking; narrow/mobile views can prioritize conversation, review, capture, and quick action.
- Offer useful defaults plus remembered theme, density, font-scale, and layout preferences where supported; configuration should not be required for first use.
- Map each action to its icon, visible label, tooltip/help text, accessible name, and expected pointer, keyboard, and touch behavior. Include disabled and destructive states. Test ambiguous and specialized glyphs with representative users.
- Candidate action vocabulary includes Home, Search, Menu, Settings, Folder, File, Add, Edit, Save, Delete, Download, Upload, Back, Forward, Refresh, Close, Sidebar, Split view, More, Filter, Help, Alerts, Account, Attach, Undo, Redo, Copy, Confirm, Run, Stop, Preview, and Open link. This is a semantic inventory, not a required icon package. Lucide was suggested as one possible coherent family, not mandated.
- Evaluate actual tasks for completion, confusion, error rate, icon recognition, and recovery. Expert review, automated checks, participant observation, and owner visual approval are distinct evidence types.
