# Room 04 world revision

The local Three.js world now follows the current four-room story through nineteen actions. The rooms use the existing camera, target, update and disposal API. The photograph on the table is a small geometric print. The controller displays the generated photograph and its writing when the visitor inspects it.

The front and rear doorways are real openings. The blue chair keeps its pale scratch by the pool. The passage chair catches at an angle, then clears the doorway as the door closes. Each tap turn rotates the handle and reduces the water. The corridor window looks into a separate lower tiled basin with a towel over its rail. The level left passage leads into shallow water.

The folded towel moves off the seat. The fish is painted on the front of a saucer beneath a plant and partly hidden by the vessel at the sink. In the final room, three chairs face the table and a narrow bench occupies its fourth side. The print protrudes from beneath the short bench leg. After the first fold the bench still rocks. After the second, the layered shim holds it steady. The seated view places the photograph beside the cup and frames the pair of shoes beyond the sill, toes toward the house.

## Checks

On the local vendored Three.js module, `node --test tests/world.test.mjs` passes five tests. The journey covers all twenty views and nineteen required actions. Each active anchor hits its visible object under both motion settings at 320 × 568, 390 × 844, 768 × 1024, 1440 × 900 and 844 × 390. All 190 required rays passed. The smallest active-anchor margin was 37.1 pixels. An additional 30 passage-area rays confirm that clicking through either open doorway follows it. At most 66 mesh batches and 16,140 triangles were present in one view before shadow passes.

The remaining checks cover material, geometry, instance and painted-number texture disposal, reduced motion for the fan, droplets and bench, the stable repaired bench, and physical changes during repeated pushes, turns and folds. A software raster pass helped check framing, the lower pool sightline and the arrangement of the shoes. The preview browser has WebGL disabled. GPU lighting, shadow-map quality, tone mapping and device frame rate remain unverified.
