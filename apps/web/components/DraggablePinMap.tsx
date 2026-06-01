'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
    latitude: number;
    longitude: number;
    onChange: (lat: number, lng: number) => void;
    className?: string;
    zoom?: number;
};

const DEFAULT_LAT = 30.3753;
const DEFAULT_LNG = 69.3451;

export default function DraggablePinMap({
    latitude,
    longitude,
    onChange,
    className = '',
    zoom = 15,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const lat = Number.isFinite(latitude) ? latitude : DEFAULT_LAT;
        const lng = Number.isFinite(longitude) ? longitude : DEFAULT_LNG;

        const map = L.map(containerRef.current, {
            center: [lat, lng],
            zoom,
            scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);

        const icon = L.divIcon({
            className: '',
            html: '<div style="width:18px;height:18px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35);margin:-9px 0 0 -9px;"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
        });

        const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);

        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
        });

        map.on('click', (e) => {
            marker.setLatLng(e.latlng);
            onChange(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const current = markerRef.current.getLatLng();
        if (Math.abs(current.lat - latitude) < 0.000001 && Math.abs(current.lng - longitude) < 0.000001) {
            return;
        }

        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.panTo([latitude, longitude], { animate: true });
    }, [latitude, longitude]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full min-h-[280px] rounded-2xl overflow-hidden ${className}`}
        />
    );
}
