export type PackagingType = 'closed_box_2x2' | 'basket_handle' | 'sleeve_pack';

export interface PackagingSpecs {
  packagingType: PackagingType;
  canDiameter: number; // in cm
  canHeight: number; // in cm
  cartonLength: number; // in cm (X-axis)
  cartonWidth: number; // in cm (Y-axis)
  cartonHeight: number; // in cm (Z-axis)
  containerMaterial: 'aluminium' | 'glass' | 'pet';
  outerMaterial: 'sbb_kraft' | 'solid_sulfate' | 'recyclable_gd2' | 'pure_kraft';
  materialWeight: string; // e.g. "350 г/м²", "400 г/м²"
  materialThickness: string; // e.g. "0.55 мм", "0.62 мм"
  printingMethod: 'offset' | 'flexo' | 'digital';
  colorsCount: number; // 1-8
  coatingOption: 'matte' | 'gloss' | 'uv_selective' | 'soft_touch' | 'none';
  
  // Custom 4 flavors
  flavor1: string;
  flavor2: string;
  flavor3: string;
  flavor4: string;

  // Additional components
  reinforcedBottom: boolean;
  fingerHoles: boolean;
  flavorDividers: boolean;
  moistureBarrier: boolean;
  tearPerforation: boolean;

  // Approvals
  approvedOleh: boolean;
  approvedSerhiy: boolean;
  approvedMaryna: boolean;
  
  // Custom log
  notes: string;
}

export const INITIAL_SPECS: PackagingSpecs = {
  packagingType: 'closed_box_2x2',
  canDiameter: 6.63, // standard 500ml can diameter is ~6.63cm (or 66mm)
  canHeight: 16.8, // standard 500ml can height is ~16.8cm (or 168mm)
  cartonLength: 13.5, // 2 * canDiameter + tolerances (approx 13.5cm)
  cartonWidth: 13.5, // 2 * canDiameter + tolerances (approx 13.5cm)
  cartonHeight: 17.0, // canHeight + tolerances (approx 17.0cm)
  containerMaterial: 'aluminium',
  outerMaterial: 'pure_kraft',
  materialWeight: '380 g/m²',
  materialThickness: '0.58 mm',
  printingMethod: 'offset',
  colorsCount: 5, // e.g. CMYK + Pantone Red
  coatingOption: 'matte',
  
  // Varieties (4 flavors)
  flavor1: 'Cherry Berry Classic',
  flavor2: 'Mad Lime-Mint',
  flavor3: 'Forest Berries Zero',
  flavor4: 'Caribbean Spicy Orange',

  reinforcedBottom: true,
  fingerHoles: true,
  flavorDividers: true,
  moistureBarrier: false,
  tearPerforation: true,

  approvedOleh: false,
  approvedSerhiy: false,
  approvedMaryna: false,
  
  notes: 'Experimental promo assortments for the summer festival. Custom red-black premium palette, premium matte board lamination.'
};
