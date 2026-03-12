'use client'

// components/ui/Button.js
'use client';
import { forwardRef } from 'react';
import { FiLoader } from 'react-icons/fi';

const Button = forwardRef(({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  className = '',
  ...props
}, ref) => {
  // Базовые стили
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Варианты
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500 disabled:border-green-300 disabled:text-green-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 disabled:bg-yellow-300',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 disabled:bg-green-300',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-300',
    link: 'text-green-600 hover:text-green-700 underline-offset-2 hover:underline disabled:text-green-300 p-0 h-auto'
  };

  // Размеры
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  // Ширина
  const width = fullWidth ? 'w-full' : '';

  // Стили для иконок
  const iconStyles = {
    left: 'flex-row',
    right: 'flex-row-reverse'
  };

  // Отступы для иконок
  const iconSpacing = {
    left: 'mr-2',
    right: 'ml-2'
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${width}
        ${icon ? iconStyles[iconPosition] : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <FiLoader className={`animate-spin ${iconSpacing[iconPosition]}`} />
      )}
      {!loading && icon && (
        <span className={iconSpacing[iconPosition]}>{icon}</span>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

// Примеры использования:
/*
  <Button>Кнопка</Button>
  <Button variant="outline" size="lg">Большая кнопка</Button>
  <Button variant="danger" loading>Удалить</Button>
  <Button fullWidth>На всю ширину</Button>
  <Button icon={<FiUser />}>С иконкой</Button>
  <Button disabled>Неактивная</Button>
*/