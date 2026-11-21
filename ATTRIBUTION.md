# Room 04 — credits

Keep these credits and the in-page credits when reusing the supplied previews. The rooms and SVG scenes are original constructions inspired by the user's story and references. The game also includes seven locally embedded CC0 meshes, described below. No downloaded Sketchfab meshes are included.

## Obtained model meshes used in the game

Seven additional model meshes are embedded in dist/model-assets.mjs for offline play. These are actual converted vertex/index data, not previews or procedural replacements.

| Model | Creator | License / source |
| --- | --- | --- |
| Key, flower, boat, bottle, star, opening chest | Quaternius | CC0 1.0; original pack pages and exact pinned GLB files are recorded in the asset report |
| Utah teapot | Martin Newell; edited by Yuki Koyama | CC0 1.0 as recorded in the source asset README; locally simplified to a faceted 1,523-triangle version |

[The asset report](docs/room04/free-exploration-assets.md) includes each original pack page, exact obtained file, blob identifier, license evidence and conversion details. Six Quaternius models came through the public quaternius-showcase distribution; its model-license register distinguishes upstream CC0 models from the showcase code's MIT license. Total imported geometry is 2,857 triangles. Scene colors and glass materials are adapted, and the chest retains an opening lid.

## Seven Sketchfab references

The model pages and public Data API records were checked on 21 November 2026. All seven identify **Creative Commons Attribution 4.0 International**: [license and terms](https://creativecommons.org/licenses/by/4.0/).

| Work | Creator | Local official preview |
| --- | --- | --- |
| [Dreamcore House](https://sketchfab.com/3d-models/dreamcore-house-ed671fbe04ac458cb04e3c2e76b380e4) | [MrEffect](https://sketchfab.com/MrEffectDev) | `dist/assets/models/house.jpg` |
| [Dreamcore liminal space](https://sketchfab.com/3d-models/dreamcore-liminal-space-875b0005014d4b42bf1e9b2ff53ed4c4) | [CatLoveCheese](https://sketchfab.com/CatLoveCheese) | `dist/assets/models/landscape.jpg` |
| [Poolcore Level 37](https://sketchfab.com/3d-models/poolcore-level-37-c6fb62d1182c45518a8d8ebbd18c9687) | [CatLoveCheese](https://sketchfab.com/CatLoveCheese) | `dist/assets/models/pool.jpg` |
| [Old Suitcase // Game Ready](https://sketchfab.com/3d-models/old-suitcase-game-ready-1c927d3999e643bcaba078f03b7b2ee7) | [Alex Murias (@Xlay3D)](https://sketchfab.com/Xlay3D) | `dist/assets/models/suitcase.jpg` |
| [Stylized Flower Pot](https://sketchfab.com/3d-models/stylized-flower-pot-458ac3558d0846c6bde75d5b6c343de6) | [Nirvana Studio](https://sketchfab.com/nirvanastudio); **modeled and textured by pr1me_3d** | `dist/assets/models/pot.jpg` |
| [Low Poly Chair](https://sketchfab.com/3d-models/low-poly-chair-abe2261ecf8940399af382ada5d142f7) | [nicode](https://sketchfab.com/nicode) | `dist/assets/models/chair.jpg` |
| [Tea Table Set](https://sketchfab.com/3d-models/tea-table-set-36b31b3484df46a781409825a9903d00) | [HuyTrinh](https://sketchfab.com/HuyTrinh) | `dist/assets/models/table.jpg` |

The local JPEGs are unmodified official 720 × 405 previews from their public Sketchfab model records. They are resized/cropped by CSS in the source drawer. The optional viewers display each original through Sketchfab; the original geometry and textures are not edited or redistributed here. The credit manifest retains the exact model UID, model URL, artist profile, preview path, and license URL. Further provenance is in `docs/room04/assets-report.md`.

All seven are listed as downloadable on their model records, but archive downloads require Sketchfab authentication. None of the creators' descriptions supplied an independent authorized archive link. The package contains no Sketchfab mesh archive. No endorsement by any artist is claimed.

The former Floating Island and Rainbow previews are no longer included in the site.

## Three.js

- Version: **0.160.1**, revision 160.
- Official package: https://registry.npmjs.org/three/0.160.1
- Official project: https://github.com/mrdoob/three.js
- Local module: `dist/vendor/three.module.js`, unmodified minified ES module.
- License: **MIT**, full notice in `dist/vendor/three.LICENSE.txt`.
- Registry integrity checks and module hash: `dist/vendor/three.PROVENANCE.txt`.

## Fonts

Fraunces, DM Sans, and Caveat use **SIL Open Font License 1.1**. Unmodified WOFF2 subsets are self-hosted in `dist/assets/fonts/`. Full author and copyright notices are retained in `dist/assets/licenses/fonts/`:

| Family | Use | License file |
| --- | --- | --- |
| Fraunces | Graduation invitation heading | `fraunces-OFL.txt` |
| DM Sans | Invitation text, controls and source credits | `dm-sans-OFL.txt` |
| Caveat | Retained from the earlier handwritten interface; unused in the current invitation | `caveat-OFL.txt` |

`dist/assets/licenses/fonts/SOURCES.txt` records the original download and license URLs. No font service is contacted by the game.

## Story and original work

The six-chapter Room 04 story was supplied by the user and is reproduced in `docs/room04/story.md` for adaptation reference. Its rights remain with its author; the code license does not grant rights to that story.

The interactive adaptation, original 3D/SVG geometry, palette, favicon, interface, and default letter were created for this personal project. Original software is covered by the root MIT license. Third-party assets retain the licenses above.

## Graduation portrait (current revision)

`dist/assets/story/graduation-portrait.png` is the user's supplied graduation portrait, copied unchanged from `/workspace/hihi.png`. It is shown on the front of the photograph. Rights remain with the portrait's owner and photographer.

The earlier UIT venue photograph is no longer displayed. The invitation now links to the campus on Google Maps, using the location from UIT's [official contact page](https://tuyensinh.uit.edu.vn/content/lien-he).

## Earlier found photograph (not displayed)

`dist/assets/story/found-photograph.png` was generated for Room 04 and edited to follow the latest supplied scene: a large out-of-focus sleeve, part of a table, two cups and an ambiguous hand cut off at the edge. The selected file is unmodified after generation. It is fictional artwork, not a photograph of the user or their friends. The exact final generation/edit brief is in `docs/room04/revision-2/image-prompt.md`.
