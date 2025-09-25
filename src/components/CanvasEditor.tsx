import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface CanvasEditorProps {
  onCanvasRef: (canvas: HTMLCanvasElement) => void;
  onImageLoad: () => void;
  onError: (message: string) => void;
  setimageFile: (file: File | null) => void; // Fixed: Correct type
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  onCanvasRef,
  onImageLoad,
  onError,
  setimageFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 800;
      canvas.height = 600;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      onCanvasRef(canvas);
    }
  }, [onCanvasRef]);

  // Load image onto canvas
  const loadImageToCanvas = useCallback(
    (file: File) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        onError('Please select a valid image file (JPG, PNG, WebP)');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        onError('Image file must be smaller than 10MB');
        return;
      }

      const ctx = canvas.getContext('2d');
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        if (!ctx) return;

        // Calculate aspect ratio and fit image to canvas
        const canvasAspect = canvas.width / canvas.height;
        const imageAspect = img.width / img.height;

        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (imageAspect > canvasAspect) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / imageAspect;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawHeight = canvas.height;
          drawWidth = canvas.height * imageAspect;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        URL.revokeObjectURL(objectUrl);
        setHasImage(true);
        setimageFile(file); // Update imageFile state
        onImageLoad();
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        onError('Failed to load image. Please try a different file.');
      };

      img.src = objectUrl;
    },
    [onImageLoad, onError, setimageFile]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) {
        loadImageToCanvas(files[0]);
      }
    },
    [loadImageToCanvas]
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [handleFileSelect]
  );

  // Click to upload
  const handleCanvasClick = useCallback(() => {
    if (!hasImage && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [hasImage]);

  return (
    <div className="relative">
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${isDragging
          ? 'border-purple-400 bg-purple-500/10'
          : hasImage
            ? 'border-white/20'
            : 'border-white/30 hover:border-white/50'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
      >
        <canvas
          ref={canvasRef}
          className={`w-full h-auto bg-gray-100 rounded-xl ${!hasImage ? 'cursor-pointer' : ''}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />

        {!hasImage && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                {isDragging ? (
                  <Upload className="w-8 h-8 text-purple-400" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {isDragging ? 'Drop your image here' : 'Upload an image to get started'}
              </h3>
              <p className="text-sm text-gray-400">
                {isDragging ? 'Release to upload' : 'Drag & drop or click to select'}
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

export default CanvasEditor;
