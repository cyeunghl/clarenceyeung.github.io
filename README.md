# Clarence Yeung · Portfolio Mise en Place

A single-page portfolio presented like a minimalist recipe card. The layout highlights Clarence's
links as "ingredients", a narrative blurb as the "instructions", an interactive Strava globe, and a
scroll-driven DNA helix — all composed with semantic HTML/CSS and a compact Three.js module inside
`index.html`.

## Getting Started

1. Clone the repository.
2. Install any static file server (or use Python/Node's built-ins) and serve the site locally. Examples:
   ```bash
   npx serve .
   ```
   or open `index.html` directly in a modern browser.
3. Replace placeholder assets inside `assets/` such as `profile-placeholder.svg`, `activities.json`,
   and `cv.pdf` with personal files or data.

## Editing the Recipe Layout

Core markup lives in `index.html`, with typography, layout, and tokens defined in `style.css`:

- Update the hero content, tagline, and recipe-style notes at the top of the file.
- Adjust the left-hand "About" block links or blurb to suit your current focus.
- Refresh the "Ingredients" list to mirror current projects, interests, or skills.
- Replace the instructions text with a personal biography or project summary.
- Adjust colors and typography by editing the `:root` variables inside `style.css`.

## Strava Activity Globe

A custom Three.js globe renders inside the left column with OrbitControls enabled for rotation and
zoom. Activity markers are sourced from `assets/activities.json`, which ships with mock global rides.
Swap this file with Strava-derived JSON (or wire it into the proxy scaffold in [`cloud/`](cloud/)) to
surface live data. Hovering markers reveals their label; clicking triggers the `onMarkerClick` stub
inside `index.html`.

Supporting documentation for a Strava OAuth proxy remains in [`cloud/`](cloud/) for future backend
integration.

## DNA Helix Animation

The DNA helix renders inside a fixed, semi-transparent canvas anchored to the lower-right corner of
the viewport. Scroll position gently rotates the helix for added depth. Customize the geometry by
editing the "DNA Helix" block near the bottom of the inline script.

## Deployment

1. Commit and push changes to the `main` branch.
2. Ensure GitHub Pages is enabled for the repository (Settings → Pages → Deploy from branch).
3. The site will be served from `https://clarenceyeung.github.io/`.

## Accessibility & Performance Notes

- Links feature subtle underlines and focus states for keyboard navigation.
- Layout adapts responsively down to mobile widths.
- WebGL features gracefully degrade by relying on static fallback copy if disabled (no explicit
  fallback canvas is rendered, so consider adding one if needed).

## License

This project is published under the MIT License. Feel free to adapt and remix.
