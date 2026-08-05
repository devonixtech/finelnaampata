'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
    latitude: number;
    longitude: number;
    className?: string;
};

export default function BusinessMap({ latitude, longitude, className = '' }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const map = L.map(containerRef.current, {
            center: [latitude, longitude],
            zoom: 16,
            scrollWheelZoom: false, // Prevent accidental scrolling when scrolling page
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            maxZoom: 19,
        }).addTo(map);

        // Business Pin
        const businessIcon = L.divIcon({
            className: '',
            html: '<div style="width:24px;height:24px;background:#ea580c;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,.3);margin:-12px 0 0 -12px; display: flex; align-items: center; justify-content: center;"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        L.marker([latitude, longitude], { icon: businessIcon }).addTo(map);

        // Simulated Nearby Amenities (for visualization as requested)
        const generateDummyAmenity = (offsetLat: number, offsetLng: number, color: string, label: string) => {
            const icon = L.divIcon({
                className: '',
                html: `<div style="width:16px;height:16px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.2);margin:-8px 0 0 -8px;"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });
            L.marker([latitude + offsetLat, longitude + offsetLng], { icon })
              .addTo(map)
              .bindTooltip(label, { direction: 'top', offset: [0, -10], className: 'text-xs font-bold' });
        };

        generateDummyAmenity(0.0015, 0.001, '#3b82f6', 'Parking');
        generateDummyAmenity(-0.001, 0.002, '#10b981', 'Park');
        generateDummyAmenity(0.002, -0.0015, '#f59e0b', 'Cafe');

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [latitude, longitude]);

    return (
        <div className={`relative ${className}`}>
            <div ref={containerRef} className="w-full h-full min-h-[300px] rounded-2xl z-0 border border-slate-200" />
            <div className="absolute top-4 left-4 z-[400] flex gap-2">
                <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 border border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span> Business
                </span>
                <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 border border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Amenities
                </span>
            </div>
        </div>
    );
}
