import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Department, departmentService } from '@/services/departmentService';
import { Category, categoryService } from '@/services/categoryService';
import { Asset, assetService } from '@/services/assetService';

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
  sidebarOpen: false,
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

  // Fetch departments, categories, and assets on mount
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Only fetch protected data if user is authenticated
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.log('No authentication token found, skipping protected data fetch');
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        // Fetch data in parallel, but handle auth errors gracefully
        const departmentsPromise = departmentService.getAllDepartments().catch(err => {
          console.warn('Failed to fetch departments:', err.message);
          return []; // Return empty array on auth failure
        });

        const categoriesPromise = categoryService.getAllCategories();

        const assetsPromise = assetService.getAssets().catch(err => {
          console.warn('Failed to fetch assets:', err.message);
          return { assets: [] }; // Return empty assets on auth failure
        });

        const [departments, categories, assetsResponse] = await Promise.all([
          departmentsPromise,
          categoriesPromise,
          assetsPromise
        ]);

        console.log('Departments fetched:', departments);
        console.log('Categories fetched:', categories);
        console.log('Assets fetched:', assetsResponse);

        dispatch({ type: 'SET_DEPARTMENTS', payload: departments });
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
        dispatch({ type: 'SET_ASSETS', payload: assetsResponse.assets || [] });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error: any) {
        console.error('Error fetching data:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch data' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchData();
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
