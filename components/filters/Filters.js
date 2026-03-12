'use client'

// components/filters/Filters.js
'use client';
import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';

export default function Filters({ filters, onChange, categories, sellers }) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    seller: true,
    options: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePriceChange = (type, value) => {
    onChange({
      ...filters,
      [type]: value
    });
  };

  const handleCategoryChange = (category) => {
    onChange({
      ...filters,
      category: filters.category === category ? '' : category
    });
  };

  const handleSellerChange = (sellerId) => {
    onChange({
      ...filters,
      sellerId: filters.sellerId === sellerId ? '' : sellerId
    });
  };

  const handleCheckboxChange = (field) => {
    onChange({
      ...filters,
      [field]: !filters[field]
    });
  };

  const activeFiltersCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.sellerId,
    filters.inStock,
    filters.withCertificates
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Активные фильтры */}
      {activeFiltersCount > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Активные фильтры:
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                {filters.category}
                <button
                  onClick={() => onChange({ ...filters, category: '' })}
                  className="ml-1 hover:text-green-900"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.minPrice && (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                от {filters.minPrice} тенге
                <button
                  onClick={() => onChange({ ...filters, minPrice: '' })}
                  className="ml-1 hover:text-green-900"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.maxPrice && (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                до {filters.maxPrice} тенге
                <button
                  onClick={() => onChange({ ...filters, maxPrice: '' })}
                  className="ml-1 hover:text-green-900"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.inStock && (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                В наличии
                <button
                  onClick={() => onChange({ ...filters, inStock: false })}
                  className="ml-1 hover:text-green-900"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Категории */}
      <div className="border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-2"
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
                  checked={filters.category === category}
                  onChange={() => handleCategoryChange(category)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Цена */}
      <div className="border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-2"
        >
          <span>Цена</span>
          {expandedSections.price ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.price && (
          <div className="mt-2 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">От</label>
              <input
                type="number"
                min="0"
                value={filters.minPrice}
                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">До</label>
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                placeholder="100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Продавцы */}
      {sellers.length > 0 && (
        <div className="border-b border-gray-200 pb-6">
          <button
            onClick={() => toggleSection('seller')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-2"
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
                    checked={filters.sellerId === seller.id}
                    onChange={() => handleSellerChange(seller.id)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {seller.companyName}
                    {seller.verified && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                        Проверен
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Дополнительные опции */}
      <div className="pb-6">
        <button
          onClick={() => toggleSection('options')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-2"
        >
          <span>Дополнительно</span>
          {expandedSections.options ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expandedSections.options && (
          <div className="mt-2 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={() => handleCheckboxChange('inStock')}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Только в наличии</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.withCertificates}
                onChange={() => handleCheckboxChange('withCertificates')}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">С сертификатами</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}