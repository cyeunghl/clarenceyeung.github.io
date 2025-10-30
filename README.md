# Monochrome Natural Earth Globe

This repository contains a standalone Three.js example that renders a minimalist
Earth. Landmasses are generated from the Natural Earth 1:50m GeoJSON dataset and
projected onto a sphere, producing clean silhouettes without texture maps.

## Features
- Fetches Natural Earth GeoJSON land polygons on load
- Projects longitude/latitude coordinates into 3D space using spherical math
- Builds land meshes with `THREE.ShapeUtils.triangulateShape`
- Renders a matte ocean sphere with contrasting land color
- Includes ambient + directional lighting and OrbitControls interactivity
- Gentle idle rotation that pauses while the user drags the globe

## Getting Started
1. Install a simple static server (or use Python's built-in option).
2. From the project directory, start a server:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser to interact with the globe.

The demo fetches GeoJSON directly from GitHub. Ensure you have an internet
connection when running locally or host your own copy of the data.

## Customization
- Update `LAND_URL` in `main.js` to point to a different GeoJSON source.
- Adjust `OCEAN_RADIUS` and `LAND_RADIUS` to control the land offset above the
  ocean surface.
- Swap colors in `style.css` or the Three.js materials to change the palette.

## License
The Natural Earth data is in the public domain. Three.js is under the MIT
License. Consult their respective documentation for full details.
