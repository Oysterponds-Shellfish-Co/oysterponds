import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    DollarSign,
    TrendingUp,
    Users,
    FileText,
    Download,
    Calendar,
    ChevronDown,
    Package,
    Clock,
    AlertCircle,
    CheckCircle,
    Send,
    FileSpreadsheet,
    ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/services/api';

interface SalesSummary {
    year: number;
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    monthlyBreakdown: { month: string; total: number; count: number }[];
    totalInvoices: number;
}

interface InvoiceSummary {
    year: number;
    draft: { count: number; total: number };
    sent: { count: number; total: number };
    paid: { count: number; total: number };
    arTotal: number;
    totalInvoices: number;
    totalRevenue: number;
}

interface CustomerAnalytics {
    year: number;
    customers: {
        customerId: string;
        name: string;
        total: number;
        count: number;
        paid: number;
        outstanding: number;
    }[];
    totalCustomers: number;
}

interface ProductAnalytics {
    year: number;
    products: {
        name: string;
        quantity: number;
        revenue: number;
    }[];
    totalQuantity: number;
    totalRevenue: number;
}

interface ARAgingBucket {
    count: number;
    total: number;
    invoices: {
        invoiceNumber: string;
        customerName: string;
        total: number;
        date: string;
        daysOutstanding: number;
    }[];
}

interface ARAgingReport {
    aging: {
        current: ARAgingBucket;
        '1-30': ARAgingBucket;
        '31-60': ARAgingBucket;
        '61-90': ARAgingBucket;
        '90+': ARAgingBucket;
    };
    totalOutstanding: number;
    totalInvoices: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function Reports() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
    const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
    const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
    const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics | null>(null);
    const [arAging, setArAging] = useState<ARAgingReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Start from 2026 (founding year) and include all years up to current year
    // This will automatically include 2027, 2028, etc. as time goes on
    const FOUNDING_YEAR = 2026;
    const years = Array.from(
        { length: currentYear - FOUNDING_YEAR + 1 },
        (_, i) => currentYear - i
    );

    useEffect(() => {
        fetchAllReports();
    }, [selectedYear]);

    const fetchAllReports = async () => {
        setLoading(true);
        try {
            const [salesRes, invoiceRes, customerRes, productRes, arRes] = await Promise.all([
                api.get(`/reports/sales-summary?year=${selectedYear}`),
                api.get(`/reports/invoice-summary?year=${selectedYear}`),
                api.get(`/reports/customer-analytics?year=${selectedYear}`),
                api.get(`/reports/product-analytics?year=${selectedYear}`),
                api.get('/reports/ar-aging'),
            ]);

            setSalesSummary(salesRes.data.data);
            setInvoiceSummary(invoiceRes.data.data);
            setCustomerAnalytics(customerRes.data.data);
            setProductAnalytics(productRes.data.data);
            setArAging(arRes.data.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const response = await api.get(`/reports/export/invoices?year=${selectedYear}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedYear}_Invoices_and_Receipts.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Excel file downloaded successfully!');
        } catch (error) {
            console.error('Failed to export:', error);
            toast.error('Failed to export Excel file');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <motion.div
            className="p-6 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="gap-2 mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Track sales, invoices, and customer data</p>
                </div>
                <div className="flex gap-3">
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                        <SelectTrigger className="w-[120px]">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExportExcel} disabled={exporting} className="gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        {exporting ? 'Exporting...' : 'Export Excel'}
                    </Button>
                </div>
            </motion.div>

            {/* Overview Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-green-600/5 hover-lift cursor-default h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Sales</CardTitle>
                            <DollarSign className="w-4 h-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(salesSummary?.daily || 0)}</div>
                            <p className="text-xs text-muted-foreground">Today's total</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover-lift cursor-default h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Sales</CardTitle>
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(salesSummary?.weekly || 0)}</div>
                            <p className="text-xs text-muted-foreground">This week</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover-lift cursor-default h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Sales</CardTitle>
                            <Calendar className="w-4 h-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(salesSummary?.monthly || 0)}</div>
                            <p className="text-xs text-muted-foreground">This month</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <Card className="border-border/50 bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover-lift cursor-default h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Yearly Sales</CardTitle>
                            <FileText className="w-4 h-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(salesSummary?.yearly || 0)}</div>
                            <p className="text-xs text-muted-foreground">{selectedYear} total</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Tabs for detailed reports */}
            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList className="grid grid-cols-4 w-full max-w-[600px]">
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="aging">A/R Aging</TabsTrigger>
                </TabsList>

                {/* Invoice Summary Tab */}
                <TabsContent value="invoices" className="space-y-4">
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div
                            whileHover={{ scale: 1.02, y: -4 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <Card className="border-border/50 hover-lift cursor-default h-full">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Draft</CardTitle>
                                    <FileText className="w-4 h-4 text-gray-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{invoiceSummary?.draft.count || 0}</div>
                                    <p className="text-sm text-muted-foreground">{formatCurrency(invoiceSummary?.draft.total || 0)}</p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02, y: -4 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <Card className="border-border/50 hover-lift cursor-default h-full">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Sent</CardTitle>
                                    <Send className="w-4 h-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{invoiceSummary?.sent.count || 0}</div>
                                    <p className="text-sm text-muted-foreground">{formatCurrency(invoiceSummary?.sent.total || 0)}</p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02, y: -4 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <Card className="border-border/50 hover-lift cursor-default h-full">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Paid</CardTitle>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{invoiceSummary?.paid.count || 0}</div>
                                    <p className="text-sm text-muted-foreground">{formatCurrency(invoiceSummary?.paid.total || 0)}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>

                    {/* Monthly Breakdown */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Monthly Breakdown - {selectedYear}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {salesSummary?.monthlyBreakdown.map((month) => (
                                    <div key={month.month} className="p-3 bg-muted/50 rounded-lg text-center">
                                        <p className="text-sm font-medium text-muted-foreground">{month.month}</p>
                                        <p className="text-lg font-bold">{formatCurrency(month.total)}</p>
                                        <p className="text-xs text-muted-foreground">{month.count} invoices</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Customer Analytics Tab */}
                <TabsContent value="customers" className="space-y-4">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Sales by Customer - {selectedYear}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4">Customer</th>
                                            <th className="text-right py-3 px-4">Invoices</th>
                                            <th className="text-right py-3 px-4">Total Billed</th>
                                            <th className="text-right py-3 px-4">Paid</th>
                                            <th className="text-right py-3 px-4">Outstanding</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerAnalytics?.customers.map((customer, index) => (
                                            <tr key={customer.customerId} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4 font-medium">
                                                    <span className="inline-flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                                            {index + 1}
                                                        </span>
                                                        {customer.name}
                                                    </span>
                                                </td>
                                                <td className="text-right py-3 px-4">{customer.count}</td>
                                                <td className="text-right py-3 px-4 font-medium">{formatCurrency(customer.total)}</td>
                                                <td className="text-right py-3 px-4 text-green-600">{formatCurrency(customer.paid)}</td>
                                                <td className="text-right py-3 px-4 text-red-600">{formatCurrency(customer.outstanding)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Product Analytics Tab */}
                <TabsContent value="products" className="space-y-4">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Product Sales - {selectedYear}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4">Product</th>
                                            <th className="text-right py-3 px-4">Quantity Sold</th>
                                            <th className="text-right py-3 px-4">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productAnalytics?.products.map((product) => (
                                            <tr key={product.name} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4 font-medium">{product.name}</td>
                                                <td className="text-right py-3 px-4">{product.quantity.toLocaleString()}</td>
                                                <td className="text-right py-3 px-4 font-medium">{formatCurrency(product.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted/50 font-bold">
                                            <td className="py-3 px-4">Total</td>
                                            <td className="text-right py-3 px-4">{productAnalytics?.totalQuantity.toLocaleString()}</td>
                                            <td className="text-right py-3 px-4">{formatCurrency(productAnalytics?.totalRevenue || 0)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* A/R Aging Tab */}
                <TabsContent value="aging" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {arAging && Object.entries(arAging.aging).map(([bucket, data]) => (
                            <motion.div
                                key={bucket}
                                whileHover={{ scale: 1.02, y: -4 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <Card className="border-border/50 hover-lift cursor-default h-full">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {bucket === 'current' ? 'Current' : `${bucket} Days`}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(data.total)}</div>
                                        <p className="text-sm text-muted-foreground">{data.count} invoices</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Outstanding Invoices
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Total Outstanding: <span className="font-bold text-red-600">{formatCurrency(arAging?.totalOutstanding || 0)}</span>
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4">Invoice #</th>
                                            <th className="text-left py-3 px-4">Customer</th>
                                            <th className="text-right py-3 px-4">Amount</th>
                                            <th className="text-right py-3 px-4">Days Outstanding</th>
                                            <th className="text-center py-3 px-4">Aging Bucket</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {arAging && Object.entries(arAging.aging).flatMap(([bucket, data]) =>
                                            data.invoices.map((inv) => (
                                                <tr key={inv.invoiceNumber} className="border-b hover:bg-muted/50">
                                                    <td className="py-3 px-4 font-mono">{inv.invoiceNumber}</td>
                                                    <td className="py-3 px-4">{inv.customerName}</td>
                                                    <td className="text-right py-3 px-4 font-medium">{formatCurrency(inv.total)}</td>
                                                    <td className="text-right py-3 px-4">{inv.daysOutstanding} days</td>
                                                    <td className="text-center py-3 px-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${bucket === 'current' ? 'bg-green-100 text-green-800' :
                                                            bucket === '1-30' ? 'bg-yellow-100 text-yellow-800' :
                                                                bucket === '31-60' ? 'bg-orange-100 text-orange-800' :
                                                                    bucket === '61-90' ? 'bg-red-100 text-red-800' :
                                                                        'bg-red-200 text-red-900'
                                                            }`}>
                                                            {bucket === 'current' ? 'Current' : `${bucket} days`}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
