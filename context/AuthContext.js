'use client'

// context/AuthContext.js
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  // Слушаем изменения состояния аутентификации
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Получаем дополнительные данные пользователя из Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            setUser(firebaseUser);
            setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              ...firestoreData
            });
          } else {
            // Если нет документа в Firestore, создаем базовый
            const userData = {
              name: firebaseUser.displayName || 'Пользователь',
              email: firebaseUser.email,
              role: 'buyer',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              isActive: true
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            
            setUser(firebaseUser);
            setUserData({
              uid: firebaseUser.uid,
              ...userData
            });
          }
          
          // Логируем вход
          await logUserActivity(firebaseUser.uid, 'USER_LOGIN');
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Логирование активности пользователя
  const logUserActivity = async (userId, action) => {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Регистрация
  const register = async (email, password, userInfo) => {
    setLoading(true);
    try {
      // Создаем пользователя в Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Обновляем профиль
      await updateProfile(firebaseUser, {
        displayName: userInfo.name
      });

      // Хешируем пароль для Firestore
      const hashedPassword = await bcrypt.hash(password, 10);

      // Сохраняем данные в Firestore
      const userData = {
        ...userInfo,
        email: email.toLowerCase(),
        password: hashedPassword,
        uid: firebaseUser.uid,
        role: userInfo.role || 'buyer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        emailVerified: false,
        phone: userInfo.phone || '',
        address: userInfo.address || '',
        avatar: userInfo.avatar || null,
        favorites: [],
        notifications: [],
        settings: {
          language: 'ru',
          theme: 'light',
          emailNotifications: true
        }
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      // Если продавец, создаем запись в sellers
      if (userInfo.role === 'seller') {
        await setDoc(doc(db, 'sellers', firebaseUser.uid), {
          userId: firebaseUser.uid,
          companyName: userInfo.name,
          description: '',
          logo: null,
          rating: 0,
          totalSales: 0,
          totalProducts: 0,
          verified: false,
          documents: [],
          paymentDetails: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Логируем событие
      await logUserActivity(firebaseUser.uid, 'USER_REGISTERED');

      toast.success('Регистрация успешна!');
      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'Ошибка при регистрации';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Этот email уже зарегистрирован';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Неверный формат email';
      } else if (error.code === 'auth/weak-password') {
        message = 'Пароль должен быть не менее 6 символов';
      }
      
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Вход
  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Проверяем, активен ли пользователь
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists() && userDoc.data().isActive === false) {
        await signOut(auth);
        toast.error('Ваш аккаунт деактивирован');
        return { success: false, error: 'Аккаунт деактивирован' };
      }

      // Логируем вход
      await logUserActivity(firebaseUser.uid, 'USER_LOGIN');

      toast.success('Вход выполнен успешно!');
      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Ошибка при входе';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Неверный email или пароль';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Слишком много попыток. Попробуйте позже';
      }
      
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Выход
  const logout = async () => {
    try {
      if (user) {
        await logUserActivity(user.uid, 'USER_LOGOUT');
      }
      
      await signOut(auth);
      toast.success('Вы вышли из системы');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Ошибка при выходе');
    }
  };

  // Сброс пароля
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Инструкция по сбросу пароля отправлена на email');
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      let message = 'Ошибка при сбросе пароля';
      
      if (error.code === 'auth/user-not-found') {
        message = 'Пользователь с таким email не найден';
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Обновление профиля
  const updateUserProfile = async (data) => {
    if (!user) return { success: false, error: 'Не авторизован' };

    try {
      // Обновляем в Firebase Auth
      if (data.name) {
        await updateProfile(user, { displayName: data.name });
      }

      // Обновляем в Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      // Обновляем локальное состояние
      setUserData(prev => ({
        ...prev,
        ...data
      }));

      // Логируем событие
      await logUserActivity(user.uid, 'USER_UPDATED');

      toast.success('Профиль обновлен');
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Ошибка при обновлении профиля');
      return { success: false, error: error.message };
    }
  };

  // Добавление в избранное
  const addToFavorites = async (productId) => {
    if (!user) {
      toast.error('Необходимо войти в систему');
      router.push('/login');
      return false;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const currentFavorites = userDoc.data().favorites || [];
      
      if (!currentFavorites.includes(productId)) {
        await updateDoc(userRef, {
          favorites: [...currentFavorites, productId]
        });
        
        setUserData(prev => ({
          ...prev,
          favorites: [...(prev.favorites || []), productId]
        }));
        
        toast.success('Добавлено в избранное');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Ошибка при добавлении в избранное');
      return false;
    }
  };

  // Удаление из избранного
  const removeFromFavorites = async (productId) => {
    if (!user) return false;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const currentFavorites = userDoc.data().favorites || [];
      
      await updateDoc(userRef, {
        favorites: currentFavorites.filter(id => id !== productId)
      });
      
      setUserData(prev => ({
        ...prev,
        favorites: (prev.favorites || []).filter(id => id !== productId)
      }));
      
      toast.success('Удалено из избранного');
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Ошибка при удалении из избранного');
      return false;
    }
  };

  // Проверка в избранном
  const isInFavorites = (productId) => {
    return userData?.favorites?.includes(productId) || false;
  };

  // Обновление настроек
  const updateSettings = async (settings) => {
    if (!user) return false;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        settings: {
          ...(userData?.settings || {}),
          ...settings
        },
        updatedAt: serverTimestamp()
      });
      
      setUserData(prev => ({
        ...prev,
        settings: {
          ...(prev?.settings || {}),
          ...settings
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  // Проверка роли
  const hasRole = (roles) => {
    if (!userData) return false;
    if (Array.isArray(roles)) {
      return roles.includes(userData.role);
    }
    return userData.role === roles;
  };

  // Является ли администратором
  const isAdmin = () => {
    return userData?.role === 'admin';
  };

  // Является ли продавцом
  const isSeller = () => {
    return userData?.role === 'seller';
  };

  // Является ли покупателем
  const isBuyer = () => {
    return userData?.role === 'buyer';
  };

  // Получение токена
  const getToken = async () => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  // Значения для контекста
  const value = {
    user,
    userData,
    loading,
    initialized,
    register,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    addToFavorites,
    removeFromFavorites,
    isInFavorites,
    updateSettings,
    hasRole,
    isAdmin,
    isSeller,
    isBuyer,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для защиты маршрутов
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}

// Хук для проверки роли
export function useRequireRole(roles, redirectTo = '/') {
  const { userData, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasRole(roles)) {
      router.push(redirectTo);
    }
  }, [userData, loading, hasRole, roles, router, redirectTo]);

  return { userData, loading, hasRole };
}

// Хук для получения данных пользователя
export function useUser() {
  const { userData, loading } = useAuth();
  return { user: userData, loading };
}

// Пример использования:
/*
function MyComponent() {
  const { user, login, logout, isAdmin } = useAuth();

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      {user ? (
        <>
          <p>Привет, {user.displayName}</p>
          {isAdmin() && <p>Вы администратор</p>}
          <button onClick={logout}>Выйти</button>
        </>
      ) : (
        <button onClick={() => login('email@test.com', 'password')}>
          Войти
        </button>
      )}
    </div>
  );
}
*/