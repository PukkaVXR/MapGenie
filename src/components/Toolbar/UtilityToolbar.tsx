import React from 'react';
import { Box, Button, IconButton, Tooltip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt'; // Export JSON
import PublishIcon from '@mui/icons-material/Publish'; // Import JSON
import SaveIcon from '@mui/icons-material/Save'; // Save to Local
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // Load from Local
import ImageIcon from '@mui/icons-material/Image'; // Set Background
import DeleteIcon from '@mui/icons-material/Delete'; // Remove Background
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'; // Export PNG
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PaletteIcon from '@mui/icons-material/Palette';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

export const UtilityToolbar: React.FC<{
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onSaveLocal: () => void;
  onLoadLocal: () => void;
  onSetBackground: (file: File) => void;
  onRemoveBackground: () => void;
  onExportPNG: (filename: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  toggleTheme: () => void;
  themeMode: 'light' | 'dark';
  paletteName: string;
  palette: string[];
  paletteNames: string[];
  onPaletteChange: (name: string) => void;
  onToggleTerritoryNames: () => void;
  onToggleContinentColors: () => void;
  onToggleConnections: () => void;
  showTerritoryNames: boolean;
  showContinentColors: boolean;
  showConnections: boolean;
  onZombieModeToggle: () => void;
  isZombieMode: boolean;
}> = ({
  onExportJSON,
  onImportJSON,
  onSaveLocal,
  onLoadLocal,
  onSetBackground,
  onRemoveBackground,
  onExportPNG,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  toggleTheme,
  themeMode,
  paletteName,
  palette,
  paletteNames,
  onPaletteChange,
  onToggleTerritoryNames,
  onToggleContinentColors,
  onToggleConnections,
  showTerritoryNames,
  showContinentColors,
  showConnections,
  onZombieModeToggle,
  isZombieMode,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bgInputRef = React.useRef<HTMLInputElement>(null);
  const [pngFilename, setPngFilename] = React.useState('risk-map.png');
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [paletteAnchor, setPaletteAnchor] = React.useState<null | HTMLElement>(null);

  const handlePaletteClick = (event: React.MouseEvent<HTMLElement>) => setPaletteAnchor(event.currentTarget);
  const handlePaletteClose = () => setPaletteAnchor(null);
  const handlePaletteSelect = (name: string) => { onPaletteChange(name); handlePaletteClose(); };

  return (
    <>
      <Box sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1200,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'flex-start',
        minWidth: 180,
      }}>
        {/* Zombie Mode Toggle Button */}
        <Button
          variant={isZombieMode ? 'contained' : 'outlined'}
          color={isZombieMode ? 'error' : 'primary'}
          onClick={onZombieModeToggle}
          sx={{ width: '100%', mb: 1 }}
        >
          {isZombieMode ? 'Exit Zombie Mode' : 'Enter Zombie Mode'}
        </Button>
        {/* Top row: small icon buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', width: '100%', justifyContent: 'flex-start' }}>
          <Tooltip title="Export JSON">
            <IconButton color="primary" onClick={onExportJSON} size="small">
              <SaveAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import JSON">
            <span>
              <IconButton color="primary" onClick={() => fileInputRef.current?.click()} size="small">
                <PublishIcon />
              </IconButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    onImportJSON(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
            </span>
          </Tooltip>
          <Tooltip title="Save to Local Storage">
            <IconButton color="primary" onClick={onSaveLocal} size="small">
              <SaveIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Load from Local Storage">
            <IconButton color="primary" onClick={onLoadLocal} size="small">
              <FolderOpenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Set Background Image">
            <span>
              <IconButton color="primary" onClick={() => bgInputRef.current?.click()} size="small">
                <ImageIcon />
              </IconButton>
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    onSetBackground(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
            </span>
          </Tooltip>
          <Tooltip title="Remove Background Image">
            <IconButton color="error" onClick={onRemoveBackground} size="small">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton color="primary" onClick={onUndo} disabled={!canUndo} size="small">
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <span>
              <IconButton color="primary" onClick={onRedo} disabled={!canRedo} size="small">
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Second row: PNG export and filename */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', width: '100%' }}>
          <TextField
            size="small"
            label="PNG Filename"
            value={pngFilename}
            onChange={e => setPngFilename(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Tooltip title="Export PNG">
            <IconButton color="primary" onClick={() => onExportPNG(pngFilename)}>
              <PhotoCameraIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Third row: Help, Dark mode, and Palette buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
          <Tooltip title="Help / Quick Start">
            <IconButton color="primary" onClick={() => setHelpOpen(true)}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton color="primary" onClick={toggleTheme}>
              {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Select Continent Color Palette">
            <IconButton color="primary" onClick={handlePaletteClick}>
              <PaletteIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Fourth row: View toggles */}
        <Stack direction="column" spacing={1} sx={{ width: '100%' }}>
          <FormControlLabel
            control={<Switch checked={showTerritoryNames} onChange={onToggleTerritoryNames} color="primary" />}
            label="Show Territory Names"
            sx={{ ml: 0 }}
          />
          <FormControlLabel
            control={<Switch checked={showContinentColors} onChange={onToggleContinentColors} color="primary" />}
            label="Show Continent Colors"
            sx={{ ml: 0 }}
          />
          <FormControlLabel
            control={<Switch checked={showConnections} onChange={onToggleConnections} color="primary" />}
            label="Show Connections"
            sx={{ ml: 0 }}
          />
        </Stack>

        <Menu anchorEl={paletteAnchor} open={!!paletteAnchor} onClose={handlePaletteClose}>
          {paletteNames.map(name => (
            <MenuItem key={name} selected={name === paletteName} onClick={() => handlePaletteSelect(name)}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{name}</span>
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                  {((paletteName === name ? palette : undefined) || []).map((color, i) => (
                    <Box key={i} sx={{ width: 16, height: 16, bgcolor: color, borderRadius: '50%', border: '1px solid #ccc' }} />
                  ))}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Box>
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Welcome to the Risk Map Designer</DialogTitle>
        <DialogContent dividers>
          <h3>Quick Start</h3>
          <ul>
            <li><b>Draw Territories:</b> Use the toolbar to select Freehand, Polygon, Rectangle, or Ellipse, then draw on the map.</li>
            <li><b>Select & Edit:</b> Use the Select tool to move, rename, or delete territories. Use marquee (drag) or Shift+Click for multi-select.</li>
            <li><b>Connect:</b> Use the Connect tool to create or remove connections between territories.</li>
            <li><b>Manage Continents:</b> Use the sidebar to create continents, assign territories, and set bonus values.</li>
            <li><b>Pan & Zoom:</b> Hold <b>Space</b> and drag to pan. Use mouse wheel to zoom. Reset view with the top-left button.</li>
            <li><b>Undo/Redo:</b> Use the toolbar buttons or <b>Ctrl+Z</b>/<b>Ctrl+Y</b>.</li>
            <li><b>Export/Import:</b> Use the toolbar to save/load your map as JSON or PNG. You can also set a background image for tracing.</li>
          </ul>
          <h3>Toolbar Legend</h3>
          <ul>
            <li><b><SaveAltIcon fontSize="small" /> Export JSON</b></li>
            <li><b><PublishIcon fontSize="small" /> Import JSON</b></li>
            <li><b><SaveIcon fontSize="small" /> Save to Local</b></li>
            <li><b><FolderOpenIcon fontSize="small" /> Load from Local</b></li>
            <li><b><ImageIcon fontSize="small" /> Set Background</b></li>
            <li><b><DeleteIcon fontSize="small" /> Remove Background</b></li>
            <li><b><PhotoCameraIcon fontSize="small" /> Export PNG</b></li>
            <li><b><UndoIcon fontSize="small" /> Undo</b></li>
            <li><b><RedoIcon fontSize="small" /> Redo</b></li>
            <li><b><HelpOutlineIcon fontSize="small" /> Help</b></li>
          </ul>
          <h3>Tips</h3>
          <ul>
            <li>Use <b>Ctrl+Z</b> and <b>Ctrl+Y</b> for undo/redo.</li>
            <li>Hold <b>Space</b> to pan the map.</li>
            <li>Use the <b>PNG Filename</b> field to name your exported image.</li>
            <li>All changes are local to your browser unless exported or saved.</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 