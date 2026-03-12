'use client'

// components/ui/Card.js
'use client';
import { forwardRef } from 'react';

const Card = forwardRef(({
  children,
  padding = 'md',
  shadow = 'md',
  border = true,
  hoverable = false,
  clickable = false,
  className = '',
  onClick,
  ...props
}, ref) => {
  // Отступы
  const paddings = {
    none: '',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  // Тени
  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  };

  // Граница
  const borderStyles = border ? 'border border-gray-200' : '';

  // Эффекты при наведении
  const hoverStyles = hoverable ? 'transition-shadow hover:shadow-lg' : '';
  
  // Кликабельность
  const clickableStyles = clickable ? 'cursor-pointer hover:bg-gray-50' : '';

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        bg-white rounded-lg
        ${paddings[padding] || paddings.md}
        ${shadows[shadow] || shadows.md}
        ${borderStyles}
        ${hoverStyles}
        ${clickableStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Компонент заголовка карточки
Card.Header = forwardRef(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`border-b border-gray-200 pb-4 mb-4 ${className}`}
    {...props}
  >
    {children}
  </div>
));

Card.Header.displayName = 'Card.Header';

// Компонент тела карточки
Card.Body = forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={className} {...props}>
    {children}
  </div>
));

Card.Body.displayName = 'Card.Body';

// Компонент подвала карточки
Card.Footer = forwardRef(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`border-t border-gray-200 pt-4 mt-4 ${className}`}
    {...props}
  >
    {children}
  </div>
));

Card.Footer.displayName = 'Card.Footer';

// Компонент изображения карточки
Card.Image = forwardRef(({ src, alt = '', className = '', ...props }, ref) => (
  <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      {...props}
    />
  </div>
));

Card.Image.displayName = 'Card.Image';

// Компонент заголовка
Card.Title = forwardRef(({ children, className = '', ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold text-gray-900 ${className}`}
    {...props}
  >
    {children}
  </h3>
));

Card.Title.displayName = 'Card.Title';

// Компонент подзаголовка
Card.Subtitle = forwardRef(({ children, className = '', ...props }, ref) => (
  <h4
    ref={ref}
    className={`text-sm text-gray-600 ${className}`}
    {...props}
  >
    {children}
  </h4>
));

Card.Subtitle.displayName = 'Card.Subtitle';

// Компонент текста
Card.Text = forwardRef(({ children, className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={`text-gray-700 ${className}`}
    {...props}
  >
    {children}
  </p>
));

Card.Text.displayName = 'Card.Text';

export default Card;

// Примеры использования:
/*
  <Card>
    <Card.Image src="/image.jpg" alt="Product" />
    <Card.Body>
      <Card.Title>Название товара</Card.Title>
      <Card.Text>Описание товара</Card.Text>
    </Card.Body>
    <Card.Footer>
      <Button>Купить</Button>
    </Card.Footer>
  </Card>

  <Card hoverable clickable onClick={() => console.log('clicked')}>
    <Card.Header>Заголовок</Card.Header>
    <Card.Body>Содержимое</Card.Body>
  </Card>
*/