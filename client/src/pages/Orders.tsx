import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Eye,
  LayoutGrid,
  LayoutList,
  Calendar,
  Package,
  Loader2,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Layout } from '@/components/layout/Layout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, updateOrderStatus, deleteOrder, updateOrder, fetchHarvestLocations } from '@/store/slices';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { IOrder, OrderStatus } from '@/types';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
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

export default function Orders() {
  const dispatch = useAppDispatch();
  const { items: orders, loading, error } = useAppSelector((state) => state.orders);
  const { items: harvestLocations } = useAppSelector((state) => state.harvestLocations);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    harvestLocation: '',
    deliveryDate: '',
    notes: ''
  });

  useEffect(() => {
    dispatch(fetchOrders({}));
    dispatch(fetchHarvestLocations());
  }, [dispatch]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
      toast.success(`Order status updated to ${newStatus}`);

      // Update the selected order if it's the same
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    try {
      await dispatch(deleteOrder(orderId)).unwrap();
      toast.success('Order deleted successfully');
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error(err || 'Failed to delete order');
    }
  };

  const startEditing = (order: IOrder) => {
    setEditForm({
      harvestLocation: order.harvestLocation || '',
      deliveryDate: new Date(order.deliveryDate).toISOString().split('T')[0],
      notes: order.notes || ''
    });
    setIsEditing(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    try {
      await dispatch(updateOrder({
        id: selectedOrder._id,
        order: editForm
      })).unwrap();
      toast.success('Order updated successfully');
      setIsEditing(false);
      // Local state update for the modal
      setSelectedOrder(prev => prev ? {
        ...prev,
        ...editForm,
        deliveryDate: new Date(editForm.deliveryDate).toISOString()
      } : null);
    } catch (err: any) {
      toast.error(err || 'Failed to update order');
    }
  };

  const handleRefresh = () => {
    dispatch(fetchOrders({}));
  };

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-4">
              Orders
            </h1>
            <p className="text-muted-foreground">
              Manage and track all customer orders.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order # or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {loading && orders.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {!loading && orders.length > 0 && (
          <motion.div variants={itemVariants}>
            {viewMode === 'table' ? (
              <Card className="border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-4 font-semibold text-sm">Order #</th>
                        <th className="text-left p-4 font-semibold text-sm">Customer</th>
                        <th className="text-left p-4 font-semibold text-sm hidden md:table-cell">Delivery</th>
                        <th className="text-left p-4 font-semibold text-sm hidden md:table-cell">Source</th>
                        <th className="text-left p-4 font-semibold text-sm">Status</th>
                        <th className="text-right p-4 font-semibold text-sm">Total</th>
                        <th className="text-right p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredOrders.map((order, index) => (
                          <motion.tr
                            key={order._id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="p-4">
                              <span className="font-mono font-semibold text-primary">
                                #{order.orderNumber}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-medium">{order.customerName}</span>
                            </td>
                            <td className="p-4 hidden md:table-cell text-muted-foreground">
                              {formatDate(order.deliveryDate)}
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <Badge variant="secondary" className="text-xs">
                                {order.orderSource === 'customer-portal' ? 'Portal' : 'Internal'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className={statusColors[order.status]}>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-right font-semibold">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {filteredOrders.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No orders found matching your criteria.
                  </div>
                )}
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.map((order, index) => (
                    <motion.div
                      key={order._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card
                        className="border-border/50 cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="font-mono font-semibold text-primary">
                                #{order.orderNumber}
                              </span>
                              <p className="font-medium text-foreground">
                                {order.customerName}
                              </p>
                            </div>
                            <Badge variant="outline" className={statusColors[order.status]}>
                              {order.status}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(order.deliveryDate)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              {order.items.length} items
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total</span>
                            <span className="text-lg font-bold text-foreground">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && !error && (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              No orders yet. Create your first order!
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center pr-8">
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-primary">
                  #{selectedOrder?.orderNumber}
                </span>
                {selectedOrder && (
                  <Badge variant="outline" className={statusColors[selectedOrder.status]}>
                    {selectedOrder.status}
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => startEditing(selectedOrder!)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteOrder(selectedOrder!._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <h4 className="font-semibold mb-1">Customer</h4>
                <p className="text-muted-foreground">{selectedOrder.customerName}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Delivery Date</h4>
                <p className="text-muted-foreground">{formatDate(selectedOrder.deliveryDate)}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Source</h4>
                <Badge variant="secondary">
                  {selectedOrder.orderSource === 'customer-portal' ? 'Customer Portal' : 'Internal'}
                </Badge>
              </div>

              {selectedOrder.harvestLocation && (
                <div>
                  <h4 className="font-semibold mb-1">Harvest Location</h4>
                  <p className="text-muted-foreground">{selectedOrder.harvestLocation}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold mb-1">Notes</h4>
                  <p className="text-muted-foreground text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>

                {/* Status Update Buttons */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Update Status</h4>
                  <div className="flex gap-2 flex-wrap">
                    {/* Uncancel logic */}
                    {selectedOrder.status === 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                        onClick={() => handleStatusChange(selectedOrder._id, 'pending')}
                      >
                        Un-cancel
                      </Button>
                    )}

                    {/* Pending transitions */}
                    {selectedOrder.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        onClick={() => handleStatusChange(selectedOrder._id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    )}

                    {/* Confirm/Deliver logic */}
                    {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                      >
                        Mark Delivered
                      </Button>
                    )}

                    {/* Undo logic */}
                    {selectedOrder.status === 'delivered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(selectedOrder._id, 'confirmed')}
                      >
                        Undo Delivery
                      </Button>
                    )}

                    {/* Cancel logic */}
                    {selectedOrder.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleStatusChange(selectedOrder._id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Order #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="harvestLocation" className="text-sm font-medium">Harvest Location</label>
              <Select
                value={editForm.harvestLocation}
                onValueChange={(val) => setEditForm(prev => ({ ...prev, harvestLocation: val }))}
              >
                <SelectTrigger id="harvestLocation">
                  <SelectValue placeholder="Select harvest location..." />
                </SelectTrigger>
                <SelectContent>
                  {harvestLocations.filter(loc => loc.active).map(location => (
                    <SelectItem key={location._id} value={location.code}>
                      {location.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="deliveryDate" className="text-sm font-medium">Delivery Date</label>
              <Input
                id="deliveryDate"
                type="date"
                value={editForm.deliveryDate}
                onChange={(e) => setEditForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="notes" className="text-sm font-medium">Notes</label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add special instructions..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrder}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
