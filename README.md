# Clarence Yeung · Portfolio

A minimalist, motion-forward personal website for Clarence Yeung. Built for GitHub Pages with HTML, CSS, and modular JavaScript powered by Three.js visualizations.

## 📁 Project Structure

```
├── index.html          # Single-page layout for all sections
├── style.css           # Global styling and responsive layout
├── main.js             # Entry script, lazy loading, scroll interactions
├── globe.js            # Three.js Strava globe component
├── dna.js              # Three.js DNA helix animation (hero overlay)
├── assets/
│   ├── cv.pdf          # CV placeholder (replace with live document)
│   ├── mock-strava.json# Mock response for Strava data
│   ├── profile-placeholder.svg # Swap with a headshot for the hero card
│   └── papers/         # Placeholder directory for publications/PDFs
├── cloudcode/
│   ├── README.md       # Edge/API integration notes for Strava OAuth
│   └── strava-activities.js # Cloudflare Worker mock for secure Strava fetches
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
   - Update copy in `index.html` (hero text, About paragraph, footer contact).
   - Replace `assets/profile-placeholder.svg` with your portrait photo.
   - Swap `assets/cv.pdf` with the live document.
   - Add additional PDFs inside `assets/papers/` and link them from the page.

## 🌐 GitHub Pages Deployment

This repository is ready for GitHub Pages. Push to the `main` branch and enable Pages in your repository settings (Source: `main` branch, `/ (root)` folder). Changes will publish automatically.

## 🧭 Strava Globe Integration

- The globe first attempts to fetch live activities from `/api/strava/activities` (served by the Worker in `cloudcode/`).
- If the Worker is unavailable it falls back to `assets/mock-strava.json`, so the page continues to function statically.
- OAuth, token refresh, and clustering logic live in `cloudcode/strava-activities.js`. Deploy it with Cloudflare Workers (or another edge platform) and register the redirect URI with Strava.
- Activity responses are cached in `localStorage` for 10 days (configurable via `refreshIntervalDays`).
- Activities closer than ~500 meters are clustered and surfaced as a single glowing point with the most recent ride highlighted in the tooltip.

## 🧬 DNA Helix Interaction

- The helix now lives in the hero card as a fixed, translucent overlay anchored to the lower-right corner.
- Rotation direction reacts to scroll direction (clockwise when scrolling down, counter-clockwise when scrolling up) while respecting `prefers-reduced-motion`.
- Particle counts and geometry are optimized for performance on both desktop and mobile.

## 🖼️ Hero Photo & Layout

- Swap `assets/profile-placeholder.svg` with a 1:1 portrait—files up to ~400×400 look crisp.
- Hero typography has reduced side padding so the nameplate feels tighter and more prominent.
- The About card keeps outbound links on a single row for quick access.

## ♿ Accessibility & Fallbacks

- Smooth scrolling and animations degrade gracefully for browsers without WebGL (fallback messages are displayed instead of canvases).
- Animations pause when the tab is inactive.

## 🔧 Customization Tips

- Colors and typography live in `style.css` under the `:root` variables.
- Update outbound links in both the About section and footer.
- Replace placeholder copy with the final narrative.

## 📝 License

Content © Clarence Yeung. Code is provided under the MIT License unless otherwise specified.
