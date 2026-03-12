// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/ClientProviders'; // Импортируем клиентский компонент
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['cyrillic'] });

export const metadata = {
  title: 'АгроМаркет - Сельскохозяйственная продукция',
  description: 'Платформа для продажи и покупки сельскохозяйственной продукции',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <ClientProviders> {/* Все провайдеры внутри клиентского компонента */}
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}