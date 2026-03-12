// lib/firebase/firestore.js
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

// Общие функции для работы с Firestore

// Получить документ по ID
export async function getDocument(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
}

// Получить все документы из коллекции
export async function getCollection(collectionName, constraints = []) {
  try {
    const collectionRef = collection(db, collectionName);
    let q = collectionRef;
    
    if (constraints.length > 0) {
      q = query(collectionRef, ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting collection:', error);
    throw error;
  }
}

// Добавить документ с автоматическим ID
export async function addDocument(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...data
    };
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
}

// Добавить документ с указанным ID
export async function setDocument(collectionName, docId, data) {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docId,
      ...data
    };
  } catch (error) {
    console.error('Error setting document:', error);
    throw error;
  }
}

// Обновить документ
export async function updateDocument(collectionName, docId, data) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

// Удалить документ
export async function deleteDocument(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// Поиск документов по условию
export async function queryDocuments(collectionName, conditions = [], orderByField = null, orderDir = 'asc', limitCount = null) {
  try {
    const collectionRef = collection(db, collectionName);
    let constraints = [];
    
    // Добавляем условия where
    conditions.forEach(condition => {
      constraints.push(where(condition.field, condition.operator, condition.value));
    });
    
    // Добавляем сортировку
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDir));
    }
    
    // Добавляем лимит
    if (limitCount) {
      constraints.push(limit(limitCount));
    }
    
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
}

// Пагинация
export async function paginateCollection(collectionName, pageSize, lastDoc = null, orderByField = 'createdAt', orderDir = 'desc') {
  try {
    const collectionRef = collection(db, collectionName);
    let constraints = [orderBy(orderByField, orderDir), limit(pageSize)];
    
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return {
      documents,
      lastDoc: lastVisible,
      hasMore: querySnapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error('Error paginating collection:', error);
    throw error;
  }
}

// Транзакция
export async function runFirestoreTransaction(transactionCallback) {
  try {
    return await runTransaction(db, transactionCallback);
  } catch (error) {
    console.error('Error running transaction:', error);
    throw error;
  }
}

// Пакетная запись
export function createBatch() {
  return writeBatch(db);
}

// Инкремент значения
export function incrementValue(amount = 1) {
  return increment(amount);
}

// Добавить элемент в массив
export function addToArray(element) {
  return arrayUnion(element);
}

// Удалить элемент из массива
export function removeFromArray(element) {
  return arrayRemove(element);
}

// Проверка существования документа
export async function documentExists(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking document:', error);
    return false;
  }
}

// Получить несколько документов по ID
export async function getDocumentsByIds(collectionName, ids) {
  try {
    if (!ids || ids.length === 0) return [];
    
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) {
      chunks.push(ids.slice(i, i + 10));
    }
    
    const results = [];
    for (const chunk of chunks) {
      const q = query(
        collection(db, collectionName),
        where('__name__', 'in', chunk)
      );
      const querySnapshot = await getDocs(q);
      results.push(...querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    }
    
    return results;
  } catch (error) {
    console.error('Error getting documents by ids:', error);
    throw error;
  }
}