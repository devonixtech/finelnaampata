import { PhoneNumberUtil } from 'google-libphonenumber';
import { DEFAULT_DIAL_CODES } from './phone-codes';

const phoneUtil = PhoneNumberUtil.getInstance();

export type ParsedPhoneResult = {
    dialCode: string;
    phoneNumber: string;
    isValid: boolean;
};

/**
 * Parses any raw phone number with robust matching to extract the correct dialCode and clean national number.
 */
export function parsePhoneWithLib(rawPhone: string, defaultDialCode = '+92'): ParsedPhoneResult {
    if (!rawPhone) {
        return { dialCode: defaultDialCode, phoneNumber: '', isValid: false };
    }

    const cleaned = rawPhone.trim();
    
    // Check if it already starts with '+'
    if (cleaned.startsWith('+')) {
        const sortedCodes = [...DEFAULT_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        const match = sortedCodes.find(d => cleaned.startsWith(d.dialCode));
        if (match) {
            const phoneNumber = cleaned.slice(match.dialCode.length).replace(/\D/g, '').replace(/^0+/, '');
            return {
                dialCode: match.dialCode,
                phoneNumber,
                isValid: phoneNumber.length >= 7 && phoneNumber.length <= 15
            };
        }
    }

    // If it doesn't start with '+', clean digits
    const cleanedDigits = cleaned.replace(/\D/g, '');
    const phoneNumber = cleanedDigits.replace(/^0+/, '');
    return {
        dialCode: defaultDialCode,
        phoneNumber,
        isValid: phoneNumber.length >= 7 && phoneNumber.length <= 15
    };
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

    if (trimmed.startsWith('+')) {
        const sorted = [...DEFAULT_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        const matched = sorted.find(d => trimmed.startsWith(d.dialCode));
        if (matched) {
            return {
                dialCode: matched.dialCode,
                phoneNumber: trimmed.slice(matched.dialCode.length).replace(/\D/g, '').replace(/^0+/, '')
            };
        }
    }

    let cleaned = trimmed.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    return { phoneNumber: cleaned };
}
