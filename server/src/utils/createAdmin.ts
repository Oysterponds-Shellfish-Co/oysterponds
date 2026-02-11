import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

const createAdminUser = async (): Promise<void> => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: 'admin@oysterponds.com' });

        if (existingAdmin) {
            console.log('Admin user already exists:');
            console.log(`  Email: ${existingAdmin.email}`);
            console.log(`  Name: ${existingAdmin.name}`);
            console.log('\nTo reset password, delete the user from MongoDB and run this script again.');
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            email: 'admin@oysterponds.com',
            password: 'admin123',
            name: 'Admin',
            role: 'admin',
            isActive: true,
        });

        console.log('\n✅ Admin user created successfully!');
        console.log('\nLogin credentials:');
        console.log(`  Email: ${admin.email}`);
        console.log(`  Password: admin123`);
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser();
