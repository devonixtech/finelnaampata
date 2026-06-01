/**
 * Builds categories-list.json from a line-delimited Google Business categories source.
 * Usage (from repo root):
 *   node backend/scripts/build-google-categories-list.js [input.txt]
 *
 * Default input: tmp/gmb-categories.txt (download separately) or falls back to Places types seed.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const outFile = path.join(repoRoot, 'categories-list.json');
const defaultInput = path.join(repoRoot, 'tmp', 'gmb-categories.txt');

const PLACES_SEED = [
    'accounting','airport','amusement_park','aquarium','art_gallery','atm','bakery','bank','bar',
    'beauty_salon','bicycle_store','book_store','bowling_alley','bus_station','cafe','campground',
    'car_dealer','car_rental','car_repair','car_wash','casino','cemetery','church','city_hall',
    'clothing_store','convenience_store','courthouse','dentist','department_store','doctor',
    'drugstore','electrician','electronics_store','embassy','fire_station','florist','funeral_home',
    'furniture_store','gas_station','gym','hair_care','hardware_store','hindu_temple','home_goods_store',
    'hospital','insurance_agency','jewelry_store','laundry','lawyer','library','light_rail_station',
    'liquor_store','local_government_office','locksmith','lodging','meal_delivery','meal_takeaway',
    'mosque','movie_rental','movie_theater','moving_company','museum','night_club','painter','park',
    'parking','pet_store','pharmacy','physiotherapist','plumber','police','post_office',
    'primary_school','real_estate_agency','restaurant','roofing_contractor','rv_park','school',
    'secondary_school','shoe_store','shopping_mall','spa','stadium','storage','store',
    'subway_station','supermarket','synagogue','taxi_stand','tourist_attraction','train_station',
    'transit_station','travel_agency','university','veterinary_care','zoo','food','health',
    'finance','general_contractor','establishment','point_of_interest','advertising_agency',
    'architect','astrologer','atm','auto_parts_store','banquet_hall','barber_shop','bed_and_breakfast',
    'bicycle_store','book_store','bowling_alley','bus_station','catering_service','child_care_agency',
    'chiropractor','cleaning_service','clinic','coffee_shop','consultant','courier_service',
    'dance_school','day_care','delivery_restaurant','dessert_shop','dietitian','discount_store',
    'dog_park','driving_school','dry_cleaner','electric_vehicle_charging_station','event_venue',
    'farm','fast_food_restaurant','financial_planner','fitness_center','food_delivery','foot_care',
    'funeral_home','garden_center','gift_shop','golf_course','grocery_store','guest_house',
    'hair_salon','health','home_improvement_store','hostel','hotel','ice_cream_shop','interior_designer',
    'internet_cafe','jeweler','karaoke','kitchen_remodeler','landscaper','laundromat','law_firm',
    'marketing_agency','massage','medical_lab','mobile_phone_shop','mortgage_broker','motorcycle_dealer',
    'music_school','nail_salon','newsagent','nutritionist','optician','organic_store','painter',
    'party_planner','pawn_shop','personal_trainer','pest_control_service','photographer','pizza_restaurant',
    'playground','plumber','podiatrist','pool_cleaner','printing_service','private_guest_room',
    'psychologist','pub','radiologist','recycling_center','remodeler','resort_hotel','restaurant',
    'roofing_contractor','rv_dealer','sandwich_shop','sauna','sculpture','seafood_restaurant',
    'security_system_supplier','self_storage','shoe_repair_shop','ski_resort','skin_care_clinic',
    'smoothie_shop','solar_energy_company','soup_restaurant','sports_club','sports_complex',
    'steak_house','storage','sushi_restaurant','swimming_pool','tailor','tanning_studio','tattoo_shop',
    'tax_preparer','telecommunications_service_provider','thai_restaurant','tour_agency','toy_store',
    'translator','travel_agency','tutoring_service','vegan_restaurant','vegetarian_restaurant',
    'video_game_store','vintage_clothing_store','warehouse_store','waste_management_service',
    'water_park','wedding_venue','wellness_center','wholesaler','winery','yoga_studio',
];

function humanize(line) {
    return String(line || '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ')
        .trim();
}

function loadLines(inputPath) {
    if (fs.existsSync(inputPath)) {
        const raw = fs.readFileSync(inputPath, 'utf8');
        const lines = raw
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith('#') && !l.includes('404: Not Found'));
        if (lines.length >= 50) return lines;
    }
    return PLACES_SEED.map(humanize);
}

const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
const lines = loadLines(inputPath);
const unique = Array.from(new Set(lines.map(humanize).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
);

fs.writeFileSync(outFile, JSON.stringify(unique, null, 2), 'utf8');
console.log(`Wrote ${unique.length} categories to ${outFile}`);
