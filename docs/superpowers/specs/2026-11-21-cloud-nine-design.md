# Cloud Nine graduation invitation

## Intent
Create a cute dreamcore personal website, centered on a graduation invitation, with a small editable journal. The user wants custom code, free GitHub Pages hosting, internet-sourced elements, and free cute Sketchfab 3D models. Horror and uncanny imagery are excluded.

## Chosen approach
Buildless HTML, CSS, and JavaScript in `dist/`, published with a terminal script and GitHub Actions. This follows the GitHub Pages direction already accepted in the conversation. A framework would add installation and maintenance without benefiting this small site. A fully WebGL interface would make event details less accessible and would require model files that Sketchfab currently requires an authenticated download to obtain.

## Visual direction (builder's choice)
“Cloud Nine”: pale sky blue, cornflower ink, butter yellow, lilac details; expressive Fraunces display typography; handwritten Caveat notes; slow clouds; paper invitation; a floating sakura island and a rainbow from Sketchfab. Asymmetric editorial composition, no generic feature-card grid. Keep the mood optimistic and gentle.

## Functionality
- One `dist/config.js` for personal details, date/time with explicit offset, venue/map, RSVP URL, invitation letter, and journal entries.
- Open/close a keyboard-accessible invitation, guest-name personalization through `?to=`, calendar download only after valid event dates exist, and an RSVP link only after a real destination exists.
- Click-to-load official Sketchfab embeds with visible creator/license credits and local credited preview images. Never pretend the model archives were downloaded.
- Small journal entries open in accessible reading dialogs. Default writing is labeled sample content.
- Motion toggle and reduced-motion support; no autoplay audio, tracking, database, or fake RSVP confirmations.

## Unknown real-world details
Graduate name, date/time, venue, and RSVP address are not supplied. Keep them explicit editable placeholders. Do not invent real event details or publish them as confirmed. Source is complete and locally reviewable; remote GitHub publishing requires the user's own authenticated terminal because this environment has no `gh` login.

## Assets
Verify Sketchfab names, creator, download status and exact license before shipping. Keep full credit in ATTRIBUTION.md and the site. Fonts are locally hosted with their OFL licenses. All original SVG/CSS artwork is code-native.

## Acceptance
Site works from a subdirectory, on narrow screens, with the model unloaded, and with reduced motion. All primary controls work. Publishing script refuses unrelated remotes and never force-pushes. Documentation and source ZIP provide a complete terminal workflow.
