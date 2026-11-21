# Cloud Nine Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the main site, with bounded parallel asset and publishing tasks.

**Goal:** Deliver a polished cute dreamcore graduation website and a safe terminal route to free GitHub Pages.

**Architecture:** Buildless `dist/` with a single content configuration, small browser module, local fonts and model previews, and official on-demand Sketchfab embeds. GitHub Actions deploys only `dist/`.

**Tech Stack:** HTML, CSS, JavaScript, Python standard library for local serving, Bash, Git, GitHub CLI.

**Spec:** `docs/superpowers/specs/2026-11-21-cloud-nine-design.md`

## Global Constraints
- Cute, no horror; no made-up confirmed event details.
- No paid dependencies or runtime server; no Node required for use or publication.
- Proper creator attribution; Sketchfab model binaries require login and are not bundled.
- Build and verify before any request for missing access.

## Review Focus
- Unset or invalid date: no invalid calendar file or misleading countdown.
- Unsafe configurable URL or guest text: no script execution.
- GitHub project subpath: use relative asset paths.
- Blocked external viewer: preserve artwork and useful invitation content.
- Existing Git repository: never overwrite unrelated remotes or force-push.

## Tasks
- [x] Implement semantic layout, responsive dreamcore styling and local artwork in `dist/`.
- [x] Implement config rendering, dialogs, calendar generation, journal, motion preference and model loading. Verify calendar and URL boundaries with focused Node assertions.
- [x] Vendor licensed fonts and official Sketchfab preview images; add credits.
- [x] Implement and verify terminal publisher and Pages workflow independently.
- [x] Inspect the real browser, check narrow layout, review code, package source and instructions.

## Execution notes
The user's request authorizes building now. Design choices above are the builder's defaults, not a claim that the user supplied them. There is no existing repository to preserve. The fresh project directory provides isolation. Browser testing and behavior checks cover this low-impact UI; avoid a large test suite that mirrors its markup.

## Delivery state
Implementation, local review, desktop/phone browser QA, and source packaging are complete. Four event/link tests and eight publisher tests pass. The live blossom-island embed was loaded and rotated in the browser. Letter, journal, credits, motion pause, postcard restore, and phone-width overflow were checked.

Live GitHub publication is blocked by missing GitHub CLI authentication. Running the publisher on the delivery workspace exits before mutation with the documented sign-in command. No repository or live Pages URL is claimed.
