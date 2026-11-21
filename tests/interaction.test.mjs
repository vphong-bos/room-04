import {readFile} from 'node:fs/promises';
const configWindow = {};
new Function('window', await readFile(new URL('../dist/config.js', import.meta.url), 'utf8'))(configWindow);
const config = configWindow.INVITATION;

import assert from 'node:assert/strict';
import test from 'node:test';
import {act, getView, initialState} from '../dist/game-state.mjs';
import {interactionHint, gratitudeMessage, messageCardPosition} from '../dist/interaction.mjs';

test('every pending story action has a clear action label immediately', () => {
  let state=initialState(), count=0;
  while (!state.letterFound) {
    const before=JSON.stringify(state), view=getView(state), hint=interactionHint(view);
    assert.ok(hint, 'missing hint at '+view.chapter+':'+view.step);
    assert.equal(hint.id,view.activeAction);
    assert.match(hint.label,/^(Open|Follow|Go|Move|Push|Rinse|Turn|Look|Take|Pick|Fold|Sit)\b/);
    assert.equal(JSON.stringify(state),before,'hints must not advance the story');
    state=act(state,hint.id).state;
    count++;
    assert.ok(count<=19);
  }
  assert.equal(count,19);
  assert.equal(interactionHint(getView(state)),null,'the ending must not show another task');
});

test('repeated physical actions say what still needs to happen', () => {
  assert.equal(interactionHint({activeAction:'chair',step:0}).label,'Move the chair');
  assert.equal(interactionHint({activeAction:'chair',step:1}).label,'Push the chair again');
  assert.equal(interactionHint({activeAction:'tap',step:3}).label,'Turn off the tap');
  assert.equal(interactionHint({activeAction:'tap',step:4}).label,'Turn the tap again');
  assert.equal(interactionHint({activeAction:'tap',step:5}).label,'Turn the tap once more');
  assert.equal(interactionHint({activeAction:'fold',step:3}).label,'Fold the cardboard');
  assert.equal(interactionHint({activeAction:'fold',step:4}).label,'Fold it once more');
});

test('unfinished loading and completed views do not invent an interaction', () => {
  assert.equal(interactionHint(),null);
  assert.equal(interactionHint(null),null);
  assert.equal(interactionHint({}),null);
  assert.equal(interactionHint({activeAction:''}),null);
});

test('all nineteen interactions reveal the supplied thank-you text in order', () => {
  let state=initialState();
  const messages=[];
  while (!state.letterFound) {
    const view=getView(state), text=gratitudeMessage(view,view.activeAction,config);
    assert.ok(typeof text==='string'&&text.trim(),'missing thank-you at '+view.chapter+':'+view.step);
    messages.push(text);
    state=act(state,view.activeAction).state;
  }
  assert.equal(messages.length,19);
  assert.equal(messages.join(' '),config.letter.join(' '),'the journey must preserve all supplied words');
});

test('optional object interactions give thanks without consuming the next story message', () => {
  let state=initialState();
  const props=['chair','hose','fan','tape','pattern','fish','plates','cup','photo'];
  while (!state.letterFound) {
    const view=getView(state), next=gratitudeMessage(view,view.activeAction,config);
    for (const id of props) {
      const result=act(state,id);
      if(result.changed||!result.sound)continue;
      const text=gratitudeMessage(view,id,config);
      assert.ok(typeof text==='string'&&text.trim(),'optional interaction needs a thank-you');
      assert.equal(gratitudeMessage(view,view.activeAction,config),next,'optional messages must not skip the next message');
    }
    state=act(state,view.activeAction).state;
  }
  assert.equal(gratitudeMessage(getView(state),'unavailable',config),null);
});

test('side messages choose an available corner away from the current object',()=>{
  const bounds=messageCardPosition(390,844,260,160,{x:200,y:120},{top:54,bottom:36});
  assert.ok(bounds.y>400,'a top object needs the message at the bottom');
  const other=messageCardPosition(844,390,280,140,{x:740,y:120},{top:54,bottom:36});
  assert.ok(other.x<100,'a right object needs the message on the left');
  for(const [w,h,cw,ch]of[[240,320,208,120],[320,240,136,130],[390,844,260,220],[1440,900,300,180]]){
    const point={x:w/2,y:h/2},position=messageCardPosition(w,h,cw,ch,point,{top:54,bottom:36});
    assert.ok(position.x>=0&&position.x+cw<=w);
    assert.ok(position.y>=0&&position.y+ch<=h);
    assert.ok(point.x<position.x||point.x>position.x+cw||point.y<position.y||point.y>position.y+ch,'message covers the active object center');
  }
});
