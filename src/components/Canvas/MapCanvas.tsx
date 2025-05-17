import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Rect, Ellipse, Line, Text, Group, Transformer, Circle, Image as KonvaImage } from 'react-konva';
import { useMap } from '../../context/MapContext';
import { Box, TextField, Paper, IconButton, Slider, Typography, Stack, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { MainTools } from '../Toolbar/MainTools';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '@mui/material/styles';

const CANVAS_INITIAL_WIDTH = 1200;
const CANVAS_INITIAL_HEIGHT = 800;

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

const MapCanvas = forwardRef<any, { backgroundImage?: string | null }>(
  ({ backgroundImage }, ref) => {
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

    // Freehand connection drawing state
    const [freehandDrawing, setFreehandDrawing] = useState(false);
    const [freehandPoints, setFreehandPoints] = useState<number[]>([]);
    const [freehandStart, setFreehandStart] = useState<string | null>(null);

    // Clear connection preview if tool changes or connection is completed
    useEffect(() => {
      if (state.selectedTool !== 'connect') {
        setConnectionStart(null);
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

    const theme = useTheme();

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

    // Utility to get pointer position in canvas coordinates
    function getCanvasPointer(stage: any) {
      const pointer = stage.getPointerPosition();
      const scale = stage.scaleX();
      return {
        x: (pointer.x - stage.x()) / scale,
        y: (pointer.y - stage.y()) / scale,
      };
    }

    // Drawing handlers
    const handleStageMouseDown = (e: any) => {
      const stage = stageRef.current.getStage();
      const pointer = getCanvasPointer(stage);
      
      if (state.selectedTool === 'connected') {
        if (!drawing) {
          setDrawing(true);
          const point = snappedEdge ? snappedEdge.point : pointer;
          setNewShape({ type: 'polygon', points: [point.x, point.y] });
        } else {
          const point = snappedEdge ? snappedEdge.point : pointer;
          setNewShape((prev: any) => ({ ...prev, points: [...prev.points, point.x, point.y] }));
        }
        return;
      }
      
      if (state.selectedTool === 'connect' && state.connectionMode === 'freehand') {
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
          setFreehandStart(id);
          setFreehandPoints([pointer.x, pointer.y]);
          setFreehandDrawing(true);
        }
        return;
      } else if (state.selectedTool === 'connect' && state.connectionMode === 'straight') {
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
          const [id, t] = clickedTerritory;
          // Calculate relative point
          let relX = pointer.x, relY = pointer.y;
          if (t.shape.type === 'polygon' || t.shape.type === 'freehand') {
            const bounds = getPolygonBounds(t.shape.points);
            relX = pointer.x - bounds.x;
            relY = pointer.y - bounds.y;
          } else if (t.shape.type === 'rect' || t.shape.type === 'ellipse') {
            relX = pointer.x - t.shape.x;
            relY = pointer.y - t.shape.y;
          }
          if (!connectionStartPoint) {
            setConnectionStartPoint({ territoryId: id, point: { x: relX, y: relY } });
          } else if (connectionStartPoint.territoryId !== id) {
            // Second click: create connection
            const from = connectionStartPoint.territoryId;
            const to = id;
            const fromPoint = connectionStartPoint.point;
            const toPoint = { x: relX, y: relY };
            dispatch({
              type: 'ADD_CONNECTION',
              payload: { from, to, fromPoint, toPoint }
            });
            setConnectionStartPoint(null);
          }
        } else {
          setConnectionStartPoint(null);
        }
        return;
      } else if (state.selectedTool === 'polygon') {
        if (!drawing) {
          setDrawing(true);
          setNewShape({ type: 'polygon', points: [pointer.x, pointer.y] });
        } else {
          setNewShape((prev: any) => ({ ...prev, points: [...prev.points, pointer.x, pointer.y] }));
        }
      } else if (state.selectedTool === 'rect') {
        if (!drawing) {
          setDrawing(true);
          setNewShape({ type: 'rect', x: pointer.x, y: pointer.y, width: 0, height: 0 });
        }
      } else if (state.selectedTool === 'ellipse') {
        if (!drawing) {
          setDrawing(true);
          setNewShape({ type: 'ellipse', x: pointer.x, y: pointer.y, width: 0, height: 0 });
        }
      } else if (state.selectedTool === 'draw') {
        if (!drawing) {
          setDrawing(true);
          setNewShape({ type: 'freehand', points: [pointer.x, pointer.y] });
        } else {
          setNewShape((prev: any) => ({ ...prev, points: [...prev.points, pointer.x, pointer.y] }));
        }
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
      if (state.selectedTool === 'connect' && state.connectionMode === 'freehand' && freehandDrawing) {
        const stage = stageRef.current.getStage();
        const pointer = getCanvasPointer(stage);
        setFreehandPoints(prev => [...prev, pointer.x, pointer.y]);
        return;
      }
      if (!drawing && !selectionStart) return;
      const stage = stageRef.current.getStage();
      const pointer = getCanvasPointer(stage);
      
      // Handle connected drawing mode
      if (state.selectedTool === 'connected') {
        const nearestEdge = findNearestEdge(pointer);
        if (nearestEdge) {
          setSnappedEdge(nearestEdge);
        } else {
          setSnappedEdge(null);
        }
      }
      if (state.selectedTool === 'connect' && connectionStart) {
        return;
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
      if ((state.selectedTool === 'polygon' || state.selectedTool === 'connected') && drawing && newShape && newShape.points.length >= 6) {
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
            textSettings: {
              ...state.defaultTextSettings
            }
          },
        });
        setDrawing(false);
        setNewShape(null);
        setSnappedEdge(null);
      }
    };

    const handleStageMouseUp = () => {
      if (state.selectedTool === 'connect' && state.connectionMode === 'freehand' && freehandDrawing) {
        const stage = stageRef.current.getStage();
        const pointer = getCanvasPointer(stage);
        // Find end territory
        const endTerritory = Object.entries(state.territories).find(([, t]) => {
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
        if (endTerritory && freehandStart && endTerritory[0] !== freehandStart && freehandPoints.length > 3) {
          dispatch({
            type: 'ADD_FREEHAND_CONNECTION',
            payload: {
              id: uuidv4(),
              from: freehandStart,
              to: endTerritory[0],
              points: freehandPoints,
            },
          });
        }
        setFreehandDrawing(false);
        setFreehandPoints([]);
        setFreehandStart(null);
        return;
      }
      if (state.selectedTool === 'connect') {
        if (!connectionStart) {
          setConnectionStart(null);
        }
      } else if (drawing && newShape) {
        if (newShape.type === 'rect' || newShape.type === 'ellipse') {
          if (Math.abs(newShape.width) > 5 && Math.abs(newShape.height) > 5) {
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
                textSettings: {
                  ...state.defaultTextSettings
                }
              },
            });
          }
          setDrawing(false);
          setNewShape(null);
        } else if (newShape.type === 'freehand') {
          if (newShape.points.length >= 6) {
            let points = newShape.points;
            if (points.length >= 4) {
              points = [...points, points[0], points[1]];
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
                textSettings: {
                  ...state.defaultTextSettings
                }
              },
            });
          }
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

    // Add these utility functions near the other utility functions
    function getTerritoryEdges(territory: any): { x1: number; y1: number; x2: number; y2: number }[] {
      const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
      
      if (territory.shape.type === 'polygon' || territory.shape.type === 'freehand') {
        const points = territory.shape.points;
        for (let i = 0; i < points.length; i += 2) {
          const x1 = points[i];
          const y1 = points[i + 1];
          const x2 = points[(i + 2) % points.length];
          const y2 = points[(i + 3) % points.length];
          edges.push({ x1, y1, x2, y2 });
        }
      } else if (territory.shape.type === 'rect') {
        const { x, y, width, height } = territory.shape;
        edges.push(
          { x1: x, y1: y, x2: x + width, y2: y }, // top
          { x1: x + width, y1: y, x2: x + width, y2: y + height }, // right
          { x1: x + width, y1: y + height, x2: x, y2: y + height }, // bottom
          { x1: x, y1: y + height, x2: x, y2: y } // left
        );
      } else if (territory.shape.type === 'ellipse') {
        // For ellipses, we'll approximate with a polygon of 32 points
        const { x, y, width, height } = territory.shape;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radiusX = Math.abs(width) / 2;
        const radiusY = Math.abs(height) / 2;
        const points: number[] = [];
        for (let i = 0; i < 32; i++) {
          const angle = (i / 32) * Math.PI * 2;
          points.push(
            centerX + Math.cos(angle) * radiusX,
            centerY + Math.sin(angle) * radiusY
          );
        }
        for (let i = 0; i < points.length; i += 2) {
          const x1 = points[i];
          const y1 = points[i + 1];
          const x2 = points[(i + 2) % points.length];
          const y2 = points[(i + 3) % points.length];
          edges.push({ x1, y1, x2, y2 });
        }
      }
      return edges;
    }

    function findNearestEdge(point: { x: number; y: number }, snapDistance: number = 10) {
      let nearestEdge = null;
      let minDistance = snapDistance;
      for (const territory of Object.values(state.territories)) {
        const edges = getTerritoryEdges(territory);
        for (const edge of edges) {
          const dx = edge.x2 - edge.x1;
          const dy = edge.y2 - edge.y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          if (length === 0) continue;
          const t = Math.max(0, Math.min(1, ((point.x - edge.x1) * dx + (point.y - edge.y1) * dy) / (length * length)));
          const nearestX = edge.x1 + t * dx;
          const nearestY = edge.y1 + t * dy;
          const distance = Math.sqrt(Math.pow(point.x - nearestX, 2) + Math.pow(point.y - nearestY, 2));
          if (distance < minDistance) {
            minDistance = distance;
            nearestEdge = {
              edge,
              point: { x: nearestX, y: nearestY },
              distance
            };
          }
        }
      }
      return nearestEdge;
    }

    // Add these state variables near the other state declarations
    const [snappedEdge, setSnappedEdge] = useState<{ edge: { x1: number; y1: number; x2: number; y2: number }; point: { x: number; y: number }; distance: number } | null>(null);

    // Add state for connection start point
    const [connectionStartPoint, setConnectionStartPoint] = useState<{ territoryId: string, point: { x: number, y: number } } | null>(null);

    const handleDragEnd = (e: any) => {
      if (state.selectedTool === 'select') {
        const territoryId = e.target.id().replace('shape-', '');
        const territory = state.territories[territoryId];
        if (!territory) return;
        const dx = e.target.x();
        const dy = e.target.y();

        // Debug: log freehand connections before move
        console.log('Before move, freehandConnections:', state.freehandConnections);

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
            // Only dispatch ADD (which replaces) and do not dispatch REMOVE
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
              {/* Before rendering freehand connections: */}
              {state.viewSettings.showConnections && state.freehandConnections.map(conn => {
                const points = conn.points;
                return (
                  <Line
                    key={conn.id}
                    points={points}
                    stroke="#1976d2"
                    strokeWidth={3}
                    dash={[10, 10]}
                    lineCap="round"
                    lineJoin="round"
                    opacity={0.8}
                  />
                );
              })}
              {/* --- Connection lines (straight) --- */}
              {state.viewSettings.showConnections && state.connections.map(conn => {
                const fromTerritory = state.territories[conn.from];
                const toTerritory = state.territories[conn.to];
                if (!fromTerritory || !toTerritory) return null;
                if (!conn.fromPoint || !conn.toPoint) return null; // Safety check

                // Convert relative points to absolute/canvas coordinates
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
              {/* --- Connection preview line (freehand) --- */}
              {state.selectedTool === 'connect' && state.connectionMode === 'freehand' && freehandDrawing && freehandPoints.length > 1 && (
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
                const fillColor = (continent && state.viewSettings.showContinentColors) ? `${continent.color}33` : 'rgba(0,0,0,0.1)';
                const strokeColor = (continent && state.viewSettings.showContinentColors) ? continent.color : '#000';
                
                if (t.shape.type === 'polygon') {
                  const centroid = getPolygonCentroid(t.shape.points);
                  return (
                    <Group
                      key={id}
                      id={`shape-${id}`}
                      onClick={() => state.selectedTool === 'select' && handleShapeClick(id, t.shape)}
                      draggable={state.selectedTool === 'select'}
                      onDragEnd={handleDragEnd}
                    >
                      <Line
                        points={t.shape.points}
                        closed
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={2}
                      />
                      {state.viewSettings.showTerritoryNames && (
                        <Text
                          text={t.name}
                          x={centroid.x}
                          y={centroid.y}
                          offsetX={t.textSettings.offsetX}
                          offsetY={t.textSettings.offsetY}
                          fontSize={t.textSettings.fontSize}
                          fontFamily={t.textSettings.fontFamily}
                          fill={'#222'}
                        />
                      )}
                      {continent && state.viewSettings.showContinentColors && (
                        <Text
                          text={`+${continent.bonusValue}`}
                          x={centroid.x}
                          y={centroid.y}
                          offsetX={40}
                          offsetY={-10}
                          fontSize={14}
                          fontFamily={t.textSettings.fontFamily}
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
                      onDragEnd={handleDragEnd}
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
                      {state.viewSettings.showTerritoryNames && (
                        <Text
                          text={t.name}
                          x={center.x}
                          y={center.y}
                          offsetX={t.textSettings.offsetX}
                          offsetY={t.textSettings.offsetY}
                          fontSize={t.textSettings.fontSize}
                          fontFamily={t.textSettings.fontFamily}
                          fill={'#222'}
                        />
                      )}
                      {continent && state.viewSettings.showContinentColors && (
                        <Text
                          text={`+${continent.bonusValue}`}
                          x={center.x}
                          y={center.y}
                          offsetX={40}
                          offsetY={-10}
                          fontSize={14}
                          fontFamily={t.textSettings.fontFamily}
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
                      onDragEnd={handleDragEnd}
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
                      {state.viewSettings.showTerritoryNames && (
                        <Text
                          text={t.name}
                          x={center.x}
                          y={center.y}
                          offsetX={t.textSettings.offsetX}
                          offsetY={t.textSettings.offsetY}
                          fontSize={t.textSettings.fontSize}
                          fontFamily={t.textSettings.fontFamily}
                          fill={'#222'}
                        />
                      )}
                      {continent && state.viewSettings.showContinentColors && (
                        <Text
                          text={`+${continent.bonusValue}`}
                          x={center.x}
                          y={center.y}
                          offsetX={40}
                          offsetY={-10}
                          fontSize={14}
                          fontFamily={t.textSettings.fontFamily}
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
                      onDragEnd={handleDragEnd}
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
                      {state.viewSettings.showTerritoryNames && (
                        <Text
                          text={t.name}
                          x={centroid.x}
                          y={centroid.y}
                          offsetX={t.textSettings.offsetX}
                          offsetY={t.textSettings.offsetY}
                          fontSize={t.textSettings.fontSize}
                          fontFamily={t.textSettings.fontFamily}
                          fill={'#222'}
                        />
                      )}
                      {continent && state.viewSettings.showContinentColors && (
                        <Text
                          text={`+${continent.bonusValue}`}
                          x={centroid.x}
                          y={centroid.y}
                          offsetX={40}
                          offsetY={-10}
                          fontSize={14}
                          fontFamily={t.textSettings.fontFamily}
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
              {/* Snapped edge preview */}
              {state.selectedTool === 'connected' && snappedEdge && (
                <Line
                  points={[snappedEdge.edge.x1, snappedEdge.edge.y1, snappedEdge.edge.x2, snappedEdge.edge.y2]}
                  stroke="#1976d2"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
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
                flexDirection: 'column',
                gap: 1,
                minWidth: 200,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
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
              </Stack>
              {selectedId && (
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">Text Settings</Typography>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="font-family-label">Font</InputLabel>
                    <Select
                      labelId="font-family-label"
                      value={state.territories[selectedId].textSettings.fontFamily}
                      label="Font"
                      onChange={(e) => {
                        dispatch({
                          type: 'UPDATE_TERRITORY',
                          payload: {
                            id: selectedId,
                            updates: {
                              textSettings: {
                                ...state.territories[selectedId].textSettings,
                                fontFamily: e.target.value
                              }
                            }
                          }
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
                      value={state.territories[selectedId].textSettings.offsetX}
                      onChange={(_, value) => {
                        dispatch({
                          type: 'UPDATE_TERRITORY',
                          payload: {
                            id: selectedId,
                            updates: {
                              textSettings: {
                                ...state.territories[selectedId].textSettings,
                                offsetX: value as number
                              }
                            }
                          }
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
                      value={state.territories[selectedId].textSettings.offsetY}
                      onChange={(_, value) => {
                        dispatch({
                          type: 'UPDATE_TERRITORY',
                          payload: {
                            id: selectedId,
                            updates: {
                              textSettings: {
                                ...state.territories[selectedId].textSettings,
                                offsetY: value as number
                              }
                            }
                          }
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
                      value={state.territories[selectedId].textSettings.fontSize}
                      onChange={(_, value) => {
                        dispatch({
                          type: 'UPDATE_TERRITORY',
                          payload: {
                            id: selectedId,
                            updates: {
                              textSettings: {
                                ...state.territories[selectedId].textSettings,
                                fontSize: value as number
                              }
                            }
                          }
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
          )}
          {/* UI overlay for zoom level and reset button */}
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
        </Box>
        <MainTools onCanvasResize={handleCanvasResize} />
      </Box>
    );
  }
);

export { MapCanvas }; 