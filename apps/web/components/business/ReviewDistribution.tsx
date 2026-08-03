"use client";

import React, { useMemo } from 'react';
import { Star } from 'lucide-react';

interface Review {
    rating: number;
    [key: string]: any;
}

interface RatingDistribution {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
}

interface ReviewDistributionProps {
    reviews?: Review[];
    ratingDistribution?: RatingDistribution;
}

function getBarColor(star: number): string {
    if (star === 5) return 'bg-green-500';
    if (star === 4) return 'bg-green-400';
    if (star === 3) return 'bg-yellow-400';
    if (star === 2) return 'bg-orange-400';
    return 'bg-red-400';
}

function getBarColorHex(star: number): string {
    if (star === 5) return '#22C55E';
    if (star === 4) return '#4ADE80';
    if (star === 3) return '#FACC15';
    if (star === 2) return '#FB923C';
    return '#F87171';
}

export default function ReviewDistribution({ reviews = [], ratingDistribution }: ReviewDistributionProps) {
    const distribution = useMemo(() => {
        if (ratingDistribution) {
            return ratingDistribution;
        }

        const counts: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach((review) => {
            const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
            counts[rating as keyof RatingDistribution]++;
        });
        return counts;
    }, [reviews, ratingDistribution]);

    const totalReviews = useMemo(() => {
        return Object.values(distribution).reduce((sum, count) => sum + count, 0);
    }, [distribution]);

    const averageRating = useMemo(() => {
        if (totalReviews === 0) return 0;
        const weightedSum = Object.entries(distribution).reduce(
            (sum, [star, count]) => sum + Number(star) * count,
            0
        );
        return weightedSum / totalReviews;
    }, [distribution, totalReviews]);

    const maxCount = useMemo(() => {
        return Math.max(...Object.values(distribution), 1);
    }, [distribution]);

    const stars = [5, 4, 3, 2, 1] as const;

    return (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                    <div className="text-4xl font-black text-slate-900">{averageRating.toFixed(1)}</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-4 h-4 ${
                                    i < Math.round(averageRating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">
                        {totalReviews.toLocaleString()} reviews
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {stars.map((star) => {
                    const count = distribution[star];
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

                    return (
                        <div key={star} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-8">
                                <span className="text-sm font-bold text-slate-700">{star}</span>
                                <Star className="w-3 h-3 fill-slate-300 text-slate-300" />
                            </div>
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(star)}`}
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>
                            <div className="w-12 text-right">
                                <span className="text-sm font-medium text-slate-600">
                                    {count.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
