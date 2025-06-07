import React from 'react';
import { Group, Arrow, Line } from 'react-konva';
import bezier from 'adaptive-bezier-curve';
import type { ZombieArrow as ZombieArrowType } from '../types';
import { getArrowSizes, getCubicControlPoints } from '../utils/zombieUtils';

interface ZombieArrowProps {
  arrow: ZombieArrowType;
  isZombieMode: boolean;
  zombieTool: string;
  onDragEnd: (e: any) => void;
  onClick: (arrow: ZombieArrowType) => void;
}

export const ZombieArrow: React.FC<ZombieArrowProps> = ({
  arrow,
  isZombieMode,
  zombieTool,
  onDragEnd,
  onClick,
}) => {
  // Calculate the base vector and apply length, rotation, and curvature
  const dx = arrow.x2 - arrow.x1;
  const dy = arrow.y2 - arrow.y1;
  const baseLen = Math.sqrt(dx * dx + dy * dy) || 1;
  const angle = Math.atan2(dy, dx);
  
  // Apply rotation
  const rot = (arrow.rotation || 0) * Math.PI / 180;
  const len = arrow.length || baseLen;
  
  // Start and end points relative to mid
  const halfLen = len / 2;
  const cosA = Math.cos(angle + rot);
  const sinA = Math.sin(angle + rot);
  const mx = arrow.midX;
  const my = arrow.midY;
  const x1 = mx - halfLen * cosA;
  const y1 = my - halfLen * sinA;
  const x2 = mx + halfLen * cosA;
  const y2 = my + halfLen * sinA;
  
  // Calculate arrowhead size based on thickness
  const { pointerLength, pointerWidth, outlineStrokeWidth } = getArrowSizes(arrow.strokeWidth || 2);

  const handleDragEnd = (e: any) => {
    const dx = e.target.x();
    const dy = e.target.y();
    onDragEnd({
      ...e,
      arrow,
      dx,
      dy,
    });
    e.target.x(0);
    e.target.y(0);
  };

  const handleClick = () => onClick(arrow);

  const handleMouseEnter = (e: any) => {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = 'pointer';
  };

  const handleMouseLeave = (e: any) => {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = 'default';
  };

  if (arrow.bidirectional) {
    if (arrow.curvature) {
      // Single curved shaft from start to end
      const [c1, c2] = getCubicControlPoints(x1, y1, x2, y2, arrow.curvature) as [[number, number], [number, number]];
      const points = bezier([x1, y1], c1, c2, [x2, y2], 1);
      const flatPoints = points.flat();
      
      // Arrowhead angles
      const n = points.length;
      const [xA1, yA1] = points[n - 2];
      const [xB1, yB1] = points[n - 1];
      const angle1 = Math.atan2(yB1 - yA1, xB1 - xA1) * 180 / Math.PI;
      const [xA2, yA2] = points[1];
      const [xB2, yB2] = points[0];
      const angle2 = Math.atan2(yB2 - yA2, xB2 - xA2) * 180 / Math.PI;
      
      return (
        <Group
          draggable={isZombieMode && zombieTool === 'select'}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          listening={true}
        >
          {/* OUTLINE: Curved shaft (single) */}
          <Line
            points={flatPoints}
            stroke="#000"
            strokeWidth={outlineStrokeWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
          {/* Colored curved shaft (single) */}
          <Line
            points={flatPoints}
            stroke={arrow.color}
            strokeWidth={arrow.strokeWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
          {/* Arrowheads at both ends */}
          <Arrow
            x={xB1}
            y={yB1}
            points={[0, 0, pointerLength, 0]}
            rotation={angle1}
            stroke="#000"
            fill="#000"
            strokeWidth={outlineStrokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={false}
          />
          <Arrow
            x={xB1}
            y={yB1}
            points={[0, 0, pointerLength, 0]}
            rotation={angle1}
            stroke={arrow.color}
            fill={arrow.color}
            strokeWidth={arrow.strokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={false}
          />
          <Arrow
            x={xB2}
            y={yB2}
            points={[0, 0, pointerLength, 0]}
            rotation={angle2}
            stroke="#000"
            fill="#000"
            strokeWidth={outlineStrokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={false}
          />
          <Arrow
            x={xB2}
            y={yB2}
            points={[0, 0, pointerLength, 0]}
            rotation={angle2}
            stroke={arrow.color}
            fill={arrow.color}
            strokeWidth={arrow.strokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={false}
          />
        </Group>
      );
    } else {
      // Straight bidirectional: two straight arrows
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      return (
        <Group
          draggable={isZombieMode && zombieTool === 'select'}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          listening={true}
        >
          {/* Outline arrows */}
          <Arrow
            x={mx}
            y={my}
            points={[x1 - mx, y1 - my, x2 - mx, y2 - my]}
            stroke="#000"
            fill="#000"
            strokeWidth={outlineStrokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
          <Arrow
            x={mx}
            y={my}
            points={[x2 - mx, y2 - my, x1 - mx, y1 - my]}
            stroke="#000"
            fill="#000"
            strokeWidth={outlineStrokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
          {/* Colored arrows */}
          <Arrow
            x={mx}
            y={my}
            points={[x1 - mx, y1 - my, x2 - mx, y2 - my]}
            stroke={arrow.color}
            fill={arrow.color}
            strokeWidth={arrow.strokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
          <Arrow
            x={mx}
            y={my}
            points={[x2 - mx, y2 - my, x1 - mx, y1 - my]}
            stroke={arrow.color}
            fill={arrow.color}
            strokeWidth={arrow.strokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
        </Group>
      );
    }
  } else {
    // Non-bidirectional (one-way) arrow
    if (arrow.curvature) {
      // Curved one-way arrow
      const [c1, c2] = getCubicControlPoints(x1, y1, x2, y2, arrow.curvature) as [[number, number], [number, number]];
      const points = bezier([x1, y1], c1, c2, [x2, y2], 1);
      const flatPoints = points.flat();
      
      // Arrowhead angle at the end
      const n = points.length;
      const [xA, yA] = points[n - 2];
      const [xB, yB] = points[n - 1];
      const angle = Math.atan2(yB - yA, xB - xA) * 180 / Math.PI;
      
      return (
        <Group
          draggable={isZombieMode && zombieTool === 'select'}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          listening={true}
        >
          {/* Outline curved shaft */}
          <Line
            points={flatPoints}
            stroke="#000"
            strokeWidth={outlineStrokeWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
          {/* Colored curved shaft */}
          <Line
            points={flatPoints}
            stroke={arrow.color}
            strokeWidth={arrow.strokeWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
          {/* Arrowhead at end */}
          <Arrow
            x={xB}
            y={yB}
            points={[0, 0, pointerLength, 0]}
            rotation={angle}
            stroke="#000"
            fill="#000"
            strokeWidth={outlineStrokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={false}
          />
          <Arrow
            x={xB}
            y={yB}
            points={[0, 0, pointerLength, 0]}
            rotation={angle}
            stroke={arrow.color}
            fill={arrow.color}
            strokeWidth={arrow.strokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={false}
          />
        </Group>
      );
    } else {
      // Straight one-way arrow
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      return (
        <Group
          draggable={isZombieMode && zombieTool === 'select'}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          listening={true}
        >
          {/* Outline arrow */}
          <Arrow
            x={mx}
            y={my}
            points={[x1 - mx, y1 - my, x2 - mx, y2 - my]}
            stroke="#000"
            fill="#000"
            strokeWidth={outlineStrokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
          {/* Colored arrow */}
          <Arrow
            x={mx}
            y={my}
            points={[x1 - mx, y1 - my, x2 - mx, y2 - my]}
            stroke={arrow.color}
            fill={arrow.color}
            strokeWidth={arrow.strokeWidth}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
            listening={true}
          />
        </Group>
      );
    }
  }
};