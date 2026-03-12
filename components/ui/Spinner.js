// components/ui/Spinner.js
'use client';
import { forwardRef } from 'react';
import { FiLoader } from 'react-icons/fi';

const Spinner = forwardRef(({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  text = '',
  className = '',
  ...props
}, ref) => {
  // Размеры
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  };

  // Цвета
  const colors = {
    primary: 'text-green-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    success: 'text-green-600'
  };

  const spinnerSize = sizes[size] || sizes.md;
  const spinnerColor = colors[color] || colors.primary;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader
            ref={ref}
            className={`animate-spin ${spinnerSize} ${spinnerColor} mx-auto ${className}`}
            {...props}
          />
          {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center">
      <FiLoader
        ref={ref}
        className={`animate-spin ${spinnerSize} ${spinnerColor} ${className}`}
        {...props}
      />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  );
});

Spinner.displayName = 'Spinner';

// Компонент для загрузки в контейнере
export const LoadingOverlay = forwardRef(({
  active = true,
  text = 'Загрузка...',
  children,
  ...props
}, ref) => {
  if (!active) return children;

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
        <Spinner text={text} {...props} />
      </div>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

// Компонент для скелетона загрузки
export const Skeleton = forwardRef(({
  width = '100%',
  height = '20px',
  rounded = 'md',
  className = '',
  ...props
}, ref) => {
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  return (
    <div
      ref={ref}
      className={`bg-gray-200 animate-pulse ${roundedStyles[rounded] || roundedStyles.md} ${className}`}
      style={{ width, height }}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Компонент для карточки-скелетона
export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <Skeleton height="200px" className="mb-4" />
      <Skeleton width="80%" height="20px" className="mb-2" />
      <Skeleton width="60%" height="16px" className="mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton width="100px" height="24px" />
        <Skeleton width="40px" height="40px" rounded="full" />
      </div>
    </div>
  );
};

// Компонент для списка-скелетона
export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton width="40px" height="40px" rounded="full" />
          <div className="flex-1">
            <Skeleton width="60%" height="16px" className="mb-2" />
            <Skeleton width="40%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Spinner;

// Примеры использования:
/*
  // Простой спиннер
  <Spinner />
  
  // Спиннер с текстом
  <Spinner size="lg" text="Загрузка..." />
  
  // На весь экран
  <Spinner fullScreen text="Пожалуйста, подождите..." />
  
  // Поверх контента
  <LoadingOverlay active={loading}>
    <YourContent />
  </LoadingOverlay>
  
  // Скелетоны
  <CardSkeleton />
  <ListSkeleton count={3} />
*/