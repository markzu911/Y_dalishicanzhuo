import { useState, useRef, DragEvent, ChangeEvent, ReactNode } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (base64: string, mimeType: string) => void;
  label: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}

export default function ImageUploader({ onUpload, label, description, icon, className }: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('仅支持上传图片文件（JPG, PNG, WEBP等）');
      return;
    }

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 1600;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            onUpload(compressedBase64, 'image/jpeg');
          } else {
            onUpload(base64, file.type);
          }
        };
        img.onerror = () => {
          onUpload(base64, file.type);
        };
        img.src = base64;
      } else {
        setError('读取文件失败，请重试');
      }
    };
    reader.onerror = () => {
      setError('读取文件出错，请重新选择');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className || ''}`} id="image-uploader-container">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] h-full ${
          isDragActive 
            ? 'border-gold-500 bg-gold-50' 
            : 'border-gray-200 bg-gray-50 hover:border-gold-300 hover:bg-white hover:shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        <div className="mb-4 text-gray-400 group-hover:text-gold-500 transition-colors duration-300">
          {icon || <Upload className="w-10 h-10" />}
        </div>

        <h3 className="text-sm font-semibold font-display tracking-wide text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
          {fileName ? (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle className="w-4 h-4" /> {fileName}
            </span>
          ) : (
            label
          )}
        </h3>
        
        <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
          {description}
        </p>

        {error && (
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-center gap-1.5 text-xs text-rose-600 bg-rose-50 py-1.5 px-3 rounded-lg border border-rose-100">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
