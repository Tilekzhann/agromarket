// app/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import ProductCard from '@/components/products/ProductCard';
import { FiArrowRight, FiTruck, FiShield, FiClock } from 'react-icons/fi';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('createdAt', 'desc'), limit(8));
        const querySnapshot = await getDocs(q);
        
        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFeaturedProducts(products);
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProducts();
  }, []);

  const benefits = [
    {
      icon: FiTruck,
      title: 'Бесплатная доставка',
      description: 'При заказе от 5000 тенге'
    },
    {
      icon: FiShield,
      title: 'Гарантия качества',
      description: 'Все продукты сертифицированы'
    },
    {
      icon: FiClock,
      title: 'Свежие продукты',
      description: 'Прямо с фермерских хозяйств'
    }
  ];

  const categories = [
    { name: 'Овощи', slug: 'vegetables', bgColor: '#22c55e' },
    { name: 'Фрукты', slug: 'fruits', bgColor: '#eab308' },
    { name: 'Молочные продукты', slug: 'dairy', bgColor: '#3b82f6' },
    { name: 'Мясо', slug: 'meat', bgColor: '#ef4444' },
    { name: 'Зерновые', slug: 'grains', bgColor: '#f59e0b' },
    { name: 'Мёд', slug: 'honey', bgColor: '#d97706' },
  ];

  return (
    <div>
      {/* Hero секция */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Свежие продукты прямо с фермы</h1>
            <p className="hero-subtitle">
              Покупайте натуральные продукты напрямую от производителей
            </p>
            <div className="hero-buttons">
              <Link href="/catalog" className="btn btn-light">
                Перейти в каталог
                <FiArrowRight className="ml-2" />
              </Link>
              <Link href="/register" className="btn btn-outline-light">
                Стать продавцом
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="benefits-section">
        <div className="container">
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon-wrapper">
                  <benefit.icon className="benefit-icon" />
                </div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Категории */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Популярные категории</h2>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/catalog?category=${category.slug}`}
                className="category-card"
                style={{ backgroundColor: category.bgColor }}
              >
                <div className="category-overlay"></div>
                <h3 className="category-name">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Популярные товары */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Популярные товары</h2>
            <Link href="/catalog" className="section-link">
              Все товары
              <FiArrowRight className="ml-2" />
            </Link>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">Товары временно отсутствуют</p>
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA для продавцов */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Продавайте свою продукцию</h2>
            <p className="cta-text">
              Присоединяйтесь к платформе и находите новых покупателей по всему Казахстану
            </p>
            <Link
              href="/register?role=seller"
              className="btn btn-light"
            >
              Стать продавцом
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}