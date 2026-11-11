'use client';

import React, { useRef, useState } from 'react';
import NextImage from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductImage } from '@/types';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop';

// La rejilla va de 1 a 4 columnas, así que la imagen nunca ocupa más de un
// cuarto del ancho en pantallas grandes.
const SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw';

const SWIPE_THRESHOLD = 50; // px

interface ProductCarouselProps {
  images?: ProductImage[];
  fallbackUrl?: string;
  productName: string;
  /** Atenúa la imagen cuando el producto está agotado. */
  dimmed?: boolean;
  /** La primera fila del catálogo carga con prioridad. */
  priority?: boolean;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  images,
  fallbackUrl,
  productName,
  dimmed = false,
  priority = false,
}) => {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const gallery = images?.length ? images : null;
  const total = gallery?.length ?? 0;
  const hasCarousel = total > 1;

  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  const handleTouchEnd = () => {
    if (!hasCarousel || touchStartX.current === null || touchEndX.current === null) {
      touchStartX.current = null;
      touchEndX.current = null;
      return;
    }
    const dx = touchStartX.current - touchEndX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx > 0 ? 1 : -1);
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const imageClass = `object-cover transition-opacity duration-300 ${
    dimmed ? 'opacity-35 saturate-50' : ''
  }`;

  return (
    <div
      className="relative m-px aspect-square overflow-hidden bg-panel-engrave"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchMove={(e) => {
        touchEndX.current = e.touches[0].clientX;
      }}
      onTouchEnd={handleTouchEnd}
    >
      {gallery ? (
        gallery.map((img, i) => (
          <NextImage
            key={img.id}
            src={img.image_url}
            alt={total > 1 ? `${productName} — imagen ${i + 1} de ${total}` : productName}
            fill
            sizes={SIZES}
            priority={priority && i === 0}
            className={`${imageClass} ${
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />
        ))
      ) : (
        <NextImage
          src={fallbackUrl || FALLBACK_IMAGE}
          alt={productName}
          fill
          sizes={SIZES}
          priority={priority}
          className={imageClass}
        />
      )}

      {hasCarousel && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 border border-panel-edge bg-panel/80 p-1.5 text-legend transition-colors hover:bg-panel hover:text-signal-amber"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 border border-panel-edge bg-panel/80 p-1.5 text-legend transition-colors hover:bg-panel hover:text-signal-amber"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {gallery!.map((img, i) => (
              <button
                key={img.id}
                type="button"
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1.5 w-4 transition-colors ${
                  i === index ? 'bg-signal-amber' : 'bg-legend-dim/50 hover:bg-legend-dim'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductCarousel;
