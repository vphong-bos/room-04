import {ACTIONS} from './game-state.mjs';

// One visible, actionable hint for the current story step.
const labels = Object.freeze({
  frontdoor:'Open the front door', sidepath:'Follow the side path',
  backdoor:'Go through the back door', chair:'Move the chair', cup:'Rinse the cup',
  tap:'Turn off the tap', window:'Look through the window', left:'Take the left corridor',
  towel:'Pick up the towel', room:'Go into the next room', photo:'Pick up the photograph',
  turnphoto:'Turn the photograph over', cardboard:'Take the cardboard',
  fold:'Fold the cardboard', sit:'Sit on the bench',
});

const freeLabels={
  frontdoor:'Try the locked front door',sidepath:'Go around the house',returnfront:'Return to the front',
  key:'Pick up the back-door key',enterhouse:'Go through the open door',outside:'Go back outside',
  tea:'Make a cup of tea',cup:'Make a cup of tea',window:'Look through the open window',
  left:'Follow the hallway to the table',returntea:'Return to the tea room',
  towel:'Dry yourself with the towel',room:'Go into the next room',chest:'Open the treasure chest',
  photo:'Pick up the letter',turnphoto:'Read the invitation',cardboard:'Take the cardboard',
  fold:'Steady the bench with folded cardboard',sit:'Sit at the table',
  returnroom:'Stand up',duck:'Look at the tiny duck',flower:'Look at the flower',
  boat:'Look at the little boat',jar:'Look at the glass bottle',windmill:'Look at the windmill',star:'Look at the little star',
};
export function actionLabel(view,id){
  if(!view?.freeExploration)return id===view?.activeAction?interactionHint(view)?.label||labels[id]||id:labels[id]||id;
  const flags=view.flags||{};
  if(id==='backdoor')return flags.backdoor?'Look at the open back door':flags.key?'Unlock the back door':'Try the back-door lock';
  if(id==='tea'||id==='cup')return view.location==='tea'&&!flags.tea?'Make a cup of tea':'Look at the cup of tea';
  if(id==='towel')return view.wet?'Dry yourself with the towel':'Look at the dry towel';
  if(id==='room'&&view.wet)return 'Dry off before entering the next room';
  if(id==='chest')return flags.chest?'Look inside the small box':'Open the small box';
  if(id==='photo'&&flags.photo)return 'Look at the graduation portrait';
  if(id==='returntea'&&view.location==='window')return 'Step back from the window';
  return freeLabels[id]||labels[id]||id;
}

export function interactionHint(view) {
  if(view?.freeExploration)return view.focusAction?{id:view.focusAction,label:actionLabel(view,view.focusAction)}:null;
  if (!view?.activeAction) return null;
  const {activeAction:id,step}=view;
  let label=labels[id];
  if (id==='chair'&&step===1) label='Push the chair again';
  if (id==='tap'&&step===4) label='Turn the tap again';
  if (id==='tap'&&step===5) label='Turn the tap once more';
  if (id==='fold'&&step===4) label='Fold it once more';
  return label ? {id,label} : null;
}

const optionalSegment = Object.freeze({
  chair:2, sit:2, cup:18, tap:18, fan:10, tape:10, pattern:14,
  fish:14, plates:10, hose:13, number:0, photo:14, turnphoto:14,
});

export function gratitudeMessage(view, id, config = {}) {
  if (!view || !id) return null;
  const read = value => typeof value==='string'&&value.trim() ? value : null;
  const fallback = read(config.interactionMessages?.[0]) || 'Thank you for being here.';
  if(view.freeExploration)return null;
  if (id===view.activeAction && ACTIONS[view.chapter]?.[view.step]===id) {
    const index=ACTIONS.slice(0,view.chapter).reduce((count,actions)=>count+actions.length,0)+view.step;
    return read(config.interactionMessages?.[index]) || fallback;
  }
  if (Object.hasOwn(optionalSegment,id))
    return read(config.interactionMessages?.[optionalSegment[id]]) || fallback;
  return null;
}

export function messageCardPosition(width,height,cardWidth,cardHeight,target,insets={},preferred=null){
  const left=Math.max(16,insets.left||0),right=Math.max(16,insets.right||0);
  const xRight=Math.max(left,width-right-cardWidth);
  const lastY=Math.max(8,height-Math.max(16,insets.bottom||16)-cardHeight);
  const top=Math.min(Math.max(16,(insets.top||54)+14),lastY);
  const candidates=[{x:xRight,y:top},{x:left,y:top},{x:xRight,y:lastY},{x:left,y:lastY}];
  const current=preferred&&candidates.find(position=>Math.abs(position.x-preferred.x)<.5&&Math.abs(position.y-preferred.y)<.5);
  if(!target||!Number.isFinite(target.x+target.y))return current||candidates[0];
  const overlap=position=>{
    const x=Math.max(0,Math.min(position.x+cardWidth,target.x+42)-Math.max(position.x,target.x-42));
    const y=Math.max(0,Math.min(position.y+cardHeight,target.y+42)-Math.max(position.y,target.y-42));
    const coversCenter=target.x>=position.x&&target.x<=position.x+cardWidth&&target.y>=position.y&&target.y<=position.y+cardHeight;
    return x*y+(coversCenter?1000000:0);
  };
  if(current&&overlap(current)===0)return current;
  return candidates.reduce((best,position)=>overlap(position)<overlap(best)?position:best);
}
