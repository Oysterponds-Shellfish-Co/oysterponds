import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  ShoppingCart,
  Check,
  Calendar,
  User,
  Package,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomers, fetchCustomerPricing, fetchHarvestLocations } from '@/store/slices';
import { fetchProducts } from '@/store/slices';
import { createOrder } from '@/store/slices';
import { formatCurrency, getNextThursday } from '@/utils/helpers';
import { toast } from 'sonner';

interface OrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

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

export default function NewOrder() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { items: customers, customerPricing, loading: customersLoading, pricingLoading } = useAppSelector((state) => state.customers);
  const { items: products, loading: productsLoading } = useAppSelector((state) => state.products);
  const { items: harvestLocations } = useAppSelector((state) => state.harvestLocations);
  const { loading: orderLoading, error: orderError } = useAppSelector((state) => state.orders);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedHarvestLocation, setSelectedHarvestLocation] = useState<string>('');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [deliveryDate, setDeliveryDate] = useState(
    getNextThursday().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
    dispatch(fetchHarvestLocations());
  }, [dispatch]);

  // Initialize order lines when products load
  useEffect(() => {
    if (products.length > 0 && orderLines.length === 0) {
      setOrderLines(products.map(p => ({
        productId: p._id,
        productName: p.name,
        quantity: 0,
        unitPrice: p.basePrice
      })));
    }
  }, [products, orderLines.length]);

  // Update prices when customer pricing loads
  useEffect(() => {
    if (customerPricing.length > 0) {
      setOrderLines(prev => prev.map(line => {
        const pricing = customerPricing.find(cp => cp.productId === line.productId);
        return {
          ...line,
          unitPrice: pricing?.price ?? line.unitPrice
        };
      }));
    }
  }, [customerPricing]);

  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);

  // Handle customer change
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    dispatch(fetchCustomerPricing(customerId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setOrderLines(prev => prev.map(line => {
      if (line.productId === productId) {
        const newQuantity = Math.max(0, line.quantity + delta);
        return { ...line, quantity: newQuantity };
      }
      return line;
    }));
  };

  const setQuantity = (productId: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    setOrderLines(prev => prev.map(line =>
      line.productId === productId ? { ...line, quantity } : line
    ));
  };

  const setUnitPrice = (productId: string, value: string) => {
    const price = parseFloat(value) || 0;
    setOrderLines(prev => prev.map(line =>
      line.productId === productId ? { ...line, unitPrice: price } : line
    ));
  };

  const activeLines = useMemo(() =>
    orderLines.filter(line => line.quantity > 0),
    [orderLines]
  );

  const orderTotal = useMemo(() =>
    activeLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0),
    [activeLines]
  );

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    if (activeLines.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setIsSubmitting(true);

    const orderData = {
      customer: selectedCustomerId,
      harvestLocation: selectedHarvestLocation,
      items: activeLines.map(line => ({
        product: line.productId,
        quantity: line.quantity,
        pricePerUnit: line.unitPrice
      })),
      deliveryDate,
      notes
    };

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();
      setOrderSuccess(true);
      toast.success(`Order #${result?.orderNumber} created successfully!`);

      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (err) {
      toast.error(orderError || 'Failed to create order');
      setIsSubmitting(false);
    }
  };

  const isLoading = customersLoading || productsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-4">
            New Order
          </h1>
          <p className="text-muted-foreground">
            Create a new order for a customer.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <AnimatePresence>
                    {selectedCustomer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 rounded-lg bg-muted/50"
                      >
                        <p className="text-sm font-medium">{selectedCustomer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.billingAddress.street}, {selectedCustomer.billingAddress.city}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.phone}
                        </p>
                        {pricingLoading && (
                          <p className="text-sm text-primary mt-2 flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Loading custom pricing...
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Products */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {orderLines.map((line, index) => {
                      const product = products.find(p => p._id === line.productId);
                      const quantity = line.quantity;
                      const price = line.unitPrice;
                      const lineTotal = quantity * price;
                      const hasQuantity = quantity > 0;
                      const basePrice = product?.basePrice ?? 0.80;
                      const hasCustomPrice = price !== basePrice;
                      const isAdjustment = line.productName === 'Adjustment';

                      return (
                        <motion.div
                          key={line.productId}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 rounded-lg border transition-all duration-200 ${hasQuantity
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border/50 hover:border-primary/30'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {line.productName}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {isAdjustment ? 'credit / discount' : `per ${product?.unit || 'oyster'}`}
                              </p>
                            </div>
                            {!isAdjustment && (
                              <div className="text-right">
                                <p className="font-semibold text-primary">
                                  {formatCurrency(price)}
                                </p>
                                {selectedCustomer && hasCustomPrice && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    {formatCurrency(basePrice)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {isAdjustment ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant={hasQuantity ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    if (hasQuantity) {
                                      setQuantity(line.productId, '0');
                                      setUnitPrice(line.productId, '0');
                                    } else {
                                      setQuantity(line.productId, '1');
                                    }
                                  }}
                                >
                                  {hasQuantity ? 'Remove Adjustment' : 'Add Adjustment'}
                                </Button>
                              </div>
                              {hasQuantity && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Label className="text-sm whitespace-nowrap">Amount ($):</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={price || ''}
                                    onChange={(e) => setUnitPrice(line.productId, e.target.value)}
                                    className="h-8 w-32"
                                    placeholder="-50.00"
                                  />
                                  <p className="text-xs text-muted-foreground">Use negative for credits</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(line.productId, -10)}
                                disabled={quantity === 0}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(line.productId, e.target.value)}
                                className="h-8 w-20 text-center"
                                min="0"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(line.productId, 10)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          )}

                          <AnimatePresence>
                            {hasQuantity && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 pt-2 border-t border-border/50"
                              >
                                <p className="text-sm font-medium text-foreground">
                                  Line Total: {formatCurrency(lineTotal)}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Delivery & Notes */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Delivery Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="deliveryDate">Delivery Date (Thursday)</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Orders must be placed by Tuesday for Thursday delivery
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="harvestLocation">Harvest Location</Label>
                    <Select value={selectedHarvestLocation} onValueChange={setSelectedHarvestLocation}>
                      <SelectTrigger className="mt-1">
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
                  <div>
                    <Label htmlFor="notes">Order Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special instructions..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeLines.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No products added yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {activeLines.map(line => (
                          <motion.div
                            key={line.productId}
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-muted-foreground">
                              {line.productName} × {line.quantity}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(line.quantity * line.unitPrice)}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <motion.span
                        key={orderTotal}
                        initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                        animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                        className="text-2xl font-bold"
                      >
                        {formatCurrency(orderTotal)}
                      </motion.span>
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={isSubmitting || orderSuccess || orderLoading}
                    >
                      <AnimatePresence mode="wait">
                        {orderSuccess ? (
                          <motion.span
                            key="success"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Order Created!
                          </motion.span>
                        ) : isSubmitting || orderLoading ? (
                          <motion.span
                            key="submitting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                          </motion.span>
                        ) : (
                          <motion.span
                            key="submit"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Create Order
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}
