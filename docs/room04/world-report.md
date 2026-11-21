# Room 04 world

`dist/world.mjs` builds six original Three.js dioramas from local primitive geometry. The chapter and step determine the composition, projected interaction anchors, object positions, weather, and chair clues. The rear entrance has its own view, narrow canopy, kitchen crate, and open door. Shared primitive geometry and instance colors keep the scenes compact. Reduced motion freezes movement while preserving all clues.

`tests/world.test.mjs` walks the actual state machine through all 29 views. Run `node --test tests/world.test.mjs` from the project root. Both tests pass with the vendored Three.js 0.160.1. Across five viewport sizes, 280 raycasts hit the required object's visible surface first. All optional and required anchors remain at least 22 pixels from an edge. The minimum required-anchor margin is 83.8 pixels at 320 × 568 and 102.2 pixels at 390 × 844. The nearest optional anchor to a required one on those phones is the front door beside the chair, at 20.2 and 24.7 pixels respectively. The interaction layer gives the current object priority.

The most complex view has 54 opaque geometry batches. The highest triangle count in a view is 26,892 before shadow passes and browser texture labels. The tests also verify stationary reduced motion and disposal of rendered geometry, instancing buffers, materials, and canvas label textures.

An in-memory CPU projection checked composition in twelve representative views, including each chapter, the rear entrance, corridor, balcony, and tea-table reveal. The test browser's WebGL renderer was disabled, so GPU lighting and shadows remain unverified there. The scenes use original geometry. The credit drawer separately identifies the supplied Sketchfab references.
