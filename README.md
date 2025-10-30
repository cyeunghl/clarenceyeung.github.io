# Sketch-inspired Jekyll Theme

This repository houses a bespoke Jekyll theme for a personal website inspired by sketch.com. The design emphasizes a generous grid, soft gradients, and a "recipe card" treatment for posts.

## Features

- Full-width hero with glassmorphism accents, portrait placeholder, and CTA buttons.
- Sticky, minimal navigation bar with a prominent accent button.
- Responsive layout capped at 960px with mobile-first breakpoints.
- Recipe-style post cards showing ingredients and instructions metadata.
- Smooth hover and scroll-triggered transitions.
- Placeholder `<canvas id="interactive">` for integrating a Three.js scene that fades in on scroll.
- Semantic HTML structure paired with modular SCSS partials.

## Getting Started

1. Ensure you have Ruby (>= 3.0) and Bundler installed.
2. Install dependencies:
   ```bash
   bundle install
   ```
3. Serve the site locally:
   ```bash
   bundle exec jekyll serve
   ```
4. Visit `http://localhost:4000` to explore the theme.

## Customization

- Update site metadata in [`_config.yml`](./_config.yml).
- Replace hero copy and sections in [`index.html`](./index.html).
- Adjust styles by editing the SCSS partials in [`_sass/`](./_sass/) and recompiling with Jekyll.
- Add new posts in the recipe format under [`_posts/`](./_posts/). Each post supports `ingredients` and `instructions` front matter arrays.
- Extend interactions by wiring a Three.js experience to [`assets/js/main.js`](./assets/js/main.js) and the hero canvas element.

## Deployment

Deploy the site via GitHub Pages or any static hosting platform that supports building Jekyll sites. For GitHub Pages, push to your repository and enable Pages in the project settings.

## License

Released under the MIT License. Feel free to adapt the theme for your own portfolio.
