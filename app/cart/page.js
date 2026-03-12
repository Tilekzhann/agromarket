// app/cart/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { 
  FiShoppingCart, 
  FiTrash2, 
  FiChevronLeft,
  FiTruck,
  FiShield,
  FiCreditCard,
  FiMapPin,
  FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { cart, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    deliveryAddress: session?.user?.address || '',
    phone: session?.user?.phone || '',
    comment: '',
    paymentMethod: 'cash',
    deliveryMethod: 'standard'
  });
  const [loading, setLoading] = useState(false);

  // Группировка товаров по продавцам
  const groupedBySeller = cart.reduce((groups, item) => {
    const sellerId = item.sellerId || 'unknown';
    if (!groups[sellerId]) {
      groups[sellerId] = {
        sellerName: item.sellerName || 'Продавец',
        items: [],
        subtotal: 0
      };
    }
    groups[sellerId].items.push(item);
    groups[sellerId].subtotal += item.price * item.quantity;
    return groups;
  }, {});

  const handleCheckout = async () => {
    if (!session) {
      toast.error('Необходимо войти в систему');
      router.push('/login?callbackUrl=/cart');
      return;
    }

    if (cart.length === 0) {
      toast.error('Корзина пуста');
      return;
    }

    if (!orderDetails.deliveryAddress || !orderDetails.phone) {
      toast.error('Заполните адрес доставки и телефон');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        buyerId: session.user.id,
        buyerName: session.user.name,
        buyerEmail: session.user.email,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sellerId: item.sellerId,
          image: item.image
        })),
        totalAmount: cartTotal,
        status: 'pending',
        paymentMethod: orderDetails.paymentMethod,
        deliveryMethod: orderDetails.deliveryMethod,
        deliveryAddress: orderDetails.deliveryAddress,
        phone: orderDetails.phone,
        comment: orderDetails.comment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      const batch = writeBatch(db);
      
      Object.entries(groupedBySeller).forEach(([sellerId, group]) => {
        if (sellerId !== 'unknown') {
          const sellerOrderRef = doc(collection(db, 'seller_orders'));
          batch.set(sellerOrderRef, {
            sellerId,
            orderId: orderRef.id,
            items: group.items,
            subtotal: group.subtotal,
            status: 'pending',
            createdAt: serverTimestamp()
          });
        }
      });

      await batch.commit();

      await addDoc(collection(db, 'events'), {
        userId: session.user.id,
        action: 'ORDER_CREATED',
        details: {
          orderId: orderRef.id,
          total: cartTotal,
          itemsCount: cart.length
        },
        timestamp: serverTimestamp()
      });

      clearCart();
      
      toast.success('Заказ успешно оформлен!');
      router.push('/buyer');
      
    } catch (error) {
      console.error('Ошибка оформления заказа:', error);
      toast.error('Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty-container">
        <div className="cart-empty-content">
          <FiShoppingCart className="cart-empty-icon" />
          <h2 className="cart-empty-title">Корзина пуста</h2>
          <p className="cart-empty-text">Добавьте товары в корзину, чтобы оформить заказ</p>
          <Link href="/catalog" className="btn btn-primary">
            <FiChevronLeft className="btn-icon" />
            Перейти в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">Корзина ({cartCount} товаров)</h1>

      <div className="cart-grid">
        {/* Левая колонка - товары */}
        <div className="cart-items-column">
          <div className="cart-items-card">
            {/* Заголовки (только на десктопе) */}
            <div className="cart-items-header">
              <div className="cart-header-product">Товар</div>
              <div className="cart-header-price">Цена</div>
              <div className="cart-header-quantity">Количество</div>
              <div className="cart-header-total">Итого</div>
            </div>

            {/* Товары по продавцам */}
            {Object.entries(groupedBySeller).map(([sellerId, group]) => (
              <div key={sellerId} className="cart-seller-group">
                {/* Информация о продавце */}
                <div className="cart-seller-info">
                  <FiUser className="cart-seller-icon" />
                  <span className="cart-seller-name">{group.sellerName}</span>
                </div>

                {/* Товары продавца */}
                {group.items.map((item) => (
                  <div key={item.id} className="cart-item">
                    {/* Товар */}
                    <div className="cart-item-product">
                      <div className="cart-item-image">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="cart-item-img" />
                        ) : (
                          <span className="cart-item-placeholder">📦</span>
                        )}
                      </div>
                      <div className="cart-item-info">
                        <Link href={`/catalog/${item.id}`} className="cart-item-name">
                          {item.name}
                        </Link>
                      </div>
                    </div>

                    {/* Цена */}
                    <div className="cart-item-price">
                      <span className="cart-item-label">Цена:</span>
                      <span>{item.price} ₸</span>
                    </div>

                    {/* Количество */}
                    <div className="cart-item-quantity">
                      <span className="cart-item-label">Кол-во:</span>
                      <div className="quantity-controls">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Итого */}
                    <div className="cart-item-total">
                      <span className="cart-item-label">Итого:</span>
                      <span className="cart-item-total-value">{item.price * item.quantity} ₸</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="cart-item-remove"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Подытог по продавцу */}
                <div className="cart-seller-subtotal">
                  <span className="cart-subtotal-label">Итого:</span>
                  <span className="cart-subtotal-value">{group.subtotal} ₸</span>
                </div>
              </div>
            ))}

            {/* Кнопка очистки корзины */}
            <div className="cart-actions">
              <button
                onClick={clearCart}
                className="cart-clear-btn"
              >
                <FiTrash2 className="btn-icon" />
                Очистить корзину
              </button>
              <Link href="/catalog" className="cart-continue-link">
                <FiChevronLeft className="btn-icon" />
                Продолжить покупки
              </Link>
            </div>
          </div>
        </div>

        {/* Правая колонка - оформление */}
        <div className="cart-checkout-column">
          <div className="cart-checkout-card">
            <h2 className="cart-checkout-title">Оформление заказа</h2>

            {!isCheckingOut ? (
              // Краткая информация
              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span className="cart-summary-label">Товаров:</span>
                  <span className="cart-summary-value">{cartCount} шт.</span>
                </div>
                <div className="cart-summary-row">
                  <span className="cart-summary-label">Сумма:</span>
                  <span className="cart-summary-value">{cartTotal} ₸</span>
                </div>
                <div className="cart-summary-row">
                  <span className="cart-summary-label">Доставка:</span>
                  <span className="cart-summary-free">Бесплатно</span>
                </div>
                <div className="cart-summary-total">
                  <span className="cart-total-label">Итого:</span>
                  <span className="cart-total-value">{cartTotal} ₸</span>
                </div>

                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="btn btn-primary btn-full"
                >
                  Оформить заказ
                </button>
              </div>
            ) : (
              // Форма оформления
              <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }} className="cart-form">
                <div className="form-group">
                  <label className="form-label">
                    <FiMapPin className="form-label-icon" /> Адрес доставки
                  </label>
                  <input
                    type="text"
                    required
                    value={orderDetails.deliveryAddress}
                    onChange={(e) => setOrderDetails({...orderDetails, deliveryAddress: e.target.value})}
                    className="form-input"
                    placeholder="г. Астана, ул. Мангилик, д. 1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Телефон</label>
                  <input
                    type="tel"
                    required
                    value={orderDetails.phone}
                    onChange={(e) => setOrderDetails({...orderDetails, phone: e.target.value})}
                    className="form-input"
                    placeholder="+777 XXX XX XX"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Способ оплаты</label>
                  <select
                    value={orderDetails.paymentMethod}
                    onChange={(e) => setOrderDetails({...orderDetails, paymentMethod: e.target.value})}
                    className="form-input"
                  >
                    <option value="cash">Наличными при получении</option>
                    <option value="card">Банковской картой онлайн</option>
                    <option value="transfer">Kaspi</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Комментарий к заказу</label>
                  <textarea
                    value={orderDetails.comment}
                    onChange={(e) => setOrderDetails({...orderDetails, comment: e.target.value})}
                    rows="3"
                    className="form-textarea"
                    placeholder="Дополнительная информация по заказу..."
                  />
                </div>

                <div className="cart-form-total">
                  <span className="cart-form-total-label">Итого:</span>
                  <span className="cart-form-total-value">{cartTotal} ₸</span>
                </div>

                <div className="cart-form-actions">
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="btn btn-secondary"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <span className="btn-content">
                        <span className="spinner small"></span>
                        Оформление...
                      </span>
                    ) : (
                      'Подтвердить'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Преимущества */}
            <div className="cart-benefits">
              <div className="cart-benefit">
                <FiTruck className="cart-benefit-icon" />
                <span className="cart-benefit-text">Бесплатная доставка от 5000 ₸</span>
              </div>
              <div className="cart-benefit">
                <FiShield className="cart-benefit-icon" />
                <span className="cart-benefit-text">Гарантия качества</span>
              </div>
              <div className="cart-benefit">
                <FiCreditCard className="cart-benefit-icon" />
                <span className="cart-benefit-text">Безопасная оплата</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}