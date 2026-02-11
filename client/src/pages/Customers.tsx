import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  DollarSign,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Layout } from '@/components/layout/Layout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/store/slices';
import { fetchProducts } from '@/store/slices';
import { formatCurrency, generateSlug } from '@/utils/helpers';
import { ICustomer, CreateCustomerForm } from '@/types';
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

const emptyFormData: CreateCustomerForm = {
  businessName: '',
  name: '',
  slug: '',
  billingAddress: { street: '', city: '', state: 'NY', zip: '' },
  shippingAddress: { street: '', city: '', state: 'NY', zip: '' },
  contactEmail: '',
  accountingEmail: '',
  additionalAccountingEmail: '',
  phone: '',
  accountingPerson: '',
  accountingPhone: '',
  contactPerson2: '',
  contactPerson2Phone: '',
  paymentAlias: '',
  paymentMethod: '',
  customPricing: [],
  reminderEnabled: false,
  reminderDay: 'Monday',
  requiresShippingTag: false,
  notes: ''
};

export default function Customers() {
  const dispatch = useAppDispatch();
  const { items: customers, loading } = useAppSelector((state) => state.customers);
  const { items: products } = useAppSelector((state) => state.products);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<ICustomer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CreateCustomerForm>(emptyFormData);
  const [pricingData, setPricingData] = useState<{ product: string; price: number }[]>([]);

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
  }, [dispatch]);

  const filteredCustomers = customers.filter(customer =>
    customer.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.contactEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = () => {
    setFormData(emptyFormData);
    setIsAddModalOpen(true);
  };

  const handleEditCustomer = (customer: ICustomer) => {
    setFormData({
      businessName: customer.businessName,
      name: customer.name || '',
      slug: customer.slug,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      contactEmail: customer.contactEmail || '',
      accountingEmail: customer.accountingEmail || '',
      additionalAccountingEmail: customer.additionalAccountingEmail || '',
      phone: customer.phone || '',
      accountingPerson: customer.accountingPerson || '',
      accountingPhone: customer.accountingPhone || '',
      contactPerson2: customer.contactPerson2 || '',
      contactPerson2Phone: customer.contactPerson2Phone || '',
      paymentAlias: customer.paymentAlias || '',
      paymentMethod: customer.paymentMethod || '',
      customPricing: customer.customPricing.map(cp => ({
        product: typeof cp.product === 'string' ? cp.product : cp.product._id,
        price: cp.price
      })),
      reminderEnabled: customer.reminderEnabled,
      reminderDay: customer.reminderDay,
      requiresShippingTag: customer.requiresShippingTag || false,
      notes: customer.notes || ''
    });
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleEditPricing = (customer: ICustomer) => {
    // Initialize pricing with all products
    const pricing = products.map(product => {
      const customPrice = customer.customPricing.find(
        cp => (typeof cp.product === 'string' ? cp.product : cp.product._id) === product._id
      );
      return {
        product: product._id,
        price: customPrice?.price ?? product.basePrice
      };
    });
    setPricingData(pricing);
    setSelectedCustomer(customer);
    setIsPricingModalOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.businessName) {
      toast.error('Business name is required');
      return;
    }

    setIsSaving(true);
    const slug = formData.slug || generateSlug(formData.businessName);

    try {
      await dispatch(createCustomer({ ...formData, slug })).unwrap();
      setIsAddModalOpen(false);
      toast.success('Customer added successfully!');
    } catch (err) {
      toast.error('Failed to add customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    setIsSaving(true);
    try {
      await dispatch(updateCustomer({ id: selectedCustomer._id, data: formData })).unwrap();
      setIsEditModalOpen(false);
      toast.success('Customer updated successfully!');
    } catch (err) {
      toast.error('Failed to update customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePricing = async () => {
    if (!selectedCustomer) return;

    if (products.length === 0) {
      toast.error('Products not loaded. Please refresh and try again.');
      return;
    }

    // Ensure we only include valid product IDs
    const validPricing = pricingData.filter(p =>
      products.some(prod => prod._id === p.product)
    );

    setIsSaving(true);
    try {
      await dispatch(updateCustomer({
        id: selectedCustomer._id,
        data: { customPricing: validPricing }
      })).unwrap();
      setIsPricingModalOpen(false);
      toast.success('Pricing updated successfully!');
    } catch (err: unknown) {
      const error = err as string | { message?: string };
      const message = typeof error === 'string' ? error : error?.message || 'Failed to update pricing';
      toast.error(message);
      console.error('Pricing update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      await dispatch(deleteCustomer(customerToDelete._id)).unwrap();
      setCustomerToDelete(null);
      toast.success('Customer deleted');
    } catch (err) {
      toast.error('Failed to delete customer');
    }
  };

  const copyPortalLink = (slug: string) => {
    const link = `${window.location.origin}/order/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    toast.success('Portal link copied!');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (loading && customers.length === 0) {
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
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-4">
              Customers
            </h1>
            <p className="text-muted-foreground">
              Manage customer accounts and custom pricing.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleAddCustomer} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </motion.div>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Customer Grid */}
        <motion.div variants={itemVariants}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="border-border/50 hover:shadow-lg transition-all h-full">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {customer.businessName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{customer.name}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {customer.slug}
                            </Badge>
                            {customer.requiresShippingTag && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                📋 Shipping Tag
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setCustomerToDelete(customer)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        {customer.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{customer.contactEmail}</span>
                          </div>
                        )}
                        {customer.accountingEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0 text-primary/70" />
                            <span className="truncate text-xs">{customer.accountingEmail}</span>
                          </div>
                        )}
                        {customer.paymentAlias && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate text-xs">Pays as: {customer.paymentAlias}</span>
                          </div>
                        )}
                        {customer.notes && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <p className="text-xs italic line-clamp-2">{customer.notes}</p>
                          </div>
                        )}
                        {!customer.contactEmail && !customer.accountingEmail && !customer.notes && (
                          <p className="text-xs italic">No contact info</p>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => handleEditPricing(customer)}
                        >
                          <DollarSign className="w-3 h-3" />
                          Pricing
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => copyPortalLink(customer.slug)}
                        >
                          {copiedSlug === customer.slug ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`/order/${customer.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredCustomers.length === 0 && (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                No customers found.
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>

      {/* Add Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Business Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Restaurant Name"
                />
              </div>
              <div>
                <Label htmlFor="name">Contact Person</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="orders@restaurant.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(631) 555-0000"
                />
              </div>
            </div>

            {/* Accounting Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Accounting Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountingPerson">Accounting Person</Label>
                  <Input
                    id="accountingPerson"
                    value={formData.accountingPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountingPerson: e.target.value }))}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="accountingPhone">Accounting Phone</Label>
                  <Input
                    id="accountingPhone"
                    value={formData.accountingPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountingPhone: e.target.value }))}
                    placeholder="(631) 555-0001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label htmlFor="accountingEmail">Accounting Email</Label>
                  <Input
                    id="accountingEmail"
                    type="email"
                    value={formData.accountingEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountingEmail: e.target.value }))}
                    placeholder="accounting@restaurant.com"
                  />
                </div>
                <div>
                  <Label htmlFor="additionalAccountingEmail">Additional Accounting Email</Label>
                  <Input
                    id="additionalAccountingEmail"
                    type="email"
                    value={formData.additionalAccountingEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalAccountingEmail: e.target.value }))}
                    placeholder="ap@restaurant.com"
                  />
                </div>
              </div>
            </div>

            {/* Secondary Contact */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Secondary Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson2">Contact Person #2</Label>
                  <Input
                    id="contactPerson2"
                    value={formData.contactPerson2}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2: e.target.value }))}
                    placeholder="Paul"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson2Phone">Contact #2 Phone</Label>
                  <Input
                    id="contactPerson2Phone"
                    value={formData.contactPerson2Phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2Phone: e.target.value }))}
                    placeholder="(631) 555-0002"
                  />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Payment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentAlias">Payment Alias</Label>
                  <Input
                    id="paymentAlias"
                    value={formData.paymentAlias}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentAlias: e.target.value }))}
                    placeholder="Company DBA name"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Input
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    placeholder="ACH, Check, etc."
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-4">
              <Label>Billing Address</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  placeholder="Street"
                  value={formData.billingAddress?.street || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingAddress: { ...(prev.billingAddress || { street: '', city: '', state: 'NY', zip: '' }), street: e.target.value }
                  }))}
                  className="col-span-2"
                />
                <Input
                  placeholder="City"
                  value={formData.billingAddress?.city || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingAddress: { ...(prev.billingAddress || { street: '', city: '', state: 'NY', zip: '' }), city: e.target.value }
                  }))}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="State"
                    value={formData.billingAddress?.state || 'NY'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: { ...(prev.billingAddress || { street: '', city: '', state: 'NY', zip: '' }), state: e.target.value }
                    }))}
                    className="w-20"
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.billingAddress?.zip || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: { ...(prev.billingAddress || { street: '', city: '', state: 'NY', zip: '' }), zip: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t pt-4">
              <Label>Shipping Address</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  placeholder="Street"
                  value={formData.shippingAddress?.street || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shippingAddress: { ...(prev.shippingAddress || { street: '', city: '', state: 'NY', zip: '' }), street: e.target.value }
                  }))}
                  className="col-span-2"
                />
                <Input
                  placeholder="City"
                  value={formData.shippingAddress?.city || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shippingAddress: { ...(prev.shippingAddress || { street: '', city: '', state: 'NY', zip: '' }), city: e.target.value }
                  }))}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="State"
                    value={formData.shippingAddress?.state || 'NY'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...(prev.shippingAddress || { street: '', city: '', state: 'NY', zip: '' }), state: e.target.value }
                    }))}
                    className="w-20"
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.shippingAddress?.zip || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...(prev.shippingAddress || { street: '', city: '', state: 'NY', zip: '' }), zip: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Requires Shipping Tag */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresShippingTag"
                  checked={formData.requiresShippingTag || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresShippingTag: e.target.checked }))}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="requiresShippingTag" className="cursor-pointer">
                  Requires Shellfish Shipping Tag with Invoice
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                When enabled, a shipping tag PDF will be automatically attached to invoice emails for this customer.
              </p>
            </div>

            {/* Notes */}
            <div className="border-t pt-4">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special notes about this customer..."
                className="w-full mt-1 p-2 border rounded-md min-h-[80px] text-sm"
              />
            </div>

            {/* Portal Slug */}
            <div>
              <Label htmlFor="slug">Portal Slug (optional)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="restaurant-name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for customer order portal URL. Auto-generated if blank.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomer} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Business Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-businessName">Business Name *</Label>
                <Input
                  id="edit-businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Contact Person</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Accounting Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Accounting Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-accountingPerson">Accounting Person</Label>
                  <Input
                    id="edit-accountingPerson"
                    value={formData.accountingPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountingPerson: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-accountingPhone">Accounting Phone</Label>
                  <Input
                    id="edit-accountingPhone"
                    value={formData.accountingPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountingPhone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label htmlFor="edit-accountingEmail">Accounting Email</Label>
                  <Input
                    id="edit-accountingEmail"
                    type="email"
                    value={formData.accountingEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountingEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-additionalAccountingEmail">Additional Accounting Email</Label>
                  <Input
                    id="edit-additionalAccountingEmail"
                    type="email"
                    value={formData.additionalAccountingEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalAccountingEmail: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Secondary Contact */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Secondary Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-contactPerson2">Contact Person #2</Label>
                  <Input
                    id="edit-contactPerson2"
                    value={formData.contactPerson2}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contactPerson2Phone">Contact #2 Phone</Label>
                  <Input
                    id="edit-contactPerson2Phone"
                    value={formData.contactPerson2Phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2Phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Payment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-paymentAlias">Payment Alias</Label>
                  <Input
                    id="edit-paymentAlias"
                    value={formData.paymentAlias}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentAlias: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-paymentMethod">Payment Method</Label>
                  <Input
                    id="edit-paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-4">
              <Label>Billing Address</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  placeholder="Street"
                  value={formData.billingAddress?.street || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingAddress: { ...(prev.billingAddress || { street: '', city: '', state: 'NY', zip: '' }), street: e.target.value }
                  }))}
                  className="col-span-2"
                />
                <Input
                  placeholder="City"
                  value={formData.billingAddress?.city || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingAddress: { ...(prev.billingAddress || { street: '', city: '', state: 'NY', zip: '' }), city: e.target.value }
                  }))}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="State"
                    value={formData.billingAddress?.state || 'NY'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: { ...(prev.billingAddress || { street: '', city: '', state: 'NY', zip: '' }), state: e.target.value }
                    }))}
                    className="w-20"
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.billingAddress?.zip || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: { ...(prev.billingAddress || { street: '', city: '', state: 'NY', zip: '' }), zip: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t pt-4">
              <Label>Shipping Address</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  placeholder="Street"
                  value={formData.shippingAddress?.street || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shippingAddress: { ...(prev.shippingAddress || { street: '', city: '', state: 'NY', zip: '' }), street: e.target.value }
                  }))}
                  className="col-span-2"
                />
                <Input
                  placeholder="City"
                  value={formData.shippingAddress?.city || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shippingAddress: { ...(prev.shippingAddress || { street: '', city: '', state: 'NY', zip: '' }), city: e.target.value }
                  }))}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="State"
                    value={formData.shippingAddress?.state || 'NY'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...(prev.shippingAddress || { street: '', city: '', state: 'NY', zip: '' }), state: e.target.value }
                    }))}
                    className="w-20"
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.shippingAddress?.zip || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...(prev.shippingAddress || { street: '', city: '', state: 'NY', zip: '' }), zip: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Requires Shipping Tag */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-requiresShippingTag"
                  checked={formData.requiresShippingTag || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresShippingTag: e.target.checked }))}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="edit-requiresShippingTag" className="cursor-pointer">
                  Requires Shellfish Shipping Tag with Invoice
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                When enabled, a shipping tag PDF will be automatically attached to invoice emails for this customer.
              </p>
            </div>

            {/* Notes */}
            <div className="border-t pt-4">
              <Label htmlFor="edit-notes">Notes</Label>
              <textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special notes about this customer..."
                className="w-full mt-1 p-2 border rounded-md min-h-[80px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Modal */}
      <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Custom Pricing - {selectedCustomer?.businessName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {products.map(product => {
              const priceEntry = pricingData.find(p => p.product === product._id);
              const currentPrice = priceEntry?.price ?? product.basePrice;

              return (
                <div key={product._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Base: {formatCurrency(product.basePrice)} / {product.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentPrice}
                      onChange={(e) => {
                        const newPrice = parseFloat(e.target.value) || product.basePrice;
                        setPricingData(prev => {
                          const existing = prev.find(p => p.product === product._id);
                          if (existing) {
                            return prev.map(p => p.product === product._id ? { ...p, price: newPrice } : p);
                          }
                          return [...prev, { product: product._id, price: newPrice }];
                        });
                      }}
                      className="w-20 text-right"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPricingModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePricing} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customerToDelete?.businessName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
