const { PhoneNumberUtil } = require('google-libphonenumber');
const phoneUtil = PhoneNumberUtil.getInstance();

const DEFAULT_DIAL_CODES = [
    { country: 'Pakistan', code: 'PK', dialCode: '+92' },
    { country: 'India', code: 'IN', dialCode: '+91' },
    { country: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
    { country: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
    { country: 'United States', code: 'US', dialCode: '+1' },
    { country: 'United Kingdom', code: 'GB', dialCode: '+44' },
    { country: 'Canada', code: 'CA', dialCode: '+1' },
    { country: 'Australia', code: 'AU', dialCode: '+61' },
    { country: 'Malaysia', code: 'MY', dialCode: '+60' },
];

function getRegionCodeFromDialCode(dialCode) {
    const match = DEFAULT_DIAL_CODES.find(d => d.dialCode === dialCode);
    return match ? match.code : 'PK';
}

function parsePhoneWithLib(rawPhone, defaultDialCode = '+92') {
    if (!rawPhone) {
        return { dialCode: defaultDialCode, phoneNumber: '', isValid: false };
    }

    const cleaned = rawPhone.trim();
    
    try {
        let toParse = cleaned;
        if (!toParse.startsWith('+')) {
            const sortedCodes = [...DEFAULT_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
            const matchingCode = sortedCodes.find(d => {
                const digits = d.dialCode.replace(/\D/g, '');
                return digits && toParse.startsWith(digits) && toParse.length > digits.length + 5;
            });
            if (matchingCode) {
                toParse = '+' + toParse;
            }
        }

        const defaultRegion = getRegionCodeFromDialCode(defaultDialCode);
        const parsed = phoneUtil.parse(toParse.startsWith('+') ? toParse : '+' + defaultDialCode.replace(/\D/g, '') + toParse, defaultRegion);
        const countryCode = parsed.getCountryCode();
        const nationalNumber = parsed.getNationalNumber()?.toString() || '';
        const isValid = phoneUtil.isValidNumber(parsed);

        return {
            dialCode: `+${countryCode}`,
            phoneNumber: nationalNumber,
            isValid
        };
    } catch (e) {
        const cleanedDigits = cleaned.replace(/\D/g, '');
        const sorted = [...DEFAULT_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        
        const match = sorted.find(d => cleaned.startsWith(d.dialCode));
        if (match) {
            return {
                dialCode: match.dialCode,
                phoneNumber: cleaned.slice(match.dialCode.length).replace(/\D/g, ''),
                isValid: false
            };
        }

        const matchDigits = sorted.find(d => {
            const digits = d.dialCode.replace(/\D/g, '');
            return digits && cleanedDigits.startsWith(digits) && cleanedDigits.length > digits.length + 5;
        });
        if (matchDigits) {
            const digits = matchDigits.dialCode.replace(/\D/g, '');
            return {
                dialCode: matchDigits.dialCode,
                phoneNumber: cleanedDigits.slice(digits.length),
                isValid: false
            };
        }

        return {
            dialCode: defaultDialCode,
            phoneNumber: cleanedDigits.replace(/^0+/, ''),
            isValid: false
        };
    }
}

console.log("Testing with +929876532111:", parsePhoneWithLib("+929876532111"));
