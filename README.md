# Room 04

A quiet, personal discovery game based on the latest supplied story. From the road the house has one floor. The pool is one floor below the sink window, but the left corridor reaches its water without any stairs.

The visitor moves through four spaces. A chair catches between tiles, a tap takes several turns to stop, and a photograph has been keeping a bench steady. The photograph contains the full personal note, beginning:

> I’m glad you’re still here. I don’t think I’ve said that enough.

There is no name. Reading it is not the ending: the visitor still folds cardboard beneath the leg and sits down. The last view includes the shoes outside, facing the house.

This revision replaces the previous six-chapter route. The folder/archive retain the existing `cloud-nine-graduation` name. Visible markers guide the interaction. There is no visible chapter counter, score, music bed, or explanation of the story's meaning.

## Run

Extract the archive, then:

```bash
cd cloud-nine-graduation
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open http://localhost:8000. Stop with `Ctrl+C`. Use HTTP rather than opening `index.html` directly; the browser loads native JavaScript modules.

No Node, package install, Python library, API key or build step is required to run it. Scene geometry, fonts, the found photograph and the illustrated fallback are local. The original Sketchfab viewers load only when selected in Sources.

## Edit the writing or add your invitation

`dist/config.js` contains the exact default note and blank optional event details. The story is intentionally unsigned. No guest name is inserted from the URL.

| Configuration | Effect |
| --- | --- |
| `title` | Browser tab and Open Graph title |
| `letter` | Full personal note on the back of the photograph; each item is a paragraph |
| `interactionMessages` | Nineteen thank-you segments, one for each required action in story order |
| `greeting`, `signoff`, `graduate` | Optional personal text, hidden when blank |
| `event.name` | Optional gathering title |
| `event.start`, `event.end` | ISO dates with explicit offsets; both must be valid, with end after start |
| `event.timezone` | Display timezone; default Asia/Bangkok |
| `event.venue`, `event.address` | Location text |
| `event.mapUrl` | Optional HTTPS map link |
| `event.rsvpUrl` | Optional HTTPS form or mailto link |
| `event.dressCode`, `event.note` | Optional practical details |

`classYear` is retained for compatibility but is not displayed automatically. Dates and calendar export appear only when configured correctly. Calendar files convert the supplied offset to UTC. An address, map or RSVP can be supplied without dates. RSVP opens the configured destination; this site does not collect responses.

The writing is a discovery within a static game, not confidential data. It is present in the source. Printing is enabled after the final sit.

## Source map

| File | Responsibility |
| --- | --- |
| `dist/game-state.mjs` | Four scenes, nineteen ordered interactions, discovery memories, saved-state validation |
| `dist/world.mjs` | Original 3D scene geometry, cameras and physical prop changes |
| `dist/scene-view.mjs` | Responsive 3D/SVG framing, live target anchors, visible-surface hit detection and drawing-buffer limits |
| `dist/fallback.mjs` | Complete illustrated version using the same story state |
| `dist/app.mjs` | Click/keyboard controls, side messages, photo front/back, audio, progress and preferences |
| `dist/interaction.mjs` | Clear action labels and thank-you selection for required and optional interactions |
| `dist/style.css` | Restrained interface and photographic paper surfaces |
| `dist/assets/story/found-photograph.png` | Generated, partially obscured photograph from the latest script |
| `dist/model-sources.mjs` | Original-model source and license records |
| `dist/event.mjs` | Strict date validation, safe links and calendar generation |
| `docs/room04/story.md` | Current user-supplied prose, preserved as the story reference |
| `docs/room04/revision-2/design.md` | Original four-room adaptation contract, including author-only spoilers |

The small scratch remains visible on the recurring blue chair. A partial blue pattern by the sink recurs as a fish on a plant's plate. Plant pots remain still. The photograph's hand remains ambiguous, partly cut off by the frame. The game does not explain these details.

## Interaction

Click or tap objects. Keyboard users can Tab to labelled objects and use Enter or Space. The next usable object has a visible marker immediately and is first in the object tab order. Each required action reveals the next part of the personal message; optional objects also show a thank-you without advancing the story. Messages appear as side cards, update when you interact again, and can be dismissed. They do not pause the scene or take keyboard focus. The photograph and full note open only when you choose to inspect them. The photograph can be turned through its curled corner, image surface or Read the note button; Escape puts it down. The full note remains available from Read note in the header. Inspecting it again does not skip either bench adjustment.

The 3D and illustrated views adapt to phones, tablets, desktop and landscape windows. Framing keeps interactive objects and important story details visible, including the complete sink window and the shoes in the final view. Rotating the device refits the scene and its touch targets.

Sound starts muted. When enabled, the scene adds cup, wood, door, fan-click and dripping-tap sounds generated locally. There is no music. Reduced motion respects both the device setting and the Settings toggle. The illustrated view remains fully playable if WebGL is unavailable.

Progress stays in the current browser. Start again resets the current story. Earlier version-one saves do not unlock this revised route. No account, tracking script or backend is used by the game.

## Publish to free GitHub Pages

Requirements: Bash, Git, Python 3 and the official [GitHub CLI](https://cli.github.com/).

```bash
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
bash scripts/publish.sh dreamcore-graduation
```

The script creates a public personal repository, configures the included Pages Actions workflow, commits the project and pushes main. Public repositories are the free Pages route. The publisher verifies local assets and the intended Git destination, rejects unrelated repository history and does not force-push.

Choose an unused repository name if desired. For later updates, preview the changes and rerun the same publisher command with the same repository name. It avoids empty commits. Integrate remote commits before retrying if the remote has changed.

If Git needs an author identity after initialization:

```bash
git config --local user.name "Your Name"
git config --local user.email "YOUR_GITHUB_EMAIL_OR_NOREPLY_ADDRESS"
bash scripts/publish.sh dreamcore-graduation
```

If workflow permission is missing:

```bash
gh auth refresh --hostname github.com --scopes workflow
```

The script prints the site and Actions URLs. The site is live when Deploy to GitHub Pages succeeds. The environment used to prepare this package is not signed in to GitHub; no successful public deployment is claimed.

Official references: [Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Assets

The seven original Sketchfab references remain in Sources with their official previews, licenses and optional viewers. **Their downloaded meshes are not included.** Playable geometry is original; Sketchfab archive downloads require authentication. `ATTRIBUTION.md` records the distinction and all artist credits, including pr1me_3d.

The found photograph was generated for this project, then edited to match the final script: a sleeve obscures most of the image; the remaining edge contains two cups and part of a hand. Its prompt record is in `docs/room04/revision-2/image-prompt.md`.

Three.js 0.160.1 is local under MIT. Font files use SIL OFL. The supplied story retains its author's rights; the original code license is in LICENSE.

## Checks

Node is needed only for development tests:

```bash
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_publish.py' -v
bash -n scripts/publish.sh
```

The publisher tests use a temporary local bare repository and simulated GitHub API. The preview browser has WebGL disabled, so browser playthroughs use the illustrated version. 3D geometry, target projections and resource lifecycle have separate tests; GPU lighting and shadows still require a visual check on a WebGL-enabled device. The latest responsive correction and its exact verification limits are recorded in `docs/room04/responsive-view-report.md`. Earlier revision evidence remains in `docs/room04/revision-2/progress.md` and the adjacent reports.
