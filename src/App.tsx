import { ThemeProvider, createTheme, CssBaseline, Box, IconButton } from '@mui/material';
import { MapProvider, useMap, initialState } from './context/MapContext';
import { MapCanvas } from './components/Canvas/MapCanvas';
import { ContinentEditor } from './components/Sidebar/ContinentEditor';
import { useState, useRef } from 'react';
import { ConnectionManager } from './components/Sidebar/ConnectionManager';
import { UtilityToolbar } from './components/Toolbar/UtilityToolbar';
import React from 'react';
import { MainTools } from './components/Toolbar/MainTools';
import { ZombieTools } from './components/Toolbar/ZombieTools';

function AppContent({ toggleTheme, themeMode }: { toggleTheme: () => void; themeMode: 'light' | 'dark' }) {
  const { state, dispatch, canUndo, canRedo } = useMap();
  const [highlightedConnection, setHighlightedConnection] = useState<{ from: string; to: string } | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [continentOpen, setContinentOpen] = useState(true);
  const [connectionOpen, setConnectionOpen] = useState(true);
  const mapCanvasRef = useRef<any>(null);
  const [isZombieMode, setIsZombieMode] = useState(false);
  const [zombieTool, setZombieTool] = useState<'select' | 'number' | 'arrow' | 'key'>('select');
  const [zombieArrowColor, setZombieArrowColor] = useState('#f44336');
  const [zombieArrowSize, setZombieArrowSize] = useState(4);
  const [zombieNumberFont, setZombieNumberFont] = useState('Arial');
  const [zombieNumberFontSize, setZombieNumberFontSize] = useState(24);
  const [zombieNumberColor, setZombieNumberColor] = useState('#fff');

  const PALETTES = {
    Classic: ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#8bc34a', '#ffc107'],
    Pastel: ['#ffd1dc', '#b5ead7', '#c7ceea', '#ffdac1', '#e2f0cb', '#b5ead7', '#ffb7b2', '#c7ceea'],
    Vibrant: ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6'],
  } as const;

  type PaletteName = keyof typeof PALETTES;
  const paletteNames = Object.keys(PALETTES) as PaletteName[];
  const [paletteName, setPaletteName] = useState<PaletteName>(() => (localStorage.getItem('paletteName') as PaletteName) || 'Classic');
  React.useEffect(() => { localStorage.setItem('paletteName', paletteName); }, [paletteName]);
  const palette = [...PALETTES[paletteName]];
  const handlePaletteChange = (name: string) => setPaletteName(name as PaletteName);

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'risk-map.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target?.result as string);
        // Merge with default state to ensure all fields exist
        const merged = {
          ...initialState,
          ...json,
          viewSettings: {
            ...initialState.viewSettings,
            ...(json.viewSettings || {})
          }
        };
        if (merged.territories && merged.continents) {
          dispatch({ type: 'REPLACE_STATE', payload: merged });
        } else {
          alert('Invalid map file.');
        }
      } catch {
        alert('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Save to Local Storage
  const handleSaveLocal = () => {
    try {
      localStorage.setItem('riskMapData', JSON.stringify(state));
      alert('Map saved to local storage.');
    } catch {
      alert('Failed to save to local storage.');
    }
  };

  // Load from Local Storage
  const handleLoadLocal = () => {
    try {
      const data = localStorage.getItem('riskMapData');
      if (!data) {
        alert('No saved map found in local storage.');
        return;
      }
      const json = JSON.parse(data);
      // Merge with default state to ensure all fields exist
      const merged = {
        ...initialState,
        ...json,
        viewSettings: {
          ...initialState.viewSettings,
          ...(json.viewSettings || {})
        }
      };
      if (merged.territories && merged.continents) {
        dispatch({ type: 'REPLACE_STATE', payload: merged });
        alert('Map loaded from local storage.');
      } else {
        alert('Invalid map data in local storage.');
      }
    } catch {
      alert('Failed to load from local storage.');
    }
  };

  // Set Background Image
  const handleSetBackground = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      setBackgroundImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove Background Image
  const handleRemoveBackground = () => setBackgroundImage(null);

  // Export PNG
  const handleExportPNG = (filename: string) => {
    console.log('mapCanvasRef.current:', mapCanvasRef.current);
    if (mapCanvasRef.current && mapCanvasRef.current.exportPNG) {
      mapCanvasRef.current.exportPNG(filename);
    } else {
      alert('Map is not ready for export.');
    }
  };

  // Undo/Redo handlers
  const handleUndo = () => dispatch({ type: 'UNDO' });
  const handleRedo = () => dispatch({ type: 'REDO' });

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (canUndo) handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        if (canRedo) handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo]);

  // Move handleAutoPathFile up from MapCanvas
  function handleAutoPathFile(file: File) {
    if (mapCanvasRef.current && mapCanvasRef.current.autoPathFromJson) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          mapCanvasRef.current.autoPathFromJson(json);
        } catch (err) {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  }

  return (
    <Box sx={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {continentOpen ? (
        <ContinentEditor open={continentOpen} onToggle={() => setContinentOpen(false)} palette={palette} />
      ) : (
        <Box sx={{ width: 24, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', borderRight: '1px solid #eee', position: 'relative' }}>
          <IconButton size="small" onClick={() => setContinentOpen(true)} title="Show Continents" sx={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20"><path d="M7 4l6 6-6 6" stroke="#1976d2" strokeWidth="2" fill="none"/></svg>
          </IconButton>
          <Box sx={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%) rotate(-90deg)' }}>
            <span style={{ fontSize: 13, letterSpacing: 2, color: '#1976d2', fontWeight: 500 }}>Continents</span>
          </Box>
        </Box>
      )}
      {connectionOpen ? (
        <ConnectionManager open={connectionOpen} onToggle={() => setConnectionOpen(false)} setHighlighted={setHighlightedConnection} highlighted={highlightedConnection} />
      ) : (
        <Box sx={{ width: 24, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', borderRight: '1px solid #eee', position: 'relative' }}>
          <IconButton size="small" onClick={() => setConnectionOpen(true)} title="Show Connections" sx={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20"><path d="M7 4l6 6-6 6" stroke="#1976d2" strokeWidth="2" fill="none"/></svg>
          </IconButton>
          <Box sx={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%) rotate(-90deg)' }}>
            <span style={{ fontSize: 13, letterSpacing: 2, color: '#1976d2', fontWeight: 500 }}>Connections</span>
          </Box>
        </Box>
      )}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <UtilityToolbar
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onSaveLocal={handleSaveLocal}
          onLoadLocal={handleLoadLocal}
          onSetBackground={handleSetBackground}
          onRemoveBackground={handleRemoveBackground}
          onExportPNG={handleExportPNG}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          toggleTheme={toggleTheme}
          themeMode={themeMode}
          paletteName={paletteName}
          palette={palette}
          paletteNames={paletteNames}
          onPaletteChange={handlePaletteChange}
          onToggleTerritoryNames={() => dispatch({ type: 'TOGGLE_VIEW_SETTING', payload: 'showTerritoryNames' })}
          onToggleContinentColors={() => dispatch({ type: 'TOGGLE_VIEW_SETTING', payload: 'showContinentColors' })}
          onToggleConnections={() => dispatch({ type: 'TOGGLE_VIEW_SETTING', payload: 'showConnections' })}
          showTerritoryNames={state.viewSettings.showTerritoryNames}
          showContinentColors={state.viewSettings.showContinentColors}
          showConnections={state.viewSettings.showConnections}
          onZombieModeToggle={() => {
            setIsZombieMode(z => {
              const next = !z;
              if (next) setZombieTool('select');
              return next;
            });
          }}
          isZombieMode={isZombieMode}
        />
        {isZombieMode ? (
          <ZombieTools
            selectedTool={zombieTool}
            onToolChange={tool => setZombieTool(tool as 'select' | 'number' | 'arrow' | 'key')}
            arrowColor={zombieArrowColor}
            onArrowColorChange={setZombieArrowColor}
            arrowSize={zombieArrowSize}
            onArrowSizeChange={setZombieArrowSize}
            numberFont={zombieNumberFont}
            onNumberFontChange={setZombieNumberFont}
            numberFontSize={zombieNumberFontSize}
            onNumberFontSizeChange={setZombieNumberFontSize}
            numberColor={zombieNumberColor}
            onNumberColorChange={setZombieNumberColor}
            autoPathHandler={handleAutoPathFile}
          />
        ) : (
          <MainTools />
        )}
        <MapCanvas
          ref={mapCanvasRef}
          backgroundImage={backgroundImage}
          isZombieMode={isZombieMode}
          zombieTool={zombieTool}
          zombieNumberFont={zombieNumberFont}
          zombieNumberFontSize={zombieNumberFontSize}
          zombieNumberColor={zombieNumberColor}
          zombieArrowColor={zombieArrowColor}
          zombieArrowSize={zombieArrowSize}
        />
      </Box>
    </Box>
  );
}

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  React.useEffect(() => { localStorage.setItem('themeMode', mode); }, [mode]);
  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: mode as 'light' | 'dark',
      background: { default: mode === 'dark' ? '#181818' : '#f5f5f5' },
    },
  }), [mode]);
  const toggleTheme = () => setMode(m => m === 'light' ? 'dark' : 'light');
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MapProvider>
        <AppContent toggleTheme={toggleTheme} themeMode={mode as 'light' | 'dark'} />
      </MapProvider>
    </ThemeProvider>
  );
}

export default App;
