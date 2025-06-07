import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Rect, Line, Circle, Image as KonvaImage, Arrow, Transformer } from 'react-konva';
import { useMap } from '../../context/MapContext';
import { Box, Button, IconButton } from '@mui/material';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '@mui/material/styles';
import zombiemodeImg from '../../../public/Zombiemode.png';

// Constants
import { CANVAS_INITIAL_WIDTH, CANVAS_INITIAL_HEIGHT } from './constants/sizes';
import { ZOMBIE_ARROW_ORDER_COLORS } from './constants/colors';

// Types
import type { ZombieNumber, ZombieArrow, SelectionRect } from './types';

// Hooks
import { usePanZoom } from './hooks/usePanZoom';
import { useDrawing } from './hooks/useDrawing';

// Components
import { Territory } from './components/Territory';
import { DrawingPreview } from './components/DrawingPreview';
import { ZombieArrow as ZombieArrowComponent } from './components/ZombieArrow';
import { ZombieNumber as ZombieNumberComponent } from './components/ZombieNumber';
import { EditorPanel } from './components/EditorPanel';

// Utils
import { getPolygonBounds, rectsIntersect, getTerritoryCenter } from './utils/geometry';
import { getCanvasPointer } from './utils/canvasUtils';
import { arrowKey, pairKey, calculateArrowOffset } from './utils/zombieUtils';

const MapCanvas = forwardRef<any, { 
  backgroundImage?: string | null, 
  isZombieMode: boolean, 
  zombieTool: string, 
  zombieNumberFont: string, 
  zombieNumberFontSize: number, 
  zombieNumberColor: string, 
  zombieArrowColor: string, 
  zombieArrowSize: number 
}>((props, ref) => {
  const { 
    backgroundImage, 
    isZombieMode, 
    zombieTool, 
    zombieNumberFont, 
    zombieNumberFontSize, 
    zombieNumberColor, 
    zombieArrowColor, 
    zombieArrowSize 
  } = props;

  const { state, dispatch } = useMap();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputPos, setInputPos] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  // Marquee selection state
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawing hook
  const {
    drawing,
    newShape,
    snappedEdge,
    connectionStart,
    freehandDrawing,
    freehandPoints,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    handleDrawingDblClick,
  } = useDrawing({ stageRef });

  // Pan/zoom hook
  const {
    stageScale,
    stageX,
    stageY,
    isPanning,
    spacePressed,
    handleWheel,
    startPanning,
    updatePanning,
    endPanning,
    handleResetView,
  } = usePanZoom({ stageRef });

  const [canvasWidth] = useState(CANVAS_INITIAL_WIDTH);
  const [canvasHeight] = useState(CANVAS_INITIAL_HEIGHT);
  const [bgImage] = useImage(backgroundImage || '', 'anonymous');
  const theme = useTheme();

  // Clear connection preview if tool changes
  useEffect(() => {
    if (state.selectedTool !== 'connect') {
      // Clear connection state if needed
    }
  }, [state.selectedTool]);

  // Drawing handlers
  const handleStageMouseDown = (e: any) => {
    if (isZombieMode) {
      handleStageMouseDownZombie(e);
      return;
    }
    
    const stage = stageRef.current.getStage();
    const pointer = getCanvasPointer(stage);
    
    // Check if we should start marquee selection
    if (state.selectedTool === 'select' && e.target === e.target.getStage()) {
      setSelectedId(null);
      setInputPos(null);
      setSelectionStart({ x: pointer.x, y: pointer.y });
      setSelectionRect({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
      return;
    }
    
    // Otherwise handle drawing
    handleDrawingMouseDown(e);
  };

  const handleStageMouseMove = () => {
    if (isZombieMode) {
      handleStageMouseMoveZombie();
      return;
    }
    
    // Handle marquee selection
    if (selectionStart && !drawing) {
      const stage = stageRef.current.getStage();
      const pointer = getCanvasPointer(stage);
      setSelectionRect({
        x: Math.min(selectionStart.x, pointer.x),
        y: Math.min(selectionStart.y, pointer.y),
        width: Math.abs(pointer.x - selectionStart.x),
        height: Math.abs(pointer.y - selectionStart.y),
      });
      return;
    }
    
    // Otherwise handle drawing
    handleDrawingMouseMove();
  };

  const handleStageMouseUp = () => {
    if (isZombieMode) {
      handleStageMouseUpZombie();
      return;
    }
    
    // Handle marquee selection
    if (selectionRect && selectionStart) {
      const selected: string[] = [];
      Object.entries(state.territories).forEach(([id, t]) => {
        let bounds = null;
        if (t.shape.type === 'polygon' || t.shape.type === 'freehand') {
          bounds = getPolygonBounds(t.shape.points);
        } else if (t.shape.type === 'rect' || t.shape.type === 'ellipse') {
          bounds = t.shape;
        }
        if (bounds && rectsIntersect(selectionRect, bounds)) {
          selected.push(id);
        }
      });
      setSelectedIds(selected);
      setSelectedId(selected.length === 1 ? selected[0] : null);
      setSelectionRect(null);
      setSelectionStart(null);
      return;
    }
    
    // Otherwise handle drawing
    handleDrawingMouseUp();
  };

  // Selection and renaming
  const handleShapeClick = (id: string, shape: any) => {
    setSelectedId(id);
    setSelectedIds([id]);
    setInputValue(state.territories[id].name);
    let x = 0, y = 0;
    if (shape.type === 'polygon' || shape.type === 'freehand') {
      const bounds = getPolygonBounds(shape.points);
      x = bounds.x + bounds.width / 2;
      y = bounds.y + bounds.height / 2;
    } else if (shape.type === 'rect' || shape.type === 'ellipse') {
      x = shape.x + shape.width / 2;
      y = shape.y + shape.height / 2;
    }
    setInputPos({ x, y: y - 30 });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (selectedId) {
      dispatch({
        type: 'UPDATE_TERRITORY',
        payload: { id: selectedId, updates: { name: e.target.value } },
      });
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      dispatch({ type: 'DELETE_TERRITORY', payload: selectedId });
      setSelectedId(null);
      setInputPos(null);
      setSelectedIds([]);
    }
  };

  const handleTextSettingsChange = (settings: any) => {
    if (selectedId) {
      dispatch({
        type: 'UPDATE_TERRITORY',
        payload: {
          id: selectedId,
          updates: {
            textSettings: settings
          }
        }
      });
    }
  };

  // Transformer logic
  React.useEffect(() => {
    if (transformerRef.current && selectedIds.length > 0) {
      const stage = stageRef.current.getStage();
      const shapes = selectedIds
        .map(id => stage.findOne(`#shape-${id}`))
        .filter(Boolean);
      if (shapes.length > 0) {
        transformerRef.current.nodes(shapes);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedIds, state.territories]);

  const handleDragEnd = (e: any) => {
    if (state.selectedTool === 'select') {
      const territoryId = e.target.id().replace('shape-', '');
      const territory = state.territories[territoryId];
      if (!territory) return;
      const dx = e.target.x();
      const dy = e.target.y();

      // Update the shape's position based on its type
      let updatedShape = { ...territory.shape };
      if (territory.shape.type === 'polygon' || territory.shape.type === 'freehand') {
        updatedShape = {
          ...updatedShape,
          points: territory.shape.points.map((point: number, index: number) => 
            index % 2 === 0 ? point + dx : point + dy
          )
        };
      } else if (territory.shape.type === 'rect' || territory.shape.type === 'ellipse') {
        updatedShape = {
          ...updatedShape,
          x: territory.shape.x + dx,
          y: territory.shape.y + dy
        };
      }

      dispatch({
        type: 'UPDATE_TERRITORY',
        payload: {
          id: territoryId,
          updates: {
            shape: updatedShape,
            position: {
              x: territory.position.x + dx,
              y: territory.position.y + dy
            }
          }
        }
      });

      // Update freehand connections involving this territory
      state.freehandConnections.forEach(conn => {
        let updatedPoints = null;
        if (conn.from === territoryId) {
          updatedPoints = [...conn.points];
          updatedPoints[0] += dx;
          updatedPoints[1] += dy;
        }
        if (conn.to === territoryId) {
          updatedPoints = updatedPoints || [...conn.points];
          updatedPoints[updatedPoints.length - 2] += dx;
          updatedPoints[updatedPoints.length - 1] += dy;
        }
        if (updatedPoints) {
          dispatch({
            type: 'ADD_FREEHAND_CONNECTION',
            payload: { ...conn, points: updatedPoints }
          });
        }
      });

      // Reset the node's position to 0,0
      e.target.x(0);
      e.target.y(0);
    }
  };

  // Zombie mode state
  const [zombieNumbers, setZombieNumbers] = useState<ZombieNumber[]>([]);
  const [nextZombieNumber, setNextZombieNumber] = useState(1);
  const [zombieArrows, setZombieArrows] = useState<ZombieArrow[]>([]);
  const [drawingZombieArrow, setDrawingZombieArrow] = useState<null | { x1: number; y1: number; x2: number; y2: number; color: string; strokeWidth: number }>(null);
  const [showZombieFlash, setShowZombieFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Show flash overlay when switching to zombie mode
  useEffect(() => {
    if (isZombieMode) {
      setShowZombieFlash(true);
      const timer = setTimeout(() => setShowZombieFlash(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowZombieFlash(false);
    }
  }, [isZombieMode]);

  // Close pop-up editors when switching away from select tool
  useEffect(() => {
    if (isZombieMode && zombieTool !== 'select') {
      setDrawingZombieArrow(null);
    }
  }, [zombieTool, isZombieMode]);

  // Zombie number handlers
  const handleZombieNumberPlace = (pointer: {x: number, y: number}) => {
    setZombieNumbers(nums => [
      ...nums,
      {
        id: uuidv4(),
        value: nextZombieNumber,
        x: pointer.x,
        y: pointer.y,
        fontSize: zombieNumberFontSize,
        fontFamily: zombieNumberFont,
        color: zombieNumberColor,
      }
    ]);
    setNextZombieNumber(n => n + 1);
  };

  const handleZombieNumberClick = (num: any) => {
    if (zombieTool === 'select') {
      console.log('Zombie number clicked:', num.id);
    }
  };

  const handleZombieNumberDrag = (id: string, x: number, y: number) => {
    setZombieNumbers(nums => nums.map(n => n.id === id ? { ...n, x, y } : n));
  };

  // Zombie arrow handlers
  const handleZombieArrowMouseDown = (pointer: {x: number, y: number}) => {
    setDrawingZombieArrow({ x1: pointer.x, y1: pointer.y, x2: pointer.x, y2: pointer.y, color: zombieArrowColor, strokeWidth: zombieArrowSize });
  };

  const handleZombieArrowMouseMove = (pointer: {x: number, y: number}) => {
    if (drawingZombieArrow) {
      setDrawingZombieArrow({ ...drawingZombieArrow, x2: pointer.x, y2: pointer.y });
    }
  };

  const handleZombieArrowMouseUp = (pointer: {x: number, y: number}) => {
    if (drawingZombieArrow) {
      const x1 = drawingZombieArrow.x1;
      const y1 = drawingZombieArrow.y1;
      const x2 = pointer.x;
      const y2 = pointer.y;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      setZombieArrows(arrows => [
        ...arrows,
        {
          ...drawingZombieArrow,
          x2,
          y2,
          id: uuidv4(),
          from: -1,
          to: -1,
          bidirectional: false,
          offsetIndex: 0,
          rotation: 0,
          length,
          midX,
          midY,
          curvature: 0,
        }
      ]);
      setDrawingZombieArrow(null);
    }
  };

  const handleZombieArrowClick = (arrow: any) => {
    // Just log click for now, no selection
    console.log('Arrow clicked:', arrow.id);
  };

  // Zombie mode mouse handlers
  const handleStageMouseDownZombie = (e: any) => {
    const stage = stageRef.current.getStage();
    const pointer = getCanvasPointer(stage);
    
    if (isZombieMode && zombieTool === 'arrow') {
      handleZombieArrowMouseDown(pointer);
      return;
    }
    
    if (isZombieMode && zombieTool === 'number') {
      handleZombieNumberPlace(pointer);
      return;
    }
    
    // Only clear selection if clicking on empty canvas
    if (e && e.target && e.target === e.target.getStage()) {
      setDrawingZombieArrow(null);
    }
  };

  const handleStageMouseMoveZombie = () => {
    if (isZombieMode && zombieTool === 'arrow' && drawingZombieArrow) {
      const stage = stageRef.current.getStage();
      const pointer = getCanvasPointer(stage);
      handleZombieArrowMouseMove(pointer);
    }
  };

  const handleStageMouseUpZombie = () => {
    if (isZombieMode && zombieTool === 'arrow' && drawingZombieArrow) {
      const stage = stageRef.current.getStage();
      const pointer = getCanvasPointer(stage);
      handleZombieArrowMouseUp(pointer);
    }
  };

  // Auto path functionality
  const autoPathFromJson = (json: any) => {
    const numMap = new Map(zombieNumbers.map(n => [n.value, n]));
    const newArrows: any[] = [];
    const pairCounts: Record<string, number> = {};
    
    // First pass: count arrows between each pair
    Object.entries(json).forEach(([fromIdx, data]: any) => {
      const fromNum = numMap.get(Number(fromIdx));
      if (!fromNum) return;
      Object.entries(data.links).forEach(([toIdx, _toName]: any) => {
        const toNum = numMap.get(Number(toIdx));
        if (!toNum) return;
        const key = pairKey(fromNum.value, toNum.value);
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      });
    });
    
    // Second pass: collect all arrows with their color index
    const pairOffsets: Record<string, number> = {};
    const arrowMap = new Map();
    Object.entries(json).forEach(([fromIdx, data]: any) => {
      const fromNum = numMap.get(Number(fromIdx));
      if (!fromNum) return;
      Object.entries(data.links).forEach(([toIdx, _toName]: any, i) => {
        const toNum = numMap.get(Number(toIdx));
        if (!toNum) return;
        const key = pairKey(fromNum.value, toNum.value);
        const total = pairCounts[key];
        pairOffsets[key] = (pairOffsets[key] || 0) + 1;
        const offsetIndex = pairOffsets[key] - Math.ceil(total / 2);
        const offsetMag = calculateArrowOffset(offsetIndex);
        const angle = Math.atan2(toNum.y - fromNum.y, toNum.x - fromNum.x);
        const perpAngle = angle + Math.PI / 2;
        const offsetX = Math.cos(perpAngle) * offsetMag;
        const offsetY = Math.sin(perpAngle) * offsetMag;
        let x1 = fromNum.x + offsetX;
        let y1 = fromNum.y + offsetY;
        let x2 = toNum.x + offsetX;
        let y2 = toNum.y + offsetY;
        // Shorten the arrow
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 28 * 2) {
          const trimX = (dx / len) * 28;
          const trimY = (dy / len) * 28;
          x1 += trimX;
          y1 += trimY;
          x2 -= trimX;
          y2 -= trimY;
        }
        const color = ZOMBIE_ARROW_ORDER_COLORS[i] || '#222';
        const k = arrowKey(fromNum.value, toNum.value, color);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        arrowMap.set(k, {
          id: uuidv4(),
          from: fromNum.value,
          to: toNum.value,
          x1, y1, x2, y2,
          color,
          strokeWidth: zombieArrowSize,
          bidirectional: false,
          offsetIndex: offsetIndex,
          rotation: 0,
          length,
          midX,
          midY,
          curvature: 0,
        });
      });
    });
    
    // Third pass: build final arrows, merging bidirectional where needed
    const usedPairs = new Set();
    arrowMap.forEach((arrow, key) => {
      const reverseKey = arrowKey(arrow.to, arrow.from, arrow.color);
      if (arrowMap.has(reverseKey) && !usedPairs.has(reverseKey)) {
        newArrows.push({ ...arrow, bidirectional: true });
        usedPairs.add(key);
        usedPairs.add(reverseKey);
      } else if (!usedPairs.has(key)) {
        newArrows.push({ ...arrow, bidirectional: false });
        usedPairs.add(key);
      }
    });
    
    if (newArrows.length === 0) {
      alert('No arrows were created. Make sure you have placed zombie numbers and your JSON matches the numbers.');
    }
    setZombieArrows(newArrows);
  };

  const handleAutoPathFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        autoPathFromJson(json);
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const triggerAutoPathFile = () => {
    fileInputRef.current?.click();
  };

  useImperativeHandle(ref, () => ({
    exportPNG: (filename: string) => {
      if (stageRef.current) {
        const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
        const a = document.createElement('a');
        a.href = uri;
        a.download = filename || 'risk-map.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
    autoPathFromJson,
  }));

  // Pan/zoom mouse handlers
  const handleStageMouseDownPan = (e: any) => {
    if (spacePressed) {
      startPanning();
    } else {
      handleStageMouseDown(e);
    }
  };

  const handleStageMouseMovePan = () => {
    if (isPanning) {
      updatePanning();
    } else {
      handleStageMouseMove();
    }
  };

  const handleStageMouseUpPan = () => {
    if (isPanning) {
      endPanning();
    } else {
      handleStageMouseUp();
    }
  };

  const handleZombieArrowDragEnd = (e: any) => {
    const { arrow, dx, dy } = e;
    setZombieArrows(arrows => arrows.map(a => 
      a.id === arrow.id 
        ? {
            ...a,
            x1: arrow.x1 + dx,
            y1: arrow.y1 + dy,
            x2: arrow.x2 + dx,
            y2: arrow.y2 + dy,
            midX: arrow.midX + dx,
            midY: arrow.midY + dy,
          }
        : a
    ));
  };

  // ... existing code ...
  // Continue with the rest of the component
  
  return (
    <>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
          padding: 2,
          position: 'relative',
          overflow: 'auto',
        }}
      >
        {/* Zombie mode flash overlay */}
        {showZombieFlash && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'rgba(0,0,0,0.7)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.5s',
            }}
          >
            <img
              src={zombiemodeImg}
              alt="Zombie Mode"
              style={{
                maxWidth: '80%',
                maxHeight: '80%',
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                border: '4px solid #fff',
              }}
            />
          </Box>
        )}
        <Box
          sx={{
            position: 'relative',
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          <Stage
            width={canvasWidth}
            height={canvasHeight}
            ref={stageRef}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stageX}
            y={stageY}
            onWheel={handleWheel}
            onMouseDown={isZombieMode ? handleStageMouseDownZombie : handleStageMouseDownPan}
            onMouseMove={isZombieMode ? handleStageMouseMoveZombie : handleStageMouseMovePan}
            onMouseUp={isZombieMode ? handleStageMouseUpZombie : handleStageMouseUpPan}
            onDblClick={handleDrawingDblClick}
            style={{ background: '#f0f0f0', border: '1px solid #ccc', cursor: spacePressed ? 'grab' : undefined }}
          >
            <Layer>
              {/* Background image */}
              {bgImage && (
                <KonvaImage
                  image={bgImage}
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  listening={false}
                  opacity={1}
                />
              )}
              
              {/* Freehand connections */}
              {state.viewSettings.showConnections && state.freehandConnections.map(conn => (
                <Line
                  key={conn.id}
                  points={conn.points}
                  stroke="#1976d2"
                  strokeWidth={3}
                  dash={[10, 10]}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.8}
                />
              ))}
              
              {/* Straight connections */}
              {state.viewSettings.showConnections && state.connections.map(conn => {
                const fromTerritory = state.territories[conn.from];
                const toTerritory = state.territories[conn.to];
                if (!fromTerritory || !toTerritory || !conn.fromPoint || !conn.toPoint) return null;

                // Convert relative points to absolute coordinates
                let fromAbs = { x: 0, y: 0 };
                let toAbs = { x: 0, y: 0 };
                if (fromTerritory.shape.type === 'polygon' || fromTerritory.shape.type === 'freehand') {
                  const bounds = getPolygonBounds(fromTerritory.shape.points);
                  fromAbs.x = bounds.x + conn.fromPoint.x;
                  fromAbs.y = bounds.y + conn.fromPoint.y;
                } else if (fromTerritory.shape.type === 'rect' || fromTerritory.shape.type === 'ellipse') {
                  fromAbs.x = fromTerritory.shape.x + conn.fromPoint.x;
                  fromAbs.y = fromTerritory.shape.y + conn.fromPoint.y;
                }
                if (toTerritory.shape.type === 'polygon' || toTerritory.shape.type === 'freehand') {
                  const bounds = getPolygonBounds(toTerritory.shape.points);
                  toAbs.x = bounds.x + conn.toPoint.x;
                  toAbs.y = bounds.y + conn.toPoint.y;
                } else if (toTerritory.shape.type === 'rect' || toTerritory.shape.type === 'ellipse') {
                  toAbs.x = toTerritory.shape.x + conn.toPoint.x;
                  toAbs.y = toTerritory.shape.y + conn.toPoint.y;
                }
                return (
                  <Line
                    key={`${conn.from}-${conn.to}`}
                    points={[fromAbs.x, fromAbs.y, toAbs.x, toAbs.y]}
                    stroke={'#1976d2'}
                    strokeWidth={2}
                    dash={[5, 5]}
                    lineCap="round"
                  />
                );
              })}
              
              {/* Connection preview (freehand) */}
              {state.selectedTool === 'connect' && state.connectionMode === 'freehand' && 
               freehandDrawing && freehandPoints.length > 1 && (
                <Line
                  points={freehandPoints}
                  stroke="#1976d2"
                  strokeWidth={3}
                  dash={[10, 10]}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.5}
                />
              )}
              
              {/* Highlight connection start */}
              {state.selectedTool === 'connect' && connectionStart && (
                <Circle
                  x={getTerritoryCenter(state.territories[connectionStart]).x}
                  y={getTerritoryCenter(state.territories[connectionStart]).y}
                  radius={10}
                  fill="#666"
                  opacity={0.3}
                />
              )}
              
              {/* Territories */}
              {Object.entries(state.territories).map(([id, territory]) => {
                const continent = territory.continentId ? state.continents[territory.continentId] : null;
                return (
                  <Territory
                    key={id}
                    id={id}
                    territory={territory}
                    continent={continent}
                    viewSettings={state.viewSettings}
                    selectedTool={state.selectedTool}
                    onClick={handleShapeClick}
                    onDragEnd={handleDragEnd}
                  />
                );
              })}
              
              {/* Drawing preview */}
              <DrawingPreview drawing={drawing} newShape={newShape} />
              
              {/* Marquee selection rectangle */}
              {selectionRect && (
                <Rect
                  x={selectionRect.x}
                  y={selectionRect.y}
                  width={selectionRect.width}
                  height={selectionRect.height}
                  fill="rgba(0, 161, 255, 0.1)"
                  stroke="#00A1FF"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
              )}
              
              {/* Transformer */}
              {state.selectedTool === 'select' && selectedIds.length > 0 && (
                <Transformer ref={transformerRef} />
              )}
              
              {/* Snapped edge preview */}
              {state.selectedTool === 'connected' && snappedEdge && (
                <Line
                  points={[snappedEdge.edge.x1, snappedEdge.edge.y1, snappedEdge.edge.x2, snappedEdge.edge.y2]}
                  stroke="#1976d2"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
              )}
              
              {/* Zombie numbers */}
              {isZombieMode && zombieNumbers.map(num => (
                <ZombieNumberComponent
                  key={num.id}
                  num={num}
                  zombieTool={zombieTool}
                  onClick={handleZombieNumberClick}
                  onDragEnd={handleZombieNumberDrag}
                />
              ))}
              
              {/* Zombie arrows */}
              {isZombieMode && zombieArrows.map(arrow => (
                <ZombieArrowComponent
                  key={arrow.id}
                  arrow={arrow}
                  isZombieMode={isZombieMode}
                  zombieTool={zombieTool}
                  onDragEnd={handleZombieArrowDragEnd}
                  onClick={handleZombieArrowClick}
                />
              ))}
              
              {/* Drawing zombie arrow */}
              {isZombieMode && drawingZombieArrow && (
                <Arrow
                  points={[drawingZombieArrow.x1, drawingZombieArrow.y1, drawingZombieArrow.x2, drawingZombieArrow.y2]}
                  stroke={drawingZombieArrow.color}
                  fill={drawingZombieArrow.color}
                  strokeWidth={drawingZombieArrow.strokeWidth}
                  pointerLength={16}
                  pointerWidth={12}
                  lineCap="round"
                  lineJoin="round"
                  tension={0}
                  dash={[8, 8]}
                  perfectDrawEnabled={false}
                  listening={false}
                />
              )}
              
              {/* Legend rendering would go here... */}
            </Layer>
          </Stage>
          
          {/* Editor panel */}
          {inputPos && selectedId && (
            <EditorPanel
              selectedId={selectedId}
              inputValue={inputValue}
              territory={state.territories[selectedId]}
              onNameChange={handleNameChange}
              onDelete={handleDelete}
              onTextSettingsChange={handleTextSettingsChange}
            />
          )}
          
          {/* Zoom controls */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 10,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,24,24,0.85)' : 'rgba(255,255,255,0.85)',
              color: theme.palette.mode === 'dark' ? '#fff' : '#222',
              borderRadius: 1,
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              boxShadow: 1,
            }}
          >
            <span style={{ fontSize: 14, color: theme.palette.mode === 'dark' ? '#fff' : '#222' }}>
              Zoom: {(stageScale * 100).toFixed(0)}%
            </span>
            <IconButton size="small" onClick={handleResetView} title="Reset View">
              <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 2v2a6 6 0 1 1-6 6H2a8 8 0 1 0 8-8z" fill="#1976d2"/></svg>
            </IconButton>
          </Box>
          
          {/* Additional UI components would go here... */}
        </Box>
      </Box>
      
      {/* AutoPath button */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 30 }}>
        <Button variant="contained" color="secondary" onClick={triggerAutoPathFile} size="small">
          AutoPath
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleAutoPathFile(file);
          }}
        />
      </Box>
    </>
  );
});

export { MapCanvas };