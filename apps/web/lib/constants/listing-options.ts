export const BUSINESS_TYPES = [
    'Physical Location',
    'Home-Based Business',
    'Online / Digital Only',
    'On-Site at Client Location',
    'Mobile Unit',
];

export const CORE_BUSINESS_NATURE = [
    'We sell physical products',
    'We sell digital products',
    'We provide in-person services',
    'We provide online or remote services',
    'We rent out products, spaces, or equipment',
    'We offer bookings or appointments',
    'We organise events, classes, or experiences',
    'We offer delivery to customers',
    'We operate as a marketplace or multi-vendor platform',
    'We offer subscriptions or memberships',
];

export const OPERATIONAL_STRUCTURE_SECTIONS = {
    producer: {
        label: 'Producer',
        options: [
            'Manufacturer', 'Assembler', 'Fabricator', 'Farmer / Agricultural Producer',
            'Extractor / Mining', 'OEM (Original Equipment Manufacturer)',
            'Private Label Producer', 'Garment / Textile Factory',
        ],
    },
    salesDistribution: {
        label: 'Sales & Distribution',
        options: [
            'Retailer', 'Wholesaler', 'Distributor', 'Importer', 'Exporter',
            'Dealer / Authorised Seller', 'Reseller', 'Franchise',
        ],
    },
    intermediary: {
        label: 'Intermediary',
        options: [
            'Broker', 'Agent / Representative', 'Auctioneer',
            'Commission-Based Facilitator', 'Marketplace Operator', 'Franchisee',
        ],
    },
    serviceFunction: {
        label: 'Service Function',
        options: [
            'Consulting / Advisory', 'Installation', 'Repair & Maintenance', 'Design',
            'Training / Education', 'Technical Support', 'Operations Management',
            'Cleaning / Hygiene', 'Security Services', 'Logistics / Transport',
            'Healthcare / Medical', 'Legal / Compliance',
        ],
    },
    organisational: {
        label: 'Organisational Structure',
        options: [
            'Individual / Freelancer', 'Partnership', 'Private Company', 'Public Company',
            'Government Entity', 'Nonprofit / NGO', 'Cooperative', 'Other',
        ],
    },
};

export type OperationalStructureSectionKey = keyof typeof OPERATIONAL_STRUCTURE_SECTIONS;

export const INDUSTRY_SUB_TYPES_SECTIONS = {
    industrial: {
        label: 'Industrial, Manufacturing & B2B',
        options: [
            'Manufacturer', 'OEM / Original Equipment Manufacturer', 'Fabricator',
            'Wholesale / B2B Supplier', 'Industrial Services', 'Exporter', 'Importer',
            'Distributor', 'Supplier', 'Contract Manufacturer',
        ],
    },
    agriculture: {
        label: 'Agriculture, Farming & Rural Businesses',
        options: [
            'Farmer / Agricultural Producer', 'Livestock / Dairy', 'Organic Farming',
            'Rural Services', 'Agri-Tech', 'Food Processing', 'Farm Equipment',
        ],
    },
};

export type IndustrySubTypeSectionKey = keyof typeof INDUSTRY_SUB_TYPES_SECTIONS;

export const TARGET_MARKET = [
    'B2C — Individual Consumers',
    'B2B — Other Businesses',
    'B2G — Government & Public Sector',
    'D2C — Direct to Consumer (own brand)',
    'Wholesale Buyers',
    'International Clients',
];

export const AMENITIES = {
    locationAccess: [
        'Physical Location', 'Online Business', 'Mobile / Home Service',
        'Delivery Available', 'Online Consultation', 'Emergency Service',
        '24/7 Open', 'Appointment Only',
    ],
    facilities: [
        'Free Wi-Fi', 'Parking Available', 'Air Conditioned', 'Waiting Area',
        'Wheelchair Accessible', 'Elevator / Lift', 'Kids Area', 'Pet Friendly',
        'Washroom / Toilet', 'Prayer Area', 'CCTV / Security',
        'Generator / Backup Power', 'Family Seating', 'EV Charging', 'Locker / Storage',
    ],
    staff: [
        'Female Staff Available', 'Male Staff Available', 'Bilingual Staff',
        'Sign Language Support', 'Trained / Certified Staff', 'Uniformed Staff',
        'Dedicated Customer Support',
    ],
    paymentMethods: [
        'Cash Accepted', 'Card Accepted', 'Bank Transfer', 'Mobile Wallet',
        'Advance Payment Required', 'Cryptocurrency',
        'Instalment / Buy Now Pay Later', 'Online Payment',
    ],
};

export const SOCIAL_PLATFORMS = [
    { key: 'facebook', label: 'Facebook', emoji: '📘', color: '#1877F2', placeholder: 'https://facebook.com/yourbusiness' },
    { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C', placeholder: 'https://instagram.com/yourbusiness' },
    { key: 'twitter', label: 'Twitter / X', emoji: '🐦', color: '#1DA1F2', placeholder: 'https://twitter.com/yourbusiness' },
    { key: 'linkedin', label: 'LinkedIn', emoji: '💼', color: '#0A66C2', placeholder: 'https://linkedin.com/company/yourbusiness' },
    { key: 'youtube', label: 'YouTube', emoji: '▶️', color: '#FF0000', placeholder: 'https://youtube.com/@yourbusiness' },
    { key: 'tiktok', label: 'TikTok', emoji: '🎵', color: '#000000', placeholder: 'https://tiktok.com/@yourbusiness' },
];

export const EMPLOYEE_COUNT_OPTIONS = [
    '1-10 (Micro)', '11-50 (Small)', '51-200 (Medium)', '201-500 (Large)', '500+ (Enterprise)',
];

export const STEPS = [
    { id: 1, label: 'Name & Tagline', description: 'What is your business called?' },
    { id: 2, label: 'Business Type', description: 'Where does your business operate?' },
    { id: 3, label: 'Nature of Business', description: 'What does your business primarily do?' },
    { id: 4, label: 'Structure', description: 'How does your business operate?' },
    { id: 5, label: 'Category', description: 'What category best describes your business?' },
    { id: 6, label: 'Target Market', description: 'Who are your primary customers?' },
    { id: 7, label: 'Address', description: 'Where is your business located?' },
    { id: 8, label: 'Map Location', description: 'Confirm your location on the map.' },
    { id: 9, label: 'Contact', description: 'How can customers reach you?' },
    { id: 10, label: 'Hours', description: 'When are you open?' },
    { id: 11, label: 'Description', description: 'Tell customers about your business.' },
    { id: 12, label: 'Experience & Team', description: 'Tell us a bit more about your business.' },
    { id: 13, label: 'Online Presence', description: 'Where else can customers find you?' },
    { id: 14, label: 'Amenities', description: 'What does your location offer?' },
    { id: 15, label: 'Industry Sub-Type', description: 'Specialised sectors.' },
    { id: 16, label: 'Keywords', description: 'Add keywords that describe your business.' },
    { id: 17, label: 'FAQs', description: 'Common questions and answers.' },
    { id: 18, label: 'Expansion', description: 'Franchise or distribution opportunities.' },
    { id: 19, label: 'Media', description: 'Logo & photos.' },
    { id: 20, label: 'Review & Submit', description: 'Final confirmation.' },
];
