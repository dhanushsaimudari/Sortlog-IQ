'use client';

import React, { useState, useEffect } from 'react';
import { ProductTable } from '../../components/products/ProductTable';
import { ProductFilters } from '../../components/products/ProductFilters';
import { fetchProducts } from '../../lib/api/products';
import { Product } from '../../types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();

    const handleUpdate = () => loadProducts();
    window.addEventListener('session-changed', handleUpdate);
    window.addEventListener('catalog-updated', handleUpdate);

    return () => {
      window.removeEventListener('session-changed', handleUpdate);
      window.removeEventListener('catalog-updated', handleUpdate);
    };
  }, [searchQuery, statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    const res = await fetchProducts({ search: searchQuery, quality_status: statusFilter });
    setProducts(res.items);
    setLoading(false);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 font-mono">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Product Master Catalogue</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">Enriched product catalog items matching Unilog 252-column schema</p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Total Items: {products.length}</span>
      </div>

      {/* Filters */}
      <ProductFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={handleReset}
      />

      {/* Product Table */}
      {loading ? (
        <div className="p-12 text-center font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
          Loading catalog products...
        </div>
      ) : (
        <ProductTable products={products} />
      )}
    </div>
  );
}
