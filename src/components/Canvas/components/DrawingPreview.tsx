import React from 'react';
import { Line, Rect, Ellipse } from 'react-konva';
import type { DrawingShape } from '../types';

interface DrawingPreviewProps {
  drawing: boolean;
  newShape: DrawingShape | null;
}

export const DrawingPreview: React.FC<DrawingPreviewProps> = ({ drawing, newShape }) => {
  if (!drawing || !newShape) return null;

  if (newShape.type === 'polygon' && newShape.points) {
    return (
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
    );
  }

  if (newShape.type === 'rect' && newShape.x !== undefined && newShape.y !== undefined) {
    return (
      <Rect
        x={newShape.x}
        y={newShape.y}
        width={newShape.width || 0}
        height={newShape.height || 0}
        fill={'rgba(0,0,0,0.05)'}
        stroke={'#888'}
        strokeWidth={2}
        dash={[10, 5]}
      />
    );
  }

  if (newShape.type === 'ellipse' && newShape.x !== undefined && newShape.y !== undefined) {
    return (
      <Ellipse
        x={newShape.x + (newShape.width || 0) / 2}
        y={newShape.y + (newShape.height || 0) / 2}
        radiusX={Math.abs(newShape.width || 0) / 2}
        radiusY={Math.abs(newShape.height || 0) / 2}
        fill={'rgba(0,0,0,0.05)'}
        stroke={'#888'}
        strokeWidth={2}
        dash={[10, 5]}
      />
    );
  }

  if (newShape.type === 'freehand' && newShape.points) {
    return (
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
    );
  }

  return null;
};