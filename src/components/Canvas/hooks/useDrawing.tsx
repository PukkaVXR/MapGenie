import React, { useState, useRef } from 'react';
import { useMap } from '../../../context/MapContext';
import { v4 as uuidv4 } from 'uuid';
import type { DrawingShape, SnappedEdge, ConnectionStartPoint } from '../types';
import { getPolygonBounds, findNearestEdge } from '../utils/geometry';
import { getCanvasPointer } from '../utils/canvasUtils';

interface UseDrawingProps {
  stageRef: React.RefObject<any>;
}

export const useDrawing = ({ stageRef }: UseDrawingProps) => {
  const { state, dispatch } = useMap();
  const [drawing, setDrawing] = useState(false);
  const [newShape, setNewShape] = useState<DrawingShape | null>(null);
  const [snappedEdge, setSnappedEdge] = useState<SnappedEdge | null>(null);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [connectionStartPoint, setConnectionStartPoint] = useState<ConnectionStartPoint | null>(null);
  const [freehandDrawing, setFreehandDrawing] = useState(false);
  const [freehandPoints, setFreehandPoints] = useState<number[]>([]);
  const [freehandStart, setFreehandStart] = useState<string | null>(null);

  const handleDrawingMouseDown = (e: any) => {
    if (!stageRef.current) return;
    
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
      // Handle straight connection logic...
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
    }
  };

  const handleDrawingMouseMove = () => {
    if (!stageRef.current) return;
    
    const stage = stageRef.current.getStage();
    const pointer = getCanvasPointer(stage);
    
    // Handle connected drawing mode
    if (state.selectedTool === 'connected') {
      const nearestEdge = findNearestEdge(state.territories, pointer);
      if (nearestEdge) {
        setSnappedEdge(nearestEdge);
      } else {
        setSnappedEdge(null);
      }
    }
    
    if (state.selectedTool === 'connect' && state.connectionMode === 'freehand' && freehandDrawing) {
      setFreehandPoints(prev => [...prev, pointer.x, pointer.y]);
      return;
    }
    
    if (!drawing) return;
    
    if (newShape) {
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
    }
  };

  const handleDrawingMouseUp = () => {
    if (!stageRef.current) return;
    
    const stage = stageRef.current.getStage();
    const pointer = getCanvasPointer(stage);
    
    if (state.selectedTool === 'connect' && state.connectionMode === 'freehand' && freehandDrawing) {
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
    
    if (drawing && newShape) {
      if (newShape.type === 'rect' || newShape.type === 'ellipse') {
        if (Math.abs(newShape.width || 0) > 5 && Math.abs(newShape.height || 0) > 5) {
          const bounds = {
            x: Math.min(newShape.x || 0, (newShape.x || 0) + (newShape.width || 0)),
            y: Math.min(newShape.y || 0, (newShape.y || 0) + (newShape.height || 0)),
            width: Math.abs(newShape.width || 0),
            height: Math.abs(newShape.height || 0),
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
      } else if (newShape.type === 'freehand' && newShape.points) {
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
    }
  };

  const handleDrawingDblClick = () => {
    if ((state.selectedTool === 'polygon' || state.selectedTool === 'connected') && 
        drawing && newShape && newShape.points && newShape.points.length >= 6) {
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

  return {
    drawing,
    newShape,
    snappedEdge,
    connectionStart,
    connectionStartPoint,
    freehandDrawing,
    freehandPoints,
    freehandStart,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    handleDrawingDblClick,
  };
};