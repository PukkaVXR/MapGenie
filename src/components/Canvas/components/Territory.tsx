import React from 'react';
import { Group, Line, Rect, Ellipse, Text } from 'react-konva';
import { getPolygonCentroid } from '../utils/geometry';

interface TerritoryProps {
  id: string;
  territory: any;
  continent: any;
  viewSettings: any;
  selectedTool: string;
  onClick: (id: string, shape: any) => void;
  onDragEnd: (e: any) => void;
}

export const Territory: React.FC<TerritoryProps> = ({
  id,
  territory,
  continent,
  viewSettings,
  selectedTool,
  onClick,
  onDragEnd,
}) => {
  const fillColor = (continent && viewSettings.showContinentColors) 
    ? `${continent.color}33` 
    : 'rgba(0,0,0,0.1)';
  const strokeColor = (continent && viewSettings.showContinentColors) 
    ? continent.color 
    : '#000';

  const renderShape = () => {
    const shape = territory.shape;
    
    if (shape.type === 'polygon') {
      const centroid = getPolygonCentroid(shape.points);
      return (
        <>
          <Line
            points={shape.points}
            closed
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
          />
          {viewSettings.showTerritoryNames && (
            <Text
              text={territory.name}
              x={centroid.x}
              y={centroid.y}
              offsetX={territory.textSettings.offsetX}
              offsetY={territory.textSettings.offsetY}
              fontSize={territory.textSettings.fontSize}
              fontFamily={territory.textSettings.fontFamily}
              fill={'#222'}
            />
          )}
          {continent && viewSettings.showContinentColors && (
            <Text
              text={`+${continent.bonusValue}`}
              x={centroid.x}
              y={centroid.y}
              offsetX={40}
              offsetY={-10}
              fontSize={14}
              fontFamily={territory.textSettings.fontFamily}
              fill={continent.color}
              fontStyle="italic"
            />
          )}
        </>
      );
    } else if (shape.type === 'rect') {
      const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
      return (
        <>
          <Rect
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
          />
          {viewSettings.showTerritoryNames && (
            <Text
              text={territory.name}
              x={center.x}
              y={center.y}
              offsetX={territory.textSettings.offsetX}
              offsetY={territory.textSettings.offsetY}
              fontSize={territory.textSettings.fontSize}
              fontFamily={territory.textSettings.fontFamily}
              fill={'#222'}
            />
          )}
          {continent && viewSettings.showContinentColors && (
            <Text
              text={`+${continent.bonusValue}`}
              x={center.x}
              y={center.y}
              offsetX={40}
              offsetY={-10}
              fontSize={14}
              fontFamily={territory.textSettings.fontFamily}
              fill={continent.color}
              fontStyle="italic"
            />
          )}
        </>
      );
    } else if (shape.type === 'ellipse') {
      const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
      return (
        <>
          <Ellipse
            x={shape.x + shape.width / 2}
            y={shape.y + shape.height / 2}
            radiusX={Math.abs(shape.width) / 2}
            radiusY={Math.abs(shape.height) / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
          />
          {viewSettings.showTerritoryNames && (
            <Text
              text={territory.name}
              x={center.x}
              y={center.y}
              offsetX={territory.textSettings.offsetX}
              offsetY={territory.textSettings.offsetY}
              fontSize={territory.textSettings.fontSize}
              fontFamily={territory.textSettings.fontFamily}
              fill={'#222'}
            />
          )}
          {continent && viewSettings.showContinentColors && (
            <Text
              text={`+${continent.bonusValue}`}
              x={center.x}
              y={center.y}
              offsetX={40}
              offsetY={-10}
              fontSize={14}
              fontFamily={territory.textSettings.fontFamily}
              fill={continent.color}
              fontStyle="italic"
            />
          )}
        </>
      );
    } else if (shape.type === 'freehand') {
      const centroid = getPolygonCentroid(shape.points);
      return (
        <>
          <Line
            points={shape.points}
            closed={!!shape.closed}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
          />
          {viewSettings.showTerritoryNames && (
            <Text
              text={territory.name}
              x={centroid.x}
              y={centroid.y}
              offsetX={territory.textSettings.offsetX}
              offsetY={territory.textSettings.offsetY}
              fontSize={territory.textSettings.fontSize}
              fontFamily={territory.textSettings.fontFamily}
              fill={'#222'}
            />
          )}
          {continent && viewSettings.showContinentColors && (
            <Text
              text={`+${continent.bonusValue}`}
              x={centroid.x}
              y={centroid.y}
              offsetX={40}
              offsetY={-10}
              fontSize={14}
              fontFamily={territory.textSettings.fontFamily}
              fill={continent.color}
              fontStyle="italic"
            />
          )}
        </>
      );
    }
    return null;
  };

  return (
    <Group
      id={`shape-${id}`}
      onClick={() => selectedTool === 'select' && onClick(id, territory.shape)}
      draggable={selectedTool === 'select'}
      onDragEnd={onDragEnd}
    >
      {renderShape()}
    </Group>
  );
};