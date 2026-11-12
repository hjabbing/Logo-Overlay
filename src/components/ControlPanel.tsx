import React, { useState } from 'react';
import {
  Crop,
  Layers,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Sun,
  Shield,
  Palette,
  Sliders,
  Check,
  Upload,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowLeft,
  Circle,
  ArrowRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
  SlidersHorizontal,
  Plus,
  Minus,
} from 'lucide-react';
import {
  AspectRatioType,
  ASPECT_RATIOS,
  AlignmentPosition,
  LogoTransform,
  PhotoTransform,
  getSmartAlignmentCoords,
} from '../utils/imageMath';
import { SAMPLE_PHOTOS, SAMPLE_LOGOS } from '../utils/sampleAssets';

interface ControlPanelProps {
  mainImage: string | null;
  logoImage: string | null;
  mainImgDimensions: { width: number; height: number };
  logoDimensions: { width: number; height: number };
  aspectRatio: AspectRatioType;
  photoTransform: PhotoTransform;
  logoTransform: LogoTransform;
  touchPanMode: boolean;
  onToggleTouchPanMode: () => void;
  onSelectAspectRatio: (ratio: AspectRatioType) => void;
  onUpdatePhotoTransform: (update: Partial<PhotoTransform>) => void;
  onUpdateLogoTransform: (update: Partial<LogoTransform>) => void;
  onResetPhotoView: () => void;
  onResetLogoTransform: () => void;
  onSelectSamplePhoto: (url: string) => void;
  onSelectSampleLogo: (url: string) => void;
  onUploadMainImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetAll: () => void;
}

export default function ControlPanel({
  mainImage,
  logoImage,
  mainImgDimensions,
  logoDimensions,
  aspectRatio,
  photoTransform,
  logoTransform,
  touchPanMode,
  onToggleTouchPanMode,
  onSelectAspectRatio,
  onUpdatePhotoTransform,
  onUpdateLogoTransform,
  onResetPhotoView,
  onResetLogoTransform,
  onSelectSamplePhoto,
  onSelectSampleLogo,
  onUploadMainImage,
  onUploadLogo,
  onResetAll,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'framing' | 'logo' | 'style' | 'samples'>(
    logoImage ? 'logo' : 'framing'
  );

  const mainInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  // 9-point grid alignment handler
  const handleAlign = (position: AlignmentPosition) => {
    const frameAspect =
      aspectRatio === '1:1'
        ? 1
        : aspectRatio === '4:5'
        ? 4 / 5
        : aspectRatio === '16:9'
        ? 16 / 9
        : aspectRatio === '9:16'
        ? 9 / 16
        : mainImgDimensions.width > 0 && mainImgDimensions.height > 0
        ? mainImgDimensions.width / mainImgDimensions.height
        : 1;

    const logoAspect = (logoDimensions.width || 1) / (logoDimensions.height || 1);
    const coords = getSmartAlignmentCoords(
      position,
      logoTransform.scale,
      logoAspect,
      frameAspect,
      0.05
    );

    onUpdateLogoTransform({
      centerX: coords.centerX,
      centerY: coords.centerY,
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-zinc-200/80 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden">
      {/* Top Header / File Asset Strip */}
      <div className="p-4 border-b border-zinc-100 bg-zinc-50/60">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Source Assets
          </span>
          <button
            onClick={onResetAll}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1"
          >
            <RotateCcw size={12} />
            Reset all
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Main Photo Slot */}
          <input
            type="file"
            ref={mainInputRef}
            accept="image/*"
            onChange={onUploadMainImage}
            className="hidden"
          />
          <button
            onClick={() => mainInputRef.current?.click()}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
              mainImage
                ? 'border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
                : 'border-dashed border-zinc-300 bg-white/70 hover:border-zinc-400'
            }`}
          >
            {mainImage ? (
              <img
                src={mainImage}
                alt="Main thumb"
                className="w-9 h-9 rounded-lg object-cover shrink-0 border border-zinc-100"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                <Upload size={16} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-900 truncate">
                {mainImage ? 'Main Photo' : 'Upload Photo'}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {mainImage ? `${mainImgDimensions.width}×${mainImgDimensions.height}` : 'JPG, PNG, WEBP'}
              </div>
            </div>
          </button>

          {/* PNG Logo Slot */}
          <input
            type="file"
            ref={logoInputRef}
            accept="image/png,image/svg+xml"
            onChange={onUploadLogo}
            className="hidden"
          />
          <button
            onClick={() => logoInputRef.current?.click()}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
              logoImage
                ? 'border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
                : 'border-dashed border-zinc-300 bg-white/70 hover:border-zinc-400'
            }`}
          >
            {logoImage ? (
              <div className="w-9 h-9 rounded-lg bg-zinc-900 p-1 flex items-center justify-center shrink-0 border border-zinc-200">
                <img
                  src={logoImage}
                  alt="Logo thumb"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                <Upload size={16} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-900 truncate">
                {logoImage ? 'PNG Logo' : 'Upload Logo'}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {logoImage ? 'Active overlay' : 'Transparent PNG'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-zinc-100 bg-zinc-50/40 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('framing')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
            activeTab === 'framing'
              ? 'bg-white text-zinc-900 shadow-xs font-semibold'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Crop size={14} />
          <span>Framing</span>
        </button>
        <button
          onClick={() => setActiveTab('logo')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
            activeTab === 'logo'
              ? 'bg-white text-zinc-900 shadow-xs font-semibold'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Layers size={14} />
          <span>Logo</span>
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
            activeTab === 'style'
              ? 'bg-white text-zinc-900 shadow-xs font-semibold'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Style</span>
        </button>
        <button
          onClick={() => setActiveTab('samples')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
            activeTab === 'samples'
              ? 'bg-white text-zinc-900 shadow-xs font-semibold'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Sparkles size={14} />
          <span>Samples</span>
        </button>
      </div>

      {/* Tab Body Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
        {/* TAB 1: FRAMING & PHOTO */}
        {activeTab === 'framing' && (
          <div className="space-y-5">
            {/* Aspect Ratio Selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-zinc-700">Aspect Ratio / Crop</label>
                <span className="text-[11px] text-zinc-400">Lock format</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECT_RATIOS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectAspectRatio(item.id)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      aspectRatio === item.id
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[9px] opacity-70 truncate mt-0.5">{item.sublabel}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Zoom Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-zinc-700">Photo Zoom</label>
                <span className="text-xs font-mono text-zinc-500">
                  {Math.round(photoTransform.zoom * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onUpdatePhotoTransform({
                      zoom: Math.max(1.0, parseFloat((photoTransform.zoom - 0.1).toFixed(2))),
                    })
                  }
                  className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50"
                  title="Zoom Out"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.02"
                  value={photoTransform.zoom}
                  onChange={(e) =>
                    onUpdatePhotoTransform({ zoom: parseFloat(e.target.value) })
                  }
                  className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                />
                <button
                  onClick={() =>
                    onUpdatePhotoTransform({
                      zoom: Math.min(3.0, parseFloat((photoTransform.zoom + 0.1).toFixed(2))),
                    })
                  }
                  className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50"
                  title="Zoom In"
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Zoom the image to crop. Use the directional buttons or canvas to adjust position.
              </p>
            </div>

            {/* Directional Crop Position Controls (Active when zoomed) */}
            {photoTransform.zoom > 1.02 && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-zinc-700">Crop Position</span>
                  <button
                    onClick={onToggleTouchPanMode}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                      touchPanMode
                        ? 'bg-sky-500 text-white'
                        : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                    }`}
                  >
                    {touchPanMode ? 'Pan Canvas: Active' : 'Touch to Pan'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 max-w-[160px] mx-auto">
                  <div />
                  <button
                    onClick={() =>
                      onUpdatePhotoTransform({
                        panNormY: Math.max(-1, photoTransform.panNormY - 0.15),
                      })
                    }
                    className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700"
                    title="Nudge Up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <div />
                  <button
                    onClick={() =>
                      onUpdatePhotoTransform({
                        panNormX: Math.max(-1, photoTransform.panNormX - 0.15),
                      })
                    }
                    className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700"
                    title="Nudge Left"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    onClick={() =>
                      onUpdatePhotoTransform({
                        panNormX: 0,
                        panNormY: 0,
                      })
                    }
                    className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700"
                    title="Center Photo"
                  >
                    <Circle size={10} className="fill-zinc-400 text-zinc-400" />
                  </button>
                  <button
                    onClick={() =>
                      onUpdatePhotoTransform({
                        panNormX: Math.min(1, photoTransform.panNormX + 0.15),
                      })
                    }
                    className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700"
                    title="Nudge Right"
                  >
                    <ArrowRight size={14} />
                  </button>
                  <div />
                  <button
                    onClick={() =>
                      onUpdatePhotoTransform({
                        panNormY: Math.min(1, photoTransform.panNormY + 0.15),
                      })
                    }
                    className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700"
                    title="Nudge Down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <div />
                </div>
              </div>
            )}

            {/* Reset Photo Transform */}
            <div className="pt-1">
              <button
                onClick={onResetPhotoView}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium transition-colors"
              >
                <RotateCcw size={13} />
                Reset Photo View & Crop
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LOGO & BRAND */}
        {activeTab === 'logo' && (
          <div className="space-y-5">
            {!logoImage ? (
              <div className="p-6 text-center border-2 border-dashed border-zinc-200 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 mx-auto flex items-center justify-center text-zinc-400">
                  <Upload size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900">No Logo Loaded</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Upload your transparent PNG logo or choose from our curated vector samples.
                  </p>
                </div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors shadow-xs"
                >
                  Choose PNG File
                </button>
              </div>
            ) : (
              <>
                {/* 9-Point Smart Alignment Grid */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-zinc-700">
                      Snap Position (5% Safe Margins)
                    </label>
                    <span className="text-[11px] text-zinc-400">9-Point Grid</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-zinc-50 rounded-xl border border-zinc-200/80 max-w-[200px] mx-auto">
                    <button
                      onClick={() => handleAlign('top-left')}
                      title="Top Left"
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
                    >
                      <ArrowUpLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleAlign('top-center')}
                      title="Top Center"
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => handleAlign('top-right')}
                      title="Top Right"
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
                    >
                      <ArrowUpRight size={16} />
                    </button>
                    <button
                      onClick={() => handleAlign('center-left')}
                      title="Center Left"
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleAlign('center')}
                      title="Center"
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
                    >
                      <Circle size={12} className="fill-zinc-400 text-zinc-400" />
                    </button>
                    <button
                      onClick={() => handleAlign('center-right')}
                      title="Center Right"
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => handleAlign('bottom-left')}
                      title="Bottom Left"
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
                    >
                      <ArrowDownLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleAlign('bottom-center')}
                      title="Bottom Center"
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => handleAlign('bottom-right')}
                      title="Bottom Right (Standard Watermark)"
                      className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-900 text-white flex items-center justify-center shadow-xs transition-colors"
                    >
                      <ArrowDownRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Scale & Opacity Sliders */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Logo Scale</label>
                      <span className="text-xs font-mono text-zinc-500">
                        {Math.round(logoTransform.scale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.85"
                      step="0.01"
                      value={logoTransform.scale}
                      onChange={(e) =>
                        onUpdateLogoTransform({ scale: parseFloat(e.target.value) })
                      }
                      className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Logo Opacity</label>
                      <span className="text-xs font-mono text-zinc-500">
                        {Math.round(logoTransform.opacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.02"
                      value={logoTransform.opacity}
                      onChange={(e) =>
                        onUpdateLogoTransform({ opacity: parseFloat(e.target.value) })
                      }
                      className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Rotation</label>
                      <span className="text-xs font-mono text-zinc-500">
                        {logoTransform.rotation}°
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={logoTransform.rotation}
                        onChange={(e) =>
                          onUpdateLogoTransform({ rotation: parseInt(e.target.value, 10) })
                        }
                        className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                      <button
                        onClick={() => onUpdateLogoTransform({ rotation: 0 })}
                        className="px-2 py-1 rounded-md text-[11px] border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      >
                        0°
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color Tint / Invert Mode */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-2">
                    Logo Color Tint
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onUpdateLogoTransform({ tint: 'original' })}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                        logoTransform.tint === 'original'
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => onUpdateLogoTransform({ tint: 'white' })}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                        logoTransform.tint === 'white'
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      Whiteout
                    </button>
                    <button
                      onClick={() => onUpdateLogoTransform({ tint: 'black' })}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                        logoTransform.tint === 'black'
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      Blackout
                    </button>
                  </div>
                </div>

                {/* Drop Shadow Protection */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-2">
                    Background Legibility Shadow
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['none', 'subtle', 'medium', 'strong'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => onUpdateLogoTransform({ shadow: s })}
                        className={`py-2 px-1 rounded-xl border text-xs capitalize transition-all ${
                          logoTransform.shadow === s
                            ? 'border-zinc-900 bg-zinc-900 text-white font-medium shadow-xs'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onResetLogoTransform}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium transition-colors"
                  >
                    <RotateCcw size={13} />
                    Reset Logo Placement
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: PHOTO STYLE & FILTERS */}
        {activeTab === 'style' && (
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-zinc-700">Brightness</label>
                <span className="text-xs font-mono text-zinc-500">
                  {photoTransform.brightness}%
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="130"
                step="1"
                value={photoTransform.brightness}
                onChange={(e) =>
                  onUpdatePhotoTransform({ brightness: parseInt(e.target.value, 10) })
                }
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-zinc-700">Contrast</label>
                <span className="text-xs font-mono text-zinc-500">{photoTransform.contrast}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="130"
                step="1"
                value={photoTransform.contrast}
                onChange={(e) =>
                  onUpdatePhotoTransform({ contrast: parseInt(e.target.value, 10) })
                }
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-zinc-700">Color Tone</label>
                <span className="text-xs font-mono text-zinc-500">
                  {photoTransform.warmth > 0
                    ? `+${photoTransform.warmth} Warm`
                    : photoTransform.warmth < 0
                    ? `${photoTransform.warmth} Cool`
                    : 'Neutral'}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={photoTransform.warmth}
                onChange={(e) =>
                  onUpdatePhotoTransform({ warmth: parseInt(e.target.value, 10) })
                }
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() =>
                  onUpdatePhotoTransform({
                    brightness: 100,
                    contrast: 100,
                    warmth: 0,
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium transition-colors"
              >
                <RotateCcw size={13} />
                Reset Color & Tone
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SAMPLE DEMO PRESETS */}
        {activeTab === 'samples' && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-2">
                1-Click Sample Photos
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PHOTOS.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => onSelectSamplePhoto(photo.url)}
                    className="group relative rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-all text-left"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-2 bg-white">
                      <div className="text-xs font-semibold text-zinc-900">{photo.name}</div>
                      <div className="text-[10px] text-zinc-400">{photo.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-2">
                1-Click Vector Sample Logos
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_LOGOS.map((logo) => (
                  <button
                    key={logo.id}
                    onClick={() => onSelectSampleLogo(logo.url)}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-400 bg-white transition-all text-left"
                  >
                    <div className="w-12 h-10 bg-zinc-900 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                      <img
                        src={logo.url}
                        alt={logo.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-900">{logo.name}</div>
                      <div className="text-[11px] text-zinc-400">{logo.category} Monogram</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
