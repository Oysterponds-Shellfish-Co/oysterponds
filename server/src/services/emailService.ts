import { Resend } from 'resend';

// Company info for emails
const COMPANY_INFO = {
    name: 'Oysterponds Shellfish Co.',
    internalEmails: [
        'phil@oysterpondsshellfish.com',
        'holly@oysterpondsshellfish.com',
    ],
};

// Initialize Resend client
const getResendClient = (): Resend => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error('RESEND_API_KEY environment variable is not set');
    }
    return new Resend(apiKey);
};

// The "from" address - must be a verified domain in Resend, or use onboarding address
const getFromAddress = (): string => {
    return process.env.RESEND_FROM_EMAIL || 'Oysterponds Shellfish Co. <phil@oysterpondsshellfish.com>';
};

// Generate invoice email HTML
const generateInvoiceEmailHTML = (invoiceData: {
    invoiceNumber: string;
    customerName: string;
    total: number;
    shippingDate: string | Date;
}): string => {
    const formattedDate = new Date(invoiceData.shippingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #2c5d63;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 0 0 8px 8px;
            }
            .invoice-details {
                background-color: white;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
                border-bottom: none;
                font-weight: bold;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">OYSTERPONDS SHELLFISH CO.</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Invoice Notification</p>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>Please find attached your invoice from Oysterponds Shellfish Co.</p>
                
                <div class="invoice-details">
                    <div class="detail-row">
                        <span>Invoice Number:</span>
                        <span>${invoiceData.invoiceNumber}</span>
                    </div>
                    <div class="detail-row">
                        <span>Customer:</span>
                        <span>${invoiceData.customerName}</span>
                    </div>
                    <div class="detail-row">
                        <span>Shipping Date:</span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span>Total Amount:</span>
                        <span>$${invoiceData.total.toFixed(2)}</span>
                    </div>
                </div>

                <p>Please remit payment to:</p>
                <p style="padding-left: 20px;">
                    <strong>Oysterponds Shellfish Co.</strong><br>
                    PO Box 513, Orient, NY 11957
                </p>
                
                <p style="margin-top: 20px;">For ACH payment inquiries, please contact:<br>
                <a href="mailto:phil@oysterpondsshellfish.com">phil@oysterpondsshellfish.com</a></p>
            </div>
            <div class="footer">
                <p>Oysterponds Shellfish Co.<br>
                PO Box 513, Orient, NY 11957<br>
                631.721.7117 • www.oysterpondsshellfish.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Send invoice email via Resend
export const sendInvoiceEmail = async (
    recipientEmails: string[],
    invoiceData: {
        invoiceNumber: string;
        customerName: string;
        total: number;
        shippingDate: string | Date;
    },
    pdfBuffer: Buffer,
    shippingTagBuffer?: Buffer
): Promise<{ success: boolean; sentTo: string[]; error?: string }> => {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
        console.warn('Resend not configured. Email not sent.');
        return {
            success: false,
            sentTo: [],
            error: 'Email not configured. Please set RESEND_API_KEY environment variable.',
        };
    }

    try {
        const resend = getResendClient();

        // Always include internal emails (phil + holly)
        const allRecipients = Array.from(new Set([
            ...recipientEmails,
            ...COMPANY_INFO.internalEmails
        ])).filter(Boolean);

        // Build attachments array
        const attachments: { filename: string; content: Buffer }[] = [
            {
                filename: `${invoiceData.invoiceNumber}.pdf`,
                content: pdfBuffer,
            },
        ];

        // Add shipping tag if provided
        if (shippingTagBuffer) {
            attachments.push({
                filename: `${invoiceData.invoiceNumber}-ShippingTag.pdf`,
                content: shippingTagBuffer,
            });
        }

        const { error } = await resend.emails.send({
            from: getFromAddress(),
            to: allRecipients,
            subject: `Invoice ${invoiceData.invoiceNumber} - ${invoiceData.customerName} - Oysterponds Shellfish Co.`,
            html: generateInvoiceEmailHTML(invoiceData),
            attachments,
        });

        if (error) {
            console.error('Resend error:', error);
            return {
                success: false,
                sentTo: [],
                error: error.message || 'Failed to send email via Resend',
            };
        }

        console.log(`Invoice email sent to: ${allRecipients.join(', ')}${shippingTagBuffer ? ' (with shipping tag)' : ''}`);

        return {
            success: true,
            sentTo: allRecipients,
        };
    } catch (error) {
        console.error('Error sending invoice email:', error);
        return {
            success: false,
            sentTo: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

// Get internal email addresses
export const getInternalEmails = (): string[] => {
    return COMPANY_INFO.internalEmails;
};
