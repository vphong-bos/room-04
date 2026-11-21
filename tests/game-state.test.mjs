import test from 'node:test';
import assert from 'node:assert/strict';

import { ACTIONS, act, getView, initialState, restore, serialize } from '../dist/game-state.mjs';

const SCENES = [
  ['frontdoor', 'sidepath', 'backdoor'],
  ['chair', 'chair', 'cup', 'tap', 'tap', 'tap', 'window', 'left'],
  ['towel', 'room'],
  ['photo', 'turnphoto', 'cardboard', 'fold', 'fold', 'sit'],
];
const ROUTE = SCENES.flat();
const SOUNDS = new Set(['wood', 'water', 'paper', 'cup', 'soft', 'fan', 'door']);

function play(actions, state = initialState()) {
  for (const action of actions) {
    const result = act(state, action);
    assert.equal(result.changed, true, `Expected ${action} to change state`);
    assert.ok(SOUNDS.has(result.sound), `Unexpected sound for ${action}: ${result.sound}`);
    state = result.state;
  }
  return state;
}

function at(actionCount) {
  return play(ROUTE.slice(0, actionCount));
}

test('the four ordered scenes take nineteen actions and end after sitting', () => {
  assert.deepEqual(ACTIONS, SCENES);

  let state = initialState();
  let actionCount = 0;
  const phases = ['exterior', 'interior', 'pool', 'table'];
  for (const [chapter, actions] of SCENES.entries()) {
    for (const [step, action] of actions.entries()) {
      const view = getView(state);
      assert.equal(view.chapter, chapter);
      assert.equal(view.step, step);
      assert.equal(view.phase, phases[chapter]);
      assert.equal(view.activeAction, action);
      assert.equal(view.letterFound, false);
      assert.equal(view.photoFound, actionCount >= 14);
      assert.equal(view.writingFound, actionCount >= 15);
      assert.equal(view.caption, '');
      if (actionCount < 14) assert.deepEqual(state.memories, []);
      else if (actionCount === 14) assert.deepEqual(state.memories, ['photo']);
      else assert.deepEqual(state.memories, ['photo', 'writing']);
      assert.deepEqual(restore(serialize(state)), state);
      state = play([action], state);
      actionCount++;
    }
  }

  assert.equal(actionCount, 19);
  assert.equal(state.version, 2);
  assert.deepEqual(state.memories, ['photo', 'writing']);
  assert.deepEqual(getView(state), {
    chapter: 3, step: 6, phase: 'table', activeAction: '', letterFound: true,
    photoFound: true, writingFound: true, caption: 'They are facing the house.',
  });
  assert.equal(act(state, 'sit').changed, false);
  assert.deepEqual(restore(serialize(state)), state);
});

test('the exterior requires the side path and back door to enter', () => {
  const entry = initialState();
  assert.equal(act(entry, 'sidepath').state, entry);
  assert.equal(act(entry, 'backdoor').state, entry);

  const cracked = at(1);
  assert.equal(cracked.chapter, 0);
  assert.equal(act(cracked, 'backdoor').state, cracked);

  const rear = at(2);
  assert.equal(rear.chapter, 0);
  assert.equal(act(rear, 'frontdoor').state, rear);
  assert.equal(act(rear, 'cup').state, rear);
  assert.equal(play(['backdoor'], rear).chapter, 1);
});

test('writing appears when the photo is turned and sitting completes the route', () => {
  for (let actionCount = 0; actionCount < 14; actionCount++) {
    const state = at(actionCount);
    const prematureTurn = act(state, 'turnphoto');
    assert.equal(prematureTurn.changed, false);
    assert.equal(prematureTurn.state, state);
    assert.equal(prematureTurn.sound, '');
  }

  const inspecting = at(14);
  const reopening = act(inspecting, 'photo');
  assert.equal(reopening.state, inspecting);
  assert.equal(reopening.changed, false);
  assert.equal(reopening.sound, 'paper');
  const turned = play(['turnphoto'], inspecting);
  assert.deepEqual(turned.memories, ['photo', 'writing']);
  assert.equal(turned.letterFound, false);
  assert.equal(act(turned, 'sit').state, turned);

  const firstFold = play(['cardboard', 'fold'], turned);
  assert.equal(act(firstFold, 'sit').state, firstFold);
  const secondFold = play(['fold'], firstFold);
  const finished = play(['sit'], secondFold);
  assert.equal(finished.letterFound, true);

  for (const state of [turned, firstFold, secondFold, finished]) {
    for (const action of ['photo', 'turnphoto']) {
      const repeat = act(state, action);
      assert.equal(repeat.state, state);
      assert.equal(repeat.changed, false);
      assert.equal(repeat.sound, 'paper');
    }
  }
});

test('two separate chair moves and three separate taps unlock the window', () => {
  const arrival = at(3);
  const oneChair = play(['chair'], arrival);
  assert.equal(act(oneChair, 'cup').state, oneChair);
  assert.equal(act(oneChair, 'chair').sound, 'cup');
  const twoChairs = play(['chair'], oneChair);
  assert.equal(act(twoChairs, 'tap').state, twoChairs);
  const cup = play(['cup'], twoChairs);
  const twoTaps = play(['tap', 'tap'], cup);
  assert.equal(act(twoTaps, 'window').state, twoTaps);
  const threeTaps = play(['tap'], twoTaps);
  assert.equal(getView(threeTaps).activeAction, 'window');
});

test('recording a memory leaves earlier frozen snapshots unchanged', () => {
  const state = at(2);
  const frozen = Object.freeze({ ...state, memories: Object.freeze([]) });
  const examined = play(['number'], frozen);

  assert.deepEqual(frozen, state);
  assert.notEqual(examined, frozen);
  assert.deepEqual(examined.memories, ['number']);
  assert.equal(examined.chapter, 0);
  assert.equal(examined.step, 2);
  assert.equal(act(examined, 'number').state, examined);
  const corridor = play(['backdoor'], examined);
  assert.equal(corridor.chapter, 1);
  assert.equal(examined.chapter, 0);
  assert.deepEqual(examined.memories, ['number']);
});

test('the optional number can be recorded only beside the back door', () => {
  for (const actionCount of [0, 1, 3, 11, 13, 19]) {
    const state = at(actionCount);
    assert.equal(act(state, 'number').state, state);
    assert.equal(act(state, 'number').sound, '');
  }
  const state = at(2);
  const result = act(state, 'number');
  assert.equal(result.changed, true);
  assert.equal(result.state.chapter, state.chapter);
  assert.equal(result.state.step, state.step);
  assert.deepEqual(result.state.memories, ['number']);
});

test('optional room props give a sound without advancing the scene', () => {
  const props = [
    [0, 'hose'], [0, 'chair'], [3, 'fan'], [3, 'tape'], [3, 'pattern'],
    [6, 'cup'], [11, 'fish'], [11, 'plates'], [13, 'cup'],
  ];
  for (const [actionCount, id] of props) {
    const state = at(actionCount);
    const result = act(state, id);
    assert.equal(result.state, state, id);
    assert.equal(result.changed, false, id);
    assert.ok(SOUNDS.has(result.sound), id);
  }
  const start = initialState();
  for (const id of ['fan', 'pattern', 'fish', 'plates', 'cup', 'unknown']) {
    assert.equal(act(start, id).sound, '', id);
  }
  assert.equal(act(at(11), 'pattern').sound, '');
  assert.equal(act(at(13), 'fish').sound, '');
});

test('a valid unfinished save keeps discovered objects and resumes the pending action', () => {
  const outside = play(['number'], at(2));
  const state = play(ROUTE.slice(2, 16), outside);
  const restored = restore(serialize(state));

  assert.deepEqual(restored, state);
  assert.notEqual(restored, state);
  assert.notEqual(restored.memories, state.memories);
  assert.deepEqual(restored.memories, ['number', 'photo', 'writing']);
  assert.equal(getView(restored).activeAction, 'fold');
  assert.equal(getView(restored).writingFound, true);
  assert.equal(restored.letterFound, false);
  assert.equal(play(['fold'], restored).step, 4);
});

test('version 1 and malformed or impossible version 2 saves restart outside', () => {
  const start = { version: 2, chapter: 0, step: 0, memories: [], letterFound: false };
  const malformed = [null, undefined, '', '{', 'null', '[]', '{}'];
  const oldEnding = '{"version":1,"chapter":5,"step":3,"memories":["petal","label"],"letterFound":true}';
  const impossible = [
    { version: 1 }, { chapter: -1 }, { chapter: 4 }, { chapter: 0.5 }, { step: -1 },
    { step: 3 }, { chapter: 1, step: 8 }, { chapter: 2, step: 2 }, { step: '0' },
    { letterFound: true }, { letterFound: 'false' },
    { chapter: 3, step: 2, letterFound: true, memories: ['photo', 'writing'] },
    { chapter: 3, step: 6, letterFound: false, memories: ['photo', 'writing'] },
    { extra: true }, { memories: null }, { memories: ['missing'] },
    { memories: ['number'] }, { memories: ['photo'] }, { memories: ['writing'] },
    { chapter: 0, step: 2, memories: ['number', 'number'] },
    { chapter: 3, step: 2, memories: ['writing', 'photo'] },
    { chapter: 3, step: 6, letterFound: true, memories: ['photo', 'number', 'writing'] },
  ];
  for (const raw of [...malformed, oldEnding, ...impossible.map(changes => JSON.stringify({ ...start, ...changes }))]) {
    assert.deepEqual(restore(raw), start, `Expected reset for ${raw}`);
  }
});

test('valid saves require the photograph and writing only once each is found', () => {
  const before = { ...initialState(), chapter: 3, step: 0 };
  const inspecting = { ...before, step: 1, memories: ['photo'] };
  const turned = { ...before, step: 2, memories: ['photo', 'writing'] };
  const ending = { ...turned, step: 6, letterFound: true };
  for (const state of [before, inspecting, turned, ending]) {
    assert.deepEqual(restore(serialize(state)), state);
  }

  for (const state of [
    { ...before, memories: ['photo'] },
    { ...inspecting, memories: [] },
    { ...inspecting, memories: ['photo', 'writing'] },
    { ...turned, memories: ['photo'] },
    { ...turned, memories: ['writing'] },
    { ...ending, memories: ['photo'] },
  ]) {
    assert.deepEqual(restore(serialize(state)), initialState());
  }
});
