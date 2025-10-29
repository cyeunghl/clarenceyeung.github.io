# Clarence Yeung · Portfolio

A minimalist, motion-forward personal website for Clarence Yeung. Built for GitHub Pages with HTML, CSS, and modular JavaScript powered by Three.js visualizations.

## 📁 Project Structure

```
├── index.html          # Single-page layout for all sections
├── style.css           # Global styling and responsive layout
├── main.js             # Entry script, lazy loading, scroll interactions
├── globe.js            # Three.js Strava globe component
├── dna.js              # Three.js DNA helix animation
├── assets/
│   ├── cv.pdf          # CV placeholder (replace with live document)
│   ├── mock-strava.json# Mock response for Strava data
│   └── papers/         # Placeholder directory for publications/PDFs
└── README.md           # This file
```

## 🚀 Getting Started

1. **Install a local static server** (any option works):
   - Python: `python3 -m http.server 8000`
   - Node: `npx serve`
   - Ruby: `ruby -run -e httpd . -p 8000`

2. **Run the site locally**:
   ```bash
   python3 -m http.server 8000
   ```
   Then open [http://localhost:8000](http://localhost:8000) in your browser.

3. **Edit content**:
   - Update copy in `index.html` (About, hero text, footer).
   - Replace `assets/cv.pdf` with the live document.
   - Add additional PDFs inside `assets/papers/` and link them from the page.

## 🌐 GitHub Pages Deployment

This repository is ready for GitHub Pages. Push to the `main` branch and enable Pages in your repository settings (Source: `main` branch, `/ (root)` folder). Changes will publish automatically.

## 🧭 Strava Globe Integration

- The globe component fetches activity data from `assets/mock-strava.json` by default.
- To connect to the Strava API:
  1. Host a lightweight endpoint (serverless function or proxy) that returns aggregated ride data in the same shape as `mock-strava.json`.
  2. Update the `mockDataUrl` passed in `main.js` to point to that endpoint.
  3. If you need authenticated requests, expose a read-only token as `window.STRAVA_ACCESS_TOKEN` or bundle-time environment variable and update `globe.js` accordingly.
- Data is cached in `localStorage` for 10 days (configurable via `refreshIntervalDays`).
- Activities closer than ~500 meters are clustered and surfaced as a single glowing point with the most recent ride highlighted in the tooltip.

## 🧬 DNA Helix Interaction

- The DNA section loads lazily and reacts to page scroll.
- Motion respects the user’s `prefers-reduced-motion` settings.
- Particle counts and geometry are optimized for performance on both desktop and mobile.

## ♿ Accessibility & Fallbacks

- Smooth scrolling and animations degrade gracefully for browsers without WebGL (fallback messages are displayed instead of canvases).
- Animations pause when the tab is inactive.

## 🔧 Customization Tips

- Colors and typography live in `style.css` under the `:root` variables.
- Update outbound links in both the About section and footer.
- Replace placeholder copy with the final narrative.

## 📝 License

Content © Clarence Yeung. Code is provided under the MIT License unless otherwise specified.
