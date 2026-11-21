// Room 04. Original, locally built geometry. +Y is up and openings face +Z.
const PI=Math.PI;
const C={
  sky:0xeaece6, white:0xe2e1d8, cream:0xe1d9c5, band:0xb1c0a9, trim:0xdad5c6,
  roof:0x597563, roofSeam:0x657e6c, roofEdge:0x456050, wood:0x957253,
  chair:0x496e91, chairEdge:0x5c7e9b, agedDoor:0xa8afa0, deep:0x454e46,
  cement:0xbdbdb2, grass:0xa6aa86, worn:0xb4b497, metal:0x888d84,
  glass:0xb6c5bd, water:0x8bb5ab, grout:0xa2b3a9, tile:0xc0cbc1,
  paper:0xe6dfce, terracotta:0xad8268
};
function workshop(T) {
  const root = new T.Group();
  const geometries = new Map();
  const paints = new Map();
  const textures = new Set();
  const targets = [];
  const motions = [];
  const liveGroups = new Set([root]);
  const disposedInstances = [];
  const color = new T.Color();
  const neutral = new T.MeshStandardMaterial({color:0xffffff, roughness:0.92});
  const geometry = (key, make) => {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key);
  };
  function group(parent, x=0, y=0, z=0) {
    const obj = new T.Group();
    obj.position.set(x,y,z);
    parent.add(obj);
    return obj;
  }
  function form(parent, geo, tint, x,y,z,sx=1,sy=1,sz=1) {
    if (!paints.has(tint)) paints.set(tint, new T.MeshStandardMaterial({color:tint, roughness:0.92}));
    const obj = new T.Mesh(geo, paints.get(tint));
    obj.position.set(x,y,z);
    obj.scale.set(sx,sy,sz);
    obj.castShadow = obj.receiveShadow = true;
    parent.add(obj);
    return obj;
  }
  const boxGeo = geometry('box',()=>new T.BoxGeometry(1,1,1));
  const ballGeo = geometry('ball',()=>new T.SphereGeometry(1,14,10));
  const box = (p,x,y,z,w,h,d,c) => form(p,boxGeo,c,x,y,z,w,h,d);
  const ball = (p,x,y,z,w,h,d,c) => form(p,ballGeo,c,x,y,z,w,h,d);
  function cylinder(p,x,y,z,top,bottom,h,c,n=16) {
    const ratio = bottom ? top/bottom : 0;
    const geo = geometry('c'+ratio+'/'+n,()=>new T.CylinderGeometry(ratio,1,1,n));
    return form(p,geo,c,x,y,z,bottom,h,bottom);
  }
  function ring(p,x,y,z,r,thick,c) {
    const ratio = thick/r;
    const geo = geometry('ring'+ratio,()=>new T.TorusGeometry(1,ratio,7,28));
    const obj = form(p,geo,c,x,y,z,r,r,r);
    obj.rotation.x=-PI/2;
    return obj;
  }
  function rod(p,from,to,r,c,n=8) {
    const a = new T.Vector3(...from), b = new T.Vector3(...to);
    const diff = b.clone().sub(a);
    const mid = a.addScaledVector(diff,0.5);
    const obj = cylinder(p,mid.x,mid.y,mid.z,r,r,diff.length(),c,n);
    obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),diff.normalize());
    return obj;
  }
  function extrusion(p,shape,key,depth,c) {
    const geo = geometry(key,()=>new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:6}));
    return form(p,geo,c,0,0,0);
  }
  function rounded(p,x,y,z,w,h,d,r,c) {
    const s = new T.Shape(), a=w/2, b=d/2;
    s.moveTo(-a+r,-b); s.lineTo(a-r,-b); s.quadraticCurveTo(a,-b,a,-b+r);
    s.lineTo(a,b-r); s.quadraticCurveTo(a,b,a-r,b);
    s.lineTo(-a+r,b); s.quadraticCurveTo(-a,b,-a,b-r);
    s.lineTo(-a,-b+r); s.quadraticCurveTo(-a,-b,-a+r,-b);
    const o=extrusion(p,s,['round',w,h,d,r].join(','),h,c);
    o.rotation.x=-PI/2; o.position.set(x,y-h/2,z); return o;
  }
  function mark(id,label,object,at) {
    liveGroups.add(object);
    targets.push({id,label,object,local:new T.Vector3(...at)});
    return object;
  }
  function animate(object,run) {
    liveGroups.add(object);
    motions.push(run);
  }
  function houseNumber(parent,x,y,z) {
    const g=group(parent,x,y,z);
    if (typeof document === 'undefined') {
      box(g,0,0,0,.21,.15,.008,C.agedDoor);
      return g;
    }
    const canvas=document.createElement('canvas');
    canvas.width=256;
    canvas.height=160;
    const ctx=canvas.getContext('2d');
    if (!ctx) return g;
    ctx.font='500 116px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#878e80';ctx.fillText('04',127,85);
    ctx.fillStyle='#b0b6a7';ctx.fillText('04',130,83);
    const texture=new T.CanvasTexture(canvas);
    texture.colorSpace=T.SRGBColorSpace;textures.add(texture);
    const material=new T.MeshStandardMaterial({map:texture,transparent:true,roughness:1,
      polygonOffset:true,polygonOffsetFactor:-2,side:T.DoubleSide});
    paints.set(material,material);
    const mesh=new T.Mesh(geometry('number face',()=>new T.PlaneGeometry(.40,.25)),material);
    g.add(mesh);
    return g;
  }
  // Make quiet architectural surfaces read as plaster, water or cement. The
  // repeat is measured in world units so the grain stays small in a close view.
  const surfacePaints=new Map();
  function surface(parent,kind,tint,x,y,z,w,h,horizontal=false) {
    const key=kind+tint;
    if (!surfacePaints.has(key)) {
      const size=128, pixels=new Uint8Array(size*size*4);
      let seed=38171;
      for(let row=0;row<size;row++) for(let col=0;col<size;col++) {
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const grain=(seed/4294967296-.5)*(kind==='water'?3:12);
        const line=kind==='water' ? 3*Math.sin(2*PI*row/size*5+1.2*Math.sin(col*2*PI/size)) : 0;
        const val=Math.round(242+grain+line);
        const i=(row*size+col)*4;
        pixels.set([val,val,val,255],i);
      }
      const map=new T.DataTexture(pixels,size,size);
      map.wrapS=map.wrapT=T.RepeatWrapping;map.magFilter=T.LinearFilter;
      map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
      textures.add(map);
      const mat=new T.MeshStandardMaterial({map,color:tint,roughness:kind==='water'?.28:1,
        side:T.DoubleSide,transparent:kind==='water',opacity:kind==='water'?.49:1,depthWrite:kind!=='water'});
      paints.set(mat,mat);surfacePaints.set(key,mat);
    }
    const geo=geometry('surface'+[w,h],()=>{
      const geo=new T.PlaneGeometry(w,h);
      const uv=geo.attributes.uv;
      for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*w,uv.getY(i)*h);
      return geo;
    });
    const mesh=new T.Mesh(geo,surfacePaints.get(key));
    mesh.position.set(x,y,z);if(horizontal) mesh.rotation.x=-PI/2;
    mesh.receiveShadow=true;parent.add(mesh);
    return mesh;
  }
  function sheet(parent,key,points,indices,tint) {
    const geo=geometry(key,()=>{
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(indices);
      g.computeVertexNormals();return g;
    });
    return form(parent,geo,tint,0,0,0);
  }
  function hose(parent,points,r,tint) {
    const curve=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a)));
    const geo=geometry('hose'+points.length,()=>new T.TubeGeometry(curve,64,r,8,false));
    return form(parent,geo,tint,0,0,0);
  }
  function finish() {
    root.updateMatrixWorld(true);
    for(const item of targets) {
      item.anchor=item.object.localToWorld(item.local.clone());
    }
    // One instanced batch per primitive and moving/interactive parent. Raycasts
    // still reach the original target parent through the visible instance.
    for(const holder of liveGroups) {
      const batches = new Map();
      const inverse = holder.matrixWorld.clone().invert();
      function collect(node) {
        for (const child of [...node.children]) {
          if (liveGroups.has(child)) continue;
          if (child.isMesh && !child.material.map) {
            if (!batches.has(child.geometry)) batches.set(child.geometry,[]);
            batches.get(child.geometry).push(child);
          } else collect(child);
        }
      }
      collect(holder);
      for(const [geo,meshes] of batches) {
        const inst=new T.InstancedMesh(geo,neutral,meshes.length);
        inst.receiveShadow=inst.castShadow=true;
        meshes.forEach((m,i)=>{
          inst.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld));
          color.copy(m.material.color);
          inst.setColorAt(i,color);
          m.removeFromParent();
        });
        inst.computeBoundingSphere();
        holder.add(inst); disposedInstances.push(inst);
      }
    }
  }
  function dispose() {
    disposedInstances.forEach(obj=>obj.dispose());
    geometries.forEach(obj=>obj.dispose());
    paints.forEach(obj=>obj.dispose());
    textures.forEach(obj=>obj.dispose());
    neutral.dispose();
    root.clear();
  }
  return {T,root,group,form,box,ball,cylinder,ring,rod,rounded,extrusion,mark,animate,houseNumber,surface,sheet,hose,targets,finish,dispose,
    update(t,dt,{reducedMotion=false}={}){for(const motion of motions) motion(reducedMotion?0:t);}};
}


function ground(k,object,level){
  object.updateWorldMatrix(true,true);
  object.position.y+=level-new k.T.Box3().setFromObject(object,true).min.y;
  return object;
}

function chair(k,parent,x,y,z,angle=0,tint=C.chair) {
  const g=k.group(parent,x,y,z);
  g.rotation.y=angle;
  // One-piece molded chair with open back, flared feet and a thick seat lip.
  for(const side of [-1,1]) {
    for(const end of [-1,1]) {
      k.rod(g,[side*.235,.445,end*.20],[side*.29,.016,end*.265],.032,tint);
    }
    k.rod(g,[side*.227,.42,-.18],[side*.247,.925,-.284],.031,tint);
  }
  k.rounded(g,0,.448,0,.565,.066,.52,.071,tint);
  for(const lateral of [-.139,0,.139]) {
    const slat=k.box(g,lateral,.721,-.233,.05,.34,.037,tint);
    slat.rotation.x=-.20;
  }
  const crest=k.rounded(g,0,.908,-.278,.546,.118,.064,.027,tint);
  crest.rotation.x-=.14;
  if(tint===C.chair) {
    k.rod(g,[.10,.933,-.236],[.151,.918,-.235],.0034,0xe0e2d9);
    k.rod(g,[.151,.918,-.235],[.169,.900,-.232],.0034,0xe0e2d9);
  }
  return g;
}

function sash(k,parent,x,y,z,w,h,angle=0,glazed=true) {
  const g=k.group(parent,x-w/2,y,z);
  g.rotation.y=angle;
  const frame=.046;
  for(const side of [frame/2,w-frame/2]) k.box(g,side,0,0,frame,h,.069,C.trim);
  for(const level of [-(h-frame)/2,(h-frame)/2]) k.box(g,w/2,level,0,w,frame,.069,C.trim);
  if(glazed) k.box(g,w/2,0,-.033,w-.07,h-.07,.012,C.glass);
  k.box(g,w*.5,0,0,.027,h,.04,C.trim);
  k.box(g,w*.89,-.06,.048,.056,.026,.03,C.metal);
  return g;
}

function openingTrim(k,p,x,z,width,bottom,top,tint=C.trim) {
  const g=k.group(p,x,0,z);
  for(const side of [-1,1]) k.box(g,side*(width/2+.044),(bottom+top)/2,.012,.088,top-bottom+.10,.10,tint);
  k.box(g,0,top+.038,.012,width+.17,.076,.10,tint);
  return g;
}

// A wall built around actual holes keeps sightlines through doors and windows.
function perforatedWall(k,p,start,end,z,height,holes,indoors=true) {
  const xs=[start,end],ys=[0,height];
  if(indoors) ys.push(1.01);
  for(const {x,w,b,t} of holes) { xs.push(x-w/2,x+w/2);ys.push(b,t); }
  const sorted=a=>[...new Set(a)].sort((u,v)=>u-v);
  const xx=sorted(xs), yy=sorted(ys);
  for(let i=1;i<xx.length;i++) for(let j=1;j<yy.length;j++) {
    const l=xx[i-1],r=xx[i],b=yy[j-1],t=yy[j];
    const x=(l+r)/2,y=(t+b)/2;
    if(holes.some(h=>Math.abs(x-h.x)<h.w/2 && y>h.b && y<h.t)) continue;
    const color=indoors?(y<1.01?C.band:C.cream):C.white;
    k.box(p,x,y,z,r-l,t-b,.20,color);
    k.surface(p,'plaster',color,x,y,z+.101,r-l,t-b);
    if(indoors && b===0) k.box(p,x,.044,z+.108,r-l,.088,.055,0x929f8f);
  }
}

function wallLeaf(k,parent,x,z,width,height,angle,number=false,paint=C.agedDoor) {
  const hinge=k.group(parent,x-width/2,0,z);
  hinge.rotation.y=angle;
  k.box(hinge,width/2,height/2,0,width,height,.075,paint);
  k.box(hinge,width*.87,.91,.051,.067,.16,.018,C.metal);
  k.rod(hinge,[width*.85,.943,.082],[width*.75,.943,.082],.015,C.deep);
  for(const level of [.30,height-.31]) k.cylinder(hinge,.025,level,.04,.011,.011,.085,C.metal);
  if(number) {
    const erased=k.houseNumber(hinge,width*.52,height*.73,.042);
    k.mark('number','Painted-over 04',erased,[0,0,.003]);
  }
  return hinge;
}

function caseBag(k,p,x,y,z,angle=0) {
  const g=k.group(p,x,y,z);g.rotation.y=angle;
  const leather=0x89775b, seam=0x6c604d;
  k.rounded(g,0,.367,0,.777,.65,.322,.065,leather);
  for(const edge of [-1,1]) {
    k.box(g,edge*.33,.37,.162,.027,.592,.017,seam);
    k.box(g,edge*.33,.37,-.162,.027,.592,.017,seam);
    k.box(g,edge*.33,.694,0,.027,.013,.243,seam);
    k.cylinder(g,edge*.282,.052,.09,.034,.034,.08,C.deep).rotation.z=PI/2;
    k.box(g,edge*.11,.742,0,.026,.092,.045,C.deep);
  }
  k.rounded(g,0,.788,0,.244,.031,.054,.013,C.deep);
  // The address side of the paper tag faces the wall.
  const tag=k.box(g,.201,.646,-.18,.115,.204,.009,0xd7c9a7);
  tag.rotation.z=-.22;
  k.rod(g,[.091,.76,-.025],[.188,.728,-.176],.0033,0xb5a88e);
  return g;
}

function fan(k,p,x,y,z) {
  const g=k.group(p,x,y,z);
  k.box(g,0,0,0,.145,.31,.06,0x969d90);
  k.rod(g,[0,-.055,0],[0,.033,.227],.03,0x798578);
  const head=k.group(g,0,.10,.24);
  const blades=k.group(head,0,0,.015);
  for(let i=0;i<3;i++) {
    const arm=k.group(blades);
    arm.rotation.z=i*2*PI/3;
    k.ball(arm,.072,.129,0,.075,.126,.015,0x9aa795).rotation.z=-.55;
  }
  for(const r of [.13,.204,.276]) {
    const grill=k.ring(head,0,0,.053,r,.0058,0x79867b);grill.rotation.x=0;
  }
  for(let i=0;i<12;i++) {
    const a=i*PI/6;
    k.rod(head,[0,0,.087],[.277*Math.cos(a),.277*Math.sin(a),.039],.0038,0x7f8b80);
  }
  k.ball(head,0,0,.086,.048,.048,.021,0xaeb7a7);
  k.rod(g,[.05,-.05,.017],[.073,-.53,.064],.003,0x8b8775);
  const cap=k.cylinder(g,.073,-.55,.065,.026,.029,.023,0x748d87,12);
  cap.rotation.x=PI/2;
  k.animate(head,t=>{head.rotation.y=.46*Math.sin(t*.52);});
  k.animate(blades,t=>{blades.rotation.z=t*3.1;});
  return g;
}

function plankTable(k,p,x,z,w,d,h,tint=C.wood) {
  const g=k.group(p,x,0,z);
  k.rounded(g,0,h-.023,0,w,.046,d,.016,tint);
  for(const side of [-1,1]) {
    k.box(g,0,h-.086,side*(d/2-.09),w-.15,.119,.043,tint);
    k.box(g,side*(w/2-.09),h-.086,0,.043,.119,d-.16,tint);
    for(const end of [-1,1]) k.box(g,side*(w/2-.095),(h-.045)/2,end*(d/2-.095),.066,h-.045,.066,tint);
  }
  return g;
}

function cup(k,p,x,y,z,color,handleAngle=0) {
  const g=k.group(p,x,y,z);g.rotation.y=handleAngle;
  k.cylinder(g,0,.061,0,.075,.053,.12,color,24);
  k.cylinder(g,0,.122,0,.067,.067,.003,0x807768,24);
  k.ring(g,0,.124,0,.0705,.005,color);
  const handle=k.ring(g,.080,.071,0,.037,.008,color);
  handle.rotation.x=0;handle.scale.x*=.79;
  return g;
}

function fishPlate(k,p,x,y,z,r=.20) {
  const g=k.group(p,x,y,z);
  k.cylinder(g,0,.015,0,r,r*.78,.03,0xe1ddc9,32);
  k.ring(g,0,.032,0,r*.91,.0034,0x798fa3);
  const fish=k.group(g,0,.034,r*.68);
  fish.scale.setScalar(r/.20);
  k.ball(fish,.008,0,0,.043,.0018,.0135,0x607d96);
  k.sheet(fish,'fish tail',[-.029,.001,0,-.054,.001,.016,-.054,.001,-.016],
    [0,2,1,0,1,2],0x607d96);
  k.cylinder(fish,.029,.002,0,.003,.003,.002,0xe0dcc5,8);
  return g;
}

function exterior(k,v) {
  const rear=v.step>=2, scene=k.root, doorX=rear?.14:-.17;
  const wallEnd=2.56, frontZ=-.35;
  const windows=rear?[-2.15]:[-2.39];
  const openings=[{x:doorX,w:1.13,b:0,t:2.13},
    ...windows.map(x=>({x,w:1.42,b:1.03,t:2.02}))];
  k.surface(scene,'soil',C.grass,0,-.039,0,130,95,true);
  k.surface(scene,'concrete',C.cement,-6,-.009,3.28,17.44,8.12,true);
  // The road crosses the bottom of the composition. Concrete runs right up
  // to the grass at the side of the building with no display base below it.
  k.surface(scene,'road',0x999b92,0,-.020,11.13,125,7.8,true);
  for(const z of [2.7,5.7]) k.box(scene,-6,-.002,z,17.44,.005,.012,0xa8a89c);
  k.box(scene,-1.19,-.001,3.28,.015,.005,8.10,0xa8a89c);
  perforatedWall(k,scene,-7.8,wallEnd,frontZ,2.65,openings,false);
  k.box(scene,wallEnd-.07,1.32,frontZ-2.34,.14,2.64,4.64,C.white);
  k.box(scene,-2.62,.075,frontZ+.12,10.34,.15,.057,0xb9bcb0);
  // Leave the middle of the threshold clear.
  k.box(scene,doorX,.064,frontZ+.19,1.25,.13,.37,0xb2ada0);
  const roof=k.group(scene,-2.59,2.67,frontZ-2.31);
  const run=2.63,rise=1.07,slope=Math.hypot(run,rise),pitch=Math.atan2(rise,run);
  for(const side of [-1,1]) {
    const plane=k.box(roof,0,rise/2,side*run/2,10.94,.105,slope,C.roof);
    plane.rotation.x=side*pitch;
    for(let i=0;i<=40;i++) {
      const rib=k.box(roof,-5.43+i*.27,rise/2+.059,side*run/2,.012,.019,slope,C.roofSeam);
      rib.rotation.x=side*pitch;
    }
  }
  k.box(roof,0,rise+.07,0,10.98,.061,.083,C.roofEdge);
  k.box(roof,0,-.048,run,10.96,.113,.065,0x9da899);
  const end=k.group(scene,wallEnd-.025,2.60,frontZ-2.31);
  const s=new k.T.Shape();s.moveTo(-2.38,0);s.lineTo(2.38,0);s.lineTo(0,1.10);s.closePath();
  const gable=k.extrusion(end,s,'plaster gable',.06,C.white);gable.rotation.y=PI/2;
  k.box(scene,doorX,1.05,frontZ-1.34,2.10,2.17,.09,0x616759);
  k.box(scene,doorX,2.109,frontZ-.60,1.16,.048,1.32,0x676b60);
  k.box(scene,doorX-.61,1.04,frontZ-.66,.12,2.12,1.34,0x7d8274);
  openingTrim(k,scene,doorX,frontZ+.097,1.13,0,2.13,0xc9c9bc);
  const leaf=wallLeaf(k,scene,doorX,frontZ+.13,1.095,2.10,rear?-.87:v.step===1?.40:0,rear,rear?C.agedDoor:0xb5b8a6);
  if(!rear) {
    chair(k,scene,doorX+.47,.055,frontZ-.51,1.37,0x899080);
    k.mark('frontdoor','Front door',leaf,[.75,1.22,.045]);
  }else {
    k.mark('backdoor','Open back door',leaf,[.83,.84,.055]);
  }
  for(const x of windows) {
    openingTrim(k,scene,x,frontZ+.09,1.42,1.03,2.02);
    sash(k,scene,x,1.525,frontZ+.099,1.41,.983,0);
    k.box(scene,x,1.517,frontZ+.149,1.41,.031,.025,C.trim);
    k.box(scene,x,1.00,frontZ+.137,1.60,.074,.20,0xc4c3b6);
  }
  const drainX=rear?-1.09:wallEnd-.08;
  k.rod(scene,[drainX,2.57,frontZ+.18],[drainX,.11,frontZ+.18],.041,0xb4bcad);
  for(const y of [.62,1.91]) k.box(scene,drainX,y,frontZ+.18,.12,.02,.092,0x929e8f);

  const hose=k.group(scene);
  k.hose(hose,[[-5.8,.016,2.88],[-3.9,.017,2.68],[-2.6,.017,3.24],
    [-1.18,.016,3.13],[-.19,.016,2.68],[.86,.019,2.34],[1.78,.018,1.34],
    [2.71,.018,.85],[2.86,.012,-.48],[2.83,.012,-2.67]],.018,0x657861);
  if(!rear) k.mark('hose','Garden hose',hose,[.86,.027,2.34]);
  const path=k.group(scene,3.26,-.029,-1.22);
  k.surface(path,'soil',C.worn,0,.003,0,.89,10.4,true);
  for(let i=0;i<114;i++) {
    const z=((i*79)%113)/113*9.9-5;
    const x=((i*53)%109)/109*1.42-.71;
    const blade=k.box(path,x,.008,z,.012,.007,.04+.033*(i%4),i%3?0xa5a787:0xb6b59a);
    blade.rotation.y=.2+.58*Math.sin(i*3.13);
  }
  if(v.step===1) k.mark('sidepath','Walked-flat grass',path,[.035,.008,1.84]);
  if(!rear) {
    const seat=ground(k,chair(k,scene,-1.39,0,frontZ+.82,-.38),-.009);
    k.mark('chair','Blue plastic chair',seat,[.08,.91,-.242]);
    ground(k,caseBag(k,scene,-2.32,0,frontZ+1.15,-.1),-.009);
  }else {
    k.box(scene,-2.47,.05,frontZ+.46,1.32,.1,.55,0xa9aa9a);
    k.box(scene,1.74,.39,frontZ+.15,.18,.23,.11,0xb8bbb0);
  }
  return rear?{position:[4.75,2.37,12.05],target:[.03,1.24,-.30],width:5.30,height:3.73}
    :v.step===1?{position:[5.65,2.42,11.55],target:[.70,1.40,-.21],width:6.31,height:4.21}
    :{position:[3.48,2.45,12.53],target:[.03,1.81,-.14],width:7.09,height:5.05};
}

function floorGrid(k,p,width,depth,x,z,y,spacing,tint) {
  for(let i=-width/2;i<=width/2;i+=spacing) k.box(p,x+i,y,z,.010,.003,depth,tint);
  for(let j=-depth/2;j<=depth/2;j+=spacing) k.box(p,x,y,z+j,width,.003,.010,tint);
}

function indoorShell(k,p,holes,z=-1.75) {
  perforatedWall(k,p,-9,9,z,3.14,holes);
  // The walls and floor continue beyond the photograph in both directions.
  k.surface(p,'floor',0xc6c6b8,0,-.009,z+7,26,14,true);
  floorGrid(k,p,17,13,0,z+6.5,-.005,.55,0xadafa3);
  k.box(p,0,3.24,z+.65,19,.16,1.61,0xd2cfc1);
}

function towel(k,p,x,y,z,w=.48,angle=0) {
  const g=k.group(p,x,y,z);g.rotation.y=angle;
  for(let i=0;i<3;i++) {
    k.rounded(g,(1-i)*.010,i*.017+.010,(i%2)*.015,w-i*.008,.021,.255,.016,i===1?0xc8c1ab:0xdbd4bd);
    for(const u of [-1,1]) k.box(g,u*(w/2-.05),i*.017+.022,(i%2)*.015,.009,.002,.224,0xb1b098);
  }
  return g;
}

function railingTowel(k,p,x,y,z) {
  const g=k.group(p,x,y,z);
  k.rod(g,[-1.05,.85,0],[1.05,.85,0],.027,C.metal);
  for(const side of [-.91,.91]) k.rod(g,[side,0,0],[side,.85,0],.022,C.metal);
  k.box(g,.13,.61,.038,.57,.49,.039,0xd5cdb4);
  k.box(g,.13,.70,-.035,.57,.33,.041,0xc5bba6);
  k.box(g,.13,.85,0,.57,.036,.11,0xd9d1b9);
  for(const side of [-.10,.36]) k.box(g,side,.604,.059,.010,.47,.005,0xaea98e);
}

function waterFloor(k,p,x,y,z,w,d,spacing=.48) {
  k.surface(p,'tile',C.tile,x,y-.104,z,w,d,true);
  floorGrid(k,p,w,d,x,z,y-.099,spacing,C.grout);
  k.surface(p,'water',C.water,x,y,z,w,d,true);
}

function leftPassage(k,p,x,z,w) {
  const g=k.group(p,x,0,z);
  openingTrim(k,g,0,0,w,0,2.42,0xb4bcae);
  k.box(g,w/2+.02,1.19,-1.77,.13,2.37,3.49,C.cream);
  k.box(g,w/2-.04,.50,-1.77,.034,1,3.49,C.band);
  k.box(g,0,2.49,-1.83,w+.18,.15,3.69,0xd1ccbb);
  // The passage turns left, so its far wall continues across that turn.
  k.box(g,-1.5,1.19,-3.68,w+3.18,2.39,.14,0xc7c4af);
  k.box(g,-1.5,.48,-3.60,w+3.18,.96,.032,0x9ead99);
  k.surface(g,'cement',0xb7beb2,0,.01,-2.30,w,4.5,true);
  for(const depth of [-.38,-1.04,-1.70,-2.36,-3.02]) {
    k.box(g,0,.016,depth,w,.004,.014,0x9da99b);
  }
  k.box(g,w/2-.058,.051,-1.77,.039,.10,3.49,0x8d9c8d);
  // On the left the wall ends early. Its rounded painted reveal cuts across
  // the far wall line, so the way around the corner can be read from here.
  k.box(g,-w/2+.08,1.19,-.62,.16,2.37,1.15,C.cream);
  k.box(g,-w/2+.092,.505,-.62,.163,1.01,1.15,C.band);
  k.cylinder(g,-w/2+.085,.505,-1.18,.081,.081,1.01,C.band);
  k.cylinder(g,-w/2+.085,1.69,-1.18,.081,.081,1.36,C.cream);
  return g;
}

function basin(k,p,x,z,step) {
  const g=k.group(p,x,0,z);
  const ceramic=0xe2e0ce;
  k.box(g,0,.46,-.04,1.60,.88,.60,0xb2b8a9);
  k.box(g,0,.922,-.06,1.67,.056,.74,ceramic);
  k.box(g,-.26,.956,.042,.63,.025,.38,0xb7bdb2);
  k.box(g,-.26,.973,.038,.47,.010,.23,0xc6cbc0);
  k.cylinder(g,-.253,.981,.066,.025,.025,.007,0x787f77);
  // Chrome neck and rotating two-ended tap handle.
  const tap=k.group(g,-.30,.944,-.245);
  for(const [a,b] of [[[0,0,0],[0,.254,0]],[[0,.254,0],[0,.29,.051]],[[0,.29,.051],[0,.29,.186]],[[0,.29,.186],[0,.249,.204]]])
    k.rod(tap,a,b,.019,0x969e96);
  k.cylinder(tap,.12,.040,.018,.044,.050,.08,C.metal);
  k.rod(tap,[.12,.05,.016],[.12,.15,.016],.015,0x90998f);
  const twist=k.group(tap,.12,.144,.016);
  twist.rotation.y=Math.max(0,Math.min(3,step-3))*.79;
  k.rod(twist,[-.087,0,0],[.087,0,0],.012,0x71837d);
  k.ball(twist,-.086,0,0,.021,.016,.017,0x8d9b91);
  k.ball(twist,.086,0,0,.021,.016,.017,0x8d9b91);
  if(step>=3 && step<6) {
    const dripCount=6-step;
    if(step===3) k.rod(tap,[0,.242,.204],[0,.083,.204],.0057,0xb9cfcb);
    for(let i=0;i<dripCount;i++) {
      const drop=k.ball(tap,0,.09+i*.045,.204,.008,.014,.008,0xadc5be);
      k.animate(drop,time=>{drop.position.y=.24-((time*(step===5?.25:.52)+i/dripCount+.21)%1)*.18;});
    }
  }
  // Only part of the blue fish is visible around the lip of the small vessel.
  const dish=fishPlate(k,g,.49,.96,-.071,.161);
  k.cylinder(dish,0,.055,0,.115,.078,.09,0xd4d3bf,24);
  k.cylinder(dish,0,.10,0,.101,.101,.002,0xbabcae,24);
  return {tap,dish,g};
}

function corridor(k,v) {
  const p=k.root, step=v.step, z=-1.75;
  const branch={x:-2.72,w:1.38,b:0,t:2.42};
  const door={x:-1.06,w:.96,b:0,t:2.10};
  const win={x:1.76,w:1.94,b:1.07,t:2.31};
  indoorShell(k,p,[branch,door,win],z);
  const left=leftPassage(k,p,branch.x,z+.10,branch.w);
  if(step===7) k.mark('left','Left corridor',left,[0,1.15,0]);
  openingTrim(k,p,door.x,z+.101,.96,0,2.1);
  wallLeaf(k,p,door.x,z+.12,.93,2.06,step<2?1.14:0,false,0xb5b7a6);
  k.box(p,door.x,1.05,z-1.59,1.24,2.1,.08,0x7d8675);
  k.box(p,door.x,.015,z-.8,1.10,.03,1.65,0xb9b8a6);
  const window=openingTrim(k,p,win.x,z+.099,win.w,win.b,win.t);
  sash(k,window,0,(win.b+win.t)/2,0,win.w,win.t-win.b,0,false);
  k.box(window,0,win.b-.016,.07,win.w+.17,.067,.25,0xcfcbbc);
  if(step===6) k.mark('window','Sink window',window,[win.w/2+.044,1.92,.073]);
  // This second pool is actually below the corridor. Both the upper rail
  // and the lower tiled water remain visible when the sill enters the frame.
  waterFloor(k,p,3.2,-1.42,-14.5,18,12,.65);
  k.box(p,3.2,-.51,-20.5,18,1.78,.16,0xd4d7c9);
  k.box(p,3.2,.48,-20.5,18,.18,.24,0xc0c6b7);
  k.box(p,3.2,-.78,-9.89,18,.18,.59,0xbcbfac);
  for(const x of [-1.76,.76,3.28,5.80]) {
    k.box(p,x,-1.51,-14.5,.077,.008,10.6,0x7c9c98);
    k.box(p,x,-1.50,-18.96,.47,.007,.065,0x7c9c98);
  }
  k.box(p,1.43,-1.1,-9.88,18,.54,.14,0xa4b3a9);
  railingTowel(k,p,.65,-.73,-10.05);
  plankTable(k,p,.16,z+.42,1.16,.60,.78,0x9a8669);
  const blades=fan(k,p,-.04,1.96,z+.136);
  if(step<=2) k.mark('fan','Wall fan',blades,[0,.10,.33]);
  const tape=k.group(p,.39,1.44,z+.116);
  for(const [x,y,a] of [[-.19,.17,-.10],[.14,.17,.14],[-.18,-.09,.06],[.15,-.09,-.12]]) {
    k.box(tape,x,y,0,.052,.049,.006,0xc9ba84).rotation.z=a;
  }
  if(step<=2) k.mark('tape','Yellow tape',tape,[.14,.17,.007]);
  const seat=step===0?chair(k,p,-1.81,.002,-.23,.36,0x8b8d77):
    step===1?chair(k,p,-1.53,0,-.38,.71,0x8b8d77):chair(k,p,-1.45,0,-.95,1.16,0x8b8d77);
  if(step===1) seat.rotation.z=-.085;
  // Settle the actual lowest leg vertex on the tiled floor, including the tilt.
  ground(k,seat,-.009);
  if(step<2) k.mark('chair','Passage chair',seat,[.097,.911,-.235]);
  const sink=basin(k,p,win.x,z+.61,step);
  if(step>=3 && step<=5) k.mark('tap','Tap',sink.tap,[0,.276,.13]);
  if(step>=3 && step<=6) k.mark('pattern','Blue-patterned dish',sink.dish,[.122,.032,-.023]);
  const mug=step<=2?cup(k,p,.58,.784,z+.52,0xc5c5b1,.23):
    step<6?cup(k,sink.g,-.30,.982,-.022,0xc5c5b1,.45):cup(k,sink.g,.18,.953,.17,0xc5c5b1,.59);
  if(step===2) mug.rotation.y=-.45;
  if(step>=2 && step<=6) k.mark('cup','Cup',mug,[0,.115,0]);
  if(step>=3&&step<=5) return {position:[2.96,4.05,6.89],target:[1.70,1.25,-1.17],width:2.10,height:1.55};
  if(step===6) return {position:[3.60,4.69,11.04],target:[1.62,1.56,-1.65],width:2.94,height:2.02};
  if(step===7) return {position:[1.75,2.00,10.8],target:[-2.06,1.07,-1.86],width:3.86,height:2.72};
  return {position:[1.06,2.54,11.8],target:[-.38,1.09,-.94],width:5.58,height:3.16};
}

function curtain(k,p,x,z,width,phase) {
  const g=k.group(p,x,0,z);
  const points=[],indices=[];
  // A flat hem hangs above the water. Width changes along the height, giving
  // the panels the soft gathers of an ordinary curtain on a rod.
  for(let row=0;row<=6;row++) for(let col=0;col<=30;col++) {
    const u=col/30,v=row/6;
    const depth=Math.cos(u*PI*10+phase)*(.031+.014*(1-v));
    points.push((u-.5)*width*(1-.09*v)+.02*Math.sin(v*PI),
      .265+1.94*v+.009*Math.cos(u*PI*6)*(1-v),depth);
    if(row<6&&col<30) {
      const i=row*31+col;
      indices.push(i,i+1,i+31,i+1,i+32,i+31);
    }
  }
  k.sheet(g,'curtain'+width+phase,points,indices,0xdad8cb);
  for(let i=0;i<5;i++) {
    const loop=k.ring(g,(i/4-.5)*width*.87,2.22,0,.03,.0048,0xb4b6a9);
    loop.rotation.x=0;
  }
}

function plant(k,p,x,y,z,kind,scale=1) {
  const g=k.group(p,x,y,z);g.scale.setScalar(scale);
  const colors=[0xb18b70,0xc1beb0,0x9b9b86],c=colors[kind%3];
  k.cylinder(g,0,.117,0,.119,.082,.205,c,24);
  k.cylinder(g,0,.212,0,.130,.125,.042,c,24);
  k.cylinder(g,0,.235,0,.113,.113,.006,0x625947,24);
  for(let i=0;i<7;i++) {
    const a=i*2.41+kind, length=.13+.14*((i*5+kind)%7)/6;
    const end=[Math.cos(a)*length,.29+length*(i%3),Math.sin(a)*length];
    k.rod(g,[0,.23,0],end,.005,0x737e60);
    // Tapered folded leaves, drawn twice so both sides catch the light.
    const holder=k.group(g,...end);holder.rotation.y=-a;holder.rotation.z=(i%3)*.26-.21;holder.rotation.x=.59*Math.sin(a);
    const pts=[-.04,0,0,.055,.044,.035,.165,.061,0,.065,.021,-.038,.078,.061,0];
    const faces=[0,4,1,1,4,2,2,4,3,3,4,0,0,1,4,1,2,4,2,3,4,3,0,4];
    k.sheet(holder,'folded leaf',pts,faces,i%3===1?0x899276:0x748064);
  }
  return g;
}

function footwear(k,p,x,y,z,angle,tint=0x9d9889) {
  const g=k.group(p,x,y,z);g.rotation.y=angle;
  k.rounded(g,0,.030,.018,.181,.037,.369,.077,0x85877d);
  k.ball(g,0,.066,.059,.087,.047,.144,tint);
  k.ball(g,0,.094,-.058,.080,.071,.099,tint);
  k.ball(g,0,.146,-.066,.057,.014,.069,0x676d61);
  k.ball(g,0,.135,-.022,.047,.031,.047,tint);
  for(const loc of [.009,.039,.064]) {
    k.rod(g,[-.036,.129-loc*.18,loc],[.034,.127-loc*.18,loc+.009],.0035,0xccc8b7);
  }
  return g;
}

function pool(k,v) {
  const p=k.root,z=-1.77;
  const panes=[{x:-2.47,w:1.74,b:.76,t:2.14},{x:-.51,w:1.72,b:.76,t:2.14}];
  const portal={x:1.83,w:1.26,b:0,t:2.24};
  perforatedWall(k,p,-8.5,8.5,z,3.14,[...panes,portal]);
  k.box(p,0,3.23,z+.58,17,.15,1.64,0xd2cfc0);
  k.surface(p,'exterior',0xc0c5b0,-2,-.16,-6.12,30,12,true);
  waterFloor(k,p,0,.065,1.52,20,9.8,.38);
  k.box(p,0,.036,z+.13,14,.12,.22,0xb5beb3);
  for(const h of panes) {
    openingTrim(k,p,h.x,z+.097,h.w,h.b,h.t);
    sash(k,p,h.x,1.45,z+.102,h.w,1.38,0,false);
    k.box(p,h.x,.732,z+.181,h.w+.18,.075,.43,0xb8b3a3);
  }
  const rodZ=z+.36;
  k.rod(p,[-3.54,2.235,rodZ],[.48,2.235,rodZ],.015,C.metal);
  curtain(k,p,-3.19,rodZ,.42,.4);
  curtain(k,p,-1.58,rodZ,.29,1.1);
  curtain(k,p,.256,rodZ,.30,1.9);
  const plates=k.group(p,-.71,.773,z+.247);
  k.cylinder(plates,-.34,.012,0,.17,.13,.024,0xb4a48d,24);
  plant(k,plates,-.34,.024,0,0,.81);
  const fish=fishPlate(k,plates,.25,0,0,.215);
  plant(k,plates,.264,.036,0,1,.70);
  k.cylinder(plates,-1.35,.013,.016,.146,.109,.026,0xc5c3b5,24);
  plant(k,plates,-1.35,.027,.016,0,.94);
  k.cylinder(plates,-.85,.003,0,.128,.128,.005,0xc8c2af,32);
  k.mark('plates','Pots and saucers',plates,[-.34,.154,.086]);
  k.mark('fish','Blue fish plate',fish,[.12,.037,.099]);
  const seat=chair(k,p,-.55,.013,-.04,-.25);
  const cloth=v.step===0?towel(k,seat,.007,.50,.033,.42,-.04):
    towel(k,p,.47,.168,.57,.47,.16);
  k.box(p,.47,.062,.59,.85,.208,.48,0xb6b7a9);
  if(v.step===0) k.mark('towel','Folded towel',cloth,[.02,.061,.085]);
  const mug=cup(k,p,.75,.175,.59,0xc5c5b1,.24);
  k.mark('cup','Cup',mug,[0,.114,0]);
  const exit=leftPassage(k,p,portal.x,z+.10,portal.w);
  k.box(p,portal.x,.052,z+.23,portal.w,.08,.33,0xc4c3b2);
  if(v.step===1) k.mark('room','Doorway to the next room',exit,[0,1.12,0]);
  // Dark canvas toes break the surface in the foreground.
  footwear(k,p,-.92,-.023,1.91,2.96);
  footwear(k,p,-.58,-.023,1.86,3.24);
  return v.step===0?{position:[2.32,2.53,10.17],target:[-.60,1.02,-.84],width:5.17,height:3.10}
    :{position:[2.64,2.42,10.45],target:[.39,1.00,-.99],width:5.65,height:3.14};
}

function photographicPrint(k,p,x,y,z,angle=0) {
  const g=k.group(p,x,y,z);g.rotation.y=angle;
  k.box(g,0,0,0,.253,.008,.185,C.paper);
  k.box(g,0,.005,0,.227,.003,.158,0x787b72);
  k.box(g,.069,.007,.002,.052,.002,.15,0xa49882);
  k.box(g,.073,.009,.059,.047,.002,.029,0xbab39d);
  return g;
}

function cardboard(k,p,x,y,z,layers,angle=0) {
  const g=k.group(p,x,y,z);g.rotation.y=angle;
  for(let i=0;i<layers;i++) {
    const w=layers===1?.295:.175,d=layers===1?.14:.119;
    k.box(g,-i*.004,i*.006,0,w,.005,d,i%2?0xb0a183:0xb4a387);
    k.box(g,-i*.004,i*.006,.002+d/2,w-.008,.002,.002,0x928066);
  }
  return g;
}

function bench(k,p,x,z,step) {
  const g=k.group(p,x,0,z);
  const support=0x99816a;
  for(const side of [-1,1]) {
    k.box(g,0,.357,side*.114,1.42,.075,.037,support);
    for(const end of [-1,1]) {
      const short=side===1&&end===1;
      k.box(g,end*.644,short?.239:.224,side*.108,.069,short?.386:.418,.068,support);
    }
  }
  k.rounded(g,0,.437,0,1.55,.07,.33,.021,0xb29d80);
  for(let i=0;i<2;i++) {
    k.rounded(g,-.48,.493+i*.049,.007,.47-i*.025,.061,.349,.031,i===1?0xafab91:0x9b977e);
    k.box(g,-.60,.523+i*.05,.01,.012,.002,.317,0xc2bca2);
  }
  if(step>=1 && step<=4) {
    const amplitude=step===4?.014:.025;
    k.animate(g,t=>{g.rotation.z=-amplitude*(.52+.48*Math.cos(t*2.2));});
  }
  return g;
}

function tableRoom(k,v) {
  const p=k.root,step=v.step,z=-1.73;
  const win={x:.32,w:2.51,b:.80,t:2.28};
  indoorShell(k,p,[win],z);
  openingTrim(k,p,win.x,z+.106,win.w,win.b,win.t);
  sash(k,p,win.x,(win.b+win.t)/2,z+.117,win.w,win.t-win.b,0,false);
  k.box(p,win.x,.763,z+.18,win.w+.20,.082,.38,0xc8c1b0);
  k.surface(p,'yard',C.cement,0,-.028,-7.83,22,12,true);
  k.surface(p,'soil',C.grass,0,-.035,-18.20,55,10,true);
  // A scored joint, a narrow border and the return of the hose continue the
  // exterior ground beyond the sill and give the shoes a place to rest.
  k.box(p,0,-.021,-5.28,16,.005,.023,0x989b8f);
  k.box(p,.73,-.021,-5.40,.019,.005,7.3,0x989b8f);
  k.surface(p,'soil',0xa7aa91,-2.66,-.012,-5.70,1.64,7.8,true);
  k.hose(p,[[-2.68,-.002,-5.51],[-1.71,-.002,-5.85],[-.82,-.002,-6.62],
    [.17,-.002,-6.83],[1.14,-.002,-6.64],[2.93,-.002,-6.97]],.014,0x7c8975);
  // Both heel openings are on the far side; the toes point back at the house.
  footwear(k,p,.09,-.013,-4.89,-.083,0x9d9480);
  footwear(k,p,.33,-.013,-4.84,.045,0x9d9480);
  const tableX=-.43,tableZ=.06,top=.778;
  plankTable(k,p,tableX,tableZ,1.94,.93,top,0xa08466);
  chair(k,p,tableX,-.001,-.80,0,0x969884);
  chair(k,p,tableX-1.20,-.001,.061,PI/2,0x9b8c73);
  chair(k,p,tableX+1.18,-.001,-.02,-PI/2,0x9b8c73);
  const seat=bench(k,p,tableX,.94,step);
  const mug=cup(k,p,tableX+.30,top+.001,.269,0xc5c5b1,.27);
  k.mark('cup','Cup',mug,[0,.114,0]);
  const print=step===0?photographicPrint(k,p,tableX+.693,.012,1.101,.14):
    photographicPrint(k,p,tableX+.59,top+.008,.33,step===1?-.47:-.16);
  if(step===0) k.mark('photo','Photograph beneath the bench',print,[.055,.008,.058]);
  if(step>=1) k.mark(step===1?'turnphoto':'photo','Photograph',print,[.044,.012,.051]);
  if(step<=2) {
    const strip=cardboard(k,p,.83,.809,z+.26,1,-.12);
    if(step===2) k.mark('cardboard','Cardboard on the sill',strip,[.066,.005,.033]);
  }else {
    const folded=step===3?cardboard(k,p,tableX+.71,.015,1.24,1,-.09):
      cardboard(k,p,tableX+.686,.012,1.086,step===4?2:5,step===4?-.4:.06);
    if(step<=4) k.mark('fold','Cardboard at the bench leg',folded,[.046,.006*(step===4?2:1),.040]);
  }
  if(step===5) k.mark('sit','Bench',seat,[.063,.473,.058]);
  if(step===6) return {position:[2.11,5.43,8.82],target:[.33,.99,-1.86],width:3.20,height:2.33};
  if(step===1) return {position:[2.04,3.21,8.21],target:[-.05,.82,.18],width:2.85,height:2.04};
  if(step===3||step===4) return {position:[step===3?2.24:2.81,1.50,8.25],
    target:[.02,.480,.86],width:1.78,height:1.43};
  if(step===2) return {position:[2.39,3.04,10.97],target:[.02,1.01,-.48],width:3.69,height:2.68};
  return {position:[2.57,2.70,10.98],target:[-.38,.88,-.10],width:4.63,height:2.95};
}

export function buildWorld(THREE,view) {
  const k=workshop(THREE);
  const chapters=[exterior,corridor,pool,tableRoom];
  const compose=chapters[Math.max(0,Math.min(3,view.chapter|0))];
  const camera=compose(k,view);
  const frameBounds=(min,max)=>[min[0],max[0]].flatMap(x=>
    [min[1],max[1]].flatMap(y=>[min[2],max[2]].map(z=>[x,y,z])));
  // These story details still matter when there is no interaction on them.
  if(view.chapter===0&&view.step===0)
    camera.context=[...frameBounds([-1.81,-.009,.05],[-.99,1.0,.89]),
      ...frameBounds([-.39,-.009,-.19],[.39,.82,.18]).map(([x,y,z])=>
        [-2.32+x*Math.cos(-.1)+z*Math.sin(-.1),y,.80-x*Math.sin(-.1)+z*Math.cos(-.1)])];
  if(view.chapter===1&&view.step===6)
    camera.context=frameBounds([.70,1.02,-1.56],[2.81,2.36,-1.56]);
  if(view.chapter===2)
    camera.context=[...frameBounds([-.91,.013,-.38],[-.19,.96,.30]),
      ...frameBounds([-1.10,-.023,1.65],[-.40,.17,2.15])];
  if(view.chapter===3&&view.step===6){
    camera.context=frameBounds([-.04,-.013,-5.12],[.46,.16,-4.61]);
    camera.dragLimit=.12;
  }
  k.finish();
  return {root:k.root,targets:k.targets,camera,background:C.sky,update:k.update,dispose:k.dispose};
}
