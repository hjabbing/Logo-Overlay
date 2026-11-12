import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  RotateCcw,
  Undo2,
  Redo2,
  Layers,
  Sparkles,
  Check,
  Image as ImageIcon,
  Sliders,
  Maximize2,
  Copy,
  Grid3X3,
  Hand,
  Move,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import WYSIWYGCanvas from './WYSIWYGCanvas';
import ControlPanel from './ControlPanel';
import {
  AspectRatioType,
  LogoTransform,
  PhotoTransform,
  EditorState,
  calculateCoverMetrics,
  calculateLogoMetrics,
} from '../utils/imageMath';
import { SAMPLE_PHOTOS, SAMPLE_LOGOS } from '../utils/sampleAssets';

const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = {
  zoom: 1.0,
  panNormX: 0,
  panNormY: 0,
  brightness: 100,
  contrast: 100,
  warmth: 0,
};

const DEFAULT_LOGO_TRANSFORM: LogoTransform = {
  centerX: 0.82,
  centerY: 0.85,
  scale: 0.22,
  rotation: 0,
  opacity: 1.0,
  shadow: 'medium',
  tint: 'original',
  blendMode: 'normal',
};

export default function ImageEditor() {
  // Main assets
  const [mainImage, setMainImage] = useState<string | null>(SAMPLE_PHOTOS[0].url);
  const [logoImage, setLogoImage] = useState<string | null>(SAMPLE_LOGOS[0].url);

  // Natural image dimensions
  const [mainImgDimensions, setMainImgDimensions] = useState({ width: 1920, height: 1440 });
  const [logoDimensions, setLogoDimensions] = useState({ width: 400, height: 120 });

  // Transforms & Configuration
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('original');
  const [photoTransform, setPhotoTransform] = useState<PhotoTransform>(DEFAULT_PHOTO_TRANSFORM);
  const [logoTransform, setLogoTransform] = useState<LogoTransform>(DEFAULT_LOGO_TRANSFORM);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<EditorState[]>([
    {
      aspectRatio: 'original',
      photoTransform: DEFAULT_PHOTO_TRANSFORM,
      logoTransform: DEFAULT_LOGO_TRANSFORM,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // UI States
  const [showGrid, setShowGrid] = useState(false);
  const [touchPanMode, setTouchPanMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Hidden canvas for export
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  // Measure natural dimensions of an image URL
  const measureImage = (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 1000,
          height: img.naturalHeight || 800,
        });
      };
      img.onerror = () => {
        resolve({ width: 1000, height: 800 });
      };
      img.src = src;
    });
  };

  // Measure initial sample images on mount
  useEffect(() => {
    if (SAMPLE_PHOTOS[0]?.url) {
      measureImage(SAMPLE_PHOTOS[0].url).then(setMainImgDimensions);
    }
    if (SAMPLE_LOGOS[0]?.url) {
      measureImage(SAMPLE_LOGOS[0].url).then(setLogoDimensions);
    }
  }, []);

  // Push new state to history
  const pushHistory = useCallback(
    (newState: Partial<EditorState>) => {
      const current = {
        aspectRatio,
        photoTransform,
        logoTransform,
        ...newState,
      };

      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, current];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [aspectRatio, photoTransform, logoTransform, historyIndex]
  );

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setAspectRatio(target.aspectRatio);
      setPhotoTransform(target.photoTransform);
      setLogoTransform(target.logoTransform);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setAspectRatio(target.aspectRatio);
      setPhotoTransform(target.photoTransform);
      setLogoTransform(target.logoTransform);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, history]);

  // Keyboard shortcut listener (Cmd/Ctrl + Z / Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Upload handlers
  const handleUploadMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const url = event.target?.result as string;
        setMainImage(url);
        const dims = await measureImage(url);
        setMainImgDimensions(dims);
        setPhotoTransform(DEFAULT_PHOTO_TRANSFORM);
        pushHistory({ photoTransform: DEFAULT_PHOTO_TRANSFORM });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const url = event.target?.result as string;
        setLogoImage(url);
        const dims = await measureImage(url);
        setLogoDimensions(dims);
        setLogoTransform(DEFAULT_LOGO_TRANSFORM);
        pushHistory({ logoTransform: DEFAULT_LOGO_TRANSFORM });
      };
      reader.readAsDataURL(file);
    }
  };

  // Sample pickers
  const handleSelectSamplePhoto = async (url: string) => {
    setMainImage(url);
    const dims = await measureImage(url);
    setMainImgDimensions(dims);
    setPhotoTransform(DEFAULT_PHOTO_TRANSFORM);
    pushHistory({ photoTransform: DEFAULT_PHOTO_TRANSFORM });
  };

  const handleSelectSampleLogo = async (url: string) => {
    setLogoImage(url);
    const dims = await measureImage(url);
    setLogoDimensions(dims);
    setLogoTransform(DEFAULT_LOGO_TRANSFORM);
    pushHistory({ logoTransform: DEFAULT_LOGO_TRANSFORM });
  };

  // Drop files onto canvas handler
  const handleDropFiles = async (photoFile?: File, logoFile?: File) => {
    if (photoFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const url = event.target?.result as string;
        setMainImage(url);
        const dims = await measureImage(url);
        setMainImgDimensions(dims);
        setPhotoTransform(DEFAULT_PHOTO_TRANSFORM);
      };
      reader.readAsDataURL(photoFile);
    }

    if (logoFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const url = event.target?.result as string;
        setLogoImage(url);
        const dims = await measureImage(url);
        setLogoDimensions(dims);
        setLogoTransform(DEFAULT_LOGO_TRANSFORM);
      };
      reader.readAsDataURL(logoFile);
    }
  };

  // Transform updaters
  const handleUpdatePhotoTransform = (update: Partial<PhotoTransform>) => {
    setPhotoTransform((prev) => ({ ...prev, ...update }));
  };

  const handleUpdateLogoTransform = (update: Partial<LogoTransform>) => {
    setLogoTransform((prev) => ({ ...prev, ...update }));
  };

  const handleResetPhotoView = () => {
    setPhotoTransform(DEFAULT_PHOTO_TRANSFORM);
    pushHistory({ photoTransform: DEFAULT_PHOTO_TRANSFORM });
  };

  const handleResetLogoTransform = () => {
    setLogoTransform(DEFAULT_LOGO_TRANSFORM);
    pushHistory({ logoTransform: DEFAULT_LOGO_TRANSFORM });
  };

  const handleResetAll = () => {
    setMainImage(SAMPLE_PHOTOS[0].url);
    setLogoImage(SAMPLE_LOGOS[0].url);
    setAspectRatio('original');
    setPhotoTransform(DEFAULT_PHOTO_TRANSFORM);
    setLogoTransform(DEFAULT_LOGO_TRANSFORM);
    setHistory([
      {
        aspectRatio: 'original',
        photoTransform: DEFAULT_PHOTO_TRANSFORM,
        logoTransform: DEFAULT_LOGO_TRANSFORM,
      },
    ]);
    setHistoryIndex(0);
  };

  // Canvas Export Rendering Engine (100% WYSIWYG match)
  const renderCanvasOutput = async (): Promise<HTMLCanvasElement | null> => {
    if (!mainImage) return null;

    const mainImg = new Image();
    mainImg.crossOrigin = 'anonymous';
    await new Promise((res, rej) => {
      mainImg.onload = res;
      mainImg.onerror = rej;
      mainImg.src = mainImage;
    });

    let logoImg: HTMLImageElement | null = null;
    if (logoImage) {
      logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise((res) => {
        logoImg!.onload = res;
        logoImg!.onerror = res;
        logoImg!.src = logoImage;
      });
    }

    // Determine target export canvas dimensions based on chosen aspect ratio
    let targetAspect = 1;
    if (aspectRatio === '1:1') targetAspect = 1;
    else if (aspectRatio === '4:5') targetAspect = 4 / 5;
    else if (aspectRatio === '16:9') targetAspect = 16 / 9;
    else if (aspectRatio === '9:16') targetAspect = 9 / 16;
    else targetAspect = mainImg.naturalWidth / mainImg.naturalHeight;

    // High-resolution export baseline (e.g. 2048px maximum bound)
    const maxBound = 2048;
    let exportW = maxBound;
    let exportH = exportW / targetAspect;

    if (exportH > maxBound) {
      exportH = maxBound;
      exportW = exportH * targetAspect;
    }

    exportW = Math.round(exportW);
    exportH = Math.round(exportH);

    const canvas = document.createElement('canvas');
    canvas.width = exportW;
    canvas.height = exportH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Crisp white background (prevent transparent edges in JPG)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportW, exportH);

    // 2. Render Main Photo with exact cover and pan
    const photoMetrics = calculateCoverMetrics(
      exportW,
      exportH,
      mainImg.naturalWidth,
      mainImg.naturalHeight,
      photoTransform.zoom,
      photoTransform.panNormX,
      photoTransform.panNormY
    );

    ctx.save();
    // Apply photo tone filters
    ctx.filter = `brightness(${photoTransform.brightness}%) contrast(${photoTransform.contrast}%) sepia(${Math.max(
      0,
      photoTransform.warmth * 0.6
    )}%) hue-rotate(${photoTransform.warmth < 0 ? photoTransform.warmth * 0.8 : 0}deg)`;

    ctx.drawImage(
      mainImg,
      photoMetrics.left,
      photoMetrics.top,
      photoMetrics.renderedW,
      photoMetrics.renderedH
    );
    ctx.restore();

    // 3. Render Logo with exact scale, rotation, shadow, and color tint
    if (logoImg && logoImg.naturalWidth > 0) {
      const logoMetrics = calculateLogoMetrics(
        exportW,
        exportH,
        logoImg.naturalWidth,
        logoImg.naturalHeight,
        logoTransform
      );

      ctx.save();
      ctx.translate(logoMetrics.centerX, logoMetrics.centerY);
      ctx.rotate((logoTransform.rotation * Math.PI) / 180);
      ctx.globalAlpha = logoTransform.opacity;

      // Drop Shadow
      if (logoTransform.shadow === 'subtle') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = exportW * 0.008;
        ctx.shadowOffsetY = exportW * 0.004;
      } else if (logoTransform.shadow === 'medium') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = exportW * 0.016;
        ctx.shadowOffsetY = exportW * 0.008;
      } else if (logoTransform.shadow === 'strong') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = exportW * 0.028;
        ctx.shadowOffsetY = exportW * 0.014;
      }

      // Color Tint (Whiteout or Blackout)
      if (logoTransform.tint === 'white' || logoTransform.tint === 'black') {
        const tintCanvas = document.createElement('canvas');
        tintCanvas.width = logoImg.naturalWidth;
        tintCanvas.height = logoImg.naturalHeight;
        const tintCtx = tintCanvas.getContext('2d');
        if (tintCtx) {
          tintCtx.drawImage(logoImg, 0, 0);
          tintCtx.globalCompositeOperation = 'source-in';
          tintCtx.fillStyle = logoTransform.tint === 'white' ? '#ffffff' : '#000000';
          tintCtx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
          ctx.drawImage(
            tintCanvas,
            -logoMetrics.width / 2,
            -logoMetrics.height / 2,
            logoMetrics.width,
            logoMetrics.height
          );
        }
      } else {
        ctx.drawImage(
          logoImg,
          -logoMetrics.width / 2,
          -logoMetrics.height / 2,
          logoMetrics.width,
          logoMetrics.height
        );
      }

      ctx.restore();
    }

    return canvas;
  };

  // Direct JPG Download
  const handleDownloadJpg = async () => {
    setIsExporting(true);
    try {
      const canvas = await renderCanvasOutput();
      if (!canvas) return;

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `branded-image-${Date.now().toString().slice(-6)}.jpg`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);

          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#09090b', '#38bdf8', '#71717a'],
          });
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to Clipboard
  const handleCopyImage = async () => {
    try {
      const canvas = await renderCanvasOutput();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setCopiedToast(true);
          setTimeout(() => setCopiedToast(false), 2500);
        } catch (err) {
          console.warn('Clipboard write failed, falling back to download:', err);
          handleDownloadJpg();
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100/60 text-zinc-900 flex flex-col font-sans">
      {/* Top Bar Contract (3 Zones) with z-50 to stay above canvas on scroll */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-zinc-200">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
            L
          </div>
          <span className="text-base md:text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap">
            Logo Overlay
          </span>
        </div>

        {/* Zone 2: Navigation Links / Utility Affordances */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-zinc-500">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
            <span>Undo</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
            <span>Redo</span>
          </button>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-400">100% In-Browser & Private</span>
        </div>

        {/* Zone 3: Primary Copy & Download CTAs in sticky header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyImage}
            disabled={!mainImage}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            title="Copy image to clipboard"
          >
            {copiedToast ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadJpg}
            disabled={!mainImage || isExporting}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Download size={14} />
            <span>{isExporting ? 'Exporting...' : 'Download'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive WYSIWYG Canvas Stage (7 cols on Desktop) - relative z-10 ensures it stays under sticky header */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 relative z-10">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
            {/* Canvas Header Toolbar */}
            <div className="px-3 sm:px-4 py-2 border-b border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
              {/* Unboxed clean metadata (zero pills) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                  {aspectRatio}
                </span>
                <span className="text-zinc-300">·</span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {mainImgDimensions.width > 0 && mainImgDimensions.height > 0
                    ? `${mainImgDimensions.width}×${mainImgDimensions.height}`
                    : 'WYSIWYG'}
                </span>
              </div>

              {/* Right Toolbar Controls */}
              <div className="flex items-center gap-1.5">
                {/* Touch Pan Toggle when Zoomed */}
                {photoTransform.zoom > 1.02 && (
                  <button
                    onClick={() => setTouchPanMode((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors ${
                      touchPanMode
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                    title="Toggle touch pan on live canvas"
                  >
                    <Hand size={12} />
                    <span>{touchPanMode ? 'Pan: On' : 'Pan Mode'}</span>
                  </button>
                )}

                {/* Rule of Thirds Grid Toggle */}
                <button
                  onClick={() => setShowGrid((prev) => !prev)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    showGrid
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                  title="Toggle 3x3 Composition Grid"
                >
                  <Grid3X3 size={13} />
                </button>

                {/* Mobile Quick Undo / Redo */}
                <div className="flex md:hidden items-center gap-0.5 pl-1 border-l border-zinc-200">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-30"
                    title="Undo"
                  >
                    <Undo2 size={13} />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-30"
                    title="Redo"
                  >
                    <Redo2 size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Canvas Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <WYSIWYGCanvas
                mainImage={mainImage}
                logoImage={logoImage}
                mainImgDimensions={mainImgDimensions}
                logoDimensions={logoDimensions}
                aspectRatio={aspectRatio}
                photoTransform={photoTransform}
                logoTransform={logoTransform}
                touchPanMode={touchPanMode}
                onToggleTouchPanMode={() => setTouchPanMode((prev) => !prev)}
                onUpdatePhotoTransform={handleUpdatePhotoTransform}
                onUpdateLogoTransform={handleUpdateLogoTransform}
                onRemoveLogo={() => setLogoImage(null)}
                onOpenPhotoPicker={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) =>
                    handleUploadMainImage(e as unknown as React.ChangeEvent<HTMLInputElement>);
                  input.click();
                }}
                onOpenLogoPicker={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/png,image/svg+xml';
                  input.onchange = (e) =>
                    handleUploadLogo(e as unknown as React.ChangeEvent<HTMLInputElement>);
                  input.click();
                }}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid((prev) => !prev)}
                onDropFiles={handleDropFiles}
              />
            </div>
          </div>
        </section>

        {/* Right Column: Tabbed Control Panel (5 cols on Desktop) */}
        <section className="lg:col-span-5 xl:col-span-4 sticky top-20">
          <ControlPanel
            mainImage={mainImage}
            logoImage={logoImage}
            mainImgDimensions={mainImgDimensions}
            logoDimensions={logoDimensions}
            aspectRatio={aspectRatio}
            photoTransform={photoTransform}
            logoTransform={logoTransform}
            touchPanMode={touchPanMode}
            onToggleTouchPanMode={() => setTouchPanMode((prev) => !prev)}
            onSelectAspectRatio={(ratio) => {
              setAspectRatio(ratio);
              pushHistory({ aspectRatio: ratio });
            }}
            onUpdatePhotoTransform={handleUpdatePhotoTransform}
            onUpdateLogoTransform={handleUpdateLogoTransform}
            onResetPhotoView={handleResetPhotoView}
            onResetLogoTransform={handleResetLogoTransform}
            onSelectSamplePhoto={handleSelectSamplePhoto}
            onSelectSampleLogo={handleSelectSampleLogo}
            onUploadMainImage={handleUploadMainImage}
            onUploadLogo={handleUploadLogo}
            onResetAll={handleResetAll}
          />
        </section>
      </main>

      <canvas ref={exportCanvasRef} className="hidden" />
    </div>
  );
}
