import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  TrendingUp,
  FileText,
  Plus,
  ArrowRight,
  Calculator,
  DollarSign,
  BarChart3,
  Users,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAssetFlow } from '@/context/AssetFlowContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05 },
};

const Index = () => {
  const navigate = useNavigate();
  const { state } = useAssetFlow();

  const stats = [
    {
      title: 'Total Materials',
      value: state.assets.length,
      icon: Package,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Capital Items',
      value: state.assets.filter(asset => asset.type === 'capital').length,
      icon: Building2,
      colorClass: 'text-success',
      bgClass: 'bg-success/10',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Revenue Items',
      value: state.assets.filter(asset => asset.type === 'revenue').length,
      icon: TrendingUp,
      colorClass: 'text-info',
      bgClass: 'bg-info/10',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Departments',
      value: state.departments.length,
      icon: Users,
      colorClass: 'text-muted-foreground',
      bgClass: 'bg-muted/10',
      change: '+3%',
      changeType: 'positive'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Material',
      description: 'Create material inward records',
      icon: Plus,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/5',
      hoverClass: 'hover:bg-primary/10',
      onClick: () => navigate('/capital')
    },
    {
      title: 'Add Revenue Item',
      description: 'Record revenue-generating materials',
      icon: DollarSign,
      colorClass: 'text-success',
      bgClass: 'bg-success/5',
      hoverClass: 'hover:bg-success/10',
      onClick: () => navigate('/revenue')
    },
    {
      title: 'Generate Reports',
      description: 'View detailed material reports',
      icon: BarChart3,
      colorClass: 'text-info',
      bgClass: 'bg-info/5',
      hoverClass: 'hover:bg-info/10',
      onClick: () => navigate('/reports')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Material Inward Management System
            </h1>
            <p className="text-xl text-gray-600">
              Track and manage your material assets efficiently
            </p>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="hover-lift"
            >
              <Card className="p-6 bg-white shadow-lg border-0 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <motion.p 
                      className="text-sm font-medium text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      {stat.title}
                    </motion.p>
                    <motion.p 
                      className="text-3xl font-bold text-foreground"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      {stat.value}
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <Badge 
                        variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                        className="mt-2"
                      >
                        {stat.change}
                      </Badge>
                    </motion.div>
                  </div>
                  <motion.div
                    className={`p-3 rounded-lg ${stat.bgClass}`}
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.colorClass}`} />
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <motion.h2 
            className="text-2xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            Quick Actions
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="hover-lift"
              >
                <Card
                  className={`p-6 ${action.bgClass} ${action.hoverClass} cursor-pointer transition-all duration-300 border-0 shadow-lg rounded-lg`}
                  onClick={action.onClick}
                >
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      className={`p-3 rounded-lg bg-white/50`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <action.icon className={`w-6 h-6 ${action.colorClass}`} />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                    >
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                  <motion.h3 
                    className="text-lg font-semibold text-foreground mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 + index * 0.1 }}
                  >
                    {action.title}
                  </motion.h3>
                  <motion.p 
                    className="text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                  >
                    {action.description}
                  </motion.p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0 }}
          className="mt-8"
        >
          <motion.h2 
            className="text-2xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 }}
          >
            Recent Activity
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            whileHover={{ scale: 1.01 }}
            className="hover-lift"
          >
            <Card className="p-6 bg-white shadow-lg border-0 rounded-lg">
              <div className="text-center py-8">
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                </motion.div>
                <motion.h3 
                  className="text-lg font-semibold text-foreground mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  No recent activity
                </motion.h3>
                <motion.p 
                  className="text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  Start by adding your first asset to see activity here
                </motion.p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
