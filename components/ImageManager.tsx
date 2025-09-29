'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  position?: number;
}

const ImageManager: React.FC<{ productId: string; onClose: () => void }> = ({ productId, onClose }) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/images?productId=${productId}`);
      const data = await res.json();
      setImages(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [productId]);

  const handleUpload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('productId', productId);

    const res = await fetch('/api/admin/images', {
      method: 'POST',
      body: form
    });

    if (res.ok) {
      setFile(null);
      await fetchImages();
    } else {
      console.error('Upload failed');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/images/${id}`, { method: 'DELETE' });
    if (res.ok) setImages(images.filter(i => i.id !== id));
    else console.error('Delete failed');
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Gestionar imágenes</h3>
        <button className="btn-secondary" onClick={onClose}>Cerrar</button>
      </div>

      <div className="mb-3">
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button className="btn-primary ml-2" onClick={handleUpload} disabled={!file}> 
          <Upload className="w-4 h-4" /> Subir
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {isLoading && <div>Cargando...</div>}
        {images.map(img => (
          <div key={img.id} className="relative">
            <img src={img.image_url} alt="" className="w-full h-32 object-cover rounded" />
            <button
              onClick={() => handleDelete(img.id)}
              className="absolute top-1 right-1 bg-red-600 p-1 rounded text-white"
              aria-label="Eliminar imagen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageManager;
