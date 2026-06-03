'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { createPlacesSessionToken, resetPlacesSessionToken } from '../lib/places-session';

export type PlaceSelection = {
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    streetAddress?: string;
};

type Props = {
    value: string;
    onChange: (value: string) => void;
    onPlaceSelected: (place: PlaceSelection) => void;
    countryCode?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
};

export default function AddressPlacesAutocomplete({
    value,
    onChange,
    onPlaceSelected,
    countryCode,
    placeholder = 'Start typing street address (min 3 characters)...',
    className = '',
    disabled = false,
    required = false,
}: Props) {
    const sessionRef = useRef(createPlacesSessionToken());
    const [suggestions, setSuggestions] = useState<Array<{ placeId: string; description: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (disabled || !value || value.trim().length < 3) {
            setSuggestions([]);
            setLoading(false);
            setError('');
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const results = await api.location.placesAutocomplete({
                    input: value.trim(),
                    sessionToken: sessionRef.current,
                    countryCode,
                });
                setSuggestions(Array.isArray(results) ? results : []);
                setOpen(true);
            } catch {
                setSuggestions([]);
                setError('Address suggestions unavailable — enter manually.');
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [value, countryCode, disabled]);

    const handleSelect = async (placeId: string, description: string) => {
        setLoading(true);
        setError('');
        try {
            const details = await api.location.resolvePlace(description, sessionRef.current);
            resetPlacesSessionToken(sessionRef);
            if (details) {
                onPlaceSelected({
                    placeId: details.placeId,
                    formattedAddress: details.formattedAddress,
                    latitude: details.latitude,
                    longitude: details.longitude,
                    city: details.city,
                    state: details.state,
                    postalCode: details.postalCode,
                    country: details.country,
                    streetAddress: details.streetAddress,
                });
                onChange(details.streetAddress || details.formattedAddress || description);
            } else {
                onChange(description);
            }
            setSuggestions([]);
            setOpen(false);
        } catch {
            setError('Could not load address details. Please enter manually.');
            onChange(description);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                disabled={disabled}
                placeholder={placeholder}
                required={required}
                onChange={(e) => {
                    resetPlacesSessionToken(sessionRef);
                    onChange(e.target.value);
                }}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className={className}
                autoComplete="off"
            />
            {loading ? (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin pointer-events-none" />
            ) : (
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            )}
            {error && <p className="text-[10px] text-amber-600 font-bold mt-1">{error}</p>}
            {open && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-lg">
                    {suggestions.map((item) => (
                        <button
                            key={item.placeId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelect(item.placeId, item.description)}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                        >
                            {item.description}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
