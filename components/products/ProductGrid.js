'use client'

// components/products/ProductGrid.js
'use client';
import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { FiGrid, FiList, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function ProductGrid({ 
  products = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  totalProducts = 0,
  viewMode: initialViewMode = 'grid',
  onViewModeChange,
  sortBy: initialSortBy = 'newest',
  onSortChange,
  showSort = true,
  showViewToggle = true,
  showPagination = true,
  emptyMessage = 'Товары не найдены',
  className = ''
}) {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortedProducts, setSortedProducts] = useState([]);

  // Сортировка товаров
  useEffect(() => {
    let sorted = [...products];
    
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    
    setSortedProducts(sorted);
  }, [products, sortBy]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    if (onSortChange) onSortChange(value);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Опции сортировки
  const sortOptions = [
    { value: 'newest', label: 'Сначала новые' },
    { value: 'price_asc', label: 'Сначала дешевле' },
    { value: 'price_desc', label: 'Сначала дороже' },
    { value: 'rating', label: 'По рейтингу' },
    { value: 'popular', label: 'Популярные' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" text="Загрузка товаров..." />
      </div>
    );
  }

  if (sortedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">{emptyMessage}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Обновить
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Панель управления */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Количество товаров */}
          <div className="text-sm text-gray-600">
            Найдено: <span className="font-semibold">{totalProducts || sortedProducts.length}</span> товаров
          </div>

          <div className="flex items-center space-x-4">
            {/* Сортировка */}
            {showSort && (
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* Переключение вида */}
            {showViewToggle && (
              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 transition ${
                    viewMode === 'grid' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 transition ${
                    viewMode === 'list' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Сетка товаров */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
      }>
        {sortedProducts.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Загрузка еще */}
      {hasMore && onLoadMore && (
        <div className="text-center mt-8">
          <Button
            onClick={onLoadMore}
            disabled={loadingMore}
            variant="outline"
            size="lg"
          >
            {loadingMore ? 'Загрузка...' : 'Загрузить еще'}
          </Button>
        </div>
      )}

      {/* Пагинация */}
      {showPagination && !hasMore && sortedProducts.length > 0 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            
            {[1, 2, 3, 4, 5].map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg transition ${
                  currentPage === page
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === 5}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </nav>
        </div>
      )}

      {/* Индикатор загрузки дополнительных товаров */}
      {loadingMore && (
        <div className="flex justify-center mt-4">
          <Spinner size="md" />
        </div>
      )}
    </div>
  );
}

// Компонент для отображения статистики товаров
export function ProductStats({ products }) {
  const stats = {
    total: products.length,
    categories: new Set(products.map(p => p.category)).size,
    sellers: new Set(products.map(p => p.sellerId)).size,
    avgPrice: products.length > 0 
      ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
      : 0,
    minPrice: products.length > 0 
      ? Math.min(...products.map(p => p.price))
      : 0,
    maxPrice: products.length > 0 
      ? Math.max(...products.map(p => p.price))
      : 0
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="font-semibold mb-3">Статистика</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500">Всего товаров</p>
          <p className="text-lg font-bold">{stats.total}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Категорий</p>
          <p className="text-lg font-bold">{stats.categories}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Продавцов</p>
          <p className="text-lg font-bold">{stats.sellers}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Средняя цена</p>
          <p className="text-lg font-bold">{stats.avgPrice} тенге</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Мин. цена</p>
          <p className="text-lg font-bold">{stats.minPrice} тенге</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Макс. цена</p>
          <p className="text-lg font-bold">{stats.maxPrice} тенге</p>
        </div>
      </div>
    </div>
  );
}