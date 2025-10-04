import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { Spin } from 'antd';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  lazy?: boolean;
  aspectRatio?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallback = '/placeholder-image.png',
  lazy = true,
  aspectRatio,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(lazy ? fallback : src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!lazy) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setImageSrc(fallback);
      setIsLoading(false);
      setHasError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, lazy, fallback]);

  const handleError = () => {
    if (!hasError) {
      setImageSrc(fallback);
      setHasError(true);
    }
  };

  return (
    <div className={`relative ${className}`} style={{ aspectRatio }}>
      {isLoading && lazy && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Spin />
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        onError={handleError}
        loading={lazy ? 'lazy' : 'eager'}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        {...props}
      />
    </div>
  );
}

// Responsive image component
interface ResponsiveImageProps extends OptimizedImageProps {
  srcSet?: string;
  sizes?: string;
}

export function ResponsiveImage({
  src,
  srcSet,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}: ResponsiveImageProps) {
  return (
    <OptimizedImage
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      {...props}
    />
  );
}

// Avatar component with optimization
interface AvatarImageProps extends OptimizedImageProps {
  size?: 'small' | 'medium' | 'large';
  shape?: 'circle' | 'square';
}

export function AvatarImage({
  size = 'medium',
  shape = 'circle',
  className = '',
  ...props
}: AvatarImageProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg',
  };

  return (
    <OptimizedImage
      className={`${sizeClasses[size]} ${shapeClasses[shape]} ${className}`}
      {...props}
    />
  );
}
