# Free exploration implementation ledger

Plan: free-exploration-plan.md

- State engine and tests: complete. Version 3 uses locations and independent persistent facts. Side path is immediately available; back key opens the back door. Natural prerequisites replace the old action queue.
- 3D rewards and locations: complete. Seven exploration views, physical key/door/tea/window/towel/chest/letter rewards, all available action targets, complete room surfaces and looser fixed-eye cameras.
- Illustrated rewards and locations: complete. Matching seven scenes and reward states, distinct circles/anchors, wet/dry footprints, open shutters, and letter in front of chest. All 20 previous illustration fixtures retain exact output.
- Additional models: complete. Seven actual locally embedded CC0 meshes, 2,857 triangles; pinned source/license records in free-exploration-assets.md. The original Sketchfab entries stay labelled as references.
- Controller, camera and wet/dry UI: complete. Multiple useful objects can be highlighted. Same-room rewards keep looking direction and do not fade or force travel. Horizontal/vertical drag and arrow keys look around; Home faces forward. Wet/dry/key status and static water-edge effect accompany side messages.
- Integration and full compatible checks: complete. 90 test bodies pass against saved modules and actual vendored Three. Native Node was invoked and fails before execution at bwrap namespace creation.
- Final independent review: complete. All three reproducible review findings were fixed with failing/passing regressions and re-confirmed against saved files.

## Evidence

Latest integrated compatibility result: 90 passed, 0 failed.
Legacy geometry: 20 views, 190 unobstructed action rays, 3,040 action/layout/turn/motion combinations.
Current 3D: 18 handmade view fixtures, 186 unobstructed action rays; max 90 mesh batches / 24,647 triangles before shadows.
Actual state-to-scene integration: 59 reachable snapshots and 323 unobstructed action rays. No available physical action is missing from either renderer.
Illustration: 17 free fixtures, responsive target framing, balanced SVG output, and exact previous-view parity.
Controller: non-blocking rewards, distinct entry circles, explicit portrait/invitation, wet/dry revisits, same-place look preservation, animated travel guarding, carried letter inspection and visible focus restoration.
Actual animation-frame regressions verify vertical look changes the view and no per-frame fit undoes manual looking.

## Review fixes

1. A carried portrait could be opened in another room but could not be turned over. Owned photo/turnphoto inspection is now valid globally, without adding unrelated physical markers.
2. A non-string saved location could coerce to a valid property but yield zero actions. Non-string locations now reset safely before property lookup.
3. Focus restoration could choose a hidden primary cue after looking around. It now chooses the visible previous object, visible main cue, another visible object, then a visible header/settings control.

## Rulings and limits

Use the provided checkout and the JavaScript compatibility runner because Git metadata and native execution are unavailable. The key unlocks the back door, as confirmed by the user. Camera freedom takes precedence over keeping every optional object in frame during manual looking.

Bench repair/sitting may precede letter discovery. Reading plus sitting in either order records completion; the visitor can keep exploring afterwards.

Two unchanged positive calendar/link tests need URL/TextEncoder globals absent from the alternate executor and could not run there. The native Node suite cannot start at all on this host. Browser CSS rendering, native pointer delivery, GPU lighting/shadows and device frame rate are unverified. No deployment was performed.
