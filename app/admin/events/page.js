// app/admin/events/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { db } from '/lib/firebase/config';
import { collection, query, orderBy, limit, startAfter, getDocs, where } from 'firebase/firestore';
import { 
  FiClock, 
  FiUser, 
  FiPackage, 
  FiShoppingBag, 
  FiLogIn, 
  FiLogOut,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState([]);

  const ITEMS_PER_PAGE = 50;

  const actionTypes = {
    all: 'Все действия',
    USER_REGISTERED: 'Регистрация',
    USER_LOGIN: 'Вход',
    USER_LOGOUT: 'Выход',
    USER_UPDATED: 'Обновление профиля',
    PRODUCT_CREATED: 'Создание товара',
    PRODUCT_UPDATED: 'Обновление товара',
    PRODUCT_DELETED: 'Удаление товара',
    ORDER_CREATED: 'Создание заказа',
    ORDER_UPDATED: 'Обновление заказа',
    ORDER_CANCELLED: 'Отмена заказа',
    REPORT_CREATED: 'Создание жалобы',
    REPORT_RESOLVED: 'Решение жалобы'
  };

  const actionIcons = {
    USER_REGISTERED: FiUser,
    USER_LOGIN: FiLogIn,
    USER_LOGOUT: FiLogOut,
    USER_UPDATED: FiEdit,
    PRODUCT_CREATED: FiPackage,
    PRODUCT_UPDATED: FiEdit,
    PRODUCT_DELETED: FiTrash2,
    ORDER_CREATED: FiShoppingBag,
    ORDER_UPDATED: FiEdit,
    REPORT_CREATED: FiFilter
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (session?.user?.role !== 'admin') {
      console.log('❌ Не админ, редирект');
      router.push('/catalog');
    } else {
      console.log('✅ Админ, загружаем события');
      fetchEvents();
    }
  }, [status, session, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email
        }));
        setUsers(usersData);
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      }
    }

    fetchUsers();
  }, []);

  const fetchEvents = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let eventsRef = collection(db, 'events');
      let constraints = [orderBy('timestamp', 'desc')];

      if (filters.action && filters.action !== 'all') {
        constraints.push(where('action', '==', filters.action));
      }

      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        constraints.push(where('timestamp', '>=', startDate));
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        constraints.push(where('timestamp', '<=', endDate));
      }

      constraints.push(limit(ITEMS_PER_PAGE));

      if (isLoadMore && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(eventsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const newEvents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

      if (isLoadMore) {
        setEvents(prev => [...prev, ...newEvents]);
      } else {
        setEvents(newEvents);
      }

      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
      toast.error('Ошибка при загрузке событий');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvents(false);
  }, [filters]);

  const handleExport = () => {
    const data = events.map(e => ({
      id: e.id,
      action: e.action,
      userId: e.userId,
      details: JSON.stringify(e.details),
      timestamp: e.timestamp?.toISOString(),
      ip: e.ip
    }));

    const csv = [
      ['ID', 'Действие', 'Пользователь', 'Детали', 'Время', 'IP'],
      ...data.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setFilters({
      action: 'all',
      userId: '',
      startDate: '',
      endDate: ''
    });
  };

  const getActionColor = (action) => {
    if (action.includes('USER')) return 'event-type-user';
    if (action.includes('PRODUCT')) return 'event-type-product';
    if (action.includes('ORDER')) return 'event-type-order';
    if (action.includes('REPORT')) return 'event-type-report';
    return 'event-type-default';
  };

  return (
    <div className="events-container">
      {/* Заголовок */}
      <div className="events-header">
        <div>
          <h1 className="events-title">Журнал событий</h1>
          <p className="events-subtitle">Отслеживание всех действий в системе</p>
        </div>
        <div className="events-actions">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline"
          >
            <FiFilter className="btn-icon" />
            Фильтры
          </button>
          <button
            onClick={handleExport}
            className="btn btn-primary"
          >
            <FiDownload className="btn-icon" />
            Экспорт
          </button>
          <button
            onClick={() => fetchEvents(false)}
            className="btn btn-secondary btn-icon-only"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Фильтры */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3 className="filters-title">Фильтры</h3>
            <button
              onClick={clearFilters}
              className="filters-clear"
            >
              Сбросить
            </button>
          </div>
          
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Действие</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({...filters, action: e.target.value})}
                className="filter-select"
              >
                {Object.entries(actionTypes).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Пользователь</label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({...filters, userId: e.target.value})}
                className="filter-select"
              >
                <option value="">Все пользователи</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">С</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">По</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="filter-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* События */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="events-list">
          {events.map(event => {
            const Icon = actionIcons[event.action] || FiClock;
            const actionColor = getActionColor(event.action);
            
            return (
              <div key={event.id} className="event-card">
                <div className="event-icon-wrapper">
                  <div className={`event-icon ${actionColor}`}>
                    <Icon />
                  </div>
                </div>

                <div className="event-content">
                  <div className="event-header">
                    <div>
                      <h3 className="event-title">
                        {actionTypes[event.action] || event.action}
                      </h3>
                      {event.details && (
                        <p className="event-details">
                          {typeof event.details === 'object' 
                            ? JSON.stringify(event.details)
                            : event.details
                          }
                        </p>
                      )}
                    </div>
                    <span className="event-time">
                      {event.timestamp?.toLocaleString()}
                    </span>
                  </div>

                  
<div className="event-meta">
  <span className="event-user">
    <FiUser className="meta-icon" />
    {event.userId ? (
      (() => {
        const user = users.find(u => u.id === event.userId);
        return user ? user.name : `Пользователь ${event.userId.slice(0, 6)}...`;
      })()
    ) : 'Система'}
  </span>
  {event.ip && (
    <span className="event-ip">IP: {event.ip}</span>
  )}
</div>
                </div>
              </div>
            );
          })}

          {/* Кнопка загрузки еще */}
          {hasMore && (
            <div className="load-more">
              <button
                onClick={() => fetchEvents(true)}
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

          {events.length === 0 && (
            <div className="empty-state">
              <p>События не найдены</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}