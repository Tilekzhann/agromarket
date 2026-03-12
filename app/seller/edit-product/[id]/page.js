'use client'

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
  FiPackage,
  FiSave,
  FiTrash2,
  FiAlertCircle
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

  // Загрузка данных товара
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

        // Проверка прав
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
      
      // Удаляем из Storage
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef).catch(() => {}); // Игнорируем ошибку если файл не найден

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
      // Загружаем новые изображения
      const newImageUrls = await Promise.all(
        newImageFiles.map(async (file) => {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      // Загружаем новые сертификаты
      const newCertificateUrls = await Promise.all(
        newCertificateFiles.map(async (file) => {
          const storageRef = ref(storage, `certificates/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      // Обновляем товар
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
      // Удаляем изображения из Storage
      for (const imageUrl of images) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('Ошибка удаления изображения:', error);
        }
      }

      // Удаляем сертификаты из Storage
      for (const certUrl of certificates) {
        try {
          const certRef = ref(storage, certUrl);
          await deleteObject(certRef);
        } catch (error) {
          console.warn('Ошибка удаления сертификата:', error);
        }
      }

      // Удаляем документ из Firestore
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Редактирование товара</h1>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <FiTrash2 className="mr-2" />
          Удалить товар
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Основная информация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название товара *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория *
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цена (тенге) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Количество на складе
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Краткое описание
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Изображения */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Изображения
          </label>
          
          {/* Существующие изображения */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-4">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Загрузка новых изображений */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FiUpload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Добавить новые фото</span>
            </label>
          </div>

          {/* Превью новых изображений */}
          {newImageFiles.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
              {newImageFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Характеристики */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Характеристики
          </label>
          
          {/* Существующие характеристики */}
          {Object.entries(formData.specifications).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2 mb-2">
              <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg">{key}: {value}</span>
              <button
                type="button"
                onClick={() => removeSpecification(key)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <FiX />
              </button>
            </div>
          ))}

          {/* Добавление новой характеристики */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              placeholder="Название"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              placeholder="Значение"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={addSpecification}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FiPlus />
            </button>
          </div>
        </div>

        {/* Статус */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Товар активен (отображается в каталоге)
          </label>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Link
            href="/seller"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Сохранение...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Сохранить изменения
              </>
            )}
          </button>
        </div>
      </form>

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Удаление товара</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить товар "{formData.name}"? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}