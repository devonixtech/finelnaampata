"use client";

import React, { useState, useMemo } from 'react';

export default function CategoriesSidebar({ initialCategories }: { initialCategories: any[] }) {
  const [categorySearch, setCategorySearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return initialCategories;
    return initialCategories.filter((cat: any) =>
      cat.name?.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [initialCategories, categorySearch]);

  return (
    <aside className="hidden lg:flex w-80 flex-col bg-white border-r border-gray-200 h-full overflow-hidden flex-shrink-0">
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Categories</h2>
        <div className="relative">
          <input 
            type="text" 
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search categories..." 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <div className="flex-1 py-2 overflow-y-auto custom-scrollbar">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category: any) => (
            <a 
              key={category.id} 
              href={`/search?category=${category.slug}`}
              className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group border-l-4 border-transparent hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-xs text-gray-500">{category.businessCount || 0} businesses</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))
        ) : (
          <div className="p-6 text-center text-sm text-gray-500">
            No categories found matching "{categorySearch}"
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-100 text-center flex-shrink-0">
        <a href="/categories" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all categories</a>
      </div>
    </aside>
  );
}
