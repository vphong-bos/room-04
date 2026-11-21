import {restore as restoreLegacy} from './game-state.mjs';

const VERSION=4;
const FACTS=Object.freeze(['key','backdoor','tea','window','seated','chest','photo','writing']);
const LOCATIONS=Object.freeze({front:0,back:0,tea:1,window:1,treasure:3,ending:3});
const TRINKETS=Object.freeze(['duck','flower','boat','jar','windmill','star']);
const DISCOVERIES=Object.freeze(['photo','writing',...TRINKETS]);
const REQUIREMENTS={backdoor:['key'],tea:['backdoor'],window:['tea'],seated:['window'],chest:['seated'],photo:['chest'],writing:['photo']};
const has=(state,id)=>state.facts.includes(id);
const validList=(items,known)=>Array.isArray(items)&&items.length<=known.length&&new Set(items).size===items.length&&items.every(item=>typeof item==='string'&&known.includes(item));

export function initialState(){
  return {version:VERSION,location:'front',facts:[],memories:[],letterFound:false};
}
function actions(state){
  const f=id=>has(state,id);
  switch(state.location){
    case 'front':return ['frontdoor','sidepath','hose'];
    case 'back':return ['returnfront','backdoor',...(!f('key')?['key']:[]),...(f('backdoor')?['enterhouse']:[])];
    case 'tea':return ['tea','cup','fan','tape','pattern','outside',...(f('tea')?['window']:[]),...(f('window')?['left']:[])];
    case 'window':return ['returntea',...TRINKETS];
    case 'treasure':return ['sit','returntea',...(f('chest')?['photo']:[])];
    case 'ending':return ['returnroom','returntea','chest','cup',...(f('chest')?['photo']:[])];
    default:return [];
  }
}
function highlights(state){
  const f=id=>has(state,id);
  switch(state.location){
    case 'front':return ['sidepath'];
    case 'back':return !f('key')?['key']:!f('backdoor')?['backdoor']:['enterhouse'];
    case 'tea':return !f('tea')?['tea','cup']:!f('window')?['window']:['window','left'];
    case 'window':return ['returntea'];
    case 'treasure':return f('chest')&&!f('writing')?['photo','sit']:['sit'];
    case 'ending':return !f('chest')?['chest']:!f('photo')?['photo']:!f('writing')?['photo']:['returnroom'];
    default:return [];
  }
}
export function getView(state){
  const flags=Object.fromEntries(FACTS.map(id=>[id,has(state,id)]));
  const chapter=LOCATIONS[state.location],highlightActions=highlights(state);
  const room=state.location==='window'?'tea':['treasure','ending'].includes(state.location)?'table':state.location;
  const pose=state.location==='window'?'window':state.location==='ending'?'seated':'standing';
  const step=state.location==='back'?2:state.location==='tea'?2:state.location==='window'?6:state.location==='treasure'?(flags.photo?2:0):state.location==='ending'?6:0;
  return {freeExploration:true,location:state.location,room,pose,chapter,step,flags,
    phase:['exterior','interior','pool','table'][chapter],availableActions:actions(state),highlightActions,
    focusAction:highlightActions[0]||'',activeAction:'',photoFound:flags.photo,writingFound:flags.writing,
    letterFound:state.letterFound,inspectionActions:flags.photo?['photo','turnphoto']:[],discoveries:[...state.memories],caption:''};
}
export function act(state,id){
  const unchanged=(sound='',feedback='')=>({state,changed:false,sound,feedback,reward:'',opened:[]});
  const carried=(id==='photo'||id==='turnphoto')&&has(state,'photo');
  if(!actions(state).includes(id)&&!carried)return unchanged();
  const next={...state,facts:[...state.facts],memories:[...state.memories]};
  const add=fact=>{if(!next.facts.includes(fact))next.facts.push(fact);};
  const discover=item=>{if(!next.memories.includes(item))next.memories.push(item);};
  let sound='soft',feedback='',reward='';
  switch(id){
    case 'frontdoor':return unchanged('door','Locked. Try the side path.');
    case 'sidepath':next.location='back';feedback='Around the back.';break;
    case 'returnfront':next.location='front';feedback='Back at the front.';break;
    case 'key':add('key');sound='cup';feedback='Key found.';reward=feedback;break;
    case 'backdoor':
      if(!has(state,'key'))return unchanged('door','Find the key nearby.');
      if(has(state,'backdoor'))return unchanged('door','The back door is open.');
      add('backdoor');sound='door';feedback='The back door opens.';reward=feedback;break;
    case 'enterhouse':next.location='tea';sound='door';feedback='Welcome inside.';break;
    case 'outside':next.location='back';sound='door';feedback='Back outside.';break;
    case 'returntea':next.location='tea';feedback=state.location==='window'?'Step back from the window.':'Back in the tea room.';break;
    case 'tea':case 'cup':
      sound='cup';
      if(state.location!=='tea')return unchanged(sound,'Warm tea.');
      if(has(state,'tea'))return unchanged(sound,'The tea is still warm.');
      add('tea');feedback='Tea is ready. Look outside.';reward=feedback;break;
    case 'window':add('window');next.location='window';sound='wood';feedback='The hallway is open.';reward=feedback;break;
    case 'left':next.location='treasure';sound='wood';feedback='At the table.';break;
    case 'sit':add('seated');next.location='ending';sound='wood';feedback='Take a seat.';break;
    case 'returnroom':next.location='treasure';sound='wood';feedback='You stand up.';break;
    case 'chest':
      if(has(state,'chest'))return unchanged('wood','The box is open.');
      add('chest');sound='wood';feedback='The box opens.';reward=feedback;break;
    case 'photo':
      if(has(state,'photo'))return unchanged('paper','A graduation portrait.');
      add('photo');discover('photo');sound='paper';feedback='An invitation for you.';break;
    case 'turnphoto':
      if(has(state,'writing'))return unchanged('paper','Everyone is welcome.');
      add('writing');discover('writing');sound='paper';feedback='You’re invited!';reward=feedback;break;
    default:
      if(TRINKETS.includes(id)){
        discover(id);sound='cup';feedback={duck:'A little duck.',flower:'A tiny flower.',boat:'A little boat.',jar:'A glass bottle.',windmill:'A little windmill.',star:'A lucky little star.'}[id];
      }else return unchanged({hose:'soft',fan:'fan',tape:'paper',pattern:'cup'}[id]||'soft',
        {hose:'A hose by the path.',fan:'A quiet fan.',tape:'Little pieces of tape.',pattern:'A familiar blue pattern.'}[id]||'');
  }
  next.letterFound=has(next,'writing');
  const changed=JSON.stringify(next)!==JSON.stringify(state);
  const before=new Set([...actions(state),...highlights(state)]);
  const opened=[...new Set([...actions(next),...highlights(next)])].filter(action=>!before.has(action));
  return {state:changed?next:state,changed,sound,feedback,reward,opened};
}
export function serialize(state){return JSON.stringify(state);}
function finishMigration(location,facts,memories){
  const state={...initialState(),location,facts:FACTS.filter(id=>facts.includes(id)),memories:memories.filter(id=>DISCOVERIES.includes(id))};
  if(has(state,'chest')&&!has(state,'seated'))state.facts.splice(state.facts.indexOf('chest'),0,'seated');
  state.letterFound=has(state,'writing');
  return state;
}
function migrateV3(value){
  const keys=['version','location','facts','memories','wet','letterFound'];
  const places={front:0,back:0,tea:1,window:1,bath:2,treasure:3,ending:3};
  const known=['key','backdoor','tea','window','dry','chest','photo','writing','cardboard','folded','seated','chair','tap'];
  const dependencies={backdoor:['key'],tea:['backdoor'],window:['tea'],dry:['window'],chest:['dry'],photo:['chest'],writing:['photo'],cardboard:['dry'],folded:['cardboard'],seated:['folded'],chair:['backdoor'],tap:['backdoor']};
  if(Object.keys(value).length!==keys.length||!keys.every(key=>Object.hasOwn(value,key))||typeof value.location!=='string'||!Object.hasOwn(places,value.location)||typeof value.wet!=='boolean'||typeof value.letterFound!=='boolean')return initialState();
  if(!validList(value.facts,known)||!validList(value.memories,DISCOVERIES))return initialState();
  for(const id of value.facts)if((dependencies[id]||[]).some(required=>!has(value,required)))return initialState();
  if(value.memories.includes('photo')!==has(value,'photo')||value.memories.includes('writing')!==has(value,'writing'))return initialState();
  if(value.memories.some(id=>TRINKETS.includes(id))&&!has(value,'window'))return initialState();
  const needed={tea:'backdoor',window:'window',bath:'window',treasure:'dry',ending:'seated'}[value.location];
  if(needed&&!has(value,needed))return initialState();
  if(value.wet&&(!has(value,'window')||['treasure','ending'].includes(value.location)))return initialState();
  if(value.letterFound!==(has(value,'writing')&&has(value,'seated')))return initialState();
  return finishMigration(value.location==='bath'?'treasure':value.location,value.facts,value.memories);
}
function migrateV2(raw,value){
  const legacy=restoreLegacy(raw),keys=['version','chapter','step','memories','letterFound'];
  if(Object.keys(value).length!==keys.length||!keys.every(key=>JSON.stringify(value[key])===JSON.stringify(legacy[key])))return initialState();
  const facts=[],add=(...ids)=>ids.forEach(id=>{if(!facts.includes(id))facts.push(id);});
  let location='front';
  if(legacy.chapter===0){if(legacy.step>0)location='back';if(legacy.step===2)add('key');}
  else{
    add('key','backdoor');location='tea';
    if(legacy.chapter>1||legacy.step>=3)add('tea');
    if(legacy.chapter>1||legacy.step>=7)add('tea','window');
    if(legacy.chapter>=2)location='treasure';
    if(legacy.chapter===3&&legacy.memories.includes('photo'))add('seated','chest','photo');
    if(legacy.chapter===3&&legacy.memories.includes('writing'))add('writing');
    if(legacy.chapter===3&&legacy.step>=6){add('seated');location='ending';}
  }
  return finishMigration(location,facts,legacy.memories);
}
export function restore(raw){
  if(typeof raw!=='string')return initialState();
  let value;try{value=JSON.parse(raw);}catch{return initialState();}
  if(!value||typeof value!=='object'||Array.isArray(value))return initialState();
  if(value.version===3)return migrateV3(value);
  if(value.version===2)return migrateV2(raw,value);
  const keys=['version','location','facts','memories','letterFound'];
  if(Object.keys(value).length!==keys.length||!keys.every(key=>Object.hasOwn(value,key))||value.version!==VERSION||typeof value.location!=='string'||!Object.hasOwn(LOCATIONS,value.location)||typeof value.letterFound!=='boolean')return initialState();
  if(!validList(value.facts,FACTS)||!validList(value.memories,DISCOVERIES))return initialState();
  for(const id of value.facts)if((REQUIREMENTS[id]||[]).some(required=>!has(value,required)))return initialState();
  if(value.memories.includes('photo')!==has(value,'photo')||value.memories.includes('writing')!==has(value,'writing'))return initialState();
  if(value.memories.some(id=>TRINKETS.includes(id))&&!has(value,'window'))return initialState();
  const needed={tea:'backdoor',window:'window',treasure:'window',ending:'seated'}[value.location];
  if(needed&&!has(value,needed))return initialState();
  if(value.letterFound!==has(value,'writing'))return initialState();
  return {...value,facts:[...value.facts],memories:[...value.memories]};
}
