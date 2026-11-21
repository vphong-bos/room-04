# Room 04 state report

The version 2 state runs the four scenes in 19 actions. The second chair push cues the cup rattle. The window becomes active after the third tap turn. The passage enters the pool before the towel and room actions lead to the table. Each bench fold is a separate step, and the final sit completes the story.

`getView` reports the phases `exterior`, `interior`, `pool` and `table`. It derives `photoFound` and `writingFound` from their memories at table steps 1 and 2. `letterFound` becomes true at table step 6, when the view displays “They are facing the house.” The photo and its reverse can be inspected again after discovery. Those inspections preserve the current bench step and still work after the sit.

The repainting can be recorded as the optional `number` memory at exterior step 2. The hose and exterior chair, interior fan, tape and pattern, pool fish and plates, and carried cup give sound feedback without advancing. The five saved keys are unchanged. Restore resets version 1 saves and any version 2 save with impossible coordinates, a premature ending flag, or unknown, misplaced, repeated or missing required memories.

## Verification

- The new state tests failed against the earlier route. The cup-rattle assertion also failed independently before the sound was added.
- `node --test tests/game-state.test.mjs tests/event.test.mjs` passed all 14 tests, including a save round trip at each of the 20 views.
- `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_publish.py' -v` passed all 8 publisher tests.
- The full JavaScript suite snapshot had 14 passes and 7 failures while the renderers were being revised. The six fallback assertions covered the in-frame action target, repainted number, chair and tap changes, towel move, photograph reopen and table composition. The world suite failed to import because its renderer was still missing the `buildWorld` export. The full suite needs a fresh run once both renderers are integrated.
