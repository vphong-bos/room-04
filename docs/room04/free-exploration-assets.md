# Free-exploration mesh assets

Checked on 21 November 2026. Seven actual third-party meshes are embedded in [`dist/model-assets.mjs`](../../dist/model-assets.mjs), rather than fetched at runtime. The existing Sketchfab preview photographs remain references; they are not evidence that their mesh files were imported.

## Obtained models

All seven selected meshes are covered by [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Attribution is optional under CC0, but the module records the creator, original pack, exact mesh source and license evidence for the Sources drawer.

| Scene use / export key | Model and creator | Original source / license evidence | Obtained mesh |
| --- | --- | --- | --- |
| key | Old-fashioned key — Quaternius | [ultimaterpg ](https://quaternius.com/packs/ultimaterpg.html) · [license record](https://github.com/trebeljahr/quaternius-showcase/blob/0128ca510d653bb04d6d1e4885bd8890b5050b4f/LICENSES.md) | [GLB](https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/0128ca510d653bb04d6d1e4885bd8890b5050b4f/public/glb/rpg_items_pack/Key1.glb); 284 triangles in the embedded version |
| flower | Tiny flower — Quaternius | [ultimatecrops ](https://quaternius.com/packs/ultimatecrops.html) · [license record](https://github.com/trebeljahr/quaternius-showcase/blob/0128ca510d653bb04d6d1e4885bd8890b5050b4f/LICENSES.md) | [GLB](https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/0128ca510d653bb04d6d1e4885bd8890b5050b4f/public/glb/crops_pack/Flower_1.glb); 80 triangles in the embedded version |
| boat | Tiny wooden boat — Quaternius | [ships ](https://quaternius.com/packs/ships.html) · [license record](https://github.com/trebeljahr/quaternius-showcase/blob/0128ca510d653bb04d6d1e4885bd8890b5050b4f/LICENSES.md) | [GLB](https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/0128ca510d653bb04d6d1e4885bd8890b5050b4f/public/glb/ships_pack/Boat.glb); 172 triangles in the embedded version |
| jar | Corked miniature bottle — Quaternius | [ultimaterpg ](https://quaternius.com/packs/ultimaterpg.html) · [license record](https://github.com/trebeljahr/quaternius-showcase/blob/0128ca510d653bb04d6d1e4885bd8890b5050b4f/LICENSES.md) | [GLB](https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/0128ca510d653bb04d6d1e4885bd8890b5050b4f/public/glb/rpg_items_pack/Potion10_Empty.glb); 372 triangles in the embedded version |
| star | Collectible star — Quaternius | [modularplatformer ](https://quaternius.com/packs/modularplatformer.html) · [license record](https://github.com/trebeljahr/quaternius-showcase/blob/0128ca510d653bb04d6d1e4885bd8890b5050b4f/LICENSES.md) | [GLB](https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/0128ca510d653bb04d6d1e4885bd8890b5050b4f/public/glb/platformer_pack/Star.glb); 90 triangles in the embedded version |
| chest | Opening treasure chest — Quaternius | [medievaldungeon ](https://quaternius.com/packs/medievaldungeon.html) · [license record](https://github.com/trebeljahr/quaternius-showcase/blob/0128ca510d653bb04d6d1e4885bd8890b5050b4f/LICENSES.md) | [GLB](https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/0128ca510d653bb04d6d1e4885bd8890b5050b4f/public/glb/modular_dungeon_pack/Chest.glb); 336 triangles in the embedded version |
| teapot | Utah teapot — Martin Newell; edited by Yuki Koyama | [Asset README ](https://github.com/yuki-koyama/bigger/blob/master/assets/README.md) · [license record](https://github.com/yuki-koyama/bigger/blob/master/assets/README.md) | [OBJ](https://github.com/yuki-koyama/bigger/blob/master/assets/teapot.obj); 1,523 triangles in the embedded version |

The six Quaternius GLBs were read from the public `trebeljahr/quaternius-showcase` repository. Its [model-license register](https://github.com/trebeljahr/quaternius-showcase/blob/0128ca510d653bb04d6d1e4885bd8890b5050b4f/LICENSES.md) distinguishes the models' upstream CC0 dedication from the showcase code's MIT license. Each selected upstream pack page was also checked directly and explicitly labels that pack CC0: [RPG](https://quaternius.com/packs/ultimaterpg.html), [Crops](https://quaternius.com/packs/ultimatecrops.html), [Ships](https://quaternius.com/packs/ships.html), [Platformer](https://quaternius.com/packs/modularplatformer.html), and [Dungeon](https://quaternius.com/packs/medievaldungeon.html). The mesh URLs are pinned to commit `0128ca510d653bb04d6d1e4885bd8890b5050b4f`.

The teapot is Martin Newell's Utah teapot, edited by Yuki Koyama. The source repository's [asset README](https://github.com/yuki-koyama/bigger/blob/master/assets/README.md) explicitly assigns CC0 to this OBJ. The file was obtained using GitHub's blob endpoint, because the contents endpoint returned an empty result for the 1.34 MB file: [exact blob `862d7a4b63862c828dc33ca4fea80f1498885eb1`](https://api.github.com/repos/yuki-koyama/bigger/git/blobs/862d7a4b63862c828dc33ca4fea80f1498885eb1). This version has 15,704 source triangles; spatial vertex clustering produced the embedded 1,523-triangle faceted version.

## Conversion and integration

The GLB files were decoded using their public accessors and scene-node transforms. Mesh vertices and triangle indices were baked into arrays, exact duplicate positions welded, then centered on X/Z and grounded at Y=0. Texture coordinates are unnecessary for these flat-color source models. This is a real mesh conversion, not replacement with procedural primitives.

The original `Pickup_Jar-transformed.glb` candidate required Draco and a texture atlas. It was rejected for this build. The embedded `jar` uses Quaternius's uncompressed `Potion10_Empty.glb`, with its glass and cork parts preserved. Glass transparency and a gold key tint are scene-specific material adaptations. The chest was rotated to face +Z and retains its separate body and lid meshes.

```js
import { createModelAsset, MODEL_ASSET_SOURCES } from "./model-assets.mjs";
const key = createModelAsset(THREE, "key", { size: 0.23 });
const tea = createModelAsset(THREE, "teapot", { size: 0.35 });
const chest = createModelAsset(THREE, "chest", { size: 0.85, open: true });
```

Available keys are `key`, `flower`, `boat`, `jar`, `star`, `chest`, and `teapot`. `size` is the longest dimension of the closed model, in world units; `color` optionally overrides the source color. Unknown keys return `null`, allowing a scene fallback. The return value is a Three.js Group. No runtime network request, GLTFLoader, Draco, image texture, `atob`, TextEncoder or URL API is needed.

The chest's `chest-body` and `chest-lid` groups can be found by name. The lid pivot sits at its rear hinge; `open: true` rotates it -1.8 radians around X. Opening preserves the chest body's placement. The world should dispose each returned mesh's geometry and material when leaving a room. Each call creates independent disposable resources.

Every returned root records `modelAsset`, `semantic`, `importedMesh`, `obtained`, `source`, `meshSource`, `blobSha`, `creator`, `license`, `licenseUrl`, and triangle count in `userData`. The seven converted meshes total 2,857 triangles.

## Sketchfab candidates checked

- [Low-poly treasure chest by fongoose](https://sketchfab.com/3d-models/low-poly-treasure-chest-8531db503d434c5fb2a52b9e9dd64858).
- [Teapot by fervinas](https://sketchfab.com/3d-models/teapot-5b40b66bc6ea45a6a0f8e4cc063a5e4e).

Both model pages and their public model-metadata endpoints were inaccessible through the available web reader in this session. Their licenses and download contents therefore could not be independently verified here. No Sketchfab mesh was obtained, no authenticated download was attempted, and no viewer-internal asset extraction was used. The CC0 alternatives above are the assets actually embedded.

## Verification

Geometry checks execute the exact saved module with the vendored Three.js revision 160 in the pure-JavaScript compatibility environment. They verify all seven meshes have finite positions and normals, requested size, a grounded base, actual triangles, source metadata, separate disposable resources, and a chest lid whose open pose changes while the body stays fixed. The initial missing-factory check failed before implementation. The native command `node --test tests/*.test.mjs` was attempted and failed before Node started: bwrap could not create a new namespace. No browser/WebGL or pointer-interaction inspection is claimed.

