import React from 'react';
import { Box, Button, IconButton, Tooltip, TextField, Stack, Switch, FormControlLabel, Menu, MenuItem } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PublishIcon from '@mui/icons-material/Publish';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PaletteIcon from '@mui/icons-material/Palette';

export const TopToolbar: React.FC<{
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
  pngFilename: string;
  setPngFilename: (v: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  bgInputRef: React.RefObject<HTMLInputElement>;
  onHelpOpen: () => void;
  paletteAnchor: null | HTMLElement;
  handlePaletteClick: (event: React.MouseEvent<HTMLElement>) => void;
  handlePaletteClose: () => void;
  handlePaletteSelect: (name: string) => void;
  onCanvasResize: (widthDelta: number, heightDelta: number, mode: 'expand' | 'contract') => void;
}> = (props) => {
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', boxShadow: 1, px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1200 }}>
      {/* Zombie Mode Button */}
      <Button
        variant={props.isZombieMode ? 'contained' : 'outlined'}
        color={props.isZombieMode ? 'error' : 'primary'}
        onClick={props.onZombieModeToggle}
        sx={{ minWidth: 180 }}
      >
        {props.isZombieMode ? 'EXIT ZOMBIE MODE' : 'ENTER ZOMBIE MODE'}
      </Button>
      {/* File Actions */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Export JSON">
          <IconButton color="primary" onClick={props.onExportJSON} size="small">
            <SaveAltIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Import JSON">
          <span>
            <IconButton color="primary" onClick={() => props.fileInputRef.current?.click()} size="small">
              <PublishIcon />
            </IconButton>
            <input
              ref={props.fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  props.onImportJSON(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
          </span>
        </Tooltip>
        <Tooltip title="Save to Local Storage">
          <IconButton color="primary" onClick={props.onSaveLocal} size="small">
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Load from Local Storage">
          <IconButton color="primary" onClick={props.onLoadLocal} size="small">
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Set Background Image">
          <span>
            <IconButton color="primary" onClick={() => props.bgInputRef.current?.click()} size="small">
              <ImageIcon />
            </IconButton>
            <input
              ref={props.bgInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  props.onSetBackground(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
          </span>
        </Tooltip>
        <Tooltip title="Remove Background Image">
          <IconButton color="error" onClick={props.onRemoveBackground} size="small">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Undo (Ctrl+Z)">
          <span>
            <IconButton color="primary" onClick={props.onUndo} disabled={!props.canUndo} size="small">
              <UndoIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y)">
          <span>
            <IconButton color="primary" onClick={props.onRedo} disabled={!props.canRedo} size="small">
              <RedoIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      {/* PNG Export */}
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          label="PNG Filename"
          value={props.pngFilename}
          onChange={e => props.setPngFilename(e.target.value)}
          sx={{ width: 160 }}
        />
        <Tooltip title="Export PNG">
          <IconButton color="primary" onClick={() => props.onExportPNG(props.pngFilename)}>
            <PhotoCameraIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      {/* Canvas Size Controls */}
      <Stack direction="row" spacing={1} alignItems="center">
        <span>Width:</span>
        <IconButton size="small" onClick={() => props.onCanvasResize(-25, 0, 'contract')}>-</IconButton>
        <IconButton size="small" onClick={() => props.onCanvasResize(25, 0, 'expand')}>+</IconButton>
        <span>Height:</span>
        <IconButton size="small" onClick={() => props.onCanvasResize(0, -25, 'contract')}>-</IconButton>
        <IconButton size="small" onClick={() => props.onCanvasResize(0, 25, 'expand')}>+</IconButton>
      </Stack>
      {/* Toggles */}
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControlLabel
          control={<Switch checked={props.showTerritoryNames} onChange={props.onToggleTerritoryNames} color="primary" />}
          label="Show Territory Names"
        />
        <FormControlLabel
          control={<Switch checked={props.showContinentColors} onChange={props.onToggleContinentColors} color="primary" />}
          label="Show Continent Colors"
        />
        <FormControlLabel
          control={<Switch checked={props.showConnections} onChange={props.onToggleConnections} color="primary" />}
          label="Show Connections"
        />
      </Stack>
      {/* Theme, Palette, Help */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title={props.themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <IconButton color="primary" onClick={props.toggleTheme}>
            {props.themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Select Continent Color Palette">
          <IconButton color="primary" onClick={props.handlePaletteClick}>
            <PaletteIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Help / Quick Start">
          <IconButton color="primary" onClick={props.onHelpOpen}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={props.paletteAnchor} open={!!props.paletteAnchor} onClose={props.handlePaletteClose}>
          {props.paletteNames.map(name => (
            <MenuItem key={name} selected={name === props.paletteName} onClick={() => props.handlePaletteSelect(name)}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{name}</span>
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                  {((props.paletteName === name ? props.palette : undefined) || []).map((color, i) => (
                    <Box key={i} sx={{ width: 16, height: 16, bgcolor: color, borderRadius: '50%', border: '1px solid #ccc' }} />
                  ))}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Stack>
    </Box>
  );
}; 