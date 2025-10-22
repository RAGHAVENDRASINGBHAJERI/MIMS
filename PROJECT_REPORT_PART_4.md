# Material Inward Management System (MIMS)
## Comprehensive Project Report - Part 4 of 8

---

# PART 4: FRONTEND ARCHITECTURE & COMPONENTS

## 1. Frontend Architecture Overview

### 1.1 React Application Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Shadcn/ui)
│   ├── layout/         # Layout components
│   ├── forms/          # Form components
│   └── dialogs/        # Modal dialogs
├── pages/              # Route-based page components
├── context/            # React Context providers
├── services/           # API service layers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

### 1.2 Technology Stack Details
- **React 18.3.1**: Latest React with concurrent features
- **TypeScript 5.8.3**: Strong typing and better developer experience
- **Vite 5.4.19**: Fast build tool and development server
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Shadcn/ui**: High-quality accessible components
- **Framer Motion 12.23.22**: Animation library
- **React Hook Form 7.61.1**: Performant form handling
- **Zod 3.25.76**: Schema validation

## 2. Component Architecture

### 2.1 Base UI Components (Shadcn/ui)
```typescript
// File: frontend/src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 2.2 Layout Components

#### 2.2.1 Responsive Navbar
```typescript
// File: frontend/src/components/layout/Navbar.tsx
import { Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-14 sm:h-16 lg:h-20 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-lg sticky top-0 z-50"
      >
        {/* Logo and Brand */}
        <motion.div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">MIMS</span>
          </div>
          <div className="text-white hidden sm:block">
            <h1 className="text-sm md:text-base lg:text-lg xl:text-xl font-bold leading-tight">
              <span className="hidden md:inline">Material Inward Management System</span>
              <span className="md:hidden">MIMS</span>
            </h1>
            <p className="text-xs lg:text-sm text-gray-300 hidden lg:block">
              Capital & Revenue Tracking Platform
            </p>
          </div>
        </motion.div>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <div className="hidden lg:flex items-center gap-4 text-white">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-slate-600"
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/add-material')}
              className="hover:bg-slate-600"
            >
              Add Material
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/reports')}
              className="hover:bg-slate-600"
            >
              Reports
            </Button>
          </div>
        )}

        {/* Mobile Menu Button */}
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="lg:hidden hover:bg-blue-700 text-white"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed top-14 sm:top-16 left-0 right-0 bg-slate-800 shadow-lg z-40"
          >
            <div className="px-4 py-3 space-y-2">
              <Button
                variant="ghost"
                className="w-full text-left justify-start text-white hover:bg-slate-700"
                onClick={() => handleNavigation('/dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full text-left justify-start text-white hover:bg-slate-700"
                onClick={() => handleNavigation('/add-material')}
              >
                Add Material
              </Button>
              <Button
                variant="ghost"
                className="w-full text-left justify-start text-white hover:bg-slate-700"
                onClick={() => handleNavigation('/reports')}
              >
                Reports
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

#### 2.2.2 Responsive Sidebar
```typescript
// File: frontend/src/components/layout/Sidebar.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Plus, 
  FileText, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useAssetFlow } from '@/context/AssetFlowContext';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Plus, label: 'Add Material', path: '/add-material' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Users, label: 'Admin Panel', path: '/admin', adminOnly: true },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { state, dispatch } = useAssetFlow();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className={`${
        isCollapsed ? 'w-16' : 'w-64 sm:w-70'
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-full`}
    >
      {/* Sidebar Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-800 truncate">
            Navigation
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 sm:h-10 sm:w-10"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 sm:p-3">
        <ul className="space-y-1 sm:space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-10 sm:h-12 ${
                    isCollapsed ? 'px-2' : 'px-3 sm:px-4'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-2 sm:ml-3 truncate text-sm sm:text-base">
                      {item.label}
                    </span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.aside>
  );
}
```

### 2.3 Form Components

#### 2.3.1 Asset Form with Multi-item Support
```typescript
// File: frontend/src/pages/CapitalForm.tsx
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

const itemSchema = z.object({
  particulars: z.string().min(1, 'Particulars is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  cgst: z.number().min(0).max(100, 'CGST must be between 0-100'),
  sgst: z.number().min(0).max(100, 'SGST must be between 0-100'),
});

const assetSchema = z.object({
  department: z.string().min(1, 'Department is required'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  vendorAddress: z.string().min(1, 'Vendor address is required'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  email: z.string().email('Invalid email format'),
  billNo: z.string().min(1, 'Bill number is required'),
  billDate: z.string().min(1, 'Bill date is required'),
  billFile: z.any().refine((file) => file?.length > 0, 'Bill file is required'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  remark: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

export default function CapitalForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { departments } = useAssetFlow();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      items: [{ particulars: '', quantity: 1, rate: 0, cgst: 0, sgst: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  // Calculate totals for each item
  const calculateItemTotal = (index: number) => {
    const item = watchedItems[index];
    if (!item) return { amount: 0, grandTotal: 0 };
    
    const amount = (item.quantity || 0) * (item.rate || 0);
    const tax = amount * ((item.cgst || 0) + (item.sgst || 0)) / 100;
    const grandTotal = amount + tax;
    
    return { amount, grandTotal };
  };

  const onSubmit = async (data: AssetFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Add basic fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'billFile') {
          formData.append('billFile', value[0]);
        } else if (key === 'items') {
          formData.append('items', JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      formData.append('type', 'capital');
      formData.append('category', 'capital');

      await assetService.createAsset(formData);
      
      toast({
        title: 'Success',
        description: 'Capital asset created successfully',
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create asset',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Add Capital Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select {...register('department')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="billDate">Bill Date</Label>
                <Input
                  type="date"
                  {...register('billDate')}
                  className={errors.billDate ? 'border-red-500' : ''}
                />
                {errors.billDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.billDate.message}</p>
                )}
              </div>
            </div>

            {/* Vendor Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vendor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input
                    {...register('vendorName')}
                    className={errors.vendorName ? 'border-red-500' : ''}
                  />
                  {errors.vendorName && (
                    <p className="text-sm text-red-500 mt-1">{errors.vendorName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    {...register('contactNumber')}
                    className={errors.contactNumber ? 'border-red-500' : ''}
                  />
                  {errors.contactNumber && (
                    <p className="text-sm text-red-500 mt-1">{errors.contactNumber.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ particulars: '', quantity: 1, rate: 0, cgst: 0, sgst: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => {
                const { amount, grandTotal } = calculateItemTotal(index);
                
                return (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-3">
                        <Label>Particulars</Label>
                        <Input
                          {...register(`items.${index}.particulars`)}
                          placeholder="Item description"
                        />
                      </div>

                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          min="1"
                        />
                      </div>

                      <div>
                        <Label>Rate (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.rate`, { valueAsNumber: true })}
                          min="0"
                        />
                      </div>

                      <div>
                        <Label>CGST (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.cgst`, { valueAsNumber: true })}
                          min="0"
                          max="100"
                        />
                      </div>

                      <div>
                        <Label>SGST (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.sgst`, { valueAsNumber: true })}
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="flex items-end">
                        <div className="flex-1">
                          <Label>Amount: ₹{amount.toFixed(2)}</Label>
                          <div className="text-sm text-gray-600">
                            Total: ₹{grandTotal.toFixed(2)}
                          </div>
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="billFile">Bill File</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                {...register('billFile')}
                className={errors.billFile ? 'border-red-500' : ''}
              />
              {errors.billFile && (
                <p className="text-sm text-red-500 mt-1">{errors.billFile.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 3. Context Management

### 3.1 Authentication Context
```typescript
// File: frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'chief-administrative-officer' | 'department-officer' | 'user';
  department?: {
    _id: string;
    name: string;
    code: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initializeAuth = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get current user:', error);
          sessionStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      sessionStorage.setItem('token', response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3.2 Asset Flow Context
```typescript
// File: frontend/src/context/AssetFlowContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Asset, assetService } from '@/services/assetService';
import { Department, departmentService } from '@/services/departmentService';

interface AssetFlowState {
  departments: Department[];
  assets: Asset[];
  loading: boolean;
  error: string | null;
  sidebarOpen: boolean;
}

type AssetFlowAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'SET_ASSETS'; payload: Asset[] }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' };

const initialState: AssetFlowState = {
  departments: [],
  assets: [],
  loading: false,
  error: null,
  sidebarOpen: true,
};

function assetFlowReducer(state: AssetFlowState, action: AssetFlowAction): AssetFlowState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };
    case 'SET_ASSETS':
      return { ...state, assets: action.payload };
    case 'ADD_ASSET':
      return { ...state, assets: [action.payload, ...state.assets] };
    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map(asset =>
          asset._id === action.payload._id ? action.payload : asset
        )
      };
    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter(asset => asset._id !== action.payload)
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    default:
      return state;
  }
}

const AssetFlowContext = createContext<{
  state: AssetFlowState;
  dispatch: React.Dispatch<AssetFlowAction>;
} | null>(null);

export function AssetFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(assetFlowReducer, initialState);

  useEffect(() => {
    const fetchInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [departments, assetsResponse] = await Promise.all([
          departmentService.getAllDepartments(),
          assetService.getAssets()
        ]);

        dispatch({ type: 'SET_DEPARTMENTS', payload: departments });
        dispatch({ type: 'SET_ASSETS', payload: assetsResponse.assets });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchInitialData();
  }, []);

  return (
    <AssetFlowContext.Provider value={{ state, dispatch }}>
      {children}
    </AssetFlowContext.Provider>
  );
}

export function useAssetFlow() {
  const context = useContext(AssetFlowContext);
  if (!context) {
    throw new Error('useAssetFlow must be used within an AssetFlowProvider');
  }
  return context;
}
```

### 3.3 Notification Context
```typescript
// File: frontend/src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: 'announcement' | 'activity';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Fetch announcements and activity notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        // Fetch announcements
        const announcementsResponse = await fetch('/api/announcements', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (announcementsResponse.ok) {
          const announcements = await announcementsResponse.json();
          announcements.data.forEach((announcement: any) => {
            addNotification({
              type: 'announcement',
              title: announcement.title,
              message: announcement.message,
              priority: announcement.type === 'urgent' ? 'urgent' : 'medium'
            });
          });
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
```

## 4. Service Layer Architecture

### 4.1 API Service Base
```typescript
// File: frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 4.2 Asset Service
```typescript
// File: frontend/src/services/assetService.ts
export interface Asset {
  _id: string;
  itemName: string;
  quantity: number;
  pricePerItem: number;
  totalAmount: number;
  items?: Array<{
    particulars: string;
    quantity: number;
    rate: number;
    cgst: number;
    sgst: number;
    amount: number;
    grandTotal: number;
  }>;
  vendorName: string;
  vendorAddress: string;
  contactNumber: string;
  email: string;
  billNo: string;
  billDate: string;
  department: {
    _id: string;
    name: string;
    type: string;
  };
  category: string;
  type: 'capital' | 'revenue';
  billFileId: string;
  createdAt: string;
}

export const assetService = {
  getAssets: async (params?: {
    departmentId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE_URL}/assets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  createAsset: async (assetData: FormData) => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers,
      body: assetData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  updateAsset: async (id: string, assetData: FormData) => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'PUT',
      headers,
      body: assetData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  deleteAsset: async (id: string, reason: string, officerName?: string) => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ reason, officerName }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
  },
};
```

---

**End of Part 4**

*Continue to Part 5 for Authentication & Security Implementation*