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

### V1.1 (Zombie Pathing Update)
- **Zombie Mode:** New mode for designing zombie pathing overlays on your Risk map.
- **Zombie Toolbar:** Includes Select, Number, Arrow, and Key tools for specialized editing.
- **Number Tool:** Place, edit, and format auto-incrementing numbers on the map. Pop-up editor for value, font, size, and color.
- **Arrow Tool:** Draw colored arrows with selectable thickness and color. Edit or delete arrows via pop-up.
- **Select Tool:** Only this tool allows editing or dragging numbers/arrows, preventing accidental moves during creation.
- **Key Tool:** Draggable legend shows only the arrow colors in use, with pathing labels (Primary, Secondary, etc.).
- **Improved Usability:** Numbers/arrows can be created in close proximity without triggering pop-ups or dragging, unless Select is active.
- **Zombie Mode Flash:** Animated overlay when entering zombie mode.

### V1.0.81 (Freehand Fix)
- Freehand connections no longer create an unwanted straight connection line.

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

### V1.1.1 (Pathing Fixes)

#### What's New
- Curvature editing for arrows has been removed for stability. All arrows are now straight.
- All arrow types (straight, bidirectional) are now draggable in select mode.
- Improved pathing and arrow editing stability.

## Getting Started

1. Visit https://pukkavxr.github.io/MapGenie/

## Usage

- To create a straight connection, select the connect tool and click the desired points on two territories.
- To remove a connection, use the Connection Manager in the sidebar.
- Freehand connections can be created and will remain visually attached to territories when moved.
