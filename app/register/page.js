// app/register/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiTruck, FiShoppingBag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const validateStep1 = () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Заполните все поля');
      return false;
    }
    if (form.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    return true;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const firebaseUser = userCredential.user;

      const hashedPassword = await bcrypt.hash(form.password, 10);

      const userData = {
        name: form.name,
        email: form.email,
        password: hashedPassword,
        role: form.role,
        phone: form.phone || '',
        address: form.address || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: false,
        isActive: true
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      if (form.role === 'seller') {
        await setDoc(doc(db, 'sellers', firebaseUser.uid), {
          userId: firebaseUser.uid,
          companyName: form.name,
          rating: 0,
          totalSales: 0,
          verified: false,
          documents: [],
          createdAt: serverTimestamp()
        });
      }

      await addDoc(collection(db, 'events'), {
        userId: firebaseUser.uid,
        action: 'USER_REGISTERED',
        details: { 
          email: form.email, 
          role: form.role,
          name: form.name 
        },
        timestamp: serverTimestamp(),
        ip: window?.location?.hostname || 'unknown'
      });

      toast.success('Регистрация успешна! Теперь войдите в систему');
      router.push('/login');
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Этот email уже зарегистрирован');
      } else if (error.code === 'auth/invalid-email') {
        setError('Неверный формат email');
      } else {
        setError('Ошибка при регистрации. Попробуйте позже');
      }
      toast.error('Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Заголовок */}
        <h1 className="register-title">Регистрация в АгроМаркет</h1>
        <p className="register-subtitle">
          Уже есть аккаунт? <Link href="/login">Войдите</Link>
        </p>

        {/* Прогресс бар */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`} />
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`} />
        </div>

        {/* Сообщение об ошибке */}
        {error && (
          <div className="error-message">
            <FiAlertCircle className="error-icon" />
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Выбор роли */}
        <div className="role-selector">
          <button
            type="button"
            onClick={() => setForm({...form, role: 'buyer'})}
            className={`role-button ${form.role === 'buyer' ? 'active' : ''}`}
          >
            <FiShoppingBag className="role-icon" />
            <span className="role-text">Покупатель</span>
          </button>
          
          <button
            type="button"
            onClick={() => setForm({...form, role: 'seller'})}
            className={`role-button ${form.role === 'seller' ? 'active' : ''}`}
          >
            <FiTruck className="role-icon" />
            <span className="role-text">Продавец</span>
          </button>
        </div>

        <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="register-form">
          {/* Шаг 1: Основная информация */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  {form.role === 'seller' ? 'Название компании / Имя' : 'Ваше имя'}
                </label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="form-input"
                    placeholder={form.role === 'seller' ? 'ИП Баспаков Айбар' : 'Айбар Баспаков'}
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label required">Email</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label required">Пароль</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="form-input"
                    placeholder="минимум 6 символов"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label required">Подтвердите пароль</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="form-input"
                    placeholder="повторите пароль"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          {/* Шаг 2: Дополнительная информация */}
          {step === 2 && (
            <>
              <div className="form-group">
                <label htmlFor="phone" className="form-label">Телефон</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="+996 XXX XXX XXX"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="address" className="form-label">Адрес</label>
                <textarea
                  id="address"
                  name="address"
                  rows="3"
                  className="form-textarea"
                  placeholder="Ваш адрес"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>

              {form.role === 'seller' && (
                <div className="info-box">
                  <p className="info-title">Для продавцов:</p>
                  <p className="info-text">
                    После регистрации вам нужно будет добавить сертификаты и документы в личном кабинете для верификации.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Кнопки навигации */}
          <div className="button-group">
            {step === 2 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                Назад
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary ${step === 1 ? 'btn-full' : ''}`}
            >
              {loading ? (
                <span className="btn-content">
                  <span className="spinner" />
                  {step === 1 ? 'Продолжаем...' : 'Регистрация...'}
                </span>
              ) : (
                step === 1 ? 'Продолжить' : 'Зарегистрироваться'
              )}
            </button>
          </div>
        </form>

        {/* Правовая информация */}
        <p className="legal-text">
          Регистрируясь, вы соглашаетесь с{' '}
          <Link href="/terms" className="legal-link">условиями использования</Link>{' '}
          и{' '}
          <Link href="/privacy" className="legal-link">политикой конфиденциальности</Link>
        </p>
      </div>
    </div>
  );
}