// app/api/categories/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('📦 Запрос категорий...');
    
    const categoriesRef = collection(db, 'categories');
    const querySnapshot = await getDocs(categoriesRef);
    
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Найдено ${categories.length} категорий`);
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('❌ Ошибка загрузки категорий:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки категорий' },
      { status: 500 }
    );
  }
}