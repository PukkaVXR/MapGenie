## [1.1.0] - Zombie Pathing Update
### Added
- Zombie Mode: Design zombie pathing overlays for Risk maps.
- Zombie Toolbar: Select, Number, Arrow, and Key tools for specialized editing.
- Number Tool: Place, edit, and format auto-incrementing numbers with a pop-up editor.
- Arrow Tool: Draw, edit, and delete colored arrows with selectable thickness and color.
- Select Tool: Only this tool allows editing or dragging numbers/arrows, preventing accidental moves during creation.
- Key Tool: Draggable legend shows only the arrow colors in use, with pathing labels (Primary, Secondary, etc.).
- Improved usability: Create numbers/arrows in close proximity without triggering pop-ups or dragging, unless Select is active.
- Zombie Mode Flash: Animated overlay when entering zombie mode.

## [1.0.81] - Freehand Fix
### Fixed
- Freehand connections no longer create an unwanted straight connection line.

## [1.0.8] - Connection Overhaul
### Added
- Straight connections now use precise click points for endpoints.
- All straight connections are managed in a global array for easier management.
- Freehand connections visually update when territories are moved.
- UI improvements: Default Text Settings moved to a dialog, improved responsiveness.

### Fixed
- Freehand connections no longer disappear after territory movement.
- Connection Manager now lists and removes connections correctly.

## [1.1.1] - Pathing Fixes
- Removed curvature editing for arrows (all arrows are now straight)
- All arrow types are now draggable in select mode
- Improved pathing and arrow editing stability 

## [v1.1.2] - Curved Arrows
- Added support for curved arrows (both one-way and bidirectional)
- Bidirectional arrows now render as a single curve with arrowheads at both ends
- One-way arrows support curvature and always show a single arrowhead
- All arrowheads now have a black outline for better visibility 