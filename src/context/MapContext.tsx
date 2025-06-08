import React, { createContext, useContext, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ReactNode } from 'react';

// Types
export interface Territory {
  id: string;
  name: string;
  shape: any; // Will be typed properly when we integrate Fabric.js
  continentId: string | null;
  position: { x: number; y: number };
  connections: string[];
  textSettings: {
    offsetX: number;
    offsetY: number;
    fontSize: number;
    fontFamily: string;
  };
}

export interface Continent {
  id: string;
  name: string;
  bonusValue: number;
  color: string;
  territoryIds: string[];
}

interface FreehandConnection {
  id: string;
  from: string;
  to: string;
  points: number[];
}

export interface Connection {
  from: string;
  to: string;
  fromPoint: { x: number; y: number };
  toPoint: { x: number; y: number };
}

interface MapState {
  territories: Record<string, Territory>;
  continents: Record<string, Continent>;
  selectedTool: 'draw' | 'polygon' | 'connect' | 'select' | 'rect' | 'ellipse' | 'connected';
  selectedTerritory: string | null;
  referenceImage: string | null;
  viewSettings: {
    showTerritoryNames: boolean;
    showContinentColors: boolean;
    showConnections: boolean;
  };
  defaultTextSettings: {
    offsetX: number;
    offsetY: number;
    fontSize: number;
    fontFamily: string;
  };
  connectionMode: 'straight' | 'freehand';
  connections: Connection[];
  freehandConnections: FreehandConnection[];
}

// Initial state
export const initialState: MapState = {
  territories: {},
  continents: {},
  selectedTool: 'select',
  selectedTerritory: null,
  referenceImage: null,
  viewSettings: {
    showTerritoryNames: true,
    showContinentColors: true,
    showConnections: true,
  },
  defaultTextSettings: {
    offsetX: 40,
    offsetY: 10,
    fontSize: 16,
    fontFamily: 'Arial'
  },
  connectionMode: 'straight',
  connections: [],
  freehandConnections: [],
};

// --- Add to types ---
type UndoableMapState = {
  past: MapState[];
  present: MapState;
  future: MapState[];
};

const initialUndoableState: UndoableMapState = {
  past: [],
  present: initialState,
  future: [],
};

// --- Update actions ---
type MapAction =
  | { type: 'SET_SELECTED_TOOL'; payload: 'draw' | 'polygon' | 'rect' | 'ellipse' | 'connect' | 'select' | 'connected' }
  | { type: 'SET_SELECTED_TERRITORY'; payload: string | null }
  | { type: 'ADD_TERRITORY'; payload: Omit<Territory, 'id'> }
  | { type: 'UPDATE_TERRITORY'; payload: { id: string; updates: Partial<Territory> } }
  | { type: 'DELETE_TERRITORY'; payload: string }
  | { type: 'TOGGLE_VIEW_SETTING'; payload: keyof MapState['viewSettings'] }
  | { type: 'SET_DEFAULT_TEXT_SETTING'; payload: { key: keyof MapState['defaultTextSettings']; value: any } }
  | { type: 'ADD_CONTINENT'; payload: Continent }
  | { type: 'UPDATE_CONTINENT'; payload: { id: string; updates: Partial<Continent> } }
  | { type: 'DELETE_CONTINENT'; payload: string }
  | { type: 'ADD_CONNECTION'; payload: { from: string; to: string; fromPoint: { x: number; y: number }; toPoint: { x: number; y: number } } }
  | { type: 'REMOVE_CONNECTION'; payload: { from: string; to: string } }
  | { type: 'REPLACE_STATE'; payload: MapState }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_CONNECTION_MODE'; payload: 'straight' | 'freehand' }
  | { type: 'ADD_FREEHAND_CONNECTION'; payload: FreehandConnection }
  | { type: 'REMOVE_FREEHAND_CONNECTION'; payload: string };

// --- Helper: which actions should be undoable? ---
const isUndoableAction = (action: MapAction) =>
  [
    'ADD_TERRITORY', 'UPDATE_TERRITORY', 'DELETE_TERRITORY',
    'ADD_CONTINENT', 'UPDATE_CONTINENT', 'DELETE_CONTINENT',
    'ADD_CONNECTION', 'REMOVE_CONNECTION', 'REPLACE_STATE'
  ].includes(action.type);

// Reducer
function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_SELECTED_TOOL':
      return { ...state, selectedTool: action.payload };
    
    case 'SET_SELECTED_TERRITORY':
      return { ...state, selectedTerritory: action.payload };
    
    case 'SET_DEFAULT_TEXT_SETTING':
      return {
        ...state,
        defaultTextSettings: {
          ...state.defaultTextSettings,
          [action.payload.key]: action.payload.value
        }
      };
    
    case 'ADD_TERRITORY':
      const newTerritory = { 
        ...action.payload, 
        id: uuidv4(),
        textSettings: {
          ...state.defaultTextSettings,
          ...(action.payload.textSettings || {})
        }
      };
      return {
        ...state,
        territories: { ...state.territories, [newTerritory.id]: newTerritory },
      };
    
    case 'UPDATE_TERRITORY':
      return {
        ...state,
        territories: {
          ...state.territories,
          [action.payload.id]: {
            ...state.territories[action.payload.id],
            ...action.payload.updates,
          },
        },
      };
    
    case 'DELETE_TERRITORY':
      const { [action.payload]: deleted, ...remainingTerritories } = state.territories;
      // Remove connections to/from the deleted territory
      Object.values(remainingTerritories).forEach(territory => {
        if (territory.connections.includes(action.payload)) {
          territory.connections = territory.connections.filter(id => id !== action.payload);
        }
      });
      return {
        ...state,
        territories: remainingTerritories,
        connections: state.connections.filter(
          conn => conn.from !== action.payload && conn.to !== action.payload
        ),
        freehandConnections: state.freehandConnections.filter(
          conn => conn.from !== action.payload && conn.to !== action.payload
        ),
      };
    
    case 'TOGGLE_VIEW_SETTING':
      return {
        ...state,
        viewSettings: {
          ...state.viewSettings,
          [action.payload]: !state.viewSettings[action.payload],
        },
      };
    
    case 'ADD_CONTINENT':
      return {
        ...state,
        continents: { ...state.continents, [action.payload.id]: action.payload },
      };
    
    case 'UPDATE_CONTINENT':
      return {
        ...state,
        continents: {
          ...state.continents,
          [action.payload.id]: {
            ...state.continents[action.payload.id],
            ...action.payload.updates,
          },
        },
      };
    
    case 'DELETE_CONTINENT':
      const { [action.payload]: deletedContinent, ...rest } = state.continents;
      // Update territories that were in the deleted continent
      const updatedTerritories = { ...state.territories };
      Object.values(updatedTerritories).forEach(territory => {
        if (territory.continentId === action.payload) {
          updatedTerritories[territory.id] = {
            ...territory,
            continentId: null
          };
        }
      });
      return {
        ...state,
        continents: rest,
        territories: updatedTerritories
      };
    
    case 'ADD_CONNECTION': {
      const { from, to, fromPoint, toPoint } = action.payload as any;
      // Prevent self-connections and duplicates
      if (from === to) return state;
      if (state.connections.some(conn =>
        (conn.from === from && conn.to === to) ||
        (conn.from === to && conn.to === from)
      )) return state;
      return {
        ...state,
        connections: [
          ...state.connections,
          { from, to, fromPoint, toPoint }
        ]
      };
    }
    case 'REMOVE_CONNECTION': {
      const { from, to } = action.payload;
      return {
        ...state,
        connections: state.connections.filter(conn =>
          !((conn.from === from && conn.to === to) || (conn.from === to && conn.to === from))
        )
      };
    }
    
    case 'REPLACE_STATE':
      return { ...action.payload };
    
    case 'SET_CONNECTION_MODE':
      return { ...state, connectionMode: action.payload };
    
    case 'ADD_FREEHAND_CONNECTION':
      // Replace if exists, else add
      return {
        ...state,
        freehandConnections: [
          ...state.freehandConnections.filter(conn => conn.id !== action.payload.id),
          action.payload
        ]
      };
    case 'REMOVE_FREEHAND_CONNECTION':
      return { ...state, freehandConnections: state.freehandConnections.filter(conn => conn.id !== action.payload) };
    
    default:
      return state;
  }
}

// --- Undoable reducer ---
function undoableMapReducer(state: UndoableMapState, action: MapAction): UndoableMapState {
  switch (action.type) {
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }
    default: {
      if (isUndoableAction(action)) {
        const newPresent = mapReducer(state.present, action);
        if (newPresent === state.present) return state;
        return {
          past: [...state.past, state.present],
          present: newPresent,
          future: [],
        };
      } else {
        // Non-undoable actions (e.g., tool selection)
        return {
          ...state,
          present: mapReducer(state.present, action),
        };
      }
    }
  }
}

// Context
const MapContext = createContext<{
  state: MapState;
  dispatch: React.Dispatch<MapAction>;
  canUndo: boolean;
  canRedo: boolean;
} | null>(null);

// Provider component
export function MapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(undoableMapReducer, initialUndoableState);
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;
  return (
    <MapContext.Provider value={{ state: state.present, dispatch, canUndo, canRedo }}>
      {children}
    </MapContext.Provider>
  );
}

// Custom hook for using the map context
export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
} 