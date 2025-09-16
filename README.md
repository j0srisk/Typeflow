# TypeFlow

A local development server for working with TypeScript/JavaScript and CSS files in Webflow projects. Inspired by and intended to replace [Finsweet's Developer Starter](https://github.com/finsweet/developer-starter) with a more streamlined approach.

## Features

- **Local Development Server** - Serve TypeScript/JavaScript and CSS files locally during Webflow development
- **Live Reload** - Automatic browser refresh when files change
- **TypeScript Compilation** - Fast compilation using esbuild
- **Production Build** - Optimized builds with optional minification and source maps

## Quick Start

### 1. Set up your project

**Option A: Use the starter template**

```bash
git clone https://github.com/j0srisk/typeflow-starter.git your-project
cd your-project
npm install
```

**Option B: Create your own project structure**

Install TypeFlow in your project:

```bash
npm install @j0srisk/typeflow
```

Create your project structure (this is just an example - organize files however works best for your project):

```
your-project/
├── src/
│   ├── components/
│   │   └── slider/
│   │       ├── main.ts
│   │       └── styles.css
│   ├── pages/
│   │   └── home/
│   │       ├── main.ts
│   │       └── styles.css
│   ├── main.ts
│   └── global.css
```

### 3. Start development server

```bash
typeflow dev --reload
```

### 3. Copy script and style tags

Visit `http://localhost:3000` in your browser to see the development server page. Copy the HTML script and style tags provided.

### 4. Paste into Webflow

Paste the copied tags into your Webflow site's custom code section or code embed elements and publish.

### 5. Develop with live reload

- Make changes to your TypeScript/CSS files
- See changes instantly on your Webflow site without republishing
- JavaScript changes automatically reload the page.

### 6. Build for production

When finished developing:

```bash
typeflow build --minify --drop-console --drop-debugger
```

### 7. Deploy production files

Replace the localhost tags in your Webflow site with either:

- Copy and paste the built code directly into custom code
- Host the production files elsewhere (jsdelivr, CDN, etc.) and update the URLs

## Commands

### Development Server

Start the development server with live reload:

```bash
npx typeflow dev --reload
```

Or using the shorthand:

```bash
npx typeflow --reload
```

#### Development Options

- `-r, --reload` - Enable live reload

### Production Build

Build your files for production:

```bash
npx typeflow build --minify --drop-console --drop-debugger
```

#### Build Options

- `--minify` - Minify output files
- `--drop-console` - Remove console statements
- `--drop-debugger` - Remove debugger statements

## Configuration

TypeFlow works out of the box with sensible defaults. The server will automatically detect and compile TypeScript files using esbuild.

## Requirements

- Node.js 16 or higher
- TypeScript files (optional, JavaScript also supported)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
