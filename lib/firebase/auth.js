// lib/firebase/auth.js
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

// Регистрация пользователя
export async function registerUser(email, password, userData) {
  try {
    // Создаем пользователя в Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Обновляем профиль
    await updateProfile(user, {
      displayName: userData.name
    });

    // Хешируем пароль для Firestore
    const hashedPassword = await bcrypt.hash(password, 10);

    // Сохраняем данные в Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      password: hashedPassword,
      email: email.toLowerCase(),
      uid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      emailVerified: false
    });

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// Вход пользователя
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Проверяем, активен ли пользователь в Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (userDoc.exists() && userDoc.data().isActive === false) {
      await signOut(auth);
      return { success: false, error: 'Аккаунт деактивирован' };
    }

    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Выход пользователя
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Сброс пароля
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: error.message };
  }
}

// Обновление профиля
export async function updateUserProfile(userId, data) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Обновляем в Firebase Auth
    if (data.name) {
      await updateProfile(user, { displayName: data.name });
    }

    if (data.email && data.email !== user.email) {
      await updateEmail(user, data.email);
    }

    if (data.password) {
      await updatePassword(user, data.password);
      // Хешируем новый пароль для Firestore
      data.password = await bcrypt.hash(data.password, 10);
    }

    // Обновляем в Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

// Переаутентификация
export async function reauthenticate(password) {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No authenticated user');

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    return { success: true };
  } catch (error) {
    console.error('Reauthentication error:', error);
    return { success: false, error: error.message };
  }
}

// Удаление аккаунта
export async function deleteUserAccount(userId) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Удаляем из Firebase Auth
    await deleteUser(user);

    // Помечаем как удаленного в Firestore (мягкое удаление)
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: false,
      deletedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Delete account error:', error);
    return { success: false, error: error.message };
  }
}

// Получение текущего пользователя
export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Проверка авторизации
export function requireAuth(redirectTo = '/login') {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        if (typeof window !== 'undefined') {
          window.location.href = redirectTo;
        }
        reject(new Error('Not authenticated'));
      }
    });
  });
}