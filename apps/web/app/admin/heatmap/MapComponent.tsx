"use client";

import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface HeatmapDataPoint {
    lat?: number;
    latitude?: number;
    lng?: number;
    longitude?: number;
    weight?: number;
    intensity?: number;
    label?: string;
    keyword?: string;
    count?: number;
}

interface MapComponentProps {
    data: HeatmapDataPoint[];
}

export default function MapComponent({ data }: MapComponentProps) {
    // Default center (can be dynamically calculated based on data)
    const defaultCenter: [number, number] = [31.5204, 74.3587]; // Lahore roughly, or anywhere
    const center = data.length > 0 
        ? [(data[0].lat || data[0].latitude || defaultCenter[0]), (data[0].lng || data[0].longitude || defaultCenter[1])] as [number, number]
        : defaultCenter;

    return (
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {data.map((point, index) => {
                const lat = point.lat || point.latitude;
                const lng = point.lng || point.longitude;
                if (lat === undefined || lng === undefined) return null;

                const weight = point.weight || point.intensity || point.count || 1;
                const label = point.label || point.keyword || "Search Demand";

                // Map weight to a radius/opacity
                const radius = Math.min(Math.max(weight * 2, 8), 30);
                const opacity = Math.min(Math.max(weight * 0.1, 0.3), 0.8);

                return (
                    <CircleMarker
                        key={index}
                        center={[lat, lng]}
                        radius={radius}
                        fillColor="#ef4444" // red-500
                        fillOpacity={opacity}
                        color="transparent" // no border
                    >
                        <Popup>
                            <div className="text-sm font-semibold">{label}</div>
                            <div className="text-xs text-slate-500">Weight: {weight}</div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
