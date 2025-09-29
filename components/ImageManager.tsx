'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  position?: number;
  created_at?: string;
}

const ImageManager: React.FC<{ productId: string; onClose: () => void }> = ({ productId, onClose }) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/images?productId=${productId}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      // Asegurar que data es un array
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching images:', err);
      setImages([]); // Establecer array vacío en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [productId]);

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    
    // Verificar límite de 5 imágenes totales
    if (images.length + files.length > 5) {
      alert(`No puedes subir más de 5 imágenes. Actualmente tienes ${images.length} imágenes. Selecciona máximo ${5 - images.length} archivos.`);
      return;
    }
    
    setUploading(true);
    setUploadProgress('');
    
    try {
      const fileArray = Array.from(files);
      let uploadedCount = 0;
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`Subiendo imagen ${i + 1} de ${fileArray.length}...`);
        
        const form = new FormData();
        form.append('file', file);
        form.append('productId', productId);

        const res = await fetch('/api/admin/images', {
          method: 'POST',
          body: form
        });

        if (res.ok) {
          uploadedCount++;
        } else {
          const errorData = await res.json();
          console.error(`Error subiendo archivo ${file.name}:`, errorData);
          alert(`Error subiendo ${file.name}: ${errorData.error || 'Error desconocido'}`);
        }
      }

      if (uploadedCount > 0) {
        setFiles(null);
        // Limpiar el input de archivos
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        setUploadProgress(`${uploadedCount} imagen(es) subida(s) correctamente`);
        await fetchImages();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setUploadProgress(''), 3000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error durante la subida de archivos');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/images/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Actualizar el estado local filtrando la imagen eliminada
        setImages(prevImages => prevImages.filter(i => i.id !== id));
      } else {
        const errorData = await res.json();
        console.error('Delete failed:', errorData);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Gestionar imágenes</h3>
        <button className="btn-secondary" onClick={onClose}>Cerrar</button>
      </div>

      <div className="mb-4 p-4 bg-gray-700 rounded-lg">
        <div className="flex flex-col gap-3">
          <label className="text-white text-sm font-medium">
            Subir nuevas imágenes (máximo 5 total):
          </label>
          <div className="text-xs text-gray-400">
            Imágenes actuales: {images.length}/5
          </div>
          <input 
            type="file" 
            accept="image/*" 
            multiple
            onChange={e => setFiles(e.target.files)}
            className="text-white bg-gray-600 border border-gray-500 rounded px-3 py-2"
          />
          {files && files.length > 0 && (
            <div className="text-sm text-gray-300">
              {files.length} archivo(s) seleccionado(s): {Array.from(files).map(f => f.name).join(', ')}
            </div>
          )}
          {uploadProgress && (
            <div className="text-sm text-blue-400">{uploadProgress}</div>
          )}
          <button 
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={handleUpload} 
            disabled={!files || files.length === 0 || isLoading || uploading || images.length >= 5}
          > 
            <Upload className="w-4 h-4" /> 
            {uploading ? 'Subiendo...' : `Subir ${files ? files.length : 0} Imagen(es)`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {isLoading && <div className="col-span-3 text-center text-gray-400">Cargando...</div>}
        {!isLoading && Array.isArray(images) && images.length === 0 && (
          <div className="col-span-3 text-center text-gray-400">No hay imágenes</div>
        )}
        {!isLoading && Array.isArray(images) && images.length >= 5 && (
          <div className="col-span-3 text-center text-yellow-400 text-sm mb-2">
            Has alcanzado el límite máximo de 5 imágenes por producto
          </div>
        )}
        {!isLoading && Array.isArray(images) && images.map((img, index) => (
          <div key={img.id} className="relative">
            <img src={img.image_url} alt={`Imagen ${index + 1}`} className="w-full h-32 object-cover rounded" />
            <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
              #{img.position || index + 1}
            </div>
            <button
              onClick={() => handleDelete(img.id)}
              className="absolute top-1 right-1 bg-red-600 p-1 rounded text-white hover:bg-red-700 transition-colors"
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
