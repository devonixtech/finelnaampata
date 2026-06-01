export const BUSINESS_TYPES = [
    'Physical Store / Retail',
    'Service Provider',
    'Online / E-Commerce Only',
    'Home-Based Business',
    'Franchise / Chain',
    'Manufacturer / Factory',
    'Wholesaler / Distributor',
    'Professional Services (Office-based)'
];

export const CORE_BUSINESS_NATURE = [
    'B2B (Business to Business)',
    'B2C (Business to Consumer)',
    'D2C (Direct to Consumer)',
    'B2B2C (Business to Business to Consumer)'
];

export const OPERATIONAL_STRUCTURE = [
    'Independent Business (Single Location)',
    'Multi-Branch Business',
    'Franchise Owner',
    'Master Franchisee',
    'Mobile / Roving Service (No fixed location)',
    'Kiosk / Stall'
];

export const TARGET_MARKET = [
    'Local Neighborhood',
    'City-Wide',
    'State / Provincial',
    'National (All over Pakistan)',
    'International / Exports'
];

// Amenities are grouped into categories as per spec
export const AMENITIES = {
    locationAccess: [
        'Wheelchair Accessible',
        'Street Parking',
        'Valet Parking',
        'Paid Parking Garage',
        'Near Public Transit'
    ],
    facilities: [
        'Free Wi-Fi',
        'Restrooms Available',
        'Waiting Area',
        'Air Conditioned',
        'Prayer Room / Masjid nearby',
        'Kid-Friendly Area',
        'Pet-Friendly'
    ],
    staff: [
        'Female Staff Available',
        'Multilingual Staff'
    ],
    paymentMethods: [
        'Cash Only',
        'Credit/Debit Cards',
        'Bank Transfer',
        'Mobile Wallets (JazzCash, EasyPaisa)',
        'Installment Plans Available'
    ]
};

export const SOCIAL_PLATFORMS = [
    { key: 'facebook', label: 'Facebook', emoji: '📘', color: '#1877F2', placeholder: 'https://facebook.com/yourbusiness' },
    { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C', placeholder: 'https://instagram.com/yourbusiness' },
    { key: 'twitter', label: 'Twitter / X', emoji: '🐦', color: '#1DA1F2', placeholder: 'https://twitter.com/yourbusiness' },
    { key: 'linkedin', label: 'LinkedIn', emoji: '💼', color: '#0A66C2', placeholder: 'https://linkedin.com/company/yourbusiness' },
    { key: 'youtube', label: 'YouTube', emoji: '▶️', color: '#FF0000', placeholder: 'https://youtube.com/@yourbusiness' },
];

export const EMPLOYEE_COUNT_OPTIONS = [
    '1-10 (Micro)',
    '11-50 (Small)',
    '51-200 (Medium)',
    '201-500 (Large)',
    '500+ (Enterprise)'
];

export const STEPS = [
    { id: 1, label: 'Name & Tagline', description: 'What is your business called?' },
    { id: 2, label: 'Business Type', description: 'How do you operate?' },
    { id: 3, label: 'Nature of Business', description: 'Who do you sell to?' },
    { id: 4, label: 'Structure', description: 'What is your setup?' },
    { id: 5, label: 'Category', description: 'Choose your industry.' },
    { id: 6, label: 'Target Market', description: 'Who are your customers?' },
    { id: 7, label: 'Address', description: 'Where are you located?' },
    { id: 8, label: 'Map Location', description: 'Pinpoint on map.' },
    { id: 9, label: 'Contact', description: 'How to reach you?' },
    { id: 10, label: 'Hours', description: 'When are you open?' },
    { id: 11, label: 'Description', description: 'Tell your story.' },
    { id: 12, label: 'Experience & Team', description: 'Background info.' },
    { id: 13, label: 'Online Presence', description: 'Website & Socials.' },
    { id: 14, label: 'Amenities', description: 'Facilities you offer.' },
    { id: 15, label: 'Industry Sub-Type', description: 'Specific tags.' },
    { id: 16, label: 'Keywords', description: 'For search visibility.' },
    { id: 17, label: 'FAQs', description: 'Common questions.' },
    { id: 18, label: 'Expansion', description: 'Franchising / B2B.' },
    { id: 19, label: 'Media', description: 'Logo & Photos.' },
    { id: 20, label: 'Review & Submit', description: 'Final confirmation.' }
];
