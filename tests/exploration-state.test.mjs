import assert from 'node:assert/strict';
import test from 'node:test';
import {initialState,getView,act,serialize,restore} from '../dist/exploration-state.mjs';
const take=(state,id)=>act(state,id).state;
const teaRoom=()=>{let s=initialState();for(const id of['sidepath','key','backdoor','enterhouse'])s=take(s,id);return s;};
const tableRoom=()=>{let s=teaRoom();for(const id of['tea','window','returntea','left'])s=take(s,id);return s;};
const removed=['chair','tap','bath','towel','room','cardboard','fold'];

test('removed puzzles never appear in available interactions',()=>{
  let s=initialState();
  for(const id of['sidepath','key','backdoor','enterhouse','tea','window','returntea','left','sit','chest','photo','turnphoto','returnroom','returntea']){
    const view=getView(s);
    assert.ok(!view.availableActions.some(action=>removed.includes(action)));
    for(const action of removed)assert.equal(serialize(take(s,action)),serialize(s));
    s=take(s,id);
  }
  assert.equal(s.location,'tea');
});
test('a key opens only the back door and entry remains a separate choice',()=>{
  let s=initialState();
  assert.ok(getView(s).availableActions.includes('sidepath'));
  assert.equal(take(s,'frontdoor').location,'front');
  s=take(s,'sidepath');assert.equal(act(s,'backdoor').changed,false);
  s=take(s,'key');const opened=act(s,'backdoor');s=opened.state;
  assert.equal(s.location,'back');assert.ok(opened.opened.includes('enterhouse'));
  assert.equal(take(s,'enterhouse').location,'tea');
});
test('the window is a pose in the tea room and its hallway leads directly to the table',()=>{
  let s=teaRoom();
  assert.ok(!getView(s).availableActions.includes('window'));
  s=take(s,'tea');s=take(s,'window');
  assert.equal(getView(s).room,'tea');assert.equal(getView(s).pose,'window');
  assert.ok(!getView(s).availableActions.includes('left'),'step back from the same window before walking away');
  for(const id of['star','duck','boat'])s=take(s,id);
  s=take(s,'returntea');
  assert.equal(getView(s).room,'tea');assert.equal(getView(s).pose,'standing');
  assert.ok(getView(s).availableActions.includes('left'));
  s=take(s,'left');assert.equal(s.location,'treasure');assert.equal(getView(s).room,'table');
});
test('the table chest can be opened only while seated and no repair is required',()=>{
  let s=tableRoom();
  assert.ok(getView(s).availableActions.includes('sit'));
  assert.ok(!getView(s).availableActions.includes('chest'));
  assert.equal(act(s,'chest').changed,false);
  s=take(s,'sit');
  assert.equal(s.location,'ending');assert.equal(getView(s).room,'table');assert.equal(getView(s).pose,'seated');
  assert.ok(getView(s).availableActions.includes('chest'));
  s=take(s,'chest');assert.ok(getView(s).flags.chest);
  s=take(s,'returnroom');
  assert.equal(s.location,'treasure');assert.equal(getView(s).room,'table');
  assert.ok(!getView(s).availableActions.includes('chest'),'standing must not leave the chest interaction enabled');
});
test('the portrait and invitation stay accessible after standing and returning to tea',()=>{
  let s=tableRoom();
  for(const id of['sit','chest','photo','returnroom','returntea'])s=take(s,id);
  assert.equal(s.location,'tea');assert.ok(getView(s).photoFound);
  s=take(s,'turnphoto');
  assert.ok(getView(s).writingFound);assert.equal(s.letterFound,true);
  assert.equal(s.location,'tea');
});
test('returning through the same rooms retains normal puzzle state',()=>{
  let s=tableRoom();
  for(const id of['sit','chest','returnroom','returntea','outside','returnfront','sidepath','enterhouse','left'])s=take(s,id);
  assert.equal(s.location,'treasure');
  assert.ok(getView(s).flags.chest&&getView(s).flags.tea&&getView(s).flags.backdoor);
  assert.equal(s.facts.length,new Set(s.facts).size);
  assert.equal(Object.hasOwn(s,'wet'),false);
});
test('action feedback is one short result without thank-you paragraphs',()=>{
  let s=initialState();
  for(const id of['frontdoor','sidepath','backdoor','key','backdoor','enterhouse','tea','window','duck','returntea','left','sit','chest','photo','turnphoto','returnroom']){
    const result=act(s,id);
    assert.ok(result.feedback.length<=45,'feedback is too long: '+id);
    assert.ok(!/thank you|glad you|still inviting|\n/i.test(result.feedback));
    s=result.state;
  }
});
test('version four restores valid progress and rejects malformed or obsolete fields',()=>{
  const s=tableRoom();
  assert.equal(s.version,4);assert.deepEqual(restore(serialize(s)),s);
  const invalid=[{...s,location:['front']},{...s,location:{}},{...s,location:'bath'},
    {...s,wet:false},{...s,facts:[...s.facts,'tap']},{...s,facts:[...s.facts,'seated','chest'],letterFound:true},
    {...s,facts:s.facts.filter(id=>id!=='key')},{...s,memories:['writing']}];
  for(const value of invalid)assert.deepEqual(restore(JSON.stringify(value)),initialState());
  for(const raw of['null','[]','{','true'])assert.deepEqual(restore(raw),initialState());
});
test('old bathroom progress migrates to the table without wet or repair mechanics',()=>{
  const old={version:3,location:'bath',facts:['key','backdoor','tea','window'],memories:[],wet:true,letterFound:false};
  const s=restore(JSON.stringify(old));
  assert.equal(s.version,4);assert.equal(s.location,'treasure');
  assert.equal(Object.hasOwn(s,'wet'),false);
  assert.ok(!s.facts.some(id=>removed.includes(id)||['dry','folded'].includes(id)));
  assert.deepEqual(restore(JSON.stringify({...old,facts:['window']})),initialState());
});
test('valid previous invitation discoveries survive migration',()=>{
  const old={version:2,chapter:3,step:2,memories:['photo','writing'],letterFound:false};
  const s=restore(JSON.stringify(old));
  assert.equal(s.version,4);assert.equal(s.location,'treasure');
  assert.ok(getView(s).photoFound&&getView(s).writingFound);
  assert.ok(getView(s).flags.seated&&getView(s).flags.chest);
});
