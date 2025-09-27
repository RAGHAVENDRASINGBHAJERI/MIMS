import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Department } from '@/services/departmentService';
import { Category } from '@/services/categoryService';
import { Asset } from '@/services/assetService';

// Types
interface AssetFlowState {
  departments: Department[];
  categories: Category[];
  assets: Asset[];
  loading: boolean;
  error: string | null;
  sidebarOpen: boolean;
}

type AssetFlowAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_ASSETS'; payload: Asset[] }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean };

// Initial state
const initialState: AssetFlowState = {
  departments: [],
  categories: [],
  assets: [],
  loading: false,
  error: null,
  sidebarOpen: true,
};

// Reducer
function assetFlowReducer(state: AssetFlowState, action: AssetFlowAction): AssetFlowState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_ASSETS':
      return { ...state, assets: action.payload };
    case 'ADD_ASSET':
      return { ...state, assets: [action.payload, ...state.assets] };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    default:
      return state;
  }
}

// Context
const AssetFlowContext = createContext<{
  state: AssetFlowState;
  dispatch: React.Dispatch<AssetFlowAction>;
} | null>(null);

// Provider component
export function AssetFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(assetFlowReducer, initialState);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false });
      } else {
        dispatch({ type: 'SET_SIDEBAR_OPEN', payload: true });
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AssetFlowContext.Provider value={{ state, dispatch }}>
      {children}
    </AssetFlowContext.Provider>
  );
}

// Custom hook
export function useAssetFlow() {
  const context = useContext(AssetFlowContext);
  if (!context) {
    throw new Error('useAssetFlow must be used within an AssetFlowProvider');
  }
  return context;
}