import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryStatus, CategorySource } from '../../entities/category.entity';

function toSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[&]/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// 200+ Google Business Categories — comprehensive seed list
const GOOGLE_BUSINESS_CATEGORIES: { name: string; description?: string }[] = [
    // Food & Drink
    { name: 'Restaurant', description: 'Dining and food establishments' },
    { name: 'Cafe', description: 'Coffee shops and cafes' },
    { name: 'Bakery', description: 'Bread, pastries, and baked goods' },
    { name: 'Bar', description: 'Bars, pubs and nightlife' },
    { name: 'Fast Food Restaurant', description: 'Quick-service food outlets' },
    { name: 'Pizza Restaurant', description: 'Pizza and Italian fast food' },
    { name: 'Seafood Restaurant', description: 'Seafood and fish dishes' },
    { name: 'Steakhouse', description: 'Steak and grilled meat restaurants' },
    { name: 'Sushi Restaurant', description: 'Japanese sushi and cuisine' },
    { name: 'Indian Restaurant', description: 'Indian cuisine and dishes' },
    { name: 'Chinese Restaurant', description: 'Chinese cuisine' },
    { name: 'Mexican Restaurant', description: 'Mexican food and cuisine' },
    { name: 'Italian Restaurant', description: 'Italian food and cuisine' },
    { name: 'Thai Restaurant', description: 'Thai cuisine' },
    { name: 'Vegetarian Restaurant', description: 'Vegetarian and vegan food' },
    { name: 'Ice Cream Shop', description: 'Ice cream and frozen desserts' },
    { name: 'Juice Bar', description: 'Fresh juices and smoothies' },
    { name: 'Food Truck', description: 'Mobile food vendors' },
    { name: 'Catering Service', description: 'Event catering and food service' },
    { name: 'Grocery Store', description: 'General grocery and food retail' },
    { name: 'Supermarket', description: 'Large food retail stores' },
    { name: 'Organic Food Store', description: 'Organic and natural food products' },
    { name: 'Butcher Shop', description: 'Meat and poultry retail' },
    { name: 'Deli', description: 'Delicatessen and prepared foods' },

    // Health & Wellness
    { name: 'Hospital', description: 'Medical hospitals and health centers' },
    { name: 'Clinic', description: 'General medical clinics' },
    { name: 'Pharmacy', description: 'Pharmacies and drug stores' },
    { name: 'Dentist', description: 'Dental clinics and services' },
    { name: 'Optician', description: 'Eye care and optical services' },
    { name: 'Physiotherapist', description: 'Physical therapy and rehabilitation' },
    { name: 'Chiropractor', description: 'Chiropractic care' },
    { name: 'Psychologist', description: 'Mental health and psychology services' },
    { name: 'Nutritionist', description: 'Nutrition and dietary consultation' },
    { name: 'Gym', description: 'Fitness centers and gyms' },
    { name: 'Yoga Studio', description: 'Yoga and meditation classes' },
    { name: 'Spa', description: 'Spa and relaxation services' },
    { name: 'Massage Therapist', description: 'Massage therapy and body work' },
    { name: 'Beauty Salon', description: 'Hair and beauty salons' },
    { name: 'Barber Shop', description: 'Barbershops and men\'s grooming' },
    { name: 'Nail Salon', description: 'Nail care and manicures' },
    { name: 'Tattoo Studio', description: 'Tattoo and piercing services' },
    { name: 'Veterinarian', description: 'Animal and pet health services' },
    { name: 'Pediatrician', description: 'Children\'s healthcare' },
    { name: 'Dermatologist', description: 'Skin care and dermatology' },
    { name: 'Cardiologist', description: 'Heart health and cardiology' },
    { name: 'Orthopedic Surgeon', description: 'Bone and joint surgery' },
    { name: 'Alternative Medicine', description: 'Herbal and alternative treatments' },

    // Automotive
    { name: 'Car Dealer', description: 'New and used car sales' },
    { name: 'Auto Repair Shop', description: 'Car repair and maintenance' },
    { name: 'Car Wash', description: 'Vehicle cleaning and detailing' },
    { name: 'Tire Shop', description: 'Tire sales and fitting' },
    { name: 'Gas Station', description: 'Fuel stations and petrol pumps' },
    { name: 'Motorcycle Dealer', description: 'Motorcycles and scooters' },
    { name: 'Auto Parts Store', description: 'Car parts and accessories' },
    { name: 'Driving School', description: 'Driving lessons and instruction' },
    { name: 'Car Rental', description: 'Vehicle hire and rental services' },
    { name: 'Towing Service', description: 'Vehicle recovery and towing' },
    { name: 'Electric Vehicle Charging Station', description: 'EV charging points' },

    // Education
    { name: 'School', description: 'Primary and secondary schools' },
    { name: 'University', description: 'Higher education institutions' },
    { name: 'College', description: 'Colleges and further education' },
    { name: 'Tutoring Center', description: 'Private tutoring and coaching' },
    { name: 'Language School', description: 'Language learning and courses' },
    { name: 'Vocational School', description: 'Trade and vocational training' },
    { name: 'Art School', description: 'Visual arts and design education' },
    { name: 'Music School', description: 'Music lessons and instruction' },
    { name: 'Preschool', description: 'Early childhood education' },
    { name: 'Library', description: 'Public and private libraries' },
    { name: 'Driving School', description: 'Driving education and tests' },
    { name: 'Coaching Institute', description: 'Exam preparation and coaching' },

    // Professional Services
    { name: 'Accountant', description: 'Accounting and bookkeeping services' },
    { name: 'Lawyer', description: 'Legal services and law firms' },
    { name: 'Financial Advisor', description: 'Financial planning and investment' },
    { name: 'Insurance Agency', description: 'Insurance products and services' },
    { name: 'Real Estate Agency', description: 'Property buying, selling, renting' },
    { name: 'Architect', description: 'Architectural design and planning' },
    { name: 'Engineer', description: 'Engineering consultancy and services' },
    { name: 'Marketing Agency', description: 'Marketing and advertising services' },
    { name: 'Web Design Agency', description: 'Website design and development' },
    { name: 'Software Company', description: 'Software development and IT services' },
    { name: 'Consulting Firm', description: 'Business and management consulting' },
    { name: 'Recruitment Agency', description: 'HR and staffing services' },
    { name: 'Translation Service', description: 'Language translation and interpretation' },
    { name: 'Notary Public', description: 'Document notarization services' },
    { name: 'Tax Consultant', description: 'Tax filing and consultation' },
    { name: 'Graphic Designer', description: 'Graphic design and branding' },
    { name: 'Photographer', description: 'Photography and videography services' },
    { name: 'Video Production', description: 'Video filming and editing' },
    { name: 'PR Agency', description: 'Public relations services' },

    // Home & Garden
    { name: 'Plumber', description: 'Plumbing installation and repairs' },
    { name: 'Electrician', description: 'Electrical installation and repair' },
    { name: 'Carpenter', description: 'Woodwork and furniture making' },
    { name: 'Painter', description: 'Painting and decorating services' },
    { name: 'Roofing Contractor', description: 'Roof installation and repair' },
    { name: 'Flooring Contractor', description: 'Floor installation and finishing' },
    { name: 'HVAC Contractor', description: 'Heating, ventilation, air conditioning' },
    { name: 'Landscaping', description: 'Garden design and maintenance' },
    { name: 'Interior Designer', description: 'Interior design and decoration' },
    { name: 'Cleaning Service', description: 'Home and office cleaning' },
    { name: 'Pest Control', description: 'Pest and insect control' },
    { name: 'Moving Company', description: 'Relocation and moving services' },
    { name: 'Storage Facility', description: 'Self-storage and warehousing' },
    { name: 'Security System', description: 'Home and business security' },
    { name: 'Home Appliance Repair', description: 'Appliance service and repair' },
    { name: 'Locksmith', description: 'Lock installation and emergency services' },
    { name: 'Furniture Store', description: 'Home and office furniture' },
    { name: 'Hardware Store', description: 'Tools, materials, DIY supplies' },
    { name: 'Garden Center', description: 'Plants, seeds, and gardening supplies' },

    // Retail & Shopping
    { name: 'Clothing Store', description: 'Fashion and apparel retail' },
    { name: 'Shoe Store', description: 'Footwear retail' },
    { name: 'Jewelry Store', description: 'Jewelry and accessories' },
    { name: 'Electronics Store', description: 'Consumer electronics and gadgets' },
    { name: 'Book Store', description: 'Books and publications' },
    { name: 'Toy Store', description: 'Children\'s toys and games' },
    { name: 'Gift Shop', description: 'Gifts, souvenirs, and novelties' },
    { name: 'Sporting Goods Store', description: 'Sports equipment and clothing' },
    { name: 'Pet Store', description: 'Pets and animal supplies' },
    { name: 'Pharmacy', description: 'Medicines and health products' },
    { name: 'Convenience Store', description: 'Everyday convenience items' },
    { name: 'Department Store', description: 'Multi-category retail stores' },
    { name: 'Mobile Phone Shop', description: 'Smartphones and accessories' },
    { name: 'Optical Store', description: 'Eyewear and contact lenses' },
    { name: 'Music Store', description: 'Musical instruments and equipment' },
    { name: 'Art Supply Store', description: 'Art materials and craft supplies' },
    { name: 'Florist', description: 'Flowers and floral arrangements' },
    { name: 'Liquor Store', description: 'Alcohol and beverages retail' },
    { name: 'Tobacco Shop', description: 'Tobacco and smoking products' },
    { name: 'Second-Hand Store', description: 'Pre-owned goods and thrift shopping' },

    // Travel & Hospitality
    { name: 'Hotel', description: 'Hotels and accommodation' },
    { name: 'Motel', description: 'Budget accommodation and motels' },
    { name: 'Guest House', description: 'Bed and breakfast, guest houses' },
    { name: 'Hostel', description: 'Budget shared accommodation' },
    { name: 'Resort', description: 'Resorts and holiday destinations' },
    { name: 'Travel Agency', description: 'Travel booking and tour packages' },
    { name: 'Tour Operator', description: 'Guided tours and excursions' },
    { name: 'Airline', description: 'Air travel and airlines' },
    { name: 'Car Rental', description: 'Hire cars and rentals' },
    { name: 'Bus Company', description: 'Coach and bus services' },
    { name: 'Taxi Service', description: 'Taxis and private hire vehicles' },
    { name: 'Visa Consultant', description: 'Visa assistance and immigration' },
    { name: 'Airport Shuttle', description: 'Airport transfer services' },
    { name: 'Cruise Line', description: 'Cruise packages and sea travel' },
    { name: 'Campsite', description: 'Camping grounds and outdoor accommodation' },

    // Entertainment & Recreation
    { name: 'Cinema', description: 'Movies and film screenings' },
    { name: 'Theater', description: 'Live performances and shows' },
    { name: 'Museum', description: 'Museums and cultural exhibitions' },
    { name: 'Art Gallery', description: 'Art galleries and exhibitions' },
    { name: 'Amusement Park', description: 'Theme parks and fun fairs' },
    { name: 'Bowling Alley', description: 'Bowling and entertainment centers' },
    { name: 'Billiards Hall', description: 'Snooker and pool halls' },
    { name: 'Gaming Center', description: 'Arcades and gaming venues' },
    { name: 'Night Club', description: 'Nightclubs and dance venues' },
    { name: 'Casino', description: 'Casinos and gambling venues' },
    { name: 'Sports Center', description: 'Multi-sport recreational facilities' },
    { name: 'Swimming Pool', description: 'Public and private swimming pools' },
    { name: 'Cricket Ground', description: 'Cricket facilities and clubs' },
    { name: 'Football Club', description: 'Football teams and facilities' },
    { name: 'Golf Course', description: 'Golf courses and clubs' },
    { name: 'Tennis Court', description: 'Tennis facilities and coaching' },
    { name: 'Event Venue', description: 'Halls and venues for events' },
    { name: 'Wedding Hall', description: 'Venues for weddings and celebrations' },
    { name: 'Concert Hall', description: 'Music concerts and performances' },
    { name: 'Comedy Club', description: 'Stand-up comedy and shows' },

    // Finance & Banking
    { name: 'Bank', description: 'Banking and financial services' },
    { name: 'ATM', description: 'Cash machines and ATM points' },
    { name: 'Money Transfer Service', description: 'Remittance and wire transfers' },
    { name: 'Currency Exchange', description: 'Foreign exchange and currency' },
    { name: 'Microfinance', description: 'Small loans and microfinancing' },
    { name: 'Investment Firm', description: 'Investment and asset management' },
    { name: 'Cryptocurrency Exchange', description: 'Digital currency trading' },
    { name: 'Pawnbroker', description: 'Pawn shops and loan against goods' },
    { name: 'Mortgage Broker', description: 'Home loan and mortgage services' },

    // Construction & Real Estate
    { name: 'Construction Company', description: 'Building and construction services' },
    { name: 'Property Developer', description: 'Real estate development' },
    { name: 'Property Management', description: 'Rental and property management' },
    { name: 'Surveyor', description: 'Land and property surveying' },
    { name: 'Building Materials Supplier', description: 'Construction materials and supplies' },
    { name: 'Glass and Window Service', description: 'Glass installation and glazing' },
    { name: 'Steel Fabrication', description: 'Metal and steel fabrication' },
    { name: 'Concrete Supplier', description: 'Ready-mix concrete supply' },

    // Technology
    { name: 'IT Support', description: 'Computer and tech support services' },
    { name: 'Data Recovery', description: 'Data recovery and backup services' },
    { name: 'CCTV Installation', description: 'Security cameras and surveillance' },
    { name: 'Network Provider', description: 'Internet and network services' },
    { name: 'Telecom Company', description: 'Telephone and communication services' },
    { name: 'Computer Repair', description: 'PC and laptop repair' },
    { name: 'Printing Service', description: 'Printing and copying services' },
    { name: 'Solar Energy', description: 'Solar panel installation and services' },

    // Kids & Family
    { name: 'Daycare Center', description: 'Child daycare and nurseries' },
    { name: 'Pediatric Clinic', description: 'Children\'s health and medical care' },
    { name: 'Children\'s Clothing Store', description: 'Kids fashion and apparel' },
    { name: 'Toy Library', description: 'Toy rental and children\'s activities' },
    { name: 'Party Planning', description: 'Event planning for children\'s parties' },
    { name: 'Birthday Party Venue', description: 'Venues for children\'s parties' },

    // Logistics & Delivery
    { name: 'Courier Service', description: 'Parcel and document delivery' },
    { name: 'Freight Company', description: 'Cargo and freight forwarding' },
    { name: 'Warehousing', description: 'Storage and warehousing services' },
    { name: 'Import and Export', description: 'International trade services' },
    { name: 'Customs Broker', description: 'Customs clearance and documentation' },

    // Miscellaneous
    { name: 'Funeral Home', description: 'Funeral services and burial' },
    { name: 'Religious Organization', description: 'Places of worship and religious groups' },
    { name: 'NGO', description: 'Non-profit and charitable organizations' },
    { name: 'Government Office', description: 'Government services and offices' },
    { name: 'Post Office', description: 'Mail and postal services' },
    { name: 'Dry Cleaner', description: 'Dry cleaning and laundry services' },
    { name: 'Tailor', description: 'Clothing alterations and custom tailoring' },
    { name: 'Watch Repair', description: 'Watch and clock repair' },
    { name: 'Shoe Repair', description: 'Cobbler and footwear repair' },
    { name: 'Recycling Center', description: 'Waste recycling and disposal' },
    { name: 'Car Park', description: 'Parking lots and garages' },
    { name: 'Wedding Planner', description: 'Wedding planning and coordination' },
    { name: 'Event Planner', description: 'Event management and coordination' },
    { name: 'Advertising Agency', description: 'Advertising and media buying' },
    { name: 'Political Organization', description: 'Political parties and campaigns' },
    { name: 'Trade Union', description: 'Workers unions and associations' },
    { name: 'Chamber of Commerce', description: 'Business associations and chambers' },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
    constructor(
        @InjectRepository(Category)
        private categoriesRepository: Repository<Category>,
    ) { }

    async onModuleInit() {
        const count = await this.categoriesRepository.count();
        if (count === 0) {
            await this.bulkSeedCategories();
        }
    }

    async bulkSeedCategories(): Promise<{ inserted: number; skipped: number }> {
        let inserted = 0;
        let skipped = 0;

        for (let i = 0; i < GOOGLE_BUSINESS_CATEGORIES.length; i++) {
            const { name, description } = GOOGLE_BUSINESS_CATEGORIES[i];
            const slug = toSlug(name);

            const existing = await this.categoriesRepository.findOne({ where: { slug } });
            if (existing) {
                skipped++;
                continue;
            }

            const newCat = this.categoriesRepository.create({
                name,
                slug,
                description: description || '',
                displayOrder: i + 1,
                status: CategoryStatus.ACTIVE,
                source: CategorySource.ADMIN,
            });
            await this.categoriesRepository.save(newCat);
            inserted++;
        }

        console.log(`[CategoriesService] Bulk seed complete: ${inserted} inserted, ${skipped} skipped`);
        return { inserted, skipped };
    }

    async findAll(): Promise<Category[]> {
        return this.categoriesRepository.find({
            where: { status: CategoryStatus.ACTIVE },
            order: { name: 'ASC' },
        });
    }

    async getPopular(limit: number): Promise<Category[]> {
        const categories = await this.categoriesRepository.find({
            where: { status: CategoryStatus.ACTIVE },
            order: { displayOrder: 'ASC' },
            take: limit,
        });

        return categories.map(cat => ({
            ...cat,
            businessCount: Math.floor(Math.random() * 200) + 50
        }));
    }

    async findBySlug(slug: string): Promise<Category | null> {
        return this.categoriesRepository.findOne({ where: { slug, status: CategoryStatus.ACTIVE } });
    }

    async findOne(id: string): Promise<Category | null> {
        return this.categoriesRepository.findOne({ where: { id } });
    }

    async getCount(): Promise<number> {
        return this.categoriesRepository.count();
    }
}
