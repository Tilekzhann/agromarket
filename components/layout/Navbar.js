// components/layout/Navbar.js
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  FiMenu, 
  FiX, 
  FiShoppingCart, 
  FiUser,
  FiLogOut,
  FiCalendar,
  FiHome,
  FiPackage
} from 'react-icons/fi';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { data: session, status } = useSession();
  const { cartCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const getDashboardLink = () => {
    if (!session) return '/login';
    switch(session?.user?.role) {
      case 'admin': return '/admin';
      case 'seller': return '/seller';
      default: return '/buyer';
    }
  };

  // Показываем загрузку, пока проверяется сессия
  if (status === 'loading') {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            <Link href="/" className="navbar-logo">
              АгроМаркет
            </Link>
            <div className="navbar-spinner"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Логотип */}
          <Link href="/" className="navbar-logo">
            АгроМаркет
          </Link>

          {/* Десктопное меню */}
          <div className="navbar-desktop-menu">
            <Link href="/catalog" className="navbar-link">
              Каталог
            </Link>
            
            {session ? (
              <>
                {/* Основной кабинет */}
                <Link href={getDashboardLink()} className="navbar-link">
                  {session.user?.role === 'seller' ? 'Кабинет' : 
                   session.user?.role === 'admin' ? 'Админ' : 'Мои заказы'}
                </Link>
                
                {/* 👇 ДОБАВЛЕНО: Ссылка на события ТОЛЬКО для админа */}
                {session.user?.role === 'admin' && (
                  <Link href="/admin/events" className="navbar-link">
                    <FiCalendar className="inline mr-1" />
                    События
                  </Link>
                )}
                
                {/* Кнопка выхода */}
                <button
                  onClick={handleSignOut}
                  className="navbar-link logout-btn"
                  title="Выйти"
                >
                  <FiLogOut className="inline mr-1" />
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="navbar-link">
                  Вход
                </Link>
                <Link href="/register" className="navbar-link">
                  Регистрация
                </Link>
              </>
            )}

            {/* Корзина */}
            <Link href="/cart" className="navbar-cart">
              <FiShoppingCart className="cart-icon" />
              {cartCount > 0 && (
                <span className="cart-badge">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Мобильное меню кнопка */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="navbar-mobile-toggle"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Мобильное меню */}
        {isOpen && (
          <div className="navbar-mobile-menu">
            <Link href="/catalog" className="navbar-mobile-link">
              <FiPackage className="mobile-icon" />
              Каталог
            </Link>
            
            {session ? (
              <>
                <Link href={getDashboardLink()} className="navbar-mobile-link">
                  <FiUser className="mobile-icon" />
                  {session.user?.role === 'seller' ? 'Продавец' : 
                   session.user?.role === 'admin' ? 'Админ' : 'Мои заказы'}
                </Link>
                
                {/* 👇 Мобильная версия для событий */}
                {session.user?.role === 'admin' && (
                  <Link href="/admin/events" className="navbar-mobile-link">
                    <FiCalendar className="mobile-icon" />
                    События
                  </Link>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="navbar-mobile-link logout-btn"
                >
                  <FiLogOut className="mobile-icon" />
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="navbar-mobile-link">
                  <FiUser className="mobile-icon" />
                  Вход
                </Link>
                <Link href="/register" className="navbar-mobile-link">
                  <FiUser className="mobile-icon" />
                  Регистрация
                </Link>
              </>
            )}

            <Link href="/cart" className="navbar-mobile-cart">
              <FiShoppingCart className="cart-icon" />
              Корзина
              {cartCount > 0 && (
                <span className="cart-mobile-badge">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}