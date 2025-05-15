import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Rect, Ellipse, Line, Text, Group, Transformer, Circle, Image as KonvaImage } from 'react-konva';
import { useMap } from '../../context/MapContext';
import { Box, TextField, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { MainTools } from '../Toolbar/MainTools';
import useImage from 'use-image';

const CANVAS_INITIAL_WIDTH = 1200;
const CANVAS_INITIAL_HEIGHT = 800;

const MapCanvas = forwardRef<any, { highlightedConnection?: { from: string; to: string } | null, backgroundImage?: string | null }>(
  ({ highlightedConnection, backgroundImage }, ref) => {
    const { state, dispatch } = useMap();
    const [drawing, setDrawing] = useState(false);
    const [newShape, setNewShape] = useState<any>(null); // {type, points, ...}
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [inputPos, setInputPos] = useState<{ x: number; y: number } | null>(null);
    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);

    // Marquee selection state
    const [selectionRect, setSelectionRect] = useState<any>(null); // {x, y, width, height}
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Connection state
    const [connectionStart, setConnectionStart] = useState<string | null>(null);
    const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null);

    // Clear connection preview if tool changes or connection is completed
    useEffect(() => {
      if (state.selectedTool !== 'connect') {
        setConnectionStart(null);
        setConnectionPreview(null);
      }
    }, [state.selectedTool]);

    const [canvasWidth, setCanvasWidth] = useState(CANVAS_INITIAL_WIDTH);
    const [canvasHeight, setCanvasHeight] = useState(CANVAS_INITIAL_HEIGHT);

    const [bgImage] = useImage(backgroundImage || '', 'anonymous');

    const [stageScale, setStageScale] = useState(1);
    const [stageX, setStageX] = useState(0);
    const [stageY, setStageY] = useState(0);
    const [isPanning, setIsPanning] = useState(false);
    const [spacePressed, setSpacePressed] = useState(false);

    // Pan/zoom event handlers
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') setSpacePressed(true);
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') setSpacePressed(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    const handleWheel = (e: any) => {
      e.evt.preventDefault();
      const scaleBy = 1.08;
      const oldScale = stageScale;
      const pointer = stageRef.current.getPointerPosition();
      const mousePointTo = {
        x: (pointer.x - stageX) / oldScale,
        y: (pointer.y - stageY) / oldScale,
      };
      let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      newScale = Math.max(0.2, Math.min(4, newScale));
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      setStageScale(newScale);
      setStageX(newPos.x);
      setStageY(newPos.y);
    };

    const handleStageMouseDownPan = (e: any) => {
      if (spacePressed) {
        setIsPanning(true);
        document.body.style.cursor = 'grab';
      } else {
        handleStageMouseDown(e);
      }
    };
    const handleStageMouseMovePan = () => {
      if (isPanning) {
        const stage = stageRef.current.getStage();
        const pointer = stage.getPointerPosition();
        if (!stage._lastPanPointer) {
          stage._lastPanPointer = pointer;
        } else {
          const dx = pointer.x - stage._lastPanPointer.x;
          const dy = pointer.y - stage._lastPanPointer.y;
          setStageX(x => x + dx);
          setStageY(y => y + dy);
          stage._lastPanPointer = pointer;
        }
      } else {
        handleStageMouseMove();
      }
    };
    const handleStageMouseUpPan = () => {
      if (isPanning) {
        setIsPanning(false);
        document.body.style.cursor = '';
        if (stageRef.current.getStage()._lastPanPointer) {
          delete stageRef.current.getStage()._lastPanPointer;
        }
      } else {
        handleStageMouseUp();
      }
    };

    const handleResetView = () => {
      setStageScale(1);
      setStageX(0);
      setStageY(0);
    };

    const handleCanvasResize = (widthPercent: number, heightPercent: number, mode: 'expand' | 'contract') => {
      let newWidth = canvasWidth;
      let newHeight = canvasHeight;
      if (mode === 'expand') {
        newWidth = Math.round(canvasWidth * (1 + widthPercent / 100));
        newHeight = Math.round(canvasHeight * (1 + heightPercent / 100));
      } else {
        newWidth = Math.round(canvasWidth * (1 - widthPercent / 100));
        newHeight = Math.round(canvasHeight * (1 - heightPercent / 100));
      }
      // Clamp to sensible min/max
      newWidth = Math.max(400, Math.min(4000, newWidth));
      newHeight = Math.max(400, Math.min(4000, newHeight));
      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
    };

    // Drawing handlers
    const handleStageMouseDown = (e: any) => {
      const stage = stageRef.current.getStage();
      const pointer = stage.getPointerPosition();
      if (state.selectedTool === 'connect') {
        // Find clicked territory
        const clickedTerritory = Object.entries(state.territories).find(([, t]) => {
          let bounds = null;
          if (t.shape.type === 'polygon' || t.shape.type === 'freehand') {
            bounds = getPolygonBounds(t.shape.points);
          } else if (t.shape.type === 'rect' || t.shape.type === 'ellipse') {
            bounds = t.shape;
          }
          if (bounds) {
            return (
              pointer.x >= bounds.x &&
              pointer.x <= bounds.x + bounds.width &&
              pointer.y >= bounds.y &&
              pointer.y <= bounds.y + bounds.height
            );
          }
          return false;
        });
        if (clickedTerritory) {
          const [id] = clickedTerritory;
          handleConnectToolClick(id);
        } else {
          setConnectionStart(null);
          setConnectionPreview(null);
        }
      } else if (state.selectedTool === 'polygon') {
        if (!drawing) {
          setDrawing(true);
          setNewShape({ type: 'polygon', points: [pointer.x, pointer.y] });
        } else {
          setNewShape((prev: any) => ({ ...prev, points: [...prev.points, pointer.x, pointer.y] }));
        }
      } else if (state.selectedTool === 'rect' || state.selectedTool === 'ellipse') {
        setDrawing(true);
        setNewShape({
          type: state.selectedTool,
          x: pointer.x,
          y: pointer.y,
          width: 0,
          height: 0,
        });
      } else if (state.selectedTool === 'draw') {
        setDrawing(true);
        setNewShape({
          type: 'freehand',
          points: [pointer.x, pointer.y],
        });
      } else if (state.selectedTool === 'select') {
        // Marquee selection: start rectangle
        if (e.target === e.target.getStage()) {
          setSelectedId(null);
          setInputPos(null);
          setSelectionStart({ x: pointer.x, y: pointer.y });
          setSelectionRect({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
        }
      }
    };

    const handleStageMouseMove = () => {
      if (!drawing && !selectionStart) return;
      const stage = stageRef.current.getStage();
      const pointer = stage.getPointerPosition();
      if (state.selectedTool === 'connect' && connectionStart) {
        setConnectionPreview(pointer);
      } else if (drawing && newShape) {
        if (newShape.type === 'polygon') {
          setNewShape((prev: any) => ({ ...prev, preview: [pointer.x, pointer.y] }));
        } else if (newShape.type === 'rect' || newShape.type === 'ellipse') {
          setNewShape((prev: any) => ({
            ...prev,
            width: pointer.x - prev.x,
            height: pointer.y - prev.y,
          }));
        } else if (newShape.type === 'freehand') {
          setNewShape((prev: any) => ({
            ...prev,
            points: [...prev.points, pointer.x, pointer.y],
          }));
        }
      } else if (selectionStart) {
        // Update selection rectangle
        setSelectionRect({
          x: Math.min(selectionStart.x, pointer.x),
          y: Math.min(selectionStart.y, pointer.y),
          width: Math.abs(pointer.x - selectionStart.x),
          height: Math.abs(pointer.y - selectionStart.y),
        });
      }
    };

    const handleStageDblClick = () => {
      if (state.selectedTool === 'polygon' && drawing && newShape && newShape.points.length >= 6) {
        const points = newShape.points;
        const bounds = getPolygonBounds(points);
        const name = `Territory ${Object.keys(state.territories).length + 1}`;
        dispatch({
          type: 'ADD_TERRITORY',
          payload: {
            name,
            shape: {
              type: 'polygon',
              points,
              bounds,
            },
            continentId: null,
            position: { x: bounds.x, y: bounds.y },
            connections: [],
          },
        });
        setDrawing(false);
        setNewShape(null);
      }
    };

    const handleStageMouseUp = () => {
      if (state.selectedTool === 'connect') {
        if (!connectionStart) {
          setConnectionPreview(null);
        }
      } else if (drawing && newShape) {
        if (newShape.type === 'rect' || newShape.type === 'ellipse') {
          const bounds = {
            x: Math.min(newShape.x, newShape.x + newShape.width),
            y: Math.min(newShape.y, newShape.y + newShape.height),
            width: Math.abs(newShape.width),
            height: Math.abs(newShape.height),
          };
          const name = `Territory ${Object.keys(state.territories).length + 1}`;
          dispatch({
            type: 'ADD_TERRITORY',
            payload: {
              name,
              shape: {
                type: newShape.type,
                ...bounds,
              },
              continentId: null,
              position: { x: bounds.x, y: bounds.y },
              connections: [],
            },
          });
          setDrawing(false);
          setNewShape(null);
        } else if (newShape.type === 'freehand') {
          // Close the freehand shape and fill it
          let points = newShape.points;
          if (points.length >= 4) {
            points = [...points, points[0], points[1]]; // Close the shape
          }
          const bounds = getPolygonBounds(points);
          const name = `Territory ${Object.keys(state.territories).length + 1}`;
          dispatch({
            type: 'ADD_TERRITORY',
            payload: {
              name,
              shape: {
                type: 'freehand',
                points,
                bounds,
                closed: true,
              },
              continentId: null,
              position: { x: bounds.x, y: bounds.y },
              connections: [],
            },
          });
          setDrawing(false);
          setNewShape(null);
        }
      } else if (selectionRect && selectionStart) {
        // Marquee selection: select all shapes intersecting the rectangle
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
      }
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

    // Utility: get polygon/freehand bounds
    function getPolygonBounds(points: number[]) {
      const xs = points.filter((_, i) => i % 2 === 0);
      const ys = points.filter((_, i) => i % 2 === 1);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    // Utility: rectangle intersection
    function rectsIntersect(a: any, b: any) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    // Utility: get center point of a territory
    function getTerritoryCenter(territory: any) {
      if (territory.shape.type === 'polygon' || territory.shape.type === 'freehand') {
        return getPolygonCentroid(territory.shape.points);
      } else if (territory.shape.type === 'rect' || territory.shape.type === 'ellipse') {
        return {
          x: territory.shape.x + territory.shape.width / 2,
          y: territory.shape.y + territory.shape.height / 2
        };
      }
      return { x: 0, y: 0 };
    }

    // --- Connect tool logic ---
    const handleConnectToolClick = (territoryId: string) => {
      if (!connectionStart) {
        setConnectionStart(territoryId);
      } else if (connectionStart !== territoryId) {
        dispatch({ type: 'ADD_CONNECTION', payload: { from: connectionStart, to: territoryId } });
        setConnectionStart(null);
        setConnectionPreview(null);
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

    useImperativeHandle(ref, () => ({
      exportPNG: (filename: string) => {
        console.log('exportPNG called', stageRef.current);
        if (stageRef.current) {
          const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
          const a = document.createElement('a');
          a.href = uri;
          a.download = filename || 'risk-map.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    }));

    // Add this utility function near the other utilities:
    function getPolygonCentroid(points: number[]) {
      let x = 0, y = 0, area = 0;
      const n = points.length / 2;
      for (let i = 0; i < n; i++) {
        const x0 = points[2 * i];
        const y0 = points[2 * i + 1];
        const x1 = points[2 * ((i + 1) % n)];
        const y1 = points[2 * ((i + 1) % n) + 1];
        const a = x0 * y1 - x1 * y0;
        area += a;
        x += (x0 + x1) * a;
        y += (y0 + y1) * a;
      }
      area = area / 2;
      if (area === 0) return { x: points[0], y: points[1] };
      x = x / (6 * area);
      y = y / (6 * area);
      return { x, y };
    }

    return (
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
            onMouseDown={handleStageMouseDownPan}
            onMouseMove={handleStageMouseMovePan}
            onMouseUp={handleStageMouseUpPan}
            onDblClick={handleStageDblClick}
            style={{ background: '#f0f0f0', border: '1px solid #ccc', cursor: spacePressed ? 'grab' : undefined }}
          >
            <Layer>
              {/* Background image layer */}
              {bgImage && (
                <KonvaImage
                  image={bgImage}
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  listening={false}
                  opacity={0.7}
                />
              )}
              {/* --- Connection lines --- */}
              {state.viewSettings.showConnections && Object.entries(state.territories).map(([id, t]) => {
                const center = getTerritoryCenter(t);
                return t.connections.map(connectedId => {
                  const connectedTerritory = state.territories[connectedId];
                  if (!connectedTerritory) return null;
                  const connectedCenter = getTerritoryCenter(connectedTerritory);
                  // Only draw each connection once
                  if (id > connectedId) return null;
                  const isHighlighted = highlightedConnection &&
                    ((highlightedConnection.from === id && highlightedConnection.to === connectedId) ||
                     (highlightedConnection.from === connectedId && highlightedConnection.to === id));
                  return (
                    <Line
                      key={`${id}-${connectedId}`}
                      points={[center.x, center.y, connectedCenter.x, connectedCenter.y]}
                      stroke={isHighlighted ? '#1976d2' : '#666'}
                      strokeWidth={isHighlighted ? 5 : 2}
                      dash={isHighlighted ? undefined : [5, 5]}
                      lineCap="round"
                      onClick={() => {
                        if (state.selectedTool === 'connect') {
                          dispatch({ type: 'REMOVE_CONNECTION', payload: { from: id, to: connectedId } });
                        }
                      }}
                    />
                  );
                });
              })}
              {/* --- Connection preview line --- */}
              {state.selectedTool === 'connect' && connectionStart && connectionPreview && (
                <Line
                  points={[
                    getTerritoryCenter(state.territories[connectionStart]).x,
                    getTerritoryCenter(state.territories[connectionStart]).y,
                    connectionPreview.x,
                    connectionPreview.y
                  ]}
                  stroke="#666"
                  strokeWidth={2}
                  dash={[5, 5]}
                  lineCap="round"
                />
              )}
              {/* --- Highlight connection start territory --- */}
              {state.selectedTool === 'connect' && connectionStart && (
                <Circle
                  x={getTerritoryCenter(state.territories[connectionStart]).x}
                  y={getTerritoryCenter(state.territories[connectionStart]).y}
                  radius={10}
                  fill="#666"
                  opacity={0.3}
                />
              )}
              {/* Existing territories */}
              {Object.entries(state.territories).map(([id, t]) => {
                const continent = t.continentId ? state.continents[t.continentId] : null;
                const fillColor = continent ? `${continent.color}33` : 'rgba(0,0,0,0.1)';
                const strokeColor = continent ? continent.color : '#000';
                
                if (t.shape.type === 'polygon') {
                  const centroid = getPolygonCentroid(t.shape.points);
                  return (
                    <Group
                      key={id}
                      id={`shape-${id}`}
                      onClick={() => state.selectedTool === 'select' && handleShapeClick(id, t.shape)}
                      draggable={state.selectedTool === 'select'}
                    >
                      <Line
                        points={t.shape.points}
                        closed
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={2}
                      />
                      <Text
                        text={t.name}
                        x={centroid.x}
                        y={centroid.y}
                        offsetX={40}
                        offsetY={10}
                        fontSize={16}
                        fill={'#222'}
                      />
                      {continent && (
                        <Text
                          text={`+${continent.bonusValue}`}
                          x={centroid.x}
                          y={centroid.y}
                          offsetX={40}
                          offsetY={-10}
                          fontSize={14}
                          fill={continent.color}
                          fontStyle="italic"
                        />
                      )}
                    </Group>
                  );
                } else if (t.shape.type === 'rect') {
                  const center = { x: t.shape.x + t.shape.width / 2, y: t.shape.y + t.shape.height / 2 };
                  return (
                    <Group
                      key={id}
                      id={`shape-${id}`}
                      onClick={() => state.selectedTool === 'select' && handleShapeClick(id, t.shape)}
                      draggable={state.selectedTool === 'select'}
                    >
                      <Rect
                        x={t.shape.x}
                        y={t.shape.y}
                        width={t.shape.width}
                        height={t.shape.height}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={2}
                      />
                      <Text
                        text={t.name}
                        x={center.x}
                        y={center.y}
                        offsetX={40}
                        offsetY={10}
                        fontSize={16}
                        fill={'#222'}
                      />
                      {continent && (
                        <Text
                          text={`+${continent.bonusValue}`}
                          x={center.x}
                          y={center.y}
                          offsetX={40}
                          offsetY={-10}
                          fontSize={14}
                          fill={continent.color}
                          fontStyle="italic"
                        />
                      )}
                    </Group>
                  );
                } else if (t.shape.type === 'ellipse') {
                  const center = { x: t.shape.x + t.shape.width / 2, y: t.shape.y + t.shape.height / 2 };
                  return (
                    <Group
                      key={id}
                      id={`shape-${id}`}
                      onClick={() => state.selectedTool === 'select' && handleShapeClick(id, t.shape)}
                      draggable={state.selectedTool === 'select'}
                    >
                      <Ellipse
                        x={t.shape.x + t.shape.width / 2}
                        y={t.shape.y + t.shape.height / 2}
                        radiusX={Math.abs(t.shape.width) / 2}
                        radiusY={Math.abs(t.shape.height) / 2}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={2}
                      />
                      <Text
                        text={t.name}
                        x={center.x}
                        y={center.y}
                        offsetX={40}
                        offsetY={10}
                        fontSize={16}
                        fill={'#222'}
                      />
                      {continent && (
                        <Text
                          text={`+${continent.bonusValue}`}
                          x={center.x}
                          y={center.y}
                          offsetX={40}
                          offsetY={-10}
                          fontSize={14}
                          fill={continent.color}
                          fontStyle="italic"
                        />
                      )}
                    </Group>
                  );
                } else if (t.shape.type === 'freehand') {
                  const centroid = getPolygonCentroid(t.shape.points);
                  return (
                    <Group
                      key={id}
                      id={`shape-${id}`}
                      onClick={() => state.selectedTool === 'select' && handleShapeClick(id, t.shape)}
                      draggable={state.selectedTool === 'select'}
                    >
                      <Line
                        points={t.shape.points}
                        closed={!!t.shape.closed}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={2}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.5}
                      />
                      <Text
                        text={t.name}
                        x={centroid.x}
                        y={centroid.y}
                        offsetX={40}
                        offsetY={10}
                        fontSize={16}
                        fill={'#222'}
                      />
                      {continent && (
                        <Text
                          text={`+${continent.bonusValue}`}
                          x={centroid.x}
                          y={centroid.y}
                          offsetX={40}
                          offsetY={-10}
                          fontSize={14}
                          fill={continent.color}
                          fontStyle="italic"
                        />
                      )}
                    </Group>
                  );
                }
                return null;
              })}
              {/* Drawing preview */}
              {drawing && newShape && newShape.type === 'polygon' && (
                <Line
                  points={
                    newShape.preview
                      ? [...newShape.points, ...newShape.preview]
                      : newShape.points
                  }
                  closed={false}
                  stroke={'#888'}
                  strokeWidth={2}
                  dash={[10, 5]}
                />
              )}
              {drawing && newShape && newShape.type === 'rect' && (
                <Rect
                  x={newShape.x}
                  y={newShape.y}
                  width={newShape.width}
                  height={newShape.height}
                  fill={'rgba(0,0,0,0.05)'}
                  stroke={'#888'}
                  strokeWidth={2}
                  dash={[10, 5]}
                />
              )}
              {drawing && newShape && newShape.type === 'ellipse' && (
                <Ellipse
                  x={newShape.x + newShape.width / 2}
                  y={newShape.y + newShape.height / 2}
                  radiusX={Math.abs(newShape.width) / 2}
                  radiusY={Math.abs(newShape.height) / 2}
                  fill={'rgba(0,0,0,0.05)'}
                  stroke={'#888'}
                  strokeWidth={2}
                  dash={[10, 5]}
                />
              )}
              {drawing && newShape && newShape.type === 'freehand' && (
                <Line
                  points={newShape.points}
                  closed={false}
                  stroke={'#888'}
                  strokeWidth={2}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.5}
                  dash={[10, 5]}
                />
              )}
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
              {/* Transformer for selection */}
              {state.selectedTool === 'select' && selectedIds.length > 0 && (
                <Transformer ref={transformerRef} />
              )}
            </Layer>
          </Stage>
          {inputPos && (
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                left: inputPos.x,
                top: inputPos.y,
                transform: 'translate(-50%, -100%)',
                zIndex: 10,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <TextField
                size="small"
                value={inputValue}
                onChange={handleNameChange}
                autoFocus
                sx={{ minWidth: 120 }}
              />
              <IconButton color="error" onClick={handleDelete} size="small">
                <DeleteIcon />
              </IconButton>
            </Paper>
          )}
          {/* UI overlay for zoom level and reset button */}
          <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1, p: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 14 }}>Zoom: {(stageScale * 100).toFixed(0)}%</span>
            <IconButton size="small" onClick={handleResetView} title="Reset View">
              <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 2v2a6 6 0 1 1-6 6H2a8 8 0 1 0 8-8z" fill="#1976d2"/></svg>
            </IconButton>
          </Box>
        </Box>
        <MainTools onCanvasResize={handleCanvasResize} />
      </Box>
    );
  }
);

export { MapCanvas }; 