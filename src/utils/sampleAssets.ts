import mountainImg from '../assets/images/sample_scenic_mountain_1794487553885.jpg';
import coffeeImg from '../assets/images/sample_urban_coffee_1794487553390.jpg';

// Sample photos generated via generate_image tool
export const SAMPLE_PHOTOS = [
  {
    id: 'mountain',
    name: 'Alpine Sunrise',
    category: 'Landscape',
    url: mountainImg,
  },
  {
    id: 'coffee',
    name: 'Artisan Studio',
    category: 'Product & Coffee',
    url: coffeeImg,
  },
];

// Clean vector transparent sample logos as SVG Data URIs
const createSvgDataUrl = (svgString: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;

export const SAMPLE_LOGOS = [
  {
    id: 'crest',
    name: 'Apex Emblem',
    category: 'Geometric',
    url: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120">
        <polygon points="60,20 100,85 20,85" fill="none" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" />
        <circle cx="60" cy="58" r="14" fill="#ffffff" />
        <text x="125" y="60" font-family="'Outfit', sans-serif" font-weight="700" font-size="34" fill="#ffffff" letter-spacing="4">APEX</text>
        <text x="126" y="86" font-family="'Inter', sans-serif" font-weight="500" font-size="14" fill="#ffffff" letter-spacing="6" opacity="0.85">STUDIO CO.</text>
      </svg>
    `),
  },
  {
    id: 'lumen',
    name: 'Lumen Wordmark',
    category: 'Minimalist',
    url: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" width="400" height="100">
        <circle cx="45" cy="50" r="28" fill="none" stroke="#ffffff" stroke-width="5" />
        <path d="M45,28 L45,72 M23,50 L67,50" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
        <text x="95" y="58" font-family="'Outfit', sans-serif" font-weight="600" font-size="32" fill="#ffffff" letter-spacing="8">L U M E N</text>
        <text x="97" y="82" font-family="'Inter', sans-serif" font-weight="400" font-size="12" fill="#ffffff" letter-spacing="4" opacity="0.8">CREATIVE LAB</text>
      </svg>
    `),
  },
  {
    id: 'heritage',
    name: 'Heritage Seal',
    category: 'Badge',
    url: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120">
        <rect x="15" y="15" width="290" height="90" rx="8" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="8,4" />
        <text x="160" y="56" text-anchor="middle" font-family="'Outfit', sans-serif" font-weight="700" font-size="28" fill="#ffffff" letter-spacing="5">ORIGINAL</text>
        <text x="160" y="82" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="500" font-size="13" fill="#ffffff" letter-spacing="6" opacity="0.9">· EST. 2026 ·</text>
      </svg>
    `),
  },
];
