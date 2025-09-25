import React, { useState, useCallback, useEffect } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';

interface FilterControlsProps {
  canvas: HTMLCanvasElement | null;
  enabled: boolean;
  onProcessing: (processing: boolean) => void;
  onError: (message: string) => void;
}

declare global {
  interface Window {
    cv: any;
    opencvReady: boolean;
  }
}

const FilterControls: React.FC<FilterControlsProps> = ({
  canvas,
  enabled,
  onProcessing,
  onError,
}) => {
  const [filterType, setFilterType] = useState<'gaussian' | 'sobel'>('gaussian');
  const [intensity, setIntensity] = useState(5);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [opencvReady, setOpencvReady] = useState(false);

  // Check OpenCV.js availability
  useEffect(() => {
    const checkOpenCV = () => {
      if (window.opencvReady && window.cv && window.cv.Mat) {
        setOpencvReady(true);
      } else {
        setTimeout(checkOpenCV, 100);
      }
    };
    checkOpenCV();
  }, []);

  // Store original image data when canvas changes
  useEffect(() => {
    if (canvas && enabled) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setOriginalImageData(imageData);
      }
    }
  }, [canvas, enabled]);

  // Apply filter using OpenCV.js
  const applyFilter = useCallback(async () => {
    if (!canvas || !originalImageData || !opencvReady) {
      if (!opencvReady) onError('OpenCV.js not loaded');
      if (!canvas) onError('No canvas available');
      if (!originalImageData) onError('No image data available');
      return;
    }

    try {
      onProcessing(true);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onError('Failed to get canvas context');
        return;
      }

      // Restore original image
      ctx.putImageData(originalImageData, 0, 0);

      // Use requestAnimationFrame for smooth updates
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Create OpenCV Mat from canvas
      let src, dst;
      try {
        src = window.cv.imread(canvas);
      } catch (error) {
        onError('Failed to read image data for processing');
        return;
      }

      dst = new window.cv.Mat();

      if (filterType === 'gaussian') {
        const kernelSize = Math.max(1, intensity * 2 + 1); // Ensure odd number
        const ksize = new window.cv.Size(kernelSize, kernelSize);
        const sigmaX = intensity;
        const sigmaY = intensity;
        window.cv.GaussianBlur(src, dst, ksize, sigmaX, sigmaY, window.cv.BORDER_DEFAULT);
      } else if (filterType === 'sobel') {
        const gray = new window.cv.Mat();
        const sobelX = new window.cv.Mat();
        const sobelY = new window.cv.Mat();

        window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
        const scale = intensity / 5;
        window.cv.Sobel(gray, sobelX, window.cv.CV_64F, 1, 0, 3, scale);
        window.cv.Sobel(gray, sobelY, window.cv.CV_64F, 0, 1, 3, scale);
        window.cv.magnitude(sobelX, sobelY, gray);
        window.cv.cvtColor(gray, dst, window.cv.COLOR_GRAY2RGBA);

        gray.delete();
        sobelX.delete();
        sobelY.delete();
      }

      window.cv.imshow(canvas, dst);

      if (src) src.delete();
      if (dst) dst.delete();
    } catch (error) {
      onError(`Filter processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      onProcessing(false);
    }
  }, [canvas, originalImageData, filterType, intensity, opencvReady, onProcessing, onError]);

  // Apply filter when intensity or filter type changes
  useEffect(() => {
    if (enabled && originalImageData && opencvReady) {
      const timeoutId = setTimeout(applyFilter, 100); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [intensity, filterType, applyFilter, enabled, originalImageData, opencvReady]);

  // Reset to original image
  const resetFilter = useCallback(() => {
    if (canvas && originalImageData) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(originalImageData, 0, 0);
      }
    }
  }, [canvas, originalImageData]);

  // if (!opencvReady) {
  //   return (
  //     <div className="text-center py-4">
  //       <div className="inline-flex items-center space-x-2 text-yellow-400">
  //         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
  //         <span className="text-sm">Loading OpenCV.js...</span>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-4">
      {/* Filter Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Filter Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setFilterType('gaussian')}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${filterType === 'gaussian'
              ? 'bg-blue-500/20 border-blue-400 text-blue-300'
              : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/30'
              }`}
            disabled={!enabled}
          >
            Gaussian Blur
          </button>
          <button
            onClick={() => setFilterType('sobel')}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${filterType === 'sobel'
              ? 'bg-blue-500/20 border-blue-400 text-blue-300'
              : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/30'
              }`}
            disabled={!enabled}
          >
            Sobel Edge
          </button>
        </div>
      </div>

      {/* Intensity Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <Sliders className="inline w-4 h-4 mr-2" />
          Intensity: {intensity}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          disabled={!enabled}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Light</span>
          <span>Heavy</span>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetFilter}
        disabled={!enabled || !originalImageData}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 disabled:bg-gray-700/30 text-white rounded-lg transition-all disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset Filter</span>
      </button>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default FilterControls;
