import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  DollarSign,
  TrendingUp,
  FileBarChart,
  ChevronDown,
  Building2,
  Banknote,
  Shield
} from 'lucide-react';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Add New Material',
    href: '/add-material',
    icon: DollarSign,
  },
  {
    title: 'Reports & Analytics',
    href: '/reports',
    icon: FileBarChart,
  },
];

export function Sidebar() {
  const { state, dispatch } = useAssetFlow();
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: -280, opacity: 0 },
  };

  // Dynamic navigation items based on user role
  const dynamicNavigationItems = [
    ...navigationItems,
    ...(user?.role === 'admin' ? [{
      title: 'Admin Dashboard',
      href: '/admin',
      icon: Shield,
    }] : []),
  ];

  // Filter navigation items for department-officer: only show Dashboard
  const filteredNavigationItems = user?.role === 'department-officer'
    ? dynamicNavigationItems.filter(item => item.href === '/dashboard')
    : dynamicNavigationItems;

  return (
    <AnimatePresence>
      {state.sidebarOpen && (
        <>
          {/* Mobile overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false })}
          />
          
          {/* Sidebar */}
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-70 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 z-50 md:relative md:top-0 md:h-screen md:z-0"
          >
            <div className="flex flex-col h-full p-4 space-y-2">
              {filteredNavigationItems.map((item) => (
                <NavLink key={item.title} to={item.href}>
                  {({ isActive: navIsActive }) => (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-12 text-left text-white hover:bg-slate-700 transition-all duration-300",
                        navIsActive && "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:from-emerald-600 hover:to-teal-700"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Button>
                  )}
                </NavLink>
              ))}
              
              {/* Statistics section */}
              <div className="mt-8 pt-4 border-t border-slate-600">
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Total Assets</span>
                      <Banknote className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {(state.assets?.assets || []).length}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">Capital Items</span>
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {(state.assets?.assets || []).filter(asset => asset.type === 'capital').length}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">Revenue Items</span>
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {(state.assets?.assets || []).filter(asset => asset.type === 'revenue').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
