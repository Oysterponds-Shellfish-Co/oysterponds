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
    fetchCompanyInfo,
    createInvoice,
    sendInvoiceEmail,
    markInvoiceAsPaid,
    getInvoicePDFUrl,
} from '@/store/slices';
import { fetchOrders } from '@/store/slices';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { IOrder, CreateInvoiceForm, IInvoice } from '@/types';
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
};

const statusIcons: Record<string, React.ReactNode> = {
    draft: <Clock className="w-3 h-3" />,
    sent: <Mail className="w-3 h-3" />,
    paid: <Check className="w-3 h-3" />,
};

export default function Invoices() {
    const dispatch = useAppDispatch();
    const { invoices, loading, companyInfo } = useAppSelector((state) => state.invoices);
    const { items: orders } = useAppSelector((state) => state.orders);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

    // Mark as Paid modal state
    const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<IInvoice | null>(null);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [checkNumber, setCheckNumber] = useState('');
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);

    // Separate state for temperature (number) and time on truck
    const [temperatureValue, setTemperatureValue] = useState<number | ''>('');
    const [truckStartHour, setTruckStartHour] = useState('9');
    const [truckStartMinute, setTruckStartMinute] = useState('00');
    const [truckStartPeriod, setTruckStartPeriod] = useState('AM');
    const [truckEndHour, setTruckEndHour] = useState('10');
    const [truckEndMinute, setTruckEndMinute] = useState('00');
    const [truckEndPeriod, setTruckEndPeriod] = useState('AM');

    // Harvest time state
    const [harvestHour, setHarvestHour] = useState('8');
    const [harvestMinute, setHarvestMinute] = useState('00');
    const [harvestPeriod, setHarvestPeriod] = useState('AM');

    // Invoice form state
    const [invoiceForm, setInvoiceForm] = useState<CreateInvoiceForm>({
        orderId: '',
        harvestDate: new Date().toISOString().split('T')[0],
        harvestTime: '08:00',
        departureTemperature: '',
        timeOnTruck: '',
        deliveredBy: '',
    });

    useEffect(() => {
        dispatch(fetchInvoices(undefined));
        dispatch(fetchCompanyInfo());
        dispatch(fetchOrders({}));
    }, [dispatch]);

    // Filter to get CONFIRMED orders without invoices
    // (Invoices can be generated before delivery - client requirement)
    const ordersWithoutInvoice = orders.filter(
        (order) =>
            (order.status === 'confirmed' || order.status === 'delivered') &&
            !invoices.some((inv) => {
                const orderId = typeof inv.order === 'string' ? inv.order : inv.order?._id;
                return orderId === order._id;
            })
    );

    const filteredInvoices = invoices.filter((invoice) => {
        const matchesSearch =
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Helper to format hour/minute/period into readable time string
    const formatTimeParts = (hour: string, minute: string, period: string): string => {
        return `${hour}:${minute} ${period}`;
    };

    const handleCreateInvoice = async () => {
        if (!selectedOrder) return;

        // Validate temperature
        if (temperatureValue === '' || temperatureValue === undefined) {
            toast.error('Please enter the departure temperature');
            return;
        }

        if (temperatureValue > 45) {
            toast.error('Departure temperature must be 45°F or below for food safety compliance');
            return;
        }

        // Format the values
        const formattedTemperature = `${temperatureValue}°F`;
        const formattedHarvestTime = formatTimeParts(harvestHour, harvestMinute, harvestPeriod);
        const formattedTimeOnTruck = `${formatTimeParts(truckStartHour, truckStartMinute, truckStartPeriod)} - ${formatTimeParts(truckEndHour, truckEndMinute, truckEndPeriod)}`;

        setIsSaving(true);
        try {
            const result = await dispatch(
                createInvoice({
                    ...invoiceForm,
                    orderId: selectedOrder._id,
                    harvestLocation: selectedOrder.harvestLocation,
                    harvestTime: formattedHarvestTime,
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
            setHarvestHour('8');
            setHarvestMinute('00');
            setHarvestPeriod('AM');
            setInvoiceForm({
                orderId: '',
                harvestDate: new Date().toISOString().split('T')[0],
                harvestTime: '8:00 AM',
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
        dispatch(fetchInvoices(undefined));
    };

    const openCreateModal = (order: IOrder) => {
        setSelectedOrder(order);
        setInvoiceForm({
            orderId: order._id,
            harvestDate: new Date().toISOString().split('T')[0],
            harvestTime: '8:00 AM',
            harvestLocation: order.harvestLocation,
            departureTemperature: '',
            timeOnTruck: '',
            deliveredBy: '',
        });
        setHarvestHour('8');
        setHarvestMinute('00');
        setHarvestPeriod('AM');
        setIsCreateModalOpen(true);
    };

    const openMarkPaidModal = (invoice: IInvoice) => {
        setSelectedInvoiceForPayment(invoice);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setCheckNumber('');
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
            })).unwrap();

            toast.success('Invoice marked as paid!');
            setIsMarkPaidModalOpen(false);
            setSelectedInvoiceForPayment(null);
        } catch (error) {
            toast.error('Failed to mark invoice as paid');
        } finally {
            setIsMarkingPaid(false);
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
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
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
                                    Mark an order as "delivered" first, then generate the invoice here.
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
                                            <tr key={invoice._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4">
                                                    <span className="font-mono font-semibold text-primary">
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
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDownloadPDF(invoice._id)}
                                                            title="Download PDF"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                        {invoice.status === 'draft' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleSendEmail(invoice._id)}
                                                                disabled={isSendingEmail === invoice._id}
                                                                title="Send Email"
                                                            >
                                                                {isSendingEmail === invoice._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Mail className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        )}
                                                        {invoice.status === 'sent' && invoice.emailSentAt && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openMarkPaidModal(invoice)}
                                                                    title="Mark as Paid"
                                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                >
                                                                    <DollarSign className="w-4 h-4" />
                                                                </Button>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Sent {formatDate(invoice.emailSentAt)}
                                                                </span>
                                                            </>
                                                        )}
                                                        {invoice.status === 'paid' && (
                                                            <span className="text-xs text-green-600 font-medium">
                                                                Paid {invoice.paidAt ? formatDate(invoice.paidAt) : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredInvoices.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No invoices found matching your criteria.
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
                            {/* Order Summary */}
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

                            {/* Invoice Details Form */}
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
                                    <div className="flex items-center gap-2 mt-1">
                                        <Select value={harvestHour} onValueChange={setHarvestHour}>
                                            <SelectTrigger className="w-[70px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                    <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-lg font-bold">:</span>
                                        <Select value={harvestMinute} onValueChange={setHarvestMinute}>
                                            <SelectTrigger className="w-[70px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {['00', '15', '30', '45'].map(m => (
                                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={harvestPeriod} onValueChange={setHarvestPeriod}>
                                            <SelectTrigger className="w-[80px]">
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
                            {/* Invoice Info */}
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

                            {/* Payment Date */}
                            <div className="space-y-2">
                                <Label htmlFor="paymentDate">Payment Date</Label>
                                <Input
                                    id="paymentDate"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                />
                            </div>

                            {/* Payment Method & Date */}
                            <div className="space-y-2">
                                <Label htmlFor="checkNumber">Payment Method & Date</Label>
                                <Input
                                    id="checkNumber"
                                    type="text"
                                    placeholder="e.g. ACH 2/25, Check #1234, Cash"
                                    value={checkNumber}
                                    onChange={(e) => setCheckNumber(e.target.value)}
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
        </Layout>
    );
}
