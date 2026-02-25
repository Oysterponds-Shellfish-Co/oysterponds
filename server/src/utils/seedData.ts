import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Product, Customer, HarvestLocation, Order } from '../models/index.js';

// Seed data for products
const products = [
    {
        name: 'OSC Selects',
        description: 'Premium choice oysters, hand-selected for quality',
        basePrice: 0.80,
        unit: 'oyster',
    },
    {
        name: 'OSC Grandes',
        description: 'Large premium oysters with deep cups',
        basePrice: 0.80,
        unit: 'oyster',
    },
    {
        name: 'OP Pearls',
        description: 'Small, delicate oysters with a briny finish',
        basePrice: 0.80,
        unit: 'oyster',
    },
    {
        name: 'Torrisi Premium Pearls',
        description: 'Premium signature oysters for discerning palates',
        basePrice: 0.80,
        unit: 'oyster',
    },
    {
        name: "Pipe's Cove Darlings",
        description: 'Sweet, buttery oysters from Pipe\'s Cove',
        basePrice: 0.80,
        unit: 'oyster',
    },
    {
        name: 'Naked Cowboy',
        description: 'Bold, briny oysters with a clean finish',
        basePrice: 0.80,
        unit: 'oyster',
    },
    {
        name: 'Adjustment',
        description: 'Reimbursement or temporary discount adjustment',
        basePrice: 0,
        unit: 'piece',
    },
];

// Seed data for harvest locations
const harvestLocations = [
    { code: 'P6NY GPT', name: 'P6NY GPT' },
    { code: 'P8NY OC', name: 'P8NY OC' },
    { code: 'P8NY T-10', name: 'P8NY T-10' },
    { code: 'P8NY T-13', name: 'P8NY T-13' },
];

// Helper to generate slug from business name
const generateSlug = (businessName: string): string => {
    return businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// Helper to check if value is valid (not NaN or null/undefined)
const isValid = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'number' && isNaN(value)) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
};

// Real customer data from client
const rawCustomerData = [
    { "Business": "American Beech", "Contact Person #1": "Allen", "Custom Pricing": 0.75, "Accounting Person Email": "accounting@americanbeeech.com" },
    { "Business": "Angelo's", "Contact Person #1": "Oscar Canales", "Custom Pricing": 0.75 },
    { "Business": "Belo", "Contact Person #1": "Jonathan", "Custom Pricing": 0.70 },
    { "Business": "Billy's By The Bay", "Contact Person #1": "Lisa", "Custom Pricing": 0.75 },
    { "Business": "Blue Island", "Contact Person #1": "Kevin", "Custom Pricing": 0.65 },
    { "Business": "Braun's Seafood", "Contact Person #1": "Keith", "Custom Pricing": 0.65 },
    { "Business": "Catanese", "Contact Person #1": "Mike M", "Custom Pricing": 0.80, "Accounting Person": "Karen Shumaker", "Accounting phone": "216.696.0080 ext 306", "Accounting Person Email": "karen.shumaker@cataneseclassics.com", "Additional accounting email": "ap@cataneseclassics.com" },
    { "Business": "The Century Association", "Contact Person #1": "Jean Claude Torres", "Custom Pricing": 0.75, "Accounting Person Email": "danielle@thecentury.org" },
    { "Business": "Cook Shop", "Contact Person #1": "Chef Wil", "Custom Pricing": 0.70 },
    { "Business": "Crab Addicts", "Contact Person #1": "Charlie Gill" },
    { "Business": "Craft NYC", "Contact Person #1": "Chef Rigoberto", "Custom Pricing": 0.75, "Accounting Person": "Irene Costello", "Accounting phone": "914.497.9646", "Accounting Person Email": "accountssb@craftedhospitality.com", "Additional accounting email": "SBBOH@smallbatchrestaurant.com", "Notes:": "These guys pay ACH 30-40 days. WE have to look it up in bank account as they do not notify of payment 12/1/25" },
    { "Business": "Crown Alley", "Contact Person #1": "Barry Ahern", "Custom Pricing": 0.75, "Payment Alias": "CKBA" },
    { "Business": "Down East Seafood", "Contact Person #1": "Mark Jehan", "Custom Pricing": 0.70, "Accounting Person": "Dharm Sharma", "Accounting Person Email": "dsharma@downeastseafoodny.com", "Additional accounting email": "ap_east@fpw", "Payment Alias": "Chefs Warehouse - CDA", "Payment Method": "ACH", "Notes:": "Nightmare so far with accounting - keep these emails Joe Cooper <JCooper@downeastseafoodny.com>, Phil Mastrangelo <phil@oysterpondsshellfish.com>, Adam Witkowski <AWitkowski@chefswarehouse.com>, Andrea White <ACleary@cambridgepacking.com>, Susan Stanowski <SStanowski@fpwmeats.com>, Nicole Hernandez <NHernandez@downeastseafoodny.com>, Dharm Sharma <DSharma@downeastseafoodny.com>, AP East <AP_East@fpwmeats.com>, Kc Boyle <KCBoyle@chefswarehouse.com>, Ellen Winfree <EWinfree@chefswarehouse.com> - ALSO: invoices@downeastseafoodny.com, for Outstanding: MPCASTRO@downeastseafoodny.com" },
    { "Business": "Dune Deck", "Contact Person #1": "Paul", "Custom Pricing": 0.75, "Accounting Person": "Cindy", "Accounting Person Email": "chussey@dunedeckclub.com", "Payment Alias": "The Hills Golf Club" },
    { "Business": "Duryea's Orient Point", "Contact Person #1": "Chef David", "Custom Pricing": 0.80, "Accounting Person": "Pamela Heiman", "Accounting Person Email": "accountingop@duryeas.com", "Payment Alias": "MGHE" },
    { "Business": "Feed & Grain", "Contact Person #1": "John Murn", "Custom Pricing": 0.80 },
    { "Business": "First & South", "Contact Person #1": "Sarah", "Custom Pricing": 0.75, "Payment Alias": "More To Come" },
    { "Business": "The Fulton", "Contact Person #1": "Chef Lei", "Custom Pricing": 0.75, "Accounting Person": "lei.Jiang@seaportentertainment.com", "Accounting Person Email": "ap@seaportentertainment.com", "Additional accounting email": "ljiang@creativeculinarymgmt.com", "Payment Alias": "Seaport Entertainment" },
    { "Business": "Go Fish", "Contact Person #1": "Sam Cantor", "Custom Pricing": 0.68, "Email": "sam@gofish-co.com" },
    { "Business": "Haoban", "Contact Person #1": "Mack Chen", "Custom Pricing": 0.80 },
    { "Business": "The Jeffrey", "Contact Person #1": "Colm Kirwan", "Custom Pricing": 0.75, "Payment Alias": "60th Street" },
    { "Business": "Jeffrey's Grocery", "Contact Person #1": "Matt Griffin", "Custom Pricing": 0.75, "Accounting Person Email": "billing@happycookingnyc.com", "Additional accounting email": "gabriel@happycookingnyc.com", "Payment Alias": "Penmanship" },
    { "Business": "Lamonte", "Contact Person #1": "Victor Ridi", "Custom Pricing": 0.75, "Payment Alias": "Spectacular Bird", "Notes:": "Phil takes care as of now" },
    { "Business": "Little Creek", "Contact Person #1": "Ian & Rosalie", "Custom Pricing": 0.70 },
    { "Business": "Lobster Place Manhattan", "Contact Person #1": "Gina", "Custom Pricing": 0.75, "Email": "ap@lobsterplace.com", "Accounting Person": "Liza Gonzalez / Felix Castellanos", "Accounting Person Email": "lizag@lpbrandsnyc.com", "Additional accounting email": "felixc@lpbrandsnyc.com" },
    { "Business": "Luca", "Contact Person #1": "Chef Luke", "Custom Pricing": 0.75, "Contact Person #2": "Paul", "Payment Alias": "SBRG93" },
    { "Business": "Maison Premiere", "Contact Person #1": "Krystof", "Custom Pricing": 0.78, "Accounting Person Email": "maisonpremiere@paperchase.ac", "Payment Alias": "MP Syndicate" },
    { "Business": "Maroni Northport", "Contact Person #1": "Maria", "Custom Pricing": 0.75 },
    { "Business": "Maroni Southold", "Contact Person #1": "Kristin", "Custom Pricing": 0.75 },
    { "Business": "Mill Pond", "Contact Person #1": "Chef Ronaldo", "Custom Pricing": 0.80, "Accounting Person Email": "info@millpondrestaurant.com", "Additional accounting email": "david@imianhospitality.com", "Contact Person #2": "David Clark", "Payment Alias": "RTMPR LLC or TOAST" },
    { "Business": "Noah's", "Contact Person #1": "Noah", "Custom Pricing": 0.75 },
    { "Business": "Opti's & Dinghies", "Contact Person #1": "Claudia" },
    { "Business": "Opus", "Contact Person #1": "Chef Richie", "Custom Pricing": 0.75, "Email": "christopherm@scottorestaurant.com" },
    { "Business": "Pangea", "Contact Person #1": "Nick Happnie", "Custom Pricing": 0.55, "Accounting Person": "Mark/Patti", "Accounting Person Email": "mark@pangeashellfish.com", "Additional accounting email": "patti@pangeashellfish.com" },
    { "Business": "Piccolo", "Contact Person #1": "Chef Willie", "Custom Pricing": 0.75, "Accounting Person": "Marcy", "Accounting phone": "631.424.3505", "Accounting Person Email": "marier.piccolo@gmail.com" },
    { "Business": "Pipe's Cove Oyster Co/Sip n Guzzle", "Contact Person #1": "Alex", "Custom Pricing": 0.65 },
    { "Business": "Pipe's Cove Oyster Co/Silver Sands", "Contact Person #1": "Alex", "Custom Pricing": 0.65 },
    { "Business": "Salt & Barrel", "Contact Person #1": "Morgan Flynn", "Custom Pricing": 0.75 },
    { "Business": "Samuel's", "Contact Person #1": "Paul Jambor", "Custom Pricing": 0.65, "Accounting Person Email": "jackiep@samuelsseafood.com", "Notes:": "Christy set up ACH 215.336.7810 ext 6583 5/28/25 - net 30 leave invoices with paperwork" },
    { "Business": "Small Batch", "Contact Person #1": "Chef Jonathan", "Custom Pricing": 0.75, "Accounting Person": "Irene", "Accounting Person Email": "accountsSB@craftedhospitality.com", "Additional accounting email": "sbboh@smallbatchrestaurant.com", "Payment Alias": "Craft LI", "Payment Method": "ACH" },
    { "Business": "Southold Fish Market", "Contact Person #1": "Candice", "Custom Pricing": 0.65 },
    { "Business": "Sunset Beach", "Contact Person #1": "Alex Apparu", "Custom Pricing": 0.80, "Email": "alex@sunsetbeach.fun", "Accounting Person Email": "sunsetbeach@paperchase.ac" },
    { "Business": "Torrisi", "Contact Person #1": "Chef Don", "Custom Pricing": 0.90, "Email": "luverie@majorfood.com", "Accounting Person": "jtorregrosa@majorfood.com", "Payment Alias": "Mulberry Street", "Notes:": "Restaurant 365" },
    { "Business": "Upstate NYC", "Contact Person #1": "Shane Covey", "Custom Pricing": 0.75, "Email": "shanecovey@gmail.com", "Payment Alias": "Marry The Ketchup" },
    { "Business": "Yennicott Oysters", "Contact Person #1": "Meg", "Custom Pricing": 0.70 },
];

// Create customers from raw data
const createCustomers = (productIds: mongoose.Types.ObjectId[]) => {
    return rawCustomerData.map((raw) => {
        const customPrice = raw["Custom Pricing"];

        // Create custom pricing for all products if a custom price is set
        const customPricing = isValid(customPrice)
            ? productIds.map((productId) => ({
                product: productId,
                price: Number(customPrice),
            }))
            : [];

        return {
            businessName: raw["Business"],
            name: raw["Contact Person #1"] || '',
            slug: generateSlug(raw["Business"]),
            contactEmail: (raw as Record<string, unknown>)["Email"] as string || '',
            accountingEmail: raw["Accounting Person Email"] || '',
            additionalAccountingEmail: raw["Additional accounting email"] || '',
            accountingPerson: raw["Accounting Person"] || '',
            accountingPhone: (raw as Record<string, unknown>)["Accounting phone"] as string || '',
            contactPerson2: (raw as Record<string, unknown>)["Contact Person #2"] as string || '',
            paymentAlias: (raw as Record<string, unknown>)["Payment Alias"] as string || '',
            paymentMethod: (raw as Record<string, unknown>)["Payment Method"] as string || '',
            notes: (raw as Record<string, unknown>)["Notes:"] as string || '',
            customPricing,
            reminderEnabled: false,
            reminderDay: 'Monday',
            billingAddress: { street: '', city: '', state: 'NY', zip: '' },
            shippingAddress: { street: '', city: '', state: 'NY', zip: '' },
            phone: '',
        };
    });
};

// Helper to get next Thursday
const getNextThursday = (): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + daysUntilThursday);
    nextThursday.setHours(0, 0, 0, 0);
    return nextThursday;
};

// Seed database
const seedDatabase = async (): Promise<void> => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Clear existing data
        console.log('Clearing existing data...');
        await Promise.all([
            Product.deleteMany({}),
            Customer.deleteMany({}),
            HarvestLocation.deleteMany({}),
            Order.deleteMany({}),
        ]);

        // Seed products
        console.log('Seeding products...');
        const createdProducts = await Product.insertMany(products);
        console.log(`Created ${createdProducts.length} products`);

        // Seed harvest locations
        console.log('Seeding harvest locations...');
        const createdLocations = await HarvestLocation.insertMany(harvestLocations);
        console.log(`Created ${createdLocations.length} harvest locations`);

        // Seed customers
        console.log('Seeding customers...');
        const productIds = createdProducts.map((p) => p._id as mongoose.Types.ObjectId);
        const customersData = createCustomers(productIds);
        const createdCustomers = await Customer.insertMany(customersData);
        console.log(`Created ${createdCustomers.length} customers`);

        // Create a few sample orders
        console.log('Seeding sample orders...');
        const nextThursday = getNextThursday();
        const lastThursday = new Date(nextThursday);
        lastThursday.setDate(lastThursday.getDate() - 7);

        const sampleOrders = [
            {
                orderNumber: '16001',
                customer: createdCustomers[0]._id,
                customerName: createdCustomers[0].businessName,
                harvestLocation: 'P6NY GPT',
                items: [
                    {
                        product: productIds[0],
                        productName: 'OSC Selects',
                        quantity: 200,
                        pricePerUnit: 0.75,
                        lineTotal: 150,
                    },
                ],
                subtotal: 150,
                tax: 0,
                total: 150,
                status: 'pending',
                orderSource: 'internal',
                deliveryDate: nextThursday,
            },
            {
                orderNumber: '16002',
                customer: createdCustomers[5]._id,
                customerName: createdCustomers[5].businessName,
                harvestLocation: 'P8NY OC',
                items: [
                    {
                        product: productIds[2],
                        productName: 'OP Pearls',
                        quantity: 150,
                        pricePerUnit: 0.65,
                        lineTotal: 97.5,
                    },
                ],
                subtotal: 97.5,
                tax: 0,
                total: 97.5,
                status: 'confirmed',
                orderSource: 'customer-portal',
                deliveryDate: nextThursday,
            },
        ];

        await Order.insertMany(sampleOrders);
        console.log(`Created ${sampleOrders.length} sample orders`);

        console.log('\n✅ Database seeded successfully!');
        console.log('\nSummary:');
        console.log(`  - ${createdProducts.length} products`);
        console.log(`  - ${createdLocations.length} harvest locations`);
        console.log(`  - ${createdCustomers.length} customers`);
        console.log(`  - ${sampleOrders.length} sample orders`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
