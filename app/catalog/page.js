// app/catalog/page.js
import { Suspense } from 'react';
import CatalogContent from './CatalogContent';

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}