import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Trash2,
  Maximize2,
  Upload,
  Layers,
  Move,
  Hand,
  MousePointer,
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
  touchPanMode: boolean;
  onToggleTouchPanMode: () => void;
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
  touchPanMode,
  onToggleTouchPanMode,
  onDropFiles,
}: WYSIWYGCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [frameDimensions, setFrameDimensions] = useState<{ width: number; height: number }>({
    width: 500,
    height: 380,
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
    const paddingX = cont.clientWidth < 640 ? 16 : 32;
    const paddingY = cont.clientHeight < 400 ? 16 : 32;
    const maxW = Math.max(200, cont.clientWidth - paddingX);
    const maxH = Math.max(200, cont.clientHeight - paddingY);

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

  // Handle pointer down on Logo (direct touch/mouse manipulation)
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
  // CRITICAL FIX: On touch devices, if NOT in touchPanMode, do NOT capture pointer!
  // This allows the natural mobile page scroll to work without getting stuck!
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (!mainImage) return;

    const isTouch = e.pointerType === 'touch';
    // If it's a touch event and user hasn't explicitly activated Pan Mode, allow page scroll!
    if (isTouch && !touchPanMode) {
      return;
    }

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
      const maxPanX = photoMetrics.maxPanX || 1;
      const maxPanY = photoMetrics.maxPanY || 1;

      const nextNormX = maxPanX > 0 ? initialPan.x + deltaX / maxPanX : 0;
      const nextNormY = maxPanY > 0 ? initialPan.y + deltaY / maxPanY : 0;

      onUpdatePhotoTransform({
        panNormX: Math.max(-1, Math.min(1, nextNormX)),
        panNormY: Math.max(-1, Math.min(1, nextNormY)),
      });
    } else if (dragMode === 'move-logo') {
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
      const factor = dragMode.includes('e') ? deltaX : -deltaX;
      const deltaScale = (factor / frameDimensions.width) * 1.5;
      const nextScale = Math.max(0.05, Math.min(0.85, initialLogoTransform.scale + deltaScale));

      onUpdateLogoTransform({ scale: nextScale });
    } else if (dragMode === 'rotate-logo') {
      if (!frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      const logoCenterScreenX = rect.left + logoMetrics.centerX;
      const logoCenterScreenY = rect.top + logoMetrics.centerY;

      const angleRad = Math.atan2(e.clientY - logoCenterScreenY, e.clientX - logoCenterScreenX);
      let angleDeg = Math.round((angleRad * 180) / Math.PI) - 90;

      while (angleDeg > 180) angleDeg -= 360;
      while (angleDeg < -180) angleDeg += 360;

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

  // Wheel zoom on desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (!mainImage) return;
    // Only zoom when mouse is over canvas
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

    const pngLogo = files.find(
      (f: File) => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png')
    );
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
      colorFilter = 'brightness(0) invert(1)';
    } else if (logoTransform.tint === 'black') {
      colorFilter = 'brightness(0)';
    }

    return [colorFilter, shadowFilter].filter(Boolean).join(' ') || 'none';
  };

  // Photo tone filter
  const photoFilter = `brightness(${photoTransform.brightness}%) contrast(${photoTransform.contrast}%) sepia(${Math.max(
    0,
    photoTransform.warmth * 0.6
  )}%) hue-rotate(${photoTransform.warmth < 0 ? photoTransform.warmth * 0.8 : 0}deg)`;

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      /* CRITICAL: touch-pan-y allows normal vertical finger scrolling on mobile */
      className={`relative w-full h-[320px] sm:h-[380px] md:h-[460px] lg:h-[520px] flex items-center justify-center p-2 sm:p-4 select-none touch-pan-y transition-colors duration-200 ${
        isDragOver ? 'bg-zinc-100 ring-2 ring-zinc-400 ring-dashed' : 'bg-zinc-100/70'
      }`}
    >
      {/* Main WYSIWYG Frame Container */}
      {!mainImage ? (
        <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-sm border-2 border-dashed border-zinc-200 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
            <Upload size={22} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-0.5">Upload Photo</h3>
            <p className="text-[11px] text-zinc-500 max-w-xs">
              Drag & drop photo and PNG logo, or choose from files.
            </p>
          </div>
          <button
            onClick={onOpenPhotoPicker}
            className="w-full px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-xs"
          >
            Select Photo
          </button>
        </div>
      ) : (
        <div
          ref={frameRef}
          style={{
            width: `${frameDimensions.width}px`,
            height: `${frameDimensions.height}px`,
            touchAction: touchPanMode ? 'none' : 'pan-y',
          }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className={`relative rounded-xl overflow-hidden shadow-xl border border-zinc-300/80 bg-zinc-900 ${
            touchPanMode ? 'cursor-grab ring-2 ring-sky-500/40' : 'cursor-default'
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
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
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
                touchAction: 'none', // Direct touch-manipulation strictly on logo
                zIndex: 20,
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
                    className="absolute top-[-8px] left-1/2 flex items-center gap-0.5 p-1 bg-zinc-900/95 backdrop-blur-md text-white rounded-lg shadow-lg border border-white/10 z-20"
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
                      <RotateCw size={12} />
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
                      <Maximize2 size={12} />
                    </button>
                    <button
                      onClick={onRemoveLogo}
                      title="Remove Logo"
                      className="p-1 rounded hover:bg-red-500/30 text-red-300 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Top Rotation Knob Stem */}
                  <div
                    style={{ transform: 'translateX(-50%)' }}
                    className="absolute top-[-20px] left-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-500 shadow-md flex items-center justify-center cursor-crosshair z-20"
                    onPointerDown={handleRotateHandleDown}
                    title="Drag to rotate"
                  >
                    <div className="w-1 h-1 rounded-full bg-sky-500" />
                  </div>
                  <div
                    style={{ transform: 'translateX(-50%)' }}
                    className="absolute top-[-8px] left-1/2 w-[1px] h-[12px] bg-sky-400 pointer-events-none"
                  />

                  {/* 4 Corner Resize Handles */}
                  <div
                    onPointerDown={(e) => handleResizeHandleDown(e, 'resize-logo-nw')}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-sm cursor-nwse-resize z-20"
                  />
                  <div
                    onPointerDown={(e) => handleResizeHandleDown(e, 'resize-logo-ne')}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-sm cursor-nesw-resize z-20"
                  />
                  <div
                    onPointerDown={(e) => handleResizeHandleDown(e, 'resize-logo-sw')}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-sm cursor-nesw-resize z-20"
                  />
                  <div
                    onPointerDown={(e) => handleResizeHandleDown(e, 'resize-logo-se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-sky-500 rounded-sm shadow-sm cursor-nwse-resize z-20"
                  />
                </>
              )}
            </div>
          )}

          {/* Prompt to add logo if main image is loaded but logo isn't */}
          {!logoImage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="pointer-events-auto px-4 py-2 rounded-2xl bg-zinc-900/90 backdrop-blur-md text-white shadow-xl flex items-center gap-2 border border-white/10">
                <Layers size={14} className="text-sky-400" />
                <span className="text-xs font-medium">Place a PNG logo</span>
                <button
                  onClick={onOpenLogoPicker}
                  className="ml-1 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition-colors shadow-sm"
                >
                  Upload
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
