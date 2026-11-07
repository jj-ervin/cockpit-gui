# Changelog

Notable user-facing changes are recorded here. Entries remain Unreleased. The
repository and package are private; public distribution or publication is not
currently authorized.

## [0.1.5] - Unreleased private candidate

- Add a host-neutral composer interaction layer for token suggestions and local
  attachment selection. The host still owns search, submission, file access and
  command authorization.

## [0.1.4] - Unreleased private candidate

- Add a reusable tabbed Explorer with provider-owned data, accessible tab and tree
  navigation, per-view filter/sort/expansion state, and configurable tab order
  and visibility. ProPro supplies local project data and explicit unavailable
  states for sources it cannot access.

## [0.1.3] - Unreleased private candidate

- Add an optional independent bottom workbench slot with its own visibility, height,
  keyboard/pointer separator and saved layout state. Side conversation stays in place.
- Preserve legacy context-bottom layouts for hosts without a bottom slot and migrate
  saved bottom-docked context to the separate slot when a host adopts it.

## [0.1.2] - Unreleased private candidate

- Let hosts swap the context and explorer side panes, while retaining right and
  bottom docking, resize controls, visibility and saved layouts.

## [0.1.1] - Unreleased private candidate

- Add optional right/bottom context docking, keyboard/pointer resizing, saved
  panel visibility and layout reset to the workbench API.
- Keep host-owned panel content and authorization boundaries intact. No package
  publication, tag, or release is implied.

## [0.1.0] - Unreleased

- Add the CKP-GUI-006 controlled consumer-pilot evidence and repeatable private
  artifact adoption procedure.
- Define merge of the paired library and consumer review PRs as the owner
  acceptance point for tested-scope adoption readiness and maintenance mode.
- Establish the initial supported API for command palette and workspace
  factories, plus the shared stylesheet entry point.
- Add packed-artifact and isolated consumer installation checks.
- Retain the MIT license with the intended copyright notice for Osprey Strategic
  Holdings LLC; repository and package remain private, and public distribution
  or publication is not currently authorized.
- Identify HBL Creative Studios as the development division of Osprey Strategic
  Holdings LLC and record the open source-rights verification gate.
- Define Node.js 22 and later as the supported package tooling/runtime floor.
- Document SemVer, deprecation, host integration and accessibility contracts.
