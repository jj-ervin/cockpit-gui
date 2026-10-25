# CKP-GUI-006 — Controlled consumer pilot and adoption readiness

Status: review candidate. The paired library and consumer PRs must pass hosted
checks and be accepted by the owner before this milestone closes. No PR is
merged automatically.

## Pilot decision

`jj-ervin/cockpit-web` was inspected before selection. At baseline commit
`6e4af4ae4bfa58ee3b9912dad0ceb3d3e795794d`, current `main` contained only a
13-byte README. Earlier Git-history experiments had been reverted as
unauthorized cross-repository coupling and were not treated as current source.

The controlled pilot creates one bounded, real read-only workflow: Cockpit Web
loads a host-owned status snapshot and presents overview, service, and known-
limitations panels through `@cockpit/gui/workspace`. It exposes a deterministic
service failure and retry path so recovery is observable. Cockpit Web owns the
HTTP server, status data, failure/retry policy, and application state. Cockpit
GUI owns workspace presentation and navigation only.

## Private distribution

- Identity: `@cockpit/gui@0.1.0`.
- Source: merged CKP-GUI-005 `main` commit
  `52de37f682b84191775b9e72f4b4057d730709cd`.
- Artifact: `cockpit-gui-0.1.0.tgz`, 11,343 bytes.
- SHA-256:
  `9f00f43af769c8e777220563097b91bcca9338a7e37f10842962140b9a964dd2`.
- npm SHA-1: `f5336286137aec5009f6cef23d8ab986b56ee177`.
- npm SHA-512 integrity is pinned in the consumer lockfile.

The versioned tarball is stored in the private consumer repository. The
consumer depends on `file:vendor/cockpit-gui-0.1.0.tgz` and clean installation
uses `npm ci`. This is an immutable, integrity-checked pilot distribution
method. It is not public npm publication, a Git dependency, a sibling source
import, an unpacked copy, or `npm link`. The package retains its MIT license and
notice.

The exact repeatable procedure and rollback are documented in the consumer at
`docs/ADOPT-COCKPIT-GUI.md`.

## Acceptance gates

| Gate | Candidate evidence | Result before owner acceptance |
| --- | --- | --- |
| Private package consumption | Versioned private tarball; SHA-256 test and npm lock integrity; package remains `private: true`. | pass locally |
| Real integration | Independent Cockpit Web status workflow renders the supported workspace export in Chromium. | pass locally |
| Repository independence | Separate Git roots/remotes; no sibling path, source import, Git dependency, or runtime source dependency. | pass locally |
| Host-owned authority | Consumer owns service/data/retry state; pilot is read-only; GUI has no execution, authorization, persistence, or provider authority. | pass locally |
| Passing tests | Library regression plus consumer unit/browser/axe/keyboard/responsive/recovery checks. | pass locally; hosted pending |
| Rollback | Baseline `cockpit-web/main` archives to a README-only tree; revert restores that state without registry/provider/data changes. | pass locally |
| Repeatable documentation | Artifact creation, digests, install, supported exports, verification, upgrade and rollback steps recorded. | pass locally |
| Accepted limitations | Private pilot only; chain of title, human/AT/device tests, public distribution and broader adoption remain excluded. | owner acceptance pending |

## Validation evidence

Library baseline at source commit `52de37f`:

- `npm ci`: passed, zero reported vulnerabilities.
- `npm test`: 10 passed.
- `npm run test:package`: 1 passed; actual tarball installed offline.

Consumer candidate:

- Consumer commit: `b78adb3ec6baa0cea19970f6a7a6d0a7f7b284e3`.
- `npm test`: 4 passed (artifact digest/identity, supported exports, status
  boundary, deterministic failure, static-asset allowlist).
- `npm run test:browser`: 2 passed in Chromium. The workflow covers status
  load, tab keyboard Home/End navigation, error announcement, retry recovery,
  390 x 844 responsive containment, and axe audits in initial/error/recovered
  states with zero reported violations.
- Clean copied checkout: `npm ci --ignore-scripts` and `npm test` passed.
- `npm audit --omit=dev`: zero vulnerabilities reported.
- Rollback archive from consumer `main`: README only; no package or runtime
  files remained.

Hosted evidence at the implementation/documentation heads:

- Cockpit Web commit `b78adb3ec6baa0cea19970f6a7a6d0a7f7b284e3`:
  [run 40180985746](https://github.com/jj-ervin/cockpit-web/actions/runs/40180985746)
  passed Node 22, Node 24, and Chromium jobs.
- Cockpit GUI commit `e12871e83850703f017033ffe29277f90d226745`:
  [browser run 40180988847](https://github.com/jj-ervin/cockpit-gui/actions/runs/40180988847)
  passed Chromium, Firefox, and WebKit jobs; [package/unit run
  40180988872](https://github.com/jj-ervin/cockpit-gui/actions/runs/40180988872)
  passed Node 22 and Node 24 jobs.

## Known limitations

- The artifact-in-consumer method is appropriate for this controlled private
  pilot, not a decision to establish an organization-wide binary repository.
- Only the workspace and stylesheet exports are consumed. This pilot does not
  validate the command-palette API in an independent application.
- Chromium is the consumer browser gate. Library regression coverage remains
  responsible for Chromium, Firefox, and WebKit compatibility of the package.
- The workflow is read-only and in-memory. It does not test provider execution,
  authentication, authorization, durable persistence, service mutation,
  secrets, or multi-user behavior.
- Automated browser and axe results are not WCAG certification or evidence of
  human usability, screen-reader, native high-contrast, native zoom, physical
  touch, or assistive-technology interoperability.
- CKP-GUI-005's unverified company chain-of-title limitation remains. This
  private transfer between owner-controlled repositories does not establish or
  broaden public distribution rights.

## Acceptance and maintenance transition

The owner approval point is merge approval for both focused PRs after required
hosted checks pass. On that acceptance, Cockpit GUI v0.1.0 is adoption-ready
only for the tested private tarball/workspace scope above and the project enters
maintenance mode.

Maintenance mode permits compatible fixes, security/dependency upkeep,
documentation corrections, and evidence-backed consumer issues. It does not
authorize CKP-GUI-007, a package-registry program, public npm publication,
automatic migration of other applications, architectural refactoring, or a
new infrastructure roadmap.
