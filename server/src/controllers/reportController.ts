import { Request, Response } from 'express';
import { Invoice, Order, Customer } from '../models/index.js';
import { asyncHandler } from '../middleware/index.js';
import { ApiResponse } from '../types/index.js';
import ExcelJS from 'exceljs';

// @desc    Get sales summary (daily, weekly, monthly, yearly)
// @route   GET /api/reports/sales-summary
// @access  Private
export const getSalesSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Get all invoices for the year
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear + 1, 0, 1);

    const invoices = await Invoice.find({
        createdAt: { $gte: yearStart, $lt: yearEnd }
    });

    // Calculate totals
    const dailyTotal = invoices
        .filter(inv => {
            const today = new Date();
            const invDate = new Date(inv.createdAt);
            return invDate.toDateString() === today.toDateString();
        })
        .reduce((sum, inv) => sum + inv.total, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyTotal = invoices
        .filter(inv => new Date(inv.createdAt) >= weekStart)
        .reduce((sum, inv) => sum + inv.total, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyTotal = invoices
        .filter(inv => new Date(inv.createdAt) >= monthStart)
        .reduce((sum, inv) => sum + inv.total, 0);

    const yearlyTotal = invoices.reduce((sum, inv) => sum + inv.total, 0);

    // Monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
        const monthInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.createdAt);
            return invDate.getMonth() === i;
        });
        return {
            month: new Date(selectedYear, i, 1).toLocaleString('default', { month: 'short' }),
            total: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
            count: monthInvoices.length
        };
    });

    const response: ApiResponse = {
        success: true,
        data: {
            year: selectedYear,
            daily: dailyTotal,
            weekly: weeklyTotal,
            monthly: monthlyTotal,
            yearly: yearlyTotal,
            monthlyBreakdown,
            totalInvoices: invoices.length
        }
    };

    res.status(200).json(response);
});

// @desc    Get invoice summary by status
// @route   GET /api/reports/invoice-summary
// @access  Private
export const getInvoiceSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();

    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear + 1, 0, 1);

    const invoices = await Invoice.find({
        createdAt: { $gte: yearStart, $lt: yearEnd }
    });

    const summary = {
        draft: { count: 0, total: 0 },
        sent: { count: 0, total: 0 },
        paid: { count: 0, total: 0 }
    };

    invoices.forEach(inv => {
        const status = inv.status as keyof typeof summary;
        if (summary[status]) {
            summary[status].count++;
            summary[status].total += inv.total;
        }
    });

    // Calculate A/R (Accounts Receivable) - unpaid invoices (sent but not paid)
    const arTotal = summary.sent.total;

    const response: ApiResponse = {
        success: true,
        data: {
            year: selectedYear,
            ...summary,
            arTotal,
            totalInvoices: invoices.length,
            totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0)
        }
    };

    res.status(200).json(response);
});

// @desc    Get customer analytics (sales per customer)
// @route   GET /api/reports/customer-analytics
// @access  Private
export const getCustomerAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();

    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear + 1, 0, 1);

    const invoices = await Invoice.find({
        createdAt: { $gte: yearStart, $lt: yearEnd }
    }).populate('customer', 'businessName');

    // Group by customer
    const customerMap = new Map<string, { name: string; total: number; count: number; paid: number; outstanding: number }>();

    invoices.forEach(inv => {
        const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?._id?.toString();
        const customerName = inv.customerName || 'Unknown';

        if (!customerId) return;

        if (!customerMap.has(customerId)) {
            customerMap.set(customerId, { name: customerName, total: 0, count: 0, paid: 0, outstanding: 0 });
        }

        const data = customerMap.get(customerId)!;
        data.total += inv.total;
        data.count++;

        if (inv.status === 'paid') {
            data.paid += inv.total;
        } else {
            data.outstanding += inv.total;
        }
    });

    const customerAnalytics = Array.from(customerMap.entries())
        .map(([id, data]) => ({ customerId: id, ...data }))
        .sort((a, b) => b.total - a.total);

    const response: ApiResponse = {
        success: true,
        data: {
            year: selectedYear,
            customers: customerAnalytics,
            totalCustomers: customerAnalytics.length
        }
    };

    res.status(200).json(response);
});

// @desc    Get product analytics (quantities sold by product)
// @route   GET /api/reports/product-analytics
// @access  Private
export const getProductAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();

    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear + 1, 0, 1);

    const invoices = await Invoice.find({
        createdAt: { $gte: yearStart, $lt: yearEnd }
    });

    // Aggregate product quantities
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    invoices.forEach(inv => {
        inv.items.forEach(item => {
            const productName = item.productName;

            if (!productMap.has(productName)) {
                productMap.set(productName, { name: productName, quantity: 0, revenue: 0 });
            }

            const data = productMap.get(productName)!;
            data.quantity += item.quantity;
            data.revenue += item.lineTotal;
        });
    });

    const productAnalytics = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity);

    const response: ApiResponse = {
        success: true,
        data: {
            year: selectedYear,
            products: productAnalytics,
            totalQuantity: productAnalytics.reduce((sum, p) => sum + p.quantity, 0),
            totalRevenue: productAnalytics.reduce((sum, p) => sum + p.revenue, 0)
        }
    };

    res.status(200).json(response);
});

// @desc    Get A/R aging report
// @route   GET /api/reports/ar-aging
// @access  Private
export const getARAgingReport = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const now = new Date();

    // Get all unpaid invoices (sent but not paid)
    const unpaidInvoices = await Invoice.find({
        status: 'sent'
    }).populate('customer', 'businessName');

    const aging = {
        current: { count: 0, total: 0, invoices: [] as any[] },
        '1-30': { count: 0, total: 0, invoices: [] as any[] },
        '31-60': { count: 0, total: 0, invoices: [] as any[] },
        '61-90': { count: 0, total: 0, invoices: [] as any[] },
        '90+': { count: 0, total: 0, invoices: [] as any[] }
    };

    unpaidInvoices.forEach(inv => {
        const invoiceDate = new Date(inv.createdAt);
        const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

        const invoiceInfo = {
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            total: inv.total,
            date: inv.createdAt,
            daysOutstanding: daysDiff
        };

        if (daysDiff <= 0) {
            aging.current.count++;
            aging.current.total += inv.total;
            aging.current.invoices.push(invoiceInfo);
        } else if (daysDiff <= 30) {
            aging['1-30'].count++;
            aging['1-30'].total += inv.total;
            aging['1-30'].invoices.push(invoiceInfo);
        } else if (daysDiff <= 60) {
            aging['31-60'].count++;
            aging['31-60'].total += inv.total;
            aging['31-60'].invoices.push(invoiceInfo);
        } else if (daysDiff <= 90) {
            aging['61-90'].count++;
            aging['61-90'].total += inv.total;
            aging['61-90'].invoices.push(invoiceInfo);
        } else {
            aging['90+'].count++;
            aging['90+'].total += inv.total;
            aging['90+'].invoices.push(invoiceInfo);
        }
    });

    const totalOutstanding = Object.values(aging).reduce((sum, bucket) => sum + bucket.total, 0);

    const response: ApiResponse = {
        success: true,
        data: {
            aging,
            totalOutstanding,
            totalInvoices: unpaidInvoices.length
        }
    };

    res.status(200).json(response);
});

// @desc    Export invoices to Excel (matching client format)
// @route   GET /api/reports/export/invoices
// @access  Private
export const exportInvoicesToExcel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();

    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear + 1, 0, 1);

    // Get all invoices for the year with customer data
    const invoices = await Invoice.find({
        createdAt: { $gte: yearStart, $lt: yearEnd }
    }).populate('customer', 'businessName').sort({ customerName: 1, createdAt: 1 });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Oysterponds Shellfish Co.';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(`${selectedYear} Invoices and Receipts`);

    // Set column widths
    worksheet.columns = [
        { key: 'A', width: 5 },
        { key: 'B', width: 25 },  // Customer Name
        { key: 'C', width: 12 },  // Inv. No.
        { key: 'D', width: 12 },  // Date
        { key: 'E', width: 12 },  // # Oys Ship
        { key: 'F', width: 10 },  // $/oys
        { key: 'G', width: 15 },  // Total Value
        { key: 'H', width: 15 },  // sum, $ (Billing)
        { key: 'I', width: 12 },  // Chk Date
        { key: 'J', width: 15 },  // Value
        { key: 'K', width: 12 },  // Check No.
        { key: 'L', width: 15 },  // sum,$ (Receipts)
        { key: 'M', width: 15 },  // Outstanding
    ];

    // Title row
    worksheet.mergeCells('B1:M1');
    const titleCell = worksheet.getCell('B1');
    titleCell.value = `${selectedYear} Invoices and Receipts`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'left' };

    // Section headers
    worksheet.mergeCells('C2:H2');
    const billingHeader = worksheet.getCell('C2');
    billingHeader.value = 'BILLING';
    billingHeader.font = { bold: true };
    billingHeader.alignment = { horizontal: 'center' };
    billingHeader.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } };

    worksheet.mergeCells('I2:L2');
    const receiptsHeader = worksheet.getCell('I2');
    receiptsHeader.value = 'RECEIPTS';
    receiptsHeader.font = { bold: true };
    receiptsHeader.alignment = { horizontal: 'center' };
    receiptsHeader.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } };

    // Column headers (row 3)
    const headers = ['', '', 'Inv. No.', 'Date', '# Oys Ship', '$/oys', 'Total Value', 'sum, $', 'Chk Date', 'Value', 'Check No.', 'sum,$', 'Outstan'];
    const headerRow = worksheet.getRow(3);
    headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center' };
        if (index >= 2) {
            cell.border = { bottom: { style: 'thin' } };
        }
    });

    // Group invoices by customer
    const customerInvoices = new Map<string, typeof invoices>();
    invoices.forEach(inv => {
        const customerName = inv.customerName;
        if (!customerInvoices.has(customerName)) {
            customerInvoices.set(customerName, []);
        }
        customerInvoices.get(customerName)!.push(inv);
    });

    let currentRow = 4;

    // Write data for each customer
    customerInvoices.forEach((custInvoices, customerName) => {
        // Customer name row
        const customerRow = worksheet.getRow(currentRow);
        customerRow.getCell(2).value = customerName;
        customerRow.getCell(2).font = { bold: true };
        currentRow++;

        let customerBillingTotal = 0;
        let customerReceiptsTotal = 0;

        // Invoice rows
        custInvoices.forEach(inv => {
            const row = worksheet.getRow(currentRow);

            // Calculate total oysters shipped
            const totalOysters = inv.items.reduce((sum, item) => sum + item.quantity, 0);
            const avgPricePerOyster = totalOysters > 0 ? inv.total / totalOysters : 0;

            // Billing columns
            row.getCell(3).value = inv.invoiceNumber.replace('INV-', '');
            row.getCell(4).value = new Date(inv.shippingDate || inv.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            row.getCell(5).value = totalOysters;
            row.getCell(6).value = avgPricePerOyster;
            row.getCell(6).numFmt = '0.00';
            row.getCell(7).value = inv.total;
            row.getCell(7).numFmt = '"$"#,##0.00';

            customerBillingTotal += inv.total;

            // Receipts columns (for paid invoices)
            if (inv.status === 'paid' && inv.paidAt) {
                row.getCell(9).value = new Date(inv.paidAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                row.getCell(10).value = inv.total;
                row.getCell(10).numFmt = '"$"#,##0.00';
                row.getCell(11).value = inv.checkNumber || '';
                customerReceiptsTotal += inv.total;
            }

            currentRow++;
        });

        // Cumulative row
        const cumRow = worksheet.getRow(currentRow);
        cumRow.getCell(2).value = 'Cum';
        cumRow.getCell(8).value = customerBillingTotal;
        cumRow.getCell(8).numFmt = '"$"#,##0.00';
        cumRow.getCell(12).value = customerReceiptsTotal;
        cumRow.getCell(12).numFmt = '"$"#,##0.00';
        currentRow++;

        // Outstanding row
        const outstandingRow = worksheet.getRow(currentRow);
        outstandingRow.getCell(2).value = 'Outstanding';
        outstandingRow.getCell(2).font = { color: { argb: 'FF0000FF' } };
        const outstanding = customerBillingTotal - customerReceiptsTotal;
        outstandingRow.getCell(13).value = outstanding;
        outstandingRow.getCell(13).numFmt = '"$"#,##0.00';
        outstandingRow.getCell(13).font = { color: { argb: 'FF0000FF' } };
        currentRow++;

        // Empty row between customers
        currentRow++;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${selectedYear}_Invoices_and_Receipts.xlsx"`);

    res.send(buffer);
});

// @desc    Get dashboard overview
// @route   GET /api/reports/dashboard
// @access  Private
export const getDashboardOverview = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);

    // Get counts
    const [totalCustomers, totalOrders, totalInvoices, invoices] = await Promise.all([
        Customer.countDocuments(),
        Order.countDocuments(),
        Invoice.countDocuments(),
        Invoice.find({ createdAt: { $gte: yearStart, $lt: yearEnd } })
    ]);

    // Calculate totals
    const yearlyRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');

    const paidTotal = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const outstandingTotal = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const response: ApiResponse = {
        success: true,
        data: {
            totalCustomers,
            totalOrders,
            totalInvoices,
            yearlyRevenue,
            paidTotal,
            outstandingTotal,
            invoicesByStatus: {
                draft: invoices.filter(inv => inv.status === 'draft').length,
                sent: invoices.filter(inv => inv.status === 'sent').length,
                paid: invoices.filter(inv => inv.status === 'paid').length
            }
        }
    };

    res.status(200).json(response);
});
