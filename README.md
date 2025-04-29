# Flow Webflow Devtool

A lightweight local dev tool for modular TypeScript + CSS workflows with Webflow.

## Features
- Bundles each `.ts` file in `src/` to `dist/{name}.js` with esbuild
- Extracts imported CSS into `dist/{name}.css`
- Watches for changes and rebuilds only changed files
- Serves `dist/` on http://localhost:3000 for easy linking in Webflow

## Usage

1. Place your `.ts` (and imported `.css`) files in `src/`.
2. Run `npm install` to install dependencies.
3. Start the tool:

```bash
npm run dev
```

4. Link the output JS/CSS in your Webflow project via `<script>` and `<link>` tags from `dist/`.

## Scripts
- `npm run dev` — Start watch mode + local server
- `npm run build` — Build once
- `npm start` — Run the compiled server (after build)

---

## Requirements
- Node.js 18+
- Webflow (for integration)
- Modular `.ts` and `.css` files in `src/`

---

## How it works
- Each `.ts` file in `src/` is bundled as a separate entry point.
- CSS imported in TS is extracted to a separate `.css` file.
- On file changes, only the affected bundle is rebuilt.
- All output is served from `dist/` on port 3000.

---

## License
MIT
