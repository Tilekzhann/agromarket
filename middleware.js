// middleware.js
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log('🛡️ Middleware:', { 
      path, 
      role: token?.role,
      hasToken: !!token 
    });

    // Если нет токена - редирект на логин для защищенных маршрутов
    if (!token) {
      if (path.startsWith('/admin') || 
          path.startsWith('/seller') || 
          path.startsWith('/buyer') || 
          path.startsWith('/cart')) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      return NextResponse.next();
    }

    // СПЕЦИАЛЬНО ДЛЯ ADMIN/EVENTS
    if (path === '/admin/events') {
      console.log('📋 Events page access, role:', token.role);
      if (token.role === 'admin') {
        console.log('✅ Админ, пропускаем');
        return NextResponse.next();
      } else {
        console.log('⛔ Не админ, редирект');
        return NextResponse.redirect(new URL('/catalog', req.url));
      }
    }

    // Защита админ-маршрутов
    if (path.startsWith('/admin')) {
      if (token.role !== 'admin') {
        console.log('⛔ Не админ, редирект на /catalog');
        return NextResponse.redirect(new URL('/catalog', req.url));
      }
    }

    // Защита маршрутов продавца
    if (path.startsWith('/seller') && token.role !== 'seller' && token.role !== 'admin') {
      console.log('⛔ Не продавец, редирект на /catalog');
      return NextResponse.redirect(new URL('/catalog', req.url));
    }

    // Защита маршрутов покупателя
    if (path.startsWith('/buyer') && token.role !== 'buyer' && token.role !== 'admin') {
      console.log('⛔ Не покупатель, редирект на /catalog');
      return NextResponse.redirect(new URL('/catalog', req.url));
    }

    // Если пользователь на странице логина, но уже авторизован
    if (path === '/login' && token) {
      console.log('➡️ Редирект с логина в кабинет');
      if (token.role === 'admin') return NextResponse.redirect(new URL('/admin', req.url));
      if (token.role === 'seller') return NextResponse.redirect(new URL('/seller', req.url));
      return NextResponse.redirect(new URL('/buyer', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/login',
    }
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin/events',
    '/seller/:path*',
    '/buyer/:path*',
    '/cart/:path*',
    '/login'
  ]
};