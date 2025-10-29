# Monochrome Earth Globe (Three.js Example)

This repository hosts a minimal Three.js scene that renders a monochrome Earth using Natural Earth
GeoJSON land polygons. Landmasses are rebuilt from vector data and placed slightly above an ocean
sphere to create a clean two-tone silhouette with soft shading and orbit controls.

## Features

- Fetches Natural Earth 1:50m land polygons directly from GitHub.
- Projects each longitude/latitude coordinate onto a 3D sphere without texture maps.
- Uses `MeshLambertMaterial` for a matte ocean base and contrasting land layer.
- Includes ambient and directional lighting for depth plus OrbitControls for rotation and zoom.
- Auto-rotates slowly while remaining responsive to user interaction.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/clarenceyeung/clarenceyeung.github.io.git
   cd clarenceyeung.github.io
   ```
2. Launch a static file server (any modern browser with module support works). For example:
   ```bash
   python -m http.server 8000
   ```
3. Navigate to `http://localhost:8000` and open `index.html` to view the globe.

## Customisation Tips

- Adjust globe colours by editing the `oceanMaterial` and `landMaterial` definitions inside the
  `<script type="module">` block of `index.html`.
- Tune auto-rotation via `controls.autoRotateSpeed` or disable it entirely by setting
  `controls.autoRotate = false`.
- Change layout spacing, fonts, or background by editing `style.css`.

## Browser Support

The example targets modern browsers that support ES modules and WebGL 2. If the globe does not
appear, check the developer console for network or WebGL errors.

## License

Released under the MIT License. Feel free to adapt the code for personal or educational projects.
