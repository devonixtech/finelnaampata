"use client";

import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { BusinessHours } from '../../types/api';

interface PopularTimesChartProps {
    businessHours?: BusinessHours[];
}

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const DAY_LABELS: Record<string, string> = {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
};

const HOURS = [
    { label: '6a', value: 6 },
    { label: '9a', value: 9 },
    { label: '12p', value: 12 },
    { label: '3p', value: 15 },
    { label: '6p', value: 18 },
    { label: '9p', value: 21 },
    { label: '12a', value: 0 },
];

function generateBusyLevels(): number[] {
    const levels: number[] = [];
    for (let i = 0; i < 24; i++) {
        if (i < 6) levels.push(0.05);
        else if (i < 9) levels.push(0.3 + Math.random() * 0.2);
        else if (i < 12) levels.push(0.5 + Math.random() * 0.3);
        else if (i < 14) levels.push(0.7 + Math.random() * 0.3);
        else if (i < 17) levels.push(0.5 + Math.random() * 0.3);
        else if (i < 20) levels.push(0.6 + Math.random() * 0.3);
        else if (i < 22) levels.push(0.3 + Math.random() * 0.2);
        else levels.push(0.1 + Math.random() * 0.15);
    }
    return levels;
}

function getCurrentBusyText(level: number): string {
    if (level < 0.2) return 'Not busy yet';
    if (level < 0.4) return 'A little busy';
    if (level < 0.6) return 'Moderately busy';
    if (level < 0.8) return 'Very busy';
    return 'As busy as it gets';
}

export default function PopularTimesChart({ businessHours = [] }: PopularTimesChartProps) {
    const today = new Date();
    const todayIndex = today.getDay();
    const currentHour = today.getHours();
    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[todayIndex]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const busyLevels = useMemo(() => generateBusyLevels(), []);

    const selectedDayHours = useMemo(() => {
        const dayHours = businessHours.find(
            h => h.dayOfWeek.toLowerCase() === selectedDay
        );
        return dayHours || { isOpen: false, openTime: '09:00', closeTime: '17:00' };
    }, [businessHours, selectedDay]);

    const getBarData = useMemo(() => {
        return HOURS.map(({ label, value }) => {
            const hour = value === 0 ? 0 : value;
            const level = busyLevels[hour];
            const isPast = selectedDay === DAYS_OF_WEEK[todayIndex] && hour < currentHour;
            const isOpen = selectedDayHours.isOpen;
            const barHeight = isOpen ? level * 100 : 5;

            return {
                label,
                height: barHeight,
                isPast,
                level,
            };
        });
    }, [busyLevels, selectedDay, todayIndex, currentHour, selectedDayHours.isOpen]);

    const currentLevel = getBarData.find(d => {
        if (selectedDay !== DAYS_OF_WEEK[todayIndex]) return false;
        return d.label === '6a' && currentHour < 9 ||
               d.label === '9a' && currentHour >= 9 && currentHour < 12 ||
               d.label === '12p' && currentHour >= 12 && currentHour < 15 ||
               d.label === '3p' && currentHour >= 15 && currentHour < 18 ||
               d.label === '6p' && currentHour >= 18 && currentHour < 21 ||
               d.label === '9p' && currentHour >= 21 && currentHour < 24;
    });

    const busyText = selectedDayHours.isOpen
        ? getCurrentBusyText(currentLevel?.level || 0)
        : 'Closed';

    return (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Popular Times</h3>
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                    >
                        {DAY_LABELS[selectedDay]}
                        <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-slate-100 shadow-lg z-50 py-2 min-w-[140px]">
                            {DAYS_OF_WEEK.map((day) => (
                                <button
                                    key={day}
                                    onClick={() => {
                                        setSelectedDay(day);
                                        setDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                                        selectedDay === day
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {DAY_LABELS[day]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-end gap-2 h-40 mb-4">
                {getBarData.map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full h-full flex items-end">
                            <div
                                className={`w-full rounded-t-sm transition-all duration-300 ${
                                    selectedDay === DAYS_OF_WEEK[todayIndex]
                                        ? bar.isPast
                                            ? 'bg-slate-200'
                                            : 'bg-blue-500'
                                        : 'bg-slate-200'
                                }`}
                                style={{ height: `${bar.height}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 px-1">
                {HOURS.map((hour, i) => (
                    <div key={i} className="flex-1 text-center">
                        <span className="text-[10px] font-medium text-slate-400">
                            {hour.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-600 text-center">
                    {busyText}
                </p>
            </div>
        </div>
    );
}
