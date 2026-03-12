// app/seller/add-product/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { db, storage } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FiUpload, 
  FiX, 
  FiPlus, 
  FiPackage,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AddProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fullDescription: '',
    price: '',
    oldPrice: '',
    category: '',
    subcategory: '',
    stock: '',
    unit: 'kg',
    minimumOrder: '1',
    specifications: {},
    deliveryOptions: ['pickup', 'delivery'],
    paymentMethods: ['cash', 'card']
  });

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  // Проверка авторизации
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role === 'buyer') {
      router.push('/buyer');
    }
  }, [status, session, router]);

  // Загрузка категорий
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
      }
    }
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      toast.error('Можно загрузить не более 5 изображений');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Файл ${file.name} слишком большой (макс. 5MB)`);
        return false;
      }
      return true;
    });

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
    setImageFiles(prev => [...prev, ...validFiles]);
  };

  const handleCertificateUpload = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Файл ${file.name} слишком большой (макс. 10MB)`);
        return false;
      }
      return true;
    });

    const newCertificates = validFiles.map(file => ({
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2)
    }));

    setCertificates(prev => [...prev, ...newCertificates]);
    setCertificateFiles(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeCertificate = (index) => {
    setCertificates(prev => prev.filter((_, i) => i !== index));
    setCertificateFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addSpecification = () => {
    if (specKey && specValue) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey]: specValue
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData(prev => ({ ...prev, specifications: newSpecs }));
  };

  const validateStep1 = () => {
    if (!formData.name) {
      toast.error('Введите название товара');
      return false;
    }
    if (!formData.category) {
      toast.error('Выберите категорию');
      return false;
    }
    if (!formData.price) {
      toast.error('Введите цену');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.description) {
      toast.error('Введите краткое описание');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
      return;
    }

    if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      const certificateUrls = await Promise.all(
        certificateFiles.map(async (file) => {
          const storageRef = ref(storage, `certificates/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
        stock: parseInt(formData.stock) || 0,
        minimumOrder: parseInt(formData.minimumOrder) || 1,
        images: imageUrls,
        certificateUrls,
        sellerId: session.user.id,
        sellerName: session.user.name,
        views: 0,
        salesCount: 0,
        rating: 0,
        reviews: [],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'products'), productData);

      await addDoc(collection(db, 'events'), {
        userId: session.user.id,
        action: 'PRODUCT_CREATED',
        details: {
          productId: docRef.id,
          productName: formData.name,
          category: formData.category
        },
        timestamp: serverTimestamp()
      });

      toast.success('Товар успешно добавлен!');
      router.push('/seller');
      
    } catch (error) {
      console.error('Ошибка добавления товара:', error);
      toast.error('Ошибка при добавлении товара');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Основная информация', icon: FiPackage },
    { number: 2, title: 'Описание и характеристики', icon: FiFileText },
    { number: 3, title: 'Фото и сертификаты', icon: FiUpload }
  ];

  return (
    <div className="add-product-container">
      <h1 className="add-product-title">Добавление нового товара</h1>

      {/* Прогресс */}
      <div className="progress-container">
        <div className="progress-steps">
          {steps.map((step) => (
            <div key={step.number} className="progress-step-wrapper">
              <div className="progress-step-content">
                <div className={`progress-circle ${
                  currentStep > step.number ? 'completed' : 
                  currentStep === step.number ? 'active' : ''
                }`}>
                  {currentStep > step.number ? <FiCheckCircle /> : step.number}
                </div>
                <span className={`progress-label ${currentStep >= step.number ? 'active' : ''}`}>
                  {step.title}
                </span>
              </div>
              {step.number < steps.length && (
                <div className={`progress-line ${currentStep > step.number ? 'active' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="add-product-form">
        {/* Шаг 1: Основная информация */}
        {currentStep === 1 && (
          <div className="form-step">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required">Название товара *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Например: Яблоки свежие"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Категория *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Подкатегория</label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Например: Семейные"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Единица измерения *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="kg">кг</option>
                  <option value="g">грамм</option>
                  <option value="l">литр</option>
                  <option value="pcs">штука</option>
                  <option value="box">ящик</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Цена (₸) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Старая цена (₸)</label>
                <input
                  type="number"
                  name="oldPrice"
                  value={formData.oldPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Количество на складе</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="form-input"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Минимальный заказ</label>
                <input
                  type="number"
                  name="minimumOrder"
                  value={formData.minimumOrder}
                  onChange={handleInputChange}
                  min="1"
                  className="form-input"
                  placeholder="1"
                />
              </div>
            </div>

            {/* Варианты доставки */}
            <div className="form-group">
              <label className="form-label">Способы доставки</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.deliveryOptions.includes('pickup')}
                    onChange={(e) => {
                      const newOptions = e.target.checked
                        ? [...formData.deliveryOptions, 'pickup']
                        : formData.deliveryOptions.filter(o => o !== 'pickup');
                      setFormData(prev => ({ ...prev, deliveryOptions: newOptions }));
                    }}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Самовывоз</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.deliveryOptions.includes('delivery')}
                    onChange={(e) => {
                      const newOptions = e.target.checked
                        ? [...formData.deliveryOptions, 'delivery']
                        : formData.deliveryOptions.filter(o => o !== 'delivery');
                      setFormData(prev => ({ ...prev, deliveryOptions: newOptions }));
                    }}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Доставка</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Шаг 2: Описание и характеристики */}
        {currentStep === 2 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label required">Краткое описание *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="form-textarea"
                placeholder="Краткое описание товара (до 200 символов)"
                maxLength="200"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Полное описание</label>
              <textarea
                name="fullDescription"
                value={formData.fullDescription}
                onChange={handleInputChange}
                rows="6"
                className="form-textarea"
                placeholder="Подробное описание товара, особенности, преимущества"
              />
            </div>

            {/* Характеристики */}
            <div className="form-group">
              <label className="form-label">Характеристики</label>
              <div className="specs-list">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="spec-item">
                    <span className="spec-text">{key}: {value}</span>
                    <button
                      type="button"
                      onClick={() => removeSpecification(key)}
                      className="spec-remove-btn"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
                
                <div className="spec-add-form">
                  <input
                    type="text"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    placeholder="Название"
                    className="spec-input"
                  />
                  <input
                    type="text"
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    placeholder="Значение"
                    className="spec-input"
                  />
                  <button
                    type="button"
                    onClick={addSpecification}
                    className="spec-add-btn"
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Шаг 3: Фото и сертификаты */}
        {currentStep === 3 && (
          <div className="form-step">
            {/* Изображения */}
            <div className="form-group">
              <label className="form-label required">Фотографии товара * (до 5 шт., макс. 5MB)</label>
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="upload-label">
                  <FiUpload className="upload-icon" />
                  <span className="upload-text">Нажмите для загрузки</span>
                </label>
              </div>

              {/* Превью */}
              {images.length > 0 && (
                <div className="image-preview-grid">
                  {images.map((image, index) => (
                    <div key={index} className="image-preview-item">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="image-preview"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="image-remove-btn"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Сертификаты */}
            <div className="form-group">
              <label className="form-label">Сертификаты качества (PDF, до 10MB)</label>
              <div className="upload-area">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={handleCertificateUpload}
                  className="hidden"
                  id="certificate-upload"
                />
                <label htmlFor="certificate-upload" className="upload-label">
                  <FiUpload className="upload-icon" />
                  <span className="upload-text">Загрузить сертификаты</span>
                </label>
              </div>

              {/* Список сертификатов */}
              {certificates.length > 0 && (
                <div className="certificate-list">
                  {certificates.map((cert, index) => (
                    <div key={index} className="certificate-item">
                      <div className="certificate-info">
                        <FiFileText className="certificate-icon" />
                        <span className="certificate-name">{cert.name}</span>
                        <span className="certificate-size">({cert.size} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCertificate(index)}
                        className="certificate-remove-btn"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Кнопки навигации */}
        <div className="form-actions">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="btn btn-secondary"
            >
              Назад
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary ${currentStep === 1 ? 'full-width' : ''}`}
          >
            {loading ? (
              <span className="btn-content">
                <span className="spinner small"></span>
                Сохранение...
              </span>
            ) : currentStep === 3 ? (
              'Добавить товар'
            ) : (
              'Далее'
            )}
          </button>
        </div>
      </form>

      {/* Подсказки */}
      <div className="tips-box">
        <h3 className="tips-title">
          <FiAlertCircle className="tips-icon" />
          Инструкция по добавлению товара:
        </h3>
        <ul className="tips-list">
          <li>Используйте качественные фотографии товара</li>
          <li>Подробно опишите характеристики продукта</li>
          <li>Укажите точную цену и наличие на складе</li>
          <li>Добавьте сертификаты качества для повышения доверия</li>
          <li>Регулярно обновляйте информацию о товаре</li>
        </ul>
      </div>
    </div>
  );
}