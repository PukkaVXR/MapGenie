import { describe, it, expect } from 'vitest';
import { mapReducer, initialState, MapState, Territory } from './MapContext';

const baseText = initialState.defaultTextSettings;

function makeTerritory(id: string, connections: string[]): Territory {
  return {
    id,
    name: id,
    shape: null as any,
    continentId: null,
    position: { x: 0, y: 0 },
    connections,
    textSettings: baseText,
  };
}

describe('DELETE_TERRITORY reducer', () => {
  it('removes all references to the deleted territory', () => {
    const state: MapState = {
      ...initialState,
      territories: {
        t1: makeTerritory('t1', ['t2']),
        t2: makeTerritory('t2', ['t1']),
      },
      connections: [
        {
          from: 't1',
          to: 't2',
          fromPoint: { x: 0, y: 0 },
          toPoint: { x: 1, y: 1 },
        },
      ],
      freehandConnections: [
        { id: 'f1', from: 't1', to: 't2', points: [0, 0, 1, 1] },
      ],
    };

    const newState = mapReducer(state, { type: 'DELETE_TERRITORY', payload: 't1' });

    expect(newState.connections).toEqual([]);
    expect(newState.freehandConnections).toEqual([]);
    expect(newState.territories.t2.connections).toEqual([]);
    expect(newState.territories).not.toHaveProperty('t1');
  });
});
