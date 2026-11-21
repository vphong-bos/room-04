# Room 04 asset sources

The seven model pages and their public [Sketchfab Data API](https://sketchfab.com/developers/data-api/v3) records agree on the title, creator, and [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/) license. Each local preview is the unmodified 720 × 405 JPEG linked from its model record. The credits manifest in `dist/model-sources.mjs` provides each creator, profile, model, license, and relative preview path.

| Local file in `dist/assets/models/` | Official model and creator | Data API | Bytes |
| --- | --- | --- | ---: |
| `house.jpg` | [Dreamcore House](https://sketchfab.com/3d-models/dreamcore-house-ed671fbe04ac458cb04e3c2e76b380e4) by [MrEffect](https://sketchfab.com/MrEffectDev) | [Metadata](https://api.sketchfab.com/v3/models/ed671fbe04ac458cb04e3c2e76b380e4) | 14,159 |
| `landscape.jpg` | [Dreamcore liminal space](https://sketchfab.com/3d-models/dreamcore-liminal-space-875b0005014d4b42bf1e9b2ff53ed4c4) by [CatLoveCheese](https://sketchfab.com/CatLoveCheese) | [Metadata](https://api.sketchfab.com/v3/models/875b0005014d4b42bf1e9b2ff53ed4c4) | 24,825 |
| `pool.jpg` | [Poolcore Level 37](https://sketchfab.com/3d-models/poolcore-level-37-c6fb62d1182c45518a8d8ebbd18c9687) by [CatLoveCheese](https://sketchfab.com/CatLoveCheese) | [Metadata](https://api.sketchfab.com/v3/models/c6fb62d1182c45518a8d8ebbd18c9687) | 40,657 |
| `suitcase.jpg` | [Old Suitcase // Game Ready](https://sketchfab.com/3d-models/old-suitcase-game-ready-1c927d3999e643bcaba078f03b7b2ee7) by [Alex Murias (@Xlay3D)](https://sketchfab.com/Xlay3D) | [Metadata](https://api.sketchfab.com/v3/models/1c927d3999e643bcaba078f03b7b2ee7) | 33,926 |
| `pot.jpg` | [Stylized Flower Pot](https://sketchfab.com/3d-models/stylized-flower-pot-458ac3558d0846c6bde75d5b6c343de6) by [Nirvana Studio](https://sketchfab.com/nirvanastudio), modeled and textured by pr1me_3d | [Metadata](https://api.sketchfab.com/v3/models/458ac3558d0846c6bde75d5b6c343de6) | 20,113 |
| `chair.jpg` | [Low Poly Chair](https://sketchfab.com/3d-models/low-poly-chair-abe2261ecf8940399af382ada5d142f7) by [nicode](https://sketchfab.com/nicode) | [Metadata](https://api.sketchfab.com/v3/models/abe2261ecf8940399af382ada5d142f7) | 11,853 |
| `table.jpg` | [Tea Table Set](https://sketchfab.com/3d-models/tea-table-set-36b31b3484df46a781409825a9903d00) by [HuyTrinh](https://sketchfab.com/HuyTrinh) | [Metadata](https://api.sketchfab.com/v3/models/36b31b3484df46a781409825a9903d00) | 30,358 |

Total preview size is 175,891 bytes.

## Mesh archive availability

All seven records mark the model downloadable through Sketchfab. Sketchfab requires an authenticated download request before returning temporary archive URLs. The earlier unauthenticated request returned HTTP 401. None of the seven author descriptions supplies a separate archive link. The Poolcore description references the source Blender file and recommends rendering its water in Cycles, with download offered through the model page. The playable scenes use custom geometry and the source credits show the official JPEGs. The local package contains zero Sketchfab mesh archives. [Sketchfab Download API documentation](https://sketchfab.com/developers/download-api/downloading-models)

## Visual cues from the official previews

| Source | Visible details |
| --- | --- |
| House | Pale cream siding, steep reddish-brown gable, five dark gridded windows arranged two above and three below, and a narrow brown base. |
| Landscape | Dark green rolling terrain, a pale winding path, an upright dark doorway at the crest, and a large light cloud behind it. |
| Pool | Pale gray square tiles, a long straight recessed channel, repeated wall recesses, and a narrow overhead light strip leading to the vanishing point. |
| Suitcase | Low, rectangular tobacco-brown leather case with stitched edges, gray metal latches, and an arched brown handle. |
| Flower pot | Faceted blue vessel, salmon-colored band, angular dark-blue leaves, cyan blooms, and a small orange wood platform. |
| Chair | Bright blue molded seat and back, thin light-colored legs, and an X brace under the seat. |
| Tea table | Round weathered wood table with a raised edge, squat stools, and a white tea service. |

## Three.js

The single-file ES module at `dist/vendor/three.module.js` is the unmodified minified build from the official Three.js npm package `three@0.160.1`, revision 160. It is 670,681 bytes and ships with the MIT license in `dist/vendor/three.LICENSE.txt` and package checksums in `dist/vendor/three.PROVENANCE.txt`. The npm archive matched both the SHA-1 digest and SHA-512 integrity value published by the registry. The module imports directly in Node and exports `WebGLRenderer`, `OrthographicCamera`, `Group`, geometry and material classes, `CanvasTexture`, `Raycaster`, `Vector3`, and `VSMShadowMap`. [Official npm package metadata](https://registry.npmjs.org/three/0.160.1)
