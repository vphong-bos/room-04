# Room 04 photograph revision review

Reviewed the controller, saved state, photograph artwork, both scene renderers and touch controls against the revised story. The 19 actions reach the ending only after the player reads the photograph, retrieves the cardboard, folds it twice and sits.

## Findings and verification

| Finding | Verified behavior after correction |
| --- | --- |
| Closing the newly revealed back during its scene transition could lose keyboard focus. The last bench action also discarded the focused target. | A timer and focus harness using the actual controller functions confirmed that early dismissal focuses the cardboard and keyboard sitting focuses the discovered photograph icon. Sitting leaves all dialogs closed. |
| A pickup timer could reopen a manually dismissed photograph. | Opening and dismissing at 401 milliseconds left the photograph closed past the original 650-millisecond deadline. Restarting cancels the pending transition, discovery and focus timers. |
| On a 320-pixel screen, the large tap button intercepted taps at the center of the cup. The illustrated corridor also intercepted taps at the center of the tape. | The controller now selects the closest object for overlapping pointer hits. Checked the cup and tap at all three stages in both renderers, and the tape and corridor in the illustration. Activating the keyboard-focused button still selects that button. |
| Clicking into the 3D corridor and table-room doorway missed because only their frames were interactive. | Rays through both original opening-center coordinates now hit their intended passage at 320 × 568, 390 × 844 and 1440 × 900. Both accessible overlay centers coincide with those points. |
| The heel and toe direction was ambiguous in the illustrated ending. | A fresh raster crop from the revised SVG shows two dark heel openings furthest from the house, followed by laces and rounded nearer toes. The 3D shoe geometry points in the same direction. |

The front photograph shows a sleeve obscuring most of the frame, with part of a table, two cups and a hand visible on the right. The default back contains only the unsigned blue line “I put it back before I left.” Turning and reopening an already discovered print preserves the current bench step. Print visibility follows completion of the sit. The reviewed version retains author-editable invitation configuration.

The 14 state and event tests passed in this review. The controller checks used deterministic Node harnesses. The 3D checks used actual scene geometry and cameras, and the illustrated shoe check used an Inkscape raster. Browser interaction, GPU lighting and the final project-wide test run fall outside this independent review.
