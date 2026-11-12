export type AspectRatioType = 'original' | '1:1' | '4:5' | '16:9' | '9:16';

export interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  sublabel: string;
  ratio: number | null; // null = use original
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: 'original', label: 'Original', sublabel: 'Source ratio', ratio: null },
  { id: '1:1', label: '1:1', sublabel: 'Square Post', ratio: 1 },
  { id: '4:5', label: '4:5', sublabel: 'Portrait Feed', ratio: 4 / 5 },
  { id: '16:9', label: '16:9', sublabel: 'Landscape', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', sublabel: 'Story / Reel', ratio: 9 / 16 },
];

export type AlignmentPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface LogoTransform {
  // Center coordinates normalized to [0, 1] relative to frame width and height
  centerX: number;
  centerY: number;
  // Width normalized to [0, 1] relative to frame width
  scale: number;
  rotation: number; // degrees (-180 to 180)
  opacity: number; // 0 to 1
  shadow: 'none' | 'subtle' | 'medium' | 'strong';
  tint: 'original' | 'white' | 'black';
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
}

export interface PhotoTransform {
  zoom: number; // >= 1.0 (1.0 = exact cover)
  // Pan normalized relative to maximum allowable pan bounds [-1, 1]
  panNormX: number;
  panNormY: number;
  brightness: number; // 100 is default
  contrast: number; // 100 is default
  warmth: number; // 0 is default (-50 cool, +50 warm)
}

export interface EditorState {
  aspectRatio: AspectRatioType;
  photoTransform: PhotoTransform;
  logoTransform: LogoTransform;
}

/**
 * Calculates cover scale and pixel bounds for photo inside a target frame
 */
export function calculateCoverMetrics(
  frameW: number,
  frameH: number,
  naturalW: number,
  naturalH: number,
  zoom: number,
  panNormX: number,
  panNormY: number
) {
  const baseScale = Math.max(frameW / naturalW, frameH / naturalH);
  const totalScale = baseScale * Math.max(1, zoom);
  const renderedW = naturalW * totalScale;
  const renderedH = naturalH * totalScale;

  const maxPanX = Math.max(0, (renderedW - frameW) / 2);
  const maxPanY = Math.max(0, (renderedH - frameH) / 2);

  // Clamped pixel pan offset from center
  const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, panNormX * maxPanX));
  const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, panNormY * maxPanY));

  // Top-left pixel coordinate inside frame
  const left = (frameW - renderedW) / 2 + clampedPanX;
  const top = (frameH - renderedH) / 2 + clampedPanY;

  return {
    renderedW,
    renderedH,
    left,
    top,
    maxPanX,
    maxPanY,
    clampedPanX,
    clampedPanY,
  };
}

/**
 * Calculates logo pixel geometry from normalized transform
 */
export function calculateLogoMetrics(
  frameW: number,
  frameH: number,
  logoNaturalW: number,
  logoNaturalH: number,
  transform: LogoTransform
) {
  const logoAspect = logoNaturalW / (logoNaturalH || 1);
  const width = frameW * Math.max(0.04, Math.min(0.9, transform.scale));
  const height = width / logoAspect;

  const centerX = frameW * transform.centerX;
  const centerY = frameH * transform.centerY;

  const left = centerX - width / 2;
  const top = centerY - height / 2;

  return {
    width,
    height,
    left,
    top,
    centerX,
    centerY,
    logoAspect,
  };
}

/**
 * Calculates 9-point alignment normalized center coordinates
 */
export function getSmartAlignmentCoords(
  position: AlignmentPosition,
  scale: number,
  logoAspect: number,
  frameAspect: number,
  margin = 0.05 // 5% safe zone margin
): { centerX: number; centerY: number } {
  const halfW = scale / 2;
  // height as fraction of frame height
  const heightFraction = (scale / logoAspect) * frameAspect;
  const halfH = heightFraction / 2;

  let cx = 0.5;
  let cy = 0.5;

  // X alignment
  if (position.includes('left')) {
    cx = margin + halfW;
  } else if (position.includes('right')) {
    cx = 1 - margin - halfW;
  } else {
    cx = 0.5;
  }

  // Y alignment
  if (position.includes('top')) {
    cy = margin + halfH;
  } else if (position.includes('bottom')) {
    cy = 1 - margin - halfH;
  } else {
    cy = 0.5;
  }

  return {
    centerX: Math.max(halfW, Math.min(1 - halfW, cx)),
    centerY: Math.max(halfH, Math.min(1 - halfH, cy)),
  };
}

/**
 * Returns CSS drop shadow filter string
 */
export function getShadowFilter(shadow: LogoTransform['shadow']): string {
  switch (shadow) {
    case 'subtle':
      return 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))';
    case 'medium':
      return 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))';
    case 'strong':
      return 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.75)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5))';
    case 'none':
    default:
      return 'none';
  }
}
