# Room 04 story-state report

- `dist/game-state.mjs` contains the six chapter sequences, phase-specific views, optional discoveries, and versioned save validation. The front door rings without affecting chapter or step. The label becomes active after the last chair interaction and reveals the letter once.
- `tests/game-state.test.mjs` covers the entire path, the front-door and label gates, phase transitions, frozen inputs, optional memories, save round trips, and invalid saves. The save validator requires the petal and label memories after their discovery steps. Card and ring collection remain optional.
- Both save regression tests reproduced the missing-memory bug before the fix. `node --test tests/*.test.mjs` passed all 13 tests after the fix. `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_publish.py' -v` passed all 8 publisher tests.

`changed` also reports a newly remembered optional object. The chapter, step, and letter flag distinguish those updates from scene changes. The completed view has an empty `activeAction`. Browser interaction and rendering remain with the integration task.
