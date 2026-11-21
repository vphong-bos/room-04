# Room 04 Photograph Revision Implementation Plan

> For agentic workers: use subagent-driven-development for independent bounded modules; source folder is the existing isolated, non-Git project. No commits/push until authorized remote authentication is present.

Goal: follow the latest house/chair/cup/pool/bench script, ending after two cardboard folds and a quiet sit.
Architecture: preserve controller and pure state interfaces; replace scene implementations and the letter discovery surface. Local Three.js and SVG views share one state.
Tech stack: HTML, CSS, native ES modules, Three.js 0.160.1, Python stdlib hosting.
Spec: docs/room04/revision-2/design.md.

## Global constraints
- Four scenes, ordered actions exactly as in the design table; state version 2.
- No visible instruction paragraphs, chapter counter or quest list.
- Back door required; front-door action cannot enter the house.
- Writing only revealed after photograph front is found and turned.
- Browser fallback must complete the same story, with mobile/keyboard support.
- No added runtime dependency, host change or falsely claimed Sketchfab mesh download.

## Tasks
- [x] State: update game-state.mjs and state tests for exact action order, version reset, mandatory photo memory, out-of-order actions, optional clues and final reveal.
- [x] 3D: rebuild world.mjs and world tests for four scenes, safe target projections, visible prop changes, stationary reduced motion and disposal.
- [x] Integration/art: rebuild the SVG fallback, add photograph front/back dialogs and atmospheric audio, revise styling/config/story/docs; preserve existing event and publisher protections.
- [x] Review: bounded independent source review of revised story/render/controller interactions; address concrete blockers.
- [x] Verify: full desktop and 320 × 568 browser routes, saved-progress reload, keyboard focus, reduced motion, and automated checks.
- [x] Package: source, assets, tests, documentation and the existing GitHub Pages publisher are included in the replacement archive.

## Review focus
Old saved endings must not reveal the new writing. Closing photo before flipping must permit reopening. Restart must cancel pending photo/letter timers. Cropped composition must not crop active touch targets. WebGL failure must retain a fully playable route. Print must remain gated.
