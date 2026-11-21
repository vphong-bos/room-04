# Room 04 implementation plan

## Global constraints
The design.md and full user script govern the work. Cute, gentle, personal only. No visible instructions. No fake mesh downloads. Preserve free buildless publication. No credentials in source.

1. Verify exact Sketchfab sources, vendor engine and optional previews/licenses. Independent bounded asset task.
2. Implement pure scene state transitions, action affordances and validated save/restore; focused tests for full path, gate, reset, invalid input. Independent state module.
3. Build original 3D dioramas with repeated objects and state-driven transformation. Independent world module with fixed contract.
4. Integrate single-screen UI, raycast and accessible targets, transitions, sound/motion preferences, letter and source drawer. Parent task.
5. Browser-test the complete journey, keyboard/touch-sized layouts, and fallback. Review code, fix observed issues, preserve source and publishing instructions. Replace saved artifact.

## Rulings
- This is a revision to the unpushed local project; the prior ZIP is durable and remains recoverable. No existing external Git repository exists.
- The detailed user request authorizes implementation now; no extra design approval is necessary.
- Geometry and pure state modules have non-overlapping owned files and explicit interfaces, so parallel work is appropriate.
- GitHub publishing remains conditional on available authentication; no alternate host substitution.
