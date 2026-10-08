import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Download,
    Mail,
    Search,
    Loader2,
    Check,
    Clock,
    RefreshCw,
    Calendar,
    DollarSign,
    Ban,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchInvoices,
    fetchInvoicedOrderIds,
    fetchCompanyInfo,
    createInvoice,
    sendInvoiceEmail,
    markInvoiceAsPaid,
    voidInvoice,
    updateInvoice,
    getInvoicePDFUrl,
} from '@/store/slices';
import { fetchOrders, fetchCustomerPricing } from '@/store/slices';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { IOrder, CreateInvoiceForm, IInvoice, IInvoiceItem } from '@/types';
import { toast } from 'sonner';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    sent: 'bg-green-100 text-green-800 border-green-200',
    paid: 'bg-primary/10 text-primary border-primary/20',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
    draft: <Clock className="w-3 h-3" />,
    sent: <Mail className="w-3 h-3" />,
    paid: <Check className="w-3 h-3" />,
    cancelled: <Ban className="w-3 h-3" />,
};

export default function Invoices() {
    const dispatch = useAppDispatch();
    const { invoices, loading, companyInfo, pagination, invoicedOrderIds } = useAppSelector((state) => state.invoices);
    const { items: orders } = useAppSelector((state) => state.orders);
    const { customerPricing, pricingLoading } = useAppSelector((state) => state.customers);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

    // Mark as Paid modal state
    const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<IInvoice | null>(null);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [checkNumber, setCheckNumber] = useState('');
    const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
    const [checkAmount, setCheckAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);

    // Edit invoice modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<IInvoice | null>(null);
    const [editItems, setEditItems] = useState<IInvoiceItem[]>([]);
    const [editBillTo, setEditBillTo] = useState({ businessName: '', attention: '', address: { street: '', city: '', state: 'NY', zip: '' } });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Void confirm modal state
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
    const [selectedInvoiceForVoid, setSelectedInvoiceForVoid] = useState<IInvoice | null>(null);
    const [isVoiding, setIsVoiding] = useState(false);

    const [temperatureValue, setTemperatureValue] = useState<number | ''>('');
    const [truckStartHour, setTruckStartHour] = useState('9');
    const [truckStartMinute, setTruckStartMinute] = useState('00');
    const [truckStartPeriod, setTruckStartPeriod] = useState('AM');
    const [truckEndHour, setTruckEndHour] = useState('10');
    const [truckEndMinute, setTruckEndMinute] = useState('00');
    const [truckEndPeriod, setTruckEndPeriod] = useState('AM');
    const [harvestTimeText, setHarvestTimeText] = useState('');

    const [invoiceForm, setInvoiceForm] = useState<CreateInvoiceForm>({
        orderId: '',
        harvestDate: new Date().toISOString().split('T')[0],
        harvestTime: '08:00',
        departureTemperature: '',
        timeOnTruck: '',
        deliveredBy: '',
    });

    useEffect(() => {
        dispatch(fetchCompanyInfo());
        dispatch(fetchOrders({}));
        dispatch(fetchInvoicedOrderIds());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchInvoices({
            page: currentPage,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: searchQuery || undefined,
        }));
    }, [dispatch, currentPage, statusFilter, searchQuery]);

    const ordersWithoutInvoice = orders.filter(
        (order) =>
            (order.status === 'confirmed' || order.status === 'delivered') &&
            !invoicedOrderIds.includes(order._id)
    );

    const filteredInvoices = invoices;

    const formatTimeParts = (hour: string, minute: string, period: string): string => {
        return `${hour}:${minute} ${period}`;
    };

    const handleCreateInvoice = async () => {
        if (!selectedOrder) return;

        if (temperatureValue === '' || temperatureValue === undefined) {
            toast.error('Please enter the departure temperature');
            return;
        }

        if (temperatureValue > 45) {
            toast.error('Departure temperature must be 45°F or below for food safety compliance');
            return;
        }

        const formattedTemperature = `${temperatureValue}°F`;
        const formattedTimeOnTruck = `${formatTimeParts(truckStartHour, truckStartMinute, truckStartPeriod)} - ${formatTimeParts(truckEndHour, truckEndMinute, truckEndPeriod)}`;

        setIsSaving(true);
        try {
            const result = await dispatch(
                createInvoice({
                    ...invoiceForm,
                    orderId: selectedOrder._id,
                    harvestLocation: selectedOrder.harvestLocation,
                    harvestTime: harvestTimeText,
                    departureTemperature: formattedTemperature,
                    timeOnTruck: formattedTimeOnTruck,
                })
            ).unwrap();

            toast.success(`Invoice ${result.invoiceNumber} created successfully`);
            setIsCreateModalOpen(false);
            setSelectedOrder(null);
            setTemperatureValue('');
            setTruckStartHour('9');
            setTruckStartMinute('00');
            setTruckStartPeriod('AM');
            setTruckEndHour('10');
            setTruckEndMinute('00');
            setTruckEndPeriod('AM');
            setHarvestTimeText('');
            setInvoiceForm({
                orderId: '',
                harvestDate: new Date().toISOString().split('T')[0],
                harvestTime: '',
                departureTemperature: '',
                timeOnTruck: '',
                deliveredBy: '',
            });
        } catch (error) {
            toast.error(typeof error === 'string' ? error : 'Failed to create invoice');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendEmail = async (invoiceId: string) => {
        setIsSendingEmail(invoiceId);
        try {
            await dispatch(sendInvoiceEmail(invoiceId)).unwrap();
            toast.success('Invoice emailed successfully');
        } catch (error) {
            toast.error(typeof error === 'string' ? error : 'Failed to send email. Check SMTP settings.');
        } finally {
            setIsSendingEmail(null);
        }
    };

    const handleDownloadPDF = (invoiceId: string) => {
        const url = getInvoicePDFUrl(invoiceId);
        window.open(url, '_blank');
    };

    const handleRefresh = () => {
        dispatch(fetchInvoices({
            page: currentPage,
            status: statusFilter !== 'all' ? statusFilter : undefined,
        }));
    };

    const openCreateModal = (order: IOrder) => {
        setSelectedOrder(order);
        setInvoiceForm({
            orderId: order._id,
            harvestDate: new Date().toISOString().split('T')[0],
            harvestTime: order.harvestTime || '',
            harvestLocation: order.harvestLocation,
            departureTemperature: '',
            timeOnTruck: '',
            deliveredBy: '',
        });
        setHarvestTimeText(order.harvestTime || '');
        setIsCreateModalOpen(true);
    };

    const openMarkPaidModal = (invoice: IInvoice) => {
        setSelectedInvoiceForPayment(invoice);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setCheckDate(new Date().toISOString().split('T')[0]);
        setCheckNumber('');
        setCheckAmount('');
        setPaymentMethod('');
        setIsMarkPaidModalOpen(true);
    };

    const handleMarkAsPaid = async () => {
        if (!selectedInvoiceForPayment) return;

        setIsMarkingPaid(true);
        try {
            await dispatch(markInvoiceAsPaid({
                invoiceId: selectedInvoiceForPayment._id,
                checkNumber: checkNumber || undefined,
                paidAt: paymentDate || undefined,
                checkDate: checkDate || undefined,
                checkAmount: checkAmount ? Number(checkAmount) : undefined,
                paymentMethod: paymentMethod || undefined,
            })).unwrap();

            toast.success('Invoice marked as paid!');
            setIsMarkPaidModalOpen(false);
            setSelectedInvoiceForPayment(null);
        } catch {
            toast.error('Failed to mark invoice as paid');
        } finally {
            setIsMarkingPaid(false);
        }
    };

    const openVoidModal = (invoice: IInvoice) => {
        setSelectedInvoiceForVoid(invoice);
        setIsVoidModalOpen(true);
    };

    const handleVoidInvoice = async () => {
        if (!selectedInvoiceForVoid) return;
        setIsVoiding(true);
        try {
            await dispatch(voidInvoice(selectedInvoiceForVoid._id)).unwrap();
            toast.success(`${selectedInvoiceForVoid.invoiceNumber} voided`);
            setIsVoidModalOpen(false);
            setSelectedInvoiceForVoid(null);
        } catch {
            toast.error('Failed to void invoice');
        } finally {
            setIsVoiding(false);
        }
    };

    const openEditModal = (invoice: IInvoice) => {
        setSelectedInvoiceForEdit(invoice);
        setEditItems(invoice.items.map(item => ({ ...item })));
        setEditBillTo({
            businessName: invoice.billTo?.businessName || '',
            attention: invoice.billTo?.attention || '',
            address: {
                street: invoice.billTo?.address?.street || '',
                city: invoice.billTo?.address?.city || '',
                state: invoice.billTo?.address?.state || 'NY',
                zip: invoice.billTo?.address?.zip || '',
            },
        });
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?._id;
        if (customerId) dispatch(fetchCustomerPricing(customerId));
        setIsEditModalOpen(true);
    };

    const handleEditItem = (index: number, field: keyof IInvoiceItem, value: string | number) => {
        setEditItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            if (field === 'quantity' || field === 'pricePerUnit') {
                updated[index].lineTotal = Number(updated[index].quantity) * Number(updated[index].pricePerUnit);
            }
            return updated;
        });
    };

    const handleSelectProduct = (index: number, productId: string) => {
        const pricing = customerPricing.find(p => p.productId === productId);
        if (!pricing) return;
        setEditItems(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                product: productId,
                productName: pricing.productName,
                pricePerUnit: pricing.price,
                lineTotal: Number(updated[index].quantity) * pricing.price,
            };
            return updated;
        });
    };

    const handleAddItem = () => {
        setEditItems(prev => [...prev, { product: '', productName: '', quantity: 1, pricePerUnit: 0, lineTotal: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setEditItems(prev => prev.filter((_, i) => i !== index));
    };

    const editSubtotal = editItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    const editTotal = editSubtotal + (selectedInvoiceForEdit?.tax || 0);

    const handleSaveEdit = async () => {
        if (!selectedInvoiceForEdit) return;
        if (editItems.length === 0) {
            toast.error('Invoice must have at least one item');
            return;
        }
        setIsSavingEdit(true);
        try {
            await dispatch(updateInvoice({
                id: selectedInvoiceForEdit._id,
                updates: {
                    items: editItems,
                    subtotal: editSubtotal,
                    total: editTotal,
                    billTo: editBillTo,
                },
            })).unwrap();
            toast.success('Invoice updated successfully');
            setIsEditModalOpen(false);
            setSelectedInvoiceForEdit(null);
        } catch {
            toast.error('Failed to update invoice');
        } finally {
            setIsSavingEdit(false);
        }
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
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-4">Invoices</h1>
                        <p className="text-muted-foreground">Generate, manage and send invoices to customers.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </motion.div>

                {/* Pending Orders (Ready for Invoice) */}
                {ordersWithoutInvoice.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <Card className="border-primary/30 bg-primary/5">
                            <CardContent className="p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Orders Ready for Invoice ({ordersWithoutInvoice.length})
                                </h3>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {ordersWithoutInvoice.slice(0, 6).map((order) => (
                                        <div
                                            key={order._id}
                                            className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50"
                                        >
                                            <div>
                                                <span className="font-mono text-sm font-semibold text-primary">
                                                    #{order.orderNumber}
                                                </span>
                                                <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                                                    {order.customerName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatCurrency(order.total)}
                                                </p>
                                            </div>
                                            <Button size="sm" onClick={() => openCreateModal(order)}>
                                                <FileText className="w-3 h-3 mr-1" />
                                                Invoice
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Filters */}
                <motion.div variants={itemVariants}>
                    <Card className="border-border/50">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by invoice # or customer..."
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Loading State */}
                {loading && invoices.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Invoices List */}
                {!loading && invoices.length === 0 ? (
                    <motion.div variants={itemVariants}>
                        <Card className="border-border/50">
                            <CardContent className="p-12 text-center">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Confirm an order first, then use the &ldquo;Orders Ready for Invoice&rdquo; panel above to generate an invoice.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants}>
                        <Card className="border-border/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left p-4 font-semibold text-sm">Invoice #</th>
                                            <th className="text-left p-4 font-semibold text-sm">Customer</th>
                                            <th className="text-left p-4 font-semibold text-sm">Date</th>
                                            <th className="text-right p-4 font-semibold text-sm">Total</th>
                                            <th className="text-center p-4 font-semibold text-sm">Status</th>
                                            <th className="text-right p-4 font-semibold text-sm">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredInvoices.map((invoice) => (
                                            <tr key={invoice._id} className={`hover:bg-muted/30 transition-colors ${invoice.status === 'cancelled' ? 'opacity-60' : ''}`}>
                                                <td className="p-4">
                                                    <span className={`font-mono font-semibold ${invoice.status === 'cancelled' ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                                                        {invoice.invoiceNumber}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-foreground">{invoice.customerName}</span>
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    {formatDate(invoice.shippingDate)}
                                                </td>
                                                <td className="p-4 text-right font-semibold">
                                                    {formatCurrency(invoice.total)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={`${statusColors[invoice.status]} gap-1`}
                                                    >
                                                        {statusIcons[invoice.status]}
                                                        {invoice.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Print PDF — always available */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5"
                                                            onClick={() => handleDownloadPDF(invoice._id)}
                                                            title="Download / Print PDF"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Print
                                                        </Button>

                                                        {/* Email — for draft and sent (not cancelled/paid) */}
                                                        {(invoice.status === 'draft' || invoice.status === 'sent') && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5"
                                                                onClick={() => handleSendEmail(invoice._id)}
                                                                disabled={isSendingEmail === invoice._id}
                                                                title={invoice.status === 'sent' ? 'Re-send email' : 'Send email'}
                                                            >
                                                                {isSendingEmail === invoice._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Mail className="w-4 h-4" />
                                                                )}
                                                                {invoice.status === 'sent' ? 'Re-send' : 'Email'}
                                                            </Button>
                                                        )}

                                                        {/* Mark as Paid — draft or sent (Feature 4) */}
                                                        {(invoice.status === 'draft' || invoice.status === 'sent') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openMarkPaidModal(invoice)}
                                                                title="Mark as Paid"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            >
                                                                <DollarSign className="w-4 h-4" />
                                                            </Button>
                                                        )}

                                                        {/* Paid info */}
                                                        {invoice.status === 'paid' && (
                                                            <div className="text-right">
                                                                <span className="text-xs text-green-600 font-medium block">
                                                                    Paid {invoice.paidAt ? formatDate(invoice.paidAt) : ''}
                                                                </span>
                                                                {invoice.paymentMethod && (
                                                                    <span className="text-xs text-muted-foreground block">{invoice.paymentMethod}</span>
                                                                )}
                                                                {invoice.checkNumber && (
                                                                    <span className="text-xs text-muted-foreground block">#{invoice.checkNumber}</span>
                                                                )}
                                                                {invoice.checkAmount ? (
                                                                    <span className="text-xs text-muted-foreground block">{formatCurrency(invoice.checkAmount)}</span>
                                                                ) : null}
                                                            </div>
                                                        )}

                                                        {/* Edit — for non-cancelled invoices (Feature 2) */}
                                                        {invoice.status !== 'cancelled' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditModal(invoice)}
                                                                title="Edit Invoice"
                                                                className="text-muted-foreground hover:text-foreground"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                        )}

                                                        {/* Void — for non-cancelled invoices (Feature 3) */}
                                                        {invoice.status !== 'cancelled' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openVoidModal(invoice)}
                                                                title="Void / Cancel Invoice"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            >
                                                                <Ban className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredInvoices.length === 0 && !loading && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No invoices found matching your criteria.
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {((currentPage - 1) * pagination.limit) + 1}–{Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} invoices
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => p - 1)}
                                            disabled={currentPage === 1 || loading}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Page {currentPage} of {pagination.pages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => p + 1)}
                                            disabled={currentPage >= pagination.pages || loading}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </motion.div>

            {/* Create Invoice Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Generate Invoice</DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Order</span>
                                    <span className="font-mono font-semibold">#{selectedOrder.orderNumber}</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-sm text-muted-foreground">Customer</span>
                                    <span className="font-medium">{selectedOrder.customerName}</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-sm text-muted-foreground">Total</span>
                                    <span className="font-semibold text-primary">
                                        {formatCurrency(selectedOrder.total)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Harvest Date</Label>
                                    <Input
                                        type="date"
                                        value={invoiceForm.harvestDate}
                                        onChange={(e) =>
                                            setInvoiceForm((prev) => ({ ...prev, harvestDate: e.target.value }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Harvest Time</Label>
                                    <Input
                                        type="text"
                                        className="mt-1"
                                        value={harvestTimeText}
                                        onChange={(e) => setHarvestTimeText(e.target.value)}
                                        placeholder="e.g. 6:47 AM or 14:30"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Type any time — pre-filled from order if set
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Departure Temperature</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="45"
                                            placeholder="40"
                                            value={temperatureValue}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                                setTemperatureValue(val);
                                            }}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">°F</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Must be 45°F or below</p>
                                </div>
                            </div>

                            <div>
                                <Label>Time on Truck</Label>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <div>
                                        <span className="text-xs text-muted-foreground mb-1 block">Start</span>
                                        <div className="flex items-center gap-1">
                                            <Select value={truckStartHour} onValueChange={setTruckStartHour}>
                                                <SelectTrigger className="w-[60px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                        <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <span className="text-sm font-bold">:</span>
                                            <Select value={truckStartMinute} onValueChange={setTruckStartMinute}>
                                                <SelectTrigger className="w-[60px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['00', '15', '30', '45'].map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={truckStartPeriod} onValueChange={setTruckStartPeriod}>
                                                <SelectTrigger className="w-[65px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AM">AM</SelectItem>
                                                    <SelectItem value="PM">PM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground mb-1 block">End</span>
                                        <div className="flex items-center gap-1">
                                            <Select value={truckEndHour} onValueChange={setTruckEndHour}>
                                                <SelectTrigger className="w-[60px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                        <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <span className="text-sm font-bold">:</span>
                                            <Select value={truckEndMinute} onValueChange={setTruckEndMinute}>
                                                <SelectTrigger className="w-[60px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['00', '15', '30', '45'].map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={truckEndPeriod} onValueChange={setTruckEndPeriod}>
                                                <SelectTrigger className="w-[65px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AM">AM</SelectItem>
                                                    <SelectItem value="PM">PM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label>Delivered By</Label>
                                <Select
                                    value={invoiceForm.deliveredBy}
                                    onValueChange={(value) =>
                                        setInvoiceForm((prev) => ({ ...prev, deliveredBy: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select driver" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companyInfo?.drivers.map((driver) => (
                                            <SelectItem key={driver} value={driver}>
                                                {driver}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateInvoice} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Generate Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mark as Paid Modal */}
            <Dialog open={isMarkPaidModalOpen} onOpenChange={setIsMarkPaidModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mark Invoice as Paid</DialogTitle>
                    </DialogHeader>

                    {selectedInvoiceForPayment && (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-mono font-semibold text-primary">
                                        {selectedInvoiceForPayment.invoiceNumber}
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(selectedInvoiceForPayment.total)}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {selectedInvoiceForPayment.customerName}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="paymentDate">Payment Date</Label>
                                    <Input
                                        id="paymentDate"
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentMethod">Payment Method</Label>
                                    <Input
                                        id="paymentMethod"
                                        type="text"
                                        placeholder="e.g. Check, ACH, Cash"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="checkNumber">Check Number</Label>
                                    <Input
                                        id="checkNumber"
                                        type="text"
                                        placeholder="e.g. 1234"
                                        value={checkNumber}
                                        onChange={(e) => setCheckNumber(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="checkAmount">Check Amount</Label>
                                    <Input
                                        id="checkAmount"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={checkAmount}
                                        onChange={(e) => setCheckAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="checkDate">Check Date</Label>
                                <Input
                                    id="checkDate"
                                    type="date"
                                    value={checkDate}
                                    onChange={(e) => setCheckDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMarkPaidModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleMarkAsPaid} disabled={isMarkingPaid} className="bg-green-600 hover:bg-green-700">
                            {isMarkingPaid ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            Mark as Paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Invoice Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Invoice {selectedInvoiceForEdit?.invoiceNumber}</DialogTitle>
                    </DialogHeader>

                    {selectedInvoiceForEdit && (
                        <div className="space-y-6">
                            {/* Bill To */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3">Bill To</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Business Name</Label>
                                        <Input
                                            value={editBillTo.businessName}
                                            onChange={(e) => setEditBillTo(prev => ({ ...prev, businessName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Attention</Label>
                                        <Input
                                            value={editBillTo.attention}
                                            onChange={(e) => setEditBillTo(prev => ({ ...prev, attention: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Street</Label>
                                        <Input
                                            value={editBillTo.address.street}
                                            onChange={(e) => setEditBillTo(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>City</Label>
                                        <Input
                                            value={editBillTo.address.city}
                                            onChange={(e) => setEditBillTo(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>State</Label>
                                        <Input
                                            value={editBillTo.address.state}
                                            onChange={(e) => setEditBillTo(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Zip</Label>
                                        <Input
                                            value={editBillTo.address.zip}
                                            onChange={(e) => setEditBillTo(prev => ({ ...prev, address: { ...prev.address, zip: e.target.value } }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-sm">Line Items</h4>
                                    <Button variant="outline" size="sm" onClick={handleAddItem}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Item
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {editItems.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/30 rounded-lg">
                                            <div className="col-span-5">
                                                {pricingLoading ? (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                                                        <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                                                    </div>
                                                ) : customerPricing.length > 0 ? (
                                                    <Select
                                                        value={item.product || ''}
                                                        onValueChange={(val) => handleSelectProduct(index, val)}
                                                    >
                                                        <SelectTrigger className="text-sm">
                                                            <SelectValue placeholder="Select product" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {customerPricing.map(p => (
                                                                <SelectItem key={p.productId} value={p.productId}>
                                                                    {p.productName} — {formatCurrency(p.price)}/{p.unit}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        placeholder="Product name"
                                                        value={item.productName}
                                                        onChange={(e) => handleEditItem(index, 'productName', e.target.value)}
                                                        className="text-sm"
                                                    />
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={item.quantity}
                                                    min={1}
                                                    onChange={(e) => handleEditItem(index, 'quantity', Number(e.target.value))}
                                                    className="text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Price"
                                                    value={item.pricePerUnit}
                                                    onChange={(e) => handleEditItem(index, 'pricePerUnit', Number(e.target.value))}
                                                    className="text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2 text-sm font-medium text-right">
                                                {formatCurrency(item.quantity * item.pricePerUnit)}
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-red-500 hover:text-red-600 h-7 w-7"
                                                    disabled={editItems.length === 1}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="mt-4 space-y-1 border-t pt-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatCurrency(editSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>{formatCurrency(selectedInvoiceForEdit.tax || 0)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span>{formatCurrency(editTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                            {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Void Confirm Modal */}
            <Dialog open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Void Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to void <span className="font-mono font-semibold text-foreground">{selectedInvoiceForVoid?.invoiceNumber}</span>?
                        </p>
                        <p className="text-sm text-muted-foreground">
                            The invoice will remain in history but will be marked as Cancelled and excluded from all sales and A/R totals.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsVoidModalOpen(false)}>
                            Keep Invoice
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleVoidInvoice}
                            disabled={isVoiding}
                        >
                            {isVoiding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                            Void Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
