# MapGenie - Created by CQG/Barry

A web-based Risk Map Design Tool built with React, TypeScript, and Vite.

## Features

- Interactive map editor for creating Risk-style game maps
- Draw territories using various shapes (polygon, rectangle, ellipse, freehand, connected)
- Create and manage continents with bonus values
- Connect territories to define valid moves
- Import/Export maps as JSON
- Export maps as PNG images
- Local storage support
- Dark/Light theme
- Custom color palettes for continents
- Customizable territory text styling (font, size, position)

## Changelog

### V1.0.8 (Connection Overhaul)
- **Precise Connection Points:** Straight connections now use the exact point clicked on each territory, not just the center.
- **Connection Management Overhaul:** All straight connections are managed globally, making them easier to list and remove.
- **Freehand Connection Fixes:** Freehand connections now visually follow territories when moved.
- **UI Improvements:** Default Text Settings are now in a dialog, and the UI is more responsive.

### V1.0.7 (Polygon Tool Fix)
- Fixed polygon tool behavior: now properly draws polygon shape before creating territory
- Territory is only created when double-clicking to complete the polygon
- Added visual preview while drawing polygon

### V1.0.6 (Font and Styling)
- Added customizable text settings for territories:
  - Font family selection (9 web-safe fonts)
  - Font size adjustment
  - Text position offset controls
- Improved toolbar layout organization
- Added default text settings for new territories

### V1.0.5 (Local storage fix)
- Robust loading from local storage: merges with default state to prevent errors from missing fields

### V1.0.4 (UI Fix)
- Compact export toolbar: icon buttons in a row, export/toggles stacked below
- Toggles for territory names and continent colors in toolbar
- Improved professional export options

## Getting Started

1. Visit https://pukkavxr.github.io/MapGenie/

## Usage

- To create a straight connection, select the connect tool and click the desired points on two territories.
- To remove a connection, use the Connection Manager in the sidebar.
- Freehand connections can be created and will remain visually attached to territories when moved.