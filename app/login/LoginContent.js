// app/login/LoginContent.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { auth } from '@/lib/firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 👈 ХУК ТЕПЕРЬ ЗДЕСЬ
  const { data: session, status } = useSession();
  
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // Если пользователь уже авторизован, перенаправляем в соответствующий кабинет
  useEffect(() => {
    if (session) {
      redirectBasedOnRole(session.user.role);
    }
  }, [session]);

  const redirectBasedOnRole = (role) => {
    switch(role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'seller':
        router.push('/seller');
        break;
      case 'buyer':
        router.push('/buyer');
        break;
      default:
        router.push('/catalog');
    }
  };

  // Показываем сообщение об ошибке из URL (например, после выхода)
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'SessionRequired') {
      setError('Необходимо войти в систему');
    } else if (error) {
      setError('Ошибка аутентификации');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Попытка входа:', form.email);
      
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      console.log('📨 Результат:', result);

      if (result.error) {
        console.error('❌ Ошибка:', result.error);
        setError('Неверный email или пароль');
        toast.error('Ошибка входа');
      } else {
        console.log('✅ Успешный вход');
        toast.success('Успешный вход!');
        // Перенаправление произойдет через useEffect
      }
    } catch (error) {
      console.error('🔥 Критическая ошибка:', error);
      setError('Произошла ошибка при входе');
      toast.error('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/catalog' });
    } catch (error) {
      toast.error('Ошибка входа через Google');
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Введите email');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success('Инструкция по сбросу пароля отправлена на email');
      setShowResetModal(false);
      setResetEmail('');
    } catch (error) {
      toast.error('Ошибка при отправке инструкции');
    }
  };

  // Показываем загрузку, пока проверяется сессия
  if (status === 'loading') {
    return (
      <div className="register-container">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Заголовок */}
        <h1 className="register-title">Вход в АгроМаркет</h1>
        <p className="register-subtitle">
          Или <Link href="/register">зарегистрируйтесь бесплатно</Link>
        </p>

        {/* Сообщение об ошибке */}
        {error && (
          <div className="error-message">
            <FiAlertCircle className="error-icon" />
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Форма входа */}
        <form className="register-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label required">Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                disabled={loading}
              />
            </div>
          </div>

          {/* Пароль */}
          <div className="form-group">
            <label htmlFor="password" className="form-label required">Пароль</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                disabled={loading}
              />
            </div>
          </div>

          {/* Запомнить меня и забыли пароль */}
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}
              />
              <span className="text-sm text-gray-700">Запомнить меня</span>
            </label>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Забыли пароль?
            </button>
          </div>

          {/* Кнопка входа */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
          >
            {loading ? (
              <span className="btn-content">
                <span className="spinner" />
                Вход...
              </span>
            ) : (
              'Войти'
            )}
          </button>

          {/* Разделитель */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-sm text-gray-500">Или войти через</span>
            </div>
          </div>

          {/* Google вход */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn btn-secondary btn-full flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Войти через Google
          </button>
        </form>

        {/* Модальное окно сброса пароля */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Сброс пароля</h3>
              <p className="text-sm text-gray-600 mb-4">
                Введите ваш email, мы отправим инструкцию по сбросу пароля
              </p>
              <form onSubmit={handlePasswordReset}>
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="button-group">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="btn btn-secondary"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Отправить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}