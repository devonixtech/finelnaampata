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

// Generate 18 hours (6 AM to 11 PM)
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

function generateBusyLevels(): number[] {
    const levels: number[] = [];
    for (let i = 0; i < 24; i++) {
        if (i < 6) levels.push(0);
        else if (i < 9) levels.push(0.1 + Math.random() * 0.2); // 6am-9am
        else if (i < 12) levels.push(0.3 + Math.random() * 0.3); // 9am-12pm
        else if (i < 14) levels.push(0.6 + Math.random() * 0.4); // 12pm-2pm (Peak)
        else if (i < 17) levels.push(0.4 + Math.random() * 0.3); // 2pm-5pm
        else if (i < 20) levels.push(0.7 + Math.random() * 0.3); // 5pm-8pm (Peak)
        else if (i < 22) levels.push(0.3 + Math.random() * 0.2); // 8pm-10pm
        else levels.push(0.1 + Math.random() * 0.1); // 10pm+
    }
    return levels;
}

function getCurrentBusyText(level: number): string {
    if (level < 0.2) return 'Usually not too busy';
    if (level < 0.4) return 'Usually a little busy';
    if (level < 0.6) return 'Usually moderately busy';
    if (level < 0.8) return 'Usually very busy';
    return 'Usually as busy as it gets';
}

function formatHourLabel(hour: number) {
    if (hour === 12) return '12p';
    if (hour > 12) return `${hour - 12}p`;
    return `${hour}a`;
}

export default function PopularTimesChart({ businessHours = [] }: PopularTimesChartProps) {
    const today = new Date();
    const todayIndex = today.getDay();
    const currentHour = today.getHours();
    
    // Start with today's day, unless it is undefined in the map
    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[todayIndex]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [hoveredHour, setHoveredHour] = useState<number | null>(null);

    // Generate static busy levels so they don't jump around on re-renders
    const busyLevels = useMemo(() => generateBusyLevels(), []);

    const selectedDayHours = useMemo(() => {
        const dayHours = businessHours.find(
            h => h.dayOfWeek.toLowerCase() === selectedDay
        );
        // Fallback to open if no specific hours are given, to ensure the UI looks good
        if (!dayHours && businessHours.length === 0) {
            return { isOpen: true, openTime: '09:00', closeTime: '21:00' };
        }
        return dayHours || { isOpen: false, openTime: '09:00', closeTime: '17:00' };
    }, [businessHours, selectedDay]);

    const isToday = selectedDay === DAYS_OF_WEEK[todayIndex];

    const getBarData = useMemo(() => {
        return HOURS.map((hour) => {
            let level = busyLevels[hour];
            const isPast = isToday && hour < currentHour;
            const isCurrent = isToday && hour === currentHour;
            const isOpen = selectedDayHours.isOpen;
            
            // Try to figure out if business is open at this hour
            let isHourOpen = isOpen;
            if (isOpen && selectedDayHours.openTime && selectedDayHours.closeTime) {
                const openH = parseInt(selectedDayHours.openTime.split(':')[0] || '0', 10);
                const closeH = parseInt(selectedDayHours.closeTime.split(':')[0] || '24', 10);
                if (hour < openH || hour >= closeH) {
                    isHourOpen = false;
                }
            }

            // If closed at this hour, level is 0
            if (!isHourOpen) level = 0;

            const barHeight = isHourOpen ? Math.max(level * 100, 5) : 0; // At least 5% if open so we see a tiny bump

            return {
                hour,
                label: formatHourLabel(hour),
                height: barHeight,
                isPast,
                isCurrent,
                isHourOpen,
                level,
            };
        });
    }, [busyLevels, selectedDay, isToday, currentHour, selectedDayHours]);

    const currentLevel = getBarData.find(d => d.isCurrent);
    
    // Determine the text to show below the chart
    let busyText = 'Closed';
    if (selectedDayHours.isOpen) {
        if (hoveredHour !== null) {
            const hoveredData = getBarData.find(d => d.hour === hoveredHour);
            if (hoveredData && hoveredData.isHourOpen) {
                busyText = `${formatHourLabel(hoveredHour).toUpperCase()}: ${getCurrentBusyText(hoveredData.level)}`;
            } else {
                busyText = `${formatHourLabel(hoveredHour).toUpperCase()}: Closed`;
            }
        } else if (isToday && currentLevel && currentLevel.isHourOpen) {
            busyText = `Right now: ${getCurrentBusyText(currentLevel.level)}`;
        } else {
            busyText = 'Hover over a bar for details';
        }
    }

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-visible">
            <div className="flex items-center justify-between mb-8 relative z-10">
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
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setDropdownOpen(false)} 
                            />
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-slate-100 shadow-xl z-50 py-2 min-w-[160px]">
                                {DAYS_OF_WEEK.map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => {
                                            setSelectedDay(day);
                                            setDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                            selectedDay === day
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        {DAY_LABELS[day]}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="relative h-44 mb-6">
                {/* Background Dotted Line */}
                <div className="absolute top-[20%] left-0 right-0 border-b-2 border-dotted border-slate-200" />
                
                <div className="flex items-end justify-between h-full relative z-10 gap-1 sm:gap-2 px-2 pb-6">
                    {getBarData.map((bar) => {
                        let bgColor = 'bg-blue-100'; // Default light blue
                        if (bar.isCurrent) {
                            bgColor = 'bg-pink-500 shadow-sm shadow-pink-200'; // Current hour (Pink/Red)
                        } else if (bar.isPast) {
                            bgColor = 'bg-slate-200'; // Past hours
                        } else if (bar.isHourOpen) {
                            bgColor = 'bg-blue-500 hover:bg-blue-600'; // Future hours
                        }

                        // Determine if we should show a label under this bar
                        // Google usually shows labels for 6a, 9a, 12p, 3p, 6p, 9p
                        const showLabel = [6, 9, 12, 15, 18, 21].includes(bar.hour);

                        return (
                            <div 
                                key={bar.hour} 
                                className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                                onMouseEnter={() => setHoveredHour(bar.hour)}
                                onMouseLeave={() => setHoveredHour(null)}
                            >
                                {/* The Bar */}
                                <div
                                    className={`w-full max-w-[20px] rounded-t-sm transition-all duration-300 ${bgColor}`}
                                    style={{ height: `${bar.height}%` }}
                                />
                                
                                {/* X-Axis Label */}
                                {showLabel && (
                                    <span className="absolute -bottom-6 text-[11px] font-medium text-slate-400">
                                        {bar.label}
                                    </span>
                                )}

                                {/* Hover Tooltip (Optional visual flair) */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block w-max max-w-[120px] text-center bg-slate-800 text-white text-[10px] py-1 px-2 rounded z-20 pointer-events-none">
                                    {bar.isHourOpen ? `${Math.round(bar.level * 100)}% busy` : 'Closed'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100/50">
                <div className="flex items-center gap-2">
                    {isToday && currentLevel?.isHourOpen && (
                        <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                    )}
                    <p className="text-sm font-semibold text-slate-700">
                        {busyText}
                    </p>
                </div>
            </div>
        </div>
    );
}
