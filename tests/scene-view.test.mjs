import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {act, getView, initialState} from '../dist/game-state.mjs';
import {buildWorld} from '../dist/world.mjs';
import {buildFallback} from '../dist/fallback.mjs';
import {fitSceneCamera, fitPaperFrame, targetPoint, hitSceneTarget, renderPixelRatio} from '../dist/scene-view.mjs';

const source = await readFile(new URL('../dist/vendor/three.module.js', import.meta.url));
const THREE = await import('data:text/javascript;base64,' + source.toString('base64'));

const screens = [
  [240, 320], [280, 653], [320, 568], [390, 844], [430, 932],
  [540, 720], [768, 1024], [820, 1180], [1024, 768], [1440, 900],
  [1920, 1080], [2560, 1080], [3840, 2160], [568, 320], [844, 390], [320, 240],
];

test('required objects stay visible and touch-safe across layouts, camera drags and motion settings', t => {
  const ray = new THREE.Raycaster();
  const axis = new THREE.Vector3(0, 1, 0);
  let state = initialState(), checks = 0;
  for (;;) {
    const view = getView(state), world = buildWorld(THREE, view);
    try {
      const active = world.targets.find(target => target.id === view.activeAction);
      if (active) for (const [width, height] of screens) {
        for (const yaw of [-.38, -.19, 0, .19, .38]) {
          for (const reducedMotion of [true, false]) {
            world.update(1.71, .016, {reducedMotion});
            world.root.updateMatrixWorld(true);
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 160);
            const aim = new THREE.Vector3(...world.camera.target);
            camera.position.set(...world.camera.position).sub(aim).applyAxisAngle(axis, yaw).add(aim);
            camera.lookAt(aim);
            const frame = fitSceneCamera(camera, world.camera, width, height, targetPoint(active), undefined, world.targets.map(targetPoint));
            const point = targetPoint(active).project(camera);
            const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
            const at = view.chapter + ':' + view.step + ' ' + width + '×' + height + ' yaw ' + yaw;
            assert.ok(x >= frame.left - .01 && x <= frame.right + .01, 'horizontal touch margin at ' + at);
            assert.ok(y >= frame.top - .01 && y <= frame.bottom + .01, 'controls cover target at ' + at);
            assert.ok(point.z >= -1 && point.z <= 1, 'depth clipping at ' + at);
            ray.setFromCamera(point, camera);
            assert.equal(hitSceneTarget(ray, world.root, world.targets)?.id, active.id, 'object occluded at ' + at);
            for (const target of world.targets) {
              const context = targetPoint(target).project(camera);
              const contextX = (context.x + 1) * width / 2, contextY = (1 - context.y) * height / 2;
              assert.ok(contextX >= frame.left - .01 && contextX <= frame.right + .01, 'cropped contextual object at ' + at);
              assert.ok(contextY >= frame.top - .01 && contextY <= frame.bottom + .01, 'cropped contextual object at ' + at);
            }
            checks++;
          }
        }
      }
    } finally {
      world.dispose();
    }
    if (view.letterFound) break;
    state = act(state, view.activeAction).state;
  }
  assert.equal(checks, 3040);
  t.diagnostic(checks + ' layout, orbit and motion combinations');
});

test('the phone composition keeps the starting chair large enough to recognize', () => {
  const world = buildWorld(THREE, getView(initialState()));
  try {
    world.root.updateMatrixWorld(true);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 160);
    camera.position.set(...world.camera.position);
    camera.lookAt(...world.camera.target);
    fitSceneCamera(camera, world.camera, 390, 844, targetPoint(world.targets.find(t => t.id === 'frontdoor')));
    const top = new THREE.Vector3(-1.39, .94, .47).project(camera);
    const foot = new THREE.Vector3(-1.39, .02, .47).project(camera);
    assert.ok(Math.abs(top.y - foot.y) * 844 / 2 > 100, 'phone framing shrank the chair into a thumbnail');
  } finally {
    world.dispose();
  }
});

test('paper scenery and its object overlays share a touch-safe frame in every layout', () => {
  let state = initialState();
  for (;;) {
    const view = getView(state), paper = buildFallback(view);
    const active = paper.targets.find(target => target.id === view.activeAction);
    for (const [width, height] of screens) {
      const fitted = fitPaperFrame(width, height, active, undefined, paper.targets);
      if (!active) continue;
      const x = (active.x - fitted.x) * fitted.scale;
      const y = (active.y - fitted.y) * fitted.scale;
      assert.ok(x >= fitted.frame.left - .01 && x <= fitted.frame.right + .01);
      assert.ok(y >= fitted.frame.top - .01 && y <= fitted.frame.bottom + .01);
      assert.ok(Math.abs(fitted.width / fitted.height - width / height) < 1e-8);
    }
    if (view.letterFound) break;
    state = act(state, view.activeAction).state;
  }
});

test('pointer hits stop at solid scenery but can pass through the shallow water surface', () => {
  const root = new THREE.Group();
  const target = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .1), new THREE.MeshBasicMaterial());
  const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 2, .1), new THREE.MeshBasicMaterial());
  wall.position.z = 1;
  root.add(target, wall);
  const targets = [{id: 'photo', object: target}];
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1));
  try {
    root.updateMatrixWorld(true);
    assert.equal(hitSceneTarget(ray, root, targets), null, 'solid wall must block the photograph');
    wall.material.transparent = true;
    wall.material.opacity = .49;
    wall.material.depthWrite = false;
    assert.equal(hitSceneTarget(ray, root, targets)?.id, 'photo');
  } finally {
    for (const mesh of [target, wall]) { mesh.geometry.dispose(); mesh.material.dispose(); }
  }
});

test('object overlays follow their local anchor when the parent moves', () => {
  const parent = new THREE.Group(), object = new THREE.Group();
  parent.add(object);
  const target = {object, local: new THREE.Vector3(1, 0, 0), anchor: new THREE.Vector3(1, 0, 0)};
  object.rotation.z = Math.PI / 2;
  parent.position.set(2, 3, 0);
  const point = targetPoint(target);
  assert.ok(point.distanceTo(new THREE.Vector3(2, 4, 0)) < 1e-8);
  assert.deepEqual(target.local.toArray(), [1, 0, 0], 'projection must not mutate the local anchor');
});

test('retina and ultrawide layouts stay within the drawing-buffer budget', () => {
  assert.equal(renderPixelRatio(390, 844, 3), 1.6);
  for (const [width, height] of screens) {
    const ratio = renderPixelRatio(width, height, 3);
    assert.ok(width * height * ratio * ratio <= 2600000 + .01);
    assert.ok(ratio > 0 && ratio <= 1.6);
  }
  assert.equal(renderPixelRatio(390, 844, 1), 1);
});

test('the ending keeps both shoes in view and unobstructed throughout its allowed drag range', () => {
  const world = buildWorld(THREE, {chapter:3, step:6});
  const corners = [-.04, .46].flatMap(x => [-.013, .16].flatMap(y => [-5.12, -4.61].map(z => new THREE.Vector3(x,y,z))));
  try {
    world.root.updateMatrixWorld(true);
    const limit = world.camera.dragLimit ?? .38;
    for (const [width,height] of screens) for (const yaw of [-limit, 0, limit]) {
      const camera = new THREE.OrthographicCamera(-1,1,1,-1,.1,160);
      const aim = new THREE.Vector3(...world.camera.target);
      camera.position.set(...world.camera.position).sub(aim).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(aim);
      camera.lookAt(aim);
      const frame = fitSceneCamera(camera,world.camera,width,height,null,undefined,world.targets.map(targetPoint));
      for (const corner of corners) {
        const point = corner.clone().project(camera), x = (point.x+1)*width/2, y = (1-point.y)*height/2;
        assert.ok(x >= frame.left - .01 && x <= frame.right + .01 && y >= frame.top - .01 && y <= frame.bottom + .01,
          'ending shoes cropped at ' + width + '×' + height + ', yaw ' + yaw);
      }
      for (const x of [.09,.33]) {
        const center = new THREE.Vector3(x,.06,x === .09 ? -4.89 : -4.84);
        const ray = new THREE.Raycaster();
        ray.setFromCamera(center.clone().project(camera),camera);
        const first = ray.intersectObject(world.root,true)[0];
        assert.ok(first && first.point.distanceTo(center) < .2, 'a wall hides the ending shoes');
      }
    }
  } finally {
    world.dispose();
  }
});

test('repeated resizing and landscape safe-area insets retain complete touch areas', () => {
  const world = buildWorld(THREE,getView(initialState()));
  try {
    world.root.updateMatrixWorld(true);
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,.1,160);
    camera.position.set(...world.camera.position);camera.lookAt(...world.camera.target);
    const active = targetPoint(world.targets.find(t => t.id === 'frontdoor'));
    const insets = {left:47,right:47,top:54,bottom:32};
    for (const [width,height] of [...screens,...screens.slice().reverse()]) {
      const frame = fitSceneCamera(camera,world.camera,width,height,active,insets,world.targets.map(targetPoint));
      const point = active.clone().project(camera), x = (point.x+1)*width/2, y = (1-point.y)*height/2;
      assert.ok(x >= frame.left - .01 && x <= frame.right + .01);
      assert.ok(y >= frame.top - .01 && y <= frame.bottom + .01);
      if (width === 844) {
        assert.ok(x >= 81 && x <= 763, 'notch covers a touch target');
        assert.ok(y >= 88 && y <= 324, 'controls cover a touch target');
      }
    }
    const before = camera.projectionMatrix.toArray();
    assert.equal(fitSceneCamera(camera,world.camera,0,0,active),null);
    assert.deepEqual(camera.projectionMatrix.toArray(),before,'a hidden layout must not corrupt the camera');
  } finally {
    world.dispose();
  }
});

test('the complete sink window stays in frame when inspecting the pool below', () => {
  const world = buildWorld(THREE,{chapter:1,step:6});
  try {
    world.root.updateMatrixWorld(true);
    for (const [width,height] of screens) {
      const camera = new THREE.OrthographicCamera(-1,1,1,-1,.1,160);
      camera.position.set(...world.camera.position);camera.lookAt(...world.camera.target);
      const active = targetPoint(world.targets.find(t => t.id === 'window'));
      const frame = fitSceneCamera(camera,world.camera,width,height,active,undefined,world.targets.map(targetPoint));
      for (const x of [.70,2.81]) for (const y of [1.02,2.36]) {
        const point = new THREE.Vector3(x,y,-1.56).project(camera);
        assert.ok((point.x+1)*width/2 >= frame.left - .01 && (point.x+1)*width/2 <= frame.right + .01);
        assert.ok((1-point.y)*height/2 >= frame.top - .01 && (1-point.y)*height/2 <= frame.bottom + .01);
      }
    }
  } finally {
    world.dispose();
  }
});

test('the repeated blue chair and the shoes in the shallow pool remain fully in frame', () => {
  const boxes = [
    [[-.91,.013,-.38],[-.19,.96,.30]],
    [[-1.10,-.023,1.65],[-.40,.17,2.15]],
  ];
  const corners = boxes.flatMap(([min,max]) => [min[0],max[0]].flatMap(x =>
    [min[1],max[1]].flatMap(y => [min[2],max[2]].map(z => new THREE.Vector3(x,y,z)))));
  for (const step of [0,1]) {
    const world = buildWorld(THREE,{chapter:2,step});
    try {
      world.root.updateMatrixWorld(true);
      for (const [width,height] of screens) {
        const camera = new THREE.OrthographicCamera(-1,1,1,-1,.1,160);
        camera.position.set(...world.camera.position);camera.lookAt(...world.camera.target);
        const active = targetPoint(world.targets.find(t => t.id === (step ? 'room' : 'towel')));
        const frame = fitSceneCamera(camera,world.camera,width,height,active,undefined,world.targets.map(targetPoint));
        for (const corner of corners) {
          const point = corner.clone().project(camera), x = (point.x+1)*width/2, y = (1-point.y)*height/2;
          assert.ok(x >= frame.left - .01 && x <= frame.right + .01 && y >= frame.top - .01 && y <= frame.bottom + .01,
            'pool chair or shoes cropped at ' + width + '×' + height);
        }
      }
    } finally {
      world.dispose();
    }
  }
});
