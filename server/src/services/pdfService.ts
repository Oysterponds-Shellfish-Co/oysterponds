import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

// Load logo as base64 data URL
const getLogoBase64 = (): string => {
    try {
        const logoPath = path.join(process.cwd(), 'src', 'templates', 'logo.jpeg');
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const base64 = logoBuffer.toString('base64');
            return `data:image/jpeg;base64,${base64}`;
        }
    } catch (error) {
        console.error('Error loading logo:', error);
    }
    return '';
};

// Company info
const COMPANY_INFO = {
    name: 'Oysterponds Shellfish Co.',
    address: 'PO Box 513, Orient, NY 11957',
    phone: '631.721.7117',
    website: 'www.oysterpondsshellfish.com',
    shipperCertification: 'NY27496SS',
};

// Invoice item interface
interface InvoiceItem {
    productName: string;
    quantity: number;
    pricePerUnit: number;
    lineTotal: number;
}

// Invoice data interface
interface InvoiceData {
    invoiceNumber: string;
    orderNumber: string;
    billTo: {
        businessName: string;
        attention: string;
        address: {
            street: string;
            city: string;
            state: string;
            zip: string;
        };
    };
    shippingDate: Date | string;
    harvestDate: Date | string;
    harvestTime: string;
    harvestLocation: string;
    shipperCertification: string;
    departureTemperature: string;
    timeOnTruck: string;
    deliveredBy: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
}

// Format date
const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
    });
};

// Format currency
const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
};

// Generate invoice HTML
const generateInvoiceHTML = (data: InvoiceData): string => {
    // Load logo as base64
    const logoBase64 = getLogoBase64();

    const itemRows = data.items
        .map(
            (item) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productName}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.pricePerUnit)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.lineTotal)}</td>
            </tr>
        `
        )
        .join('');

    const addressLine = [
        data.billTo.address.street,
        data.billTo.address.city,
        data.billTo.address.state,
        data.billTo.address.zip,
    ]
        .filter(Boolean)
        .join(', ');

    // Logo HTML - only include if logo exists
    const logoHtml = logoBase64
        ? `<img src="${logoBase64}" alt="Oysterponds Logo" style="width: 140px; height: auto; background-color: white;" />`
        : '';


    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                padding: 20px;
            }
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #2c5d63;
            }
            .company-info {
                text-align: center;
                flex: 1;
            }
            .company-name {
                font-size: 22px;
                font-weight: bold;
                color: #2c5d63;
                margin-bottom: 5px;
            }
            .company-details {
                font-size: 11px;
                color: #666;
            }
            .invoice-title {
                text-align: right;
            }
            .invoice-number {
                font-size: 24px;
                font-weight: bold;
                color: #2c5d63;
            }
            .section {
                margin-bottom: 15px;
                padding: 10px;
                background-color: #f8f9fa;
                border-radius: 4px;
            }
            .section-title {
                font-weight: bold;
                color: #2c5d63;
                margin-bottom: 8px;
                font-size: 11px;
                text-transform: uppercase;
            }
            .row {
                display: flex;
                gap: 20px;
                margin-bottom: 10px;
            }
            .col {
                flex: 1;
            }
            .field {
                margin-bottom: 5px;
            }
            .field-label {
                font-weight: bold;
                color: #555;
                font-size: 10px;
            }
            .field-value {
                font-size: 12px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }
            th {
                background-color: #2c5d63;
                color: white;
                padding: 10px 8px;
                text-align: left;
                font-size: 11px;
            }
            th:nth-child(2), th:nth-child(3), th:nth-child(4) {
                text-align: center;
            }
            th:last-child {
                text-align: right;
            }
            .totals {
                margin-top: 20px;
                text-align: right;
            }
            .total-row {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 5px;
            }
            .total-label {
                font-weight: bold;
                margin-right: 20px;
                min-width: 100px;
            }
            .total-value {
                min-width: 100px;
                text-align: right;
            }
            .grand-total {
                font-size: 16px;
                color: #2c5d63;
                border-top: 2px solid #2c5d63;
                padding-top: 10px;
                margin-top: 10px;
            }
            .compliance-section {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            .remittance {
                margin-top: 30px;
                padding: 15px;
                background-color: #2c5d63;
                color: white;
                text-align: center;
                border-radius: 4px;
            }
            .remittance-title {
                font-weight: bold;
                margin-bottom: 8px;
            }
            @media print {
                body {
                    padding: 0;
                }
                .invoice-container {
                    padding: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="header">
                <div style="width: 140px;">${logoHtml}</div>
                <div class="company-info">
                    <div class="company-name">OYSTERPONDS SHELLFISH CO.</div>
                    <div class="company-details">
                        ${COMPANY_INFO.address}<br>
                        ${COMPANY_INFO.phone} • ${COMPANY_INFO.website}
                    </div>
                </div>
                <div class="invoice-title">
                    <div style="font-size: 12px; color: #666;">INVOICE</div>
                    <div class="invoice-number">${data.invoiceNumber.replace('INV-', '')}</div>
                    <div style="font-size: 10px; color: #888; margin-top: 4px;">Order #${data.orderNumber}</div>
                </div>
            </div>

            <!-- Shipping & Harvest Info -->
            <div class="section">
                <div class="row">
                    <div class="col">
                        <div class="field">
                            <span class="field-label">SHIPPING DATE:</span>
                            <span class="field-value">${formatDate(data.shippingDate)}</span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="field">
                            <span class="field-label">HARVEST TIME:</span>
                            <span class="field-value">${data.harvestTime}</span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="field">
                            <span class="field-label">HARVEST DATE:</span>
                            <span class="field-value">${formatDate(data.harvestDate)}</span>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <div class="field">
                            <span class="field-label">HARVEST LOCATION:</span>
                            <span class="field-value">${data.harvestLocation}</span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="field">
                            <span class="field-label">SHIPPERS CERTIFICATION:</span>
                            <span class="field-value">${data.shipperCertification}</span>
                        </div>
                    </div>
                    <div class="col"></div>
                </div>
            </div>

            <!-- Bill To -->
            <div class="section">
                <div class="row">
                    <div class="col">
                        <div class="field">
                            <span class="field-label">BILL TO:</span>
                            <span class="field-value" style="font-weight: bold;">${data.billTo.businessName}</span>
                        </div>
                        ${addressLine ? `<div class="field-value" style="margin-left: 45px; font-size: 11px;">${addressLine}</div>` : ''}
                    </div>
                    <div class="col">
                        <div class="field">
                            <span class="field-label">ATTENTION:</span>
                            <span class="field-value">${data.billTo.attention || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <table>
                <thead>
                    <tr>
                        <th style="width: 40%;">Description</th>
                        <th style="width: 15%;">Quantity</th>
                        <th style="width: 20%;">Unit Price</th>
                        <th style="width: 25%;">Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows}
                </tbody>
            </table>

            <!-- Totals -->
            <div class="totals">
                ${data.tax > 0 ? `
                <div class="total-row">
                    <span class="total-label">Subtotal:</span>
                    <span class="total-value">${formatCurrency(data.subtotal)}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">Tax:</span>
                    <span class="total-value">${formatCurrency(data.tax)}</span>
                </div>
                ` : ''}
                <div class="total-row grand-total">
                    <span class="total-label">TOTAL:</span>
                    <span class="total-value">${formatCurrency(data.total)}</span>
                </div>
            </div>

            <!-- Compliance Footer -->
            <div class="section" style="margin-top: 20px;">
                <div class="compliance-section">
                    <div class="field">
                        <span class="field-label">TIME ON TRUCK:</span>
                        <span class="field-value">${data.timeOnTruck || '-'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">SHIPPED AT OR BELOW 45°F:</span>
                        <span class="field-value">${data.departureTemperature || '-'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">DELIVERED BY:</span>
                        <span class="field-value">${data.deliveredBy || '-'}</span>
                    </div>
                </div>
            </div>

            <!-- Remittance -->
            <div class="remittance">
                <div class="remittance-title">Please remit payment to:</div>
                <div>OYSTERPONDS SHELLFISH CO.</div>
                <div>PO Box 513, Orient, NY 11957</div>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Generate PDF from invoice data
export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<Buffer> => {
    const html = generateInvoiceHTML(invoiceData);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--single-process',
            '--no-zygote',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--no-first-run',
        ],
        ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        }),
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in',
            },
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
};

// Shipping Tag Data Interface
interface ShippingTagData {
    invoiceNumber: string;
    customerName: string;
    harvestDate: Date | string;
    harvestTime: string;
    harvestLocation: string;
    shipperCertification: string;
    departureTemperature: string;
    items: { productName: string; quantity: number }[];
}

// Generate shipping tag HTML
const generateShippingTagHTML = (data: ShippingTagData): string => {
    const logoBase64 = getLogoBase64();
    const logoHtml = logoBase64
        ? `<img src="${logoBase64}" alt="Logo" style="width: 120px; height: auto; background-color: white;" />`
        : '';

    const itemsList = data.items
        .map((item) => `<div style="padding: 4px 0; border-bottom: 1px dashed #ddd;">${item.productName}: <strong>${item.quantity}</strong></div>`)
        .join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: Arial, sans-serif;
                font-size: 11px;
                padding: 15px;
            }
            .tag-container {
                border: 2px solid #2c5d63;
                border-radius: 8px;
                padding: 15px;
                max-width: 400px;
                margin: 0 auto;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #2c5d63;
                padding-bottom: 10px;
                margin-bottom: 10px;
            }
            .company-name {
                font-size: 14px;
                font-weight: bold;
                color: #2c5d63;
            }
            .tag-title {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                color: #2c5d63;
                margin-bottom: 15px;
                text-transform: uppercase;
            }
            .field {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                border-bottom: 1px solid #eee;
            }
            .field-label {
                font-weight: bold;
                color: #555;
            }
            .field-value {
                text-align: right;
            }
            .items-section {
                margin-top: 15px;
                padding: 10px;
                background-color: #f8f9fa;
                border-radius: 4px;
            }
            .items-title {
                font-weight: bold;
                color: #2c5d63;
                margin-bottom: 8px;
            }
            .certification {
                margin-top: 15px;
                padding: 10px;
                background-color: #2c5d63;
                color: white;
                text-align: center;
                border-radius: 4px;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="tag-container">
            <div class="header">
                ${logoHtml}
                <div>
                    <div class="company-name">OYSTERPONDS SHELLFISH CO.</div>
                    <div style="font-size: 10px; color: #666;">Orient, NY 11957</div>
                </div>
            </div>

            <div class="tag-title">Shellfish Shipping Tag</div>

            <div class="field">
                <span class="field-label">Invoice #:</span>
                <span class="field-value">${data.invoiceNumber}</span>
            </div>
            <div class="field">
                <span class="field-label">Customer:</span>
                <span class="field-value">${data.customerName}</span>
            </div>
            <div class="field">
                <span class="field-label">Harvest Date:</span>
                <span class="field-value">${formatDate(data.harvestDate)}</span>
            </div>
            <div class="field">
                <span class="field-label">Harvest Time:</span>
                <span class="field-value">${data.harvestTime}</span>
            </div>
            <div class="field">
                <span class="field-label">Harvest Location:</span>
                <span class="field-value">${data.harvestLocation || '-'}</span>
            </div>
            <div class="field">
                <span class="field-label">Departure Temp:</span>
                <span class="field-value">${data.departureTemperature}</span>
            </div>

            <div class="items-section">
                <div class="items-title">Products:</div>
                ${itemsList}
            </div>

            <div class="certification">
                NYS Shellfish Shipper Certification: ${data.shipperCertification}
            </div>
        </div>
    </body>
    </html>
    `;
};

// Generate Shipping Tag PDF
export const generateShippingTagPDF = async (tagData: ShippingTagData): Promise<Buffer> => {
    const html = generateShippingTagHTML(tagData);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--single-process',
            '--no-zygote',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--no-first-run',
        ],
        ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        }),
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A5',
            printBackground: true,
            margin: {
                top: '0.3in',
                right: '0.3in',
                bottom: '0.3in',
                left: '0.3in',
            },
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
};
