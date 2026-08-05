"use client";

import React, { useEffect, useRef } from 'react';

interface ImpressionTrackerProps {
  businessId: string;
  children: React.ReactNode;
}

// Keep track of which business IDs have been queued for tracking
const impressionQueue = new Set<string>();
const trackedIds = new Set<string>();
let impressionTimeout: NodeJS.Timeout | null = null;

const sendImpressions = () => {
  if (impressionQueue.size === 0) return;
  
  const ids = Array.from(impressionQueue);
  impressionQueue.clear();
  
  fetch('/api/analytics/track/impression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessIds: ids })
  }).catch(err => console.error('Failed to track impressions', err));
};

export default function ImpressionTracker({ businessId, children }: ImpressionTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trackedIds.has(businessId)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !trackedIds.has(businessId)) {
            trackedIds.add(businessId);
            impressionQueue.add(businessId);
            
            if (impressionTimeout) clearTimeout(impressionTimeout);
            
            // Debounce the fetch call by 2 seconds to batch multiple impressions
            impressionTimeout = setTimeout(sendImpressions, 2000);
            
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
          }
        });
      },
      { threshold: 0.5 } // 50% of the card must be visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [businessId]);

  return <div ref={containerRef}>{children}</div>;
}
