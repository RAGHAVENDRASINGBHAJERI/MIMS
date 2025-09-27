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
  Banknote
} from 'lucide-react';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Asset Management',
    icon: Building2,
    items: [
      { title: 'Capital Assets', href: '/capital', icon: DollarSign },
      { title: 'Revenue Assets', href: '/revenue', icon: TrendingUp },
    ],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileBarChart,
  },
];

export function Sidebar() {
  const { state, dispatch } = useAssetFlow();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['Asset Management']);

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: -280, opacity: 0 },
  };

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
            className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-70 bg-sidebar border-r border-sidebar-border z-50 md:relative md:top-0 md:h-screen md:z-0"
          >
            <div className="flex flex-col h-full p-4 space-y-2">
              {navigationItems.map((item) => (
                <div key={item.title}>
                  {item.href ? (
                    <NavLink to={item.href}>
                      {({ isActive: navIsActive }) => (
                        <Button
                          variant={navIsActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 h-10",
                            navIsActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Button>
                      )}
                    </NavLink>
                  ) : (
                    <div>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSection(item.title)}
                        className="w-full justify-between gap-3 h-10 text-sidebar-foreground hover:bg-sidebar-accent"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedSections.includes(item.title) && "rotate-180"
                          )}
                        />
                      </Button>
                      
                      <AnimatePresence>
                        {expandedSections.includes(item.title) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 mt-2 space-y-1">
                              {item.items?.map((subItem) => (
                                <NavLink key={subItem.href} to={subItem.href}>
                                  {({ isActive: navIsActive }) => (
                                    <Button
                                      variant={navIsActive ? "secondary" : "ghost"}
                                      size="sm"
                                      className={cn(
                                        "w-full justify-start gap-3",
                                        navIsActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                                      )}
                                    >
                                      <subItem.icon className="h-4 w-4" />
                                      {subItem.title}
                                    </Button>
                                  )}
                                </NavLink>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Statistics section */}
              <div className="mt-8 pt-4 border-t border-sidebar-border">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-sidebar-accent">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-sidebar-foreground">Total Assets</span>
                      <Banknote className="h-4 w-4 text-sidebar-primary" />
                    </div>
                    <p className="text-lg font-semibold text-sidebar-accent-foreground">
                      {state.assets.length}
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