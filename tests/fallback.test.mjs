import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFallback} from '../dist/fallback.mjs';
import {act, getView, initialState} from '../dist/game-state.mjs';

const route = [
  ['frontdoor', 'sidepath', 'backdoor'],
  ['chair', 'chair', 'cup', 'tap', 'tap', 'tap', 'window', 'left'],
  ['towel', 'room'],
  ['photo', 'turnphoto', 'cardboard', 'fold', 'fold', 'sit', null],
];
const phases = ['exterior', 'interior', 'pool', 'table'];
const scene = (chapter, step) => buildFallback({
  chapter,
  step,
  activeAction: route[chapter][step],
  phase: phases[chapter],
  photoFound: chapter === 3 && step >= 1,
  writingFound: chapter === 3 && step >= 2,
  letterFound: chapter === 3 && step === 6,
});
const target = (paper, id) => paper.targets.find(item => item.id === id);

test('every revised Room 04 action has one in-frame fallback target', () => {
  let state = initialState();
  let views = 0;
  let actions = 0;
  for (const [chapter, steps] of route.entries()) {
    for (const [step, action] of steps.entries()) {
      const at = `${chapter}:${step}`;
      const view = getView(state);
      assert.equal(`${view.chapter}:${view.step}`, at);
      assert.equal(view.activeAction, action ?? '', at);
      const paper = buildFallback(view);
      assert.match(paper.svg, /^<svg\b[^>]*viewBox="0 0 1200 800"/, at);
      assert.match(paper.svg, /<rect width="1200" height="800" fill="/, at);
      assert.equal(new Set(paper.targets.map(item => item.id)).size, paper.targets.length, at);
      for (const item of paper.targets) {
        assert.ok(item.label.trim(), `${at} ${item.id} has no label`);
        assert.ok(Number.isFinite(item.x) && item.x > 0 && item.x < 1200, `${at} ${item.id} x`);
        assert.ok(Number.isFinite(item.y) && item.y > 0 && item.y < 800, `${at} ${item.id} y`);
        const result = act(state, item.id);
        assert.ok(result.changed || result.sound, `${at} shows unavailable ${item.id}`);
      }
      if (action) {
        const active = target(paper, action);
        assert.ok(active, `${at} needs a ${action} target`);
        assert.ok(active.x >= 250 && active.x <= 950, `${at} crops ${action} horizontally`);
        assert.ok(active.y >= 170 && active.y <= 660, `${at} crops ${action} vertically`);
        state = act(state, action).state;
        actions++;
      }
      views++;
    }
  }
  assert.equal(views, 20);
  assert.equal(actions, 19);
});

test('the repainted number appears in the backdoor frame', () => {
  assert.equal(target(scene(0, 0), 'number'), undefined);
  assert.equal(target(scene(0, 1), 'number'), undefined);
  assert.ok(target(scene(0, 2), 'number'));
  assert.deepEqual(
    route.flatMap((steps, chapter) => steps.flatMap((_, step) =>
      [...scene(chapter, step).svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(match => match[1]))),
    ['04'],
  );
});

test('pushing the chair twice and turning the tap three times change the picture', () => {
  for (const steps of [[0, 1, 2], [3, 4, 5, 6]]) {
    const images = steps.map(step => scene(1, step).svg);
    assert.equal(new Set(images).size, steps.length);
  }
  assert.notEqual(target(scene(1, 0), 'chair').x, target(scene(1, 1), 'chair').x);
  assert.notEqual(target(scene(1, 2), 'cup').x, target(scene(1, 3), 'tap').x);
});

test('the dry towel moves from the scratched pool chair to the open room door', () => {
  assert.ok(target(scene(2, 0), 'towel'));
  assert.equal(target(scene(2, 0), 'room'), undefined);
  assert.equal(target(scene(2, 1), 'towel'), undefined);
  assert.ok(target(scene(2, 1), 'room'));
  assert.notEqual(scene(2, 0).svg, scene(2, 1).svg);
});

test('the photograph remains inspectable after discovery and the final sit', () => {
  assert.ok(target(scene(3, 0), 'photo'));
  assert.ok(target(scene(3, 1), 'turnphoto'));
  for (const step of [2, 3, 4, 5, 6]) assert.ok(target(scene(3, step), 'photo'), String(step));
  assert.equal(target(scene(3, 6), 'sit'), undefined);
  assert.equal(target(scene(3, 6), 'fold'), undefined);
});

test('both cardboard folds and sitting change the table composition', () => {
  const tableViews = route[3].map((_, step) => scene(3, step).svg);
  assert.equal(new Set(tableViews).size, 7);
});
