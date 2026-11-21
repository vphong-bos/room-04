# Simplified rooms and tabletop invitation

## User changes
Remove the bathroom/wet/towel room, moving-chair action, tap action, and all bench/cardboard repair. Use a smaller chest on the table; opening/inspecting the chest requires sitting at that table. Return travel must use the same existing door. Rooms must not rearrange when looking at a window, sitting or returning. Replace side cards/thank-you messages with one short centered line that fades automatically. Keep the portrait, open graduation invitation, event details, map link, looser looking and clearly visible circles.

## Layout contract
There are two interior physical rooms: tea and table. locations tea/window are standing and close-window views of the SAME tea geometry. locations treasure/ending are standing and seated views of the SAME table geometry. Camera position/aim may change; windows, doors, table, chest, chairs and permanent props must not change positions. State changes may open an existing door/shutter or chest and reveal the letter.
- front/back: keep the locked front door, immediate side path and rear key/back-door puzzle. Front chair is a static prop without a circle.
- tea/window: use the existing tea-room openings in BOTH views: hall at x=-2.72,z=-1.65; outside/back-door passage at x=-1.06,z=-1.65; window centered x=1.76,z=-1.65. No new door for returntea. returntea in window view means stepping back from the same window, anchored to its frame/sill (or a floor/step cue), never to a new doorway. Tea opens the window; looking at it opens the existing hall door to the table room. Tiny garden objects remain optional and may appear along the sill/outside garden. Keep tea props, static chair and sink; no chair or tap action/animation.
- treasure/ending: use one table-room opening layout in BOTH views: window centered x=.32,z=-1.73 and original arrival/return doorway x=-2.85,z=-1.63. Keep table, chair/bench, mug and box positions fixed. No new right-hand return door after sitting.
- Table at x=-.43,z=.06, tabletop y=.778 is a useful canonical reference. Chest is always visible ON TOP at about 0.30–0.34 longest dimension. Opening it after sitting reveals the letter on the same tabletop in front of the box. No floor chest, floor letter, cardboard, shim, or wobbling repair.
- returnroom in seated view means Stand up at the same table; it is a chair/table-edge cue, not a doorway. returntea always uses the original arrival doorway. Shoes outside stay visible/readable from the seated view.

## State contract
Root replaces exploration-state with version 4, shape {version:4,location,facts:[],memories:[],letterFound:false}. No wet field.
Locations: front, back, tea, window, treasure, ending.
Facts/flags: key,backdoor,tea,window,seated,chest,photo,writing.
getView keeps freeExploration:true, location, chapter, step, flags, availableActions, highlightActions, focusAction, activeAction:'', photoFound,writingFound,letterFound,inspectionActions,discoveries. Add room ('front','back','tea','table') and pose ('standing','window','seated') for stable-layout checks.
Physical actions:
front: frontdoor,sidepath,hose.
back: returnfront,backdoor,key until taken,enterhouse after backdoor open.
tea: tea,cup,fan,tape,pattern,outside; window after tea; left after window visited.
window: returntea,duck,flower,boat,jar,windmill,star. No additional doorway in this pose.
treasure (standing at table): sit,returntea; photo after chest opens. No chest action until currently seated.
ending (seated at same table): returnroom,returntea,chest,cup; photo after chest.
left from tea leads DIRECTLY to treasure. returntea from treasure/ending leads to tea through the original doorway. returntea from window just steps back into the same tea room. sit goes to ending (seated pose); returnroom stands in treasure.
Carried photo/turnphoto inspection remains available from other rooms after discovery. The letter has one physical photo circle; its back is read with the explicit portrait-dialog button.
Migrate valid v3 bathroom saves to the standing table room and remove obsolete facts. Old chest/photo progress may grandfather seated history, but physical chest remains usable only while seated. Validate saves strictly. Legacy v2 saves still migrate.

## Messages
No thank-you text in interaction feedback. A single short result line (about 2–7 words, max roughly 45 characters) appears at screen center, pointer-events:none, then fades after about 2.4 seconds. No side card, dismiss button, reward title stack, or bottom hint bar. New messages cancel old timers. Explicit portrait/invitation inspection stays a dialog.
Examples: Key found. / The back door opens. / Tea is ready. Look outside. / The hallway is open. / Take a seat. / The box opens. / An invitation for you.
Circles must be hollow/light with no dark interior fill, no center dot and no opaque halo over the object. Keep reduced-motion preferences. A hidden live announcer can announce the result while the visual line is aria-hidden to avoid duplicate speech.

## Ownership and checks
- Root owns exploration-state.mjs, app.mjs, interaction.mjs, index.html, style.css, tests/exploration-state.test.mjs, tests/interaction-flow.test.mjs, tests/app-harness.mjs, docs/README.
- Native agent owns ONLY discovery-props.mjs (and world.mjs if needed) plus tests/free-world.test.mjs. Share real room composers across tea/window and treasure/ending; physical layout invariance must be tested. Preserve legacy buildWorld behavior and grounded furniture/props. Existing CC0 asset factory remains available.
- Illustrated agent owns ONLY fallback.mjs and tests/free-fallback.test.mjs. Match the same room topology, actions and fixed furniture/chest coordinates. Use same room artwork for alternate poses, zoom/crop/viewpoint cues as needed, and no return-only doors.
- Root integrates, runs all compatible tests, actual reachable-state geometry checks and a fresh review. Native Node/browser remain unavailable on this host; use saved module bytes and the existing JS compatibility runner with vendored Three and report limits.

## Ruling
The user explicitly requested these concrete changes. Continue implementation without an approval pause. Natural puzzle prerequisites remain; optional objects do not gate travel. The simplified room layout supersedes the earlier free-exploration plan.
