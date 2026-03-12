// components/products/ProductCard.js
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProductCard({ 
  product, 
  viewMode = 'grid',
  showSeller = false
}) {
  const { addToCart, isInCart } = useCart();
  const { user, addToFavorites, removeFromFavorites, isInFavorites } = useAuth();
  
  const [isLiked, setIsLiked] = useState(isInFavorites?.(product.id) || false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.isActive) {
      toast.error('Товар временно недоступен');
      return;
    }

    addToCart(product.id, 1);
    toast.success(`${product.name} добавлен в корзину`);
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Войдите, чтобы добавить в избранное');
      return;
    }

    if (isLiked) {
      const success = await removeFromFavorites(product.id);
      if (success) {
        setIsLiked(false);
        toast.success('Удалено из избранного');
      }
    } else {
      const success = await addToFavorites(product.id);
      if (success) {
        setIsLiked(true);
        toast.success('Добавлено в избранное');
      }
    }
  };

  const discount = product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  // Режим сетки
  if (viewMode === 'grid') {
    return (
      <Link href={`/catalog/${product.id}`} className="block">
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          {/* Изображение */}
          <div className="relative h-48 bg-gray-100">
            {product.images && product.images[0] && !imageError ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                📦
              </div>
            )}

            {/* Скидка */}
            {discount > 0 && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                -{discount}%
              </span>
            )}

            {/* Избранное */}
            <button
              onClick={handleToggleFavorite}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition"
            >
              <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </button>
          </div>

          {/* Информация */}
          <div className="p-4">
            {product.category && (
              <p className="text-xs text-gray-500 mb-1">{product.category}</p>
            )}
            
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
              {product.name}
            </h3>

            {/* Цена и корзина */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold text-green-600">
                  {formatPrice(product.price)} ₸
                </span>
                {product.oldPrice && (
                  <span className="text-sm text-gray-400 line-through ml-2">
                    {formatPrice(product.oldPrice)} ₸
                  </span>
                )}
              </div>

              <button
  onClick={handleAddToCart}
  disabled={isInCart(product.id) || !product.isActive}
  className={`
    p-2 rounded-lg transition-all
    ${isInCart(product.id) || !product.isActive 
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
      : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
    }
  `}
  style={{
    backgroundColor: isInCart(product.id) || !product.isActive ? '#f3f4f6' : '#16a34a',
    color: isInCart(product.id) || !product.isActive ? '#9ca3af' : 'white',
    cursor: isInCart(product.id) || !product.isActive ? 'not-allowed' : 'pointer'
  }}
>
  <FiShoppingCart className="w-5 h-5" />
</button>
            </div>

            {showSeller && product.sellerName && (
              <p className="text-xs text-gray-500 mt-2">
                {product.sellerName}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Режим списка
  return (
    <Link href={`/catalog/${product.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden flex">
        {/* Изображение */}
        <div className="w-32 h-32 bg-gray-100 flex-shrink-0">
          {product.images && product.images[0] && !imageError ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              📦
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
        </div>

        {/* Информация */}
        <div className="p-4 flex-1">
          <div className="flex justify-between items-start">
            <div>
              {product.category && (
                <p className="text-xs text-gray-500 mb-1">{product.category}</p>
              )}
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
            </div>
            <button
              onClick={handleToggleFavorite}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {product.description || 'Нет описания'}
          </p>

          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(product.price)} ₸
              </span>
              {product.oldPrice && (
                <span className="text-sm text-gray-400 line-through ml-2">
                  {formatPrice(product.oldPrice)} ₸
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.isActive}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                isInCart(product.id)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <FiShoppingCart className="inline mr-2 w-4 h-4" />
              {isInCart(product.id) ? 'В корзине' : 'В корзину'}
            </button>
          </div>

          {showSeller && product.sellerName && (
            <p className="text-xs text-gray-500 mt-2">
              {product.sellerName}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}