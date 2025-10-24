import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { formatIndianCurrency } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  FileBarChart, 
  ArrowRight,
  Building2,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { assetService } from '@/services/assetService';
import { departmentService } from '@/services/departmentService';

const features = [
  {
    title: 'Capital Assets',
    description: 'Track and manage capital assets with detailed vendor information',
    icon: DollarSign,
    href: '/capital',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    title: 'Revenue Assets',
    description: 'Monitor revenue-generating assets and their performance',
    icon: TrendingUp,
    href: '/revenue',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  {
    title: 'Reports & Analytics',
    description: 'Generate comprehensive reports with filtering and export options',
    icon: FileBarChart,
    href: '/reports',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
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

export default function Landing() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssetFlow();

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const API_URL = 'https://mims-1.onrender.com';
        const response = await fetch(`${API_URL}/api/public/stats`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setStats([
              { label: 'Total Assets', value: result.data.totalAssets.toString(), icon: Building2 },
              { label: 'Departments', value: result.data.totalDepartments.toString(), icon: Users },
              { label: 'This Month', value: result.data.thisMonthAssets.toString(), icon: Calendar },
              { label: 'Total Value', value: result.data.totalValue, icon: BarChart3 },
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch public stats:', error);
      }
    };

    fetchPublicStats();
  }, []);

  const [stats, setStats] = useState([
    { label: 'Total Assets', value: '150+', icon: Building2 },
    { label: 'Departments', value: '8', icon: Users },
    { label: 'This Month', value: '12', icon: Calendar },
    { label: 'Total Value', value: '₹2.5M', icon: BarChart3 },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            variants={itemVariants}
          >
            Welcome to <span className="bg-gradient-primary bg-clip-text text-transparent">Material Inward Management System</span>
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4"
            variants={itemVariants}
          >
            Comprehensive material inward tracking system for educational institutions
          </motion.p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className="p-4 sm:p-6 bg-gradient-card border shadow-card"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group"
            >
              <Card className="p-6 sm:p-8 h-full bg-gradient-card border shadow-card hover:shadow-elevated transition-all duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 rounded-full ${feature.color} group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => navigate('/login')}
                    className="group-hover:bg-primary-hover transition-colors"
                    size="lg"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-primary rounded-2xl p-6 sm:p-8 text-center"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-sm sm:text-base text-primary-foreground/80 mb-6 max-w-md mx-auto px-4">
            Begin tracking your assets and revenue efficiently with our comprehensive system
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button
              onClick={() => navigate('/login')}
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              Add Capital Asset
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              Add Revenue Asset
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


