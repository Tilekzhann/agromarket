// lib/utils.js

// Форматирование даты
export function formatDate(date, format = 'DD.MM.YYYY') {
  if (!date) return '';
  
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
    .replace('HH', hours)
    .replace('mm', minutes);
}

// Форматирование цены
export function formatPrice(price, currency = 'тенге') {
  if (price === null || price === undefined) return '';
  return new Intl.NumberFormat('ru-RU').format(price) + ' ' + currency;
}

// Форматирование числа
export function formatNumber(number) {
  return new Intl.NumberFormat('ru-RU').format(number);
}

// Обрезка текста
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Генерация случайного ID
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Валидация email
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Валидация телефона (для Кыргызстана)
export function isValidPhone(phone) {
  const re = /^(\+996|0)[0-9]{9}$/;
  return re.test(phone.replace(/\s/g, ''));
}

// Валидация пароля
export function isStrongPassword(password) {
  return password.length >= 6;
}

// Группировка массива по ключу
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

// Сортировка массива
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
}

// Фильтрация массива по поисковому запросу
export function filterBySearch(array, searchTerm, fields) {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  return array.filter(item => {
    return fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(term);
    });
  });
}

// Расчет скидки
export function calculateDiscount(price, oldPrice) {
  if (!price || !oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

// Получение инициалов
export function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Склонение слов
export function pluralize(count, words) {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    count % 100 > 4 && count % 100 < 20
      ? 2
      : cases[Math.min(count % 10, 5)]
  ];
}

// Задержка (для тестов)
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Копирование в буфер обмена
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

// Скачивание файла
export function downloadFile(content, fileName, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Парсинг ошибок Firebase
export function parseFirebaseError(error) {
  const errorCode = error.code;
  const errorMessage = error.message;
  
  const messages = {
    'auth/user-not-found': 'Пользователь не найден',
    'auth/wrong-password': 'Неверный пароль',
    'auth/email-already-in-use': 'Email уже используется',
    'auth/weak-password': 'Слишком слабый пароль',
    'auth/invalid-email': 'Неверный формат email',
    'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
    'auth/network-request-failed': 'Ошибка сети',
    'permission-denied': 'Нет доступа',
    'not-found': 'Документ не найден',
    'already-exists': 'Документ уже существует'
  };
  
  return messages[errorCode] || errorMessage || 'Произошла ошибка';
}

// Проверка, является ли значение пустым
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Безопасный парсинг JSON
export function safeJSONParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

// Получение параметров URL
export function getUrlParams() {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
}

// Обновление параметров URL
export function updateUrlParams(params, replace = false) {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value.toString());
    }
  });
  
  if (replace) {
    window.history.replaceState({}, '', url.toString());
  } else {
    window.history.pushState({}, '', url.toString());
  }
}

// Дебаунс
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Троттлинг
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}