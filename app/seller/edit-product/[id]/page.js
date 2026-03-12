// app/seller/edit-product/[id]/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { db, storage } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  FiUpload, 
  FiX, 
  FiPlus, 
  FiSave,
  FiTrash2,
  FiAlertCircle,
  FiPackage,
  FiTag,
  FiDollarSign,
  FiBox,
  FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EditProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    isActive: true
  });

  const [images, setImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [newCertificateFiles, setNewCertificateFiles] = useState([]);
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;

      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          toast.error('Товар не найден');
          router.push('/seller');
          return;
        }

        const productData = productSnap.data();

        if (productData.sellerId !== session?.user?.id && session?.user?.role !== 'admin') {
          toast.error('У вас нет прав для редактирования этого товара');
          router.push('/seller');
          return;
        }

        setFormData({
          name: productData.name || '',
          description: productData.description || '',
          fullDescription: productData.fullDescription || '',
          price: productData.price || '',
          oldPrice: productData.oldPrice || '',
          category: productData.category || '',
          subcategory: productData.subcategory || '',
          stock: productData.stock || '',
          unit: productData.unit || 'kg',
          minimumOrder: productData.minimumOrder || '1',
          specifications: productData.specifications || {},
          deliveryOptions: productData.deliveryOptions || ['pickup', 'delivery'],
          isActive: productData.isActive !== false
        });

        setImages(productData.images || []);
        setCertificates(productData.certificateUrls || []);

      } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        toast.error('Ошибка при загрузке товара');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchProduct();
    }
  }, [productId, session, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + newImageFiles.length + files.length > 5) {
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

    setNewImageFiles(prev => [...prev, ...validFiles]);
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

    setNewCertificateFiles(prev => [...prev, ...validFiles]);
  };

  const removeExistingImage = async (index) => {
    try {
      const imageUrl = images[index];
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef).catch(() => {});
      setImages(prev => prev.filter((_, i) => i !== index));
      toast.success('Изображение удалено');
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
      toast.error('Ошибка при удалении изображения');
    }
  };

  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingCertificate = async (index) => {
    try {
      const certUrl = certificates[index];
      const certRef = ref(storage, certUrl);
      await deleteObject(certRef).catch(() => {});
      setCertificates(prev => prev.filter((_, i) => i !== index));
      toast.success('Сертификат удален');
    } catch (error) {
      console.error('Ошибка удаления сертификата:', error);
      toast.error('Ошибка при удалении сертификата');
    }
  };

  const removeNewCertificate = (index) => {
    setNewCertificateFiles(prev => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const newImageUrls = await Promise.all(
        newImageFiles.map(async (file) => {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      const newCertificateUrls = await Promise.all(
        newCertificateFiles.map(async (file) => {
          const storageRef = ref(storage, `certificates/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        ...formData,
        price: parseFloat(formData.price),
        oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
        stock: parseInt(formData.stock) || 0,
        minimumOrder: parseInt(formData.minimumOrder) || 1,
        images: [...images, ...newImageUrls],
        certificateUrls: [...certificates, ...newCertificateUrls],
        updatedAt: new Date()
      });

      toast.success('Товар успешно обновлен!');
      router.push('/seller');
      
    } catch (error) {
      console.error('Ошибка обновления товара:', error);
      toast.error('Ошибка при обновлении товара');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      for (const imageUrl of images) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('Ошибка удаления изображения:', error);
        }
      }

      for (const certUrl of certificates) {
        try {
          const certRef = ref(storage, certUrl);
          await deleteObject(certRef);
        } catch (error) {
          console.warn('Ошибка удаления сертификата:', error);
        }
      }

      await deleteDoc(doc(db, 'products', productId));
      toast.success('Товар удален');
      router.push('/seller');
      
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      toast.error('Ошибка при удалении товара');
    }
  };

  if (loading) {
    return (
      <div className="edit-product-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="edit-product-page">
      {/* Заголовок с кнопкой удаления */}
      <div className="edit-product-header">
        <h1 className="edit-product-title">
          <FiPackage className="title-icon" />
          Редактирование товара
        </h1>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="delete-button"
        >
          <FiTrash2 />
          <span>Удалить товар</span>
        </button>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="edit-product-form">
        {/* Основная информация */}
        <div className="form-section">
          <h2 className="section-title">Основная информация</h2>
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label required">
                <FiTag className="label-icon" />
                Название товара
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="field-input"
                placeholder="Например: Яблоки свежие"
                required
              />
            </div>

            <div className="form-field">
              <label className="field-label required">
                <FiBox className="label-icon" />
                Категория
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="field-input"
                placeholder="Выберите категорию"
                required
              />
            </div>

            <div className="form-field">
              <label className="field-label required">
                <FiDollarSign className="label-icon" />
                Цена (₸)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="field-input"
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                <FiBox className="label-icon" />
                Количество на складе
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className="field-input"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Описание */}
        <div className="form-section">
          <h2 className="section-title">Описание</h2>
          <div className="form-field full-width">
            <label className="field-label">Краткое описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="field-textarea"
              placeholder="Краткое описание товара..."
            />
          </div>
        </div>

        {/* Изображения */}
        <div className="form-section">
          <h2 className="section-title">Изображения</h2>
          
          {/* Существующие изображения */}
          {images.length > 0 && (
            <div className="images-grid">
              {images.map((url, index) => (
                <div key={index} className="image-card">
                  <img src={url} alt={`Product ${index + 1}`} className="image-preview" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="image-remove"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Загрузка новых изображений */}
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
              <span className="upload-text">Добавить новые фото</span>
              <span className="upload-hint">PNG, JPG до 5MB</span>
            </label>
          </div>

          {/* Превью новых изображений */}
          {newImageFiles.length > 0 && (
            <div className="images-grid">
              {newImageFiles.map((file, index) => (
                <div key={index} className="image-card">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="image-preview"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="image-remove"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Характеристики */}
        <div className="form-section">
          <h2 className="section-title">Характеристики</h2>
          
          {/* Существующие характеристики */}
          <div className="specs-list">
            {Object.entries(formData.specifications).map(([key, value]) => (
              <div key={key} className="spec-item">
                <span className="spec-text">{key}: {value}</span>
                <button
                  type="button"
                  onClick={() => removeSpecification(key)}
                  className="spec-remove"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>

          {/* Добавление новой характеристики */}
          <div className="spec-add-form">
            <input
              type="text"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              placeholder="Название характеристики"
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
              className="spec-add-button"
            >
              <FiPlus />
            </button>
          </div>
        </div>

        {/* Статус */}
        <div className="form-section">
          <label className="status-toggle">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="status-checkbox"
            />
            <span className="status-track">
              <span className="status-thumb"></span>
            </span>
            <span className="status-label">
              {formData.isActive ? 'Товар активен' : 'Товар скрыт'}
            </span>
          </label>
        </div>

        {/* Кнопки */}
        <div className="form-actions">
          <Link href="/seller" className="cancel-button">
            Отмена
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="save-button"
          >
            {saving ? (
              <span className="button-content">
                <span className="spinner small"></span>
                Сохранение...
              </span>
            ) : (
              <span className="button-content">
                <FiSave className="button-icon" />
                Сохранить изменения
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Модальное окно удаления */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <FiAlertCircle className="modal-icon warning" />
              <h3 className="modal-title">Удаление товара</h3>
            </div>
            <p className="modal-text">
              Вы уверены, что хотите удалить товар <strong>«{formData.name}»</strong>? 
              Это действие нельзя отменить.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="modal-cancel"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteProduct}
                className="modal-confirm-delete"
              >
                <FiTrash2 className="button-icon" />
                Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}