import React from 'react';
import { Text } from 'react-konva';
import type { ZombieNumber as ZombieNumberType } from '../types';

interface ZombieNumberProps {
  num: ZombieNumberType;
  zombieTool: string;
  onClick: (num: ZombieNumberType) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export const ZombieNumber: React.FC<ZombieNumberProps> = ({
  num,
  zombieTool,
  onClick,
  onDragEnd,
}) => {
  return (
    <Text
      text={num.value.toString()}
      x={num.x}
      y={num.y}
      fontSize={num.fontSize}
      fontFamily={num.fontFamily}
      fill={num.color}
      draggable={zombieTool === 'select'}
      onClick={() => onClick(num)}
      onDragEnd={e => onDragEnd(num.id, e.target.x(), e.target.y())}
      perfectDrawEnabled={false}
      listening
      style={{ cursor: zombieTool === 'select' ? 'pointer' : 'default' }}
    />
  );
};