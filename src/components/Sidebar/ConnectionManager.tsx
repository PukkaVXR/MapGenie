import React from 'react';
import { useMap } from '../../context/MapContext';
import { Box, Typography, List, ListItem, ListItemText, IconButton, Button, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HighlightIcon from '@mui/icons-material/Highlight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

export const ConnectionManager: React.FC<{ setHighlighted: (conn: { from: string; to: string } | null) => void; highlighted: { from: string; to: string } | null; open?: boolean; onToggle?: () => void }> = ({ setHighlighted, highlighted, open = true, onToggle }) => {
  if (!open) return null;
  const { state, dispatch } = useMap();

  // Gather all unique straight connections from the global array
  const connections = state.connections;

  // Remove all connections for a territory
  const removeAllForTerritory = (territoryId: string) => {
    state.connections.forEach(conn => {
      if (conn.from === territoryId || conn.to === territoryId) {
        dispatch({ type: 'REMOVE_CONNECTION', payload: { from: conn.from, to: conn.to } });
      }
    });
    // Also remove all freehand connections for this territory
    state.freehandConnections.forEach(conn => {
      if (conn.from === territoryId || conn.to === territoryId) {
        dispatch({ type: 'REMOVE_FREEHAND_CONNECTION', payload: conn.id });
      }
    });
  };

  // Remove all connections globally
  const removeAllConnections = () => {
    state.connections.forEach(conn => {
      dispatch({ type: 'REMOVE_CONNECTION', payload: { from: conn.from, to: conn.to } });
    });
    state.freehandConnections.forEach(conn => {
      dispatch({ type: 'REMOVE_FREEHAND_CONNECTION', payload: conn.id });
    });
  };

  return (
    <Box sx={{ width: 320, p: 2, bgcolor: 'background.paper', borderRight: '1px solid #eee', height: '100vh', overflowY: 'auto', position: 'relative' }}>
      <IconButton size="small" onClick={onToggle} sx={{ position: 'absolute', top: 8, right: 8 }} title="Hide Connections">
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="h6" gutterBottom>Connections</Typography>
      <Button variant="outlined" color="error" fullWidth sx={{ mb: 2 }} onClick={removeAllConnections} disabled={connections.length === 0}>
        Remove All Connections
      </Button>
      <List dense>
        {connections.length === 0 && <Typography variant="body2">No connections.</Typography>}
        {connections.map((conn) => {
          const fromName = state.territories[conn.from]?.name || conn.from;
          const toName = state.territories[conn.to]?.name || conn.to;
          const isHighlighted = highlighted &&
            ((highlighted.from === conn.from && highlighted.to === conn.to) ||
             (highlighted.from === conn.to && highlighted.to === conn.from));
          return (
            <ListItem key={conn.from + '-' + conn.to} secondaryAction={
              <>
                <IconButton edge="end" onClick={() => setHighlighted(isHighlighted ? null : conn)} color={isHighlighted ? 'primary' : 'default'}>
                  <HighlightIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => {
                  dispatch({ type: 'REMOVE_CONNECTION', payload: { from: conn.from, to: conn.to } });
                  // Also remove freehand connection if it exists
                  const freehandConn = state.freehandConnections.find(fconn =>
                    (fconn.from === conn.from && fconn.to === conn.to) ||
                    (fconn.from === conn.to && fconn.to === conn.from)
                  );
                  if (freehandConn) {
                    dispatch({ type: 'REMOVE_FREEHAND_CONNECTION', payload: freehandConn.id });
                  }
                }} color="error">
                  <DeleteIcon />
                </IconButton>
              </>
            }>
              <ListItemText primary={`${fromName} – ${toName}`} />
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1">Remove All for Territory</Typography>
      <List dense>
        {Object.entries(state.territories).map(([id, t]) => (
          <ListItem key={id} secondaryAction={
            <Button size="small" color="error" variant="outlined" onClick={() => removeAllForTerritory(id)}
              disabled={state.connections.filter(conn => conn.from === id || conn.to === id).length === 0 && state.freehandConnections.filter(conn => conn.from === id || conn.to === id).length === 0}>
              Remove All
            </Button>
          }>
            <ListItemText primary={t.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}; 