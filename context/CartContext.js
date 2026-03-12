'use client'

// context/CartContext.js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  // Загружаем корзину из localStorage при инициализации
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
      }
    }
  }, []);

  // Сохраняем корзину в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Обновляем счетчик и общую сумму
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setCartCount(count);
    setCartTotal(total);
  }, [cart]);

  // Добавление товара в корзину
  const addToCart = async (productId, quantity = 1) => {
    try {
      // Получаем данные товара из Firestore
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        toast.error('Товар не найден');
        return;
      }

      const product = { id: productSnap.id, ...productSnap.data() };

      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === productId);
        
        if (existingItem) {
          // Если товар уже есть, увеличиваем количество
          toast.success('Количество товара обновлено');
          return prevCart.map(item =>
            item.id === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Если товара нет, добавляем новый
          toast.success('Товар добавлен в корзину');
          return [...prevCart, {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || '/images/default-product.jpg',
            quantity: quantity,
            sellerId: product.sellerId
          }];
        }
      });
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      toast.error('Ошибка при добавлении в корзину');
    }
  };

  // Удаление товара из корзины
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    toast.success('Товар удален из корзины');
  };

  // Обновление количества товара
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Очистка корзины
  const clearCart = () => {
    setCart([]);
    toast.success('Корзина очищена');
  };

  // Проверка наличия товара в корзине
  const isInCart = (productId) => {
    return cart.some(item => item.id === productId);
  };

  // Получение количества конкретного товара
  const getItemQuantity = (productId) => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    cart,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}