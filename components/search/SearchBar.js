// components/search/SearchBar.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX } from 'react-icons/fi';
import { db } from '@/lib/firebase/config';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import Link from 'next/link';

export default function SearchBar({ onSearch, initialValue = '', autoFocus = false }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);

  // Загружаем недавние поиски из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Закрытие подсказок при клике вне
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Поиск подсказок
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const productsRef = collection(db, 'products');
        const searchTermLower = searchTerm.toLowerCase();
        
        // Ищем по названию
        const q = query(
          productsRef,
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          type: 'product'
        }));

        // Ищем по категориям
        const categoriesRef = collection(db, 'products');
        const categoryQuery = query(
          categoriesRef,
          where('category', '>=', searchTerm),
          where('category', '<=', searchTerm + '\uf8ff'),
          limit(3)
        );
        
        const categorySnapshot = await getDocs(categoryQuery);
        const categories = [...new Set(
          categorySnapshot.docs
            .map(doc => doc.data().category)
            .filter(Boolean)
        )].map(cat => ({ name: cat, type: 'category' }));

        setSuggestions([...products, ...categories].slice(0, 8));
      } catch (error) {
        console.error('Ошибка получения подсказок:', error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Сохраняем в недавние поиски
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));

      // Вызываем поиск
      onSearch(searchTerm);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      router.push(`/catalog/${suggestion.id}`);
    } else {
      onSearch(suggestion.name);
      setSearchTerm(suggestion.name);
    }
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
    setSuggestions([]);
  };

  const removeRecentSearch = (search, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  return (
    <div className="search-container" ref={searchRef}>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Поиск товаров, категорий..."
          className="search-input"
          autoFocus={autoFocus}
        />
        <FiSearch className="search-icon" />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="search-clear-btn"
          >
            <FiX className="clear-icon" />
          </button>
        )}
      </form>

      {/* Подсказки */}
      {showSuggestions && (searchTerm.length >= 2 || recentSearches.length > 0) && (
        <div className="suggestions-dropdown">
          {/* Недавние поиски */}
          {recentSearches.length > 0 && !searchTerm && (
            <div className="suggestions-section">
              <div className="suggestions-header">
                Недавние поиски
              </div>
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSearchTerm(search);
                    onSearch(search);
                    setShowSuggestions(false);
                  }}
                  className="suggestion-item"
                >
                  <div className="suggestion-content">
                    <FiSearch className="suggestion-icon" />
                    <span className="suggestion-text">{search}</span>
                  </div>
                  <button
                    onClick={(e) => removeRecentSearch(search, e)}
                    className="suggestion-remove"
                  >
                    <FiX className="remove-icon" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Результаты поиска */}
          {suggestions.length > 0 && (
            <div className="suggestions-section with-border">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item"
                >
                  <div className="suggestion-content">
                    <FiSearch className="suggestion-icon" />
                    <div>
                      <span className="suggestion-text">{suggestion.name}</span>
                      {suggestion.type === 'category' && (
                        <span className="suggestion-badge">
                          Категория
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Нет результатов */}
          {searchTerm.length >= 2 && suggestions.length === 0 && (
            <div className="no-results">
              Ничего не найдено
            </div>
          )}

          {/* Показать все результаты */}
          {searchTerm.length >= 2 && (
            <div className="show-all-section">
              <button
                onClick={handleSearch}
                className="show-all-button"
              >
                Показать все результаты для "{searchTerm}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}