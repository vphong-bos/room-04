# Room 04

A small exploration game leading to a graduation invitation. Find the back-door key, make tea, enjoy the window view, then sit at the table to open a little box.

Available objects can be explored freely. The house has two interior rooms, with a window viewpoint in the tea room and a seated viewpoint at the table. Those are views of the same rooms: their doors and furniture stay in place. There is no bathroom, wet/towel task, moving-chair task, tap task or bench repair.

The invitation welcomes everyone and their friends to **13:30 on Thursday, 26 November 2026**, at **Hội trường A (Tầng 3, Nhà A), Trường ĐH Công nghệ Thông tin**. It includes the supplied portrait and a Google Maps link.

## Run

```bash
cd cloud-nine-graduation
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open http://localhost:8000. Stop with Ctrl+C. Use HTTP because the browser loads native JavaScript modules.

No Node, package install, API key, backend or build step is needed to run the site. Geometry, model meshes, fonts, portrait and illustrated artwork are local.

## Explore

- The front door stays locked. Take the side path, find the key behind the house, unlock the back door, then choose its entrance circle.
- Make tea using the cup or teapot. The window opens. Look through it and inspect the tiny objects in any order.
- Step back from that same window. The existing hallway leads directly to the table room.
- Sit at the table to interact with the small tabletop box. It reveals the letter on the table in front of it.
- Inspect the portrait and use Read the note to see the invitation. The carried portrait remains available when visiting other places.
- Stand up at the same table or return through the room's original entrance. Opening the box does not require chair movement, cardboard or repairs.

The 3D and illustrated games share the same state and room layouts. Returns do not create new doors. Looking at the window and sitting change the viewpoint without rearranging the room.

Circles are hollow, with light outlines and transparent centers so they leave object details visible. Useful objects have a larger ring and a brief attention animation. Touch areas remain 58 pixels.

An interaction displays one short result line in the center. It fades after about 2.4 seconds and does not capture input or keyboard focus. There are no side message cards, dismiss buttons, thank-you additions or bottom hint bar. The portrait/invitation open only when explicitly inspected.

Drag horizontally or vertically to look around in 3D. Arrow keys also look around; Home faces forward. Camera position and projection stay steady during manual looking. Same-place discoveries preserve the actual current camera, including during a move into the seated pose. Switching from illustrated to 3D installs the current authored viewpoint.

Keyboard users can Tab between objects and use Enter or Space. Focus returns to a visible object after inspection. Settings include muted-by-default sound, reduced motion, illustrated view and restart. Illustrated mode remains playable if WebGL is unavailable.

Saves use room04:journey:v4. Valid earlier progress migrates; former bathroom saves resume in the table room, and obsolete wet/repair facts are removed. Invalid saves reset safely. No account or tracking script is used.

## Edit the invitation

dist/config.js contains the invitation and confirmed ceremony details. Its older interactionMessages text is retained for legacy fixtures and is not added to current interaction feedback.

| Configuration | Effect |
| --- | --- |
| title | Browser tab and Open Graph title |
| letter | Invitation paragraphs |
| greeting, signoff, graduate | Optional personal text; blank values are hidden |
| event.name | Gathering title |
| event.start, event.end | ISO dates with explicit offsets; a valid start displays independently |
| event.timezone | Display timezone, currently Asia/Ho_Chi_Minh |
| event.venue, event.address | Location text |
| event.mapUrl | HTTPS Google Maps link |
| event.rsvpUrl | Optional HTTPS or mailto link |
| event.dressCode, event.note | Optional practical details |

The end time and RSVP are unconfigured. Calendar export requires a valid confirmed end after the start. The invitation is part of a static site and is present in its source.

## Source map

| File | Responsibility |
| --- | --- |
| dist/exploration-state.mjs | Current v4 rules, available actions, room/pose metadata, short feedback and save migration |
| dist/game-state.mjs | Previous-version validation and historical test fixtures |
| dist/discovery-props.mjs | Shared 3D tea/window and table/seated room composers |
| dist/world.mjs | Cached room primitives, resources, imported-mesh lifecycle and legacy compositions |
| dist/model-assets.mjs | Seven actual meshes embedded offline with source metadata |
| dist/fallback.mjs | Matching illustrated rooms and viewpoints, plus historical fixtures |
| dist/app.mjs | Input, camera, navigation, timed centered feedback and invitation dialogs |
| dist/interaction.mjs | Object labels and legacy message helpers |
| dist/scene-view.mjs | Responsive framing, target projection, surface hit detection and render limits |
| dist/style.css | Hollow circles, centered fading text and invitation styling |
| dist/assets/story/graduation-portrait.png | Supplied portrait, unchanged |
| dist/event.mjs | Event dates, safe links and calendar generation |
| docs/room04/simple-room-flow.md | Current room and gameplay contract |
| docs/room04/simple-room-progress.md | Latest verification and review record |
| docs/room04/free-exploration-assets.md | Obtained model sources and conversion details |

The original supplied story remains in docs/room04/story.md as adaptation reference. Earlier design and verification documents are historical and are superseded by the simplified room contract.

## Publish to GitHub Pages

For an existing deployment, push the updated project to the same GitHub repository and let its Pages workflow run.

For first-time setup, the included publisher needs Bash, Git, Python 3 and the official [GitHub CLI](https://cli.github.com/):

```bash
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
bash scripts/publish.sh dreamcore-graduation
```

Use the same repository name for later publisher runs. The script checks local assets and the intended destination, avoids empty commits and does not force-push. Integrate remote commits before retrying if the remote changed.

If Git needs an author identity:

```bash
git config --local user.name "Your Name"
git config --local user.email "YOUR_GITHUB_EMAIL_OR_NOREPLY_ADDRESS"
```

If workflow permission is missing:

```bash
gh auth refresh --hostname github.com --scopes workflow
```

The site is live after Deploy to GitHub Pages succeeds. No deployment was performed from the current editing workspace.

## Assets and credits

The game embeds seven actual CC0 meshes: key, flower, boat, bottle, star, chest and teapot. Six are by Quaternius; the Utah teapot is Martin Newell's model edited by Yuki Koyama. The converted meshes total 2,857 triangles, load locally and need no runtime model downloader. Exact sources and license evidence are in [the asset report](docs/room04/free-exploration-assets.md).

The earlier Sketchfab works remain labelled references in Sources, with previews and optional original viewers. Their mesh files are not included. Original rooms and SVG illustrations are custom. [ATTRIBUTION.md](ATTRIBUTION.md) preserves artist and library notices.

The portrait is unchanged. The UIT campus image has been removed; the invitation uses Google Maps. Three.js 0.160.1 is vendored under MIT. Local fonts use SIL OFL.

## Checks

Node is needed only for development tests:

```bash
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_publish.py' -v
bash -n scripts/publish.sh
```

The current host cannot start Node because bwrap cannot create a namespace. The saved modules passed **99 compatibility test bodies** with the real vendored Three. These cover state, save migration, controller timing, layout continuity, target rays, resources and camera mathematics.

A separate state-to-scene playthrough checked 29 snapshots and 130 action rays with no missing or obstructed physical actions. Independent review probed canonical reachable states, previous-version migration and renderer switching.

Two unchanged positive calendar/link cases require URL/TextEncoder globals absent from the compatibility executor. Real browser CSS, pointer delivery, WebGL lighting/shadows and frame rate remain unverified. See [the latest ledger](docs/room04/simple-room-progress.md) for exact evidence and limits.
