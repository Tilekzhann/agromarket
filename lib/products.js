// lib/firebase/products.js
import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';
import { deleteMultipleFiles } from './storage';

// Получить все товары
export async function getAllProducts(filters = {}) {
  try {
    let constraints = [];
    
    // Применяем фильтры
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.sellerId) {
      constraints.push(where('sellerId', '==', filters.sellerId));
    }
    
    if (filters.inStock) {
      constraints.push(where('stock', '>', 0));
    }
    
    if (filters.active) {
      constraints.push(where('isActive', '==', true));
    }
    
    // Сортировка
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    constraints.push(orderBy(sortField, sortOrder));
    
    // Лимит
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    const productsRef = collection(db, 'products');
    const q = query(productsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    let products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    
    // Фильтрация по цене (на клиенте)
    if (filters.minPrice) {
      products = products.filter(p => p.price >= filters.minPrice);
    }
    
    if (filters.maxPrice) {
      products = products.filter(p => p.price <= filters.maxPrice);
    }
    
    // Поиск по тексту
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }
    
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

// Получить товар по ID
export async function getProductById(productId) {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      const product = {
        id: productSnap.id,
        ...productSnap.data(),
        createdAt: productSnap.data().createdAt?.toDate(),
        updatedAt: productSnap.data().updatedAt?.toDate()
      };
      
      // Увеличиваем счетчик просмотров
      await updateDoc(productRef, {
        views: increment(1)
      });
      
      return product;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

// Создать товар
export async function createProduct(productData, sellerId, sellerName) {
  try {
    const productRef = await addDoc(collection(db, 'products'), {
      ...productData,
      sellerId,
      sellerName,
      views: 0,
      salesCount: 0,
      rating: 0,
      reviews: [],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: productRef.id,
      ...productData,
      sellerId,
      sellerName
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Обновить товар
export async function updateProduct(productId, productData) {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...productData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Удалить товар (мягкое удаление)
export async function deactivateProduct(productId) {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error deactivating product:', error);
    throw error;
  }
}

// Полное удаление товара
export async function deleteProduct(productId, imageUrls = [], certificateUrls = []) {
  try {
    // Удаляем изображения из Storage
    if (imageUrls.length > 0) {
      await deleteMultipleFiles(imageUrls);
    }
    
    // Удаляем сертификаты из Storage
    if (certificateUrls.length > 0) {
      await deleteMultipleFiles(certificateUrls);
    }
    
    // Удаляем документ из Firestore
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Получить товары продавца
export async function getSellerProducts(sellerId) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting seller products:', error);
    throw error;
  }
}

// Получить похожие товары
export async function getSimilarProducts(productId, category, sellerId, limit = 4) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('category', '==', category),
      where('sellerId', '==', sellerId),
      where('isActive', '==', true),
      limit(limit + 1)
    );
    
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => p.id !== productId)
      .slice(0, limit);
    
    return products;
  } catch (error) {
    console.error('Error getting similar products:', error);
    throw error;
  }
}

// Обновить количество товара
export async function updateProductStock(productId, newStock) {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}

// Увеличить счетчик продаж
export async function incrementProductSales(productId, quantity = 1) {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      salesCount: increment(quantity),
      stock: increment(-quantity),
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error incrementing product sales:', error);
    throw error;
  }
}

// Добавить отзыв к товару
export async function addProductReview(productId, review) {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      reviews: [...(productRef.reviews || []), review],
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error adding product review:', error);
    throw error;
  }
}