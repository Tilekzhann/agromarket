// app/login/page.js
import { Suspense } from 'react';
import LoginContent from './LoginContent';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="register-container">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}