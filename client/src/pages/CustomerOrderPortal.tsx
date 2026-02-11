import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shell,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  ArrowRight,
  ArrowLeft,
  Package,
  Loader2,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomerBySlug, fetchCustomerPricing, fetchHarvestLocations } from '@/store/slices';
import { fetchProducts } from '@/store/slices';
import { createPublicOrder } from '@/store/slices';
import { formatCurrency, formatDate, getNextThursday } from '@/utils/helpers';
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

export default function CustomerOrderPortal() {
  const { customerSlug } = useParams<{ customerSlug: string }>();
  const dispatch = useAppDispatch();

  const { selectedCustomer: customer, customerPricing, loading: customerLoading } = useAppSelector((state) => state.customers);
  const { items: products, loading: productsLoading } = useAppSelector((state) => state.products);
  const { items: harvestLocations } = useAppSelector((state) => state.harvestLocations);
  const { loading: orderLoading } = useAppSelector((state) => state.orders);

  const [step, setStep] = useState<'products' | 'review' | 'success'>('products');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [selectedHarvestLocation, setSelectedHarvestLocation] = useState<string>('');

  const nextThursday = getNextThursday();

  // Fetch customer and products
  useEffect(() => {
    if (customerSlug) {
      dispatch(fetchCustomerBySlug(customerSlug));
      dispatch(fetchProducts());
      dispatch(fetchHarvestLocations());
    }
  }, [dispatch, customerSlug]);

  // Fetch customer pricing when customer loads
  useEffect(() => {
    if (customer?._id) {
      dispatch(fetchCustomerPricing(customer._id));
    }
  }, [dispatch, customer?._id]);

  // Initialize order lines when products and pricing load
  useEffect(() => {
    if (products.length > 0 && customerPricing.length > 0) {
      setOrderLines(products.map(p => {
        const pricing = customerPricing.find(cp => cp.productId === p._id);
        return {
          productId: p._id,
          productName: p.name,
          quantity: 0,
          unitPrice: pricing?.price ?? p.basePrice
        };
      }));
    } else if (products.length > 0 && orderLines.length === 0) {
      setOrderLines(products.map(p => ({
        productId: p._id,
        productName: p.name,
        quantity: 0,
        unitPrice: p.basePrice
      })));
    }
  }, [products, customerPricing, orderLines.length]);

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

  const activeLines = useMemo(() =>
    orderLines.filter(line => line.quantity > 0),
    [orderLines]
  );

  const orderTotal = useMemo(() =>
    activeLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0),
    [activeLines]
  );

  const handleSubmit = async () => {
    if (!customerSlug) return;

    const orderData = {
      customerSlug,
      harvestLocation: selectedHarvestLocation,
      items: activeLines.map(line => ({
        product: line.productId,
        quantity: line.quantity
      })),
      deliveryDate: nextThursday.toISOString(),
      notes: ''
    };

    try {
      const result = await dispatch(createPublicOrder(orderData)).unwrap();
      setOrderNumber(result?.orderNumber || '');
      setStep('success');
      toast.success('Order submitted successfully!');
    } catch {
      toast.error('Failed to submit order. Please try again.');
    }
  };

  const isLoading = customerLoading || productsLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Customer not found
  if (!customer && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <Shell className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">
              Customer Not Found
            </h1>
            <p className="text-muted-foreground">
              The order portal you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header
        className="text-sidebar-foreground py-4 px-4 shadow-md"
        style={{ backgroundColor: 'hsl(197 25% 18%)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden bg-white"
          >
            <img src="/logo.jpeg" alt="Oysterponds" className="w-full h-full object-cover" />
          </motion.div>
          <div>
            <p className="text-sm text-sidebar-foreground/70">Oysterponds Shellfish Co.</p>
            <h1 className="font-semibold text-sidebar-foreground">{customer?.businessName}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'products' && (
            <motion.div
              key="products"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              {/* Info Banner */}
              <motion.div variants={itemVariants}>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Package className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Next Delivery: {formatDate(nextThursday.toISOString())}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Orders must be placed by Tuesday for Thursday delivery
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Products */}
              <motion.div variants={itemVariants}>
                <h2 className="text-xl font-bold text-foreground mb-4">Select Products</h2>
                <div className="grid gap-4">
                  {orderLines.map((line, index) => {
                    const product = products.find(p => p._id === line.productId);
                    const quantity = line.quantity;
                    const price = line.unitPrice;
                    const hasQuantity = quantity > 0;

                    return (
                      <motion.div
                        key={line.productId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`border-border/50 transition-all ${hasQuantity ? 'border-primary bg-primary/5 shadow-sm' : ''
                          }`}>
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground">
                                    {line.productName}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    per {product?.unit || 'oyster'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {product?.description}
                                </p>
                                <p className="text-lg font-bold text-primary mt-2">
                                  {formatCurrency(price)} each
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => updateQuantity(line.productId, -10)}
                                  disabled={quantity === 0}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => setQuantity(line.productId, e.target.value)}
                                  className="h-10 w-20 text-center text-lg font-semibold"
                                  min="0"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => updateQuantity(line.productId, 10)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <AnimatePresence>
                              {hasQuantity && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 pt-3 border-t border-border/50 text-right"
                                >
                                  <span className="text-sm text-muted-foreground">Subtotal: </span>
                                  <span className="font-semibold text-foreground">
                                    {formatCurrency(quantity * price)}
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Continue Button */}
              {activeLines.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sticky bottom-4"
                >
                  <Card className="border-border/50 shadow-lg">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Order Total</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(orderTotal)}
                        </p>
                      </div>
                      <Button size="lg" onClick={() => setStep('review')} className="gap-2">
                        Review Order
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div
              key="review"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <Button
                  variant="ghost"
                  onClick={() => setStep('products')}
                  className="gap-2 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Products
                </Button>

                <h2 className="text-xl font-bold text-foreground">Review Your Order</h2>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeLines.map(line => (
                      <div key={line.productId} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{line.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {line.quantity} × {formatCurrency(line.unitPrice)}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(line.quantity * line.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(orderTotal)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>Delivery:</strong> {formatDate(nextThursday.toISOString())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Delivery Address:</strong> {customer?.billingAddress.street}, {customer?.billingAddress.city}
                    </p>
                    <div>
                      <Label htmlFor="harvestLocation" className="text-sm font-medium flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" />
                        Harvest Location
                      </Label>
                      <Select value={selectedHarvestLocation} onValueChange={setSelectedHarvestLocation}>
                        <SelectTrigger>
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
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={orderLoading}
                >
                  {orderLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Submit Order
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-green-600" />
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Order Submitted!
              </h2>
              <p className="text-muted-foreground mb-4">
                Thank you for your order.
              </p>

              <Card className="border-border/50 max-w-sm mx-auto">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                  <p className="text-3xl font-mono font-bold text-primary">
                    #{orderNumber}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Delivery: {formatDate(nextThursday.toISOString())}
                  </p>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setStep('products');
                  setOrderLines(prev => prev.map(line => ({ ...line, quantity: 0 })));
                }}
              >
                Place Another Order
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
