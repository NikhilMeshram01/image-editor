import React, { useEffect, useState } from 'react';
import { Palette, Wand2, Bot, Upload, Loader2 } from 'lucide-react';
import CanvasEditor from './components/CanvasEditor';
import FilterControls from './components/FilterControls';
import AIBackgroundRemoval from './components/AIBackgroundRemoval';
import CommandInput from './components/CommandInput';
import { ToastProvider, useToast } from './components/Toast';
import { initializeModel } from './utils/process';

function AppContent() {

  const [imageFile, setimageFile] = useState(null)
  console.log('imageFile', imageFile)
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  const handleImageLoad = () => {
    setImageLoaded(true);
    showToast('Image loaded successfully!', 'success');
  };

  const handleError = (message: string) => {
    showToast(message, 'error');
    setIsProcessing(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const initialized = await initializeModel();
        if (!initialized) {
          throw new Error("Failed to initialize background removal model");
        }
      } catch (err) {
        console.error(err);
      }
      setIsProcessing(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Image Editor</h1>
              <p className="text-sm text-gray-300">WASM Filters • AI Background Removal • Natural Language Commands</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Canvas Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <CanvasEditor
                onCanvasRef={setCanvasRef}
                onImageLoad={handleImageLoad}
                onError={handleError}
                setimageFile={setimageFile}
              />
            </div>
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl">
                <div className="text-center">
                  <Loader2 className="w-20 h-20 text-purple-400 animate-spin mx-auto mb-2" />
                  <p className="text-white text-md">Processing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Upload className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Upload Image</h2>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Drag & drop an image or click to select
              </p>
              <div className="text-xs text-gray-400">
                Supported: JPG, PNG, WebP up to 10MB
              </div>
            </div>

            {/* WASM Filters */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Wand2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">WASM Filters</h2>
              </div>
              <FilterControls
                canvas={canvasRef}
                enabled={imageLoaded && !isProcessing}
                onProcessing={setIsProcessing}
                onError={handleError}
              />
            </div>

            {/* AI Background Removal */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Bot className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">AI Enhancement</h2>
              </div>
              <AIBackgroundRemoval
                canvas={canvasRef}
                enabled={imageLoaded && !isProcessing}
                onProcessing={setIsProcessing}
                onError={handleError}
                imageFile={imageFile}
              />
            </div>

            {/* Natural Language Commands */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <CommandInput
                canvas={canvasRef}
                enabled={imageLoaded && !isProcessing}
                onProcessing={setIsProcessing}
                onError={handleError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;