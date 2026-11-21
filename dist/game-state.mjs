export const ACTIONS = Object.freeze([
  Object.freeze(['frontdoor', 'sidepath', 'backdoor']),
  Object.freeze(['chair', 'chair', 'cup', 'tap', 'tap', 'tap', 'window', 'left']),
  Object.freeze(['towel', 'room']),
  Object.freeze(['photo', 'turnphoto', 'cardboard', 'fold', 'fold', 'sit']),
]);

const VERSION = 2;
const FINAL_CHAPTER = ACTIONS.length - 1;
const PHASES = ['exterior', 'interior', 'pool', 'table'];

const SOUNDS = new Map(Object.entries({
  frontdoor: 'door', sidepath: 'soft', backdoor: 'door', chair: 'wood',
  cup: 'cup', tap: 'water', window: 'wood', left: 'water', towel: 'soft',
  room: 'wood', photo: 'paper', turnphoto: 'paper', cardboard: 'paper',
  fold: 'paper', sit: 'wood', number: 'soft', hose: 'soft', fan: 'fan',
  tape: 'paper', pattern: 'cup', fish: 'cup', plates: 'cup',
}));

const MEMORY_LOCATIONS = new Map([
  ['number', { chapter: 0, step: 2 }],
  ['photo', { chapter: FINAL_CHAPTER, step: 1, required: true }],
  ['writing', { chapter: FINAL_CHAPTER, step: 2, required: true }],
]);

const REQUIRED_MEMORIES = new Map([
  ['photo', 'photo'],
  ['turnphoto', 'writing'],
]);

const OPTIONAL_PROPS = [
  ['hose', 'chair'],
  ['fan', 'tape', 'pattern'],
  ['fish', 'plates'],
  [],
];

export function initialState() {
  return { version: VERSION, chapter: 0, step: 0, memories: [], letterFound: false };
}

export function getView({ chapter, step, memories, letterFound }) {
  return {
    chapter,
    step,
    phase: PHASES[chapter],
    activeAction: ACTIONS[chapter][step] ?? '',
    letterFound,
    photoFound: memories.includes('photo'),
    writingFound: memories.includes('writing'),
    caption: letterFound ? 'They are facing the house.' : '',
  };
}

export function act(state, actionId) {
  const { chapter, step, memories, letterFound } = state;
  const sequence = ACTIONS[chapter];
  if (!letterFound && actionId === sequence[step]) {
    const endOfChapter = step + 1 === sequence.length;
    const moveToNextChapter = endOfChapter && chapter < FINAL_CHAPTER;
    const memory = REQUIRED_MEMORIES.get(actionId);
    const nextState = {
      ...state,
      chapter: moveToNextChapter ? chapter + 1 : chapter,
      step: moveToNextChapter ? 0 : step + 1,
      memories: memory ? [...memories, memory] : memories,
      letterFound: chapter === FINAL_CHAPTER && endOfChapter,
    };
    const cupRattles = chapter === 1 && step === 1 && actionId === 'chair';
    const sound = cupRattles ? 'cup' : SOUNDS.get(actionId);
    return { state: nextState, changed: true, feedback: '', sound };
  }

  const numberLocation = MEMORY_LOCATIONS.get('number');
  const inspectingNumber = actionId === 'number'
    && chapter === numberLocation.chapter && step === numberLocation.step;
  if (inspectingNumber && !memories.includes('number')) {
    const nextState = { ...state, memories: [...memories, 'number'] };
    return { state: nextState, changed: true, feedback: '', sound: SOUNDS.get(actionId) };
  }

  const hasCup = chapter > 1 || (chapter === 1 && step >= 3);
  const optional = inspectingNumber
    || OPTIONAL_PROPS[chapter].includes(actionId)
    || (actionId === 'cup' && hasCup)
    || (actionId === 'photo' && memories.includes('photo'))
    || (actionId === 'turnphoto' && memories.includes('writing'));
  return { state, changed: false, feedback: '', sound: optional ? SOUNDS.get(actionId) : '' };
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function restore(raw) {
  if (typeof raw !== 'string') return initialState();

  let state;
  try {
    state = JSON.parse(raw);
  } catch {
    return initialState();
  }
  if (!state || typeof state !== 'object' || Object.keys(state).length !== 5) return initialState();

  const { version, chapter, step, memories, letterFound } = state;
  if (version !== VERSION || !Number.isInteger(chapter) || chapter < 0 || chapter > FINAL_CHAPTER) {
    return initialState();
  }
  const end = ACTIONS[chapter].length;
  const maxStep = chapter === FINAL_CHAPTER ? end : end - 1;
  if (!Number.isInteger(step) || step < 0 || step > maxStep) return initialState();
  if (letterFound !== (chapter === FINAL_CHAPTER && step === end)) return initialState();

  if (!Array.isArray(memories) || memories.length > MEMORY_LOCATIONS.size) return initialState();
  // Check save entries in discovery order so misplaced, repeated, or unknown entries remain unconsumed.
  let nextMemory = 0;
  for (const [memory, location] of MEMORY_LOCATIONS) {
    const reached = chapter > location.chapter || (chapter === location.chapter && step >= location.step);
    const remembered = memories[nextMemory] === memory;
    if ((remembered && !reached) || (location.required && reached && !remembered)) return initialState();
    if (remembered) nextMemory++;
  }

  return nextMemory === memories.length ? state : initialState();
}
