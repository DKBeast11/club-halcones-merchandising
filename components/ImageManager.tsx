'use client';

import React, { useCallback, useEffect, useState } from 'react';
import NextImage from 'next/image';
import { Trash2, Upload } from 'lucide-react';
import { ProductImage } from '@/types';
import { adminFetch } from '@/lib/adminFetch';

const MAX_IMAGES = 5;

interface ImageManagerProps {
  productId: string;
}

const ImageManager: React.FC<ImageManagerProps> = ({ productId }) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/images?productId=${productId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar las imágenes:', err);
      setError(err instanceof Error ? err.message : 'No se han podido cargar las imágenes.');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const remaining = MAX_IMAGES - images.length;

  const handleUpload = async () => {
    if (!files || files.length === 0) return;

    setError('');

    if (files.length > remaining) {
      setError(
        `Solo caben ${remaining} imagen(es) más. Tienes ${images.length} de ${MAX_IMAGES}.`
      );
      return;
    }

    setUploading(true);
    setStatus('');

    try {
      const fileArray = Array.from(files);
      let uploaded = 0;

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setStatus(`Subiendo ${i + 1} de ${fileArray.length}…`);

        const form = new FormData();
        form.append('file', file);
        form.append('productId', productId);

        const res = await adminFetch('/api/admin/images', { method: 'POST', body: form });

        if (res.ok) {
          uploaded++;
        } else {
          const data = await res.json().catch(() => ({}));
          setError(`No se pudo subir ${file.name}: ${data.error || 'error desconocido'}`);
        }
      }

      if (uploaded > 0) {
        setFiles(null);
        const input = document.getElementById('image-upload') as HTMLInputElement | null;
        if (input) input.value = '';

        setStatus(`${uploaded} imagen(es) subida(s).`);
        await fetchImages();
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('');
      }
    } catch (err) {
      console.error('Error durante la subida:', err);
      setError('Ha fallado la subida. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      const res = await adminFetch(`/api/admin/images/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setImages((prev) => prev.filter((i) => i.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se ha podido eliminar la imagen.');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
      setError('No se ha podido eliminar la imagen.');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="engraved flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="image-upload" className="legend-text text-[12px] text-legend">
            Subir imágenes
          </label>
          <span className="font-data text-[11px] tabular text-legend-dim">
            {images.length} / {MAX_IMAGES}
          </span>
        </div>

        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          disabled={uploading || remaining <= 0}
          className="input-field file:mr-3 file:border-0 file:bg-panel-edge file:px-3 file:py-1 file:font-legend file:uppercase file:tracking-legend file:text-[11px] file:text-legend"
        />

        {files && files.length > 0 && (
          <p className="text-[12px] text-legend-dim">
            {files.length} archivo(s): {Array.from(files).map((f) => f.name).join(', ')}
          </p>
        )}

        {status && <p className="font-data text-[11px] text-signal-green">{status}</p>}
        {error && <p className="font-data text-[11px] text-signal-red">{error}</p>}

        {remaining <= 0 && (
          <p className="font-data text-[11px] text-signal-amber">
            Límite alcanzado. Elimina alguna para subir más.
          </p>
        )}

        <button
          type="button"
          className="btn-primary flex items-center justify-center gap-2"
          onClick={handleUpload}
          disabled={!files || files.length === 0 || isLoading || uploading || remaining <= 0}
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Subiendo…' : `Subir ${files ? files.length : 0}`}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {isLoading && (
          <p className="col-span-full py-6 text-center font-data text-[11px] text-legend-dim">
            Cargando…
          </p>
        )}

        {!isLoading && images.length === 0 && (
          <p className="col-span-full py-6 text-center font-data text-[11px] text-legend-dim">
            Este producto todavía no tiene imágenes.
          </p>
        )}

        {!isLoading &&
          images.map((img, i) => (
            <div key={img.id} className="engraved relative aspect-square overflow-hidden">
              <NextImage
                src={img.image_url}
                alt={`Imagen ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 200px"
                className="object-cover"
              />
              <span className="absolute left-1 top-1 bg-panel/80 px-1.5 font-data text-[10px] text-legend">
                {img.position ?? i + 1}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                aria-label={`Eliminar imagen ${i + 1}`}
                className="absolute right-1 top-1 border border-panel-edge bg-panel/80 p-1 text-signal-red transition-colors hover:bg-signal-red hover:text-panel"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ImageManager;
