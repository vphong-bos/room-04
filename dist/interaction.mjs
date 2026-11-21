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

export function interactionHint(view) {
  if (!view?.activeAction) return null;
  const {activeAction:id,step}=view;
  let label=labels[id];
  if (id==='chair'&&step===1) label='Push the chair again';
  if (id==='tap'&&step===4) label='Turn the tap again';
  if (id==='tap'&&step===5) label='Turn the tap once more';
  if (id==='fold'&&step===4) label='Fold it once more';
  return label ? {id,label} : null;
}

const optionalParagraph = Object.freeze({
  chair:1, sit:1, cup:9, tap:9, fan:5, tape:5, pattern:7,
  fish:7, plates:5, hose:6, number:0, photo:7, turnphoto:7,
});

export function gratitudeMessage(view, id, config = {}) {
  if (!view || !id) return null;
  const read = value => typeof value==='string'&&value.trim() ? value : null;
  const fallback = read(config.letter?.[0]) || 'Thank you for being here.';
  if (id===view.activeAction && ACTIONS[view.chapter]?.[view.step]===id) {
    const index=ACTIONS.slice(0,view.chapter).reduce((count,actions)=>count+actions.length,0)+view.step;
    return read(config.interactionMessages?.[index]) || fallback;
  }
  if (Object.hasOwn(optionalParagraph,id))
    return read(config.letter?.[optionalParagraph[id]]) || fallback;
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
