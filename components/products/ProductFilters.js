'use client'

// components/products/ProductFilters.js
'use client';
import { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiChevronDown, 
  FiChevronUp,
  FiStar,
  FiTruck
} from 'react-icons/fi';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ProductFilters({ 
  filters, 
  onChange, 
  categories = [],
  sellers = [],
  onClose,
  isMobile = false
}) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    seller: true,
    rating: false,
    options: false
  });

  const [localFilters, setLocalFilters] = useState(filters);
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || '',
    max: filters.maxPrice || ''
  });

  // Применение фильтров
  const applyFilters = () => {
    onChange({
      ...localFilters,
      minPrice: priceRange.min,
      maxPrice: priceRange.max
    });
    if (isMobile && onClose) onClose();
  };

  // Сброс фильтров
  const resetFilters = () => {
    setLocalFilters({
      category: '',
      sellerId: '',
      search: '',
      sortBy: 'newest',
      inStock: false,
      withCertificates: false,
      rating: 0
    });
    setPriceRange({ min: '', max: '' });
  };

  // Подсчет активных фильтров
  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.category) count++;
    if (localFilters.sellerId) count++;
    if (priceRange.min) count++;
    if (priceRange.max) count++;
    if (localFilters.inStock) count++;
    if (localFilters.withCertificates) count++;
    if (localFilters.rating > 0) count++;
    return count;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <FiFilter className="mr-2" />
          Фильтры
        </h3>
        {getActiveFiltersCount() > 0 && (
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Сбросить все
          </button>
        )}
        {isMobile && (
          <button onClick={onClose} className="p-1">
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Поиск */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Поиск товаров..."
          value={localFilters.search || ''}
          onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
          icon={<FiSearch />}
        />
      </div>

      {/* Категории */}
      <div className="border-b border-gray-200 py-3">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Категории</span>
          {expandedSections.category ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.category && (
          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
            {categories.map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.category === category}
                  onChange={() => setLocalFilters({ 
                    ...localFilters, 
                    category: localFilters.category === category ? '' : category 
                  })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Цена */}
      <div className="border-b border-gray-200 py-3">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Цена</span>
          {expandedSections.price ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.price && (
          <div className="mt-2 space-y-3">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="От"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                min="0"
                size="sm"
              />
              <span className="text-gray-500">—</span>
              <Input
                type="number"
                placeholder="До"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                min="0"
                size="sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Продавцы */}
      {sellers.length > 0 && (
        <div className="border-b border-gray-200 py-3">
          <button
            onClick={() => toggleSection('seller')}
            className="flex items-center justify-between w-full text-left font-medium"
          >
            <span>Продавцы</span>
            {expandedSections.seller ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          
          {expandedSections.seller && (
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
              {sellers.map(seller => (
                <label key={seller.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.sellerId === seller.id}
                    onChange={() => setLocalFilters({ 
                      ...localFilters, 
                      sellerId: localFilters.sellerId === seller.id ? '' : seller.id 
                    })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {seller.companyName || seller.name}
                  </span>
                  {seller.verified && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                      Проверен
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Рейтинг */}
      <div className="border-b border-gray-200 py-3">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Рейтинг</span>
          {expandedSections.rating ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.rating && (
          <div className="mt-2 space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <label key={rating} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.rating === rating}
                  onChange={() => setLocalFilters({ 
                    ...localFilters, 
                    rating: localFilters.rating === rating ? 0 : rating 
                  })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  {[...Array(rating)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  {rating < 5 && <span className="text-gray-400 ml-1">и выше</span>}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Дополнительные опции */}
      <div className="py-3">
        <button
          onClick={() => toggleSection('options')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Дополнительно</span>
          {expandedSections.options ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.options && (
          <div className="mt-2 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.inStock}
                onChange={(e) => setLocalFilters({ 
                  ...localFilters, 
                  inStock: e.target.checked 
                })}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Только в наличии</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.withCertificates}
                onChange={(e) => setLocalFilters({ 
                  ...localFilters, 
                  withCertificates: e.target.checked 
                })}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">С сертификатами</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.freeDelivery}
                onChange={(e) => setLocalFilters({ 
                  ...localFilters, 
                  freeDelivery: e.target.checked 
                })}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center">
                <FiTruck className="mr-1" /> Бесплатная доставка
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Активные фильтры */}
      {getActiveFiltersCount() > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Активные фильтры:</p>
          <div className="flex flex-wrap gap-2">
            {localFilters.category && (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                {localFilters.category}
                <button
                  onClick={() => setLocalFilters({ ...localFilters, category: '' })}
                  className="ml-1 hover:text-green-900"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceRange.min && (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                от {priceRange.min} тенге
                <button
                  onClick={() => setPriceRange({ ...priceRange, min: '' })}
                  className="ml-1 hover:text-green-900"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceRange.max && (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                до {priceRange.max} тенге
                <button
                  onClick={() => setPriceRange({ ...priceRange, max: '' })}
                  className="ml-1 hover:text-green-900"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="mt-6 flex space-x-2">
        <Button
          variant="primary"
          fullWidth
          onClick={applyFilters}
        >
          Применить
        </Button>
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="outline"
            onClick={resetFilters}
          >
            Сбросить
          </Button>
        )}
      </div>
    </div>
  );
}

// Мобильная версия фильтров
export function MobileProductFilters({ isOpen, onClose, ...props }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Оверлей */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Боковая панель */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
            <ProductFilters 
              isMobile={true}
              onClose={onClose}
              {...props}
            />
          </div>
        </div>
      </div>
    </div>
  );
}