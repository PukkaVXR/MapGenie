import React, { useState } from 'react';
import { useMap } from '../../context/MapContext';
import { Box, List, ListItem, ListItemText, IconButton, TextField, Button, Typography, InputAdornment, Select, MenuItem, FormControl, InputLabel, Collapse, Popover } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const PRESET_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#9e9e9e', '#607d8b'
];

export const ContinentEditor: React.FC<{ open?: boolean; onToggle?: () => void; palette?: string[] }> = ({ open = true, onToggle, palette }) => {
  if (!open) return null;
  const { state, dispatch } = useMap();
  const [newName, setNewName] = useState('');
  const [newBonus, setNewBonus] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBonus, setEditBonus] = useState(0);
  const [expandedContinent, setExpandedContinent] = useState<string | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string>('');
  const [selectedContinent, setSelectedContinent] = useState<string>('');
  const [colorPickerAnchor, setColorPickerAnchor] = useState<{ element: HTMLElement; continentId: string } | null>(null);

  const getNextColor = () => {
    if (!palette || palette.length === 0) return getRandomColor();
    const usedColors = Object.values(state.continents).map(c => c.color);
    const available = palette.filter(c => !usedColors.includes(c));
    if (available.length > 0) return available[0];
    // If all used, cycle
    return palette[(Object.keys(state.continents).length) % palette.length];
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({
      type: 'ADD_CONTINENT',
      payload: {
        id,
        name: newName,
        bonusValue: newBonus,
        color: getNextColor(),
        territoryIds: [],
      },
    });
    setNewName('');
    setNewBonus(0);
  };

  const handleEdit = (id: string, name: string, bonus: number) => {
    setEditingId(id);
    setEditName(name);
    setEditBonus(bonus);
  };

  const handleEditSave = (id: string) => {
    dispatch({
      type: 'UPDATE_CONTINENT',
      payload: { id, updates: { name: editName, bonusValue: editBonus } },
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_CONTINENT', payload: id });
  };

  function getRandomColor() {
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#8bc34a', '#ffc107'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const handleColorSelect = (continentId: string, color: string) => {
    dispatch({
      type: 'UPDATE_CONTINENT',
      payload: { id: continentId, updates: { color } }
    });
    setColorPickerAnchor(null);
  };

  const handleTerritoryAssignment = (territoryId: string, continentId: string | null) => {
    dispatch({
      type: 'UPDATE_TERRITORY',
      payload: { id: territoryId, updates: { continentId } }
    });
    setSelectedTerritory('');
  };

  const toggleContinentExpand = (continentId: string) => {
    setExpandedContinent(expandedContinent === continentId ? null : continentId);
  };

  return (
    <Box sx={{ width: 320, p: 2, bgcolor: 'background.paper', borderRight: '1px solid #eee', height: '100vh', overflowY: 'auto', position: 'relative' }}>
      <IconButton size="small" onClick={onToggle} sx={{ position: 'absolute', top: 8, right: 8 }} title="Hide Continents">
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="h6" gutterBottom>Continents</Typography>
      
      {/* Territory Assignment Section */}
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <InputLabel>Select Continent</InputLabel>
          <Select
            value={selectedContinent}
            label="Select Continent"
            onChange={(e) => setSelectedContinent(e.target.value)}
          >
            {Object.entries(state.continents).map(([id, c]) => (
              <MenuItem key={id} value={id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: c.color, borderRadius: '50%' }} />
                  {c.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Assign Territory</InputLabel>
          <Select
            value={selectedTerritory}
            label="Assign Territory"
            onChange={(e) => {
              const territoryId = e.target.value;
              setSelectedTerritory(territoryId);
              if (territoryId && selectedContinent) {
                const territory = state.territories[territoryId];
                const newContinentId = territory.continentId === selectedContinent ? null : selectedContinent;
                handleTerritoryAssignment(territoryId, newContinentId);
              }
            }}
            disabled={!selectedContinent}
          >
            {Object.entries(state.territories).map(([id, t]) => (
              <MenuItem key={id} value={id}>
                {t.name} {t.continentId ? `(${state.continents[t.continentId]?.name})` : '(Unassigned)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <List>
        {Object.values(state.continents).map(cont => (
          <ListItem 
            key={cont.id} 
            sx={{ 
              bgcolor: cont.color + '22', 
              mb: 1, 
              borderRadius: 1,
              flexDirection: 'column',
              alignItems: 'stretch'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {editingId === cont.id ? (
                <>
                  <TextField
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    size="small"
                    sx={{ mr: 1, flex: 1 }}
                  />
                  <TextField
                    value={editBonus}
                    onChange={e => setEditBonus(Number(e.target.value))}
                    size="small"
                    type="number"
                    sx={{ mr: 1, width: 80 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">+</InputAdornment>,
                    }}
                  />
                  <Button onClick={() => handleEditSave(cont.id)} size="small" variant="contained">Save</Button>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Box 
                      sx={{ 
                        width: 20, 
                        height: 20, 
                        bgcolor: cont.color, 
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}
                      onClick={(e) => setColorPickerAnchor({ element: e.currentTarget, continentId: cont.id })}
                    />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>{cont.name}</Typography>
                          <Typography variant="caption" sx={{ color: cont.color }}>
                            +{cont.bonusValue}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                  <IconButton onClick={() => toggleContinentExpand(cont.id)} size="small">
                    {expandedContinent === cont.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                  <Button onClick={() => handleEdit(cont.id, cont.name, cont.bonusValue)} size="small">Edit</Button>
                  <IconButton onClick={() => handleDelete(cont.id)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </>
              )}
            </Box>
            
            <Collapse in={expandedContinent === cont.id}>
              <List dense sx={{ pl: 2, mt: 1 }}>
                {Object.values(state.territories)
                  .filter(t => t.continentId === cont.id)
                  .map(t => (
                    <ListItem key={t.id} sx={{ py: 0.5 }}>
                      <ListItemText primary={t.name} />
                      <IconButton 
                        size="small" 
                        onClick={() => handleTerritoryAssignment(t.id, null)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                  ))}
                {Object.values(state.territories).filter(t => t.continentId === cont.id).length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="No territories assigned" 
                      sx={{ color: 'text.secondary', fontStyle: 'italic' }} 
                    />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">Add Continent</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            label="Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Bonus"
            value={newBonus}
            onChange={e => setNewBonus(Number(e.target.value))}
            size="small"
            type="number"
            sx={{ width: 80 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">+</InputAdornment>,
            }}
          />
          <IconButton onClick={handleAdd} color="primary" size="large">
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="primary" size="small" onClick={() => {
          if (!palette) return;
          Object.values(state.continents).forEach((cont, idx) => {
            const color = palette[idx % palette.length];
            if (cont.color !== color) {
              dispatch({ type: 'UPDATE_CONTINENT', payload: { id: cont.id, updates: { color } } });
            }
          });
        }}>
          Recolor All
        </Button>
      </Box>

      {/* Color Picker Popover */}
      <Popover
        open={!!colorPickerAnchor}
        anchorEl={colorPickerAnchor?.element}
        onClose={() => setColorPickerAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
          {(palette || PRESET_COLORS).map((color) => (
            <Box
              key={color}
              sx={{
                width: 24,
                height: 24,
                bgcolor: color,
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.1)',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
              onClick={() => colorPickerAnchor && handleColorSelect(colorPickerAnchor.continentId, color)}
            />
          ))}
        </Box>
      </Popover>
    </Box>
  );
}; 