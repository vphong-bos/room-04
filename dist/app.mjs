import {initialState, getView, act, serialize, restore} from './game-state.mjs';
import {buildFallback} from './fallback.mjs';
import {interactionHint, gratitudeMessage, messageCardPosition} from './interaction.mjs';
import {fitSceneCamera, fitPaperFrame, targetPoint, hitSceneTarget, renderPixelRatio} from './scene-view.mjs';
import {MODEL_SOURCES} from './model-sources.mjs';
import {eventDates, createCalendar, safeUrl} from './event.mjs';

const $ = (id) => document.getElementById(id);
const config = window.INVITATION || {};
const SAVE_KEY = 'room04:journey:v2';
const PREF_KEY = 'room04:preferences:v1';
const media = matchMedia('(prefers-reduced-motion: reduce)');
let preferences = {sound:false, motion:false, paper:false};
let state = initialState();
try {
  state = restore(localStorage.getItem(SAVE_KEY));
  const stored = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
  for (const key of Object.keys(preferences)) if (typeof stored[key] === 'boolean') preferences[key] = stored[key];
} catch { /* The journey also works without browser storage. */ }
const query = new URLSearchParams(location.search);
if (query.get('paper') === '1') preferences.paper = true;
let THREE, buildWorld, renderer, scene, camera, raycaster, world, view, targets = [];
let pending = false, sceneAge = 0, frameTime = 0, renderNeeded = true, pointerStart = null;
let dragAngle = 0, dragGoal = 0;
let whisperTimer, transitionTimer, photoTimer, focusTimer, cameraAim, cameraGoal, cameraTarget, currentLook;
let webglAvailable = false, letterPrepared = false, restoreSceneFocus = false;
let viewport = {width:0, height:0, insets:{}}, paperFrame, resizeRequest;
let audioContext, ambientTimer, activeOscillators = new Set();
const host = $('world');
const root = $('adventure');

function save() { try { localStorage.setItem(SAVE_KEY, serialize(state)); } catch {} }
function savePreferences() { try { localStorage.setItem(PREF_KEY, JSON.stringify(preferences)); } catch {} }
function quiet() { return media.matches || preferences.motion; }
function announce(message) { if (message) $('announcer').textContent = message; }
function whisper(message, duration=4200) {
  clearTimeout(whisperTimer);
  $('whisper').classList.remove('visible');
  if (!message) return;
  $('whisper').textContent = message;
  requestAnimationFrame(() => $('whisper').classList.add('visible'));
  whisperTimer = setTimeout(() => $('whisper').classList.remove('visible'), duration);
}
function applyPreferences() {
  document.body.classList.toggle('motion-paused', quiet());
  $('motion-toggle').setAttribute('aria-pressed', String(quiet()));
  $('motion-note').hidden = !media.matches;
  $('paper-toggle').setAttribute('aria-pressed', String(preferences.paper || !webglAvailable));
  $('paper-toggle').disabled = !webglAvailable;
  $('sound-toggle').setAttribute('aria-pressed', String(preferences.sound));
  $('sound-toggle').setAttribute('aria-label', preferences.sound ? 'Turn off sound' : 'Turn on sound');
  renderNeeded = true;
}
media.addEventListener('change', applyPreferences);

// A few quiet synthesized sounds; no sound files or autoplay requests.
async function enableAudio() {
  if (!preferences.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') await audioContext.resume();
    clearInterval(ambientTimer);
    let tick=0;
    ambientTimer = setInterval(() => {
      if(document.hidden||!preferences.sound)return;
      tick++;
      if((state.chapter===1||state.chapter===3)&&tick%14===0)sound('fan');
      if(state.chapter===1&&state.step>=3&&state.step<=5&&tick%(state.step-1)===0)tone(780,.12,.004);
    }, 450);
  } catch { preferences.sound=false; applyPreferences(); }
}
function tone(frequency, duration, volume, type='sine') {
  if (!audioContext || !preferences.sound || document.hidden) return;
  const oscillator=audioContext.createOscillator(), gain=audioContext.createGain();
  const now=audioContext.currentTime;
  oscillator.type=type; oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(volume,now+.02);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  oscillator.connect(gain); gain.connect(audioContext.destination);
  oscillator.start(now); oscillator.stop(now+duration+.03); activeOscillators.add(oscillator);
  oscillator.onended=()=>{activeOscillators.delete(oscillator);oscillator.disconnect();gain.disconnect();};
}
function sound(kind) {
  const notes={door:[91,.16,.014,'triangle'],wood:[125,.09,.013,'triangle'],water:[680,.18,.008],paper:[180,.045,.004,'triangle'],cup:[1260,.32,.01],fan:[150,.035,.004,'square'],soft:[95,.09,.004,'triangle']};
  if (notes[kind]) tone(...notes[kind]);
}
$('sound-toggle').addEventListener('click',async()=>{
  preferences.sound=!preferences.sound; applyPreferences(); savePreferences();
  if(preferences.sound){await enableAudio();sound('fan');}
  else {clearInterval(ambientTimer);for(const oscillator of activeOscillators){try{oscillator.stop();}catch{}}}
});
$('motion-toggle').addEventListener('click',()=>{
  if(media.matches)return;
  preferences.motion=!preferences.motion; applyPreferences(); savePreferences();
});

function openDialog(dialog) { if(!dialog.open)dialog.showModal(); }
for(const dialog of document.querySelectorAll('dialog')){
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',(event)=>{
    const r=dialog.getBoundingClientRect();
    if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();
  });
}
$('preferences-button').addEventListener('click',()=>openDialog($('preferences-dialog')));
$('sources-button').addEventListener('click',()=>openDialog($('sources-dialog')));
$('paper-toggle').addEventListener('click',()=>{
  if(!webglAvailable)return;
  preferences.paper=!preferences.paper;savePreferences();applyPreferences();
  $('preferences-dialog').close();installView(getView(state),true);
});
$('restart-button').addEventListener('click',()=>{
  hideGratitude(false);state=initialState();letterPrepared=false;$('letter-body').replaceChildren();save();$('preferences-dialog').close();installView(getView(state));
});

// The writing belongs to the back of the found photograph. It is unsigned.
function buildLetter() {
  if(!getView(state).writingFound)return;
  $('letter-heading').textContent=config.greeting||'';
  $('letter-heading').hidden=!config.greeting;
  $('letter-body').replaceChildren();
  for(const value of Array.isArray(config.letter)?config.letter:[]){const p=document.createElement('p');p.textContent=value;$('letter-body').append(p);}
  const name=String(config.graduate||'').trim();
  $('letter-signoff').textContent=[config.signoff||'',name&&name!=='Your name'?name:''].filter(Boolean).join('\n');
  $('letter-signoff').hidden=!$('letter-signoff').textContent;
  const event=config.event||{}, dates=eventDates(event);
  $('letter-event').hidden=!(dates||event.name||event.venue||event.address||safeUrl(event.rsvpUrl)||safeUrl(event.mapUrl)||event.dressCode||event.note);
  $('event-name').textContent=event.name||'';
  $('event-place').textContent=[event.venue,event.address].filter(Boolean).join(' · ');
  $('event-note').textContent=[event.dressCode,event.note].filter(Boolean).join(' · ');
  if(dates){
    let timezone=event.timezone||'Asia/Bangkok';
    try{new Intl.DateTimeFormat('en',{timeZone:timezone}).format(dates.start);}catch{timezone='UTC';}
    $('event-date').textContent=new Intl.DateTimeFormat('en',{dateStyle:'long',timeStyle:'short',timeZone:timezone}).format(dates.start)+` · ${timezone.replace(/_/g,' ')}`;
    $('calendar-button').hidden=false;
  }
  for(const [id,value]of [['rsvp-link',event.rsvpUrl],['map-link',event.mapUrl]]){
    const url=safeUrl(value);if(!url)continue;
    $(id).href=url;$(id).hidden=false;
    if(url.startsWith('https:')){$(id).target='_blank';$(id).rel='noopener noreferrer';}
  }
  letterPrepared=true;
}
$('calendar-button').addEventListener('click',()=>{
  const content=createCalendar(config.event||{});if(!content)return;
  const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='room-04.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
});
function returnToScene() {
  if(document.querySelector('dialog[open]'))return;
  if(pending){restoreSceneFocus=true;return;}
  restoreSceneFocus=false;
  const next=targets.find(target=>target.id===getView(state).activeAction)?.button;
  const focusTarget=next||(!$('reopen-letter').hidden?$('reopen-letter'):null);
  focusTarget?.focus({preventScroll:true});
}
function showPhotograph() {
  if(!getView(state).photoFound)return;
  clearTimeout(photoTimer);
  $('letter-dialog').close();
  openDialog($('photo-dialog'));
}
function showWriting() {
  if(!getView(state).writingFound)return;
  buildLetter();
  $('photo-dialog').close();
  openDialog($('letter-dialog'));
  $('letter-dialog').scrollTop=0;
}
function turnPhotograph(){
  if(getView(state).writingFound){sound('paper');showWriting();}
  else {interact('turnphoto');if(getView(state).writingFound)showWriting();}
}
$('turn-photo').addEventListener('click',turnPhotograph);
$('read-note').addEventListener('click',turnPhotograph);
$('note-close').addEventListener('click',()=>$('letter-dialog').close());
$('show-photo-front').addEventListener('click',showPhotograph);
$('reopen-letter').addEventListener('click',()=>getView(state).writingFound?showWriting():showPhotograph());
$('letter-dialog').addEventListener('close',returnToScene);
$('photo-dialog').addEventListener('close',returnToScene);

function placeGratitude(reset=false){
  const card=$('gratitude-card');
  if(card.hidden||!viewport.width||!viewport.height)return;
  if(reset)card.classList.remove('is-compact');
  const target=targets.find(target=>target.id===view?.activeAction);
  const x=parseFloat(target?.button?.style.left),y=parseFloat(target?.button?.style.top);
  const point=Number.isFinite(x+y)?{x,y}:null;
  let bounds=card.getBoundingClientRect();
  let position=messageCardPosition(viewport.width,viewport.height,bounds.width,bounds.height,
    point,viewport.insets,{x:parseFloat(card.style.left),y:parseFloat(card.style.top)});
  const overlaps=point&&position.x<x+34&&position.x+bounds.width>x-34&&position.y<y+34&&position.y+bounds.height>y-34;
  if(overlaps&&!card.classList.contains('is-compact')){
    card.classList.add('is-compact');
    bounds=card.getBoundingClientRect();
    position=messageCardPosition(viewport.width,viewport.height,bounds.width,bounds.height,point,viewport.insets);
  }
  card.style.left=`${position.x}px`;card.style.top=`${position.y}px`;
  card.style.right='auto';card.style.bottom='auto';
}
function hideGratitude(restoreFocus=true){
  const card=$('gratitude-card'),hadFocus=card.contains(document.activeElement);
  card.hidden=true;
  if(restoreFocus&&hadFocus)returnToScene();
}
function showGratitude(message){
  if(!message)return;
  $('gratitude-message').textContent=message;
  $('gratitude-message').scrollTop=0;
  $('gratitude-card').hidden=false;
  placeGratitude(true);
}
$('gratitude-dismiss').addEventListener('click',()=>hideGratitude());
$('gratitude-card').addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();hideGratitude();}
});
function updatePhotoControls(){
  $('read-note').disabled=pending;
  $('turn-photo').disabled=pending;
}

function externalLink(label,url){const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
for(const source of MODEL_SOURCES){
  const entry=document.createElement('article');entry.className='source-entry';
  const button=document.createElement('button');button.type='button';button.className='source-thumb';button.setAttribute('aria-label',`View original ${source.title}`);
  const img=document.createElement('img');img.src=source.preview;img.alt='';img.loading='lazy';img.width=160;img.height=100;button.append(img);
  const info=document.createElement('div'),title=document.createElement('p'),creator=document.createElement('p'),license=document.createElement('p');
  title.className='source-title';title.textContent=source.title;creator.className='source-creator';creator.append(externalLink(source.creator,source.creatorUrl));license.className='source-license';license.append(externalLink(source.license,source.licenseUrl));info.append(title,creator,license);entry.append(button,info);$('source-list').append(entry);
  if(source.key==='pot'){const credit=document.createElement('p');credit.className='source-license';credit.textContent='Modeled and textured by pr1me_3d';info.append(credit);}
  button.addEventListener('click',()=>{
    $('model-heading').textContent=source.title;
    $('model-attribution').replaceChildren(externalLink(source.creator,source.creatorUrl),' · ',externalLink(source.license,source.licenseUrl),' · ',externalLink('Original on Sketchfab',source.url));
    const iframe=document.createElement('iframe');iframe.title=`${source.title} by ${source.creator}`;iframe.src=`https://sketchfab.com/models/${source.uid}/embed?autostart=1&ui_theme=light`;
    iframe.allow='autoplay; fullscreen; xr-spatial-tracking';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';$('model-frame').replaceChildren(iframe);openDialog($('model-dialog'));
  });
}
$('model-dialog').addEventListener('close',()=>{$('model-frame').replaceChildren();});

function markChapter() {
  root.dataset.chapter=String(state.chapter);root.dataset.step=String(state.step);root.dataset.phase=view.phase;
  if(!pending)root.setAttribute('aria-busy','false');
  $('reopen-letter').hidden=!view.photoFound;
  $('reopen-letter').setAttribute('aria-label',view.writingFound?'Read the note again':'Look at the photograph again');
  $('reopen-label').textContent=view.writingFound?'Read note':'Photograph';
  updatePhotoControls();
  document.body.classList.toggle('letter-found',state.letterFound);
  if(view.writingFound&&!letterPrepared)buildLetter();
}
function updateTargets() {
  if(!view)return;
  const {width,height}=viewport;
  if(!width||!height)return;
  if(renderer&&!preferences.paper&&world)world.root.updateMatrixWorld(true);
  for(const target of targets){
    if(!target.button)continue;
    let x,y,visible=true;
    if(preferences.paper||!renderer){
      if(!paperFrame)continue;
      x=(target.x-paperFrame.x)*paperFrame.scale;
      y=(target.y-paperFrame.y)*paperFrame.scale;
      visible=x>=29&&x<=width-29&&y>=29&&y<=height-29;
    }else{
      const point=targetPoint(target).project(camera);
      x=(point.x+1)/2*width;y=(1-point.y)/2*height;
      visible=point.z>=-1&&point.z<=1&&x>=29&&y>=29&&x<=width-29&&y<=height-29;
      if(visible){
        raycaster.setFromCamera(point,camera);
        visible=hitSceneTarget(raycaster,world.root,targets)?.id===target.id;
      }
    }
    target.button.style.left=`${x}px`;target.button.style.top=`${y}px`;target.button.hidden=!visible;
  }
}
function mountTargets(items) {
  $('object-targets').replaceChildren();
  targets=items.filter(item=>{const response=act(state,item.id);return item.id===view.activeAction||response.sound||response.feedback;})
    .sort((a,b)=>(b.id===view.activeAction)-(a.id===view.activeAction));
  for(const target of targets){
    const button=document.createElement('button');button.type='button';button.className='object-target';button.dataset.object=target.id;
    const current=target.id===view.activeAction, label=current?interactionHint(view)?.label||target.label:target.label;
    button.setAttribute('aria-label',label);button.title=label;button.classList.toggle('is-current',current);
    button.addEventListener('click',event=>{
      event.stopPropagation();
      // Nearby objects can share a finger-sized area on narrow screens.
      // Use the closest object to the actual tap; keyboard activation keeps its focus.
      let hit=target,nearest=Infinity;
      if(event.detail>0)for(const candidate of targets){
        if(candidate.button.hidden)continue;
        const r=candidate.button.getBoundingClientRect();
        if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)continue;
        const distance=(event.clientX-r.left-r.width/2)**2+(event.clientY-r.top-r.height/2)**2;
        if(distance<nearest){hit=candidate;nearest=distance;}
      }
      interact(hit.id);
    });
    button.addEventListener('pointerdown',event=>event.stopPropagation());
    target.button=button;$('object-targets').append(button);
  }
  fitCamera();
}
function disposeWorld(){if(world){scene?.remove(world.root);world.dispose?.();world=null;}}
function drawView(next,immediate=false){
  const oldView=view;view=next;sceneAge=0;dragAngle=0;dragGoal=0;pointerStart=null;
  markChapter();
  targets=[];$('object-targets').replaceChildren();
  disposeWorld();
  if(preferences.paper||!renderer){
    host.hidden=true;$('paper-world').hidden=false;
    const paper=buildFallback(view);$('paper-world').innerHTML=paper.svg;mountTargets(paper.targets);
  }else{
    host.hidden=false;$('paper-world').hidden=true;$('paper-world').replaceChildren();
    world=buildWorld(THREE,view);scene.add(world.root);scene.background=new THREE.Color(world.background||0xc9e5eb);
    cameraGoal=new THREE.Vector3(...world.camera.position);cameraAim=new THREE.Vector3(...world.camera.target);
    // The existing fade covers the camera cut; do not fly through the new room.
    camera.position.copy(cameraGoal);currentLook.copy(cameraAim);camera.lookAt(currentLook);
    cameraTarget={...world.camera};world.root.updateMatrixWorld(true);mountTargets(world.targets);
  }
  renderNeeded=true;
  if(!oldView||oldView.chapter!==view.chapter||oldView.step!==view.step)whisper(view.caption||'',4700);
  announce(interactionHint(view)?.label||'The photograph is beside your cup.');
}
function installView(next,immediate=false){
  clearTimeout(transitionTimer);
  clearTimeout(photoTimer);clearTimeout(focusTimer);
  if(!view||immediate||quiet()){pending=false;drawView(next,immediate);root.classList.remove('transitioning');root.setAttribute('aria-busy','false');if(restoreSceneFocus)returnToScene();return;}
  pending=true;root.classList.add('transitioning');root.setAttribute('aria-busy','true');updatePhotoControls();
  transitionTimer=setTimeout(()=>{
    drawView(next);
    transitionTimer=setTimeout(()=>{root.classList.remove('transitioning');root.setAttribute('aria-busy','false');pending=false;updatePhotoControls();if(restoreSceneFocus)returnToScene();},140);
  },260);
}
function interact(id){
  if(pending)return;
  if(preferences.sound&&!audioContext)enableAudio();
  const before=getView(state);
  if(id==='photo'&&before.photoFound){
    showGratitude(gratitudeMessage(before,id,config));showPhotograph();
    return;
  }
  const result=act(state,id);state=result.state;
  if(result.changed)save();sound(result.sound);
  const next=getView(state);
  const moves=before.chapter!==next.chapter||before.step!==next.step||before.letterFound!==next.letterFound;
  if(moves){
    const hadKeyboardFocus=$('object-targets').contains(document.activeElement)&&document.activeElement?.matches(':focus-visible');
    installView(next);
    if(hadKeyboardFocus)focusTimer=setTimeout(()=>{if(state.chapter===next.chapter&&state.step===next.step&&!document.querySelector('dialog[open]'))returnToScene();},quiet()?0:450);
  }else if(result.sound){
    const button=targets.find(t=>t.id===id)?.button;
    button?.classList.remove('responding');requestAnimationFrame(()=>button?.classList.add('responding'));
  }
  if(result.changed||result.sound)showGratitude(gratitudeMessage(before,id,config));
  else if(result.feedback)whisper(result.feedback,3600);
}

function fit3DFrame(){
  if(!world||!cameraTarget||!viewport.width||!viewport.height)return;
  const active=targets.find(target=>target.id===view.activeAction);
  fitSceneCamera(camera,cameraTarget,viewport.width,viewport.height,
    active?targetPoint(active):null,viewport.insets,targets.map(target=>target.anchor));
}
function fitCamera(){
  const width=root.clientWidth,height=root.clientHeight;
  if(!width||!height)return;
  const bounds=root.getBoundingClientRect(),padding=getComputedStyle(root);
  const controls=document.querySelector('.quiet-controls').getBoundingClientRect();
  const photograph=$('reopen-letter');
  const bottom=36;
  const top=Math.max(controls.bottom,photograph.hidden?controls.bottom:photograph.getBoundingClientRect().bottom)-bounds.top;
  viewport={width,height,insets:{
    left:parseFloat(padding.paddingLeft)||0,right:parseFloat(padding.paddingRight)||0,
    top:Math.max(0,top),bottom:Math.max(bottom,parseFloat(padding.paddingBottom)||0),
  }};
  if(renderer&&!preferences.paper&&world){
    const ratio=renderPixelRatio(width,height,window.devicePixelRatio);
    if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);
    renderer.setSize(width,height,false);
    fit3DFrame();
  }else{
    const active=targets.find(target=>target.id===view.activeAction);
    paperFrame=fitPaperFrame(width,height,active,viewport.insets,targets);
    const svg=$('paper-world').querySelector('svg');
    svg?.setAttribute('viewBox',[paperFrame.x,paperFrame.y,paperFrame.width,paperFrame.height].join(' '));
  }
  renderNeeded=true;updateTargets();placeGratitude(true);
}
function targetAt(event){
  if(!renderer||!world||preferences.paper)return null;
  const box=renderer.domElement.getBoundingClientRect();
  if(!box.width||!box.height)return null;
  world.root.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  raycaster.setFromCamera(new THREE.Vector2((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1),camera);
  return hitSceneTarget(raycaster,world.root,targets);
}
host.addEventListener('pointerdown',event=>{
  if(pending||!event.isPrimary||event.button!==0)return;
  pointerStart={x:event.clientX,y:event.clientY,angle:dragGoal,id:event.pointerId,dragged:false};
  host.setPointerCapture(event.pointerId);
});
host.addEventListener('pointermove',event=>{
  if(pointerStart){
    if(event.pointerId!==pointerStart.id)return;
    const dx=event.clientX-pointerStart.x;
    if(Math.hypot(dx,event.clientY-pointerStart.y)>8)pointerStart.dragged=true;
    if(pointerStart.dragged){
      const limit=cameraTarget?.dragLimit??.38;
      dragGoal=Math.max(-limit,Math.min(limit,pointerStart.angle+dx/root.clientWidth*.9));renderNeeded=true;
    }
  }else host.style.cursor=targetAt(event)?'pointer':'grab';
});
host.addEventListener('pointerup',event=>{
  if(!pointerStart||event.pointerId!==pointerStart.id)return;
  const click=!pointerStart.dragged&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)<9;
  pointerStart=null;
  if(host.hasPointerCapture(event.pointerId))host.releasePointerCapture(event.pointerId);
  if(click&&!pending){const target=targetAt(event);if(target)interact(target.id);}
});
function cancelPointer(event){if(pointerStart?.id===event.pointerId)pointerStart=null;}
host.addEventListener('pointercancel',cancelPointer);
host.addEventListener('lostpointercapture',cancelPointer);
function queueResize(){
  if(resizeRequest)return;
  resizeRequest=requestAnimationFrame(()=>{resizeRequest=null;fitCamera();});
}
window.addEventListener('resize',queueResize);
window.visualViewport?.addEventListener('resize',queueResize);
if(typeof ResizeObserver!=='undefined'){
  const observer=new ResizeObserver(queueResize);
  for(const element of [root,$('gratitude-card'),$('reopen-letter'),document.querySelector('.quiet-controls')])observer.observe(element);
}
document.fonts?.ready?.then(queueResize);
document.addEventListener('visibilitychange',()=>{renderNeeded=true;});

function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-frameTime)/1000,.08);if(now-frameTime<32)return;frameTime=now;
  if(document.hidden)return;
  sceneAge+=dt;
  if(renderer&&!preferences.paper&&world){
    const blend=quiet()?1:Math.min(1,dt*5);
    dragAngle+=(dragGoal-dragAngle)*blend;
    const offset=cameraGoal.clone().sub(cameraAim);offset.applyAxisAngle(new THREE.Vector3(0,1,0),dragAngle);
    const destination=cameraAim.clone().add(offset);
    const moving=camera.position.distanceToSquared(destination)>.00001||currentLook.distanceToSquared(cameraAim)>.00001||Math.abs(dragGoal-dragAngle)>.0001;
    camera.position.lerp(destination,blend);currentLook.lerp(cameraAim,blend);camera.lookAt(currentLook);
    world.update?.(sceneAge,dt,{reducedMotion:quiet()});
    world.root.updateMatrixWorld(true);fit3DFrame();
    if(!quiet()||moving||renderNeeded){renderer.render(scene,camera);renderNeeded=false;}
  }
  updateTargets();
  if(pointerStart||Math.abs(dragGoal-dragAngle)>.0001)placeGratitude();
}

async function boot(){
  document.title=config.title||'Room 04';document.querySelector('meta[property="og:title"]').content=document.title;
  applyPreferences();
  try{
    [THREE,{buildWorld}]=await Promise.all([import('./vendor/three.module.js'),import('./world.mjs')]);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    host.append(renderer.domElement);scene=new THREE.Scene();
    camera=new THREE.OrthographicCamera(-9,9,6,-6,.1,160);currentLook=new THREE.Vector3();raycaster=new THREE.Raycaster();
    const hemi=new THREE.HemisphereLight(0xfffff8,0x959b87,2.3);scene.add(hemi);
    const sun=new THREE.DirectionalLight(0xfff8e9,2.5);sun.position.set(-8,16,9);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:45});sun.shadow.bias=-.0007;sun.shadow.normalBias=.04;sun.shadow.radius=3;scene.add(sun);
    webglAvailable=true;
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();webglAvailable=false;preferences.paper=true;applyPreferences();installView(getView(state),true);});
  }catch(error){
    console.warn('Room 04 is using its paper view.',error instanceof Error?error.message:'Renderer unavailable');
    renderer?.dispose();renderer=null;preferences.paper=true;applyPreferences();
  }
  applyPreferences();drawView(getView(state),true);requestAnimationFrame(animate);
  $('loading').classList.add('is-ready');setTimeout(()=>$('loading').hidden=true,700);
}
boot().catch(error=>{
  console.error(error);preferences.paper=true;renderer=null;drawView(getView(state),true);$('loading').hidden=true;applyPreferences();
});
