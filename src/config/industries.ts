import { IndustryId } from '../types';

// An IndustryProfile re-labels the whole studio for a given business vertical
// WITHOUT changing the underlying geometry engine. It turns the app from a
// single-purpose "4x0.5L beverage cans" tool into a configurable packaging
// studio that speaks the language of each industry.
export interface IndustryProfile {
  id: IndustryId;
  label: string;            // shown in the industry selector
  tagline: string;          // header subtitle
  productNoun: string;      // the contained unit, e.g. "Can", "Jar", "Item"
  volumeLabel: string;      // e.g. "0.5 L", "50 ml", "—"
  primaryDimLabel: string;  // label for the first product dimension input
  secondaryDimLabel: string;// label for the second product dimension input
  variantNoun: string;      // e.g. "Flavor", "Shade", "SKU"
  variantLabels: [string, string, string, string]; // per-cell labels (A–D)
  defaultVariants: [string, string, string, string]; // default variant names
}

export const INDUSTRIES: IndustryProfile[] = [
  {
    id: 'beverage',
    label: 'Beverages (cans / bottles)',
    tagline: 'PROFESSIONAL PACKAGING CAD & 3D DESIGN STUDIO • 4-UNIT VARIETY PACK',
    productNoun: 'Can',
    volumeLabel: '0.5 L',
    primaryDimLabel: 'Can Diameter (cm):',
    secondaryDimLabel: 'Can Height (cm):',
    variantNoun: 'Flavor',
    variantLabels: [
      '1. Flavor Red (Can A):',
      '2. Flavor Green (Can B):',
      '3. Flavor Violet (Can C):',
      '4. Flavor Gold (Can D):',
    ],
    defaultVariants: ['Cherry Berry Classic', 'Mad Lime-Mint', 'Forest Berries Zero', 'Caribbean Spicy Orange'],
  },
  {
    id: 'cosmetics',
    label: 'Cosmetics (jars / tubes)',
    tagline: 'PACKAGING CAD & 3D STUDIO • COSMETICS RETAIL SET',
    productNoun: 'Container',
    volumeLabel: '50 ml',
    primaryDimLabel: 'Container Diameter (cm):',
    secondaryDimLabel: 'Container Height (cm):',
    variantNoun: 'Shade',
    variantLabels: [
      '1. Shade (Unit A):',
      '2. Shade (Unit B):',
      '3. Shade (Unit C):',
      '4. Shade (Unit D):',
    ],
    defaultVariants: ['Rose Nude', 'Coral Blush', 'Berry Matte', 'Golden Glow'],
  },
  {
    id: 'food',
    label: 'Food (jars / boxes)',
    tagline: 'PACKAGING CAD & 3D STUDIO • FOOD ASSORTMENT PACK',
    productNoun: 'Jar',
    volumeLabel: '250 g',
    primaryDimLabel: 'Jar Diameter (cm):',
    secondaryDimLabel: 'Jar Height (cm):',
    variantNoun: 'Flavor',
    variantLabels: [
      '1. Flavor (Unit A):',
      '2. Flavor (Unit B):',
      '3. Flavor (Unit C):',
      '4. Flavor (Unit D):',
    ],
    defaultVariants: ['Classic Original', 'Spicy Chili', 'Garden Herb', 'Sweet & Sour'],
  },
  {
    id: 'ecommerce',
    label: 'E-commerce (shipping)',
    tagline: 'PACKAGING CAD & 3D STUDIO • E-COMMERCE SHIPPER',
    productNoun: 'Item',
    volumeLabel: '—',
    primaryDimLabel: 'Item Width (cm):',
    secondaryDimLabel: 'Item Height (cm):',
    variantNoun: 'SKU',
    variantLabels: [
      '1. SKU (Slot A):',
      '2. SKU (Slot B):',
      '3. SKU (Slot C):',
      '4. SKU (Slot D):',
    ],
    defaultVariants: ['SKU-001', 'SKU-002', 'SKU-003', 'SKU-004'],
  },
  {
    id: 'pharma',
    label: 'Pharma (bottles / blisters)',
    tagline: 'PACKAGING CAD & 3D STUDIO • PHARMA SECONDARY PACK',
    productNoun: 'Bottle',
    volumeLabel: '100 ml',
    primaryDimLabel: 'Bottle Diameter (cm):',
    secondaryDimLabel: 'Bottle Height (cm):',
    variantNoun: 'Dosage',
    variantLabels: [
      '1. Dosage (Unit A):',
      '2. Dosage (Unit B):',
      '3. Dosage (Unit C):',
      '4. Dosage (Unit D):',
    ],
    defaultVariants: ['250 mg', '500 mg', 'Forte', 'Junior'],
  },
  {
    id: 'generic',
    label: 'Generic / other',
    tagline: 'PROFESSIONAL PACKAGING CAD & 3D DESIGN STUDIO • UNIVERSAL PACK',
    productNoun: 'Unit',
    volumeLabel: '—',
    primaryDimLabel: 'Unit Width (cm):',
    secondaryDimLabel: 'Unit Height (cm):',
    variantNoun: 'Variant',
    variantLabels: [
      '1. Variant (Slot A):',
      '2. Variant (Slot B):',
      '3. Variant (Slot C):',
      '4. Variant (Slot D):',
    ],
    defaultVariants: ['Variant A', 'Variant B', 'Variant C', 'Variant D'],
  },
];

export const DEFAULT_INDUSTRY_ID: IndustryId = 'beverage';

export const getIndustry = (id: IndustryId | undefined): IndustryProfile =>
  INDUSTRIES.find((i) => i.id === id) || INDUSTRIES[0];
