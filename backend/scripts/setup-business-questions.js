const { Client } = require('pg');
require('dotenv').config();

async function setupBusinessQuestions() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Create Business Questions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS business_questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                category VARCHAR(255) NOT NULL,
                question TEXT NOT NULL,
                options JSONB NOT NULL,
                is_active BOOLEAN DEFAULT true,
                "order" INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table business_questions verified/created');

        // Create Vendor Attributes Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendor_attributes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                attribute_key VARCHAR(255) NOT NULL,
                attribute_value TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table vendor_attributes verified/created');

        // Check if index exists
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_vendor_attributes_vendor_id ON vendor_attributes(vendor_id);
            CREATE INDEX IF NOT EXISTS idx_vendor_attributes_key ON vendor_attributes(attribute_key);
        `);

        // Seed initial questions if none exist
        const { rows } = await client.query('SELECT count(*) FROM business_questions');
        if (parseInt(rows[0].count) === 0) {
            console.log('Seeding initial questions...');
            
            const questions = [
                {
                    category: 'Business Type',
                    question: 'Where does your business operate?',
                    options: JSON.stringify(['Physical Location', 'Home-Based Business', 'Online / Digital Only', 'On-Site at Client Location', 'Mobile Unit']),
                    order: 1
                },
                {
                    category: 'Core Business Nature',
                    question: 'What does your business primarily do?',
                    options: JSON.stringify(['We sell physical products', 'We sell digital products', 'We provide in-person services', 'We provide online or remote services', 'We offer delivery to customers']),
                    order: 2
                },
                {
                    category: 'Operational Structure',
                    question: 'How does your business operate?',
                    options: JSON.stringify(['Manufacturer', 'Retailer', 'Wholesaler', 'Distributor', 'Consulting / Advisory', 'Repair & Maintenance', 'Individual / Freelancer', 'Private Company']),
                    order: 3
                },
                {
                    category: 'Who Do You Serve',
                    question: 'Who are your primary customers?',
                    options: JSON.stringify(['B2C - Individual Consumers', 'B2B - Other Businesses', 'B2G - Government & Public Sector', 'D2C - Direct to Consumer', 'Wholesale Buyers', 'International Clients']),
                    order: 4
                },
                {
                    category: 'Contact Details',
                    question: 'How can customers reach you?',
                    options: JSON.stringify(['Primary Phone', 'WhatsApp Number', 'Additional Phone Numbers (up to 5 on paid plan)', 'Business Email', 'Website URL']),
                    order: 5
                },
                {
                    category: 'Business Hours',
                    question: 'When are you open?',
                    options: JSON.stringify(['Monday Open', 'Tuesday Open', 'Wednesday Open', 'Thursday Open', 'Friday Open', 'Saturday Open', 'Sunday Open', 'Open 24/7']),
                    order: 6
                },
                {
                    category: 'Business Description',
                    question: 'Tell customers about your business',
                    options: JSON.stringify(['Business Description Added', 'Business Languages Added']),
                    order: 7
                },
                {
                    category: 'Experience & Team',
                    question: 'Tell us about your business maturity and team size',
                    options: JSON.stringify(['Year Established Added', 'Just Me (Solo)', '2-5 Employees', '6-10 Employees', '11-25 Employees', '26-50 Employees', '51+ Employees']),
                    order: 8
                },
                {
                    category: 'Website & Social Media',
                    question: 'Where else can customers find you online?',
                    options: JSON.stringify(['Website', 'Facebook', 'Instagram', 'YouTube', 'LinkedIn', 'TikTok', 'X / Twitter', 'Pinterest', 'Snapchat']),
                    order: 9
                },
                {
                    category: 'Keywords',
                    question: 'Add keywords that describe your business',
                    options: JSON.stringify(['Local Service', 'Professional', 'Trusted', 'Affordable', 'Emergency', 'Premium', 'Family Friendly', 'Fast Response', 'Certified', '24/7']),
                    order: 10
                },
                {
                    category: 'FAQs',
                    question: 'Add FAQs to help customers quickly',
                    options: JSON.stringify(['Pricing FAQ Added', 'Service Area FAQ Added', 'Opening Hours FAQ Added', 'Appointment FAQ Added', 'Payment Methods FAQ Added']),
                    order: 11
                },
                {
                    category: 'Logo & Cover Image',
                    question: 'Upload profile media for your business',
                    options: JSON.stringify(['Logo (Recommended 400x400)', 'Cover Image (Recommended 1200x400)', 'Gallery Images Added', 'Album Grouping Enabled']),
                    order: 12
                },
                {
                    category: 'Amenities & Facilities',
                    question: 'What does your location offer?',
                    options: JSON.stringify(['Physical Location', 'Online Business', 'Delivery Available', '24/7 Open', 'Free Wi-Fi', 'Parking Available', 'Wheelchair Accessible', 'Female Staff Available', 'Home Service', 'In-store / Studio', 'Online / Virtual', 'Emergency Services', 'Cash Accepted', 'Card Accepted', 'Bank Transfer', 'Mobile Wallet', 'Online Payment']),
                    order: 13
                },
                {
                    category: 'Industry Sub-Type',
                    question: 'Does your business fall into specialised sectors?',
                    options: JSON.stringify(['Factory', 'Manufacturing Unit', 'Industrial Supplier', 'Warehouse', 'Seed Store', 'Dairy Farm', 'Poultry Farm', 'Agricultural Equipment']),
                    order: 14
                },
                {
                    category: 'Business Opportunities & Expansion',
                    question: 'Do you offer expansion or partnership opportunities?',
                    options: JSON.stringify(['Franchise Opportunities', 'Dealers / Resellers Needed', 'Importer / Exporter', 'Local Service Area', 'National Service Area', 'International Service Area']),
                    order: 15
                },
                {
                    category: 'Map Confirmation',
                    question: 'Confirm your location on map',
                    options: JSON.stringify(['Pin Confirmed']),
                    order: 16
                }
            ];

            for (const q of questions) {
                await client.query(
                    'INSERT INTO business_questions (category, question, options, "order") VALUES ($1, $2, $3, $4)',
                    [q.category, q.question, q.options, q.order]
                );
            }
            console.log('Questions seeded successfully');
        } else {
            console.log('Questions already exist, skipping seed.');
            await client.query(`
                UPDATE business_questions
                SET category = 'Amenities & Facilities'
                WHERE category IN ('Payment Methods', 'Service Mode', 'Business Features');
            `);
            console.log('Legacy question categories normalized to Amenities & Facilities');
        }

    } catch (err) {
        console.error('Error during setup:', err);
    } finally {
        await client.end();
    }
}

setupBusinessQuestions();
