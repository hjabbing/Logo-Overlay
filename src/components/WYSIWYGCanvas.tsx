import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Move,
  RotateCw,
  Trash2,
  Maximize2,
  Grid3X3,
  Sparkles,
  Upload,
  Layers,
  ZoomIn,
} from 'lucide-react';
import {
  LogoTransform,
  PhotoTransform,
  AspectRatioType,
  ASPECT_RATIOS,
  calculateCoverMetrics,
  calculateLogoMetrics,
  getShadowFilter,
} from '../utils/imageMath';

interface WYSIWYGCanvasProps {
  mainImage: string | null;
  logoImage: string | null;
  mainImgDimensions: { width: number; height: number };
  logoDimensions: { width: number; height: number };
  aspectRatio: AspectRatioType;
  photoTransform: PhotoTransform;
  logoTransform: LogoTransform;
  onUpdatePhotoTransform: (update: Partial<PhotoTransform>) => void;
  onUpdateLogoTransform: (update: Partial<LogoTransform>) => void;
  onRemoveLogo: () => void;
  onOpenPhotoPicker: () => void;
  onOpenLogoPicker: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onDropFiles?: (mainFile?: File, logoFile?: File) => void;
}

type DragMode =
  | 'none'
  | 'pan-photo'
  | 'move-logo'
  | 'resize-logo-se'
  | 'resize-logo-sw'
  | 'resize-logo-ne'
  | 'resize-logo-nw'
  | 'rotate-logo';

export default function WYSIWYGCanvas({
  mainImage,
  logoImage,
  mainImgDimensions,
  logoDimensions,
  aspectRatio,
  photoTransform,
  logoTransform,
  onUpdatePhotoTransform,
  onUpdateLogoTransform,
  onRemoveLogo,
  onOpenPhotoPicker,
  onOpenLogoPicker,
  showGrid,
  onToggleGrid,
  onDropFiles,
}: WYSIWYGCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [frameDimensions, setFrameDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 400,
  });

  const [isLogoSelected, setIsLogoSelected] = useState(true);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialLogoTransform, setInitialLogoTransform] = useState<LogoTransform>(logoTransform);
  const [initialPan, setInitialPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  // Measure and compute responsive frame size to fit container
  const updateFrameSize = useCallback(() => {
    if (!containerRef.current) return;
    const cont = containerRef.current;
    const padding = 32; // outer safe padding
    const maxW = Math.max(260, cont.clientWidth - padding);
    const maxH = Math.max(260, cont.clientHeight - padding);

    // Compute aspect ratio
    const currentOption = ASPECT_RATIOS.find((r) => r.id === aspectRatio);
    let targetAspect = 1;
    if (currentOption?.ratio) {
      targetAspect = currentOption.ratio;
    } else if (mainImgDimensions.width > 0 && mainImgDimensions.height > 0) {
      targetAspect = mainImgDimensions.width / mainImgDimensions.height;
    } else {
      targetAspect = 4 / 3;
    }

    let w = maxW;
    let h = w / targetAspect;

    if (h > maxH) {
      h = maxH;
      w = h * targetAspect;
    }

    setFrameDimensions({
      width: Math.round(w),
      height: Math.round(h),
    });
  }, [aspectRatio, mainImgDimensions]);

  useEffect(() => {
    updateFrameSize();
    window.addEventListener('resize', updateFrameSize);
    return () => window.removeEventListener('resize', updateFrameSize);
  }, [updateFrameSize]);

  // Photo cover metrics
  const photoMetrics = calculateCoverMetrics(
    frameDimensions.width,
    frameDimensions.height,
    mainImgDimensions.width || 800,
    mainImgDimensions.height || 600,
    photoTransform.zoom,
    photoTransform.panNormX,
    photoTransform.panNormY
  );

  // Logo layout metrics
  const logoMetrics = calculateLogoMetrics(
    frameDimensions.width,
    frameDimensions.height,
    logoDimensions.width || 200,
    logoDimensions.height || 100,
    logoTransform
  );

  // Snap guide states
  const showCenterGuideX =
    isLogoSelected && Math.abs(logoTransform.centerX - 0.5) < 0.015 && dragMode !== 'none';
  const showCenterGuideY =
    isLogoSelected && Math.abs(logoTransform.centerY - 0.5) < 0.015 && dragMode !== 'none';

  // Handle pointer down on Logo
  const handleLogoPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsLogoSelected(true);
    setDragMode('move-logo');
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialLogoTransform({ ...logoTransform });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle pointer down on resize handle
  const handleResizeHandleDown = (e: React.PointerEvent, handle: DragMode) => {
    e.stopPropagation();
    setDragMode(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialLogoTransform({ ...logoTransform });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle pointer down on rotate handle
  const handleRotateHandleDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragMode('rotate-logo');
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialLogoTransform({ ...logoTransform });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle pointer down on background (Photo Pan)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (!mainImage) return;
    setDragMode('pan-photo');
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPan({
      x: photoTransform.panNormX,
      y: photoTransform.panNormY,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle pointer move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === 'none') return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (dragMode === 'pan-photo') {
      // Photo Pan
      const maxPanX = photoMetrics.maxPanX || 1;
      const maxPanY = photoMetrics.maxPanY || 1;

      // Sensitivity factor
      const nextNormX = maxPanX > 0 ? initialPan.x + deltaX / maxPanX : 0;
      const nextNormY = maxPanY > 0 ? initialPan.y + deltaY / maxPanY : 0;

      onUpdatePhotoTransform({
        panNormX: Math.max(-1, Math.min(1, nextNormX)),
        panNormY: Math.max(-1, Math.min(1, nextNormY)),
      });
    } else if (dragMode === 'move-logo') {
      // Logo Move
      const normDeltaX = deltaX / frameDimensions.width;
      const normDeltaY = deltaY / frameDimensions.height;

      let nextX = initialLogoTransform.centerX + normDeltaX;
      let nextY = initialLogoTransform.centerY + normDeltaY;

      // Magnetic snap to center
      if (Math.abs(nextX - 0.5) < 0.02) nextX = 0.5;
      if (Math.abs(nextY - 0.5) < 0.02) nextY = 0.5;

      onUpdateLogoTransform({
        centerX: Math.max(0.05, Math.min(0.95, nextX)),
        centerY: Math.max(0.05, Math.min(0.95, nextY)),
      });
    } else if (dragMode.startsWith('resize-logo-')) {
      // Logo Resize from corners
      const factor = dragMode.includes('e') ? deltaX : -deltaX;
      const deltaScale = (factor / frameDimensions.width) * 1.5;
      const nextScale = Math.max(0.05, Math.min(0.85, initialLogoTransform.scale + deltaScale));

      onUpdateLogoTransform({ scale: nextScale });
    } else if (dragMode === 'rotate-logo') {
      // Logo Rotate
      if (!frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      const logoCenterScreenX = rect.left + logoMetrics.centerX;
      const logoCenterScreenY = rect.top + logoMetrics.centerY;

      const angleRad = Math.atan2(e.clientY - logoCenterScreenY, e.clientX - logoCenterScreenX);
      let angleDeg = Math.round((angleRad * 180) / Math.PI) - 90;

      // Normalize to -180 .. 180
      while (angleDeg > 180) angleDeg -= 360;
      while (angleDeg < -180) angleDeg += 360;

      // Snap near cardinal angles
      const cardinals = [0, 90, 180, -90, -180];
      for (const card of cardinals) {
        if (Math.abs(angleDeg - card) < 4) {
          angleDeg = card === -180 ? 180 : card;
          break;
        }
      }

      onUpdateLogoTransform({ rotation: angleDeg });
    }
  };

  // Handle pointer up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragMode !== 'none') {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
      setDragMode('none');
    }
  };

  // Wheel zoom on photo
  const handleWheel = (e: React.WheelEvent) => {
    if (!mainImage) return;
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
    const nextZoom = Math.max(1.0, Math.min(3.5, photoTransform.zoom + zoomStep));
    onUpdatePhotoTransform({ zoom: parseFloat(nextZoom.toFixed(2)) });
  };

  // Drag and Drop files onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!onDropFiles) return;

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length === 0) return;

    // Check if one is a PNG logo and other is photo
    const pngLogo = files.find((f: File) => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png'));
    const photo = files.find((f: File) => f !== pngLogo && f.type.startsWith('image/'));

    if (photo && pngLogo) {
      onDropFiles(photo, pngLogo);
    } else if (pngLogo && mainImage) {
      onDropFiles(undefined, pngLogo);
    } else if (files[0].type.startsWith('image/')) {
      onDropFiles(files[0], undefined);
    }
  };

  // Determine logo CSS filters (tint & shadow)
  const getLogoFilters = () => {
    const shadowFilter = getShadowFilter(logoTransform.shadow);
    let colorFilter = '';

    if (logoTransform.tint === 'white') {
      // Invert & brighten to white
      colorFilter = 'brightness(0) invert(1)';
    } else if (logoTransform.tint === 'black') {
      // Turn to pure black
      colorFilter = 'brightness(0)';
    }

    return [colorFilter, shadowFilter].filter(Boolean).join(' ') || 'none';
  };

  // Photo tone filter
  const photoFilter = `brightness(${photoTransform.brightness}%) contrast(${photoTransform.contrast}%) sepia(${Math.max(0, photoTransform.warmth * 0.6)}%) hue-rotate(${photoTransform.warmth < 0 ? photoTransform.warmth * 0.8 : 0}deg)`;

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full min-h-[420px] md:min-h-[520px] flex items-center justify-center p-3 md:p-6 select-none touch-none transition-colors duration-200 ${
        isDragOver ? 'bg-zinc-100 ring-2 ring-zinc-400 ring-dashed' : 'bg-zinc-100/70'
      }`}
    >
      {/* Aspect Ratio & Frame Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md shadow-sm border border-zinc-200 text-xs font-medium text-zinc-700 flex items-center gap-2">
          <span className="font-semibold text-zinc-900 uppercase tracking-wider text-[11px]">
            {aspectRatio}
          </span>
          <span className="text-zinc-300">·</span>
          <span className="text-zinc-500 font-mono text-[11px]">
            {frameDimensions.width} × {frameDimensions.height} px
          </span>
        </div>

        {/* Rule of Thirds Toggle */}
        <button
          onClick={onToggleGrid}
          title="Toggle Rule of Thirds Grid"
          className={`p-1.5 rounded-lg border transition-all ${
            showGrid
              ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
              : 'bg-white/90 text-zinc-600 border-zinc-200 hover:text-zinc-900'
          }`}
        >
          <Grid3X3 size={16} />
        </button>
      </div>

      {/* Main WYSIWYG Frame Container */}
      {!mainImage ? (
        // Empty State with Drop Area & Quick Demo Action
        <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border-2 border-dashed border-zinc-200 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500">
            <Upload size={28} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1">Upload Photo to Begin</h3>
            <p className="text-xs text-zinc-500 max-w-xs">
              Drag & drop your main photo and PNG logo directly here, or select from file picker.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <button
              onClick={onOpenPhotoPicker}
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Choose Photo
            </button>
          </div>
        </div>
      ) : (
        // Active Interactive Frame
        <div
          ref={frameRef}
          style={{
            width: `${frameDimensions.width}px`,
            height: `${frameDimensions.height}px`,
          }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className={`relative rounded-xl overflow-hidden shadow-2xl border border-zinc-300/80 bg-zinc-900 cursor-${
            dragMode === 'pan-photo' ? 'grabbing' : photoTransform.zoom > 1.05 ? 'grab' : 'default'
          }`}
        >
          {/* Main Photo Layer */}
          <div
            style={{
              position: 'absolute',
              width: `${photoMetrics.renderedW}px`,
              height: `${photoMetrics.renderedH}px`,
              left: `${photoMetrics.left}px`,
              top: `${photoMetrics.top}px`,
              filter: photoFilter,
              transformOrigin: 'top left',
            }}
            className="pointer-events-none select-none"
          >
            <img
              src={mainImage}
              alt="Main canvas"
              className="w-full h-full object-cover block"
              draggable={false}
            />
          </div>

          {/* Rule of Thirds Composition Grid */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 opacity-40">
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-white/60" />
              <div className="border-r border-white/60" />
              <div />
            </div>
          )}

          {/* Magnetic Center Alignment Guides */}
          {showCenterGuideX && (
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-sky-400 z-20 pointer-events-none shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          )}
          {showCenterGuideY && (
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-sky-400 z-20 pointer-events-none shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          )}

          {/* Interactive Logo Layer */}
          {logoImage && (
            <div
              style={{
                position: 'absolute',
                left: `${logoMetrics.left}px`,
                top: `${logoMetrics.top}px`,
                width: `${logoMetrics.width}px`,
                height: `${logoMetrics.height}px`,
                transform: `rotate(${logoTransform.rotation}deg)`,
                transformOrigin: 'center center',
                opacity: logoTransform.opacity,
                mixBlendMode: logoTransform.blendMode,
                zIndex: 30,
              }}
              onPointerDown={handleLogoPointerDown}
              className={`group/logo cursor-move select-none ${
                isLogoSelected ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-black/20' : ''
              }`}
            >
              {/* Actual Logo Image */}
              <img
                src={logoImage}
                alt="Logo overlay"
                style={{
                  filter: getLogoFilters(),
                }}
                className="w-full h-full object-contain block pointer-events-none"
                draggable={false}
              />

              {/* Direct Manipulation Bounding Box Handles when Selected */}
              {isLogoSelected && (
                <>
                  {/* Floating Action Badge Above Logo */}
                  <div
                    style={{
                      transform: 'translate(-50%, -100%)',
                    }}
                    className="absolute top-[-10px] left-1/2 flex items-center gap-1 p-1 bg-zinc-900/95 backdrop-blur-md text-white rounded-lg shadow-lg border border-white/10 z-40"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        onUpdateLogoTransform({
                          rotation: ((logoTransform.rotation + 90) % 360) as number,
                        })
                      }
                      title="Rotate 90°"
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      <RotateCw size={13} />
                    </button>
                    <button
                      onClick={() =>
                        onUpdateLogoTransform({
                          centerX: 0.5,
                          centerY: 0.5,
                        })
                      }
                      title="Center Logo"
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      <Maximize2 size={13} />
                    </button>
                    <button
                      onClick={onRemoveLogo}
                      title="Remove Logo"
                      className="p-1 rounded hover:bg-red-500/30 text-red-300 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Top Rotation Knob Stem */}
                  <div
                    style={{ transform: 'translateX(-50%)' }}
                    className="absolute top-[-22px] left-1/2 w-4 h-4 rounded-full bg-white border-2 border-sky-500 shadow-md flex items-center justify-center cursor-crosshair z-40"
                    onPointerDown={handleRotateHandleDown}
                    title="Drag to rotate"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  </div>
                  <div
                    style={{ transform: 'translateX(-50%)' }}
                    className="absolute top-[-10px] left-1/2 w-[1px] h-[12px] bg-sky-400 pointer-events-none"
                  />

                  {/* 4 Corner Resize Handles */}
                  {/* NW - Top Left */}
                  <div
                    onPointerDown={(e) => handleResizeHandleDown(e, 'resize-logo-nw')}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-sm cursor-nwse-resize z-40"
                  />
                  {/* NE - Top Right */}
                  <div
                    onPointerDown={(e) => handleResizeHandleDown(e, 'resize-logo-ne')}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-sm cursor-nesw-resize z-40"
                  />
                  {/* SW - Bottom Left */}
                  <div
                    onPointerDown={(e) => handleResizeHandleDown(e, 'resize-logo-sw')}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-sm cursor-nesw-resize z-40"
                  />
                  {/* SE - Bottom Right */}
                  <div
                    onPointerDown={(e) => handleResizeHandleDown(e, 'resize-logo-se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-sm cursor-nwse-resize z-40"
                  />
                </>
              )}
            </div>
          )}

          {/* Prompt to add logo if main image is loaded but logo isn't */}
          {!logoImage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="pointer-events-auto px-4 py-2.5 rounded-2xl bg-zinc-900/85 backdrop-blur-md text-white shadow-xl flex items-center gap-2 border border-white/10">
                <Layers size={16} className="text-sky-400" />
                <span className="text-xs font-medium">Add a PNG logo to place on photo</span>
                <button
                  onClick={onOpenLogoPicker}
                  className="ml-2 px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition-colors shadow-sm"
                >
                  Upload Logo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Hint Banner */}
      {mainImage && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 shadow-sm text-[11px] text-zinc-500 pointer-events-none">
          <span className="flex items-center gap-1">
            <Move size={11} className="text-zinc-700" />
            <span>Drag image to crop</span>
          </span>
          <span className="text-zinc-300">·</span>
          <span>Scroll/pinch to zoom</span>
          {logoImage && (
            <>
              <span className="text-zinc-300">·</span>
              <span className="text-zinc-800 font-medium">Corner handles resize logo</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
