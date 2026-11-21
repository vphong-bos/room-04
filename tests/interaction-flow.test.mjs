import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {initialState,getView,act,serialize,restore} from '../dist/exploration-state.mjs';
import {buildFallback} from '../dist/fallback.mjs';
import {actionLabel,interactionHint} from '../dist/interaction.mjs';
import {fitSceneCamera,fitPaperFrame,targetPoint,hitSceneTarget,renderPixelRatio,framingContext} from '../dist/scene-view.mjs';
import {eventStart,eventDates,safeUrl,createCalendar} from '../dist/event.mjs';
import {appHarness} from './app-harness.mjs';
const [appSource,htmlSource,configSource]=await Promise.all(
  ['app.mjs','index.html','config.js'].map(path=>readFile(new URL('../dist/'+path,import.meta.url),'utf8')));
const dependencies={initialState,getView,act,serialize,restore,buildFallback,actionLabel,interactionHint,
  fitSceneCamera,fitPaperFrame,targetPoint,hitSceneTarget,renderPixelRatio,framingContext,eventStart,eventDates,safeUrl,createCalendar};
const move=(api,...ids)=>ids.forEach(id=>api.interact(id));
const teaState=()=>{let s=initialState();for(const id of['sidepath','key','backdoor','enterhouse'])s=act(s,id).state;return s;};
const tableState=()=>{let s=teaState();for(const id of['tea','window','returntea','left'])s=act(s,id).state;return s;};

test('the simplified game removes side cards, wet UI and the discarded interactions',()=>{
  const {api,nodes}=appHarness(appSource,htmlSource,configSource,dependencies,{savedState:serialize(teaState())});
  for(const id of['gratitude-card','gratitude-dismiss','journey-status','wet-effect','interaction-hint'])assert.equal(nodes.has(id),false,'removed UI: '+id);
  assert.ok(nodes.has('feedback-line'));
  assert.ok(!api.getTargets().some(t=>['chair','tap','towel','fold','cardboard'].includes(t.id)));
  api.interact('tea');
  assert.equal(api.getState().location,'tea');
  assert.ok(api.getTargets().some(t=>t.id==='window'));
});
test('the key and back-door reward reveal a separate entrance circle',()=>{
  const {api,nodes,dialogs}=appHarness(appSource,htmlSource,configSource,dependencies);
  move(api,'sidepath','key','backdoor');
  assert.equal(api.getState().location,'back');
  assert.ok(api.getTargets().some(t=>t.id==='enterhouse'));
  assert.equal(nodes.get('feedback-line').textContent,'The back door opens.');
  assert.equal(dialogs.filter(d=>d.open).length,0);
  api.interact('enterhouse');assert.equal(api.getState().location,'tea');
});
test('window and seated poses do not act like travel into a new room',()=>{
  const {api}=appHarness(appSource,htmlSource,configSource,dependencies,{savedState:serialize(teaState()),reducedMotion:false});
  move(api,'tea','window','returntea');
  assert.equal(api.getState().location,'tea','stepping back must be immediate in the same room');
  const table=appHarness(appSource,htmlSource,configSource,dependencies,{savedState:serialize(tableState()),reducedMotion:false});
  table.api.interact('sit');table.api.interact('chest');
  assert.ok(getView(table.api.getState()).flags.chest,'sitting is a pose change, not a blocked room transition');
  table.api.interact('returnroom');assert.equal(table.api.getState().location,'treasure');
});
test('the small tabletop chest gets an interaction circle only after sitting',()=>{
  const {api}=appHarness(appSource,htmlSource,configSource,dependencies,{savedState:serialize(tableState())});
  assert.ok(!api.getTargets().some(t=>t.id==='chest'));
  api.interact('chest');assert.equal(getView(api.getState()).flags.chest,false);
  api.interact('sit');assert.ok(api.getTargets().some(t=>t.id==='chest'));
  api.interact('chest');assert.ok(api.getTargets().some(t=>t.id==='photo'));
  api.interact('returnroom');assert.ok(!api.getTargets().some(t=>t.id==='chest'));
});
test('one short centered result fades automatically without stealing focus or blocking the next action',()=>{
  const {api,nodes,document,advance}=appHarness(appSource,htmlSource,configSource,dependencies);
  document.activeElement=nodes.get('preferences-button');const focus=document.activeElement;
  api.interact('frontdoor');const line=nodes.get('feedback-line');
  assert.equal(line.hidden,false);assert.ok(line.classList.contains('visible'));
  assert.ok(line.textContent.length<=45);assert.ok(!/thank|glad/i.test(line.textContent));
  assert.equal(document.activeElement,focus);
  api.interact('sidepath');assert.equal(api.getState().location,'back');
  advance(2400);assert.equal(line.classList.contains('visible'),false);
  advance(500);assert.equal(line.hidden,true);
});
test('a new result cancels the previous fade and restart clears pending feedback',()=>{
  const {api,nodes,advance}=appHarness(appSource,htmlSource,configSource,dependencies);
  api.interact('frontdoor');advance(1600);api.interact('sidepath');
  const line=nodes.get('feedback-line');advance(900);
  assert.ok(line.classList.contains('visible'),'the old timer must not fade a newer result');
  assert.equal(line.textContent,'Around the back.');
  nodes.get('restart-button').fire();assert.equal(line.hidden,true);
  advance(5000);assert.equal(line.hidden,true);assert.equal(api.getState().location,'front');
});
test('portrait and invitation remain explicit inspections and can be carried back to tea',()=>{
  const {api,nodes,config}=appHarness(appSource,htmlSource,configSource,dependencies,{savedState:serialize(tableState())});
  move(api,'sit','chest','photo');assert.equal(nodes.get('photo-dialog').open,true);
  nodes.get('photo-dialog').close();
  move(api,'returnroom','returntea');
  nodes.get('reopen-letter').fire();nodes.get('read-note').fire();
  assert.equal(nodes.get('letter-dialog').open,true);assert.equal(api.getState().location,'tea');
  assert.deepEqual(nodes.get('letter-body').children.map(p=>p.textContent),config.letter);
  assert.match(nodes.get('event-date').textContent,/13:30/);
  assert.match(nodes.get('event-place').textContent,/Hội trường A/);
});
test('same-place discoveries preserve horizontal and vertical looking',()=>{
  const {api,nodes}=appHarness(appSource,htmlSource,configSource,dependencies,{savedState:serialize(teaState())});
  const host=nodes.get('world');
  host.fire('pointerdown',{isPrimary:true,button:0,pointerId:1,clientX:10,clientY:10});
  host.fire('pointermove',{pointerId:1,clientX:350,clientY:400});
  host.fire('pointerup',{pointerId:1,clientX:350,clientY:400});
  const look=api.getLookState();assert.ok(look.yaw>.4&&Math.abs(look.pitch)>.1);
  api.interact('tea');assert.deepEqual(api.getLookState(),look);
});
test('a previous bathroom save starts in the table room without restoring removed mechanics',()=>{
  const old={version:3,location:'bath',facts:['key','backdoor','tea','window'],memories:[],wet:true,letterFound:false};
  const {api,nodes}=appHarness(appSource,htmlSource,configSource,dependencies,{v3SavedState:JSON.stringify(old)});
  assert.equal(api.getState().location,'treasure');
  assert.ok(api.getTargets().some(t=>t.id==='sit'));
  assert.ok(!nodes.has('wet-effect'));
});
test('closing an inspection returns focus to a visible object when the main cue is offscreen',()=>{
  let s=tableState();for(const id of['sit','chest','photo'])s=act(s,id).state;
  const {api,nodes,document}=appHarness(appSource,htmlSource,configSource,dependencies,{savedState:serialize(s)});
  const visible=api.getTargets().find(t=>t.id==='cup');
  for(const target of api.getTargets())target.button.hidden=target!==visible;
  nodes.get('reopen-letter').fire();nodes.get('photo-dialog').close();
  assert.ok(document.activeElement===visible.button);
});


test('the game starts with browser resize observation after the old card is removed',()=>{
  const {api,nodes}=appHarness(appSource,htmlSource,configSource,dependencies,{resizeObserver:true});
  assert.equal(api.getState().location,'front');
  assert.ok(nodes.get('feedback-line'));
  assert.ok(api.getTargets().some(target=>target.id==='sidepath'));
});
