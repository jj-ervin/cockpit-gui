# CKP-GUI-004 — Representative Usability Session Protocol

**Status:** proposed; no participant sessions have been conducted.

## Purpose

Observe whether people can discover and complete the standalone demo's command,
workspace, and service-recovery tasks with their usual input and assistive
technology. The demo is inert: it records local sample intent and never invokes a
real provider or service.

## Participants and setup

Recruit a small, varied group of Cockpit GUI or developer-tool users. Include
people who use keyboard-only navigation, screen readers, magnification or browser
zoom, and mobile touch where available; participants may represent more than one
use pattern. Ask participants to use their normal settings and assistive tools.
Record browser, operating system, viewport, input method, and assistive technology
only with participant consent. Do not collect personal or production data.

Run sessions one at a time. Use a clean demo page and the same inert sample data
for each participant. Tell participants that the preview and approval are local
demonstration states and do not run a real command.

## Moderator instructions

1. Read each task exactly as written and let the participant choose how to
   interact.
2. Ask the participant to think aloud when comfortable. Do not point out controls
   or explain expected outcomes before the task.
3. If the participant becomes blocked, record the point of difficulty and then
   offer the minimum assistance needed to continue.
4. Do not treat completion after moderator assistance as unassisted completion.

## Tasks

1. **Recover from a form error:** Open the local preview flow, encounter the
   required-target error, correct it, and reach the review step.
2. **Understand the approval boundary:** Explain what will happen next, then
   explicitly approve the sample intent. Confirm where the result appears.
3. **Find and clear Activity:** Navigate to Activity using the participant's
   preferred input method, inspect the result, clear the log, and confirm the
   empty state.
4. **Recover the service panel:** Find the Service workspace, retry its
   unavailable demo service, and describe the error, loading, and recovery
   feedback.
5. **Discover mobile workspace tabs:** At a narrow phone viewport, find the
   Service tab and navigate to it. Do not instruct the participant to scroll the
   tab row unless they ask for help.

For screen-reader participants, repeat relevant tasks with their normal reading
and navigation commands. For magnification or zoom users, let them choose their
usual magnification and observe reflow and focus visibility.

## Record for each task

- Completed without assistance, completed after assistance, or not completed.
- Time to completion when the participant agrees to timing.
- Wrong turns, repeated actions, lost focus, missed status/error feedback, and
  moderator assistance.
- Participant's explanation of the approval boundary and expected outcome.
- A post-task ease rating from 1 (very difficult) to 5 (very easy), plus comments.
- Any barrier the participant identifies with their input or assistive setup.

Keep observations separate from automated test results. Do not claim accessibility
or usability conformance from a small formative sample. Agree on any release
thresholds with the project owner before treating session findings as a gate.

## Session closeout

Summarize participant count and relevant usage patterns without identifying
participants, task outcomes, recurring barriers, and changes proposed or made.
Clearly mark the protocol unrun until actual sessions occur. Report product
behavior separately from the participant's interpretation of that behavior.
