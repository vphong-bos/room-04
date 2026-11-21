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

test('the entry choice appears before the scene and blocks early game input',()=>{
 const {api,nodes,document}=appHarness(appSource,htmlSource,configSource,dependencies,{chooseView:false});
 assert.equal(nodes.get('adventure').hidden,true);
 assert.equal(nodes.get('adventure').inert,true);
 assert.equal(nodes.get('view-choice').hidden,false);
 api.interact('sidepath');
 assert.equal(api.getState().location,'front');
 let prevented=false;
 document.fire('keydown',{key:'ArrowRight',preventDefault(){prevented=true;}});
 assert.equal(api.getLookState().yaw,0);
 assert.equal(prevented,false,'chooser keyboard input must not drive the camera');
});
test('the red pill selects 3D even when illustrated view was previously saved',()=>{
 const {api,nodes,storage}=appHarness(appSource,htmlSource,configSource,dependencies,{chooseView:false,preferences:{paper:true}});
 nodes.get('choose-red-pill').fire();
 assert.equal(api.getPreferences().paper,false);
 assert.equal(JSON.parse(storage.get('room04:preferences:v1')).paper,false);
 assert.equal(nodes.get('choose-red-pill').disabled,true);
 assert.equal(nodes.get('choose-blue-pill').disabled,true);
 assert.match(nodes.get('view-choice-status').textContent,/3D/);
 api.finishEntry();
 assert.equal(nodes.get('view-choice').hidden,true);
 assert.equal(nodes.get('adventure').hidden,false);
 assert.equal(nodes.get('adventure').inert,false);
});
test('the blue pill opens the illustrated view and focuses a scene object when ready',()=>{
 const {api,nodes,document}=appHarness(appSource,htmlSource,configSource,dependencies,{chooseView:false,preferences:{paper:false}});
 nodes.get('choose-blue-pill').fire();
 assert.equal(api.getPreferences().paper,true);
 api.finishEntry();
 assert.equal(nodes.get('paper-world').hidden,false);
 assert.equal(nodes.get('world').hidden,true);
 assert.ok(api.getTargets().some(target=>target.button===document.activeElement),'ready game must receive focus');
 api.interact('sidepath');
 assert.equal(api.getState().location,'back');
});
test('the first pill activation wins over repeated or conflicting input',()=>{
 const {api,nodes}=appHarness(appSource,htmlSource,configSource,dependencies,{chooseView:false});
 nodes.get('choose-red-pill').fire();
 api.chooseView('illustrated');
 assert.equal(api.getPreferences().paper,false);
 api.finishEntry();
 api.chooseView('illustrated');
 assert.equal(api.getPreferences().paper,false);
});
test('choosing a view preserves existing progress and invalid choices do not start it',()=>{
 let saved=initialState();for(const id of['sidepath','key','backdoor','enterhouse'])saved=act(saved,id).state;
 const {api,nodes}=appHarness(appSource,htmlSource,configSource,dependencies,{chooseView:false,savedState:serialize(saved)});
 api.chooseView('green');
 assert.equal(nodes.get('adventure').hidden,true);
 nodes.get('choose-blue-pill').fire();api.finishEntry();
 assert.deepEqual(api.getState(),saved);
 assert.equal(api.getPreferences().paper,true);
});


test('losing a running red-pill view explains the illustrated fallback once',()=>{
 const {api,nodes,advance}=appHarness(appSource,htmlSource,configSource,dependencies,{viewChoice:'3d'});
 const before=serialize(api.getState());let prevented=false;
 api.loseContext({preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(api.getPreferences().paper,true);
 assert.equal(nodes.get('paper-world').hidden,false);
 assert.match(nodes.get('feedback-line').textContent,/illustrated/i);
 assert.equal(serialize(api.getState()),before);
 advance(3000);
 api.loseContext({preventDefault(){}});
 assert.equal(nodes.get('feedback-line').hidden,true,'a repeated loss must not repeat the notice');
});
test('blue-pill view does not show a 3D fallback notice for its hidden renderer',()=>{
 const {api,nodes}=appHarness(appSource,htmlSource,configSource,dependencies,{viewChoice:'illustrated'});
 api.loseContext({preventDefault(){}});
 assert.equal(api.getPreferences().paper,true);
 assert.equal(nodes.get('feedback-line').hidden,true);
});
