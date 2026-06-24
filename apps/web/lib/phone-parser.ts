import { PhoneNumberUtil } from 'google-libphonenumber';
import { DEFAULT_DIAL_CODES } from './phone-codes';

const phoneUtil = PhoneNumberUtil.getInstance();

export type ParsedPhoneResult = {
    dialCode: string;
    phoneNumber: string;
    isValid: boolean;
};

/**
 * Parses any raw phone number using google-libphonenumber, with a fallback mapping
 * to extract the correct dialCode and clean national number.
 */
export function parsePhoneWithLib(rawPhone: string, defaultDialCode = '+92'): ParsedPhoneResult {
    if (!rawPhone) {
        return { dialCode: defaultDialCode, phoneNumber: '', isValid: false };
    }

    const cleaned = rawPhone.trim();
    
    // Try to parse using google-libphonenumber
    try {
        // If it looks like an international number but lacks a '+', prepend '+'
        let toParse = cleaned;
        if (!toParse.startsWith('+')) {
            // Check if it starts with any known dial codes (digits only)
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
        // Fallback manual parsing if libphonenumber fails
        const cleanedDigits = cleaned.replace(/\D/g, '');
        const sorted = [...DEFAULT_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        
        // Match by dial code directly
        const match = sorted.find(d => cleaned.startsWith(d.dialCode));
        if (match) {
            return {
                dialCode: match.dialCode,
                phoneNumber: cleaned.slice(match.dialCode.length).replace(/\D/g, ''),
                isValid: false
            };
        }

        // Match by dial code digits
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

        // Default fallback
        return {
            dialCode: defaultDialCode,
            phoneNumber: cleanedDigits.replace(/^0+/, ''),
            isValid: false
        };
    }
}

export function getRegionCodeFromDialCode(dialCode: string): string {
    const match = DEFAULT_DIAL_CODES.find(d => d.dialCode === dialCode);
    return match ? match.code : 'PK';
}

/**
 * Cleans user input while typing or pasting a phone number.
 * Can detect and switch the country code prefix if user pastes an international number.
 */
export function cleanPastedPhone(value: string, currentDialCode: string): { dialCode?: string; phoneNumber: string } {
    const trimmed = value.trim();
    if (!trimmed) return { phoneNumber: '' };

    try {
        if (trimmed.startsWith('+')) {
            const parsed = phoneUtil.parse(trimmed);
            const cc = parsed.getCountryCode();
            return {
                dialCode: `+${cc}`,
                phoneNumber: parsed.getNationalNumber()?.toString() || ''
            };
        }
        
        const digits = trimmed.replace(/\D/g, '');
        // Check if digits start with any of our dial codes
        const sorted = [...DEFAULT_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        const matched = sorted.find(d => {
            const dcDigits = d.dialCode.replace(/\D/g, '');
            return dcDigits && digits.startsWith(dcDigits) && digits.length > dcDigits.length + 5;
        });
        if (matched) {
            const dcDigits = matched.dialCode.replace(/\D/g, '');
            return {
                dialCode: matched.dialCode,
                phoneNumber: digits.slice(dcDigits.length)
            };
        }
    } catch (e) {
        // Fallback
    }

    // Default basic cleaning
    let cleaned = trimmed.replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    const ccDigits = currentDialCode.replace(/\D/g, '');
    if (ccDigits && cleaned.startsWith(ccDigits) && cleaned.length > ccDigits.length + 5) {
        cleaned = cleaned.substring(ccDigits.length);
    }
    return { phoneNumber: cleaned };
}
