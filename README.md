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
│   ├── profile-placeholder.svg # Drop-in hero portrait placeholder
│   └── papers/         # Placeholder directory for publications/PDFs
├── cloud/
│   ├── README.md       # Backend architecture & deployment notes
│   └── strava-proxy/   # Sample proxy skeleton for Strava OAuth + data fetch
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
   - Update copy in `index.html` (hero headline, About paragraph, footer links).
   - Replace `assets/profile-placeholder.svg` with your photo and update the `<img>` `src` if you prefer another filename.
   - Replace `assets/cv.pdf` with the live document.
   - Add additional PDFs inside `assets/papers/` and link them from the page.

## 🌐 GitHub Pages Deployment

This repository is ready for GitHub Pages. Push to the `main` branch and enable Pages in your repository settings (Source: `main` branch, `/ (root)` folder). Changes will publish automatically.

## 🧭 Strava Globe Integration

- The globe component fetches activity data from `assets/mock-strava.json` by default.
- Set `window.STRAVA_API_BASE` (and optionally `window.STRAVA_CONNECT_URL`) before loading `main.js` to point at your proxy service. When defined, the UI enables the **Connect Strava Account** button and the globe will request `GET {STRAVA_API_BASE}/activities` with credentials included.
- A dedicated backend architecture and sample implementation live in [`cloud/`](cloud/README.md). The scaffold mirrors a Cloud Run/Cloud Functions style deployment with OAuth handshake, periodic refresh, and cache fan-out.
- The module still honors the `mockDataUrl` fallback. If the proxy is unreachable the cached payload or mock JSON keeps rendering the visualization.
- Data is cached in `localStorage` for 10 days (configurable via `refreshIntervalDays`).
- Activities closer than ~500 meters are clustered and surfaced as a single glowing point with the most recent ride highlighted in the tooltip.

## 🧬 DNA Helix Interaction

- The helix now lives in a fixed overlay anchored to the bottom-right corner of the viewport. It continues rotating clockwise as you scroll down and counterclockwise on scroll up, remaining visible across sections.
- Motion respects the user’s `prefers-reduced-motion` settings and pauses when the tab is backgrounded.
- A fallback badge appears in browsers without WebGL.

## ♿ Accessibility & Fallbacks

- Smooth scrolling and animations degrade gracefully for browsers without WebGL (fallback messages are displayed instead of canvases).
- Animations pause when the tab is inactive.

## 🔧 Customization Tips

- Colors and typography live in `style.css` under the `:root` variables.
- The hero portrait container accepts any aspect ratio; update `.hero__portrait` styles if you prefer circular framing.
- All About links are laid out in a single horizontal line. Adjust the `.link-grid` flex styles if you want different spacing or wrapping.
- Update outbound links in both the About section and footer.
- Replace placeholder copy with the final narrative.

## 📝 License

Content © Clarence Yeung. Code is provided under the MIT License unless otherwise specified.
