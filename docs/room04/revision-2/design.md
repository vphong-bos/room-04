# Room 04 — the photograph (latest user revision)

Binding story: ../story.md, which contains the latest supplied prose verbatim. This revision supersedes all earlier six-chapter and tabletop-chair plans. The user additionally requests "unslop it": ordinary specific details, restrained atmosphere, no added moral, lyrical padding, tutorial prose or ornamental surrealism.

Keep the previous visual cues that remain compatible: one-story white house/green roof, bleached sky, concrete/hose, cropped scenery. The latest script adds the small scratch, bottle-cap fan cord, stuck chair, rattling cup, multiple tap turns, repeated fish pattern, photo under a BENCH leg, exact unnamed blue-pen sentence and a quiet ending AFTER repairing the bench. No wandering pots, clouds on washing lines, toy-house pedestal, indoor rain, ramp quest, teapot party or final sentimental letter.

## Architecture
Existing buildless HTML/CSS/native JS with local Three.js, complete SVG fallback, keyboard/touch objects, optional synthesized environmental sounds, local progress and free GitHub Pages publisher. Root integrates a generated, intentionally obstructed photograph. No new dependencies, no server or external viewer during play. Existing Sketchfab credits truthfully identify references rather than downloaded meshes. Save version 2, key room04:journey:v2; old route resets.

## Exact route — four scenes, nineteen actions

| Chapter | Actions in order | Visible progression |
| --- | --- | --- |
| 0 exterior | frontdoor, sidepath, backdoor | one-story house; suitcase against scratched blue chair, tag toward wall; front door meets second chair; flat side grass; repainted open back door with 04 visible in light |
| 1 interior | chair, chair, cup, tap, tap, tap, window, left | passage chair catches then moves; cup rattles/door closes; cup rinsed; tap drips then finally stops; sink window shows pool BELOW with towel on railing; LEFT corridor leads to pool without stairs |
| 2 pool | towel, room | shallow warm water around shoes; same scratched blue chair/dry towel; pots on different plates, one blue fish; repeated partial blue pattern was at sink; carry cup into next room |
| 3 table | photo, turnphoto, cardboard, fold, fold, sit | narrow bench on fourth side, cushion folded over one end; lift photo from short leg; see front then exact writing; find cardboard at sill; first fold still rocks, second stabilizes; sit with photo beside cup; outside shoes face house |

Final state c3 step6 with letterFound true; other last steps c0=2,c1=7,c2=1. Existing five state keys retained. Mandatory photo memory after c3step1; mandatory writing after c3step2. getView adds photoFound/writingFound derived booleans for controller convenience. letterFound means story complete; writing may be inspected earlier when writingFound is true. No whole-screen text/captions except optional exact last line 'They are facing the house.' at final sit; no other captions. The single text on photo back is exactly 'I put it back before I left.' with no name, greeting, signoff or interpretation. Optional event fields remain configurable but blank by default.

## Controller contract
Finding photo opens front dialog; a curled corner/whole image can be tapped to turn it. The first turn advances state and reveals back. The same photo can be reopened/flipped later without advancing bench actions. Closing back returns to the current scene. After the last sit, do not automatically open another letter; hold the final view. Reopen icon only after photoFound. Restart cancels timers and removes discovery/print state. Print only after final sit. Keyboard focus returns to the live current target or discovered-photo icon. No visible step counter.

## Renderer contracts
buildWorld(THREE,view) -> {root,targets:[{id,label,object,anchor:Vector3}],camera:{position,target,width,height},background,update(t,dt,{reducedMotion}),dispose()}.
buildFallback(view) -> {svg,targets:[{id,label,x,y}]} using viewBox 0 0 1200 800. Parent handles fitting and target overlays. Active targets remain phone-safe even if scenery is cropped. Target labels name objects only. Every repeated chair/tap/fold action must have a visible consequence. Still plants; animate only fan, drips, faint water and the loose bench. No ornamental sparkles; a restrained outline on idle/hover is acceptable for discoverability. Muted environmental audio by default; fan click, cup rattle, door contact and tap drips, no music/chord bed.

## Validation
All20states with19action targets. Order gating, required discoveries, malformed/old saves, optional props, photo reopen/flip without accidental progress, final quiet sit, both renderers, keyboard/mobile, reduced motion, stateful prop changes and print/timer guards. GPU lighting remains a stated limit if the preview browser still lacks WebGL.
