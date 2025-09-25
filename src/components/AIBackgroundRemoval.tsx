import React, { useState, useCallback, useEffect } from 'react';
import { Scissors, Loader2 } from 'lucide-react';
import { processImage, initializeModel } from '../utils/process';

interface AIBackgroundRemovalProps {
  canvas: HTMLCanvasElement | null;
  enabled: boolean;
  onProcessing: (processing: boolean) => void;
  onError: (message: string) => void;
  imageFile: File | null;
}

const AIBackgroundRemoval: React.FC<AIBackgroundRemovalProps> = ({
  canvas,
  enabled,
  onProcessing,
  onError,
  imageFile,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Check if model is initialized (since App.tsx calls initializeModel)
  useEffect(() => {
    // Since initializeModel is called in App.tsx, we just need to verify it's ready
    // This could be improved by checking the model state directly if exposed
    setIsModelLoaded(true); // Assume model is loaded by App.tsx
  }, []);

  const removeBackground = useCallback(async () => {
    if (!imageFile) {
      onError('No image file provided');
      return;
    }
    if (!canvas) {
      onError('Canvas not available');
      return;
    }
    if (!isModelLoaded) {
      onError('Model not loaded');
      return;
    }

    try {
      setIsLoading(true);
      onProcessing(true);

      // Process the image
      const result = await processImage(imageFile);
      if (!result) {
        throw new Error('No result returned from processImage');
      }

      const { processedFile } = result;

      // Load processed image into canvas
      const img = new Image();
      img.src = URL.createObjectURL(processedFile);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load processed image'));
      });

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src); // Clean up
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onError(`Background removal failed: ${message}`);
    } finally {
      setIsLoading(false);
      onProcessing(false);
    }
  }, [canvas, imageFile, isModelLoaded, onProcessing, onError]);

  return (
    <div className="space-y-4">
      <button
        onClick={removeBackground}
        disabled={!enabled || isLoading || !isModelLoaded || !imageFile}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Scissors className="w-5 h-5" />
        )}
        <span>{isLoading ? 'Removing Background...' : 'Remove Background'}</span>
      </button>

      <div className="text-xs text-gray-400 space-y-1">
        <p>• Uses AI (RMBG-1.4) client-side for automatic background removal</p>
        <p>• Works best with clear subject separation</p>
        <p>• Processing may take 10-30 seconds for first load</p>
      </div>

      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-400">
          <strong>Tip:</strong> No API key needed. Runs in browser with WebAssembly.
          Enable WebGPU for faster processing in production.
        </p>
      </div>
    </div>
  );
};

export default AIBackgroundRemoval;
