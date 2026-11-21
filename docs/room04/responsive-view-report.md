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
