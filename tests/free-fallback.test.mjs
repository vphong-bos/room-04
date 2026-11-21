import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFallback} from '../dist/fallback.mjs';
import {fitPaperFrame} from '../dist/scene-view.mjs';

const facts = ['key','backdoor','tea','window','seated','chest','photo','writing'];
const chapters = {front:0,back:0,tea:1,window:1,treasure:3,ending:3};
function view(location, found = {}) {
  const flags = Object.fromEntries(facts.map(key => [key,!!found[key]]));
  const actions = {
    front:['frontdoor','sidepath','hose'],
    back:['returnfront','backdoor',...(!flags.key?['key']:[]),...(flags.backdoor?['enterhouse']:[])],
    tea:['tea','cup','fan','tape','pattern','outside',...(flags.tea?['window']:[]),...(flags.window?['left']:[])],
    window:['returntea','duck','flower','boat','jar','windmill','star'],
    treasure:['sit','returntea',...(flags.chest?['photo']:[]),...(flags.photo?['turnphoto']:[])],
    ending:['returnroom','returntea','chest','cup',...(flags.chest?['photo']:[]),...(flags.photo?['turnphoto']:[])],
  };
  return {freeExploration:true,location,chapter:chapters[location],step:0,
    room:['tea','window'].includes(location)?'tea':['treasure','ending'].includes(location)?'table':location,
    pose:location === 'window'?'window':location === 'ending'?'seated':'standing',
    flags,availableActions:actions[location],highlightActions:[],focusAction:actions[location][0],
    activeAction:'',photoFound:flags.photo,writingFound:flags.writing,letterFound:flags.writing};
}
const unlocked = {key:true,backdoor:true,tea:true,window:true};
const fixtureViews = [
  view('front'),view('back'),view('back',{key:true}),view('back',{key:true,backdoor:true}),
  view('tea'),view('tea',{tea:true}),view('tea',unlocked),view('window',unlocked),
  view('treasure',unlocked),view('ending',{...unlocked,seated:true}),
  view('ending',{...unlocked,seated:true,chest:true}),
  view('ending',{...unlocked,seated:true,chest:true,photo:true,writing:true}),
  view('treasure',{...unlocked,seated:true,chest:true,photo:true,writing:true}),
];
const target = (paper,id) => paper.targets.find(item => item.id === id);
const prop = (paper,id) => paper.svg.includes('data-prop="' + id + '"');
const propHeader = (paper,id) => paper.svg.match(new RegExp('<g data-prop="' + id + '"[^>]*>'))?.[0];
function roomArtwork(paper) {
  const opening = paper.svg.match(/<g data-fixed-room="[^"]+">/);
  assert.ok(opening,'the shared room artwork is missing');
  const start = opening.index + opening[0].length;
  let depth = 1;
  for (const match of paper.svg.slice(start).matchAll(/<\/?g\b[^>]*>/g)) {
    if (match[0].startsWith('</')) depth--;
    else if (!match[0].endsWith('/>')) depth++;
    if (!depth) return paper.svg.slice(start,start+match.index);
  }
  throw new Error('Unclosed room artwork');
}
function ancestorTransforms(paper,id) {
  const stack=[];
  for(const match of paper.svg.matchAll(/<g\b[^>]*>|<\/g>/g)) {
    const tag=match[0];
    if(tag.startsWith('</')) {stack.pop();continue;}
    const transform=tag.match(/transform="([^"]*)"/)?.[1];
    if(tag.includes('data-prop="' + id + '"')) return [...stack,transform].filter(Boolean);
    if(!tag.endsWith('/>')) stack.push(transform);
  }
  throw new Error('Missing prop ' + id);
}
function project(point,pose) {
  const camera = pose === 'window'?{scale:2.25,x:-1616.25,y:-189}:pose === 'seated'?{scale:1.15,x:-90,y:-72}: {scale:1,x:0,y:0};
  return {x:point.x*camera.scale+camera.x,y:point.y*camera.scale+camera.y};
}

test('the simplified free scenes expose exactly the independent available actions', () => {
  for (const current of fixtureViews) {
    const paper = buildFallback(current);
    assert.match(paper.svg,/^<svg\b[^>]*viewBox="0 0 1200 800"/);
    assert.match(paper.svg,/preserveAspectRatio="xMidYMid meet"/);
    assert.match(paper.svg,new RegExp('data-room="' + current.room + '"'));
    assert.match(paper.svg,new RegExp('data-pose="' + current.pose + '"'));
    assert.deepEqual(paper.targets.map(item=>item.id),current.availableActions,current.location);
    assert.equal(new Set(paper.targets.map(item=>item.id)).size,paper.targets.length);
    for(const item of paper.targets) {
      assert.ok(item.label.trim());
      assert.ok(Number.isFinite(item.x) && Number.isFinite(item.y),item.id);
      assert.ok(paper.svg.includes('data-action="' + item.id + '" data-x="' + item.x + '" data-y="' + item.y + '"'),item.id + ' anchor');
    }
  }
});

test('the front chair is static while the side path and rear-door puzzle stay available', () => {
  const front = buildFallback(view('front'));
  assert.ok(target(front,'frontdoor'));
  assert.ok(target(front,'sidepath'));
  assert.equal(target(front,'chair'),undefined);
  assert.match(front.svg,/data-prop="front-door" data-state="locked"/);
  const closed = buildFallback(view('back'));
  const collected = buildFallback(view('back',{key:true}));
  const open = buildFallback(view('back',{key:true,backdoor:true}));
  assert.ok(prop(closed,'key'));
  assert.equal(prop(collected,'key'),false);
  assert.match(open.svg,/data-prop="back-door" data-state="open"/);
  assert.ok(target(open,'backdoor').x < 610);
  assert.ok(Math.hypot(target(open,'backdoor').x-target(open,'enterhouse').x,target(open,'backdoor').y-target(open,'enterhouse').y)>65);
});

test('tea changes only its cup, shutter and existing hall opening', () => {
  const before = buildFallback(view('tea'));
  const brewed = buildFallback(view('tea',{tea:true}));
  const discovered = buildFallback(view('tea',unlocked));
  assert.ok(prop(before,'teapot'));
  assert.equal(prop(before,'amber-tea'),false);
  assert.ok(prop(brewed,'amber-tea'));
  assert.ok(prop(brewed,'tea-steam'));
  assert.match(brewed.svg,/data-prop="tea-window" data-state="open"/);
  assert.match(before.svg,/data-opening="hall" data-state="closed"/);
  assert.match(discovered.svg,/data-opening="hall" data-state="open"/);
  for(const id of ['tea-chair','tea-counter','tea-desk']) {
    assert.equal(propHeader(before,id),propHeader(discovered,id),id);
  }
  assert.equal(target(discovered,'chair'),undefined);
  assert.equal(target(discovered,'tap'),undefined);
});

test('the close window uses identical tea-room artwork and projects its existing sill cue', () => {
  const standing = buildFallback(view('tea',unlocked));
  const close = buildFallback(view('window',unlocked));
  assert.equal(roomArtwork(standing),roomArtwork(close));
  const back = target(close,'returntea');
  assert.deepEqual({x:back.x,y:back.y},project({x:985,y:385},'window'));
  assert.ok(back.label.toLowerCase().includes('back'));
  assert.equal((roomArtwork(close).match(/data-opening="/g)||[]).length,2);
  for(const id of ['duck','flower','boat','jar','windmill','star']) {
    assert.ok(prop(close,id),id);
    assert.ok(target(close,id),id);
  }
  assert.equal(target(close,'left'),undefined);
  assert.equal(roomArtwork(buildFallback(view('tea',unlocked))),roomArtwork(standing));
});

test('garden drawings and their markers use the same complete-room camera transform', () => {
  for(const location of ['tea','window']) {
    const paper=buildFallback(view(location,unlocked));
    const expected=location === 'window'?'translate(-1616.25 -189) scale(2.25)':'translate(0 0) scale(1)';
    for(const id of ['duck','flower','boat','jar','windmill','star'])
      assert.deepEqual(ancestorTransforms(paper,id),[expected],location+' '+id+' acquired an extra local room transform');
  }
});

test('standing and sitting keep the same table room, one arrival door and fixed furniture', () => {
  const standing = buildFallback(view('treasure',unlocked));
  const seated = buildFallback(view('ending',{...unlocked,seated:true}));
  assert.equal(roomArtwork(standing),roomArtwork(seated));
  assert.equal((roomArtwork(standing).match(/data-opening="/g)||[]).length,1);
  assert.match(roomArtwork(seated),/data-opening="arrival"/);
  for(const id of ['table','table-chair','table-bench','chest','table-mug','outside-shoes']) {
    assert.equal(propHeader(standing,id),propHeader(seated,id),id);
  }
  const door = target(standing,'returntea');
  const seatDoor = target(seated,'returntea');
  assert.deepEqual({x:seatDoor.x,y:seatDoor.y},project(door,'seated'));
  const stand = target(seated,'returnroom');
  assert.deepEqual({x:stand.x,y:stand.y},project(target(standing,'sit'),'seated'));
  assert.ok(stand.label.toLowerCase().includes('stand'));
  assert.ok(stand.x > seatDoor.x+250,'standing uses a table/seat cue, not the door');
});

test('the little chest stays on the table and only becomes interactive after sitting', () => {
  const standing = buildFallback(view('treasure',unlocked));
  const seated = buildFallback(view('ending',{...unlocked,seated:true}));
  assert.ok(prop(standing,'chest'));
  assert.equal(target(standing,'chest'),undefined);
  assert.ok(target(seated,'chest'));
  assert.match(propHeader(standing,'chest'),/data-surface="table"/);
  assert.match(propHeader(standing,'chest'),/data-size="0.32"/);
  assert.match(propHeader(standing,'chest'),/data-world-x="666" data-world-y="466"/);
  assert.equal(prop(standing,'letter'),false);
});

test('opening the seated chest reveals the letter directly in front on the same tabletop', () => {
  const found = {...unlocked,seated:true,chest:true,photo:true,writing:true};
  const seated = buildFallback(view('ending',found));
  const standing = buildFallback(view('treasure',found));
  assert.equal(roomArtwork(seated),roomArtwork(standing));
  assert.match(propHeader(seated,'letter'),/data-surface="table"/);
  assert.match(propHeader(seated,'letter'),/data-world-x="666" data-world-y="535"/);
  const box = target(seated,'chest'), letter = target(seated,'photo');
  assert.equal(letter.x,box.x);
  assert.ok(letter.y > box.y+50);
  assert.ok(target(seated,'turnphoto'));
  assert.ok(target(standing,'photo'));
  assert.equal(target(standing,'chest'),undefined);
});

test('removed bathroom and repair mechanics have no free scene artwork or action anchors', () => {
  const removed = ['chair','tap','towel','room','bath','cardboard','fold','fish','plates'];
  for(const current of fixtureViews) {
    const paper = buildFallback({...current,availableActions:[...current.availableActions,...removed]});
    for(const id of removed) assert.equal(target(paper,id),undefined,current.location+' '+id);
    for(const name of ['wet-footprints','dry-footprints','bench-shim','cardboard','towel','room-door'])
      assert.equal(prop(paper,name),false,current.location+' '+name);
    assert.equal(/data-wet=/.test(paper.svg),false);
  }
});

test('all action circles remain framed across portrait, desktop and short landscape', () => {
  for(const current of fixtureViews) {
    const paper = buildFallback(current);
    for(const [width,height] of [[390,844],[1440,900],[844,390]]) {
      const fit = fitPaperFrame(width,height,paper.targets[0],{top:96,bottom:36},paper.targets);
      for(const item of paper.targets) {
        const x = (item.x-fit.x)*fit.scale, y = (item.y-fit.y)*fit.scale;
        assert.ok(x>=fit.frame.left-.01 && x<=fit.frame.right+.01,current.location+' '+item.id+' horizontal');
        assert.ok(y>=fit.frame.top-.01 && y<=fit.frame.bottom+.01,current.location+' '+item.id+' vertical');
      }
    }
  }
});

test('legacy illustrated scenes retain their original geometry and actions', () => {
  const front = buildFallback({chapter:0,step:0});
  assert.deepEqual(front.targets.map(item=>item.id),['frontdoor','chair','hose']);
  assert.equal(/data-room=/.test(front.svg),false);
  const back = buildFallback({chapter:0,step:2});
  assert.deepEqual(back.targets.map(item=>item.id),['backdoor','number','hose']);
});


