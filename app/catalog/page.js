// app/catalog/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import ProductCard from '@/components/products/ProductCard';
import SearchBar from '@/components/search/SearchBar';
import { 
  FiFilter, 
  FiGrid, 
  FiList, 
  FiChevronDown, 
  FiChevronUp, 
  FiX, 
  FiSliders  // 👈 ЭТОТ ИМПОРТ БЫЛ ПРОПУЩЕН
} from 'react-icons/fi';
export default function CatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Состояние фильтров
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    sellerId: searchParams.get('seller') || '',
    search: searchParams.get('search') || '',
    sortBy: 'newest',
    inStock: false,
    withCertificates: false
  });

  // Временные фильтры (применяются только при нажатии "Применить")
  const [tempFilters, setTempFilters] = useState({...filters});

  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);

  const ITEMS_PER_PAGE = 12;

  // Загружаем категории для фильтра
  useEffect(() => {
    async function fetchCategories() {
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, limit(100));
        const querySnapshot = await getDocs(q);
        
        const uniqueCategories = [...new Set(
          querySnapshot.docs
            .map(doc => doc.data().category)
            .filter(Boolean)
        )];
        
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
      }
    }

    fetchCategories();
  }, []);

  // Загружаем продавцов для фильтра
  useEffect(() => {
    async function fetchSellers() {
      try {
        const sellersRef = collection(db, 'sellers');
        const querySnapshot = await getDocs(sellersRef);
        
        const sellersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setSellers(sellersList);
      } catch (error) {
        console.error('Ошибка загрузки продавцов:', error);
      }
    }

    fetchSellers();
  }, []);

  // Построение запроса
  const buildQuery = useCallback((startAfterDoc = null) => {
    let productsRef = collection(db, 'products');
    let constraints = [];

    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters.sellerId) {
      constraints.push(where('sellerId', '==', filters.sellerId));
    }

    if (filters.inStock) {
      constraints.push(where('stock', '>', 0));
    }

    if (filters.withCertificates) {
      constraints.push(where('certificateUrls', '!=', null));
      constraints.push(where('certificateUrls', '!=', []));
    }

    switch (filters.sortBy) {
      case 'price_asc':
        constraints.push(orderBy('price', 'asc'));
        break;
      case 'price_desc':
        constraints.push(orderBy('price', 'desc'));
        break;
      case 'popular':
        constraints.push(orderBy('views', 'desc'));
        break;
      case 'newest':
      default:
        constraints.push(orderBy('createdAt', 'desc'));
        break;
    }

    constraints.push(limit(ITEMS_PER_PAGE));
    
    if (startAfterDoc) {
      return query(productsRef, ...constraints, startAfter(startAfterDoc));
    }

    return query(productsRef, ...constraints);
  }, [filters]);

  // Загрузка товаров
  const fetchProducts = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const q = buildQuery(isLoadMore ? lastDoc : null);
      const querySnapshot = await getDocs(q);
      
      const newProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      let filteredProducts = newProducts;
      
      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(filters.minPrice));
      }
      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(filters.maxPrice));
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
        );
      }

      if (isLoadMore) {
        setProducts(prev => [...prev, ...filteredProducts]);
      } else {
        setProducts(filteredProducts);
      }

      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setTotalCount(filteredProducts.length);

    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildQuery, filters, lastDoc]);

  // Загрузка при изменении фильтров
  useEffect(() => {
    fetchProducts(false);
    
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);
    if (filters.sellerId) params.set('seller', filters.sellerId);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newUrl, { scroll: false });
    
  }, [filters.category, filters.search, filters.sellerId, filters.sortBy]);

  // Применение фильтров
  const applyFilters = () => {
    setFilters({...tempFilters});
    setFiltersVisible(false);
  };

  // Сброс фильтров
  const resetFilters = () => {
    const emptyFilters = {
      category: '',
      minPrice: '',
      maxPrice: '',
      sellerId: '',
      search: '',
      sortBy: 'newest',
      inStock: false,
      withCertificates: false
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setFiltersVisible(false);
  };

  // Подсчет активных фильтров
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.sellerId) count++;
    if (filters.inStock) count++;
    if (filters.withCertificates) count++;
    return count;
  };

  return (
    <div className="catalog-container">
      {/* Заголовок и статистика */}
      <div className="catalog-header">
        <div>
          <h1 className="catalog-title">Каталог продукции</h1>
          <p className="catalog-stats">
            {totalCount} {totalCount === 1 ? 'товар' : totalCount > 1 && totalCount < 5 ? 'товара' : 'товаров'}
          </p>
        </div>
      </div>

      {/* Поиск и панель управления */}
      <div className="catalog-controls">
        <div className="search-wrapper">
          <SearchBar onSearch={(term) => setTempFilters({...tempFilters, search: term})} initialValue={filters.search} />
        </div>
        
        <div className="controls-wrapper">
          {/* Кнопка фильтров (десктоп) */}
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className={`catalog-filter-btn ${filtersVisible ? 'active' : ''}`}
          >
            <FiFilter className="btn-icon" />
            Фильтры
            {getActiveFiltersCount() > 0 && (
              <span className="filter-badge">{getActiveFiltersCount()}</span>
            )}
          </button>

          {/* Кнопка фильтров (мобильная) */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="catalog-filter-btn mobile-only"
          >
            <FiFilter className="btn-icon" />
            Фильтры
            {getActiveFiltersCount() > 0 && (
              <span className="filter-badge">{getActiveFiltersCount()}</span>
            )}
          </button>

          {/* Сортировка */}
          <select
            value={tempFilters.sortBy}
            onChange={(e) => setTempFilters({...tempFilters, sortBy: e.target.value})}
            className="catalog-sort"
          >
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Сначала дешевле</option>
            <option value="price_desc">Сначала дороже</option>
            <option value="popular">Популярные</option>
          </select>

          {/* Переключение вида */}
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Сетка"
            >
              <FiGrid />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="Список"
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* Панель фильтров (десктоп) */}
      {filtersVisible && (
        <div className="filters-panel">
          <div className="filters-panel-header">
            <h3 className="filters-panel-title">
              <FiSliders className="title-icon" />
              Фильтры
            </h3>
            <button onClick={() => setFiltersVisible(false)} className="filters-close">
              <FiX />
            </button>
          </div>

          <div className="filters-panel-content">
            {/* Категории */}
            <div className="filter-section">
              <h4 className="filter-section-title">Категория</h4>
              <div className="filter-options">
                <button
                  onClick={() => setTempFilters({...tempFilters, category: ''})}
                  className={`filter-option ${!tempFilters.category ? 'active' : ''}`}
                >
                  Все
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTempFilters({...tempFilters, category: cat})}
                    className={`filter-option ${tempFilters.category === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Цена */}
            <div className="filter-section">
              <h4 className="filter-section-title">Цена</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="От"
                  value={tempFilters.minPrice}
                  onChange={(e) => setTempFilters({...tempFilters, minPrice: e.target.value})}
                  className="price-input"
                />
                <span className="price-separator">—</span>
                <input
                  type="number"
                  placeholder="До"
                  value={tempFilters.maxPrice}
                  onChange={(e) => setTempFilters({...tempFilters, maxPrice: e.target.value})}
                  className="price-input"
                />
              </div>
            </div>

            {/* Продавцы */}
            {sellers.length > 0 && (
              <div className="filter-section">
                <h4 className="filter-section-title">Продавец</h4>
                <select
                  value={tempFilters.sellerId}
                  onChange={(e) => setTempFilters({...tempFilters, sellerId: e.target.value})}
                  className="filter-select"
                >
                  <option value="">Все продавцы</option>
                  {sellers.map(seller => (
                    <option key={seller.id} value={seller.id}>
                      {seller.companyName || seller.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Дополнительные опции */}
            <div className="filter-section">
              <h4 className="filter-section-title">Дополнительно</h4>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={tempFilters.inStock}
                  onChange={(e) => setTempFilters({...tempFilters, inStock: e.target.checked})}
                />
                <span>Только в наличии</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={tempFilters.withCertificates}
                  onChange={(e) => setTempFilters({...tempFilters, withCertificates: e.target.checked})}
                />
                <span>С сертификатами</span>
              </label>
            </div>
          </div>

          <div className="filters-panel-footer">
            <button onClick={resetFilters} className="filters-reset-btn">
              Сбросить все
            </button>
            <button onClick={applyFilters} className="filters-apply-btn">
              Применить
            </button>
          </div>
        </div>
      )}

      {/* Мобильная панель фильтров */}
      {mobileFiltersOpen && (
        <div className="mobile-filters-overlay" onClick={() => setMobileFiltersOpen(false)}>
          <div className="mobile-filters-panel" onClick={e => e.stopPropagation()}>
            <div className="mobile-filters-header">
              <h3>Фильтры</h3>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <FiX />
              </button>
            </div>
            
            <div className="mobile-filters-content">
              {/* Те же фильтры, что и в десктопной версии */}
              {/* Категории */}
              <div className="filter-section">
                <h4 className="filter-section-title">Категория</h4>
                <div className="filter-options">
                  <button
                    onClick={() => setTempFilters({...tempFilters, category: ''})}
                    className={`filter-option ${!tempFilters.category ? 'active' : ''}`}
                  >
                    Все
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setTempFilters({...tempFilters, category: cat})}
                      className={`filter-option ${tempFilters.category === cat ? 'active' : ''}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Цена */}
              <div className="filter-section">
                <h4 className="filter-section-title">Цена</h4>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="От"
                    value={tempFilters.minPrice}
                    onChange={(e) => setTempFilters({...tempFilters, minPrice: e.target.value})}
                    className="price-input"
                  />
                  <span className="price-separator">—</span>
                  <input
                    type="number"
                    placeholder="До"
                    value={tempFilters.maxPrice}
                    onChange={(e) => setTempFilters({...tempFilters, maxPrice: e.target.value})}
                    className="price-input"
                  />
                </div>
              </div>

              {/* Продавцы */}
              {sellers.length > 0 && (
                <div className="filter-section">
                  <h4 className="filter-section-title">Продавец</h4>
                  <select
                    value={tempFilters.sellerId}
                    onChange={(e) => setTempFilters({...tempFilters, sellerId: e.target.value})}
                    className="filter-select"
                  >
                    <option value="">Все продавцы</option>
                    {sellers.map(seller => (
                      <option key={seller.id} value={seller.id}>
                        {seller.companyName || seller.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Дополнительные опции */}
              <div className="filter-section">
                <h4 className="filter-section-title">Дополнительно</h4>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={tempFilters.inStock}
                    onChange={(e) => setTempFilters({...tempFilters, inStock: e.target.checked})}
                  />
                  <span>Только в наличии</span>
                </label>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={tempFilters.withCertificates}
                    onChange={(e) => setTempFilters({...tempFilters, withCertificates: e.target.checked})}
                  />
                  <span>С сертификатами</span>
                </label>
              </div>
            </div>

            <div className="mobile-filters-footer">
              <button onClick={resetFilters} className="filters-reset-btn">
                Сбросить
              </button>
              <button 
                onClick={() => {
                  applyFilters();
                  setMobileFiltersOpen(false);
                }} 
                className="filters-apply-btn"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Активные фильтры */}
      {getActiveFiltersCount() > 0 && (
        <div className="active-filters">
          <span className="active-filters-label">Активные фильтры:</span>
          <div className="active-filters-list">
            {filters.category && (
              <button
                onClick={() => {
                  const newFilters = {...filters, category: ''};
                  setFilters(newFilters);
                  setTempFilters(newFilters);
                }}
                className="active-filter-tag"
              >
                {filters.category}
                <FiX className="tag-remove" />
              </button>
            )}
            {filters.minPrice && (
              <button
                onClick={() => {
                  const newFilters = {...filters, minPrice: ''};
                  setFilters(newFilters);
                  setTempFilters(newFilters);
                }}
                className="active-filter-tag"
              >
                от {filters.minPrice} ₸
                <FiX className="tag-remove" />
              </button>
            )}
            {filters.maxPrice && (
              <button
                onClick={() => {
                  const newFilters = {...filters, maxPrice: ''};
                  setFilters(newFilters);
                  setTempFilters(newFilters);
                }}
                className="active-filter-tag"
              >
                до {filters.maxPrice} ₸
                <FiX className="tag-remove" />
              </button>
            )}
            {filters.inStock && (
              <button
                onClick={() => {
                  const newFilters = {...filters, inStock: false};
                  setFilters(newFilters);
                  setTempFilters(newFilters);
                }}
                className="active-filter-tag"
              >
                В наличии
                <FiX className="tag-remove" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Товары */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">Товары не найдены</p>
          <button onClick={resetFilters} className="btn btn-outline">
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' ? 'products-grid' : 'products-list'}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>

          {hasMore && (
            <div className="load-more">
              <button
                onClick={() => fetchProducts(true)}
                disabled={loadingMore}
                className="btn btn-outline btn-lg"
              >
                {loadingMore ? (
                  <span className="btn-content">
                    <span className="spinner small"></span>
                    Загрузка...
                  </span>
                ) : (
                  'Загрузить еще'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}