import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  TrendingUp,
  Users,
  Calendar,
  ShoppingCart,
  ArrowRight,
  Clock,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, fetchOrderStats } from '@/store/slices';
import { fetchCustomers } from '@/store/slices';
import { formatCurrency, formatDate, getNextThursday, daysUntil } from '@/utils/helpers';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  delivered: 'bg-primary/10 text-primary border-primary/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
};

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { items: orders, stats, loading: ordersLoading, statsLoading } = useAppSelector((state) => state.orders);
  const { items: customers, loading: customersLoading } = useAppSelector((state) => state.customers);

  useEffect(() => {
    dispatch(fetchOrders({ limit: 10 }));
    dispatch(fetchOrderStats());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const nextThursday = getNextThursday();
  const daysUntilThursday = daysUntil(nextThursday);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const recentOrders = orders.slice(0, 4);

  const isLoading = ordersLoading || customersLoading || statsLoading;

  const statsData = [
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders ?? pendingOrders.length,
      icon: ClipboardList,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Weekly Sales',
      value: formatCurrency(stats?.weeklyTotal ?? 0),
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Total Customers',
      value: customers.length,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Next Delivery',
      value: `${daysUntilThursday} days`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-4">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your orders today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statsData.map((stat) => (
            <motion.div
              key={stat.title}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="hover-lift cursor-default border-border/50">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {stat.title}
                      </p>
                      <p className="text-xl md:text-2xl font-bold text-foreground">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild className="gap-2">
                  <Link to="/orders/new">
                    <ShoppingCart className="w-4 h-4" />
                    New Order
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/customers">
                    <Users className="w-4 h-4" />
                    View Customers
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/orders">
                    <ClipboardList className="w-4 h-4" />
                    All Orders
                  </Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders & Thursday Countdown */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="border-border/50 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                <Button asChild variant="ghost" size="sm" className="gap-1">
                  <Link to="/orders">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders yet. Create your first order!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order, index) => (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {order.customerName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={statusColors[order.status]}
                          >
                            {order.status}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Thursday Countdown */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 h-full bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="mb-4"
                >
                  <Clock className="w-12 h-12 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Next Delivery Day
                </h3>
                <p className="text-4xl font-bold text-primary mb-2">
                  {daysUntilThursday}
                </p>
                <p className="text-sm text-muted-foreground">
                  days until Thursday
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(nextThursday.toISOString())}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}
