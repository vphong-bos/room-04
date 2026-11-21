import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { act, getView, initialState } from '../dist/game-state.mjs';
import { buildWorld } from '../dist/world.mjs';

// The buildless browser distribution has a .js extension in a package without
// "type": "module". Load its exact bytes as ESM even on older supported Node.
const threeSource = await readFile(new URL('../dist/vendor/three.module.js', import.meta.url));
const THREE = await import('data:text/javascript;base64,' + threeSource.toString('base64'));

const screens = [[320, 568], [390, 844], [768, 1024], [1440, 900], [844, 390]];

function cameraFor(config, width, height) {
  const aspect = width / height;
  const span = Math.max(config.height, config.width / aspect);
  const camera = new THREE.OrthographicCamera(-span * aspect / 2, span * aspect / 2, span / 2, -span / 2, .1, 160);
  camera.position.set(...config.position);
  camera.lookAt(...config.target);
  camera.updateMatrixWorld();
  return camera;
}

function markForHit(object, targets) {
  while (object) {
    const mark = targets.find(item => item.object === object);
    if (mark) return mark.id;
    object = object.parent;
  }
}

test('every required object is the first visible hit throughout the playable route', t => {
  const ray = new THREE.Raycaster();
  let state = initialState(), states = 0, hits = 0, maxDraws = 0, maxTriangles = 0;
  let smallestMargin = Infinity;
  for (;;) {
    const view = getView(state);
    const world = buildWorld(THREE, view);
    const message = 'chapter ' + view.chapter + ', step ' + view.step;
    states++;
    try {
      const ids = world.targets.map(item => item.id);
      assert.equal(new Set(ids).size, ids.length, 'duplicate object target in ' + message);
      let draws = 0, triangles = 0;
      world.root.traverse(node => {
        if (!node.isMesh) return;
        const geometry = node.geometry;
        geometry.computeBoundingSphere();
        assert.ok(Number.isFinite(geometry.boundingSphere.radius), 'invalid mesh at ' + message);
        draws++;
        triangles += (geometry.index?.count ?? geometry.attributes.position.count) / 3 * (node.count ?? 1);
      });
      maxDraws = Math.max(maxDraws, draws);
      maxTriangles = Math.max(maxTriangles, triangles);
      for (const [width, height] of screens) {
        const camera = cameraFor(world.camera, width, height);
        for (const target of world.targets) {
          const uv = target.anchor.clone().project(camera);
          const x = (uv.x + 1) * width / 2, y = (1 - uv.y) * height / 2;
          const margin = Math.min(x, width - x, y, height - y);
          assert.ok(margin >= 22 && uv.z >= -1 && uv.z <= 1, 'target ' + target.id + ' outside touch-safe frame at ' + message + ' (' + width + '×' + height + ')');
          if (target.id === view.activeAction) smallestMargin = Math.min(margin, smallestMargin);
        }
        if (!view.activeAction) continue;
        const active = world.targets.find(item => item.id === view.activeAction);
        assert.ok(active, 'missing ' + view.activeAction + ' at ' + message);
        for (const reducedMotion of [false, true]) {
          world.update(8, .016, { reducedMotion });
          world.root.updateMatrixWorld(true);
          ray.setFromCamera(active.anchor.clone().project(camera), camera);
          const first = ray.intersectObject(world.root, true)[0];
          assert.equal(markForHit(first?.object, world.targets), active.id, 'visible surface at ' + message);
          hits++;
        }
      }
    } finally {
      world.dispose();
    }
    assert.equal(world.root.children.length, 0);
    if (view.letterFound) break;
    state = act(state, view.activeAction).state;
    assert.ok(states < 40, 'route did not reach the letter');
  }
  assert.equal(states, 20);
  assert.equal(hits, 190);
  t.diagnostic(states + ' views, ' + hits + ' unobstructed rays, minimum active margin ' + smallestMargin.toFixed(1) + ' px');
  t.diagnostic('maximum ' + maxDraws + ' mesh batches and ' + maxTriangles + ' visible triangles before shadows');
});

test('reduced motion is stationary and shared geometry, materials and label textures are released', () => {
  const originalDocument = globalThis.document;
  globalThis.document = {
    createElement() {
      return { getContext: () => ({ fillRect() {}, fillText() {} }) };
    }
  };
  let world;
  try {
    world = buildWorld(THREE, { chapter: 0, step: 2, activeAction: 'backdoor', letterFound: false });
    const assets = new Set();
    world.root.traverse(node => {
      if (!node.isMesh) return;
      assets.add(node.geometry);
      assets.add(node.material);
      if (node.material.map) assets.add(node.material.map);
      if (node.isInstancedMesh) assets.add(node);
    });
    assert.ok([...assets].some(asset => asset.isCanvasTexture), 'painted-over house number texture');
    const released = new Set();
    for (const asset of assets) asset.addEventListener('dispose', () => released.add(asset));
    function snapshot(elapsed) {
      world.update(elapsed, .016, { reducedMotion: true });
      world.root.updateMatrixWorld(true);
      const transforms = [];
      world.root.traverse(node => transforms.push(...node.matrixWorld.elements));
      return transforms;
    }
    assert.deepEqual(snapshot(1), snapshot(300));
    world.dispose();
    world = null;
    assert.equal(released.size, assets.size);
  } finally {
    world?.dispose();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

function changesWithTime(world, reducedMotion) {
  function transformsAt(seconds) {
    world.update(seconds, .016, { reducedMotion });
    world.root.updateMatrixWorld(true);
    const m = [];
    world.root.traverse(node => m.push(...node.matrixWorld.elements));
    return m;
  }
  const first = transformsAt(.19), second = transformsAt(1.71);
  return first.some((number, index) => number !== second[index]);
}

test('fan, drips and loose bench respect reduced motion, and the repaired bench stays still', () => {
  for (const [chapter, step, moving] of [[1, 0, true], [1, 4, true], [2, 0, false], [3, 4, true], [3, 5, false], [3, 6, false]]) {
    const world = buildWorld(THREE, { chapter, step });
    try {
      assert.equal(changesWithTime(world, true), false);
      assert.equal(changesWithTime(world, false), moving, 'motion in chapter ' + chapter + ' step ' + step);
    } finally {
      world.dispose();
    }
  }
});

test('successive pushes, tap turns and folds change the objects in the room', () => {
  function visibleObject(chapter, step, id) {
    const world = buildWorld(THREE, { chapter, step });
    try {
      const target = world.targets.find(t => t.id === id);
      assert.ok(target);
      const { object, anchor } = target, matrices = [];
      let pieces = 0;
      object.traverse(node => {
        if (!node.isMesh) return;
        pieces += node.isInstancedMesh ? node.count : 1;
        if (node.isInstancedMesh) matrices.push(...node.instanceMatrix.array);
      });
      return { anchor: anchor.toArray(), pieces, matrices };
    } finally {
      world.dispose();
    }
  }
  const before = visibleObject(1, 0, 'chair'), caught = visibleObject(1, 1, 'chair');
  assert.notDeepEqual(before.anchor, caught.anchor);
  const taps = [3, 4, 5].map(step => visibleObject(1, step, 'tap'));
  for (let i = 1; i < taps.length; i++) {
    assert.ok(taps[i].pieces < taps[i - 1].pieces, 'fewer drops with each turn');
    assert.notDeepEqual(taps[i].matrices, taps[i - 1].matrices);
  }
  const strip = visibleObject(3, 3, 'fold'), folded = visibleObject(3, 4, 'fold');
  assert.ok(folded.pieces > strip.pieces, 'folded cardboard has another layer');
  assert.notDeepEqual(strip.anchor, folded.anchor);
});

test('clicking through the middle of an open passage follows it', () => {
  const passages = [
    { chapter: 1, step: 7, id: 'left', center: [-2.72, 1.15, -1.65] },
    { chapter: 2, step: 1, id: 'room', center: [1.83, 1.12, -1.67] },
  ];
  for (const { chapter, step, id, center } of passages) {
    const world = buildWorld(THREE, { chapter, step });
    try {
      world.root.updateMatrixWorld(true);
      const ray = new THREE.Raycaster();
      for (const [width, height] of screens) {
        const camera = cameraFor(world.camera, width, height);
        for (const [offsetX, offsetY] of [[0, 0], [-.16, -.33], [.16, .33]]) {
          const point = new THREE.Vector3(...center);
          point.x += offsetX;
          point.y += offsetY;
          ray.setFromCamera(point.project(camera), camera);
          const hit = ray.intersectObject(world.root, true)[0];
          assert.equal(markForHit(hit?.object, world.targets), id, 'visible interior of ' + id);
        }
      }
    } finally {
      world.dispose();
    }
  }
});

function tintedBounds(world,hex,camera=null){
  const bounds=new THREE.Box3(),matrix=new THREE.Matrix4(),instance=new THREE.Matrix4(),color=new THREE.Color(),point=new THREE.Vector3();
  let pieces=0;
  world.root.updateMatrixWorld(true);
  world.root.traverse(object=>{
    if(!object.isMesh)return;
    for(let i=0;i<(object.isInstancedMesh?object.count:1);i++){
      if(object.isInstancedMesh){object.getColorAt(i,color);object.getMatrixAt(i,instance);matrix.multiplyMatrices(object.matrixWorld,instance);}
      else{color.copy(object.material.color);matrix.copy(object.matrixWorld);}
      if(color.getHex()!==hex)continue;
      for(let j=0;j<object.geometry.attributes.position.count;j++){
        point.fromBufferAttribute(object.geometry.attributes.position,j).applyMatrix4(matrix);
        if(camera)point.project(camera);
        bounds.expandByPoint(point);
      }
      pieces++;
    }
  });
  assert.ok(pieces>0,'missing prop geometry');
  return bounds;
}

test('the indoor chair touches the floor in every stationary and tilted pose',()=>{
  for(let step=0;step<=7;step++){
    const world=buildWorld(THREE,{chapter:1,step});
    try{
      const chair=tintedBounds(world,0x8b8d77);
      assert.ok(Math.abs(chair.min.y-(-.009))<1e-6,'chair floats or sinks at corridor step '+step+': '+chair.min.y);
    }finally{world.dispose();}
  }
});

test('moving the indoor chair leaves clear space between it and the desk',()=>{
  for(let step=0;step<=7;step++){
    const world=buildWorld(THREE,{chapter:1,step});
    try{
      const chair=tintedBounds(world,0x8b8d77),desk=tintedBounds(world,0x9a8669);
      assert.equal(chair.intersectsBox(desk),false,'chair intersects desk at corridor step '+step);
      assert.ok(desk.min.x-chair.max.x>=.12,'chair is too close to the desk at corridor step '+step);
    }finally{world.dispose();}
  }
});

test('the front-door chair and suitcase have a visible gap',()=>{
  for(const step of [0,1]){
    const world=buildWorld(THREE,{chapter:0,step});
    try{
      const chair=tintedBounds(world,0x496e91),luggage=tintedBounds(world,0x89775b);
      assert.equal(chair.intersectsBox(luggage),false,'front chair intersects the suitcase');
      assert.ok(chair.min.x-luggage.max.x>=.10,'front chair and suitcase need visible clearance');
      assert.ok(Math.abs(chair.min.y-(-.009))<1e-6,'the front chair must also rest on the concrete');
    }finally{world.dispose();}
  }
});

test('front chair and luggage keep a visible gap throughout the camera drag range',()=>{
  for(const step of [0,1]){
    const world=buildWorld(THREE,{chapter:0,step});
    try{
      for(const [width,height]of[[390,844],[1440,900],[320,240]])for(const yaw of[-.38,-.19,0,.19,.38]){
        const camera=cameraFor(world.camera,width,height),aim=new THREE.Vector3(...world.camera.target);
        camera.position.sub(aim).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(aim);camera.lookAt(aim);camera.updateMatrixWorld(true);
        const chair=tintedBounds(world,0x496e91,camera),luggage=tintedBounds(world,0x89775b,camera);
        assert.ok((chair.min.x-luggage.max.x)*width/2>=2,'front silhouettes overlap at step '+step+', yaw '+yaw);
      }
    }finally{world.dispose();}
  }
});
