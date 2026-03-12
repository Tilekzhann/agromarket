// lib/firebase/orders.js
import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { incrementProductSales } from './products';

// Создать заказ
export async function createOrder(orderData, items, buyerId, buyerName, buyerEmail) {
  try {
    const batch = writeBatch(db);
    
    // Создаем основной заказ
    const orderRef = doc(collection(db, 'orders'));
    batch.set(orderRef, {
      ...orderData,
      buyerId,
      buyerName,
      buyerEmail,
      items,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Группируем товары по продавцам
    const sellerOrders = {};
    items.forEach(item => {
      if (!sellerOrders[item.sellerId]) {
        sellerOrders[item.sellerId] = {
          sellerId: item.sellerId,
          items: [],
          subtotal: 0
        };
      }
      sellerOrders[item.sellerId].items.push(item);
      sellerOrders[item.sellerId].subtotal += item.price * item.quantity;
    });
    
    // Создаем заказы для каждого продавца
    Object.values(sellerOrders).forEach(sellerOrder => {
      const sellerOrderRef = doc(collection(db, 'seller_orders'));
      batch.set(sellerOrderRef, {
        ...sellerOrder,
        orderId: orderRef.id,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Обновляем количество товаров
    items.forEach(item => {
      const productRef = doc(db, 'products', item.productId);
      batch.update(productRef, {
        salesCount: incrementProductSales(1),
        stock: incrementProductSales(-item.quantity),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    
    return {
      id: orderRef.id,
      ...orderData,
      items
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Получить заказы покупателя
export async function getBuyerOrders(buyerId) {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting buyer orders:', error);
    throw error;
  }
}

// Получить заказы продавца
export async function getSellerOrders(sellerId) {
  try {
    const ordersRef = collection(db, 'seller_orders');
    const q = query(
      ordersRef,
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    for (const doc of querySnapshot.docs) {
      const orderData = doc.data();
      const mainOrderRef = doc(db, 'orders', orderData.orderId);
      const mainOrderSnap = await getDoc(mainOrderRef);
      
      orders.push({
        id: doc.id,
        ...orderData,
        mainOrder: mainOrderSnap.exists() ? mainOrderSnap.data() : null,
        createdAt: orderData.createdAt?.toDate()
      });
    }
    
    return orders;
  } catch (error) {
    console.error('Error getting seller orders:', error);
    throw error;
  }
}

// Получить заказ по ID
export async function getOrderById(orderId) {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      return {
        id: orderSnap.id,
        ...orderSnap.data(),
        createdAt: orderSnap.data().createdAt?.toDate()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
}

// Обновить статус заказа
export async function updateOrderStatus(orderId, status) {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// Обновить статус заказа продавца
export async function updateSellerOrderStatus(sellerOrderId, status) {
  try {
    const orderRef = doc(db, 'seller_orders', sellerOrderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating seller order status:', error);
    throw error;
  }
}

// Отменить заказ
export async function cancelOrder(orderId, reason) {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}

// Получить статистику заказов продавца
export async function getSellerOrderStats(sellerId, period = 'month') {
  try {
    const orders = await getSellerOrders(sellerId);
    
    const now = new Date();
    const periodStart = new Date();
    
    if (period === 'week') {
      periodStart.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      periodStart.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      periodStart.setFullYear(now.getFullYear() - 1);
    }
    
    const filteredOrders = orders.filter(o => o.createdAt >= periodStart);
    
    const stats = {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      processing: filteredOrders.filter(o => o.status === 'processing').length,
      shipped: filteredOrders.filter(o => o.status === 'shipped').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
      revenue: filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0),
      averageOrderValue: filteredOrders.length > 0 
        ? filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0) / filteredOrders.length 
        : 0
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting seller order stats:', error);
    throw error;
  }
}