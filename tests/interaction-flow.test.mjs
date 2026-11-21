import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {ACTIONS,initialState,getView,act,serialize,restore} from '../dist/game-state.mjs';
import {buildFallback} from '../dist/fallback.mjs';
import {interactionHint,gratitudeMessage,messageCardPosition} from '../dist/interaction.mjs';
import {fitSceneCamera,fitPaperFrame,targetPoint,hitSceneTarget,renderPixelRatio} from '../dist/scene-view.mjs';
import {eventDates,safeUrl,createCalendar} from '../dist/event.mjs';
import {appHarness} from './app-harness.mjs';

const [appSource,htmlSource,configSource] = await Promise.all(
  ['app.mjs','index.html','config.js'].map(path=>readFile(new URL('../dist/'+path,import.meta.url),'utf8'))
);
const dependencies={ACTIONS,initialState,getView,act,serialize,restore,buildFallback,interactionHint,gratitudeMessage,messageCardPosition,
  fitSceneCamera,fitPaperFrame,targetPoint,hitSceneTarget,renderPixelRatio,eventDates,safeUrl,createCalendar};

test('thank-you side cards leave the whole nineteen-action route playable without dismissal',()=>{
  const {api,nodes,dialogs,document,config}=appHarness(appSource,htmlSource,configSource,dependencies);
  assert.equal(nodes.has('interaction-hint'),false,'the bottom hint must be removed');
  assert.equal(nodes.get('gratitude-card').hidden,true);
  document.activeElement=nodes.get('preferences-button');
  const focus=document.activeElement;
  api.interact('chair');
  assert.equal(dialogs.filter(dialog=>dialog.open).length,0,'optional thanks must not open a modal');
  assert.equal(nodes.get('gratitude-card').hidden,false);
  assert.equal(api.getState().step,0);
  assert.equal(document.activeElement,focus,'a message must not steal focus');
  const messages=[];
  for(let step=0;step<19;step++){
    const view=getView(api.getState());
    const target=api.getTargets().find(target=>target.id===view.activeAction);
    assert.ok(target?.button,'missing object target');
    target.button.fire();
    assert.equal(dialogs.filter(dialog=>dialog.open).length,0,'story interaction opened a blocking dialog at '+step);
    assert.equal(nodes.get('gratitude-card').hidden,false);
    assert.equal(document.activeElement,focus,'side message stole focus');
    messages.push(nodes.get('gratitude-message').textContent);
  }
  assert.equal(messages.join(' '),config.letter.join(' '));
  assert.ok(api.getState().letterFound);
  nodes.get('gratitude-dismiss').fire();
  assert.ok(nodes.get('gratitude-card').hidden);
  nodes.get('reopen-letter').fire();
  assert.ok(nodes.get('letter-dialog').open,'the full note remains available explicitly');
  assert.deepEqual(nodes.get('letter-body').children.map(p=>p.textContent),config.letter);
  nodes.get('note-close').fire();
  nodes.get('restart-button').fire();
  assert.equal(getView(api.getState()).activeAction,'frontdoor');
  assert.ok(nodes.get('gratitude-card').hidden,'restart must clear the previous message');
});

test('animated transitions resume interaction while the side message stays visible',()=>{
  const {api,nodes,dialogs,advance}=appHarness(appSource,htmlSource,configSource,dependencies,{reducedMotion:false,width:320,height:240});
  for(let step=0;step<19;step++){
    const view=getView(api.getState());
    api.interact(view.activeAction);
    assert.equal(dialogs.filter(dialog=>dialog.open).length,0);
    assert.equal(nodes.get('gratitude-card').hidden,false);
    const next=serialize(api.getState());
    api.interact(getView(api.getState()).activeAction);
    assert.equal(serialize(api.getState()),next,'transition must not accept a duplicate action');
    advance(450);
    assert.equal(nodes.get('gratitude-card').hidden,false);
  }
  assert.ok(api.getState().letterFound);
});

test('photograph and full note open only when the visitor chooses to inspect them',()=>{
  const {api,nodes,dialogs}=appHarness(appSource,htmlSource,configSource,dependencies);
  let attempts=0;
  while(getView(api.getState()).activeAction!=='photo'){
    assert.ok(attempts++<19,'the side message blocked progression');
    api.interact(getView(api.getState()).activeAction);
  }
  api.interact('photo');
  assert.equal(dialogs.filter(dialog=>dialog.open).length,0);
  nodes.get('reopen-letter').fire();
  assert.ok(nodes.get('photo-dialog').open);
  nodes.get('read-note').fire();
  assert.ok(getView(api.getState()).writingFound);
  assert.ok(nodes.get('letter-dialog').open);
  nodes.get('note-close').fire();
  assert.equal(getView(api.getState()).activeAction,'cardboard');
});

test('a long optional message becomes a narrow card when it would cover the next object',()=>{
  const {api,nodes}=appHarness(appSource,htmlSource,configSource,dependencies,{width:320,height:480});
  for(let i=0;i<3;i++)api.interact(getView(api.getState()).activeAction);
  api.interact('fan');
  const card=nodes.get('gratitude-card');
  assert.ok(card.classList.contains('is-compact'),'the message needs a narrower sidebar');
  const next=api.getTargets().find(target=>target.id===getView(api.getState()).activeAction);
  const x=parseFloat(next.button.style.left),y=parseFloat(next.button.style.top),box=card.getBoundingClientRect();
  assert.ok(x<box.left||x>box.right||y<box.top||y>box.bottom,'side card blocks the next object');
  const before=serialize(api.getState());
  next.button.fire();
  assert.notEqual(serialize(api.getState()),before,'next object must work without dismissing the card');
});

test('keyboard dismissal of a side message returns focus to the current object',()=>{
  const {api,nodes,document}=appHarness(appSource,htmlSource,configSource,dependencies);
  api.interact('frontdoor');
  const next=api.getTargets().find(target=>target.id===getView(api.getState()).activeAction);
  nodes.get('gratitude-message').focus();
  const saved=serialize(api.getState());
  nodes.get('gratitude-card').fire('keydown',{key:'Escape'});
  assert.ok(nodes.get('gratitude-card').hidden);
  assert.equal(document.activeElement,next.button);
  assert.equal(serialize(api.getState()),saved);
});
