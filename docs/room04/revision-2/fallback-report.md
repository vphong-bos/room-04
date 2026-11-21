# Room 04 SVG fallback

The fallback now renders the four current story locations across 20 views. It returns the inline SVG and matching object anchors in a 1200 × 800 viewBox. It uses the existing state and controller interfaces. All 19 route actions have one active anchor inside the brief’s mobile-safe region.

- The exterior uses a cropped one-story house, muted green roof, concrete apron, hose and flattened side grass. The front door opens against the second chair. The repainted back door reveals 04.
- The passage includes the wall fan with a bottle cap on its pull cord, a near-empty desk, pale-green paint band and tile joints. The chair catches and then moves aside. The door shuts, the cup reaches the sink, and the faucet progresses through running water, two kinds of drips and a stopped tap. The sink window lights up over the pool and the left corridor brightens on the next action.
- The pool scene keeps the chair’s small scratch visible above the folded towel. The transferred towel clears the chair and opens the next room. Still potted plants sit on mismatched plates, including the same blue fish motif as the sink. A cropped hand carries the cup over the shallow water.
- The table scene has chairs on three sides and a short-legged bench on the fourth. The photograph starts under the bench, then moves to the table as the player finds and turns it. The cardboard moves from the sill to the bench and changes through both folds. The final lower viewpoint holds the photograph and cup against the window, with the shoes’ toes pointing toward the house. The photograph is still an inspectable object.

The scene uses a simple drawn photograph at room scale. The main photograph and its handwritten reverse remain the controller’s dialog content. Embedded CSS limits motion to the fan, drips, water highlights and unstable bench, and respects both the app’s motion toggle and system preference.

## Verification

- `node --test tests/fallback.test.mjs` passes six tests. The tests walk the real state machine through all 20 views and check all 19 active anchors, object availability, the exterior number, repeated state changes, towel movement and final photograph inspection.
- All 20 SVGs were rendered through Inkscape and visually inspected in a contact sheet. Selected room and ending views were rendered at a larger size after refinements. Inkscape produces static previews and does not exercise browser animation or touch input.
