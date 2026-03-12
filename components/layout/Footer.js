// components/layout/Footer.js
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* О компании */}
          <div className="footer-section">
            <h3 className="footer-title">АгроМаркет</h3>
            <p className="footer-text">
              Платформа для прямых продаж сельскохозяйственной продукции от производителей
            </p>
          </div>

          {/* Навигация */}
          <div className="footer-section">
            <h3 className="footer-title">Навигация</h3>
            <ul className="footer-links">
              <li>
                <Link href="/catalog" className="footer-link">
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/about" className="footer-link">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="footer-link">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Для продавцов */}
          <div className="footer-section">
            <h3 className="footer-title">Продавцам</h3>
            <ul className="footer-links">
              <li>
                <Link href="/how-to-sell" className="footer-link">
                  Как начать продавать
                </Link>
              </li>
              <li>
                <Link href="/tariffs" className="footer-link">
                  Тарифы
                </Link>
              </li>
              <li>
                <Link href="/faq" className="footer-link">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div className="footer-section">
            <h3 className="footer-title">Контакты</h3>
            <ul className="footer-contact">
              <li>Email: aibar@agromarket.kz</li>
              <li>Тел: +7 (777) 777-77-77</li>
              <li>г. Астана</li>
            </ul>
          </div>
        </div>

        {/* Копирайт */}
        <div className="footer-copyright">
          <p>© 2026 АгроМаркет. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}