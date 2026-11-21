import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const appSource=await readFile(new URL('../dist/app.mjs',import.meta.url),'utf8');
const source=await readFile(new URL('../dist/vendor/three.module.js',import.meta.url));
const THREE=await import('data:text/javascript;base64,'+source.toString('base64'));

function frameFixture(yaw,pitch){
  const camera=new THREE.PerspectiveCamera(64,390/844,.05,160);
  const goal=new THREE.Vector3(0,1.62,3.5),aim=new THREE.Vector3(-.1,1.1,-1.2);
  camera.position.copy(goal);camera.lookAt(aim);camera.updateMatrixWorld(true);
  const stats={fits:0};
  const lookStart=appSource.indexOf('function desiredLook()');
  const look=lookStart<0?'':appSource.slice(lookStart,appSource.indexOf('function fit3DFrame()',lookStart));
  const animation=appSource.slice(appSource.indexOf('function animate('),appSource.indexOf('async function boot('));
  const env={THREE,requestAnimationFrame:()=>0,frameTime:0,document:{hidden:false},sceneAge:0,
    renderer:{render(){}},preferences:{paper:false},world:{root:new THREE.Group(),update(){}},
    quiet:()=>true,dragAngle:0,dragGoal:yaw,pitchAngle:0,pitchGoal:pitch,cameraGoal:goal,cameraAim:aim,
    currentLook:aim.clone(),camera,view:{freeExploration:true},fit3DFrame:()=>stats.fits++,
    renderNeeded:true,scene:new THREE.Scene(),updateTargets(){},placeGratitude(){},pointerStart:null};
  return {camera,goal,aim,stats,run:()=>new Function(...Object.keys(env),look+animation+'\nanimate(100);')(...Object.values(env))};
}

test('free looking keeps the eye position and projection fixed during an actual controller frame',()=>{
  const {camera,goal,stats,run}=frameFixture(.4,.15);
  const projection=camera.projectionMatrix.toArray();
  run();camera.updateMatrixWorld(true);
  assert.ok(camera.position.distanceTo(goal)<1e-10,'looking must not orbit through the furniture');
  assert.deepEqual(camera.projectionMatrix.toArray(),projection,'looking must not zoom or reframe the room');
  assert.equal(stats.fits,0,'the controller must not undo looking by re-fitting the scene each frame');
});

test('vertical dragging changes the actual rendered view direction',()=>{
  const {camera,aim,run}=frameFixture(0,.24);
  const before=aim.clone().project(camera);
  run();camera.updateMatrixWorld(true);
  const after=aim.clone().project(camera);
  assert.ok(Math.abs(after.y-before.y)>.05,'vertical looking must move the scene, not only update a stored input value');
});


function drawFixture(previous3D){
  const camera=new THREE.PerspectiveCamera(64,1,.05,160);
  camera.position.set(.1,1.45,2.5);
  const currentLook=new THREE.Vector3(.1,1,.3);
  camera.lookAt(currentLook);
  const room={location:'ending',room:'table',phase:'table',caption:''},node={hidden:false,replaceChildren(){}};
  const env={THREE,view:room,next:{...room,flags:{chest:true}},renderer:{},preferences:{paper:false},
    camera,currentLook,cameraGoal:new THREE.Vector3(-.08,1.24,1.16),cameraAim:new THREE.Vector3(-.08,.86,.06),
    cameraTarget:{},quiet:()=>false,sceneAge:1,dragAngle:previous3D?.2:0,dragGoal:previous3D?.4:0,pitchAngle:previous3D?.1:0,pitchGoal:previous3D?.15:0,
    pointerStart:null,targets:[],host:node,$:()=>node,markChapter(){},disposeWorld(){},
    scene:new THREE.Scene(),world:previous3D?{root:new THREE.Group()}:null,
    buildWorld:()=>({root:new THREE.Group(),targets:[],camera:{position:[-.08,1.24,1.16],target:[-.08,.86,.06]}}),
    mountTargets(){},renderNeeded:false,showFeedback(){},announce(){},interactionHint:()=>null};
  const lookStart=appSource.indexOf('function desiredLook()');
  const look=appSource.slice(lookStart,appSource.indexOf('function fit3DFrame()',lookStart));
  const draw=appSource.slice(appSource.indexOf('function drawView('),appSource.indexOf('function installView('));
  return {camera,currentLook,run:()=>new Function(...Object.keys(env),look+draw+'\ndrawView(next,true);')(...Object.values(env))};
}
test('a same-room discovery retains the actual eye and look during an unfinished pose move',()=>{
  const {camera,currentLook,run}=drawFixture(true);
  const beforeEye=camera.position.toArray(),beforeLook=currentLook.toArray();
  run();
  assert.deepEqual(camera.position.toArray(),beforeEye,'a reward must not teleport an in-progress seated move');
  assert.deepEqual(currentLook.toArray(),beforeLook,'a reward must preserve the actual current look');
});
test('switching from illustrated to 3D installs the current authored viewpoint',()=>{
  const {camera,currentLook,run}=drawFixture(false);
  run();
  assert.ok(camera.position.distanceTo(new THREE.Vector3(-.08,1.24,1.16))<1e-10,'an old exterior camera must not be retained after illustrated travel');
  assert.ok(currentLook.distanceTo(new THREE.Vector3(-.08,.86,.06))<1e-10,'the current room aim must replace the stale look');
});
