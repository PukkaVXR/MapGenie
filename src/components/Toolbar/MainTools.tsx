import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Stack, IconButton, Typography, Select, MenuItem, FormControl, InputLabel, Slider, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useMap } from '../../context/MapContext';
import EditIcon from '@mui/icons-material/Edit';
import BrushIcon from '@mui/icons-material/Brush';
import LinkIcon from '@mui/icons-material/Link';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import TimelineIcon from '@mui/icons-material/Timeline';
import GestureIcon from '@mui/icons-material/Gesture';
import CallMergeIcon from '@mui/icons-material/CallMerge';

const AVAILABLE_FONTS = [
  'Arial',
  'Verdana',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS'
];

export const MainTools: React.FC<{
  onCanvasResize?: (widthPercent: number, heightPercent: number, mode: 'expand' | 'contract') => void;
}> = ({ onCanvasResize }) => {
  const { state, dispatch } = useMap();
  const WIDTH_HEIGHT_STEP = 25;

  // Dialog state
  const [customiseOpen, setCustomiseOpen] = React.useState(false);

  const handleToolChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTool: 'draw' | 'polygon' | 'rect' | 'ellipse' | 'connect' | 'select' | 'connected' | null
  ) => {
    if (newTool !== null) {
      dispatch({ type: 'SET_SELECTED_TOOL', payload: newTool });
    }
  };

  const handleResize = (mode: 'expand' | 'contract', axis: 'width' | 'height') => {
    if (onCanvasResize) {
      if (axis === 'width') onCanvasResize(WIDTH_HEIGHT_STEP, 0, mode);
      else onCanvasResize(0, WIDTH_HEIGHT_STEP, mode);
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        p: 0.5,
      }}
    >
      <ToggleButtonGroup
        value={state.selectedTool}
        exclusive
        onChange={handleToolChange}
        aria-label="drawing tools"
      >
        <ToggleButton value="select" aria-label="select tool" sx={{ flexDirection: 'column', minWidth: 64 }}>
          <EditIcon />
          <Typography variant="caption">Select</Typography>
        </ToggleButton>
        <ToggleButton value="draw" aria-label="draw tool" sx={{ flexDirection: 'column', minWidth: 64 }}>
          <BrushIcon />
          <Typography variant="caption">Freehand</Typography>
        </ToggleButton>
        <ToggleButton value="polygon" aria-label="polygon tool" sx={{ flexDirection: 'column', minWidth: 64 }}>
          <ChangeHistoryIcon />
          <Typography variant="caption">Polygon</Typography>
        </ToggleButton>
        <ToggleButton value="rect" aria-label="rectangle tool" sx={{ flexDirection: 'column', minWidth: 64 }}>
          <CropSquareIcon />
          <Typography variant="caption">Rectangle</Typography>
        </ToggleButton>
        <ToggleButton value="ellipse" aria-label="ellipse tool" sx={{ flexDirection: 'column', minWidth: 64 }}>
          <PanoramaFishEyeIcon />
          <Typography variant="caption">Ellipse</Typography>
        </ToggleButton>
        <ToggleButton value="connected" aria-label="connected tool" sx={{ flexDirection: 'column', minWidth: 64 }}>
          <CallMergeIcon />
          <Typography variant="caption">Connected</Typography>
        </ToggleButton>
        <ToggleButton value="connect" aria-label="connect tool" sx={{ flexDirection: 'column', minWidth: 64 }}>
          <LinkIcon />
          <Typography variant="caption">Connect</Typography>
        </ToggleButton>
      </ToggleButtonGroup>
      {state.selectedTool === 'connect' && (
        <Box sx={{ mt: 1, mb: 1, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={state.connectionMode}
            exclusive
            onChange={(_e, mode) => mode && dispatch({ type: 'SET_CONNECTION_MODE', payload: mode })}
            aria-label="connection mode"
            size="small"
          >
            <ToggleButton value="straight" aria-label="Straight Connection">
              <TimelineIcon fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>Straight</Typography>
            </ToggleButton>
            <ToggleButton value="freehand" aria-label="Freehand Connection">
              <GestureIcon fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>Freehand</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
      <Box sx={{ mt: 2, p: 1, borderTop: '1px solid #eee' }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Width</Typography>
            <IconButton size="small" onClick={() => handleResize('contract', 'width')}><RemoveIcon /></IconButton>
            <IconButton size="small" onClick={() => handleResize('expand', 'width')}><AddIcon /></IconButton>
            <Typography variant="body2">Height</Typography>
            <IconButton size="small" onClick={() => handleResize('contract', 'height')}><RemoveIcon /></IconButton>
            <IconButton size="small" onClick={() => handleResize('expand', 'height')}><AddIcon /></IconButton>
          </Stack>
          {/* Customise button */}
          <Button variant="outlined" onClick={() => setCustomiseOpen(true)} fullWidth sx={{ mt: 1 }}>Customise Text</Button>
        </Stack>
      </Box>
      {/* Customise Dialog */}
      <Dialog open={customiseOpen} onClose={() => setCustomiseOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Default Text Settings</DialogTitle>
        <DialogContent>
          <FormControl size="small" fullWidth sx={{ mt: 2 }}>
            <InputLabel id="default-font-family-label">Default Font</InputLabel>
            <Select
              labelId="default-font-family-label"
              value={state.defaultTextSettings.fontFamily}
              label="Default Font"
              onChange={(e) => {
                dispatch({
                  type: 'SET_DEFAULT_TEXT_SETTING',
                  payload: { key: 'fontFamily', value: e.target.value }
                });
              }}
            >
              {AVAILABLE_FONTS.map((font) => (
                <MenuItem 
                  key={font} 
                  value={font}
                  sx={{ fontFamily: font }}
                >
                  {font}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ minWidth: 60 }}>Default Size:</Typography>
            <Slider
              size="small"
              value={state.defaultTextSettings.fontSize}
              onChange={(_, value) => {
                dispatch({
                  type: 'SET_DEFAULT_TEXT_SETTING',
                  payload: { key: 'fontSize', value: value as number }
                });
              }}
              min={8}
              max={32}
              sx={{ width: 100 }}
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ minWidth: 60 }}>Default X:</Typography>
            <Slider
              size="small"
              value={state.defaultTextSettings.offsetX}
              onChange={(_, value) => {
                dispatch({
                  type: 'SET_DEFAULT_TEXT_SETTING',
                  payload: { key: 'offsetX', value: value as number }
                });
              }}
              min={-100}
              max={100}
              sx={{ width: 100 }}
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ minWidth: 60 }}>Default Y:</Typography>
            <Slider
              size="small"
              value={state.defaultTextSettings.offsetY}
              onChange={(_, value) => {
                dispatch({
                  type: 'SET_DEFAULT_TEXT_SETTING',
                  payload: { key: 'offsetY', value: value as number }
                });
              }}
              min={-100}
              max={100}
              sx={{ width: 100 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomiseOpen(false)} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 