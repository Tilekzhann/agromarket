// app/admin/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { 
  FiUsers, 
  FiPackage, 
  FiShoppingBag, 
  FiDollarSign,
  FiTrendingUp,
  FiUserCheck,
  FiUserX,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiTrash2,
  FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import ChartSales from '@/components/charts/ChartSales';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    reportedProducts: 0
  });

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Проверка прав доступа
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/catalog');
    }
  }, [status, session, router]);

  // Загрузка данных
  useEffect(() => {
    async function fetchAdminData() {
      try {
        // Загружаем пользователей
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);

        // Загружаем товары
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);

        // Загружаем заказы
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(100));
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);

        // Рассчитываем статистику
        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
        
        setStats({
          totalUsers: usersData.length,
          totalSellers: usersData.filter(u => u.role === 'seller').length,
          totalBuyers: usersData.filter(u => u.role === 'buyer').length,
          totalProducts: productsData.length,
          totalOrders: ordersData.length,
          totalRevenue,
          pendingOrders,
          reportedProducts: productsData.filter(p => p.reported).length
        });

      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        toast.error('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, []);

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      });

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast.success('Роль пользователя обновлена');
    } catch (error) {
      console.error('Ошибка обновления роли:', error);
      toast.error('Ошибка при обновлении роли');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });

      setUsers(users.map(u => 
        u.id === userId ? { ...u, isActive: !currentStatus } : u
      ));

      toast.success(`Пользователь ${!currentStatus ? 'активирован' : 'деактивирован'}`);
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      toast.error('Ошибка при изменении статуса');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Товар удален');
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      toast.error('Ошибка при удалении товара');
    }
  };

  const filteredUsers = users.filter(user => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (searchTerm) {
      return user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Заголовок */}
      <div className="admin-header">
        <h1 className="admin-title">Панель администратора</h1>
        <p className="admin-subtitle">Управление пользователями, товарами и заказами</p>
      </div>

      {/* Статистика */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Пользователи</p>
              <p className="stat-value">{stats.totalUsers}</p>
            </div>
            <FiUsers className="stat-icon blue" />
          </div>
          <div className="stat-footer">
            {stats.totalSellers} продавцов, {stats.totalBuyers} покупателей
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Товары</p>
              <p className="stat-value">{stats.totalProducts}</p>
            </div>
            <FiPackage className="stat-icon green" />
          </div>
          <div className="stat-footer">
            {stats.reportedProducts} жалоб
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Заказы</p>
              <p className="stat-value">{stats.totalOrders}</p>
            </div>
            <FiShoppingBag className="stat-icon purple" />
          </div>
          <div className="stat-footer">
            {stats.pendingOrders} ожидают
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Выручка</p>
              <p className="stat-value">{stats.totalRevenue.toLocaleString()} ₸</p>
            </div>
            <FiDollarSign className="stat-icon yellow" />
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className="tabs-container">
        <div className="tabs-header">
          {[
            { id: 'dashboard', label: 'Обзор', icon: FiTrendingUp },
            { id: 'users', label: 'Пользователи', icon: FiUsers },
            { id: 'products', label: 'Товары', icon: FiPackage },
            { id: 'orders', label: 'Заказы', icon: FiShoppingBag },
            { id: 'reports', label: 'Жалобы', icon: FiAlertCircle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="tab-icon" />
              {tab.label}
              {tab.id === 'reports' && reports.length > 0 && (
                <span className="tab-badge">{reports.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {/* Обзор */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-content">
              <h2 className="dashboard-title">Общая статистика</h2>
              <ChartSales data={orders} />
            </div>
          )}

          {/* Пользователи */}
          {activeTab === 'users' && (
            <div className="users-content">
              <div className="users-header">
                <h2 className="users-title">Управление пользователями</h2>
                
                <div className="users-filters">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Все роли</option>
                    <option value="admin">Админы</option>
                    <option value="seller">Продавцы</option>
                    <option value="buyer">Покупатели</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Пользователь</th>
                      <th>Роль</th>
                      <th>Статус</th>
                      <th>Регистрация</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-info">
                            <p className="user-name">{user.name}</p>
                            <p className="user-email">{user.email}</p>
                          </div>
                        </td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="role-select"
                          >
                            <option value="buyer">Покупатель</option>
                            <option value="seller">Продавец</option>
                            <option value="admin">Админ</option>
                          </select>
                        </td>
                        <td>
                          {user.isActive !== false ? (
                            <span className="status-badge active">
                              <FiCheckCircle className="status-icon" />
                              Активен
                            </span>
                          ) : (
                            <span className="status-badge inactive">
                              <FiXCircle className="status-icon" />
                              Заблокирован
                            </span>
                          )}
                        </td>
                        <td className="date-cell">
                          {user.createdAt?.toDate?.().toLocaleDateString() || 'Н/Д'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              className={`action-btn ${user.isActive !== false ? 'warning' : 'success'}`}
                            >
                              {user.isActive !== false ? <FiUserX /> : <FiUserCheck />}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="action-btn info"
                            >
                              <FiEye />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Товары */}
          {activeTab === 'products' && (
            <div className="products-content">
              <h2 className="products-title">Управление товарами</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>Продавец</th>
                      <th>Цена</th>
                      <th>Продажи</th>
                      <th>Статус</th>
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
                                <img src={product.images[0]} alt="" className="product-img" />
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
                        <td>{product.sellerName || 'Н/Д'}</td>
                        <td className="price-cell">{product.price?.toLocaleString()} ₸</td>
                        <td className="sales-cell">{product.salesCount || 0}</td>
                        <td>
                          <div className="status-group">
                            {product.isActive !== false ? (
                              <span className="status-badge active">Активен</span>
                            ) : (
                              <span className="status-badge inactive">Скрыт</span>
                            )}
                            {product.reported && (
                              <span className="status-badge warning">Жалоба</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link href={`/catalog/${product.id}`} target="_blank" className="action-btn info">
                              <FiEye />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="action-btn danger"
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
            </div>
          )}

          {/* Заказы */}
          {activeTab === 'orders' && (
            <div className="orders-content">
              <h2 className="orders-title">Все заказы</h2>
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <div>
                        <p className="order-number">Заказ #{order.id.slice(-8)}</p>
                        <p className="order-date">
                          от {order.createdAt?.toDate?.().toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`order-status ${
                        order.status === 'delivered' ? 'delivered' :
                        order.status === 'cancelled' ? 'cancelled' : 'pending'
                      }`}>
                        {order.status === 'delivered' ? 'Доставлен' :
                         order.status === 'cancelled' ? 'Отменён' : 'В обработке'}
                      </span>
                    </div>

                    <div className="order-customer">
                      Покупатель: {order.buyerName} ({order.buyerEmail})
                    </div>

                    <div className="order-total">
                      <span className="total-label">Сумма:</span>
                      <span className="total-value">{order.totalAmount?.toLocaleString()} ₸</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Жалобы */}
          {activeTab === 'reports' && (
            <div className="reports-content">
              <h2 className="reports-title">Жалобы на товары</h2>
              {reports.length === 0 ? (
                <div className="empty-state">
                  <p>Нет активных жалоб</p>
                </div>
              ) : (
                <div className="reports-list">
                  {reports.map(report => (
                    <div key={report.id} className="report-card">
                      <div className="report-card-header">
                        <div>
                          <p className="report-title">Жалоба на товар</p>
                          <p className="report-reason">{report.reason}</p>
                        </div>
                        <div className="report-actions">
                          <button
                            onClick={() => handleResolveReport(report.id, report.productId)}
                            className="btn btn-primary btn-sm"
                          >
                            Решено
                          </button>
                          <button className="btn btn-danger btn-sm">
                            Заблокировать
                          </button>
                        </div>
                      </div>
                      <p className="report-description">{report.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно пользователя */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Информация о пользователе</h3>
            <div className="user-details">
              <p><strong>ID:</strong> {selectedUser.id}</p>
              <p><strong>Имя:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Роль:</strong> {selectedUser.role}</p>
              <p><strong>Статус:</strong> {selectedUser.isActive ? 'Активен' : 'Заблокирован'}</p>
              <p><strong>Телефон:</strong> {selectedUser.phone || 'Не указан'}</p>
              <p><strong>Адрес:</strong> {selectedUser.address || 'Не указан'}</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowUserModal(false)} className="btn btn-primary">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}