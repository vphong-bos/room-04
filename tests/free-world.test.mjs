import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {buildWorld} from '../dist/world.mjs';
import {fitSceneCamera,targetPoint,hitSceneTarget} from '../dist/scene-view.mjs';

const threeSource = await readFile(new URL('../dist/vendor/three.module.js',import.meta.url));
const THREE = await import('data:text/javascript;base64,'+threeSource.toString('base64'));

const screens=[[320,568],[390,844],[768,1024],[1440,900],[844,390],[320,240]];
const fixture=(location,availableActions,flags={},focusAction='')=>({
  freeExploration:true,location,availableActions,flags,focusAction,activeAction:'',
  room:location==='window'?'tea':['treasure','ending'].includes(location)?'table':location,
  pose:location==='window'?'window':location==='ending'?'seated':'standing'
});
const cases=[
  fixture('front',['frontdoor','sidepath','hose'],{},'sidepath'),
  fixture('back',['returnfront','backdoor','key'],{},'key'),
  fixture('back',['returnfront','backdoor'],{key:true},'backdoor'),
  fixture('back',['returnfront','backdoor','enterhouse'],{key:true,backdoor:true},'enterhouse'),
  fixture('tea',['tea','cup','fan','tape','pattern','outside'],{},'tea'),
  fixture('tea',['tea','cup','fan','tape','pattern','outside','window'],{tea:true},'window'),
  fixture('tea',['tea','cup','fan','tape','pattern','outside','window','left'],{tea:true,window:true},'left'),
  fixture('window',['returntea','duck','flower','boat','jar','windmill','star'],{tea:true,window:true},'returntea'),
  fixture('treasure',['sit','returntea'],{tea:true,window:true},'sit'),
  fixture('ending',['returnroom','returntea','chest','cup'],{tea:true,window:true,seated:true},'chest'),
  fixture('ending',['returnroom','returntea','chest','cup','photo'],{tea:true,window:true,seated:true,chest:true},'photo'),
  fixture('ending',['returnroom','returntea','chest','cup','photo'],{tea:true,window:true,seated:true,chest:true,photo:true}),
  fixture('treasure',['sit','returntea','photo'],{tea:true,window:true,seated:true,chest:true,photo:true},'sit'),
  fixture('ending',['returnroom','returntea','chest','cup','photo'],{tea:true,window:true,seated:true,chest:true,photo:true,writing:true},'returnroom')
];
function fittedCamera(world,width,height,focusId='') {
  const camera=new THREE.PerspectiveCamera(world.camera.fov,width/height,.05,160);
  camera.position.set(...world.camera.position);camera.lookAt(new THREE.Vector3(...world.camera.target));
  camera.updateMatrixWorld(true);
  const focus=world.targets.find(target=>target.id===focusId);
  const context=world.targets.filter(target=>world.camera.contextTargets?.includes(target.id)).map(targetPoint);
  fitSceneCamera(camera,world.camera,width,height,focus?targetPoint(focus):null,undefined,context);
  camera.updateMatrixWorld(true);return camera;
}
function objectOf(world,name) {
  const object=world.root.getObjectByName(name);assert.ok(object,'missing '+name);return object;
}
function boundsOf(world,name) {
  world.root.updateMatrixWorld(true);return new THREE.Box3().setFromObject(objectOf(world,name),true);
}
function hashValues(values) {
  let hash=2166136261;
  for(const value of values)hash=Math.imul(hash^Math.round(value*1000000),16777619);
  return hash>>>0;
}
function physicalSnapshot(world) {
  world.update(0,0,{reducedMotion:true});world.root.updateMatrixWorld(true);
  const shapes=new Map(),pieces=[],instance=new THREE.Matrix4(),matrix=new THREE.Matrix4(),color=new THREE.Color();
  world.root.traverse(object=>{
    if(!object.isMesh)return;
    if(!shapes.has(object.geometry))shapes.set(object.geometry,[
      object.geometry.attributes.position.count,
      hashValues(object.geometry.attributes.position.array),
      object.geometry.index?hashValues(object.geometry.index.array):0
    ]);
    for(let i=0;i<(object.isInstancedMesh?object.count:1);i++) {
      if(object.isInstancedMesh) {
        object.getMatrixAt(i,instance);object.getColorAt(i,color);matrix.multiplyMatrices(object.matrixWorld,instance);
      } else {matrix.copy(object.matrixWorld);color.copy(object.material.color);}
      pieces.push(JSON.stringify([shapes.get(object.geometry),color.getHex(),object.material.opacity,
        matrix.elements.map(value=>Math.round(value*1000000))]));
    }
  });
  return pieces.sort();
}

test('every available simplified-room action has a unique unobstructed physical target',t=>{
  let rays=0,maxDraws=0,maxTriangles=0;
  for(const view of cases) {
    const world=buildWorld(THREE,view);
    try {
      const ids=world.targets.map(target=>target.id);
      assert.deepEqual(ids.slice().sort(),view.availableActions.slice().sort(),'target set in '+view.location);
      assert.equal(new Set(ids).size,ids.length);
      let draws=0,triangles=0;
      world.root.traverse(object=>{
        if(!object.isMesh)return;
        object.geometry.computeBoundingSphere();assert.ok(Number.isFinite(object.geometry.boundingSphere.radius));
        draws++;triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3*(object.count??1);
      });
      maxDraws=Math.max(maxDraws,draws);maxTriangles=Math.max(maxTriangles,triangles);
      for(const reducedMotion of[false,true]) {
        world.update(8,.016,{reducedMotion});world.root.updateMatrixWorld(true);
        for(const target of world.targets) {
          const origin=new THREE.Vector3(...world.camera.position),ray=new THREE.Raycaster();
          ray.set(origin,targetPoint(target).sub(origin).normalize());
          assert.equal(hitSceneTarget(ray,world.root,world.targets)?.id,target.id,'occluded '+target.id+' in '+view.location);
          rays++;
        }
      }
    } finally {world.dispose();}
    assert.equal(world.root.children.length,0);
  }
  t.diagnostic(cases.length+' simplified views, '+rays+' direct action rays, max '+maxDraws+' draw batches / '+Math.ceil(maxTriangles)+' triangles');
});

test('tea/window and standing/seated table views use identical physical geometry for the same flags',()=>{
  const teaPairs=[{tea:true,window:true},{tea:true,window:true,seated:true,chest:true,photo:true,writing:true}];
  for(const flags of teaPairs) {
    const tea=buildWorld(THREE,fixture('tea',cases[6].availableActions,flags)),
      window=buildWorld(THREE,fixture('window',cases[7].availableActions,flags));
    try {assert.deepEqual(physicalSnapshot(tea),physicalSnapshot(window),'looking at the window rebuilt the room');}
    finally {tea.dispose();window.dispose();}
  }
  for(const extra of[{}, {chest:true}, {chest:true,photo:true}, {chest:true,photo:true,writing:true}]) {
    const flags={tea:true,window:true,seated:true,...extra};
    const standingActions=['sit','returntea',...(flags.chest?['photo']:[])];
    const seatedActions=['returnroom','returntea','chest','cup',...(flags.chest?['photo']:[])];
    const standing=buildWorld(THREE,fixture('treasure',standingActions,flags)),
      seated=buildWorld(THREE,fixture('ending',seatedActions,flags));
    try {assert.deepEqual(physicalSnapshot(standing),physicalSnapshot(seated),'sitting rearranged the table room');}
    finally {standing.dispose();seated.dispose();}
  }
});

test('permanent openings retain canonical coordinates and returning creates no new door',()=>{
  for(const view of[cases[6],cases[7]]) {
    const world=buildWorld(THREE,view);
    try {
      assert.deepEqual(objectOf(world,'tea-hall-passage').position.toArray(),[-2.72,0,-1.65]);
      assert.deepEqual(objectOf(world,'tea-outside-passage').position.toArray(),[-1.06,0,-1.65]);
      assert.equal(objectOf(world,'tea-window').position.x,1.76);
      assert.ok(Math.abs(objectOf(world,'tea-window').position.z-(-1.65))<.002);
      assert.equal(world.root.getObjectByName('returntea-passage'),undefined);
      if(view.location==='window')assert.equal(world.targets.find(target=>target.id==='returntea').object.name,'tea-window');
    } finally {world.dispose();}
  }
  for(const view of[cases[8],cases[9],cases[12],cases[13]]) {
    const world=buildWorld(THREE,view);
    try {
      assert.deepEqual(objectOf(world,'table-window').position.toArray(),[.32,0,-1.73]);
      assert.deepEqual(objectOf(world,'table-entry-passage').position.toArray(),[-2.85,0,-1.63]);
      assert.deepEqual(objectOf(world,'table').position.toArray(),[-.43,0,.06]);
      assert.equal(world.targets.find(target=>target.id==='returntea').object.name,'table-entry-passage');
      if(view.location==='ending')assert.equal(world.targets.find(target=>target.id==='returnroom').object.name,'table');
      assert.equal(world.root.getObjectByName('returnroom-passage'),undefined);
    } finally {world.dispose();}
  }
});

test('the small chest is always on the tabletop, opens only while seated, and reveals a tabletop letter in front',()=>{
  const standing=buildWorld(THREE,cases[8]),closed=buildWorld(THREE,cases[9]),open=buildWorld(THREE,cases[11]);
  try {
    const chest=boundsOf(closed,'table-chest'),size=chest.getSize(new THREE.Vector3());
    assert.ok(Math.abs(Math.max(size.x,size.y,size.z)-.32)<.00001,'box should be 0.32 units');
    assert.ok(Math.abs(chest.min.y-.778)<.00001,'box must sit on the tabletop');
    assert.ok(objectOf(standing,'table-chest'));
    assert.equal(standing.targets.some(target=>target.id==='chest'),false);
    assert.equal(closed.targets.some(target=>target.id==='chest'),true);
    assert.equal(closed.root.getObjectByName('table-letter'),undefined);
    assert.equal(objectOf(closed,'chest-lid').rotation.x,0);
    assert.equal(objectOf(open,'chest-lid').rotation.x,-1.8);
    const openedBox=boundsOf(open,'table-chest'),letter=boundsOf(open,'table-letter');
    assert.ok(Math.abs(letter.min.y-.779)<.00001,'letter must rest on the same table');
    assert.ok(letter.min.z>openedBox.max.z+.02,'letter must lie directly in front of the box');
    assert.ok(letter.min.x>=-1.4&&letter.max.x<=.54&&letter.min.z>=-.405&&letter.max.z<=.525,'letter left the tabletop');
    assert.deepEqual(boundsOf(closed,'chest-body').min.toArray(),boundsOf(open,'chest-body').min.toArray());
    assert.deepEqual(boundsOf(closed,'chest-body').max.toArray(),boundsOf(open,'chest-body').max.toArray());
  } finally {standing.dispose();closed.dispose();open.dispose();}
});

test('removed room actions stay absent and chairs, tap and bench remain still',()=>{
  const removed=['chair','tap','towel','fish','plates','room','bath','cardboard','fold','turnphoto'];
  for(const view of cases) {
    const world=buildWorld(THREE,view);
    try {
      for(const id of removed)assert.equal(world.targets.some(target=>target.id===id),false,'removed action '+id);
      assert.equal(world.root.getObjectByName('wet-effect'),undefined);
      assert.equal(world.root.getObjectByName('bench-shim'),undefined);
      const names=view.room==='tea'?['tea-chair','tea-tap']:view.room==='table'?['table-bench','table-back-chair','table-left-chair','table-right-chair']:[];
      function snapshot(time) {
        world.update(time,.016,{reducedMotion:false});world.root.updateMatrixWorld(true);
        return names.flatMap(name=>{
          const matrices=[];objectOf(world,name).traverse(object=>matrices.push(...object.matrixWorld.elements));return matrices;
        });
      }
      assert.deepEqual(snapshot(.19),snapshot(8.71),'furniture moved in '+view.location);
    } finally {world.dispose();}
  }
});

test('useful initial actions fit portrait, desktop and short landscape without moving the camera',()=>{
  for(const view of cases) {
    const world=buildWorld(THREE,view);
    try {
      world.root.updateMatrixWorld(true);
      for(const[width,height]of screens) {
        const camera=fittedCamera(world,width,height,view.focusAction);
        const useful=new Set([...world.camera.contextTargets,view.focusAction]);
        for(const target of world.targets.filter(target=>useful.has(target.id))) {
          const p=targetPoint(target).project(camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;
          assert.ok(p.z>=-1&&p.z<=1&&x>=20&&x<=width-20&&y>=20&&y<=height-20,
            target.id+' outside initial '+view.location+' '+width+'x'+height);
        }
        assert.deepEqual(camera.position.toArray(),world.camera.position);
      }
    } finally {world.dispose();}
  }
});

test('all optional objects and the original return doorway remain reachable with head looking',()=>{
  const up=new THREE.Vector3(0,1,0);
  for(const view of cases) {
    const world=buildWorld(THREE,view);
    try {
      world.root.updateMatrixWorld(true);
      for(const[width,height]of[[390,844],[844,390]]) {
        const camera=fittedCamera(world,width,height,view.focusAction),base=new THREE.Vector3(...world.camera.target).sub(camera.position),found=new Set();
        for(let i=0;i<=12;i++)for(let j=0;j<=8;j++) {
          const yaw=(i/12*2-1)*world.camera.dragLimit,pitch=(j/8*2-1)*world.camera.pitchLimit;
          const direction=base.clone().applyAxisAngle(up,yaw),right=new THREE.Vector3().crossVectors(direction,up).normalize();
          direction.applyAxisAngle(right,pitch);camera.lookAt(camera.position.clone().add(direction));camera.updateMatrixWorld(true);
          for(const target of world.targets) {
            const point=targetPoint(target).project(camera);
            if(Math.abs(point.x)<.97&&Math.abs(point.y)<.97&&point.z>-1&&point.z<1)found.add(target.id);
          }
        }
        for(const target of world.targets)assert.ok(found.has(target.id),'unreachable '+view.location+' '+target.id);
      }
    } finally {world.dispose();}
  }
});

test('reward flags keep camera poses fixed and every indoor pose retains complete ceilings and side walls',()=>{
  const initial=new Map();
  for(const view of cases) {
    const world=buildWorld(THREE,view);
    try {
      assert.equal(world.camera.fov,64);assert.equal(world.camera.maxHorizontalFov,88);assert.equal(world.camera.pitchLimit,.28);
      assert.equal(world.camera.dragLimit,['front','back'].includes(view.location)?.65:.55);
      assert.equal(world.camera.position[1],view.location==='ending'?1.24:1.62);
      const pose={position:world.camera.position,target:world.camera.target};
      if(initial.has(view.location))assert.deepEqual(pose,initial.get(view.location),'reward forced camera movement');
      else initial.set(view.location,pose);
      if(['front','back'].includes(view.location))continue;
      world.root.updateMatrixWorld(true);
      const origin=new THREE.Vector3(...world.camera.position);
      for(const direction of[[0,1,0],[-1,0,0],[1,0,0]]) {
        const hit=new THREE.Raycaster(origin,new THREE.Vector3(...direction)).intersectObject(world.root,true)[0];
        assert.ok(hit&&hit.distance<15,'unfinished '+view.location+' boundary');
      }
    } finally {world.dispose();}
  }
});

test('the seated outside shoe pair stays readable and unobstructed with every tabletop reward',()=>{
  for(const view of cases.filter(view=>view.location==='ending')) {
    const world=buildWorld(THREE,view);
    try {
      world.root.updateMatrixWorld(true);
      const shoes=world.root.getObjectsByProperty('name','shoe');assert.equal(shoes.length,2);
      const corners=shoes.flatMap(shoe=>[-.091,.091].flatMap(x=>[.011,.166].flatMap(y=>
        [-.167,.203].map(z=>new THREE.Vector3(x,y,z).applyMatrix4(shoe.matrixWorld)))));
      for(const[width,height]of screens) {
        const camera=fittedCamera(world,width,height,view.focusAction),points=corners.map(corner=>corner.clone().project(camera));
        const xs=points.map(p=>(p.x+1)*width/2),ys=points.map(p=>(1-p.y)*height/2),minimum=Math.min(36,width*.10,height*.05);
        assert.ok(Math.min(...xs)>=16&&Math.max(...xs)<=width-16&&Math.min(...ys)>=16&&Math.max(...ys)<=height-16,'cropped seated shoes');
        assert.ok(Math.max(...xs)-Math.min(...xs)>=minimum,'shoe pair too small');
        assert.ok(Math.max(...ys)-Math.min(...ys)>=minimum*.4,'shoe silhouette too thin');
        for(const shoe of shoes) {
          const center=new THREE.Vector3(0,.12,.025).applyMatrix4(shoe.matrixWorld),ray=new THREE.Raycaster();
          ray.setFromCamera(center.clone().project(camera),camera);
          const first=ray.intersectObject(world.root,true).find(hit=>!(hit.object.material.transparent&&hit.object.material.opacity<.5&&!hit.object.material.depthWrite));
          assert.ok(first&&first.point.distanceTo(center)<.12,'scenery covers an outside shoe');
        }
      }
    } finally {world.dispose();}
  }
});

test('key and tea rewards change the existing objects while preserving the room topology',()=>{
  const keyWorld=buildWorld(THREE,cases[1]),before=buildWorld(THREE,cases[4]),tea=buildWorld(THREE,cases[5]),hall=buildWorld(THREE,cases[6]);
  try {
    assert.ok(Math.abs(boundsOf(keyWorld,'key').min.y-.101)<.002);
    assert.equal(objectOf(keyWorld,'key').userData.importedMesh,true);
    assert.equal(before.root.getObjectByName('amber-tea'),undefined);
    assert.ok(tea.root.getObjectByName('amber-tea'));assert.ok(tea.root.getObjectByName('tea-steam'));
    assert.equal(objectOf(before,'tea-window-sash').rotation.y,0);
    assert.equal(objectOf(tea,'tea-window-sash').rotation.y,.62);
    assert.equal(objectOf(tea,'tea-hall-door').rotation.y,0);
    assert.ok(Math.abs(objectOf(hall,'tea-hall-door').rotation.y-1.12)<1e-12);
    for(const name of['tea-chair','tea-table','tea-sink','tea-window','tea-hall-passage','tea-outside-passage'])
      assert.deepEqual(objectOf(before,name).position.toArray(),objectOf(hall,name).position.toArray(),'reward relocated '+name);
  } finally {for(const world of[keyWorld,before,tea,hall])world.dispose();}
});

test('all seven imported assets remain physical and window miniatures exist in both views',()=>{
  for(const[view,expected]of[[cases[1],['key']],[cases[4],['teapot','flower','boat','jar','star']],[cases[7],['teapot','flower','boat','jar','star']],[cases[8],['chest']]]) {
    const world=buildWorld(THREE,view);
    try {
      const imported=[];world.root.traverse(object=>{if(object.userData.importedMesh)imported.push(object.userData.modelAsset);});
      assert.deepEqual(imported.slice().sort(),expected.slice().sort());
      if(view.room==='tea') {
        let transparentGlass=false;
        world.root.traverse(object=>{if(object.isMesh&&object.material.transparent&&object.material.opacity===.6)transparentGlass=true;});
        assert.ok(transparentGlass,'jar glass lost its transparent material');
      }
    } finally {world.dispose();}
  }
});

test('unavailable actions never acquire circles while the same physical props remain visible',()=>{
  for(const view of[fixture('front',['sidepath']),fixture('tea',['cup']),fixture('window',['returntea'],{tea:true,window:true}),fixture('ending',['returnroom'],{seated:true})]) {
    const world=buildWorld(THREE,view);
    try {assert.deepEqual(world.targets.map(target=>target.id),view.availableActions);}
    finally {world.dispose();}
  }
});

test('simplified scenes release all rendered resources and respect reduced motion',()=>{
  for(const view of[cases[6],cases[7],cases[11]]) {
    const world=buildWorld(THREE,view),resources=new Set(),released=new Set();
    world.root.traverse(object=>{
      if(!object.isMesh)return;
      resources.add(object.geometry);resources.add(object.material);
      if(object.material.map)resources.add(object.material.map);
      if(object.isInstancedMesh)resources.add(object);
    });
    for(const resource of resources)resource.addEventListener('dispose',()=>released.add(resource));
    function snapshot(time) {
      world.update(time,.016,{reducedMotion:true});world.root.updateMatrixWorld(true);
      const out=[];world.root.traverse(object=>out.push(...object.matrixWorld.elements));return out;
    }
    assert.deepEqual(snapshot(1),snapshot(100));
    world.dispose();assert.equal(released.size,resources.size);assert.equal(world.root.children.length,0);
  }
});

function colorBounds(world,tint) {
  const bounds=new THREE.Box3(),matrix=new THREE.Matrix4(),instance=new THREE.Matrix4(),color=new THREE.Color(),point=new THREE.Vector3();
  let pieces=0;world.root.updateMatrixWorld(true);
  world.root.traverse(object=>{
    if(!object.isMesh)return;
    for(let i=0;i<(object.isInstancedMesh?object.count:1);i++) {
      if(object.isInstancedMesh) {object.getColorAt(i,color);object.getMatrixAt(i,instance);matrix.multiplyMatrices(object.matrixWorld,instance);}
      else {color.copy(object.material.color);matrix.copy(object.matrixWorld);}
      if(color.getHex()!==tint)continue;
      for(let vertex=0;vertex<object.geometry.attributes.position.count;vertex++)
        bounds.expandByPoint(point.fromBufferAttribute(object.geometry.attributes.position,vertex).applyMatrix4(matrix));
      pieces++;
    }
  });
  assert.ok(pieces>0);return bounds;
}
test('static chairs stay grounded and keep clearance from luggage and the tea desk',()=>{
  for(const view of[cases[0],cases[4],cases[7]]) {
    const world=buildWorld(THREE,view);
    try {
      const front=view.location==='front',chair=colorBounds(world,front?0x496e91:0x8b8d77),other=colorBounds(world,front?0x89775b:0x9a8669);
      assert.ok(Math.abs(chair.min.y-(-.009))<1e-6);
      assert.equal(chair.intersectsBox(other),false);
      assert.ok(front?chair.min.x-other.max.x>=.10:other.min.x-chair.max.x>=.12);
    } finally {world.dispose();}
  }
});


