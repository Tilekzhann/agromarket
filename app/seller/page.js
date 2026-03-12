// app/seller/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  FiPackage, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiDownload,
  FiBarChart2,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiStar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMoreVertical
} from 'react-icons/fi';
import ChartSales from '@/components/charts/ChartSales';
import toast from 'react-hot-toast';

export default function SellerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role === 'buyer') {
      router.push('/buyer');
    }
  }, [status, session, router]);

  useEffect(() => {
    async function fetchSellerData() {
      if (!session?.user?.id) return;

      try {
        console.log('👤 ID продавца:', session.user.id);

        const productsRef = collection(db, 'products');
        const productsQuery = query(
          productsRef,
          where('sellerId', '==', session.user.id),
          orderBy('createdAt', 'desc')
        );
        const productsSnapshot = await getDocs(productsQuery);
        console.log('📊 Результат запроса:', productsSnapshot.size, 'документов');
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setProducts(productsData);
        console.log('✅ Установлено товаров:', productsData.length);


        const sellerOrdersRef = collection(db, 'seller_orders');
        const ordersQuery = query(
          sellerOrdersRef,
          where('sellerId', '==', session.user.id),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const ordersData = [];
// 👇 ВАЖНО: переименовали переменную с "doc" на "orderDoc"
for (const orderDoc of ordersSnapshot.docs) {
  const orderData = orderDoc.data();
  // 👇 Теперь функция doc() работает правильно
  const mainOrderRef = doc(db, 'orders', orderData.orderId);
  const mainOrderSnap = await getDoc(mainOrderRef); // 👈 ИСПРАВЛЕНО: getDoc, не getDocs!
  if (mainOrderSnap.exists()) {
    ordersData.push({
      id: orderDoc.id,
      ...orderData,
      mainOrder: mainOrderSnap.data(),
      createdAt: orderData.createdAt?.toDate()
    });
  }
}
        setOrders(ordersData);

        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.subtotal || 0), 0);
        const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
        const completedOrders = ordersData.filter(o => o.status === 'delivered').length;
        
        setStats({
          totalProducts: productsData.length,
          totalOrders: ordersData.length,
          totalRevenue,
          averageRating: 4.5,
          pendingOrders,
          completedOrders
        });

      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        toast.error('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchSellerData();
    }
  }, [session]);

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Товар удален');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      toast.error('Ошибка при удалении товара');
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: new Date()
      });
      
      setProducts(products.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      ));
      
      toast.success('Количество обновлено');
    } catch (error) {
      console.error('Ошибка обновления:', error);
      toast.error('Ошибка при обновлении');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'seller_orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      toast.success('Статус заказа обновлен');
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      toast.error('Ошибка при обновлении статуса');
    }
  };

  const exportReport = () => {
    const headers = ['ID', 'Название', 'Цена', 'Продаж', 'Выручка'];
    const data = products.map(p => [
      p.id,
      p.name,
      p.price,
      p.salesCount || 0,
      (p.price * (p.salesCount || 0))
    ]);
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="seller-container">
      {/* Заголовок */}
      <div className="seller-header">
        <div>
          <h1 className="seller-title">Кабинет продавца</h1>
          <p className="seller-subtitle">Добро пожаловать, {session?.user?.name}</p>
        </div>
        {/* <Link href="/seller/add-product" className="btn btn-primary">
          <FiPlus className="mr-2" />
          Добавить товар
        </Link> */}
      </div>

      {/* Статистика */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Товаров</p>
              <p className="stat-value">{stats.totalProducts}</p>
            </div>
            <FiPackage className="stat-icon green" />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Заказов</p>
              <p className="stat-value">{stats.totalOrders}</p>
            </div>
            <FiTrendingUp className="stat-icon blue" />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Выручка</p>
              <p className="stat-value">{stats.totalRevenue.toLocaleString()} ₸</p>
            </div>
            <FiDollarSign className="stat-icon green" />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Рейтинг</p>
              <p className="stat-value">{stats.averageRating}</p>
            </div>
            <FiStar className="stat-icon yellow" />
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className="tabs-container">
        <div className="tabs-header">
          {[
            { id: 'dashboard', label: 'Обзор', icon: FiBarChart2 },
            { id: 'products', label: 'Товары', icon: FiPackage },
            { id: 'orders', label: 'Заказы', icon: FiTrendingUp },
            { id: 'reports', label: 'Отчеты', icon: FiDownload }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="tab-icon" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {/* Обзор */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-content">
              <h2 className="dashboard-title">Обзор продаж</h2>
              <ChartSales data={orders} />
              
              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">Последние заказы</h3>
                  <div className="dashboard-list">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="dashboard-list-item">
                        <span className="list-item-text">Заказ #{order.id.slice(-8)}</span>
                        <span className="list-item-value">{order.subtotal?.toLocaleString()} ₸</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">Популярные товары</h3>
                  <div className="dashboard-list">
                    {products.slice(0, 5).map(product => (
                      <div key={product.id} className="dashboard-list-item">
                        <span className="list-item-text">{product.name}</span>
                        <span className="list-item-value">{product.salesCount || 0} продаж</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Товары */}
{activeTab === 'products' && (
  <div className="products-content">
    <div className="products-header">
      <h2 className="products-title">Мои товары</h2>
      <Link href="/seller/add-product" className="products-add-link">
        <FiPlus className="mr-1" />
        Добавить товар
      </Link>
    </div>

    {/* Проверка на пустой список */}
    {products.length === 0 ? (
      <div className="empty-products" style={{
        textAlign: 'center',
        padding: '40px',
        background: '#f9fafb',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '15px' }}>
          У вас пока нет товаров
        </p>
        <Link href="/seller/add-product" className="btn btn-primary">
          Добавить первый товар
        </Link>
      </div>
    ) : (
      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th>Цена</th>
              <th>В наличии</th>
              <th>Продажи</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    <div className="product-image">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="product-img"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="product-img-placeholder">📦</span>
                      )}
                    </div>
                    <div>
                      <p className="product-name">{product.name}</p>
                      <p className="product-category">{product.category}</p>
                    </div>
                  </div>
                </td>
                <td className="product-price">{product.price?.toLocaleString()} ₸</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={product.stock || 0}
                    onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value))}
                    className="stock-input"
                    style={{ width: '70px', padding: '4px' }}
                  />
                </td>
                <td className="product-sales">{product.salesCount || 0}</td>
                <td>
                  <div className="product-actions" style={{ display: 'flex', gap: '8px' }}>
                    <Link 
                      href={`/catalog/${product.id}`} 
                      target="_blank" 
                      className="action-btn view"
                      style={{ padding: '6px', color: '#3b82f6' }}
                    >
                      <FiEye />
                    </Link>
                    <Link 
                      href={`/seller/edit-product/${product.id}`} 
                      className="action-btn edit"
                      style={{ padding: '6px', color: '#10b981' }}
                    >
                      <FiEdit2 />
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowDeleteModal(true);
                      }}
                      className="action-btn delete"
                      style={{ padding: '6px', color: '#ef4444' }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

          {/* Заказы */}
          {activeTab === 'orders' && (
            <div className="orders-content">
              <h2 className="orders-title">Заказы</h2>
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <div>
                        <p className="order-number">Заказ #{order.id.slice(-8)}</p>
                        <p className="order-date">
                          от {order.createdAt?.toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="order-status-select"
                      >
                        <option value="pending">Ожидает</option>
                        <option value="processing">В обработке</option>
                        <option value="shipped">Отправлен</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменён</option>
                      </select>
                    </div>

                    <div className="order-items">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <span>{item.name} × {item.quantity}</span>
                          <span>{(item.price * item.quantity)?.toLocaleString()} ₸</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-total">
                      <span className="total-label">Итого:</span>
                      <span className="total-value">{order.subtotal?.toLocaleString()} ₸</span>
                    </div>

                    <div className="order-customer-info">
                      <p>📍 {order.mainOrder?.deliveryAddress}</p>
                      <p>📞 {order.mainOrder?.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Отчеты */}
          {activeTab === 'reports' && (
            <div className="reports-content">
              <h2 className="reports-title">Отчеты</h2>
              <div className="reports-grid">
                <button onClick={exportReport} className="report-card">
                  <FiDownload className="report-icon" />
                  <p className="report-title">Скачать отчет по товарам</p>
                  <p className="report-format">CSV формат</p>
                </button>
                
                <button onClick={() => window.print()} className="report-card">
                  <FiBarChart2 className="report-icon" />
                  <p className="report-title">Отчет по продажам</p>
                  <p className="report-format">PDF формат</p>
                </button>
              </div>

              <div className="period-stats">
                <h3 className="period-stats-title">Статистика за период</h3>
                <div className="period-stats-grid">
                  <div className="period-stat-card">
                    <p className="period-label">Сегодня</p>
                    <p className="period-value">{(stats.totalRevenue * 0.1)?.toLocaleString()} ₸</p>
                  </div>
                  <div className="period-stat-card">
                    <p className="period-label">Неделя</p>
                    <p className="period-value">{(stats.totalRevenue * 0.4)?.toLocaleString()} ₸</p>
                  </div>
                  <div className="period-stat-card">
                    <p className="period-label">Месяц</p>
                    <p className="period-value">{stats.totalRevenue?.toLocaleString()} ₸</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно удаления */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Подтверждение удаления</h3>
            <p className="modal-text">
              Вы уверены, что хотите удалить товар "{selectedProduct?.name}"? Это действие нельзя отменить.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteProduct(selectedProduct.id)}
                className="btn btn-danger"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}