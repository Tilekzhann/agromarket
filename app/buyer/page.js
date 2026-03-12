// app/buyer/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { 
  FiPackage, 
  FiClock, 
  FiCheckCircle, 
  FiTruck, 
  FiXCircle,
  FiEye,
  FiDownload,
  FiStar,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function BuyerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Статусы заказов
  const orderStatuses = {
    pending: { label: 'Ожидает подтверждения', className: 'order-status-pending', icon: FiClock },
    processing: { label: 'В обработке', className: 'order-status-processing', icon: FiPackage },
    shipped: { label: 'Отправлен', className: 'order-status-shipped', icon: FiTruck },
    delivered: { label: 'Доставлен', className: 'order-status-delivered', icon: FiCheckCircle },
    cancelled: { label: 'Отменён', className: 'order-status-cancelled', icon: FiXCircle }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchOrders() {
      if (!session?.user?.id) return;

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('buyerId', '==', session.user.id),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        setOrders(ordersData);
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        toast.error('Ошибка при загрузке заказов');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchOrders();
    }
  }, [session]);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusIcon = (status) => {
    const StatusIcon = orderStatuses[status]?.icon || FiClock;
    return <StatusIcon className="status-icon" />;
  };

  const handleRepeatOrder = (order) => {
    toast.success('Товары добавлены в корзину');
    router.push('/cart');
  };

  const handleLeaveReview = (productId) => {
    toast.success('Функция отзывов скоро будет доступна');
  };

  const handleTrackOrder = (orderId) => {
    toast.success('Функция отслеживания заказа скоро будет доступна');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="buyer-container">
      {/* Заголовок */}
      <div className="buyer-header">
        <h1 className="buyer-title">Мои заказы</h1>
        <p className="buyer-subtitle">
          {orders.length} {orders.length === 1 ? 'заказ' : orders.length > 1 && orders.length < 5 ? 'заказа' : 'заказов'}
        </p>
      </div>

      {/* Статистика */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Всего заказов</p>
              <p className="stat-value">{orders.length}</p>
            </div>
            <FiPackage className="stat-icon green" />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Доставлено</p>
              <p className="stat-value">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
            <FiCheckCircle className="stat-icon green" />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">В обработке</p>
              <p className="stat-value">
                {orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length}
              </p>
            </div>
            <FiClock className="stat-icon yellow" />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Сумма заказов</p>
              <p className="stat-value">
                {orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)} тенге
              </p>
            </div>
            <FiStar className="stat-icon green" />
          </div>
        </div>
      </div>

      {/* Список заказов */}
      {orders.length === 0 ? (
        <div className="empty-orders">
          <FiPackage className="empty-icon" />
          <h2 className="empty-title">У вас пока нет заказов</h2>
          <p className="empty-text">Перейдите в каталог, чтобы выбрать товары</p>
          <Link href="/catalog" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const StatusIcon = orderStatuses[order.status]?.icon || FiClock;
            const statusClass = orderStatuses[order.status]?.className || '';
            
            return (
              <div key={order.id} className="order-card">
                {/* Заголовок заказа */}
                <div className="order-header">
                  <div className="order-info">
                    <StatusIcon className="order-status-icon" />
                    <div>
                      <span className="order-number">Заказ #{order.id.slice(-8)}</span>
                      <span className="order-date">
                        от {order.createdAt?.toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="order-actions">
                    <span className={`order-status ${statusClass}`}>
                      {orderStatuses[order.status]?.label || 'Неизвестно'}
                    </span>
                    
                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      className="order-toggle"
                    >
                      {expandedOrders[order.id] ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                {/* Краткая информация */}
                <div className="order-summary">
                  <div className="order-summary-info">
                    <p className="order-items-count">
                      {order.items?.length || 0} товаров на сумму
                    </p>
                    <p className="order-total">{order.totalAmount} тенге</p>
                  </div>
                  
                  <div className="order-summary-actions">
                    <button
                      onClick={() => handleTrackOrder(order.id)}
                      className="order-action-btn blue"
                      title="Отследить заказ"
                    >
                      <FiTruck className="action-icon" />
                    </button>
                    <button
                      onClick={() => handleRepeatOrder(order)}
                      className="order-action-btn green"
                      title="Повторить заказ"
                    >
                      <FiPackage className="action-icon" />
                    </button>
                  </div>
                </div>

                {/* Детальная информация */}
                {expandedOrders[order.id] && (
                  <div className="order-details">
                    <h3 className="order-details-title">Состав заказа:</h3>
                    <div className="order-items">
                      {order.items?.map((item, index) => (
                        <div key={index} className="order-item">
                          <div className="order-item-info">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="order-item-image" />
                            ) : (
                              <div className="order-item-placeholder">
                                <span className="text-tertiary">Нет фото</span>
                              </div>
                            )}
                            <div className="order-item-details">
                              <Link href={`/catalog/${item.productId}`} className="order-item-name">
                                {item.name}
                              </Link>
                              <p className="order-item-price">
                                {item.price} тенге × {item.quantity} = {item.price * item.quantity} тенге
                              </p>
                            </div>
                          </div>
                          
                          {order.status === 'delivered' && (
                            <button
                              onClick={() => handleLeaveReview(item.productId)}
                              className="review-btn"
                            >
                              <FiStar className="mr-1" />
                              Оставить отзыв
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Информация о доставке */}
                    <div className="delivery-info-grid">
                      <div className="delivery-info-card">
                        <h4 className="delivery-info-title">Адрес доставки</h4>
                        <p className="delivery-info-text">{order.deliveryAddress}</p>
                      </div>
                      <div className="delivery-info-card">
                        <h4 className="delivery-info-title">Способ оплаты</h4>
                        <p className="delivery-info-text">
                          {order.paymentMethod === 'cash' && 'Наличными при получении'}
                          {order.paymentMethod === 'card' && 'Банковской картой'}
                          {order.paymentMethod === 'transfer' && 'Безналичный расчет'}
                        </p>
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="order-footer-actions">
                      <button
                        onClick={() => window.print()}
                        className="btn btn-secondary"
                      >
                        <FiDownload className="mr-2" />
                        Скачать чек
                      </button>
                      <button
                        onClick={() => handleRepeatOrder(order)}
                        className="btn btn-primary"
                      >
                        Повторить заказ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}