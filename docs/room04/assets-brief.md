# Assets task
Own dist/vendor/, dist/assets/models/, dist/model-sources.mjs, docs/room04/assets-report.md ONLY. No UI or gameplay edits. No subagents, no browser. Need exact models supplied by user:
- house ed671fbe04ac458cb04e3c2e76b380e4 Dreamcore House — MrEffect
- landscape 875b0005014d4b42bf1e9b2ff53ed4c4 Dreamcore liminal space — CatLoveCheese
- pool c6fb62d1182c45518a8d8ebbd18c9687 Poolcore Level37 — CatLoveCheese
- suitcase 1c927d3999e643bcaba078f03b7b2ee7 Old Suitcase Game Ready — Alex Murias (@Xlay3D)
- pot 458ac3558d0846c6bde75d5b6c343de6 Stylized Flower Pot — Nirvana Studio; modeled/textured pr1me_3d
- chair abe2261ecf8940399af382ada5d142f7 Low Poly Chair — nicode
- table 36b31b3484df46a781409825a9903d00 Tea Table Set — HuyTrinh
Verify with primary web search and official API metadata. Download official preview JPEGs <=720px into assets/models/<key>.jpg with credits; do not scrape internal proprietary viewer mesh resources. Prior session /v3/models/{uid}/download returned401 authrequired. No need repeatedly probe auth wall. If author provides an openly authorized external archive link in description, may use it; otherwise report not downloaded. Only bounded investigation, no login or access circumvention.

Also vendor a stable pinned Three.js ES module distribution from official GitHub release/npm official package source into dist/vendor. Prefer a version with single module import file or include every relative import (modern core +module). Parent will import * as THREE from './vendor/three.module.js'. No npm install required for user. Include MIT license/version/source provenance. Verify exports include WebGLRenderer, OrthographicCamera, Group, shapes/materials, CanvasTexture, Raycaster, Vector3, VSMShadowMap. Do not include GLTFLoader unless legitimate model files are actually obtained (no speculative downloads).

Write model-sources.mjs exporting const MODEL_SOURCES = [{key,title,creator,creatorUrl,url,uid,license,licenseUrl,preview:'./assets/models/key.jpg',note}]; credits note whether custom geometry used in playable scenes, source viewers optional. No usercontrolledHTML, just strings. Parent will import this manifest. All local paths relative.

Report official URLs/licensechecks, asset sizes, Three version, archive availability, and any exact renderer visual reference findings. Do not claim thumbnails are meshes.
