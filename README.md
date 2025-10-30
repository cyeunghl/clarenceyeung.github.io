# Monochrome Natural Earth Globe

This repository hosts a minimalist Three.js scene that renders a monochrome Earth using land polygons from the Natural Earth 1:50m dataset. The demo projects geographic coordinates onto a sphere, creating a matte ocean layer with contrasting land silhouettes.

## Getting started

1. Start a static file server from the repository root. For example:
   ```bash
   python -m http.server 8000
   ```
2. Open [http://localhost:8000](http://localhost:8000) in a WebGL-capable browser.

The page will automatically fetch the GeoJSON land polygons from the Natural Earth project and render them above the base ocean sphere. Use your mouse or trackpad to orbit and zoom the camera.

## Key features

- Fetches Natural Earth 1:50m land polygons directly from GitHub.
- Projects longitude/latitude pairs to 3D coordinates on a sphere.
- Renders an ocean sphere with Lambert shading and slightly offset land meshes to avoid z-fighting.
- Adds OrbitControls for interactive rotation and zoom, plus a gentle automatic spin.

## Customization

- Adjust `OCEAN_RADIUS` and `LAND_RADIUS` in `main.js` to tweak the relative heights.
- Update colors in `style.css` or the Lambert materials in `main.js` to change the palette.
- Replace the data source URL if you want to experiment with a different Natural Earth resolution.
