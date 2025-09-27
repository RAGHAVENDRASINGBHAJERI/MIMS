import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

const stats = [
  { label: 'Total Assets', value: '1,247', icon: Building2 },
  { label: 'Departments', value: '12', icon: Users },
  { label: 'This Month', value: '89', icon: Calendar },
  { label: 'Total Value', value: '₹2.4M', icon: BarChart3 },
];

export default function Landing() {
  const navigate = useNavigate();
  const { state } = useAssetFlow();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome to <span className="bg-gradient-primary bg-clip-text text-transparent">AssetFlow</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive asset and revenue tracking system for educational institutions
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => (
            <Card key={stat.label} className="p-6 bg-gradient-card border shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group"
            >
              <Card className="p-8 h-full bg-gradient-card border shadow-card hover:shadow-elevated transition-all duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 rounded-full ${feature.color} group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => navigate(feature.href)}
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
          className="bg-gradient-primary rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-primary-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
            Begin tracking your assets and revenue efficiently with our comprehensive system
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/capital')}
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              Add Capital Asset
            </Button>
            <Button
              onClick={() => navigate('/revenue')}
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary"
            >
              Add Revenue Asset
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}