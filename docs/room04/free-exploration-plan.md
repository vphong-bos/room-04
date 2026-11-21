# Free exploration and discovery rewards

Historical plan: superseded by [simple-room-flow.md](simple-room-flow.md).

## Intent and confirmed choices
Replace the forced nineteen-action progression with independent object interactions and persistent puzzle rewards. The key found behind the house unlocks the BACK door (confirmed by the user). Visitors may revisit unlocked areas. Update both 3D and illustrated scenes. Keep the graduation portrait, open invitation, 26 November 2026 at 13:30, UIT Hall A on floor 3 of Building A, Google Maps link, non-modal thank-you side cards, clear circles, and no bottom hint bar.

The camera must be looser again: wider nominal view, generous horizontal and vertical looking, and manual navigation through marked routes. Keep the complete ceilings/side walls. Do not continually recenter the view while the visitor looks around.

## Puzzle and place design
- front: the front door stays locked. The side path is available immediately; trying the door is optional. Chair and hose remain optional interactions.
- back: a visible small key can be picked up. With the key, clicking the back door opens it and reveals a distinct enterhouse circle. Entering is the visitor's choice. A returnfront route stays available.
- tea: chair, tap, fan, tape, cup/teapot can be used in any order. tea makes a real cup of amber tea with steam. This opens the window and reveals its circle. outside returns to the unlocked back door.
- window: a beautiful window discovery with a deterministic scatter of tiny collectible-style objects (flowers, duck, boat, jars, windmill, stars). Optional objects can be inspected in any order. A marked left route leads to the bath/pool. returntea returns to tea. Seeing the window unlocks the left route in tea too.
- bath: entering the water makes the visitor wet. Show a light wet effect/status. towel dries the visitor and visibly opens the room route. Fish, plants and cup remain optional. returntea goes back. The treasure-room route requires being dry; re-entering the water makes the visitor wet again.
- treasure: an openable treasure chest sits directly behind a dropped letter/photograph. Opening the chest drops/reveals the letter in front. The chest, cardboard and bench can be investigated freely. photo reveals the supplied portrait, turnphoto reveals the invitation. cardboard then fold fixes the bench; sit can enter the familiar seated shoe view once the bench is fixed, before or after reading the invitation. Completion records reading and sitting in either order. Before fixing it, sitting only wobbles. bath returns to the previous room.
- ending: keep the readable outside shoes and accessible portrait/invitation. returnroom allows continued exploration.

Only genuine world prerequisites are enforced. No action counter gates unrelated objects. Rewards use physical state changes, circle markers and brief nonblocking messages, never an automatic modal or forced scene transition.

## Shared implementation interface
Add dist/exploration-state.mjs. Its named exports match initialState, getView, act, serialize, restore. Keep dist/game-state.mjs as the previous-version validator/legacy test fixture and migration source.
State shape: {version:3, location, facts:[], memories:[], wet:false, letterFound:false}. locations: front, back, tea, window, bath, treasure, ending.
Facts: key, backdoor, tea, window, dry, chest, photo, writing, cardboard, folded, seated, chair, tap.
getView(state) supplies:
- freeExploration:true, location, chapter (front/back=0; tea/window=1; bath=2; treasure/ending=3)
- flags: a boolean object with the fact names above
- availableActions:string[], highlightActions:string[], focusAction:string, activeAction:'' (no forced next action)
- wet, photoFound, writingFound, letterFound, caption, phase, inspectionActions (owned portrait controls available from any place)
- step is PRESENTATIONAL compatibility only: front 0; back 2; tea 2; window 6; bath dry?1:0; treasure flags.photo?2:0; ending 6.
3D and illustrated renderers must use flags, location, availableActions for the free version and retain existing legacy geometry behavior when freeExploration is absent.
Actions:
front: frontdoor, sidepath, chair, hose.
back: returnfront, backdoor, key (until taken), enterhouse (after door opens).
tea: tea, cup, chair, tap, fan, tape, pattern, window (after tea), left (after window visited), outside.
window: returntea, left, duck, flower, boat, jar, windmill, star.
bath: towel, fish, plates, cup, returntea, room (after first drying; disabled/feedback if wet).
treasure: chest, cardboard (until taken), fold (after cardboard until fixed), sit, photo (after chest), turnphoto (after photo), bath.
ending: photo, turnphoto, cup, returnroom.
act returns {state,changed,sound,feedback,reward,opened:[]}. opened names newly revealed actions. Unknown or unavailable actions cannot mutate state.
All routes and flags persist on backtracking and restore. Strictly validate saves. Old legitimate v2 saves can migrate to equivalent unlocked areas; malformed saves reset safely.

## Ownership and tasks
1. Root: state engine and meaningful tests of alternate orders, gating, rewards, repeated actions, wet/dry, backtracking, save round trips and invalid inputs. Update interaction labels/messages and app controller to use availableActions and highlightActions. Preserve focus and nonblocking messages; room changes fade, same-room rewards keep the view direction. Add wet status/effect. Loosen camera yaw and add vertical look; fit the initial framing without undoing head turns each frame.
2. 3D agent: owns only dist/world.mjs and optional new dist/discovery-props.mjs, plus tests/free-world.test.mjs. Add real key, locked/open back door, enterhouse marker, tea/steam, window discovery, wet/dry towel state, chest and letter in front. Render only available action targets. Preserve grounded chair/luggage separation and complete room surfaces. Fixed person-height cameras per place, default fov 64 and maxHorizontalFov 88; yaw limit .65 outside/.55 inside/.32 ending, pitch limit .28. No required import of external assets until research returns.
3. Illustrated agent: owns only dist/fallback.mjs and tests/free-fallback.test.mjs. Both the picture and targets must faithfully represent the same places, flags, locked/unlocked rewards, tea, window trinkets, wet/dry state, key and chest/letter layout. Preserve existing legacy exports for old geometry checks.
4. Asset researcher: independently search Sketchfab and compatible sources for legally reusable low-poly key, tea set, chest and tiny props. Prefer downloadable CC0/CC BY models. Try actual accessible text OBJ/glTF or connector file content, not scraped viewer internals. Own only dist/model-assets.mjs and docs/room04/free-exploration-assets.md if needed. Return exact URLs, creator/license, actual accessibility and integration guidance; never claim reference previews are imported meshes.
5. Root integrates all work, updates Sources/credits, README and tests, then requests a fresh review and completes fixes.

## Verification
Keep the native command node --test tests/*.test.mjs as the canonical suite. This host currently fails at bwrap before Node starts; use the existing pure-JavaScript compatibility harness with actual saved module bytes and the vendored Three module, and report that limit. Browser preview is unavailable; do not claim visual WebGL or native pointer verification.
Test exploration state with many legal orders, every newly exposed route, repeat actions and revisits. Exercise controller progression without dismissing cards, explicit-only portrait/invitation dialogs, restored progress and restart. New geometry checks cover visible interactive targets in each place, both shoe views, grounded chest/key/letter, and responsive framing in portrait, desktop and short landscape. Retain useful legacy geometry/resource checks. Run the complete compatible suite after integration.

## Rulings
The user supplied concrete gameplay changes and confirmed the only unclear route; continue implementation under that authorization. No design approval pause is required. This workspace has no Git metadata and native commands cannot start, so preserve the supplied checkout and keep a file ledger instead of worktrees/commits.

Final ruling: carried portrait inspection is independent of physical room markers. Reading it may complete the invitation discovery in any previously unlocked room. Focus restoration chooses a visible enabled object rather than recentering the camera or attempting to focus a hidden cue.
