# MapGenie - Created by CQG/Barry

A web-based Risk Map Design Tool built with React, TypeScript, and Vite.

## Features

- Interactive map editor for creating Risk-style game maps
- Draw territories using various shapes (polygon, rectangle, ellipse, freehand)
- Create and manage continents with bonus values
- Connect territories to define valid moves
- Import/Export maps as JSON
- Export maps as PNG images
- Local storage support
- Dark/Light theme
- Custom color palettes for continents

## Getting Started

1. Visit https://pukkavxr.github.io/MapGenie/

==or==

1. Clone the repository:
```bash
git clone https://github.com/PukkaVXR/MapGenie.git
cd MapGenie
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Usage

- Use the toolbar to select drawing tools (Freehand, Polygon, Rectangle, Ellipse)
- Select territories to move, rename, or delete them
- Use the Connect tool to create or remove connections between territories
- Manage continents and their bonus values in the sidebar
- Hold Space to pan the map, use mouse wheel to zoom
- Export your map as JSON or PNG using the toolbar buttons

## Technologies Used

- React
- TypeScript
- Vite
- Material-UI
- Konva.js (for canvas drawing)
- React Konva

## License

MIT
