# Cockpit GUI human-centered interaction acceptance — proposal

Status: PROPOSED. This is a consumer implementation profile, not an independent governance standard.

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

## Governance integration
Align with the eventual adopted HCI/A11Y standard through DCP/DXP. Do not declare conformance until requirements and evidence are actually verified.
