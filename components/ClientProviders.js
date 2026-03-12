// components/ClientProviders.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'react-hot-toast';

export default function ClientProviders({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                icon: '✅',
                style: {
                  background: 'green',
                },
              },
              error: {
                icon: '❌',
                style: {
                  background: 'red',
                },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}