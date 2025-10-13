import { Menu, Bell, User, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleToggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Success',
      description: 'Logged out successfully',
    });
    navigate('/login');
  };

  const handleNotificationClick = () => {
    // TODO: Implement notification functionality
    toast({
      title: 'Notifications',
      description: 'No new notifications',
    });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-20 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-between px-8 shadow-lg sticky top-0 z-50"
    >
      <motion.div 
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            className="hover:bg-blue-700 text-white transition-all duration-300"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden"
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={1} />
                </linearGradient>
              </defs>
              <circle cx="20" cy="20" r="20" fill="url(#gradient)" />
              <text x="20" y="25" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold">MIMS</text>
            </svg>
          </motion.div>
          <div className="text-white">
            <motion.h1 
              className="text-xl font-bold"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Material Inward Management System
            </motion.h1>
            <motion.p 
              className="text-sm text-gray-300"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Asset & Revenue Tracking Platform
            </motion.p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="flex items-center gap-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div className="flex items-center gap-4 text-white">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg hover:bg-slate-600 transition-all duration-300 font-medium"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg hover:bg-slate-600 transition-all duration-300 font-medium"
            onClick={() => navigate('/login')}
          >
            Login
          </motion.button>
          {/* Removed Dashboard button as per user request */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg hover:bg-slate-600 transition-all duration-300 font-medium"
            onClick={() => navigate('/add-material')}
          >
            Add New Material
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg hover:bg-slate-600 transition-all duration-300 font-medium"
            onClick={() => navigate('/reports')}
          >
            Reports
          </motion.button>
          {/* Removed Receipts button as per user request */}
        </motion.div>
      </motion.div>
    </motion.nav>
  );
}