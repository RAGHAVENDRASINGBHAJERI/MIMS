import { Menu, Bell, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { motion } from 'framer-motion';

export function Navbar() {
  const { dispatch } = useAssetFlow();

  const handleToggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-card"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleSidebar}
          className="hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AF</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">AssetFlow</h1>
            <p className="text-xs text-muted-foreground">Asset & Revenue Tracking</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search assets..."
            className="w-64 pl-10 bg-background"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full"></span>
        </Button>
        
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </motion.nav>
  );
}