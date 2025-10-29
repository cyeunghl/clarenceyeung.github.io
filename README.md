# Clarence Yeung · Portfolio Mise en Place

A single-page portfolio presented like a minimalist recipe card. The layout highlights Clarence's
links as "ingredients", a narrative blurb as the "instructions", an interactive Strava globe, and a
scroll-driven DNA helix — all powered directly inside `index.html` with Three.js.

## Getting Started

1. Clone the repository.
2. Serve the site locally with any static file server. Examples:
   ```bash
   npx serve .
   ```
   or open `index.html` directly in a modern browser.
3. Replace placeholder assets inside `assets/` such as `profile-placeholder.svg` and
   `cv.pdf` with personal files.

## Editing the Recipe Layout

The entire layout, styles, and scripts are contained inside `index.html` for easy tweaking:

- Update the hero content, tagline, and recipe-style notes at the top of the file.
- Adjust the left-hand "About" block links or blurb to suit your current focus.
- Refresh the "Ingredients" list to mirror current projects, interests, or skills.
- Replace the instructions text with a personal biography or project summary.
- Adjust colors and typography by editing the `:root` variables inside the inline `<style>` block.

## Strava Activity Globe

A lightweight Three.js scene renders a rotating sphere with activity markers sourced from
`assets/mock-strava.json`. Swap this file with real activity data or hook it into the provided proxy
scaffold.

Supporting documentation for a Strava OAuth proxy remains in [`cloud/`](cloud/) for future backend
integration.

## DNA Helix Animation

The DNA helix renders inside a fixed, semi-transparent canvas anchored to the lower-right corner of
the viewport. Scroll direction adjusts the helix rotation: downward scroll moves it clockwise,
upward scroll reverses the spin. Customize the geometry by editing the "DNA Helix" block near the
bottom of the inline script.

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
