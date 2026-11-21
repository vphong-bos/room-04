# Simplified room flow

Plan: simple-room-flow.md. This contract supersedes free-exploration-plan.md.

- State and migration: complete. Version 4 removes bathroom/wet/towel, chair/tap tasks and repairs. The original hall leads directly from tea to the table. The chest is available only while currently seated. Valid v2/v3 saves migrate to v4; former bathroom saves resume at the standing table.
- Native rooms: complete. Tea/window and table/seated use identical permanent geometry for equal facts. Canonical openings and furniture stay fixed. Return cues use the existing doorway, window frame or table edge. No return-only doors.
- Tabletop box: complete. The box is 0.32 world units at x=.31,y=.778 on the table; the letter appears on the tabletop in front. The placement preserves the outside-shoe sightline. Furniture is static and the bench has equal legs.
- Illustrated rooms: complete. Alternate poses apply a camera transform to identical shared room artwork and matching targets. Chest is fixed at canonical (666,466), letter at (666,535); arrival and seat/stand anchors stay fixed.
- Feedback and circles: complete. One short centered result line fades automatically after 2.4 seconds, without focus/input capture. Old message cards, thanks injection and wet UI are removed. Circles have transparent interiors, thin light outlines and no center dot. The physical letter has one circle.
- Camera and renderer behavior: complete. Same-room pose moves are separate from physical room travel. Discoveries preserve in-flight eye/look values. Paper-to-3D switching cuts to the current authored viewpoint instead of retaining a stale previous room.
- Full saved-byte compatibility verification: 99 passed, 0 failed.
- Fresh independent review: complete; no outstanding important findings after the illustrated-to-3D camera fix.

## Evidence

State/controller: removal/gating, direct hallway route, carried invitation, migration, timed single-line replacement, restart, same-room pose timing, visible focus and ResizeObserver startup.
Native geometry: 14 current view fixtures, 126 unobstructed target rays, stable complete room geometry across poses, small grounded tabletop box and letter, static chairs, original return door, responsive framing and readable shoes.
Current geometry maximum: 108 mesh batches / 26,009 visible triangles before shadows.
Illustration: 11 current checks plus 6 historical checks; identical physical room artwork across poses and exact parity for 20 old fixtures.
Integrated route: 29 reachable snapshots, 130 unobstructed action rays and no physical action missing from either renderer.
Legacy framing/resource coverage: 20 historical views, 190 action rays, 3,040 layout/turn/motion combinations.
Review probes: 1,866 canonical v4 states round-tripped; 787 accepted v3 states and 38 valid v2 snapshots migrated into valid v4 saves. The reviewer checked 32 reachable visual states for target visibility/reachability on six screens.

## Regressions caught and fixed

- Removing the card left ResizeObserver.observe(null). A browser-capability controller check failed first and passes after removing the stale reference.
- A discovery during an unfinished seated move reset the camera. Real Three drawView tests now require preservation of both actual eye and actual look.
- Keeping that eye unconditionally retained an old exterior camera after illustrated travel. Retention now requires a previous native world; the current authored camera is installed after paper mode.

## Limits

The native command node --test tests/*.test.mjs was invoked but bwrap fails before Node starts. Two unchanged positive calendar/link tests need URL/TextEncoder globals unavailable in the alternate executor. Native browser CSS, pointer delivery, WebGL lighting/shadows and frame rate remain unverified. No deployment was performed.
