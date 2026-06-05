import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../../entities/city.entity';
import { ISO_COUNTRIES } from '../../common/data/iso-countries';

type CityDatasetRow = {
    name: string;
    state: string;
    country: string;
    isPopular: boolean;
    displayOrder: number;
    latitude?: number;
    longitude?: number;
};

const CITY_POSTAL_LOOKUPS: Record<string, string> = {
    'Pakistan|Punjab|Lahore': '54000',
    'Pakistan|Punjab|Faisalabad': '38000',
    'Pakistan|Punjab|Rawalpindi': '46000',
    'Pakistan|Punjab|Gujranwala': '52250',
    'Pakistan|Punjab|Multan': '60000',
    'Pakistan|Punjab|Bahawalpur': '63100',
    'Pakistan|Sindh|Karachi': '74000',
    'Pakistan|Sindh|Hyderabad': '71000',
    'Pakistan|Sindh|Sukkur': '65200',
    'Pakistan|KPK|Peshawar': '25000',
    'Pakistan|KPK|Abbottabad': '22010',
    'Pakistan|Balochistan|Quetta': '87300',
    'Pakistan|ICT|Islamabad': '44000',
    'Pakistan|AJK|Muzaffarabad': '13100',
    'Pakistan|Gilgit-Baltistan|Gilgit': '15100',
    'India|Maharashtra|Mumbai': '400001',
    'India|Delhi|Delhi': '110001',
    'India|Karnataka|Bangalore': '560001',
    'India|Telangana|Hyderabad': '500001',
    'India|Tamil Nadu|Chennai': '600001',
    'India|West Bengal|Kolkata': '700001',
    'India|Maharashtra|Pune': '411001',
    'India|Gujarat|Ahmedabad': '380001',
    'India|Rajasthan|Jaipur': '302001',
    'India|Gujarat|Surat': '395003',
    'Saudi Arabia|Riyadh|Riyadh': '11564',
    'Saudi Arabia|Makkah|Jeddah': '21577',
    'Saudi Arabia|Makkah|Mecca': '24231',
    'Saudi Arabia|Medina|Medina': '42311',
    'Saudi Arabia|Eastern Province|Dammam': '32242',
    'United Kingdom|England|London': 'SW1A 1AA',
    'United Kingdom|England|Birmingham': 'B1 1AA',
    'United Kingdom|England|Manchester': 'M1 1AE',
    'United Kingdom|Scotland|Glasgow': 'G1 1XQ',
    'United States|New York|New York': '10001',
    'United States|California|Los Angeles': '90001',
    'United States|Illinois|Chicago': '60601',
    'United States|Texas|Houston': '77001',
    'United States|Arizona|Phoenix': '85001',
    'United States|Pennsylvania|Philadelphia': '19019',
    'Canada|Ontario|Toronto': 'M5H 2N2',
    'Canada|British Columbia|Vancouver': 'V5K 0A1',
    'Canada|Quebec|Montreal': 'H1A 0A1',
    'Canada|Alberta|Calgary': 'T1X 0L3',
    'Australia|New South Wales|Sydney': '2000',
    'Australia|Victoria|Melbourne': '3000',
    'Australia|Queensland|Brisbane': '4000',
    'Australia|Western Australia|Perth': '6000',
};

// Comprehensive city dataset organized by country
const CITY_DATASETS: Record<string, CityDatasetRow[]> = {
    'Pakistan': [
        // Punjab
        { name: 'Lahore', state: 'Punjab', country: 'Pakistan', isPopular: true, displayOrder: 1, latitude: 31.5204, longitude: 74.3587 },
        { name: 'Faisalabad', state: 'Punjab', country: 'Pakistan', isPopular: true, displayOrder: 2, latitude: 31.4504, longitude: 73.1350 },
        { name: 'Rawalpindi', state: 'Punjab', country: 'Pakistan', isPopular: true, displayOrder: 3, latitude: 33.5651, longitude: 73.0169 },
        { name: 'Gujranwala', state: 'Punjab', country: 'Pakistan', isPopular: true, displayOrder: 4, latitude: 32.1877, longitude: 74.1945 },
        { name: 'Multan', state: 'Punjab', country: 'Pakistan', isPopular: true, displayOrder: 5, latitude: 30.1575, longitude: 71.4753 },
        { name: 'Bahawalpur', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 6 },
        { name: 'Sargodha', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 7 },
        { name: 'Sialkot', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 8 },
        { name: 'Sheikhupura', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 9 },
        { name: 'Jhang', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 10 },
        { name: 'Rahim Yar Khan', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 11 },
        { name: 'Gujrat', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 12 },
        { name: 'Sahiwal', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 13 },
        { name: 'Wah Cantt', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 14 },
        { name: 'Okara', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 15 },
        { name: 'Kasur', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 16 },
        { name: 'Dera Ghazi Khan', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 17 },
        { name: 'Khushab', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 18 },
        { name: 'Attock', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 19 },
        { name: 'Chiniot', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 20 },
        { name: 'Hafizabad', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 21 },
        { name: 'Muzaffargarh', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 22 },
        { name: 'Mandi Bahauddin', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 23 },
        { name: 'Narowal', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 24 },
        { name: 'Vihari', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 25 },
        { name: 'Pakpattan', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 26 },
        { name: 'Khanewal', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 27 },
        { name: 'Toba Tek Singh', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 28 },
        { name: 'Bahawalnagar', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 29 },
        { name: 'Nankana Sahib', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 30 },
        { name: 'Layyah', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 31 },
        { name: 'Lodhran', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 32 },
        { name: 'Chakwal', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 33 },
        { name: 'Jhelum', state: 'Punjab', country: 'Pakistan', isPopular: false, displayOrder: 34 },
        // Sindh
        { name: 'Karachi', state: 'Sindh', country: 'Pakistan', isPopular: true, displayOrder: 35, latitude: 24.8607, longitude: 67.0011 },
        { name: 'Hyderabad', state: 'Sindh', country: 'Pakistan', isPopular: true, displayOrder: 36, latitude: 25.3960, longitude: 68.3578 },
        { name: 'Sukkur', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 37 },
        { name: 'Larkana', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 38 },
        { name: 'Nawabshah', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 39 },
        { name: 'Mirpur Khas', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 40 },
        { name: 'Khairpur', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 41 },
        { name: 'Jacobabad', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 42 },
        { name: 'Thatta', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 43 },
        { name: 'Badin', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 44 },
        { name: 'Shikarpur', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 45 },
        { name: 'Dadu', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 46 },
        { name: 'Sanghar', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 47 },
        { name: 'Tando Adam', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 48 },
        { name: 'Tando Allahyar', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 49 },
        { name: 'Ghotki', state: 'Sindh', country: 'Pakistan', isPopular: false, displayOrder: 50 },
        // KPK
        { name: 'Peshawar', state: 'KPK', country: 'Pakistan', isPopular: true, displayOrder: 51, latitude: 34.0151, longitude: 71.5249 },
        { name: 'Mardan', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 52 },
        { name: 'Mingora', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 53 },
        { name: 'Abbottabad', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 54 },
        { name: 'Kohat', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 55 },
        { name: 'Mansehra', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 56 },
        { name: 'Dera Ismail Khan', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 57 },
        { name: 'Swabi', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 58 },
        { name: 'Nowshera', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 59 },
        { name: 'Charsadda', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 60 },
        { name: 'Haripur', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 61 },
        { name: 'Karak', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 62 },
        { name: 'Bannu', state: 'KPK', country: 'Pakistan', isPopular: false, displayOrder: 63 },
        // Balochistan
        { name: 'Quetta', state: 'Balochistan', country: 'Pakistan', isPopular: true, displayOrder: 64, latitude: 30.1798, longitude: 66.9750 },
        { name: 'Turbat', state: 'Balochistan', country: 'Pakistan', isPopular: false, displayOrder: 65 },
        { name: 'Khuzdar', state: 'Balochistan', country: 'Pakistan', isPopular: false, displayOrder: 66 },
        { name: 'Hub', state: 'Balochistan', country: 'Pakistan', isPopular: false, displayOrder: 67 },
        { name: 'Gwadar', state: 'Balochistan', country: 'Pakistan', isPopular: false, displayOrder: 68 },
        { name: 'Chaman', state: 'Balochistan', country: 'Pakistan', isPopular: false, displayOrder: 69 },
        { name: 'Sibi', state: 'Balochistan', country: 'Pakistan', isPopular: false, displayOrder: 70 },
        { name: 'Zhob', state: 'Balochistan', country: 'Pakistan', isPopular: false, displayOrder: 71 },
        { name: 'Dera Bugti', state: 'Balochistan', country: 'Pakistan', isPopular: false, displayOrder: 72 },
        { name: 'Panjgur', state: 'Balochistan', country: 'Pakistan', isPopular: false, displayOrder: 73 },
        // ICT
        { name: 'Islamabad', state: 'ICT', country: 'Pakistan', isPopular: true, displayOrder: 74, latitude: 33.6844, longitude: 73.0479 },
        // AJK
        { name: 'Muzaffarabad', state: 'AJK', country: 'Pakistan', isPopular: false, displayOrder: 75 },
        { name: 'Mirpur', state: 'AJK', country: 'Pakistan', isPopular: false, displayOrder: 76 },
        { name: 'Rawalakot', state: 'AJK', country: 'Pakistan', isPopular: false, displayOrder: 77 },
        { name: 'Bagh', state: 'AJK', country: 'Pakistan', isPopular: false, displayOrder: 78 },
        // Gilgit-Baltistan
        { name: 'Gilgit', state: 'Gilgit-Baltistan', country: 'Pakistan', isPopular: false, displayOrder: 79 },
        { name: 'Skardu', state: 'Gilgit-Baltistan', country: 'Pakistan', isPopular: false, displayOrder: 80 },
        { name: 'Hunza', state: 'Gilgit-Baltistan', country: 'Pakistan', isPopular: false, displayOrder: 81 },
        { name: 'Chilas', state: 'Gilgit-Baltistan', country: 'Pakistan', isPopular: false, displayOrder: 82 },
    ],
    'India': [
        { name: 'Mumbai', state: 'Maharashtra', country: 'India', isPopular: true, displayOrder: 1 },
        { name: 'Delhi', state: 'Delhi', country: 'India', isPopular: true, displayOrder: 2 },
        { name: 'Bangalore', state: 'Karnataka', country: 'India', isPopular: true, displayOrder: 3 },
        { name: 'Hyderabad', state: 'Telangana', country: 'India', isPopular: true, displayOrder: 4 },
        { name: 'Chennai', state: 'Tamil Nadu', country: 'India', isPopular: true, displayOrder: 5 },
        { name: 'Kolkata', state: 'West Bengal', country: 'India', isPopular: true, displayOrder: 6 },
        { name: 'Pune', state: 'Maharashtra', country: 'India', isPopular: true, displayOrder: 7 },
        { name: 'Ahmedabad', state: 'Gujarat', country: 'India', isPopular: true, displayOrder: 8 },
        { name: 'Jaipur', state: 'Rajasthan', country: 'India', isPopular: false, displayOrder: 9 },
        { name: 'Surat', state: 'Gujarat', country: 'India', isPopular: false, displayOrder: 10 },
        { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', isPopular: false, displayOrder: 11 },
        { name: 'Kanpur', state: 'Uttar Pradesh', country: 'India', isPopular: false, displayOrder: 12 },
        { name: 'Nagpur', state: 'Maharashtra', country: 'India', isPopular: false, displayOrder: 13 },
        { name: 'Indore', state: 'Madhya Pradesh', country: 'India', isPopular: false, displayOrder: 14 },
        { name: 'Bhopal', state: 'Madhya Pradesh', country: 'India', isPopular: false, displayOrder: 15 },
        { name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', isPopular: false, displayOrder: 16 },
        { name: 'Patna', state: 'Bihar', country: 'India', isPopular: false, displayOrder: 17 },
        { name: 'Vadodara', state: 'Gujarat', country: 'India', isPopular: false, displayOrder: 18 },
        { name: 'Goa', state: 'Goa', country: 'India', isPopular: false, displayOrder: 19 },
        { name: 'Jodhpur', state: 'Rajasthan', country: 'India', isPopular: false, displayOrder: 20 },
        { name: 'Coimbatore', state: 'Tamil Nadu', country: 'India', isPopular: false, displayOrder: 21 },
        { name: 'Chandigarh', state: 'Punjab', country: 'India', isPopular: false, displayOrder: 22 },
        { name: 'Amritsar', state: 'Punjab', country: 'India', isPopular: false, displayOrder: 23 },
        { name: 'Noida', state: 'Uttar Pradesh', country: 'India', isPopular: false, displayOrder: 24 },
        { name: 'Agra', state: 'Uttar Pradesh', country: 'India', isPopular: false, displayOrder: 25 },
        { name: 'Kochi', state: 'Kerala', country: 'India', isPopular: false, displayOrder: 26 },
    ],
    'United Arab Emirates': [
        { name: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', isPopular: true, displayOrder: 1 },
        { name: 'Abu Dhabi', state: 'Abu Dhabi', country: 'United Arab Emirates', isPopular: true, displayOrder: 2 },
        { name: 'Sharjah', state: 'Sharjah', country: 'United Arab Emirates', isPopular: true, displayOrder: 3 },
        { name: 'Ajman', state: 'Ajman', country: 'United Arab Emirates', isPopular: false, displayOrder: 4 },
        { name: 'Al Ain', state: 'Abu Dhabi', country: 'United Arab Emirates', isPopular: false, displayOrder: 5 },
        { name: 'Ras Al Khaimah', state: 'Ras Al Khaimah', country: 'United Arab Emirates', isPopular: false, displayOrder: 6 },
        { name: 'Fujairah', state: 'Fujairah', country: 'United Arab Emirates', isPopular: false, displayOrder: 7 },
        { name: 'Umm Al Quwain', state: 'Umm Al Quwain', country: 'United Arab Emirates', isPopular: false, displayOrder: 8 },
    ],
    'Saudi Arabia': [
        { name: 'Riyadh', state: 'Riyadh', country: 'Saudi Arabia', isPopular: true, displayOrder: 1 },
        { name: 'Jeddah', state: 'Makkah', country: 'Saudi Arabia', isPopular: true, displayOrder: 2 },
        { name: 'Mecca', state: 'Makkah', country: 'Saudi Arabia', isPopular: true, displayOrder: 3 },
        { name: 'Medina', state: 'Medina', country: 'Saudi Arabia', isPopular: true, displayOrder: 4 },
        { name: 'Dammam', state: 'Eastern Province', country: 'Saudi Arabia', isPopular: false, displayOrder: 5 },
        { name: 'Khobar', state: 'Eastern Province', country: 'Saudi Arabia', isPopular: false, displayOrder: 6 },
        { name: 'Tabuk', state: 'Tabuk', country: 'Saudi Arabia', isPopular: false, displayOrder: 7 },
        { name: 'Abha', state: 'Asir', country: 'Saudi Arabia', isPopular: false, displayOrder: 8 },
        { name: 'Taif', state: 'Makkah', country: 'Saudi Arabia', isPopular: false, displayOrder: 9 },
        { name: 'Buraidah', state: 'Qassim', country: 'Saudi Arabia', isPopular: false, displayOrder: 10 },
        { name: 'Najran', state: 'Najran', country: 'Saudi Arabia', isPopular: false, displayOrder: 11 },
        { name: 'Hail', state: 'Hail', country: 'Saudi Arabia', isPopular: false, displayOrder: 12 },
    ],
    'United Kingdom': [
        { name: 'London', state: 'England', country: 'United Kingdom', isPopular: true, displayOrder: 1 },
        { name: 'Birmingham', state: 'England', country: 'United Kingdom', isPopular: true, displayOrder: 2 },
        { name: 'Manchester', state: 'England', country: 'United Kingdom', isPopular: true, displayOrder: 3 },
        { name: 'Glasgow', state: 'Scotland', country: 'United Kingdom', isPopular: true, displayOrder: 4 },
        { name: 'Leeds', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 5 },
        { name: 'Liverpool', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 6 },
        { name: 'Bristol', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 7 },
        { name: 'Edinburgh', state: 'Scotland', country: 'United Kingdom', isPopular: false, displayOrder: 8 },
        { name: 'Sheffield', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 9 },
        { name: 'Bradford', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 10 },
        { name: 'Leicester', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 11 },
        { name: 'Coventry', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 12 },
        { name: 'Cardiff', state: 'Wales', country: 'United Kingdom', isPopular: false, displayOrder: 13 },
        { name: 'Belfast', state: 'Northern Ireland', country: 'United Kingdom', isPopular: false, displayOrder: 14 },
        { name: 'Nottingham', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 15 },
        { name: 'Newcastle', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 16 },
        { name: 'Southampton', state: 'England', country: 'United Kingdom', isPopular: false, displayOrder: 17 },
    ],
    'United States': [
        { name: 'New York', state: 'New York', country: 'United States', isPopular: true, displayOrder: 1 },
        { name: 'Los Angeles', state: 'California', country: 'United States', isPopular: true, displayOrder: 2 },
        { name: 'Chicago', state: 'Illinois', country: 'United States', isPopular: true, displayOrder: 3 },
        { name: 'Houston', state: 'Texas', country: 'United States', isPopular: true, displayOrder: 4 },
        { name: 'Phoenix', state: 'Arizona', country: 'United States', isPopular: false, displayOrder: 5 },
        { name: 'Philadelphia', state: 'Pennsylvania', country: 'United States', isPopular: false, displayOrder: 6 },
        { name: 'San Antonio', state: 'Texas', country: 'United States', isPopular: false, displayOrder: 7 },
        { name: 'San Diego', state: 'California', country: 'United States', isPopular: false, displayOrder: 8 },
        { name: 'Dallas', state: 'Texas', country: 'United States', isPopular: false, displayOrder: 9 },
        { name: 'San Jose', state: 'California', country: 'United States', isPopular: false, displayOrder: 10 },
        { name: 'Austin', state: 'Texas', country: 'United States', isPopular: false, displayOrder: 11 },
        { name: 'Jacksonville', state: 'Florida', country: 'United States', isPopular: false, displayOrder: 12 },
        { name: 'San Francisco', state: 'California', country: 'United States', isPopular: false, displayOrder: 13 },
        { name: 'Seattle', state: 'Washington', country: 'United States', isPopular: false, displayOrder: 14 },
        { name: 'Denver', state: 'Colorado', country: 'United States', isPopular: false, displayOrder: 15 },
        { name: 'Boston', state: 'Massachusetts', country: 'United States', isPopular: false, displayOrder: 16 },
        { name: 'Miami', state: 'Florida', country: 'United States', isPopular: false, displayOrder: 17 },
        { name: 'Las Vegas', state: 'Nevada', country: 'United States', isPopular: false, displayOrder: 18 },
        { name: 'Atlanta', state: 'Georgia', country: 'United States', isPopular: false, displayOrder: 19 },
        { name: 'Washington DC', state: 'DC', country: 'United States', isPopular: false, displayOrder: 20 },
    ],
    'Canada': [
        { name: 'Toronto', state: 'Ontario', country: 'Canada', isPopular: true, displayOrder: 1 },
        { name: 'Vancouver', state: 'British Columbia', country: 'Canada', isPopular: true, displayOrder: 2 },
        { name: 'Montreal', state: 'Quebec', country: 'Canada', isPopular: true, displayOrder: 3 },
        { name: 'Calgary', state: 'Alberta', country: 'Canada', isPopular: false, displayOrder: 4 },
        { name: 'Edmonton', state: 'Alberta', country: 'Canada', isPopular: false, displayOrder: 5 },
        { name: 'Ottawa', state: 'Ontario', country: 'Canada', isPopular: false, displayOrder: 6 },
        { name: 'Winnipeg', state: 'Manitoba', country: 'Canada', isPopular: false, displayOrder: 7 },
        { name: 'Quebec City', state: 'Quebec', country: 'Canada', isPopular: false, displayOrder: 8 },
        { name: 'Hamilton', state: 'Ontario', country: 'Canada', isPopular: false, displayOrder: 9 },
        { name: 'Kitchener', state: 'Ontario', country: 'Canada', isPopular: false, displayOrder: 10 },
        { name: 'London', state: 'Ontario', country: 'Canada', isPopular: false, displayOrder: 11 },
        { name: 'Victoria', state: 'British Columbia', country: 'Canada', isPopular: false, displayOrder: 12 },
        { name: 'Halifax', state: 'Nova Scotia', country: 'Canada', isPopular: false, displayOrder: 13 },
        { name: 'Saskatoon', state: 'Saskatchewan', country: 'Canada', isPopular: false, displayOrder: 14 },
    ],
    'Australia': [
        { name: 'Sydney', state: 'New South Wales', country: 'Australia', isPopular: true, displayOrder: 1 },
        { name: 'Melbourne', state: 'Victoria', country: 'Australia', isPopular: true, displayOrder: 2 },
        { name: 'Brisbane', state: 'Queensland', country: 'Australia', isPopular: true, displayOrder: 3 },
        { name: 'Perth', state: 'Western Australia', country: 'Australia', isPopular: true, displayOrder: 4 },
        { name: 'Adelaide', state: 'South Australia', country: 'Australia', isPopular: false, displayOrder: 5 },
        { name: 'Gold Coast', state: 'Queensland', country: 'Australia', isPopular: false, displayOrder: 6 },
        { name: 'Newcastle', state: 'New South Wales', country: 'Australia', isPopular: false, displayOrder: 7 },
        { name: 'Canberra', state: 'ACT', country: 'Australia', isPopular: false, displayOrder: 8 },
        { name: 'Sunshine Coast', state: 'Queensland', country: 'Australia', isPopular: false, displayOrder: 9 },
        { name: 'Wollongong', state: 'New South Wales', country: 'Australia', isPopular: false, displayOrder: 10 },
        { name: 'Hobart', state: 'Tasmania', country: 'Australia', isPopular: false, displayOrder: 11 },
        { name: 'Geelong', state: 'Victoria', country: 'Australia', isPopular: false, displayOrder: 12 },
        { name: 'Townsville', state: 'Queensland', country: 'Australia', isPopular: false, displayOrder: 13 },
        { name: 'Darwin', state: 'Northern Territory', country: 'Australia', isPopular: false, displayOrder: 14 },
    ],
};

@Injectable()
export class CitiesService {
    private readonly logger = new Logger(CitiesService.name);

    constructor(
        @InjectRepository(City)
        private readonly cityRepository: Repository<City>,
    ) { }

    private getCityLookupKey(city: Pick<City, 'country' | 'state' | 'name'>) {
        return `${city.country}|${city.state || ''}|${city.name}`;
    }

    private enrichCity<T extends City | Partial<City>>(city: T): T & { postalCode?: string } {
        const postalCode = CITY_POSTAL_LOOKUPS[this.getCityLookupKey(city as City)];
        return {
            ...city,
            ...(postalCode ? { postalCode } : {}),
        };
    }

    private enrichCities<T extends City | Partial<City>>(cities: T[]) {
        return cities.map((city) => this.enrichCity(city));
    }

    private async importCitiesFromCountriesNow(country: string): Promise<number> {
        try {
            const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country }),
            });
            if (!response.ok) return 0;

            const payload = await response.json();
            const cityNames: string[] = payload?.data || [];
            if (!Array.isArray(cityNames) || cityNames.length === 0) return 0;

            const { generateSlug } = await import('../../common/utils/slug.util');
            let imported = 0;

            for (const name of cityNames) {
                const trimmed = String(name || '').trim();
                if (!trimmed) continue;

                const slug = generateSlug(`${trimmed}-${country}`);
                const existing = await this.cityRepository.findOne({
                    where: [{ slug }, { name: trimmed, country }],
                });

                if (existing) continue;

                await this.cityRepository.save(
                    this.cityRepository.create({
                        name: trimmed,
                        country,
                        state: '',
                        slug,
                        isPopular: false,
                        displayOrder: 0,
                    }),
                );
                imported++;
            }

            await this.removeDuplicates();
            return imported;
        } catch (error: any) {
            this.logger.warn(`countriesnow import failed for ${country}: ${error.message}`);
            return 0;
        }
    }

    async findAll(country?: string) {
        const countryFilter = country?.trim();
        const qb = this.cityRepository.createQueryBuilder('city');
        if (countryFilter) {
            qb.where('LOWER(city.country) = LOWER(:country)', { country: countryFilter });
        }

        let cities = await qb.orderBy('city.name', 'ASC').getMany();

        if (countryFilter && cities.length < 10) {
            const imported = await this.importCitiesFromCountriesNow(countryFilter);
            if (imported > 0) {
                const retryQb = this.cityRepository.createQueryBuilder('city');
                retryQb.where('LOWER(city.country) = LOWER(:country)', { country: countryFilter });
                cities = await retryQb.orderBy('city.name', 'ASC').getMany();
            }
        }

        // Deduplicate by name and country
        const seen = new Set();
        const deduped = cities.filter(c => {
            const key = `${c.name}-${c.country}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return this.enrichCities(deduped);
    }

    async findPopular() {
        const cities = await this.cityRepository.find({
            where: { isPopular: true },
            order: { displayOrder: 'ASC' },
        });

        return this.enrichCities(cities);
    }

    async findBySlug(slug: string) {
        const city = await this.cityRepository.findOne({
            where: { slug },
        });

        if (!city) {
            throw new NotFoundException(`City with slug ${slug} not found`);
        }

        return this.enrichCity(city);
    }

    async create(data: Partial<City>) {
        if (!data.slug && data.name) {
            const { generateSlug } = await import('../../common/utils/slug.util');
            data.slug = generateSlug(data.name);
        }

        const existing = await this.cityRepository.findOne({
            where: { slug: data.slug },
        });

        if (existing) {
            return existing;
        }

        const city = this.cityRepository.create(data);
        return this.cityRepository.save(city);
    }

    async update(id: string, data: Partial<City>) {
        const city = await this.cityRepository.findOne({ where: { id } });
        if (!city) {
            throw new NotFoundException(`City with ID ${id} not found`);
        }

        // If name changed, regenerate slug
        if (data.name && data.name !== city.name && !data.slug) {
            const { generateSlug } = await import('../../common/utils/slug.util');
            data.slug = generateSlug(data.name);
        }

        Object.assign(city, data);
        return this.cityRepository.save(city);
    }

    async findAllAdmin(page = 1, limit = 10, search = '') {
        const queryBuilder = this.cityRepository.createQueryBuilder('city')
            .orderBy('city.displayOrder', 'ASC')
            .addOrderBy('city.name', 'ASC');

        if (search) {
            queryBuilder.where('city.name ILike :search OR city.slug ILike :search', { search: `%${search}%` });
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data: this.enrichCities(data), total };
    }

    async remove(id: string) {
        const city = await this.cityRepository.findOne({ where: { id } });
        if (!city) {
            throw new NotFoundException(`City with ID ${id} not found`);
        }
        return this.cityRepository.remove(city);
    }

    /**
     * Returns the list of supported countries and their city counts.
     */
    getSupportedCountries() {
        return Object.entries(CITY_DATASETS).map(([country, cities]) => ({
            country,
            cityCount: cities.length,
        }));
    }

    /**
     * Bulk import all cities for a given country from the hardcoded dataset.
     */
    async bulkImportByCountry(country: string) {
        const dataset = CITY_DATASETS[country];
        if (!dataset) {
            throw new NotFoundException(`No city dataset found for country: ${country}. Supported: ${Object.keys(CITY_DATASETS).join(', ')}`);
        }

        const { generateSlug } = await import('../../common/utils/slug.util');
        let imported = 0;

        for (const cityData of dataset) {
            const slug = generateSlug(cityData.name + '-' + cityData.country);
            // Search by slug OR by name and country
            const existing = await this.cityRepository.findOne({
                where: [
                    { slug },
                    { name: cityData.name, country: cityData.country }
                ]
            });
            
            if (existing) {
                // Update existing city with new data (coordinates, etc)
                Object.assign(existing, cityData);
                await this.cityRepository.save(existing);
                imported++;
            } else {
                const city = this.cityRepository.create({ ...cityData, slug });
                await this.cityRepository.save(city);
                imported++;
            }
        }

        // Clean up duplicates
        await this.removeDuplicates();

        return { count: imported, total: dataset.length };
    }

    /**
     * Finds and deletes duplicate city name + country combinations.
     */
    async removeDuplicates() {
        const duplicates = await this.cityRepository
            .createQueryBuilder('city')
            .select('city.name', 'name')
            .addSelect('city.country', 'country')
            .groupBy('city.name')
            .addGroupBy('city.country')
            .having('COUNT(city.id) > 1')
            .getRawMany();

        let removedCount = 0;
        for (const dup of duplicates) {
            const cities = await this.cityRepository.find({
                where: { name: dup.name, country: dup.country },
                order: { createdAt: 'ASC' }
            });

            const toDelete = cities.slice(1);
            if (toDelete.length > 0) {
                await this.cityRepository.remove(toDelete);
                removedCount += toDelete.length;
            }
        }
        return { removedCount };
    }

    /**
     * Returns all ISO country names (global list), merged with any DB-only country names.
     */
    async getCountries() {
        const isoNames = ISO_COUNTRIES.map((c) => c.name);
        const rows = await this.cityRepository
            .createQueryBuilder('city')
            .select('city.country', 'country')
            .where('city.country IS NOT NULL')
            .andWhere("TRIM(city.country) <> ''")
            .groupBy('city.country')
            .orderBy('city.country', 'ASC')
            .getRawMany();

        const fromDb = rows.map((r: { country: string }) => r.country).filter(Boolean);
        return Array.from(new Set([...isoNames, ...fromDb])).sort((a, b) => a.localeCompare(b));
    }

    /**
     * @deprecated Use bulkImportByCountry('Pakistan') instead.
     * Kept for backward compatibility.
     */
    async bulkImportPakistaniCities() {
        return this.bulkImportByCountry('Pakistan');
    }
}
