# Responsive Room 04 viewing correction — 21 November 2026

## Applied changes

The original orthographic fit preserved the full authored width on every screen. At 390 × 844 the opening scene's vertical span increased from 5.05 to 15.34 world units, reducing the chair to about 51 pixels tall. Target-center checks alone did not catch the loss of useful scene detail.

The new shared scene-view module fits the authored height, the available interactive objects, and explicit story details. Narrow screens crop peripheral scenery while keeping touch areas clear of controls and screen edges. The opening chair and suitcase, complete sink window, pool chair and shoes, and final pair of shoes have their own framing bounds. The final camera has a smaller drag range so the window reveal cannot hide the shoes.

The controller now uses the same fitted coordinates for SVG artwork and its overlays, refreshes camera matrices before projecting 3D objects, and follows live local target anchors. Solid scenery blocks pointer hits. New rooms cut to their authored camera behind the existing fade. Container resize, visual viewport resize and device pixel ratio changes refit the scene. Drawing buffers are capped at 2.6 million pixels.

Short landscape screens no longer inherit a 300-pixel scene minimum. Controls and dialogs account for safe-area insets. The photograph and its back fit short viewports. Pointer handling ignores secondary buttons and touches; a dragged or cancelled gesture cannot turn into a click when it returns to its starting point.

The story, nineteen-action route, saved-state format, local assets and static hosting architecture are preserved.

## Verification evidence

- The saved local module bytes passed 31 scene, state and illustrated-view test bodies in the available JavaScript executor, using loaded local modules and an assertion compatibility harness.
- Ten new test cases include 3,040 required-object combinations: nineteen actions × sixteen viewports × five orbit angles × two motion settings. They also check contextual object margins, sequential resizing, notched landscape insets, drawing-buffer size, solid occlusion, moving anchors, the full sink window, pool chair/shoes and ending shoes.
- Existing world checks still cover 190 required-object rays, 30 passage-area rays, geometry/resource disposal, reduced motion and repeated physical prop changes.
- The actual controller layout functions passed an additional 640 scene/viewport/renderer combinations using a minimal browser-interface harness and real Three.js scene geometry. Every current action remained visible, with at least 34 pixels to the screen edge.
- The actual pointer handlers passed twelve checks for ignored secondary input, scene drag limits, dragging back to the origin, cancellation and ordinary visible-object clicks.
- Independent review reproduced and identified the initial ending-shoe crop. After correction, fifteen additional final-view/layout/orbit combinations passed with safe-area insets. Sampled optional fan, tape, cup and chair targets remain stable over time.
- Software raster views were inspected for desktop and phone compositions. The window/pool relationship, opening chair/suitcase and final shoes remain visible.

Viewports: 240 × 320, 280 × 653, 320 × 568, 390 × 844, 430 × 932, 540 × 720, 768 × 1024, 820 × 1180, 1024 × 768, 1440 × 900, 1920 × 1080, 2560 × 1080, 3840 × 2160, 568 × 320, 844 × 390 and 320 × 240.

## Verification limits

The native command `node --test tests/*.test.mjs` cannot start because this host's sandbox fails with `bwrap: No permissions to create a new namespace`. The alternate JavaScript harness is useful evidence for scene math and controller logic; it is not a native Node suite run.

Two unchanged event test bodies could not complete in that alternate executor: “calendar respects explicit offsets and escapes user text” needs TextEncoder, and “external links accept HTTPS and mail but reject executable schemes” needs URL. Those globals are absent in the executor. The other two event/date cases passed. No event code was changed.

A real browser was unavailable for this revision. GPU lighting, shadow quality, browser CSS rendering, actual pointer-event delivery and device frame rate remain unverified. The software raster does not reproduce those effects. The revised code and tests are saved locally; nothing was published.

When a normal terminal and browser are available, run the existing README test commands and preview `dist` over HTTP. Check all four rooms and the photograph dialogs in portrait and short landscape, rotate while an action is pending, and confirm the final shoes remain visible.


## Follow-up: clearer interaction and a message after each object

The user clarified that every object interaction should reveal a thank-you message. The supplied ten-paragraph note is now presented as nineteen ordered segments across the nineteen required actions. Optional props show a relevant full paragraph without consuming a required segment. All supplied words are preserved, and the complete note is also available on the photograph's back.

The current object has a visible outlined marker immediately, with an actionable labelled button below the scene. A thank-you dialog stays open until Continue or dismissal. Continue opens the photograph or full note at their corresponding discoveries; those follow-ups no longer compete with an automatic photo timer. Input is guarded while a message is open. Long messages receive keyboard focus and can be scrolled with the keyboard. The full note has readable paragraph text, a sticky close toolbar and explicit return/photo buttons.

The photo/note shortcut sits in the header, and camera fitting reserves space for the instruction/action cue. The cue and header are observed for size changes, including late web-font loads.

A fresh run after this follow-up passed 38 related test bodies in the JavaScript compatibility harness. This includes tests of all nineteen thank-you messages in order, exact reconstruction of the supplied note, optional interactions, photo/note callbacks, keyboard focus, restart, and fast Continue/dismissal during animated transitions on a 320 × 240 layout. All 640 controller layout combinations were rechecked with the new cue/header bounds: active markers remain clear of both. The existing 3,040 scene/orbit/motion checks also passed. Independent review found the scrolling-message focus issue, which was corrected.

Native Node execution and real browser/WebGL verification remain unavailable in this environment, as described above. The DOM harness verifies controller behavior and timing; it does not verify native browser rendering or input delivery.


## Follow-up: grounded chairs, separated luggage and side messages

The indoor chair's original feet were 2–3 cm above the floor, and its parked pose intersected the desk. Prop grounding now uses precise geometry before instancing. All indoor poses touch the floor, including the tilted/caught pose, and the parked chair leaves roughly 0.64 world units of horizontal clearance from the desk.

The front suitcase was moved left and slightly forward, with the entrance framing updated to retain it. The front chair and suitcase have about 0.135 world units of physical clearance. Regression checks also require a visible projected gap through the camera drag range; independent review checked 77 yaw angles across seven viewport sizes and found at least 5.23 pixels of separation. The illustrated view's parked chair and front suitcase were also repositioned.

Thank-you messages are now non-modal side cards. They do not take focus, open a dialog, require Continue or prevent the next interaction. The latest message replaces the previous one; Dismiss or Escape closes the card. Placement favors an available corner away from the active marker, refreshes while the view is dragged, and switches to a compact sidebar if a large card would cover the next object on a small screen. Full photograph/note inspection remains an explicit choice. The bottom hint/action bar has been removed from HTML, CSS and controller code.

The latest JavaScript compatibility-harness run passed 46 related test bodies, including grounded and non-intersecting props, projected chair/luggage separation, all nineteen messages without dismissal, animated transitions, explicit photo/note inspection, compact cards on short portrait screens and keyboard dismissal/focus restoration. Existing 3,040 scene/orbit/motion checks also passed. Independent review confirmed the non-blocking route across seven viewport sizes and rechecked the final entrance geometry.

The native Node test command still cannot start because of the host's bwrap/user-namespace failure. Browser rendering, native input delivery and GPU lighting remain unverified here; the exact limitations above still apply.


## Follow-up: first-person views and UIT graduation invitation

The 3D renderer now uses perspective cameras at standing, crouching and seated eye heights. Dragging turns the viewing direction around a fixed eye position rather than orbiting around the furniture. Each story step frames its current action and relevant nearby details. Optional objects can remain peripheral instead of forcing the entire room into every view. The sink view looks down onto the lower pool; the ending shoes were moved farther into the yard so the seated viewer sees them through the window above its sill. The four-room route and saved-state format are unchanged.

The supplied graduation portrait replaces the generated photograph, without cropping or altering the source image. Its back contains a brief thank-you and invitation to UIT, with the confirmed details: 13:30, Thursday 26 November 2026, Hội trường A (Tầng 3, Nhà A), Trường ĐH Công nghệ Thông tin. A valid start now appears even when the end time is unknown. Calendar export still requires a valid end time; none was invented.

The user's Google share link could not be resolved in the available web tools. An official UIT Building A image is embedded instead, with a link to its UIT source below the image. The image is remote; the portrait is local. The invitation uses plain typography, with the diagonal paper effects, grain overlay, curled corner and perpetual marker pulse removed. The nineteen original thank-you segments remain intact as non-blocking side cards. The bottom hint bar remains absent.

The saved modules passed 51 related test bodies in the JavaScript compatibility harness: 46 world, state, illustrated, interaction and controller checks, plus five event/date checks. This includes 3,040 required-action/layout/head-turn/motion combinations and 190 unobstructed action rays. Independent review also checked 1,824 combinations of safe-area insets and control clearance. The narrow-card test now supplies its own long message so it continues to exercise compact layout after shortening the invitation.

The native Node runner still cannot start because of this host's bwrap/user-namespace failure. Two unchanged positive calendar/link tests need TextEncoder and URL, which are absent from the alternate executor. A real browser is unavailable, so CSS rendering, native pointer delivery and GPU lighting/shadows remain unverified. No updated site was deployed from this workspace.


## Follow-up: wider views, legible shoes and an open invitation

The perspective field of view is eight degrees wider at the same eye positions. The pool now retains the shoes through both stages, including the turn toward the exit. Shoe framing bounds come from the actual geometry before instancing. The seated ending has a lower window sill and a closer pair of shoes; the cardboard follows the revised sill height. This preserves clear physical sightlines rather than merely fitting an obscured point. At 390 × 844, the projected pair grows from about 35 × 16 pixels to 57 × 30 pixels; at 320 × 240 it grows from about 8 × 4 pixels to 16 × 9 pixels.

The campus image and both requested paragraphs have been removed. The note is now a single open invitation welcoming everyone and their friends. The date and venue stay unchanged, and a clearly labelled Google Maps link uses the campus identifier from UIT's official contact-page map. Required and optional interactions still show thank-you messages independently of the invitation text.

The saved modules passed 52 related test bodies in the alternate JavaScript harness. The shoe regression checks both shoes' full silhouettes, minimum projected size and unobstructed rays across sixteen layouts and three head-turn angles in both pool stages and the ending. Existing checks still cover 3,040 action/layout/turn/motion combinations, grounded chairs, separated luggage and the full non-blocking interaction path. Native Node execution still fails at the host's bwrap/user-namespace boundary; the two unchanged tests needing URL and TextEncoder remain unavailable in the alternate executor. Browser/CSS/WebGL rendering is unverified, and no update was deployed from this workspace.


## Follow-up: invitation styling, clearer circles and enclosed POV edges

The user clarified that the unwanted POV behavior was scenery appearing at the edges. The wider nominal lens has been reverted, and wide layouts now limit nominal horizontal framing to 74 degrees while retaining required objects and shoe bounds. Camera turns are limited to ±0.20 radians outside, ±0.16 inside and ±0.12 in the ending. The rooms now have full ceilings and side walls, replacing the shallow canopy at the back wall. This closes the visible gaps in the scenery while keeping the seated and standing camera positions.

The invitation now uses a white-and-navy layout with a local Fraunces heading, graduation-cap line art, separate date and venue details, and a full-width Google Maps action. Narrow screens stack the details and the close toolbar stays visible while scrolling. The open invitation, portrait, date and venue remain as configured. All available objects now have visible 26-pixel outlined markers. The active circle grows from 22 to 44 pixels, uses white and blue outlines for contrast, and briefly animates twice when it appears. The actual touch area stays 58 pixels, and both device and in-app reduced-motion preferences disable the attention animation.

The saved local modules passed 54 related test bodies in the JavaScript compatibility harness. New regressions catch excessive scenery on wide displays and missing indoor ceilings/side walls. Existing checks cover 3,040 action/layout/turn/motion combinations, both pool stages, ending shoe size and sightlines, grounded props and all nineteen non-blocking thank-you messages. The largest measured geometry count is 66 mesh batches and 16,188 visible triangles before shadows. Native Node execution remains blocked by the host's bwrap failure; the two unchanged URL/TextEncoder-dependent test bodies remain unavailable in the alternate executor. Browser CSS rendering, real input delivery and WebGL lighting remain unverified. No deployment was performed.


## Current version: free exploration and puzzle rewards

The current game replaces the required nineteen-action route with persistent object facts and freely chosen travel. The side path is immediately usable; a rear key unlocks the back door and reveals a separate entrance circle. Tea opens the window reward; its garden has six optional miniatures and a marked water-room route. Water entry sets wet state, the towel dries the visitor, and a new room route appears. A treasure chest reveals the letter on the floor directly in front. Bench repair and letter reading can happen in either order, and every unlocked place remains revisitable. Both 3D and illustrated renderers use the same available actions and flags.

Seven actual CC0 meshes are embedded locally: key, flower, boat, bottle, star, chest and teapot. The native renderer includes complete room surfaces and loose cameras (64-degree nominal vertical view, 88-degree nominal horizontal maximum, generous yaw and vertical looking). Initial framing keeps useful targets and shoes readable; manual looking can move optional targets out of view. It no longer re-fits or recenters each animation frame. Same-room rewards preserve look direction. The invitation's existing portrait, open invitation, date/venue, Maps link and navy-and-white styling remain configured.

The full compatible run passed 90 test bodies against saved files, with no failures. It includes the previous 3,040 geometry/layout/turn/motion combinations; 18 current-world fixtures with 186 action rays; current illustration/controller/state checks; and actual controller-frame tests for vertical looking and fixed projection. A separate integration sweep checked 59 reachable state snapshots and 323 action rays with no missing or obstructed physical action in either renderer. Maximum current geometry is 90 mesh batches and 24,647 visible triangles before shadows. Independent review found and verified fixes for carried-photo inspection, malformed saved locations and focus restoration to hidden cues.

The native command node --test tests/*.test.mjs was invoked but bwrap fails before Node starts. Two unchanged event/link cases additionally depend on URL and TextEncoder unavailable in the alternate executor. Real browser CSS, pointer input, WebGL lighting/shadows and frame rate remain unverified. No deployment was performed. Current source/license details and exact verification notes are in free-exploration-assets.md and free-exploration-progress.md.


## Latest correction: simple permanent rooms and a small tabletop box

The bathroom, wet/towel task, chair movement, tap task and bench/cardboard repair are removed from the current game. Tea/window and standing/seated table poses now share permanent room geometry. Returns use existing entrances or a step-back/stand-up cue, with no new return-only doors. The box is reduced to 0.32 world units on the table and becomes interactive only while seated. Opening it reveals the letter on the same tabletop in front. The letter has one physical circle; its back remains accessible through the portrait dialog.

Interaction text is now one short centered result line that fades after 2.4 seconds. Side cards and thank-you additions are removed. Markers use hollow light outlines with transparent centers and no dot, leaving object details visible. Same-room pose moves preserve actual camera state during discoveries; illustrated-to-3D switching restores the current authored viewpoint.

Saved modules passed 99 compatibility test bodies. Current 3D checks cover 14 views and 126 target rays, full layout equality across poses, original return openings, readable shoes, static furniture and resource disposal. A real state-to-renderer route additionally checked 29 snapshots and 130 rays. Current maximum is 108 mesh batches and 26,009 triangles before shadows. A fresh review found the stale-camera mode-switch edge, which now has a failing/passing regression and was independently re-confirmed fixed.

Native Node still cannot start at the host's bwrap boundary. Two unchanged positive event/link checks need URL/TextEncoder unavailable in the alternate executor. Browser rendering, pointer delivery and WebGL lighting/shadows remain unverified. No deployment was performed. See simple-room-progress.md for the final contract and evidence.
