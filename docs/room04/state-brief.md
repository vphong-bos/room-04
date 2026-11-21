# State module task — exact interface
Own only dist/game-state.mjs and tests/game-state.test.mjs. Read docs/room04/design.md for intent. No UI edits, browser, remote writes or subagents.

Build a pure immutable state machine for six gentle discovery scenes. Exports:
- initialState() => {version:1,chapter:0,step:0,memories:[],letterFound:false}
- getView(state) => {chapter,step,phase,activeAction,letterFound,caption} (chapter index 0..5)
- act(state, actionId) => {state,changed,feedback,sound}; do not mutate input. Unknown/out-of-order actions leave progress unchanged. Optional actions can yield a very short exact-story feedback line, never an instruction.
- serialize(state) string; restore(raw) valid state or initialState, rejecting corrupt/impossible shapes, unknown versions, out-of-range chapters/steps, premature letterFound.
- export ACTIONS describing ordered action IDs per chapter for tests/integration.

Required ordered arrays (repeated IDs deliberately represent repeated object interactions):
0 ['chair','guide','backdoor']
1 ['doorpot','curtain','petal','stairs']
2 ['turn','turn','turn','towel','stairs']
3 ['towel','chair','chair','paper','chair']
4 ['step','ramp','ramp','ramp','chair','water','dish','table']
5 ['cups','chair','label']

Completing an array advances chapter and resets step, except final label sets letterFound true and remains chapter5 step3. No other action can reveal letter. Frontdoor is always optional and can ring a bell but NEVER advance. Card/suitcase/cloud/flower/window/ring/kettle are optional; no need put all in every scene. Unique meaningful memories may collect card/petal/ring/label, with a bounded validated list. Save valid prior state without replaying side effects.

Phase names (contract for renderer):
chapter0 step0 'arrival', step1 'companions', step2 'backdoor'
chapter1 all 'weather'
chapter2 step0..2 'turning', step3 'rain', step4 'after-rain'
chapter3 step0..1 'pool', step2 'meadow', step3..4 'balcony'
chapter4 all 'return'
chapter5 step0 'table', step1 'chair', step2..3 'label'

Caption is a sparse one-sentence quote from user story associated with current phase; controller may show briefly only on entering chapter. Feedback max one sentence and usually empty. Suitable exact phrases: 'The road ends a few steps before the house.', 'They do, however, know how to open the door.', 'Inside, the rooms are arranged by weather.', 'Only inside.', 'It holds.', 'The clean circle remains on the windowsill.', 'There is still enough water.' No metaphoric explanation, no next-step instructions, no congratulations. Sounds can be 'bell','wood','water','paper','cup','soft', or ''.

Tests should prove whole main path has exactly correct 6 chapters; frontdoor cannot bypass backdoor; label locked until final; invalid save reset; save roundtrip; state immutable. Use Node built-ins, test first and run. Avoid giant mirrored implementation test cases. Report in docs/room04/state-report.md with files, verification and concerns; no git commit (project not an authenticated checkout).
