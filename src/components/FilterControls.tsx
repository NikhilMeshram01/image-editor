
// import { Droplet, Palette, RotateCcw, Sliders, Sun, Wand2, Zap } from 'lucide-react';
// import React, { useCallback, useEffect, useState } from 'react';

// interface FilterControlsProps {
//   canvas: HTMLCanvasElement | null;
//   enabled: boolean;
//   onProcessing: (processing: boolean) => void;
//   onError: (message: string) => void;
// }

// declare global {
//   interface Window {
//     cv: any;
//     opencvReady: boolean;
//   }
// }

// type FilterType = 'gaussian' | 'sobel' | 'sepia' | 'grayscale' | 'brightness' | 'contrast' | 'sharpen' | 'invert';

// const FilterControls: React.FC<FilterControlsProps> = ({
//   canvas,
//   enabled,
//   onProcessing,
//   onError,
// }) => {
//   // console.log('FilterControls.tsx')

//   const [filterType, setFilterType] = useState<FilterType>('gaussian');
//   const [intensity, setIntensity] = useState(5);
//   const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
//   const [opencvReady, setOpencvReady] = useState(false);

//   // Check OpenCV.js availability
//   useEffect(() => {
//     const checkOpenCV = () => {
//       if (window.opencvReady && window.cv && window.cv.Mat) {
//         setOpencvReady(true);
//       } else {
//         setTimeout(checkOpenCV, 100);
//       }
//     };
//     checkOpenCV();
//   }, []);

//   // // Store original image data when canvas changes
//   // useEffect(() => {
//   //   if (canvas && enabled) {
//   //     const ctx = canvas.getContext('2d');
//   //     if (ctx) {
//   //       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//   //       setOriginalImageData(imageData);
//   //     }
//   //   }
//   // }, [canvas, enabled]);

//   useEffect(() => {
//     // Only store original image data, don't auto-apply filters
//     if (canvas && enabled) {
//       const ctx = canvas.getContext('2d');
//       if (ctx) {
//         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//         setOriginalImageData(imageData);
//       }
//     }
//   }, [canvas, enabled]); // Remove other dependencies that cause loops

//   // Apply filter using OpenCV.js or Canvas2D
//   const applyFilter = useCallback(async () => {
//     if (!canvas || !originalImageData) {
//       if (!canvas) onError('No canvas available');
//       if (!originalImageData) onError('No image data available');
//       return;
//     }

//     try {
//       onProcessing(true);

//       const ctx = canvas.getContext('2d');
//       if (!ctx) {
//         onError('Failed to get canvas context');
//         return;
//       }

//       // Restore original image first
//       ctx.putImageData(originalImageData, 0, 0);

//       await new Promise(resolve => requestAnimationFrame(resolve));

//       // Use OpenCV for complex filters
//       if (opencvReady && (filterType === 'gaussian' || filterType === 'sobel' || filterType === 'sharpen')) {
//         await applyOpenCVFilter(ctx);
//       } else {
//         // Use Canvas2D for simpler filters
//         await applyCanvasFilter(ctx);
//       }

//     } catch (error) {
//       onError(`Filter processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     } finally {
//       onProcessing(false);
//     }
//   }, [canvas, originalImageData, filterType, intensity, opencvReady, onProcessing, onError]);

//   // OpenCV-based filters
//   const applyOpenCVFilter = useCallback(async (ctx: CanvasRenderingContext2D) => {
//     if (!canvas || !window.cv) return;

//     let src, dst;
//     try {
//       src = window.cv.imread(canvas);
//       dst = new window.cv.Mat();

//       switch (filterType) {
//         case 'gaussian':
//           const kernelSize = Math.max(1, intensity * 2 + 1);
//           const ksize = new window.cv.Size(kernelSize, kernelSize);
//           window.cv.GaussianBlur(src, dst, ksize, intensity, intensity, window.cv.BORDER_DEFAULT);
//           break;

//         case 'sobel':
//           const gray = new window.cv.Mat();
//           const sobelX = new window.cv.Mat();
//           const sobelY = new window.cv.Mat();

//           window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
//           const scale = intensity / 5;
//           window.cv.Sobel(gray, sobelX, window.cv.CV_64F, 1, 0, 3, scale);
//           window.cv.Sobel(gray, sobelY, window.cv.CV_64F, 0, 1, 3, scale);
//           window.cv.magnitude(sobelX, sobelY, gray);
//           window.cv.cvtColor(gray, dst, window.cv.COLOR_GRAY2RGBA);

//           gray.delete();
//           sobelX.delete();
//           sobelY.delete();
//           break;

//         case 'sharpen':
//           // Sharpening kernel
//           const kernel = new window.cv.Mat(3, 3, window.cv.CV_32F);
//           const data = new Float32Array([
//             -intensity / 10, -intensity / 10, -intensity / 10,
//             -intensity / 10, 1 + intensity / 2.5, -intensity / 10,
//             -intensity / 10, -intensity / 10, -intensity / 10
//           ]);
//           kernel.data32F.set(data);
//           window.cv.filter2D(src, dst, -1, kernel);
//           kernel.delete();
//           break;
//       }

//       window.cv.imshow(canvas, dst);
//     } finally {
//       if (src) src.delete();
//       if (dst) dst.delete();
//     }
//   }, [canvas, filterType, intensity]);

//   // Canvas2D-based filters
//   const applyCanvasFilter = useCallback((ctx: CanvasRenderingContext2D) => {
//     if (!canvas) return;

//     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//     const data = imageData.data;

//     switch (filterType) {
//       case 'sepia':
//         for (let i = 0; i < data.length; i += 4) {
//           const r = data[i];
//           const g = data[i + 1];
//           const b = data[i + 2];

//           data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
//           data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
//           data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
//         }
//         break;

//       case 'grayscale':
//         for (let i = 0; i < data.length; i += 4) {
//           const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
//           data[i] = gray;
//           data[i + 1] = gray;
//           data[i + 2] = gray;
//         }
//         break;

//       case 'brightness':
//         const brightness = (intensity - 5) * 10;
//         for (let i = 0; i < data.length; i += 4) {
//           data[i] = Math.max(0, Math.min(255, data[i] + brightness));
//           data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
//           data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
//         }
//         break;

//       case 'contrast':
//         const contrast = (intensity / 5) ** 2;
//         for (let i = 0; i < data.length; i += 4) {
//           data[i] = Math.max(0, Math.min(255, ((data[i] - 128) * contrast) + 128));
//           data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - 128) * contrast) + 128));
//           data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - 128) * contrast) + 128));
//         }
//         break;

//       case 'invert':
//         for (let i = 0; i < data.length; i += 4) {
//           data[i] = 255 - data[i];
//           data[i + 1] = 255 - data[i + 1];
//           data[i + 2] = 255 - data[i + 2];
//         }
//         break;
//     }

//     ctx.putImageData(imageData, 0, 0);
//   }, [canvas, intensity]);

//   // // Apply filter when parameters change
//   // useEffect(() => {
//   //   if (enabled && originalImageData) {
//   //     const timeoutId = setTimeout(applyFilter, 100);
//   //     return () => clearTimeout(timeoutId);
//   //   }
//   // }, [intensity, filterType, applyFilter, enabled, originalImageData]);

//   // Reset to original image
//   const resetFilter = useCallback(() => {
//     if (canvas && originalImageData) {
//       const ctx = canvas.getContext('2d');
//       if (ctx) {
//         ctx.putImageData(originalImageData, 0, 0);
//       }
//     }
//   }, [canvas, originalImageData]);

//   const getFilterIcon = (type: FilterType) => {
//     switch (type) {
//       case 'gaussian': return <Zap className="w-4 h-4" />;
//       case 'sobel': return <Zap className="w-4 h-4" />;
//       case 'sepia': return <Palette className="w-4 h-4" />;
//       case 'grayscale': return <Droplet className="w-4 h-4" />;
//       case 'brightness': return <Sun className="w-4 h-4" />;
//       case 'contrast': return <Sliders className="w-4 h-4" />;
//       case 'sharpen': return <Zap className="w-4 h-4" />;
//       case 'invert': return <RotateCcw className="w-4 h-4" />;
//       default: return <Sliders className="w-4 h-4" />;
//     }
//   };

//   const filterOptions: { type: FilterType; label: string; requiresOpenCV: boolean }[] = [
//     { type: 'gaussian', label: 'Gaussian Blur', requiresOpenCV: true },
//     { type: 'sobel', label: 'Sobel Edge', requiresOpenCV: true },
//     { type: 'sharpen', label: 'Sharpen', requiresOpenCV: true },
//     { type: 'sepia', label: 'Sepia', requiresOpenCV: false },
//     { type: 'grayscale', label: 'Grayscale', requiresOpenCV: false },
//     { type: 'brightness', label: 'Brightness', requiresOpenCV: false },
//     { type: 'contrast', label: 'Contrast', requiresOpenCV: false },
//     { type: 'invert', label: 'Invert', requiresOpenCV: false },
//   ];

//   return (
//     <div className="space-y-4">
//       {/* Filter Type Selection */}
//       <div>
//         <label className="block text-sm font-medium text-gray-300 mb-2">
//           Filter Type
//         </label>
//         <div className="grid grid-cols-2 gap-2">
//           {filterOptions.map((option) => (
//             <button
//               key={option.type}
//               onClick={() => setFilterType(option.type)}
//               disabled={!enabled || (option.requiresOpenCV && !opencvReady)}
//               className={`flex items-center space-x-2 p-2 rounded-lg border text-xs font-medium transition-all ${filterType === option.type
//                 ? 'bg-blue-500/20 border-blue-400 text-blue-300'
//                 : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/30'
//                 } disabled:opacity-50 disabled:cursor-not-allowed`}
//               title={option.requiresOpenCV && !opencvReady ? 'OpenCV.js required' : ''}
//             >
//               {getFilterIcon(option.type)}
//               <span>{option.label}</span>
//             </button>
//           ))}
//         </div>
//       </div>



//       {/* Intensity Slider */}
//       <div>
//         <label className="block text-sm font-medium text-gray-300 mb-2">
//           <Sliders className="inline w-4 h-4 mr-2" />
//           Intensity: {intensity}
//         </label>
//         <input
//           type="range"
//           min="1"
//           max="10"
//           value={intensity}
//           onChange={(e) => setIntensity(Number(e.target.value))}
//           disabled={!enabled}
//           className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
//         />
//         <div className="flex justify-between text-xs text-gray-500 mt-1">
//           <span>Light</span>
//           <span>Heavy</span>
//         </div>
//       </div>

//       {/* // Add this button to FilterControls.tsx */}
//       <button
//         onClick={applyFilter}
//         disabled={!enabled || !originalImageData}
//         className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-all disabled:cursor-not-allowed"
//       >
//         <Wand2 className="w-4 h-4" />
//         <span>Apply Filter</span>
//       </button>

//       {/* Reset Button */}
//       <button
//         onClick={resetFilter}
//         disabled={!enabled || !originalImageData}
//         className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 disabled:bg-gray-700/30 text-white rounded-lg transition-all disabled:cursor-not-allowed"
//       >
//         <RotateCcw className="w-4 h-4" />
//         <span>Reset Filter</span>
//       </button>

//       {/* OpenCV Status */}
//       {!opencvReady && (
//         <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
//           <p className="text-xs text-yellow-400">
//             Some filters require OpenCV.js. Loading...
//           </p>
//         </div>
//       )}

//       <style jsx>{`
//         .slider::-webkit-slider-thumb {
//           appearance: none;
//           height: 20px;
//           width: 20px;
//           background: #3b82f6;
//           border-radius: 50%;
//           cursor: pointer;
//         }

//         .slider::-moz-range-thumb {
//           height: 20px;
//           width: 20px;
//           background: #3b82f6;
//           border-radius: 50%;
//           cursor: pointer;
//           border: none;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default FilterControls;


// ---------------------------------------------------------------------------------

import { Droplet, Palette, RotateCcw, Sliders, Sun, Wand2, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useState, useRef } from 'react';

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

type FilterType = 'gaussian' | 'sobel' | 'sepia' | 'grayscale' | 'brightness' | 'contrast' | 'sharpen' | 'invert';

const FilterControls: React.FC<FilterControlsProps> = ({
  canvas,
  enabled,
  onProcessing,
  onError,
}) => {
  const [filterType, setFilterType] = useState<FilterType>('gaussian');
  const [intensity, setIntensity] = useState(5);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [opencvReady, setOpencvReady] = useState(false);
  const isProcessingRef = useRef(false);

  // Check OpenCV.js availability
  useEffect(() => {
    const checkOpenCV = () => {
      if (window.opencvReady && window.cv && window.cv.Mat) {
        setOpencvReady(true);
        console.log('OpenCV.js is ready');
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
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          setOriginalImageData(imageData);
        } catch (error) {
          console.error('Error getting image data:', error);
        }
      }
    }
  }, [canvas, enabled]);

  // OpenCV-based filters
  const applyOpenCVFilter = useCallback(async () => {
    if (!canvas || !window.cv) {
      onError('OpenCV.js not available');
      return false;
    }

    let src, dst;
    try {
      // Read the CURRENT canvas content (don't restore original first)
      src = window.cv.imread(canvas);
      dst = new window.cv.Mat();

      switch (filterType) {
        case 'gaussian':
          const kernelSize = Math.max(1, intensity * 2 + 1);
          const ksize = new window.cv.Size(kernelSize, kernelSize);
          window.cv.GaussianBlur(src, dst, ksize, intensity, intensity, window.cv.BORDER_DEFAULT);
          break;

        case 'sobel':
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
          break;

        case 'sharpen':
          const kernel = new window.cv.Mat(3, 3, window.cv.CV_32F);
          const data = new Float32Array([
            -intensity / 10, -intensity / 10, -intensity / 10,
            -intensity / 10, 1 + intensity / 2.5, -intensity / 10,
            -intensity / 10, -intensity / 10, -intensity / 10
          ]);
          kernel.data32F.set(data);
          window.cv.filter2D(src, dst, -1, kernel);
          kernel.delete();
          break;

        default:
          return false;
      }

      // Display the result
      window.cv.imshow(canvas, dst);
      return true;
    } catch (error) {
      console.error('OpenCV filter error:', error);
      onError(`OpenCV filter failed: ${error}`);
      return false;
    } finally {
      if (src) src.delete();
      if (dst) dst.delete();
    }
  }, [canvas, filterType, intensity, onError]);

  // Canvas2D-based filters
  const applyCanvasFilter = useCallback(() => {
    if (!canvas || !originalImageData) return false;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    try {
      // Restore original image first for Canvas2D filters
      ctx.putImageData(originalImageData, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      switch (filterType) {
        case 'sepia':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
          }
          break;

        case 'grayscale':
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
          break;

        case 'brightness':
          const brightness = (intensity - 5) * 10;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, data[i] + brightness));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
          }
          break;

        case 'contrast':
          const contrast = (intensity / 5) ** 2;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, ((data[i] - 128) * contrast) + 128));
            data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - 128) * contrast) + 128));
            data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - 128) * contrast) + 128));
          }
          break;

        case 'invert':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
          break;

        default:
          return false;
      }

      ctx.putImageData(imageData, 0, 0);
      return true;
    } catch (error) {
      console.error('Canvas filter error:', error);
      onError(`Canvas filter failed: ${error}`);
      return false;
    }
  }, [canvas, originalImageData, filterType, intensity, onError]);

  // Apply filter using OpenCV.js or Canvas2D
  const applyFilter = useCallback(async () => {
    if (!canvas || !originalImageData || isProcessingRef.current) {
      if (!canvas) onError('No canvas available');
      if (!originalImageData) onError('No image data available');
      return;
    }

    try {
      isProcessingRef.current = true;
      onProcessing(true);

      await new Promise(resolve => requestAnimationFrame(resolve));

      let success = false;

      // Use OpenCV for complex filters
      if (opencvReady && (filterType === 'gaussian' || filterType === 'sobel' || filterType === 'sharpen')) {
        console.log('Applying OpenCV filter:', filterType);
        success = await applyOpenCVFilter();
      } else {
        // Use Canvas2D for simpler filters
        console.log('Applying Canvas2D filter:', filterType);
        success = applyCanvasFilter();
      }

      if (!success) {
        onError(`Failed to apply ${filterType} filter`);
      }

    } catch (error) {
      console.error('Filter processing failed:', error);
      onError(`Filter processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      onProcessing(false);
      isProcessingRef.current = false;
    }
  }, [canvas, originalImageData, filterType, opencvReady, applyOpenCVFilter, applyCanvasFilter, onProcessing, onError]);

  // Reset to original image
  const resetFilter = useCallback(() => {
    if (canvas && originalImageData) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(originalImageData, 0, 0);
      }
    }
  }, [canvas, originalImageData]);

  const getFilterIcon = (type: FilterType) => {
    switch (type) {
      case 'gaussian': return <Zap className="w-4 h-4" />;
      case 'sobel': return <Zap className="w-4 h-4" />;
      case 'sepia': return <Palette className="w-4 h-4" />;
      case 'grayscale': return <Droplet className="w-4 h-4" />;
      case 'brightness': return <Sun className="w-4 h-4" />;
      case 'contrast': return <Sliders className="w-4 h-4" />;
      case 'sharpen': return <Zap className="w-4 h-4" />;
      case 'invert': return <RotateCcw className="w-4 h-4" />;
      default: return <Sliders className="w-4 h-4" />;
    }
  };

  const filterOptions: { type: FilterType; label: string; requiresOpenCV: boolean }[] = [
    { type: 'gaussian', label: 'Gaussian Blur', requiresOpenCV: true },
    { type: 'sobel', label: 'Sobel Edge', requiresOpenCV: true },
    { type: 'sharpen', label: 'Sharpen', requiresOpenCV: true },
    { type: 'sepia', label: 'Sepia', requiresOpenCV: false },
    { type: 'grayscale', label: 'Grayscale', requiresOpenCV: false },
    { type: 'brightness', label: 'Brightness', requiresOpenCV: false },
    { type: 'contrast', label: 'Contrast', requiresOpenCV: false },
    { type: 'invert', label: 'Invert', requiresOpenCV: false },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Filter Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => setFilterType(option.type)}
              disabled={!enabled || (option.requiresOpenCV && !opencvReady)}
              className={`flex items-center space-x-2 p-2 rounded-lg border text-xs font-medium transition-all ${filterType === option.type
                ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={option.requiresOpenCV && !opencvReady ? 'OpenCV.js required' : ''}
            >
              {getFilterIcon(option.type)}
              <span>{option.label}</span>
            </button>
          ))}
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

      {/* Apply Filter Button */}
      <button
        onClick={applyFilter}
        disabled={!enabled || !originalImageData}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-all disabled:cursor-not-allowed"
      >
        <Wand2 className="w-4 h-4" />
        <span>Apply Filter</span>
      </button>

      {/* Reset Button */}
      <button
        onClick={resetFilter}
        disabled={!enabled || !originalImageData}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 disabled:bg-gray-700/30 text-white rounded-lg transition-all disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset Filter</span>
      </button>

      {/* OpenCV Status */}
      {!opencvReady && (
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">
            Some filters require OpenCV.js. Loading...
          </p>
        </div>
      )}

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