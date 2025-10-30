import { Menu, Bell, User, Search, LogOut, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05 },
};

export function Navbar() {
  const { dispatch } = useAssetFlow();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Success',
      description: 'Logged out successfully',
    });
    navigate('/');
  };

  const handleNotificationClick = () => {
    // TODO: Implement notification functionality
    toast({
      title: 'Notifications',
      description: 'No new notifications',
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-14 sm:h-16 lg:h-20 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-lg sticky top-0 z-50"
      >
      <motion.div
        className="flex items-center gap-2 sm:gap-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Desktop Sidebar Toggle */}
        <motion.div
          className="hidden lg:block"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            className="hover:bg-blue-700 text-white transition-all duration-300"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </motion.div>

        <motion.div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => navigate('/')}
        >
          <motion.div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden"
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={1} />
                </linearGradient>
              </defs>
              <circle cx="20" cy="20" r="20" fill="url(#gradient)" />
              <text x="20" y="25" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">MIMS</text>
            </svg>
          </motion.div>
          <div className="text-white hidden sm:block">
            <motion.h1
              className="text-sm md:text-base lg:text-lg xl:text-xl font-bold leading-tight"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="hidden md:inline">Material Inward Management System</span>
              <span className="md:hidden">MIMS</span>
            </motion.h1>
            <motion.p
              className="text-xs lg:text-sm text-gray-300 hidden lg:block"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Capital & Revenue Tracking Platform
            </motion.p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="flex items-center gap-2 sm:gap-4 lg:gap-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {isAuthenticated ? (
          <>
            {/* Desktop Navigation */}
            <motion.div className="hidden lg:flex items-center gap-4 text-white">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-2 rounded-lg hover:bg-slate-600 transition-all duration-300 font-medium text-sm"
                onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard')}
              >
                Dashboard
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-2 rounded-lg hover:bg-slate-600 transition-all duration-300 font-medium text-sm"
                onClick={() => navigate('/add-material')}
              >
                Add Material
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-2 rounded-lg hover:bg-slate-600 transition-all duration-300 font-medium text-sm"
                onClick={() => navigate('/reports')}
              >
                Reports
              </motion.button>
            </motion.div>
            
            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback className="text-xs sm:text-sm">{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile-setup')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Mobile Menu Button */}
            <motion.div
              className="lg:hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="hover:bg-blue-700 text-white transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </>
        ) : (
          <motion.div className="flex items-center gap-2 sm:gap-4 text-white">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-600 transition-all duration-300 font-medium text-sm sm:text-base"
              onClick={() => navigate('/login')}
            >
              Login
            </motion.button>
          </motion.div>
        )}
      </motion.div>
      </motion.nav>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && isAuthenticated && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={closeMobileMenu}
            />
            
            {/* Mobile Menu */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed top-14 sm:top-16 left-0 right-0 bg-slate-800 shadow-xl z-50 border-t border-slate-600 max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="px-4 py-4 space-y-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-4 text-white hover:bg-slate-700 rounded-lg transition-all duration-300 font-medium text-base flex items-center gap-3"
                  onClick={() => handleNavigation(user?.role === 'admin' ? '/admin' : '/dashboard')}
                >
                  <span>📊</span> Dashboard
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-4 text-white hover:bg-slate-700 rounded-lg transition-all duration-300 font-medium text-base flex items-center gap-3"
                  onClick={() => handleNavigation('/add-material')}
                >
                  <span>➕</span> Add Material
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-4 text-white hover:bg-slate-700 rounded-lg transition-all duration-300 font-medium text-base flex items-center gap-3"
                  onClick={() => handleNavigation('/reports')}
                >
                  <span>📈</span> Reports
                </motion.button>
                {user?.role === 'admin' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left px-4 py-4 text-white hover:bg-slate-700 rounded-lg transition-all duration-300 font-medium text-base flex items-center gap-3"
                    onClick={() => handleNavigation('/admin')}
                  >
                    <span>⚙️</span> Admin
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
