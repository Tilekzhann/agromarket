// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('🔍 Вход:', credentials.email);

          // ВАРИАНТ 1: Проверка через Firebase Auth (РЕКОМЕНДУЕТСЯ)
          try {
            // Пытаемся войти через Firebase Auth
            const userCredential = await signInWithEmailAndPassword(
              auth, 
              credentials.email, 
              credentials.password
            );
            
            const firebaseUser = userCredential.user;
            console.log('✅ Firebase Auth успешен:', firebaseUser.uid);

            // Получаем данные из Firestore
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', credentials.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userData = userDoc.data();
              
              return {
                id: firebaseUser.uid,
                name: userData.name || firebaseUser.email?.split('@')[0],
                email: firebaseUser.email,
                role: userData.role || 'buyer',
              };
            }
          } catch (firebaseError) {
            console.log('❌ Firebase Auth ошибка:', firebaseError.code);
            
            // ВАРИАНТ 2: Если Firebase Auth не работает, проверяем через Firestore
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', credentials.email));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
              throw new Error('Пользователь не найден');
            }

            const userDoc = querySnapshot.docs[0];
            const user = { id: userDoc.id, ...userDoc.data() };
            
            // Проверяем пароль через bcrypt
            const isValid = await bcrypt.compare(credentials.password, user.password);
            if (!isValid) {
              throw new Error('Неверный пароль');
            }

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        } catch (error) {
          console.error('❌ Ошибка входа:', error);
          throw new Error(error.message);
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Включаем отладку
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };