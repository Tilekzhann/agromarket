// lib/firebase/events.js
import { 
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// Логирование события
export async function logEvent(userId, action, details = {}, ip = null) {
  try {
    const eventData = {
      userId,
      action,
      details,
      ip: ip || (typeof window !== 'undefined' ? window.location.hostname : 'server'),
      timestamp: serverTimestamp()
    };
    
    await addDoc(collection(db, 'events'), eventData);
    
    return true;
  } catch (error) {
    console.error('Error logging event:', error);
    return false;
  }
}

// Получить события с фильтрацией
export async function getEvents(filters = {}) {
  try {
    let constraints = [orderBy('timestamp', 'desc')];
    
    if (filters.action && filters.action !== 'all') {
      constraints.push(where('action', '==', filters.action));
    }
    
    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    
    if (filters.startDate) {
      constraints.push(where('timestamp', '>=', filters.startDate));
    }
    
    if (filters.endDate) {
      constraints.push(where('timestamp', '<=', filters.endDate));
    }
    
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
}

// Получить события пользователя
export async function getUserEvents(userId, limitCount = 50) {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting user events:', error);
    throw error;
  }
}

// Получить статистику событий
export async function getEventStats(period = 'day') {
  try {
    const now = new Date();
    const startDate = new Date();
    
    if (period === 'hour') {
      startDate.setHours(now.getHours() - 1);
    } else if (period === 'day') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }
    
    const events = await getEvents({ startDate });
    
    // Группировка по действиям
    const actionCounts = {};
    events.forEach(event => {
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
    });
    
    // Группировка по пользователям
    const userCounts = {};
    events.forEach(event => {
      if (event.userId) {
        userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
      }
    });
    
    return {
      total: events.length,
      uniqueUsers: Object.keys(userCounts).length,
      actionCounts,
      topActions: Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topUsers: Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  } catch (error) {
    console.error('Error getting event stats:', error);
    throw error;
  }
}

// Очистить старые события (для админов)
export async function cleanupOldEvents(daysToKeep = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Здесь нужно реализовать пакетное удаление старых событий
    // Firebase не поддерживает удаление по условию, нужно получать и удалять по одному
    
    return true;
  } catch (error) {
    console.error('Error cleaning up events:', error);
    throw error;
  }
}

// Предопределенные типы событий
export const EventTypes = {
  // Пользователи
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  
  // Товары
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  PRODUCT_VIEWED: 'PRODUCT_VIEWED',
  
  // Заказы
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  
  // Отзывы
  REVIEW_CREATED: 'REVIEW_CREATED',
  REVIEW_UPDATED: 'REVIEW_UPDATED',
  
  // Жалобы
  REPORT_CREATED: 'REPORT_CREATED',
  REPORT_RESOLVED: 'REPORT_RESOLVED',
  
  // Системные
  ERROR_OCCURRED: 'ERROR_OCCURRED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  MAINTENANCE: 'MAINTENANCE'
};