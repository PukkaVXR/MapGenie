// Utility to get pointer position in canvas coordinates
export function getCanvasPointer(stage: any) {
  const pointer = stage.getPointerPosition();
  const scale = stage.scaleX();
  return {
    x: (pointer.x - stage.x()) / scale,
    y: (pointer.y - stage.y()) / scale,
  };
}