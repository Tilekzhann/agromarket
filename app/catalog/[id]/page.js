// app/catalog/[id]/page.js
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { 
  FiShoppingCart, 
  FiHeart, 
  FiShare2, 
  FiStar, 
  FiTruck, 
  FiShield,
  FiClock,
  FiDownload,
  FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { addToCart, isInCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [certificates, setCertificates] = useState([]);

  const productId = params.id;

  // Загрузка данных товара
  useEffect(() => {
    async function fetchProduct() {
      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          toast.error('Товар не найден');
          router.push('/catalog');
          return;
        }

        const productData = { id: productSnap.id, ...productSnap.data() };
        setProduct(productData);

        await updateDoc(productRef, {
          views: increment(1)
        });

        if (productData.sellerId) {
          const sellerRef = doc(db, 'users', productData.sellerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            setSeller({ id: sellerSnap.id, ...sellerSnap.data() });
          }
        }

        if (productData.certificateUrls && productData.certificateUrls.length > 0) {
          setCertificates(productData.certificateUrls);
        }

        if (productData.category) {
          const productsRef = collection(db, 'products');
          const q = query(
            productsRef,
            where('category', '==', productData.category),
            where('__name__', '!=', productId),
            where('sellerId', '==', productData.sellerId)
          );
          const querySnapshot = await getDocs(q);
          const similar = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .slice(0, 4);
          setSimilarProducts(similar);
        }

      } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        toast.error('Ошибка при загрузке товара');
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  const handleAddToCart = () => {
    if (!product) return;
    
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id, 1);
    }
    
    toast.success(`${product.name} добавлен в корзину`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ссылка скопирована');
    }
  };

  const handleCertificateClick = async (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="loading-container">
        <div className="text-center">
          <h2 className="h3 mb-4">Товар не найден</h2>
          <Link href="/catalog" className="link">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Хлебные крошки */}
      <nav className="breadcrumbs mb-4">
        <Link href="/" className="breadcrumb-link">Главная</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/catalog" className="breadcrumb-link">Каталог</Link>
        <span className="breadcrumb-separator">/</span>
        {product.category && (
          <>
            <Link href={`/catalog?category=${product.category}`} className="breadcrumb-link">
              {product.category}
            </Link>
            <span className="breadcrumb-separator">/</span>
          </>
        )}
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <div className="product-grid">
       {/* Левая колонка - изображения */}
<div className="product-gallery">
  <div className="product-main-image">
    {product.images && product.images.length > 0 ? (
      <img
        src={product.images[selectedImage]}
        alt={product.name}
        className="product-image"
        style={{ objectFit: 'contain' }}
      />
    ) : (
      <div className="product-image-placeholder">
        <span>📦 Нет изображения</span>
      </div>
    )}
  </div>

  {product.images && product.images.length > 1 && (
    <div className="product-thumbnails">
      {product.images.map((image, index) => (
        <button
          key={index}
          onClick={() => setSelectedImage(index)}
          className={`product-thumbnail ${selectedImage === index ? 'active' : ''}`}
        >
          <img src={image} alt={`${product.name} ${index + 1}`} className="thumbnail-image" />
        </button>
      ))}
    </div>
  )}
</div>
        {/* Правая колонка - информация */}
        <div className="product-info">
          <div className="product-header">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-actions">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`product-action-btn ${isLiked ? 'liked' : ''}`}
              >
                <FiHeart className={`action-icon ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="product-action-btn"
              >
                <FiShare2 className="action-icon" />
              </button>
            </div>
          </div>

          <div className="product-rating">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`star-icon ${star <= (product.rating || 0) ? 'filled' : ''}`}
                />
              ))}
            </div>
            <span className="rating-count">{product.reviews || 0} отзывов</span>
            <span className="rating-separator">|</span>
            <span className="view-count">
              <FiEye className="inline mr-1" />
              {product.views || 0} просмотров
            </span>
          </div>

          <div className="product-price">
            <span className="current-price">{product.price} тенге</span>
            {product.oldPrice && (
              <span className="old-price">{product.oldPrice} тенге</span>
            )}
          </div>

          <p className="product-description">{product.description}</p>

          {product.specifications && (
            <div className="specifications-card">
              <h3 className="specifications-title">Характеристики:</h3>
              <div className="specifications-grid">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="specification-item">
                    <span className="specification-key">{key}:</span>
                    <span className="specification-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certificates.length > 0 && (
            <div className="certificates-section">
              <h3 className="certificates-title">Сертификаты качества:</h3>
              <div className="certificates-list">
                {certificates.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => handleCertificateClick(url)}
                    className="certificate-btn"
                  >
                    <FiDownload className="mr-2" />
                    Сертификат {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {seller && (
            <div className="seller-card">
              <h3 className="seller-title">Продавец:</h3>
              <Link href={`/seller/${seller.id}`} className="seller-info">
                <div className="seller-avatar">
                  <span className="seller-initial">
                    {seller.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="seller-name">{seller.name}</p>
                  <p className="seller-stats">
                    Рейтинг: {seller.rating || 'Новый'} • Продаж: {seller.totalSales || 0}
                  </p>
                </div>
              </Link>
            </div>
          )}

          <div className="quantity-section">
            <label className="quantity-label">Количество</label>
            <div className="quantity-controls">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="quantity-btn"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="quantity-input"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="quantity-btn"
              >
                +
              </button>
              <span className="stock-info">
                {product.stock ? `В наличии: ${product.stock} шт.` : 'Доступно'}
              </span>
            </div>
          </div>

          <div className="action-buttons">
            <button
              onClick={handleAddToCart}
              disabled={isInCart(product.id)}
              className={`cart-btn ${isInCart(product.id) ? 'disabled' : ''}`}
            >
              <FiShoppingCart className="mr-2" />
              {isInCart(product.id) ? 'В корзине' : 'В корзину'}
            </button>
            <button
              onClick={handleBuyNow}
              className="buy-btn"
            >
              Купить сейчас
            </button>
          </div>

          <div className="benefits-grid">
            <div className="benefit-item">
              <FiTruck className="benefit-icon" />
              <p className="benefit-text">Бесплатная доставка</p>
            </div>
            <div className="benefit-item">
              <FiShield className="benefit-icon" />
              <p className="benefit-text">Гарантия качества</p>
            </div>
            <div className="benefit-item">
              <FiClock className="benefit-icon" />
              <p className="benefit-text">Свежие продукты</p>
            </div>
          </div>
        </div>
      </div>

      {/* Вкладки с детальной информацией */}
      <div className="tabs-section">
        <div className="tabs-header">
          {['description', 'specifications', 'reviews', 'delivery'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'description' && 'Описание'}
              {tab === 'specifications' && 'Характеристики'}
              {tab === 'reviews' && 'Отзывы'}
              {tab === 'delivery' && 'Доставка и оплата'}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'description' && (
            <div className="prose">
              <p className="text-secondary">{product.fullDescription || product.description}</p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="specs-detail-grid">
              {product.specifications ? (
                Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="spec-detail-item">
                    <span className="spec-detail-key">{key}:</span>
                    <span className="spec-detail-value">{value}</span>
                  </div>
                ))
              ) : (
                <p className="text-tertiary">Нет информации о характеристиках</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <p className="text-tertiary">Отзывы пока отсутствуют</p>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="delivery-info">
              <div>
                <h4 className="delivery-title">Доставка</h4>
                <p className="delivery-text">
                  Доставка по всему Казахстану. Бесплатно при заказе от 5000 тенге.
                  Срок доставки: 1-3 рабочих дня.
                </p>
              </div>
              <div>
                <h4 className="delivery-title">Оплата</h4>
                <p className="delivery-text">
                  Наличными при получении, банковской картой онлайн, kaspi.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Похожие товары */}
      {similarProducts.length > 0 && (
        <div className="similar-products-section">
          <h2 className="similar-products-title">Похожие товары</h2>
          <div className="similar-products-grid">
            {similarProducts.map(product => (
              <Link key={product.id} href={`/catalog/${product.id}`} className="similar-product-card">
                <div className="similar-product-image">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="similar-product-img" />
                  ) : (
                    <div className="similar-product-placeholder">
                      <span className="text-tertiary">Нет фото</span>
                    </div>
                  )}
                </div>
                <div className="similar-product-info">
                  <h3 className="similar-product-name">{product.name}</h3>
                  <p className="similar-product-price">{product.price} тенге</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}