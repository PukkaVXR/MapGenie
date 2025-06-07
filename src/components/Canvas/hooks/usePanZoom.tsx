import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

interface UsePanZoomOptions {
  stageRef: RefObject<any>;
}

export const usePanZoom = ({ stageRef }: UsePanZoomOptions) => {
  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);

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

  const startPanning = () => {
    setIsPanning(true);
    document.body.style.cursor = 'grab';
  };

  const updatePanning = () => {
    if (!isPanning || !stageRef.current) return;
    
    const stage = stageRef.current.getStage();
    const pointer = stage.getPointerPosition();
    if (!stage._lastPanPointer) {
      stage._lastPanPointer = pointer;
    } else {
      const dx = pointer.x - stage._lastPanPointer.x;
      const dy = pointer.y - stage._lastPanPointer.y;
      setStageX((x: number) => x + dx);
      setStageY((y: number) => y + dy);
      stage._lastPanPointer = pointer;
    }
  };

  const endPanning = () => {
    setIsPanning(false);
    document.body.style.cursor = '';
    if (stageRef.current?.getStage()?._lastPanPointer) {
      delete stageRef.current.getStage()._lastPanPointer;
    }
  };

  const handleResetView = () => {
    setStageScale(1);
    setStageX(0);
    setStageY(0);
  };

  return {
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
  };
};