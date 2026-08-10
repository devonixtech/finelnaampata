import { api } from './api';
import { visibilityDayCount } from './location-detect';

const DEFAULT_DAY_RATE = 150;

export async function fetchVisibilityDayRate(type: 'deal' | 'event'): Promise<{ dayRate: number; placementRates: Record<string, number> }> {
    try {
        const res = await api.promotions.getVisibilityRate(type);
        return {
            dayRate: Number(res?.dayRate) || DEFAULT_DAY_RATE,
            placementRates: res?.placementRates || {},
        };
    } catch {
        return { dayRate: DEFAULT_DAY_RATE, placementRates: {} };
    }
}

export async function calculateVisibilityTotal(
    startDate: string,
    endDate: string,
    type: 'deal' | 'event',
): Promise<{ days: number; dayRate: number; totalPrice: number }> {
    if (!startDate || !endDate) {
        return { days: 0, dayRate: DEFAULT_DAY_RATE, totalPrice: 0 };
    }
    try {
        const res = await api.promotions.calculateVisibility({
            startTime: startDate,
            endTime: endDate,
            type,
        });
        return {
            days: res.days,
            dayRate: res.dayRate,
            totalPrice: res.totalPrice,
        };
    } catch {
        const dayRate = await fetchVisibilityDayRate(type);
        const days = visibilityDayCount(startDate, endDate);
        return { days, dayRate, totalPrice: days * dayRate };
    }
}

export async function checkoutVisibilityPayment(params: {
    dealId?: string;
    eventId?: string;
    startTime: string;
    endTime: string;
    placements?: string[];
}): Promise<{ paid: boolean; checkoutUrl?: string }> {
    const placements = params.placements && params.placements.length > 0 
        ? params.placements 
        : (params.dealId ? ['offer'] : ['event']);
        
    const res = await api.promotions.book({
        ...params,
        placements,
    });
    if (res.checkoutUrl) {
        return { paid: false, checkoutUrl: res.checkoutUrl };
    }
    return { paid: true };
}
