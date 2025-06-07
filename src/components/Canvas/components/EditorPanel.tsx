import React from 'react';
import { 
  Paper, 
  TextField, 
  IconButton, 
  Stack, 
  Typography, 
  Slider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { AVAILABLE_FONTS } from '../constants/fonts';

interface EditorPanelProps {
  selectedId: string;
  inputValue: string;
  territory: any;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onTextSettingsChange: (settings: any) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  selectedId,
  inputValue,
  territory,
  onNameChange,
  onDelete,
  onTextSettingsChange,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        right: 32,
        bottom: 32,
        zIndex: 30,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        minWidth: 200,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          value={inputValue}
          onChange={onNameChange}
          autoFocus
          sx={{ minWidth: 120 }}
        />
        <IconButton color="error" onClick={onDelete} size="small">
          <DeleteIcon />
        </IconButton>
      </Stack>
      {selectedId && (
        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">Text Settings</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel id="font-family-label">Font</InputLabel>
            <Select
              labelId="font-family-label"
              value={territory.textSettings.fontFamily}
              label="Font"
              onChange={(e) => {
                onTextSettingsChange({
                  ...territory.textSettings,
                  fontFamily: e.target.value
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ minWidth: 60 }}>X Offset:</Typography>
            <Slider
              size="small"
              value={territory.textSettings.offsetX}
              onChange={(_, value) => {
                onTextSettingsChange({
                  ...territory.textSettings,
                  offsetX: value as number
                });
              }}
              min={-100}
              max={100}
              sx={{ width: 100 }}
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ minWidth: 60 }}>Y Offset:</Typography>
            <Slider
              size="small"
              value={territory.textSettings.offsetY}
              onChange={(_, value) => {
                onTextSettingsChange({
                  ...territory.textSettings,
                  offsetY: value as number
                });
              }}
              min={-100}
              max={100}
              sx={{ width: 100 }}
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ minWidth: 60 }}>Font Size:</Typography>
            <Slider
              size="small"
              value={territory.textSettings.fontSize}
              onChange={(_, value) => {
                onTextSettingsChange({
                  ...territory.textSettings,
                  fontSize: value as number
                });
              }}
              min={8}
              max={32}
              sx={{ width: 100 }}
            />
          </Stack>
        </Stack>
      )}
    </Paper>
  );
};