export interface ZombieNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface ZombieArrow {
  id: string;
  from: number;
  to: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
  bidirectional: boolean;
  offsetIndex: number;
  rotation: number;
  length: number;
  midX: number;
  midY: number;
  curvature: number;
}

export interface DrawingShape {
  type: 'polygon' | 'rect' | 'ellipse' | 'freehand';
  points?: number[];
  preview?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  bounds?: any;
  closed?: boolean;
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnappedEdge {
  edge: { x1: number; y1: number; x2: number; y2: number };
  point: { x: number; y: number };
  distance: number;
}

export interface ConnectionStartPoint {
  territoryId: string;
  point: { x: number; y: number };
}