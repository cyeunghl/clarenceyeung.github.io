# Clarence Yeung · Portfolio Mise en Place

A single-page portfolio presented like a minimalist recipe card. The layout frames a fixed visual
column for the interactive globe while the right column houses About, Projects, and Contact
sections. Three.js powers both the Strava-inspired globe and a holographic DNA helix, all compiled
inside `index.html`.

## Getting Started

1. Clone the repository.
2. Install any static file server (or use Python/Node's built-ins) and serve the site locally. Examples:
   ```bash
   npx serve .
   ```
   or open `index.html` directly in a modern browser.
3. Replace placeholder assets inside `assets/` such as `profile-placeholder.svg`, `activities.json`,
   and `cv.pdf` with personal files or data.

## Editing the Layout

Core markup lives in `index.html`, with typography, layout, and tokens defined in `style.css`:

- Update the hero content (name, portrait placeholder) within the `<header>` block.
- Edit the About/Projects/Contact copy inside their respective `<section>` elements.
- Adjust social links by editing the `about-links` and `contact-links` navigation lists.
- Tweak colors and typography by editing the `:root` variables inside `style.css`.

## Strava Activity Globe

A custom Three.js globe renders inside the left column with OrbitControls enabled for rotation and
zoom on a transparent stage. The sphere uses a soft gradient material plus an additive halo to echo
Stripe's artful globe aesthetic. Activity markers are sourced from `assets/activities.json`, which
ships with mock global rides. Swap this file with Strava-derived JSON (or wire it into the proxy
scaffold in [`cloud/`](cloud/)) to surface live data.

- Hover markers to reveal their labels.
- Click markers to open the corresponding Google Maps location in a new tab (and optionally handle
  the `window.onGlobeMarkerClick` callback for custom interactions).

Supporting documentation for a Strava OAuth proxy remains in [`cloud/`](cloud/) for future backend
integration.

## DNA Helix Animation

The DNA helix renders inside a fixed, semi-transparent canvas anchored to the lower-right corner of
the viewport. Scroll position gently rotates the helix on its axis for added depth without
overpowering the content. Customize the geometry by editing the "DNA Helix" block near the bottom of
the inline script.

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
