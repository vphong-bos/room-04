import {initialState, getView, act, serialize, restore} from './exploration-state.mjs';
import {buildFallback} from './fallback.mjs';
import {actionLabel, interactionHint} from './interaction.mjs';
import {fitSceneCamera, fitPaperFrame, targetPoint, hitSceneTarget, renderPixelRatio, framingContext} from './scene-view.mjs';
import {MODEL_SOURCES} from './model-sources.mjs';
import {MODEL_ASSET_SOURCES} from './model-assets.mjs';
import {eventStart, eventDates, createCalendar, safeUrl} from './event.mjs';

const $ = (id) => document.getElementById(id);
const config = window.INVITATION || {};
const SAVE_KEY = 'room04:journey:v4';
const PREF_KEY = 'room04:preferences:v1';
const media = matchMedia('(prefers-reduced-motion: reduce)');
let preferences = {sound:false, motion:false, paper:false};
let state = initialState();
try {
  state = restore(localStorage.getItem(SAVE_KEY)||localStorage.getItem('room04:journey:v3')||localStorage.getItem('room04:journey:v2'));
  const stored = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
  for (const key of Object.keys(preferences)) if (typeof stored[key] === 'boolean') preferences[key] = stored[key];
} catch { /* The journey also works without browser storage. */ }
const query = new URLSearchParams(location.search);
if (query.get('paper') === '1') preferences.paper = true;
let THREE, buildWorld, renderer, scene, camera, raycaster, world, view, targets = [];
let pending = false, sceneAge = 0, frameTime = 0, renderNeeded = true, pointerStart = null;
let dragAngle = 0, dragGoal = 0, pitchAngle = 0, pitchGoal = 0;
let feedbackTimer, feedbackHideTimer, transitionTimer, photoTimer, focusTimer, cameraAim, cameraGoal, cameraTarget, currentLook;
let webglAvailable = false, letterPrepared = false, restoreSceneFocus = false;
let viewport = {width:0, height:0, insets:{}}, paperFrame, resizeRequest;
let audioContext, ambientTimer, activeOscillators = new Set();
const host = $('world');
const root = $('adventure');
let modeChosen=false,fallbackAnnounced=false;
let resolveViewChoice;
const viewChoice=new Promise(resolve=>{resolveViewChoice=resolve;});

function save() { try { localStorage.setItem(SAVE_KEY, serialize(state)); } catch {} }
function savePreferences() { try { localStorage.setItem(PREF_KEY, JSON.stringify(preferences)); } catch {} }
function quiet() { return media.matches || preferences.motion; }
function announce(message) { if (message) $('announcer').textContent = message; }
function hideFeedback(){
  clearTimeout(feedbackTimer);clearTimeout(feedbackHideTimer);
  const line=$('feedback-line');line.classList.remove('visible');line.hidden=true;line.textContent='';
}
function showFeedback(message,duration=2400){
  if(!message)return;
  clearTimeout(feedbackTimer);clearTimeout(feedbackHideTimer);
  const line=$('feedback-line');line.textContent=String(message);line.hidden=false;
  line.classList.remove('visible');
  requestAnimationFrame(()=>{if(!line.hidden)line.classList.add('visible');});
  announce(message);
  feedbackTimer=setTimeout(()=>{
    line.classList.remove('visible');
    feedbackHideTimer=setTimeout(()=>{line.hidden=true;line.textContent='';},450);
  },duration);
}
function announceIllustratedFallback(){
  if(fallbackAnnounced)return;
  fallbackAnnounced=true;
  showFeedback('3D unavailable. Showing illustrated view.');
}
function handleContextLoss(event){
  event.preventDefault();
  const was3D=!preferences.paper;
  webglAvailable=false;preferences.paper=true;applyPreferences();installView(getView(state),true);
  if(was3D)announceIllustratedFallback();
}
function chooseView(mode){
  if(modeChosen||!['3d','illustrated'].includes(mode))return;
  modeChosen=true;
  preferences.paper=mode==='illustrated';savePreferences();
  $('choose-red-pill').disabled=true;$('choose-blue-pill').disabled=true;
  $('view-choice-status').textContent=mode==='3d'?'Opening the 3D view…':'Opening the illustrated view…';
  $('view-choice-status').focus({preventScroll:true});
  resolveViewChoice(mode);
}
function finishEntry(){
  if(!modeChosen)return;
  root.hidden=false;
  drawView(getView(state),true);
  root.inert=false;$('view-choice').hidden=true;
  requestAnimationFrame(()=>returnToScene());
}
$('choose-red-pill').addEventListener('click',()=>chooseView('3d'));
$('choose-blue-pill').addEventListener('click',()=>chooseView('illustrated'));

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
      if((view?.chapter===1||view?.chapter===3)&&tick%14===0)sound('fan');
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
  hideFeedback();$('photo-dialog').close();$('letter-dialog').close();state=initialState();letterPrepared=false;$('letter-body').replaceChildren();save();$('preferences-dialog').close();installView(getView(state));
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
  const event=config.event||{}, start=eventStart(event), dates=eventDates(event);
  $('letter-event').hidden=!(start||event.name||event.venue||event.address||safeUrl(event.rsvpUrl)||safeUrl(event.mapUrl)||event.dressCode||event.note);
  $('event-name').textContent=event.name||'';
  $('event-place').textContent=[event.venue,event.address].filter(Boolean).join(' · ');
  $('event-note').textContent=[event.dressCode,event.note].filter(Boolean).join(' · ');
  $('event-date').textContent='';
  $('event-date').hidden=!start;
  $('calendar-button').hidden=!dates;
  if(start){
    let timezone=event.timezone||'Asia/Ho_Chi_Minh';
    try{new Intl.DateTimeFormat('vi-VN',{timeZone:timezone}).format(start);}catch{timezone='UTC';}
    $('event-date').textContent=new Intl.DateTimeFormat('vi-VN',{
      weekday:'long',year:'numeric',month:'long',day:'numeric',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:timezone
    }).format(start);
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
function returnToScene(preferredId='') {
  if(document.querySelector('dialog[open]'))return;
  if(pending){restoreSceneFocus=true;return;}
  restoreSceneFocus=false;
  const focusId=getView(state).focusAction||getView(state).activeAction;
  const visible=target=>target.button&&!target.button.hidden&&!target.button.disabled;
  const next=targets.find(target=>target.id===preferredId&&visible(target))
    ||targets.find(target=>target.id===focusId&&visible(target))||targets.find(visible);
  const focusTarget=next?.button||(!$('reopen-letter').hidden?$('reopen-letter'):$('preferences-button'));
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
  title.className='source-title';title.textContent=source.title;creator.className='source-creator';creator.append(externalLink(source.creator,source.creatorUrl));license.className='source-license';license.append('Reference · ',externalLink(source.license,source.licenseUrl));info.append(title,creator,license);entry.append(button,info);$('source-list').append(entry);
  if(source.key==='pot'){const credit=document.createElement('p');credit.className='source-license';credit.textContent='Modeled and textured by pr1me_3d';info.append(credit);}
  button.addEventListener('click',()=>{
    $('model-heading').textContent=source.title;
    $('model-attribution').replaceChildren(externalLink(source.creator,source.creatorUrl),' · ',externalLink(source.license,source.licenseUrl),' · ',externalLink('Original on Sketchfab',source.url));
    const iframe=document.createElement('iframe');iframe.title=`${source.title} by ${source.creator}`;iframe.src=`https://sketchfab.com/models/${source.uid}/embed?autostart=1&ui_theme=light`;
    iframe.allow='autoplay; fullscreen; xr-spatial-tracking';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';$('model-frame').replaceChildren(iframe);openDialog($('model-dialog'));
  });
}
for(const source of MODEL_ASSET_SOURCES){
  const entry=document.createElement('article');entry.className='source-entry source-entry-mesh';
  const title=document.createElement('p');title.className='source-title';title.textContent=source.title;
  const creator=document.createElement('p');creator.className='source-creator';creator.append(externalLink(source.creator,source.creatorUrl));
  const license=document.createElement('p');license.className='source-license';license.append('Used in this game · ',externalLink(source.license,source.licenseUrl),' · ',externalLink('Model source',source.url));
  entry.append(title,creator,license);$('source-list').append(entry);
}
$('model-dialog').addEventListener('close',()=>{$('model-frame').replaceChildren();});

function markChapter() {
  root.dataset.chapter=String(view.chapter);root.dataset.step=String(view.step);root.dataset.phase=view.phase;
  root.dataset.location=view.location||view.phase;
  root.dataset.room=view.room||view.phase;root.dataset.pose=view.pose||'standing';
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
  const highlighted=id=>view.highlightActions?view.highlightActions.includes(id):id===view.activeAction;
  targets=items.filter(item=>view.availableActions?view.availableActions.includes(item.id):!!act(state,item.id).sound)
    .sort((a,b)=>Number(highlighted(b.id))-Number(highlighted(a.id)));
  for(const target of targets){
    const button=document.createElement('button');button.type='button';button.className='object-target';button.dataset.object=target.id;
    const label=actionLabel(view,target.id)||target.label;
    button.setAttribute('aria-label',label);button.title=label;button.classList.toggle('is-current',highlighted(target.id));
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
  const oldView=view,sameRoom=oldView?.room&&oldView.room===next.room;
  const keepLook=oldView?.location&&oldView.location===next.location;
  const smoothPose=renderer&&!preferences.paper&&world&&sameRoom&&!keepLook&&!immediate&&!quiet();
  const retainPose=renderer&&!preferences.paper&&world&&sameRoom&&(keepLook||smoothPose);
  const previousEye=retainPose?camera.position.clone():null,previousAim=retainPose?currentLook.clone():null;
  view=next;if(!sameRoom)sceneAge=0;if(!keepLook){dragAngle=0;dragGoal=0;pitchAngle=0;pitchGoal=0;}pointerStart=null;
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
    camera.position.copy(retainPose?previousEye:cameraGoal);currentLook.copy(retainPose?previousAim:cameraAim);camera.lookAt(currentLook);
    cameraTarget={...world.camera};
    if(keepLook&&!retainPose){currentLook.copy(desiredLook());camera.lookAt(currentLook);}
    camera.updateMatrixWorld(true);world.root.updateMatrixWorld(true);mountTargets(world.targets);
  }
  renderNeeded=true;
  if(view.caption&&(!oldView||oldView.room!==view.room))showFeedback(view.caption);
  announce(interactionHint(view)?.label||'Explore the available objects.');
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
  if(!modeChosen||pending)return;
  if(preferences.sound&&!audioContext)enableAudio();
  const before=getView(state),hadKeyboardFocus=$('object-targets').contains(document.activeElement)&&document.activeElement?.matches(':focus-visible');
  const result=act(state,id);state=result.state;
  if(result.changed)save();sound(result.sound);
  const next=getView(state),travel=before.room!==next.room,poseChange=before.location!==next.location;
  if(result.changed){
    if(travel)installView(next);else drawView(next,!poseChange||quiet());
    if(hadKeyboardFocus)focusTimer=setTimeout(()=>{
      if(state.location===next.location&&!document.querySelector('dialog[open]'))returnToScene(id);
    },travel&&!quiet()?450:0);
  }else if(result.sound){
    const button=targets.find(t=>t.id===id)?.button;
    button?.classList.remove('responding');requestAnimationFrame(()=>button?.classList.add('responding'));
  }
  if(result.changed||result.sound||result.feedback){
    const message=result.feedback||result.reward;
    if(message)showFeedback(message);
    for(const action of result.opened||[])targets.find(target=>target.id===action)?.button?.classList.add('is-new');
  }
  if(id==='photo'&&next.photoFound)showPhotograph();
  if(id==='turnphoto'&&next.writingFound)showWriting();
}

function desiredLook(){
  const direction=cameraAim.clone().sub(cameraGoal).applyAxisAngle(new THREE.Vector3(0,1,0),dragAngle);
  const right=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(0,1,0)).normalize();
  return cameraGoal.clone().add(direction.applyAxisAngle(right,pitchAngle));
}

function fit3DFrame(){
  if(!world||!cameraTarget||!viewport.width||!viewport.height)return;
  const focus=view.focusAction||view.activeAction,active=targets.find(target=>target.id===focus);
  // Fit the authored forward view, then retain that projection while looking around.
  const base=view.freeExploration?camera.clone():camera;
  if(view.freeExploration){base.position.copy(cameraGoal);base.lookAt(cameraAim);}
  fitSceneCamera(base,cameraTarget,viewport.width,viewport.height,
    active?targetPoint(active):null,viewport.insets,framingContext(cameraTarget,targets,focus));
  if(base!==camera){
    camera.aspect=base.aspect;camera.projectionMatrix.copy(base.projectionMatrix);
    camera.projectionMatrixInverse.copy(base.projectionMatrixInverse);
  }
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
    const active=targets.find(target=>target.id===(view.focusAction||view.activeAction));
    paperFrame=fitPaperFrame(width,height,active,viewport.insets,targets);
    const svg=$('paper-world').querySelector('svg');
    svg?.setAttribute('viewBox',[paperFrame.x,paperFrame.y,paperFrame.width,paperFrame.height].join(' '));
  }
  renderNeeded=true;updateTargets();
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
  if(!modeChosen||pending||!event.isPrimary||event.button!==0)return;
  pointerStart={x:event.clientX,y:event.clientY,angle:dragGoal,pitch:pitchGoal,id:event.pointerId,dragged:false};
  host.setPointerCapture(event.pointerId);
});
host.addEventListener('pointermove',event=>{
  if(pointerStart){
    if(event.pointerId!==pointerStart.id)return;
    const dx=event.clientX-pointerStart.x;
    if(Math.hypot(dx,event.clientY-pointerStart.y)>8)pointerStart.dragged=true;
    if(pointerStart.dragged){
      const limit=cameraTarget?.dragLimit??.65,pitchLimit=cameraTarget?.pitchLimit??.28;
      dragGoal=Math.max(-limit,Math.min(limit,pointerStart.angle+dx/root.clientWidth*1.8));
      pitchGoal=Math.max(-pitchLimit,Math.min(pitchLimit,pointerStart.pitch-(event.clientY-pointerStart.y)/root.clientHeight*.9));renderNeeded=true;
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
document.addEventListener('keydown',event=>{
  if(!modeChosen||document.querySelector('dialog[open]'))return;
  if(event.key==='Escape'){hideFeedback();return;}
  const yawLimit=cameraTarget?.dragLimit??.65,pitchLimit=cameraTarget?.pitchLimit??.28;
  if(event.key==='ArrowLeft')dragGoal=Math.max(-yawLimit,dragGoal-.12);
  else if(event.key==='ArrowRight')dragGoal=Math.min(yawLimit,dragGoal+.12);
  else if(event.key==='ArrowUp')pitchGoal=Math.min(pitchLimit,pitchGoal+.08);
  else if(event.key==='ArrowDown')pitchGoal=Math.max(-pitchLimit,pitchGoal-.08);
  else if(event.key==='Home'){dragGoal=0;pitchGoal=0;}
  else return;
  event.preventDefault();renderNeeded=true;
});
function queueResize(){
  if(resizeRequest)return;
  resizeRequest=requestAnimationFrame(()=>{resizeRequest=null;fitCamera();});
}
window.addEventListener('resize',queueResize);
window.visualViewport?.addEventListener('resize',queueResize);
if(typeof ResizeObserver!=='undefined'){
  const observer=new ResizeObserver(queueResize);
  for(const element of [root,$('reopen-letter'),document.querySelector('.quiet-controls')])observer.observe(element);
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
    dragAngle+=(dragGoal-dragAngle)*blend;pitchAngle+=(pitchGoal-pitchAngle)*blend;
    const lookGoal=desiredLook();
    const moving=camera.position.distanceToSquared(cameraGoal)>.00001||currentLook.distanceToSquared(lookGoal)>.00001||Math.abs(dragGoal-dragAngle)>.0001||Math.abs(pitchGoal-pitchAngle)>.0001;
    camera.position.lerp(cameraGoal,blend);currentLook.lerp(lookGoal,blend);camera.lookAt(currentLook);camera.updateMatrixWorld(true);
    world.update?.(sceneAge,dt,{reducedMotion:quiet()});
    world.root.updateMatrixWorld(true);if(!view.freeExploration)fit3DFrame();
    if(!quiet()||moving||renderNeeded){renderer.render(scene,camera);renderNeeded=false;}
  }
  updateTargets();
}

async function boot(){
  document.title=config.title||'Room 04';document.querySelector('meta[property="og:title"]').content=document.title;
  const requestedView=await viewChoice;
  let nativeUnavailable=false;
  applyPreferences();
  try{
    [THREE,{buildWorld}]=await Promise.all([import('./vendor/three.module.js'),import('./world.mjs')]);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    host.append(renderer.domElement);scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(58,1,.05,160);currentLook=new THREE.Vector3();raycaster=new THREE.Raycaster();
    const hemi=new THREE.HemisphereLight(0xfffff8,0x959b87,2.3);scene.add(hemi);
    const sun=new THREE.DirectionalLight(0xfff8e9,2.5);sun.position.set(-8,16,9);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:45});sun.shadow.bias=-.0007;sun.shadow.normalBias=.04;sun.shadow.radius=3;scene.add(sun);
    webglAvailable=true;
    renderer.domElement.addEventListener('webglcontextlost',handleContextLoss);
  }catch(error){
    console.warn('Room 04 is using its paper view.',error instanceof Error?error.message:'Renderer unavailable');
    renderer?.dispose();renderer=null;preferences.paper=true;nativeUnavailable=requestedView==='3d';applyPreferences();
  }
  applyPreferences();finishEntry();requestAnimationFrame(animate);
  if(nativeUnavailable)announceIllustratedFallback();
  $('loading').classList.add('is-ready');setTimeout(()=>$('loading').hidden=true,700);
}
boot().catch(error=>{
  console.error(error);preferences.paper=true;renderer=null;applyPreferences();finishEntry();$('loading').hidden=true;
});
