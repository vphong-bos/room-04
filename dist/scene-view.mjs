// Shared screen framing for the 3D room and its illustrated counterpart.
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function viewportFrame(width, height, insets = {}) {
  return {
    left: Math.min(width * .25, 34 + (insets.left || 0)),
    right: width - Math.min(width * .25, 34 + (insets.right || 0)),
    top: Math.min(height * .45, 34 + (insets.top ?? 64)),
    bottom: height - Math.min(height * .45, 34 + (insets.bottom ?? 36)),
  };
}

function framing(width, height, span, point, insets, context = []) {
  const frame = viewportFrame(width, height, insets);
  const aspect = width / height;
  const points = [...context, ...(point ? [point] : [])];
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
  if (points.length) span = Math.max(span,
    (maxX - minX) / ((frame.right - frame.left) / width) / aspect,
    (maxY - minY) / ((frame.bottom - frame.top) / height));
  const across = span * aspect;
  // Keep the original composition on wide screens; favor the object on phones.
  const weight = clamp((1.3 - aspect) / .6, 0, 1) * .65;
  let x = (point?.x || 0) * weight;
  let y = (point?.y || 0) * weight * .35;
  if (points.length) {
    x = clamp(x, maxX + across / 2 - across * frame.right / width,
      minX + across / 2 - across * frame.left / width);
    y = clamp(y, maxY - span / 2 + span * frame.top / height,
      minY - span / 2 + span * frame.bottom / height);
  }
  return {x, y, across, span, frame};
}

export function fitSceneCamera(camera, config, width, height, focus, insets, context = []) {
  if (!(width > 0 && height > 0)) return null;
  camera.updateMatrixWorld(true);
  const point = focus?.clone().applyMatrix4(camera.matrixWorldInverse);
  const points = context.map(p => p.clone().applyMatrix4(camera.matrixWorldInverse));
  for (const point of config.context || [])
    points.push(camera.position.clone().fromArray(point).applyMatrix4(camera.matrixWorldInverse));
  if (camera.isPerspectiveCamera) {
    const slope = p => ({x:p.x/-p.z,y:p.y/-p.z});
    const visible = points.filter(p => p.z < -camera.near);
    const span=Math.min(2*Math.tan((config.fov||58)*Math.PI/360),
      2*Math.tan((config.maxHorizontalFov||78)*Math.PI/360)*height/width);
    const fit = framing(width,height,span,
      point&&point.z < -camera.near?slope(point):null,insets,visible.map(slope));
    camera.aspect=width/height;
    camera.projectionMatrix.makePerspective(
      (fit.x-fit.across/2)*camera.near,(fit.x+fit.across/2)*camera.near,
      (fit.y+fit.span/2)*camera.near,(fit.y-fit.span/2)*camera.near,
      camera.near,camera.far,camera.coordinateSystem);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    return fit.frame;
  }
  const fit = framing(width,height,config.height||5,point,insets,points);
  camera.left=fit.x-fit.across/2;camera.right=fit.x+fit.across/2;
  camera.top=fit.y+fit.span/2;camera.bottom=fit.y-fit.span/2;
  camera.updateProjectionMatrix();
  return fit.frame;
}

export function fitPaperFrame(width, height, focus, insets, context = []) {
  if (!(width > 0 && height > 0)) return null;
  const point = focus ? {x: focus.x - 600, y: 400 - focus.y} : null;
  const points = context.map(p => ({x: p.x - 600, y: 400 - p.y}));
  const fit = framing(width, height, 800, point, insets, points);
  return {
    x: 600 + fit.x - fit.across / 2,
    y: 400 - fit.y - fit.span / 2,
    width: fit.across, height: fit.span, scale: height / fit.span,
    frame: fit.frame,
  };
}

export function targetPoint(target) {
  return target.local && target.object
    ? target.object.localToWorld(target.local.clone())
    : target.anchor.clone();
}

export function hitSceneTarget(raycaster, root, targets) {
  // Solid non-interactive scenery must occlude objects behind it.
  for (const hit of raycaster.intersectObject(root, true)) {
    const material = Array.isArray(hit.object.material)
      ? hit.object.material[hit.face?.materialIndex || 0] : hit.object.material;
    if (material?.transparent && material.opacity < .5 && !material.depthWrite) continue;
    let object = hit.object;
    while (object) {
      const target = targets.find(item => item.object === object);
      if (target) return target;
      object = object.parent;
    }
    return null;
  }
  return null;
}

export function renderPixelRatio(width, height, deviceRatio = 1) {
  return Math.min(deviceRatio || 1, 1.6, Math.sqrt(2600000 / Math.max(1, width * height)));
}

export function framingContext(config,targets,activeAction){
  if(config.projection!=='perspective')return targets.map(target=>target.anchor);
  const relevant=new Set([activeAction,...(config.contextTargets||[])]);
  return targets.filter(target=>relevant.has(target.id)).map(target=>target.anchor);
}
