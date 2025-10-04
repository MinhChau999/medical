import { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { Spin } from 'antd';

interface LazyLoadProps {
  component: LazyExoticComponent<ComponentType<any>>;
  fallback?: React.ReactNode;
}

export function LazyLoad({ component: Component, fallback }: LazyLoadProps) {
  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spin size="large" tip="Loading..." />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component />
    </Suspense>
  );
}

// Loading component for pages
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Loading page...</p>
      </div>
    </div>
  );
}

// Loading component for components
export function ComponentLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <Spin />
    </div>
  );
}

// Skeleton loader for cards
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm p-6 animate-pulse"
        >
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for table
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded flex-1"></div>
          <div className="h-12 bg-gray-200 rounded w-32"></div>
          <div className="h-12 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
}
