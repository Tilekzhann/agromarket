// app/api/events/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Сохраняем событие в Firestore
    await addDoc(collection(db, 'events'), {
      ...body,
      timestamp: serverTimestamp()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка сохранения события:', error);
    return NextResponse.json(
      { error: 'Ошибка сохранения события' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Events API working',
    timestamp: new Date().toISOString()
  });
}