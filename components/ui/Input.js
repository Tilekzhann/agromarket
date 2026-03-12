'use client'

// components/ui/Input.js
'use client';
import { forwardRef, useState } from 'react';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

const Input = forwardRef(({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  success,
  disabled = false,
  required = false,
  readOnly = false,
  icon = null,
  iconPosition = 'left',
  helperText,
  counter = false,
  maxLength,
  min,
  max,
  step,
  pattern,
  autoFocus = false,
  name,
  id,
  className = '',
  inputClassName = '',
  labelClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  // Определяем тип поля
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Базовые стили
  const baseStyles = 'block w-full rounded-lg transition-colors focus:outline-none focus:ring-2';
  
  // Стили в зависимости от состояния
  const stateStyles = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-200'
    : success
    ? 'border-green-300 text-green-900 placeholder-green-300 focus:border-green-500 focus:ring-green-200'
    : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-200';

  // Стили для disabled/readonly
  const disabledStyles = disabled || readOnly
    ? 'bg-gray-100 cursor-not-allowed'
    : 'bg-white';

  // Отступы для иконок
  const paddingStyles = icon
    ? iconPosition === 'left'
      ? 'pl-10 pr-3'
      : 'pl-3 pr-10'
    : 'px-3';

  // Стили для поля ввода
  const inputStyles = `
    ${baseStyles}
    ${stateStyles}
    ${disabledStyles}
    ${paddingStyles}
    py-2
    text-sm
    ${inputClassName}
  `;

  // Стили для метки
  const labelStyles = `
    block text-sm font-medium mb-1
    ${error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-700'}
    ${disabled ? 'text-gray-400' : ''}
    ${labelClassName}
  `;

  // Генерация ID
  const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`mb-4 ${className}`}>
      {/* Метка */}
      {label && (
        <label htmlFor={inputId} className={labelStyles}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Контейнер для поля ввода и иконок */}
      <div className="relative">
        {/* Левая иконка */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {/* Поле ввода */}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          maxLength={maxLength}
          autoFocus={autoFocus}
          className={inputStyles}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {/* Правая иконка */}
        {icon && iconPosition === 'right' && !type.includes('password') && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {/* Кнопка показа пароля */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex="-1"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}

        {/* Индикатор ошибки */}
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <FiAlertCircle size={18} />
          </div>
        )}
      </div>

      {/* Счетчик символов */}
      {counter && maxLength && (
        <div className="text-right mt-1">
          <span className={`text-xs ${(value?.length || 0) > maxLength * 0.9 ? 'text-yellow-600' : 'text-gray-500'}`}>
            {(value?.length || 0)} / {maxLength}
          </span>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Вспомогательный текст */}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}

      {/* Сообщение об успехе */}
      {success && !error && (
        <p className="mt-1 text-sm text-green-600">
          {success}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Компонент для текстовой области
export const Textarea = forwardRef(({
  rows = 4,
  resize = true,
  ...props
}, ref) => {
  return (
    <Input
      ref={ref}
      as="textarea"
      rows={rows}
      inputClassName={`${!resize ? 'resize-none' : ''}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

// Компонент для выбора файла
export const FileInput = forwardRef(({
  accept,
  multiple = false,
  onChange,
  ...props
}, ref) => {
  const [fileName, setFileName] = useState('');

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        setFileName(`${files.length} файлов выбрано`);
      } else {
        setFileName(files[0].name);
      }
    } else {
      setFileName('');
    }
    onChange?.(e);
  };

  return (
    <div className="relative">
      <Input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        id="file-input"
        {...props}
      />
      <label
        htmlFor="file-input"
        className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
      >
        <span className="text-sm text-gray-600">
          {fileName || 'Выберите файл...'}
        </span>
        <span className="text-sm text-green-600">Обзор</span>
      </label>
    </div>
  );
});

FileInput.displayName = 'FileInput';

export default Input;

// Примеры использования:
/*
  <Input
    label="Email"
    type="email"
    placeholder="your@email.com"
    required
  />

  <Input
    label="Пароль"
    type="password"
    error="Неверный пароль"
  />

  <Input
    label="Имя"
    icon={<FiUser />}
    success="Отлично!"
  />

  <Textarea
    label="Описание"
    rows={5}
    maxLength={500}
    counter
  />

  <FileInput
    label="Загрузите фото"
    accept="image/*"
    multiple
  />
*/