import dotenv from 'dotenv';
dotenv.config();


import { connectDB } from '../config/db.js';
import { Order, Invoice, Product } from '../models/index.js';

const cleanTestData = async (): Promise<void> => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Count existing data
        const orderCount = await Order.countDocuments();
        const invoiceCount = await Invoice.countDocuments();

        console.log(`\nFound ${orderCount} orders and ${invoiceCount} invoices`);

        // Delete all orders and invoices
        if (orderCount > 0 || invoiceCount > 0) {
            console.log('\nDeleting all orders...');
            const deletedOrders = await Order.deleteMany({});
            console.log(`Deleted ${deletedOrders.deletedCount} orders`);

            console.log('Deleting all invoices...');
            const deletedInvoices = await Invoice.deleteMany({});
            console.log(`Deleted ${deletedInvoices.deletedCount} invoices`);
        } else {
            console.log('No test data to clean. Database is already empty.');
        }

        // Ensure "Adjustment" product exists
        const adjustmentExists = await Product.findOne({ name: 'Adjustment' });
        if (!adjustmentExists) {
            await Product.create({
                name: 'Adjustment',
                description: 'Reimbursement or temporary discount adjustment',
                basePrice: 0,
                unit: 'piece',
                active: true,
            });
            console.log('\n✅ Created "Adjustment" product');
        } else {
            console.log('\n"Adjustment" product already exists');
        }

        console.log('\n✅ All test data cleaned successfully!');
        console.log('Next order will start at: 16001');
        console.log('Next invoice will start at: INV-16001');
        console.log('\nProducts, customers, and harvest locations are preserved.');

        process.exit(0);
    } catch (error) {
        console.error('Error cleaning test data:', error);
        process.exit(1);
    }
};

cleanTestData();
