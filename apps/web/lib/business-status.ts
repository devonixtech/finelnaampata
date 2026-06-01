export type BusinessStatusType = 'ONLINE' | 'OFFLINE';
export type BusinessOpenStatusType = 'OPEN' | 'CLOSED' | 'UNKNOWN';

/**
 * Returns simple Online/Offline status based purely on business account login state.
 * - Online  = business account is currently logged in (isOnline === true)
 * - Offline = business account is not logged in
 */
export function getVendorOnlineStatus(
    isOnline: boolean = false
): { status: BusinessStatusType; label: string; color: string; dotColor: string } {
    if (isOnline) {
        return {
            status: 'ONLINE',
            label: 'Online',
            color: 'emerald',
            dotColor: 'bg-emerald-500',
        };
    }
    return {
        status: 'OFFLINE',
        label: 'Offline',
        color: 'rose',
        dotColor: 'bg-rose-500',
    };
}

// Keep the old export for any remaining usages — it now returns pure login-based status
export function getBusinessStatus(
    _hours: any,
    isOnline: boolean = false,
    _lastActiveAt?: string | Date,
    _lastLogoutAt?: string | Date
) {
    return {
        ...getVendorOnlineStatus(isOnline),
        message: isOnline ? 'Online' : 'Offline',
        lastSeen: undefined,
    };
}

/**
 * Parses a time string like "09:00", "9:00 AM", "09:00:00" into total minutes since midnight.
 */
function parseTimeToMinutes(time: string): number | null {
    if (!time) return null;
    const cleanTime = String(time).trim();

    // Handle "HH:MM:SS" or "HH:MM"
    const iso = cleanTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (iso) {
        return parseInt(iso[1]) * 60 + parseInt(iso[2]);
    }

    // Handle "HH:MM AM/PM"
    const ampm = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampm) {
        let h = parseInt(ampm[1]);
        const m = parseInt(ampm[2]);
        const period = ampm[3].toUpperCase();
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    }

    return null;
}

/**
 * Determines if the business is currently Open or Closed based on its businessHours (Array or Record).
 */
export function getBusinessOpenStatus(
    businessHours?: any
): { status: BusinessOpenStatusType; label: string; todayHours: string | null } {
    const log = (msg: string, data?: any) => {
        if (typeof window !== 'undefined') {
            console.log(`[business-status] ${msg}`, data || '');
        }
    };

    if (!businessHours) {
        return { status: 'UNKNOWN', label: '', todayHours: null };
    }

    const now = new Date();
    const todayLong = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayShort = todayLong.substring(0, 3); // "mon", "tue", etc.

    let todayEntry: { isOpen: boolean; openTime: string; closeTime: string } | null = null;

    // Case 1: Array format (Listing entity)
    if (Array.isArray(businessHours)) {
        if (businessHours.length === 0) return { status: 'UNKNOWN', label: '', todayHours: null };
        
        const entry = businessHours.find(h => {
            if (!h || !h.dayOfWeek) return false;
            const day = String(h.dayOfWeek).toLowerCase();
            return day === todayLong || day === todayShort;
        });
        
        if (entry) {
            todayEntry = {
                isOpen: entry.isOpen,
                openTime: entry.openTime,
                closeTime: entry.closeTime
            };
        }
    } 
    // Case 2: Record format (Vendor jsonb)
    else if (typeof businessHours === 'object') {
        // Try various key formats
        const entry = businessHours[todayLong] || businessHours[todayShort] || 
                     businessHours[todayLong.charAt(0).toUpperCase() + todayLong.slice(1)] ||
                     businessHours[todayShort.charAt(0).toUpperCase() + todayShort.slice(1)];
        
        if (entry) {
            todayEntry = {
                isOpen: entry.isOpen,
                openTime: entry.openTime,
                closeTime: entry.closeTime
            };
        }
    }

    if (!todayEntry) {
        log(`UNKNOWN: No entry found for today "${todayLong}".`);
        return { status: 'UNKNOWN', label: '', todayHours: null };
    }

    // If the business marks this day as closed
    if (!todayEntry.isOpen) {
        return { status: 'CLOSED', label: 'Closed Today', todayHours: null };
    }

    const openMins = parseTimeToMinutes(todayEntry.openTime);
    const closeMins = parseTimeToMinutes(todayEntry.closeTime);

    if (openMins === null || closeMins === null) {
        return {
            status: 'OPEN',
            label: 'Working',
            todayHours: todayEntry.openTime && todayEntry.closeTime ? `${todayEntry.openTime} – ${todayEntry.closeTime}` : 'Open',
        };
    }

    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Handle overnight hours (e.g., 22:00 – 02:00)
    const isOpen = closeMins < openMins
        ? currentMins >= openMins || currentMins < closeMins
        : currentMins >= openMins && currentMins < closeMins;

    const hoursLabel = `${todayEntry.openTime} – ${todayEntry.closeTime}`;

    return {
        status: isOpen ? 'OPEN' : 'CLOSED',
        label: isOpen ? 'Working' : 'Closed Now',
        todayHours: hoursLabel,
    };
}
