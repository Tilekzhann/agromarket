// app/api/products/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/products - получение списка товаров с фильтрацией
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Параметры фильтрации
    const category = searchParams.get('category');
    const sellerId = searchParams.get('sellerId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('pageSize')) || 20;
    const inStock = searchParams.get('inStock') === 'true';
    const withCertificates = searchParams.get('withCertificates') === 'true';

    let productsRef = collection(db, 'products');
    let constraints = [];

    // Применяем фильтры
    if (category) {
      constraints.push(where('category', '==', category));
    }

    if (sellerId) {
      constraints.push(where('sellerId', '==', sellerId));
    }

    if (inStock) {
      constraints.push(where('stock', '>', 0));
    }

    if (withCertificates) {
      constraints.push(where('certificateUrls', '!=', null));
      constraints.push(where('certificateUrls', '!=', []));
    }

    // Сортировка
    constraints.push(orderBy(sortBy, sortOrder));
    
    // Пагинация
    constraints.push(limit(pageSize));

    const q = query(productsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    let products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Фильтрация по цене (на клиенте, т.к. Firebase не поддерживает множественные условия)
    if (minPrice) {
      products = products.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      products = products.filter(p => p.price <= parseFloat(maxPrice));
    }

    // Поиск по тексту
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.category && p.category.toLowerCase().includes(searchLower))
      );
    }

    // Только активные товары
    products = products.filter(p => p.isActive !== false);

    return NextResponse.json({
      products,
      page,
      pageSize,
      total: products.length,
      hasMore: products.length === pageSize
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - создание нового товара
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверка роли (только продавцы и админы могут создавать товары)
    if (session.user.role !== 'seller' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only sellers can create products' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Валидация обязательных полей
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, category' },
        { status: 400 }
      );
    }

    // Подготовка данных для сохранения
    const productData = {
      name: body.name,
      description: body.description || '',
      fullDescription: body.fullDescription || '',
      price: parseFloat(body.price),
      oldPrice: body.oldPrice ? parseFloat(body.oldPrice) : null,
      category: body.category,
      subcategory: body.subcategory || '',
      images: body.images || [],
      certificateUrls: body.certificateUrls || [],
      sellerId: session.user.id,
      sellerName: session.user.name,
      stock: parseInt(body.stock) || 0,
      unit: body.unit || 'kg',
      minimumOrder: parseInt(body.minimumOrder) || 1,
      specifications: body.specifications || {},
      deliveryOptions: body.deliveryOptions || ['pickup', 'delivery'],
      paymentMethods: body.paymentMethods || ['cash', 'card'],
      views: 0,
      salesCount: 0,
      rating: 0,
      reviews: [],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Сохранение в Firestore
    const docRef = await addDoc(collection(db, 'products'), productData);

    // Логирование события
    await addDoc(collection(db, 'events'), {
      userId: session.user.id,
      action: 'PRODUCT_CREATED',
      details: {
        productId: docRef.id,
        productName: body.name,
        category: body.category
      },
      timestamp: serverTimestamp(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      id: docRef.id,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/:id - обновление товара
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const productId = params.id;
    const body = await request.json();

    // Проверка существования товара
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = productSnap.data();

    // Проверка прав (только владелец или админ)
    if (productData.sellerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only edit your own products' },
        { status: 403 }
      );
    }

    // Обновление данных
    const updateData = {
      ...body,
      price: body.price ? parseFloat(body.price) : productData.price,
      stock: body.stock ? parseInt(body.stock) : productData.stock,
      updatedAt: serverTimestamp()
    };

    await updateDoc(productRef, updateData);

    // Логирование события
    await addDoc(collection(db, 'events'), {
      userId: session.user.id,
      action: 'PRODUCT_UPDATED',
      details: {
        productId,
        productName: body.name || productData.name
      },
      timestamp: serverTimestamp()
    });

    return NextResponse.json({
      id: productId,
      ...productData,
      ...updateData,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id - удаление товара
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const productId = params.id;

    // Проверка существования товара
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = productSnap.data();

    // Проверка прав (только владелец или админ)
    if (productData.sellerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own products' },
        { status: 403 }
      );
    }

    // Мягкое удаление или полное удаление?
    const permanent = request.nextUrl.searchParams.get('permanent') === 'true';

    if (permanent) {
      // Полное удаление
      await deleteDoc(productRef);
    } else {
      // Мягкое удаление (деактивация)
      await updateDoc(productRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    }

    // Логирование события
    await addDoc(collection(db, 'events'), {
      userId: session.user.id,
      action: 'PRODUCT_DELETED',
      details: {
        productId,
        productName: productData.name,
        permanent
      },
      timestamp: serverTimestamp()
    });

    return NextResponse.json({
      message: permanent ? 'Product permanently deleted' : 'Product deactivated',
      id: productId
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/:id - частичное обновление (например, количество)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const productId = params.id;
    const body = await request.json();

    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Разрешенные поля для частичного обновления
    const allowedFields = ['stock', 'price', 'isActive'];
    const updateData = {};

    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'stock') updateData[key] = parseInt(body[key]);
        else if (key === 'price') updateData[key] = parseFloat(body[key]);
        else updateData[key] = body[key];
      }
    });

    updateData.updatedAt = serverTimestamp();

    await updateDoc(productRef, updateData);

    return NextResponse.json({
      id: productId,
      ...updateData,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error patching product:', error);
    return NextResponse.json(
      { error: 'Failed to patch product' },
      { status: 500 }
    );
  }
}

// OPTIONS - для CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}