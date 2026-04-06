import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Move, Maximize, Trash2, Image as ImageIcon, Check, LayoutGrid, RefreshCcw, ZoomIn, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface Position {
  x: number;
  y: number;
}

export default function ImageEditor() {
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoPos, setLogoPos] = useState<Position>({ x: 20, y: 20 });
  const [logoScale, setLogoScale] = useState(0.2);
  const [logoOpacity, setLogoOpacity] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  // Main Image Transform State
  const [mainZoom, setMainZoom] = useState(1);
  const [mainPan, setMainPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);
  const logoImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setMainImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!logoImage) return;
    e.stopPropagation();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - logoPos.x, y: clientY - logoPos.y });
  };

  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!mainImage || isDragging) return;
    setIsPanning(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPanStart({ x: clientX - mainPan.x, y: clientY - mainPan.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (isDragging) {
      setLogoPos({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
      });
    } else if (isPanning) {
      setMainPan({
        x: clientX - panStart.x,
        y: clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const downloadImage = () => {
    if (!mainImgRef.current || !logoImgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mainImg = mainImgRef.current;
    const logoImg = logoImgRef.current;

    // We want the output to be the size of the original image, but cropped/zoomed
    // However, to keep it simple and predictable, we'll use the natural dimensions of the main image
    // as the base, and apply the relative zoom/pan.
    canvas.width = mainImg.naturalWidth;
    canvas.height = mainImg.naturalHeight;

    // Calculate relative scales
    const displayWidth = mainImg.clientWidth;
    const displayHeight = mainImg.clientHeight;
    const scaleX = mainImg.naturalWidth / displayWidth;
    const scaleY = mainImg.naturalHeight / displayHeight;

    // Clear canvas and fill with white (for JPG)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw main image with zoom and pan
    // We translate and scale the context to match the preview
    ctx.save();
    
    // The pan and zoom are relative to the display size
    // We need to convert them to natural size
    const naturalPanX = mainPan.x * scaleX;
    const naturalPanY = mainPan.y * scaleY;
    
    // Apply transform (Translate then Scale around center)
    ctx.translate(naturalPanX, naturalPanY);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(mainZoom, mainZoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    ctx.drawImage(mainImg, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw logo
    if (logoImg) {
      // The logo width in the preview is a percentage of the container width
      const logoWidth = canvas.width * logoScale;
      const logoHeight = logoWidth * (logoImg.naturalHeight / logoImg.naturalWidth);
      
      const logoX = logoPos.x * scaleX;
      const logoY = logoPos.y * scaleY;

      ctx.globalAlpha = logoOpacity;
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
      ctx.globalAlpha = 1.0;
    }

    // Download
    const link = document.createElement('a');
    link.download = 'branded-image.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#18181b', '#27272a', '#3f3f46']
    });
  };

  const applySmartPlacement = () => {
    if (!mainImgRef.current || !logoImgRef.current) return;
    
    const mainWidth = mainImgRef.current.clientWidth;
    const mainHeight = mainImgRef.current.clientHeight;
    const logoWidth = mainWidth * logoScale;
    const logoHeight = (logoImgRef.current.naturalHeight / logoImgRef.current.naturalWidth) * logoWidth;

    // Place in bottom right with 5% padding
    setLogoPos({
      x: mainWidth - logoWidth - (mainWidth * 0.05),
      y: mainHeight - logoHeight - (mainHeight * 0.05)
    });
  };

  const resetLogoTransform = () => {
    setLogoPos({ x: 20, y: 20 });
    setLogoScale(0.2);
  };

  const resetImageTransform = () => {
    setMainZoom(1);
    setMainPan({ x: 0, y: 0 });
  };

  const reset = () => {
    setMainImage(null);
    setLogoImage(null);
    resetLogoTransform();
    resetImageTransform();
    setLogoOpacity(1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Logo Overlay Pro</h1>
          <p className="text-zinc-500">Brand your images in seconds. Mobile-first, professional results.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Assets</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Main Image</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleMainImageUpload}
                      className="hidden" 
                      id="main-upload"
                    />
                    <label 
                      htmlFor="main-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        mainImage ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-300 hover:border-zinc-400 bg-white'
                      }`}
                    >
                      {mainImage ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check size={20} />
                          <span className="text-sm font-medium">Image Loaded</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="text-zinc-400 mb-2" size={24} />
                          <span className="text-sm text-zinc-500">Upload Photo</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Logo (PNG)</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/png" 
                      onChange={handleLogoUpload}
                      className="hidden" 
                      id="logo-upload"
                    />
                    <label 
                      htmlFor="logo-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        logoImage ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-300 hover:border-zinc-400 bg-white'
                      }`}
                    >
                      {logoImage ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check size={20} />
                          <span className="text-sm font-medium">Logo Loaded</span>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="text-zinc-400 mb-2" size={24} />
                          <span className="text-sm text-zinc-500">Upload PNG Logo</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {mainImage && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-6"
              >
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Image Controls</h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-zinc-700">Zoom</label>
                      <span className="text-xs text-zinc-400">{Math.round(mainZoom * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.01" 
                      value={mainZoom}
                      onChange={(e) => setMainZoom(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                    />
                  </div>

                  <button 
                    onClick={resetImageTransform}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl transition-colors text-xs font-medium"
                  >
                    <RotateCcw size={14} />
                    Reset Image View
                  </button>
                </div>
              </motion.section>
            )}

            {logoImage && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-6"
              >
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Adjustments</h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-zinc-700">Scale</label>
                      <span className="text-xs text-zinc-400">{Math.round(logoScale * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.05" 
                      max="1" 
                      step="0.01" 
                      value={logoScale}
                      onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-zinc-700">Opacity</label>
                      <span className="text-xs text-zinc-400">{Math.round(logoOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={logoOpacity}
                      onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={applySmartPlacement}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl transition-colors text-xs font-medium"
                    >
                      <LayoutGrid size={14} />
                      Smart Placement
                    </button>
                    <button 
                      onClick={resetLogoTransform}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl transition-colors text-xs font-medium"
                    >
                      <RefreshCcw size={14} />
                      Reset Transform
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <button 
                    onClick={reset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    Reset
                  </button>
                  <button 
                    onClick={downloadImage}
                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors text-sm font-medium shadow-lg shadow-zinc-200"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </motion.section>
            )}
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200 overflow-hidden min-h-[400px] flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-200" />
                  <div className="w-3 h-3 rounded-full bg-zinc-200" />
                  <div className="w-3 h-3 rounded-full bg-zinc-200" />
                </div>
                <span className="text-xs font-medium text-zinc-400">Preview Canvas</span>
                <div className="w-10" />
              </div>

              <div className="flex-1 relative bg-zinc-100 flex items-center justify-center p-4 md:p-8 overflow-hidden">
                {!mainImage ? (
                  <div className="text-center space-y-4 max-w-xs">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-zinc-300">
                      <ImageIcon size={32} />
                    </div>
                    <p className="text-zinc-400 text-sm">Upload a main image to start branding your content.</p>
                  </div>
                ) : (
                  <div 
                    ref={containerRef}
                    className="relative inline-block max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden select-none touch-none bg-white"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    onMouseDown={handlePanStart}
                    onTouchStart={handlePanStart}
                  >
                    <div
                      style={{
                        transform: `translate(${mainPan.x}px, ${mainPan.y}px) scale(${mainZoom})`,
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                        cursor: mainZoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
                      }}
                    >
                      <img 
                        ref={mainImgRef}
                        src={mainImage} 
                        alt="Main" 
                        className="max-w-full max-h-[70vh] object-contain block"
                        draggable={false}
                      />
                    </div>
                    
                    {logoImage && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${logoPos.x}px`,
                          top: `${logoPos.y}px`,
                          width: `${logoScale * 100}%`,
                          opacity: logoOpacity,
                          cursor: isDragging ? 'grabbing' : 'grab',
                          zIndex: 10
                        }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleMouseDown}
                      >
                        <img 
                          ref={logoImgRef}
                          src={logoImage} 
                          alt="Logo" 
                          className="w-full h-auto block"
                          draggable={false}
                        />
                        {/* Visual indicator for dragging */}
                        <div className="absolute inset-0 border-2 border-zinc-900/20 rounded-sm opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Move className="text-zinc-900/40" size={24} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {mainImage && (
              <div className="mt-4 flex flex-col items-center gap-2 text-xs text-zinc-400 justify-center">
                {mainZoom > 1 && (
                  <div className="flex items-center gap-2">
                    <Move size={12} />
                    <span>Drag the image to pan/crop</span>
                  </div>
                )}
                {logoImage && (
                  <div className="flex items-center gap-2">
                    <Move size={12} className="text-zinc-900" />
                    <span className="text-zinc-500">Drag the logo to reposition it</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Canvas for Export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
