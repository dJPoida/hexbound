# Hexbound Documentation Site

This is a Docusaurus-powered documentation site for the Hexbound game. It reads markdown files from the `../docs` directory and renders them with the game's custom styling.

## Development

To run the docs site locally for development:

```bash
# From the docs-site directory
npm install
npm start
```

The site will be available at `http://localhost:3001`.

## Docker Development

To run the docs site as part of the Docker stack:

```bash
# From the project root
npm run docker:up
```

The docs site will be available at `http://localhost:3001`.

## Building

To build the static site:

```bash
npm run build
```

The built site will be in the `build/` directory.

## Features

- **Custom Styling**: Uses the same design tokens and medieval theme as the main game
- **Auto-generated Navigation**: Sidebar navigation is automatically generated from the docs folder structure
- **Responsive Design**: Works well on mobile and desktop
- **Search**: Built-in search functionality
- **Hot Reloading**: Changes to markdown files are reflected immediately in development

## Content Management

The documentation content is stored in the `../docs` directory:

- `../docs/Wiki/` - Game mechanics, rules, and design documentation
- `../docs/Technical/` - Technical implementation details

To add new documentation:

1. Add markdown files to the appropriate directory
2. Update `sidebars.js` to include the new pages in navigation
3. The changes will be reflected automatically in development mode 