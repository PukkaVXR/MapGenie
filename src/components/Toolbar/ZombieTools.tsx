import React, { useRef } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography, Stack, MenuItem, Select, FormControl, InputLabel, Slider, Button } from '@mui/material';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PanToolIcon from '@mui/icons-material/PanTool';

const ARROW_COLORS = [
  { color: '#f44336', label: 'Primary' },
  { color: '#ff9800', label: 'Secondary' },
  { color: '#ffeb3b', label: 'Tertiary' },
  { color: '#4caf50', label: 'Quaternary' },
  { color: '#00bcd4', label: 'Quinary' },
  { color: '#3f51b5', label: 'Senary' },
  { color: '#9c27b0', label: 'Septenary' },
  { color: '#e040fb', label: 'Octonary' },
];

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

export const ZombieTools: React.FC<{
  selectedTool: string;
  onToolChange: (tool: string) => void;
  arrowColor: string;
  onArrowColorChange: (color: string) => void;
  arrowSize: number;
  onArrowSizeChange: (size: number) => void;
  numberFont: string;
  onNumberFontChange: (font: string) => void;
  numberFontSize: number;
  onNumberFontSizeChange: (size: number) => void;
  numberColor: string;
  onNumberColorChange: (color: string) => void;
  autoPathHandler: (file: File) => void;
  vertical?: boolean;
}> = ({ selectedTool, onToolChange, arrowColor, onArrowColorChange, arrowSize, onArrowSizeChange, numberFont, onNumberFontChange, numberFontSize, onNumberFontSizeChange, numberColor, onNumberColorChange, autoPathHandler, vertical = false }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <Box
      sx={vertical ? {
        bgcolor: 'background.paper',
        borderRadius: 0,
        boxShadow: 'none',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
      } : {
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
        value={selectedTool}
        exclusive
        onChange={(_e, val) => val && onToolChange(val)}
        aria-label="zombie tools"
        orientation={vertical ? 'vertical' : 'horizontal'}
        sx={vertical ? { width: '100%' } : {}}
      >
        <ToggleButton value="select" aria-label="Select Tool" sx={vertical ? { minWidth: '100%', width: '100%', height: 56, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', gap: 1, px: 2 } : { flexDirection: 'column', minWidth: 64 }}>
          <PanToolIcon sx={{ mr: 1 }} />
          <Typography variant="caption" sx={{ fontSize: 13, whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left' }}>SELECT</Typography>
        </ToggleButton>
        <ToggleButton value="number" aria-label="Number Tool" sx={vertical ? { minWidth: '100%', width: '100%', height: 56, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', gap: 1, px: 2 } : { flexDirection: 'column', minWidth: 64 }}>
          <FormatListNumberedIcon sx={{ mr: 1 }} />
          <Typography variant="caption" sx={{ fontSize: 13, whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left' }}>NUMBER</Typography>
        </ToggleButton>
        <ToggleButton value="arrow" aria-label="Arrow Tool" sx={vertical ? { minWidth: '100%', width: '100%', height: 56, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', gap: 1, px: 2 } : { flexDirection: 'column', minWidth: 64 }}>
          <ArrowForwardIcon sx={{ mr: 1 }} />
          <Typography variant="caption" sx={{ fontSize: 13, whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left' }}>ARROW</Typography>
        </ToggleButton>
        <ToggleButton value="key" aria-label="Key Tool" sx={vertical ? { minWidth: '100%', width: '100%', height: 56, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', gap: 1, px: 2 } : { flexDirection: 'column', minWidth: 64 }}>
          <ListAltIcon sx={{ mr: 1 }} />
          <Typography variant="caption" sx={{ fontSize: 13, whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left' }}>KEY</Typography>
        </ToggleButton>
      </ToggleButtonGroup>
      {selectedTool === 'arrow' && (
        <Stack spacing={2} sx={{ mt: 1, width: '100%' }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="arrow-color-label">Arrow Color</InputLabel>
            <Select
              labelId="arrow-color-label"
              value={arrowColor}
              label="Arrow Color"
              onChange={e => onArrowColorChange(e.target.value)}
            >
              {ARROW_COLORS.map(opt => (
                <MenuItem key={opt.color} value={opt.color}>
                  <Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: opt.color, borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption">Thickness</Typography>
            <Slider
              min={2}
              max={16}
              value={arrowSize}
              onChange={(_, v) => onArrowSizeChange(v as number)}
              sx={{ width: 100 }}
            />
            <Typography variant="caption">{arrowSize}</Typography>
          </Stack>
        </Stack>
      )}
      {selectedTool === 'number' && (
        <Stack spacing={2} sx={{ mt: 1, width: '100%' }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Font</InputLabel>
            <Select
              value={numberFont}
              label="Font"
              onChange={e => onNumberFontChange(e.target.value)}
            >
              {AVAILABLE_FONTS.map(font => (
                <MenuItem key={font} value={font} sx={{ fontFamily: font }}>{font}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption">Size</Typography>
            <Slider
              min={12}
              max={64}
              value={numberFontSize}
              onChange={(_, v) => onNumberFontSizeChange(v as number)}
              sx={{ width: 100 }}
            />
            <Typography variant="caption">{numberFontSize}</Typography>
          </Stack>
          <FormControl size="small" fullWidth>
            <InputLabel>Color</InputLabel>
            <Select
              value={numberColor}
              label="Color"
              onChange={e => onNumberColorChange(e.target.value)}
            >
              <MenuItem value="#fff"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#fff', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />White</MenuItem>
              <MenuItem value="#222"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#222', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />Black</MenuItem>
              <MenuItem value="#f44336"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#f44336', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />Red</MenuItem>
              <MenuItem value="#ff9800"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#ff9800', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />Orange</MenuItem>
              <MenuItem value="#ffeb3b"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#ffeb3b', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />Yellow</MenuItem>
              <MenuItem value="#4caf50"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#4caf50', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />Green</MenuItem>
              <MenuItem value="#00bcd4"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#00bcd4', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />Cyan</MenuItem>
              <MenuItem value="#3f51b5"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#3f51b5', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />Blue</MenuItem>
              <MenuItem value="#9c27b0"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#9c27b0', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />Purple</MenuItem>
              <MenuItem value="#e040fb"><Box sx={{ display: 'inline-block', width: 16, height: 16, bgcolor: '#e040fb', borderRadius: '50%', mr: 1, border: '1px solid #ccc' }} />Magenta</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      )}
      <Stack sx={{ width: '100%', mt: 2 }} alignItems="center">
        <Button
          variant="contained"
          size="large"
          onClick={() => fileInputRef.current?.click()}
          fullWidth
          sx={{ height: 48, fontWeight: 700, fontSize: 16, background: '#ce93d8', color: '#222', borderRadius: 4, mt: 2, '&:hover': { background: '#e1bee7' } }}
        >
          AUTOPATH
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              autoPathHandler(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
      </Stack>
    </Box>
  );
}; 