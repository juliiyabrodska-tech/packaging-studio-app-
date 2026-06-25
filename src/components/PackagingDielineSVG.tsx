import React from 'react';
import { PackagingSpecs } from '../types';

interface SVGProps {
  specs: PackagingSpecs;
}

export const PackagingDielineSVG: React.FC<SVGProps> = ({ specs }) => {
  const {
    packagingType,
    canDiameter,
    canHeight,
    cartonLength,
    cartonWidth,
    cartonHeight,
    outerMaterial,
    materialWeight,
    approvedOleh,
    approvedSerhiy,
    approvedMaryna,
  } = specs;

  // Let's translate real physical cm to responsive drawing scale.
  // We want to ensure the entire unfolded layout (die-line) fits beautifully within our 800x520 viewport.
  const L = cartonLength;
  const W = cartonWidth;
  const H = cartonHeight;
  const G = 1.6; // Glue flap width in cm

  // Standard engineering line styling
  const cutLineColor = '#E61C24'; // Brand Red for cuts
  const foldLineColor = '#a8a8a9'; // Light gray for folds
  const dimensionColor = '#ffffff'; // White for measurements
  const labelColor = '#8e8e93';

  // Math variables based on selected structure layout to render CAD paths
  let svgContent = null;
  let layoutTitle = '';

  if (packagingType === 'closed_box_2x2') {
    layoutTitle = 'CLOSED CARTON "SHOW-BOX" 2X2 CAD BLOWUP';
    // Left-to-right order of panels: Glue Flap -> Panel 1 (L) -> Panel 2 (W) -> Panel 3 (L) -> Panel 4 (W)
    const totalWidthCm = G + L + W + L + W;
    const totalHeightCm = H + Math.max(L, W) * 1.8; // include top and bottom closure flaps
    
    // Fit scale: map cm to SVG pixels (max width ~640px, max height ~360px)
    const scale = Math.min(620 / totalWidthCm, 340 / totalHeightCm);

    // Center the drawing in our viewport (800x520)
    const startX = 400 - (totalWidthCm * scale) / 2;
    const startY = 240 - (H * scale) / 2;

    const gPx = G * scale;
    const lPx = L * scale;
    const wPx = W * scale;
    const hPx = H * scale;
    const flapDepth = Math.min(L, W) * 0.72 * scale; // closure flap depth

    // Calculate panels X offsets
    const x0 = startX;
    const x1 = x0 + gPx;
    const x2 = x1 + lPx;
    const x3 = x2 + wPx;
    const x4 = x3 + lPx;
    const xEnd = x4 + wPx;

    const yT = startY;
    const yB = startY + hPx;

    svgContent = (
      <g>
        {/* Ambient background shading for the unfolded cardboard sheet */}
        <polygon
          points={`
            ${x1},${yT - flapDepth} ${x2},${yT - flapDepth}
            ${x2},${yT} ${x3},${yT - flapDepth * 0.7} ${x4 - 10},${yT - flapDepth * 0.7}
            ${x4},${yT} ${xEnd},${yT - flapDepth} ${xEnd},${yT}
            ${xEnd},${yB} ${xEnd},${yB + flapDepth} ${x4},${yB}
            ${x3},${yB + flapDepth * 0.7} ${x2},${yB} ${x1},${yB + flapDepth}
            ${x0},${yB} ${x0},${yT + 10}
          `}
          fill="#1c1c1e"
          fillOpacity="0.45"
          stroke="#2c2c2e"
          strokeWidth="1"
        />

        {/* Glue Flap Hatched filling */}
        <defs>
          <pattern id="gluePattern" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#e61c24" strokeWidth="1" strokeOpacity="1" />
          </pattern>
        </defs>
        <polygon
          points={`${x0},${yT + 12} ${x1},${yT} ${x1},${yB} ${x0},${yB - 12}`}
          fill="url(#gluePattern)"
          fillOpacity="0.3"
        />

        {/* --- LINES OF CREASE & FOLD (Dashed lines) --- */}
        {/* Horizontal main crease lines */}
        <line x1={x1} y1={yT} x2={xEnd} y2={yT} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />
        <line x1={x1} y1={yB} x2={xEnd} y2={yB} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />

        {/* Vertical panels foldable joints */}
        <line x1={x1} y1={yT} x2={x1} y2={yB} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />
        <line x1={x2} y1={yT} x2={x2} y2={yB} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />
        <line x1={x3} y1={yT} x2={x3} y2={yB} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />
        <line x1={x4} y1={yT} x2={x4} y2={yB} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />

        {/* Dust flap internal fold creases on top/bottom of panels 2 and 4 */}
        <line x1={x2} y1={yT} x2={x3} y2={yT} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />
        <line x1={x4} y1={yT} x2={xEnd} y2={yT} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />

        {/* --- LINES OF CUT (Solid Red lines) --- */}
        {/* Glue Flap outer border */}
        <path d={`M ${x0},${yT + 12} L ${x1},${yT}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />
        <path d={`M ${x0},${yT + 12} L ${x0},${yB - 12} L ${x1},${yB}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />

        {/* Panel 1 (L) Top & Bottom flaps */}
        {/* Top tuck flap */}
        <path d={`M ${x1},${yT} 
                  L ${x1 + 6},${yT - flapDepth} 
                  A 8,8 0 0,1 ${x1 + 14},${yT - flapDepth - 6} 
                  L ${x2 - 14},${yT - flapDepth - 6} 
                  A 8,8 0 0,1 ${x2 - 6},${yT - flapDepth}
                  L ${x2},${yT}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />
        {/* Bottom tuck flap */}
        <path d={`M ${x1},${yB} 
                  L ${x1 + 6},${yB + flapDepth} 
                  A 8,8 0 0,0 ${x1 + 14},${yB + flapDepth + 6} 
                  L ${x2 - 14},${yB + flapDepth + 6} 
                  A 8,8 0 0,0 ${x2 - 6},${yB + flapDepth}
                  L ${x2},${yB}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />

        {/* Panel 2 (W) Dust Flaps (angled shapes) */}
        <path d={`M ${x2},${yT} L ${x2 + 8},${yT - flapDepth * 0.77} L ${x3 - 8},${yT - flapDepth * 0.77} L ${x3},${yT}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />
        <path d={`M ${x2},${yB} L ${x2 + 8},${yB + flapDepth * 0.77} L ${x3 - 8},${yB + flapDepth * 0.77} L ${x3},${yB}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />

        {/* Panel 3 (L) Top & Bottom flap */}
        <path d={`M ${x3},${yT} 
                  L ${x3 + 6},${yT - flapDepth} 
                  A 8,8 0 0,1 ${x3 + 14},${yT - flapDepth - 6} 
                  L ${x4 - 14},${yT - flapDepth - 6} 
                  A 8,8 0 0,1 ${x4 - 6},${yT - flapDepth}
                  L ${x4},${yT}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />
        <path d={`M ${x3},${yB} 
                  L ${x3 + 6},${yB + flapDepth} 
                  A 8,8 0 0,0 ${x3 + 14},${yB + flapDepth + 6} 
                  L ${x4 - 14},${yB + flapDepth + 6} 
                  A 8,8 0 0,0 ${x4 - 6},${yB + flapDepth}
                  L ${x4},${yB}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />

        {/* Panel 4 (W) Dust Flaps */}
        <path d={`M ${x4},${yT} L ${x4 + 8},${yT - flapDepth * 0.77} L ${xEnd - 8},${yT - flapDepth * 0.77} L ${xEnd},${yT}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />
        <path d={`M ${xEnd},${yT} L ${xEnd},${yB}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />
        <path d={`M ${x4},${yB} L ${x4 + 8},${yB + flapDepth * 0.77} L ${xEnd - 8},${yB + flapDepth * 0.77} L ${xEnd},${yB}`} stroke={cutLineColor} strokeWidth="1.5" fill="none" />

        {/* Circle placements of 4 interior cans represented for scale */}
        <g stroke="#ffffff" strokeDasharray="3 4" strokeOpacity="0.25" fill="none">
          {/* Can position indicator rings underneath Panel 1 and Panel 3 */}
          <circle cx={x1 + lPx * 0.25} cy={yT + hPx * 0.5} r={canDiameter * 0.5 * scale} />
          <circle cx={x1 + lPx * 0.75} cy={yT + hPx * 0.5} r={canDiameter * 0.5 * scale} />
          <circle cx={x3 + lPx * 0.25} cy={yT + hPx * 0.5} r={canDiameter * 0.5 * scale} />
          <circle cx={x3 + lPx * 0.75} cy={yT + hPx * 0.5} r={canDiameter * 0.5 * scale} />
          <text x={x1 + lPx * 0.5} y={yT + hPx * 0.5 + 4} textAnchor="middle" fill="#ffffff" fillOpacity="0.2" fontSize="9" fontFamily="monospace">BOM CAN 1-2</text>
          <text x={x3 + lPx * 0.5} y={yT + hPx * 0.5 + 4} textAnchor="middle" fill="#ffffff" fillOpacity="0.2" fontSize="9" fontFamily="monospace">BOM CAN 3-4</text>
        </g>

        {/* --- DIMENSION ANNOTATIONS --- */}
        {/* Height dimension (Z-axis) - Left Side */}
        <g stroke={dimensionColor} strokeWidth="0.8">
          <line x1={x1 - 25} y1={yT} x2={x1 - 10} y2={yT} />
          <line x1={x1 - 25} y1={yB} x2={x1 - 10} y2={yB} />
          <line x1={x1 - 20} y1={yT} x2={x1 - 20} y2={yB} />
          {/* Arrows */}
          <polygon points={`${x1 - 20},${yT} ${x1 - 23},${yT + 7} ${x1 - 17},${yT + 7}`} fill={dimensionColor} />
          <polygon points={`${x1 - 20},${yB} ${x1 - 23},${yB - 7} ${x1 - 17},${yB - 7}`} fill={dimensionColor} />
        </g>
        <text
          x={x1 - 28}
          y={yT + hPx / 2}
          fill={dimensionColor}
          fontSize="11"
          fontFamily="monospace"
          textAnchor="middle"
          transform={`rotate(-90, ${x1 - 28}, ${yT + hPx / 2})`}
        >
          {`H = ${H.toFixed(1)} cm`}
        </text>

        {/* Panel 1 (L) width - Top Side */}
        <g stroke={dimensionColor} strokeWidth="0.8">
          <line x1={x1} y1={yT - flapDepth - 20} x2={x1} y2={yT - 10} />
          <line x1={x2} y1={yT - flapDepth - 20} x2={x2} y2={yT - 10} />
          <line x1={x1} y1={yT - flapDepth - 15} x2={x2} y2={yT - flapDepth - 15} />
          {/* Arrows */}
          <polygon points={`${x1},${yT - flapDepth - 15} ${x1 + 7},${yT - flapDepth - 18} ${x1 + 7},${yT - flapDepth - 12}`} fill={dimensionColor} />
          <polygon points={`${x2},${yT - flapDepth - 15} ${x2 - 7},${yT - flapDepth - 18} ${x2 - 7},${yT - flapDepth - 12}`} fill={dimensionColor} />
        </g>
        <text
          x={x1 + lPx / 2}
          y={yT - flapDepth - 22}
          fill={dimensionColor}
          fontSize="11"
          fontFamily="monospace"
          textAnchor="middle"
        >
          {`L = ${L.toFixed(1)} cm`}
        </text>

        {/* Panel 2 (W) width - Top Side */}
        <g stroke={dimensionColor} strokeWidth="0.8">
          <line x1={x2} y1={yT - 25} x2={x2} y2={yT - 10} />
          <line x1={x3} y1={yT - 25} x2={x3} y2={yT - 10} />
          <line x1={x2} y1={yT - 20} x2={x3} y2={yT - 20} />
          {/* Arrows */}
          <polygon points={`${x2},${yT - 20} ${x2 + 7},${yT - 23} ${x2 + 7},${yT - 17}`} fill={dimensionColor} />
          <polygon points={`${x3},${yT - 20} ${x3 - 7},${yT - 23} ${x3 - 7},${yT - 17}`} fill={dimensionColor} />
        </g>
        <text
          x={x2 + wPx / 2}
          y={yT - 27}
          fill={dimensionColor}
          fontSize="11"
          fontFamily="monospace"
          textAnchor="middle"
        >
          {`W = ${W.toFixed(1)} cm`}
        </text>

        {/* Glue flap symbol & text */}
        <text x={x0 + gPx / 2} y={yT + hPx / 2} fill="#E61C24" fontSize="10" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90, ${x0 + gPx / 2}, ${yT + hPx / 2})`}>
          GLUE FLAP (ADHESIVE SEAM)
        </text>
        
        {/* Panel Labels */}
        <text x={x1 + lPx / 2} y={yT + 25} fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace" textAnchor="middle">PANEL 1 (L)</text>
        <text x={x2 + wPx / 2} y={yT + 25} fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace" textAnchor="middle">PANEL 2 (W)</text>
        <text x={x3 + lPx / 2} y={yT + 25} fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace" textAnchor="middle">PANEL 3 (L)</text>
        <text x={x4 + wPx / 2} y={yT + 25} fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace" textAnchor="middle">PANEL 4 (W)</text>
      </g>
    );
  } else if (packagingType === 'basket_handle') {
    layoutTitle = 'BASKET CARRIER WITH HANDLE / FLUID BUNDLE CAD';
    // Basket carrier unfolded:
    // Symmetric panels that fold around a central tall handle sheet.
    // Center handle piece (width = L, height = H + handleExtension)
    // Left bottom plate (depth = W/2) -> Left side wall (height = H * 0.6)
    // Right bottom plate (depth = W/2) -> Right side wall (height = H * 0.6)
    const totalWidthCm = L * 1.3 + W * 1.5;
    const totalHeightCm = H * 2.2;
    const scale = Math.min(620 / totalWidthCm, 340 / totalHeightCm);

    const startX = 400 - (L * 1.3 * scale) / 2;
    const startY = 240 - (H * scale);

    const lPx = L * scale;
    const wPx = W * scale;
    const hPx = H * scale;
    const hHalfPx = hPx * 0.55; // side wall height
    const wHalfPx = wPx * 0.48; // bottom plate

    const cx = startX + lPx * 0.65;
    const cy = startY + hPx;

    svgContent = (
      <g>
        {/* Background card path */}
        <path d={`
          M ${cx - lPx/2},${cy - hPx * 1.2} 
          L ${cx + lPx/2},${cy - hPx * 1.2} 
          L ${cx + lPx/2},${cy - hPx * 0.2}
          L ${cx + lPx/2 + hHalfPx},${cy - hPx * 0.2}
          L ${cx + lPx/2 + hHalfPx},${cy + wHalfPx}
          L ${cx + lPx/2},${cy + wHalfPx}
          L ${cx + lPx/2},${cy + hPx * 0.7}
          L ${cx - lPx/2},${cy + hPx * 0.7}
          L ${cx - lPx/2},${cy + wHalfPx}
          L ${cx - lPx/2 - hHalfPx},${cy + wHalfPx}
          L ${cx - lPx/2 - hHalfPx},${cy - hPx * 0.2}
          L ${cx - lPx/2},${cy - hPx * 0.2}
          Z
        `} fill="#1c1c1e" fillOpacity="0.4" stroke={cutLineColor} strokeWidth="1.5" />

        {/* Central fold lines separating handle from bottom plates */}
        <line x1={cx - lPx/2} y1={cy - hPx*0.2} x2={cx + lPx/2} y2={cy - hPx*0.2} stroke={foldLineColor} strokeDasharray="5 3" />
        <line x1={cx - lPx/2} y1={cy + wHalfPx} x2={cx + lPx/2} y2={cy + wHalfPx} stroke={foldLineColor} strokeDasharray="5 3" />
        <line x1={cx - lPx/2} y1={cy} x2={cx + lPx/2} y2={cy} stroke={foldLineColor} strokeDasharray="5 3" />

        {/* Handle punching hole */}
        <rect
          x={cx - 35}
          y={cy - hPx * 0.85}
          width="70"
          height="22"
          rx="11"
          ry="11"
          stroke={cutLineColor}
          strokeWidth="1.5"
          fill="#0d0d0f"
        />

        {/* Round slots representing can sits in basket bottom */}
        <g stroke="#ffffff" strokeDasharray="3 3" strokeOpacity="0.3" fill="none">
          <circle cx={cx - lPx * 0.25} cy={cy - hPx * 0.1} r={canDiameter * 0.45 * scale} />
          <circle cx={cx + lPx * 0.25} cy={cy - hPx * 0.1} r={canDiameter * 0.45 * scale} />
          <circle cx={cx - lPx * 0.25} cy={cy + wHalfPx * 0.5} r={canDiameter * 0.45 * scale} />
          <circle cx={cx + lPx * 0.25} cy={cy + wHalfPx * 0.5} r={canDiameter * 0.45 * scale} />
        </g>

        {/* Technical crosslines for center partition */}
        <line x1={cx} y1={cy - hPx * 1.2} x2={cx} y2={cy + hPx * 0.7} stroke="#ffffff" strokeDasharray="20 4 2 4" strokeOpacity="0.1" />

        {/* Dimension Lines */}
        {/* Width Dimension */}
        <g stroke={dimensionColor} strokeWidth="0.8">
          <line x1={cx - lPx*0.5} y1={cy + hPx * 0.85} x2={cx - lPx*0.5} y2={cy + hPx * 1.05} />
          <line x1={cx + lPx*0.5} y1={cy + hPx * 0.85} x2={cx + lPx*0.5} y2={cy + hPx * 1.05} />
          <line x1={cx - lPx*0.5} y1={cy + hPx * 0.95} x2={cx + lPx*0.5} y2={cy + hPx * 0.95} />
          <polygon points={`${cx - lPx*0.5},${cy + hPx * 0.95} ${cx - lPx*0.5 + 7},${cy + hPx * 0.92} ${cx - lPx*0.5 + 7},${cy + hPx * 0.98}`} fill={dimensionColor} />
          <polygon points={`${cx + lPx*0.5},${cy + hPx * 0.95} ${cx + lPx*0.5 - 7},${cy + hPx * 0.92} ${cx + lPx*0.5 - 7},${cy + hPx * 0.98}`} fill={dimensionColor} />
        </g>
        <text x={cx} y={cy + hPx * 1.15} fill={dimensionColor} fontSize="11" fontFamily="monospace" textAnchor="middle">
          {`L = ${L.toFixed(1)} cm`}
        </text>

        {/* Heights and handles */}
        <text x={cx} y={cy - hPx * 0.95} fill="#ffffff" fillOpacity="0.5" fontSize="10" fontFamily="monospace" textAnchor="middle">
          CENTER SPLITTER HANDLE PANEL
        </text>
        <text x={cx - lPx * 0.25} y={cy + wHalfPx * 1.6} fill={labelColor} fontSize="9" fontFamily="monospace" textAnchor="middle">
          CELL CRADLE 1-2
        </text>
        <text x={cx + lPx * 0.25} y={cy - hPx * 0.45} fill={labelColor} fontSize="9" fontFamily="monospace" textAnchor="middle">
          CELL CRADLE 3-4
        </text>
      </g>
    );
  } else {
    layoutTitle = 'TENSION SLEEVE WRAP / CARDBOARD SLEEVE TEMPLATE';
    // Sleeve pack unfolded: just 4 horizontal panels.
    // Length -> Height -> Length -> Height + Glue Flap.
    const totalWidthCm = L * 2 + H * 2 + G;
    const totalHeightCm = W * 1.1;

    const scale = Math.min(620 / totalWidthCm, 340 / totalHeightCm);

    const startX = 400 - (totalWidthCm * scale) / 2;
    const startY = 240 - (totalHeightCm * scale) / 2;

    const lPx = L * scale;
    const wPx = W * scale;
    const hPx = H * scale;
    const gPx = G * scale;

    const x0 = startX;
    const x1 = x0 + gPx;
    const x2 = x1 + lPx;
    const x3 = x2 + hPx;
    const x4 = x3 + lPx;
    const xEnd = x4 + hPx;

    const yT = startY;
    const yB = yT + wPx;

    svgContent = (
      <g>
        {/* Overlapping cardboard sleeve path outline */}
        <polygon
          points={`
            ${x0},${yT + 12} ${x1},${yT} ${xEnd},${yT}
            ${xEnd},${yB} ${x1},${yB} ${x0},${yB - 12}
          `}
          fill="#1c1c1e"
          fillOpacity="0.45"
          stroke={cutLineColor}
          strokeWidth="1.5"
        />

        {/* Crease folds */}
        <line x1={x1} y1={yT} x2={x1} y2={yB} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />
        <line x1={x2} y1={yT} x2={x2} y2={yB} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />
        <line x1={x3} y1={yT} x2={x3} y2={yB} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />
        <line x1={x4} y1={yT} x2={x4} y2={yB} stroke={foldLineColor} strokeDasharray="5 3" strokeWidth="1.2" />

        {/* Glue tab background */}
        <polygon points={`${x0},${yT+12} ${x1},${yT} ${x1},${yB} ${x0},${yB-12}`} fill="url(#gluePattern)" fillOpacity="0.3" />

        {/* Finger Holes on top panel */}
        {specs.fingerHoles && (
          <g fill="#0b0b0c" stroke={cutLineColor} strokeWidth="1.2">
            <circle cx={x2 + hPx * 0.3} cy={yT + wPx * 0.5} r={14} />
            <circle cx={x2 + hPx * 0.7} cy={yT + wPx * 0.5} r={14} />
            <text x={x2 + hPx * 0.5} y={yT + wPx * 0.5 + 4} textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="8" fontFamily="monospace">HANDLE</text>
          </g>
        )}

        {/* Can footprint guidelines indicating can positioning */}
        <g stroke="#ffffff" strokeDasharray="3 4" strokeOpacity="0.2" fill="none">
          <circle cx={x1 + lPx * 0.28} cy={yB - wPx * 0.28} r={canDiameter * 0.44 * scale} />
          <circle cx={x1 + lPx * 0.28} cy={yB - wPx * 0.72} r={canDiameter * 0.44 * scale} />
          <circle cx={x1 + lPx * 0.72} cy={yB - wPx * 0.28} r={canDiameter * 0.44 * scale} />
          <circle cx={x1 + lPx * 0.72} cy={yB - wPx * 0.72} r={canDiameter * 0.44 * scale} />
        </g>

        {/* Dimension labels */}
        <g stroke={dimensionColor} strokeWidth="0.8">
          <line x1={x1} y1={yT - 15} x2={x2} y2={yT - 15} />
          <polygon points={`${x1},${yT - 15} ${x1+7},${yT-18} ${x1+7},${yT-12}`} fill={dimensionColor} />
          <polygon points={`${x2},${yT - 15} ${x2-7},${yT-18} ${x2-7},${yT-12}`} fill={dimensionColor} />
          
          <line x1={x2} y1={yT - 15} x2={x3} y2={yT - 15} />
          <polygon points={`${x2},${yT - 15} ${x2+7},${yT-18} ${x2+7},${yT-12}`} fill={dimensionColor} />
          <polygon points={`${x3},${yT - 15} ${x3-7},${yT-18} ${x3-7},${yT-12}`} fill={dimensionColor} />
        </g>
        <text x={x1 + lPx/2} y={yT - 22} fill={dimensionColor} fontSize="11" fontFamily="monospace" textAnchor="middle">
          {`L = ${L.toFixed(1)} cm`}
        </text>
        <text x={x2 + hPx/2} y={yT - 22} fill={dimensionColor} fontSize="11" fontFamily="monospace" textAnchor="middle">
          {`H = ${H.toFixed(1)} cm`}
        </text>

        <text x={x1 + lPx / 2} y={yB - 12} fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace" textAnchor="middle">BASE PANEL</text>
        <text x={x2 + hPx / 2} y={yB - 12} fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace" textAnchor="middle">WALL PANEL 1</text>
        <text x={x3 + lPx / 2} y={yB - 12} fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace" textAnchor="middle">TOP PANEL</text>
        <text x={x4 + hPx / 2} y={yB - 12} fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace" textAnchor="middle">WALL PANEL 2</text>
      </g>
    );
  }

  // Generate some subtle blueprint background details: scale lines, calibration crosses
  return (
    <div className="relative w-full h-full bg-[#0d0d0f] rounded-lg border border-coke-border overflow-hidden select-none">
      
      {/* Top action status panel with industrial feel */}
      <div className="absolute top-0 left-0 right-0 h-9 bg-coke-black border-b border-coke-border flex items-center justify-between px-3 z-10">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-coke-red rounded-full blink-dot"></span>
          <span className="text-xs font-mono tracking-widest text-white font-bold">{layoutTitle}</span>
        </div>
        <div className="text-[10px] font-mono text-coke-gray space-x-3">
          <span>SCALE: 1:2.3</span>
          <span>UNITS: CM</span>
        </div>
      </div>

      {/* Main vector viewport area */}
      <div className="blueprint-grid w-full h-full pt-9 pb-16 flex items-center justify-center">
        <svg 
          id="dieline-pdf-svg"
          viewBox="0 0 800 500" 
          className="w-full h-full max-h-[460px] p-2"
        >
          {/* Grid target markings in 4 corners of viewport */}
          <g stroke="#E61C24" strokeWidth="0.5" strokeOpacity="0.4" fill="none">
            {/* Top-Left */}
            <circle cx="20" cy="20" r="8" />
            <line x1="20" y1="8" x2="20" y2="32" />
            <line x1="8" y1="20" x2="32" y2="20" />
            {/* Top-Right */}
            <circle cx="780" cy="20" r="8" />
            <line x1="780" y1="8" x2="780" y2="32" />
            <line x1="768" y1="20" x2="792" y2="20" />
            {/* Bottom-Left */}
            <circle cx="20" cy="480" r="8" />
            <line x1="20" y1="468" x2="20" y2="492" />
            <line x1="8" y1="480" x2="32" y2="480" />
            {/* Bottom-Right */}
            <circle cx="780" cy="480" r="8" />
            <line x1="780" y1="468" x2="780" y2="492" />
            <line x1="768" y1="480" x2="792" y2="480" />
          </g>

          {/* Render layout spec */}
          {svgContent}

          {/* Technical side ruler ticks on left and bottom */}
          <g stroke="#ffffff" strokeOpacity="0.1" strokeWidth="0.8">
            {Array.from({ length: 40 }).map((_, i) => (
              <line 
                key={`tick-${i}`}
                x1="12" 
                y1={30 + i * 11.5} 
                x2={i % 5 === 0 ? "24" : "18"} 
                y2={30 + i * 11.5} 
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Master Engineering Block / Legend block */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#000000] border-t border-coke-border grid grid-cols-4 select-none font-mono text-[9px] text-white">
        <div className="border-r border-coke-border p-1.5 flex flex-col justify-between">
          <div className="text-coke-gray text-[8px] uppercase">CUSTOMER BUILD:</div>
          <div className="font-bold text-coke-red select-all truncate">CRAFT 4x0.5L MATTE</div>
          <div className="text-[7px] text-coke-gray">DATE: {new Date().toLocaleDateString('en-US')}</div>
        </div>
        <div className="border-r border-coke-border p-1.5 flex flex-col justify-between">
          <div className="text-coke-gray text-[8px] uppercase">PACKAGING BOARD:</div>
          <div className="truncate font-medium">{outerMaterial === 'pure_kraft' ? 'Ultra Kraft Board' : outerMaterial === 'solid_sulfate' ? 'Sulfate Premium SBB' : outerMaterial === 'sbb_kraft' ? 'Slightly Recycled SUB' : 'Recycled Economy GD2'}</div>
          <div>GRAMMAGE CELL WEIGHT: <span className="text-coke-red text-[10px] font-bold">{materialWeight}</span></div>
        </div>
        <div className="border-r border-coke-border p-1.5 flex flex-col justify-between">
          <div className="text-coke-gray text-[8px] uppercase">TEAM SIGN-OFF STATUS:</div>
          <div className="flex space-x-2 items-center">
            <span className={`w-1.5 h-1.5 rounded-full ${approvedOleh ? 'bg-emerald-500' : 'bg-coke-red animate-pulse'}`}></span>
            <span>BM {approvedOleh ? '✓' : '✗'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${approvedSerhiy ? 'bg-emerald-500' : 'bg-coke-red animate-pulse'}`}></span>
            <span>FL {approvedSerhiy ? '✓' : '✗'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${approvedMaryna ? 'bg-emerald-500' : 'bg-coke-red animate-pulse'}`}></span>
            <span>ML {approvedMaryna ? '✓' : '✗'}</span>
          </div>
          <div className="text-[8px] tracking-tight">{approvedOleh && approvedSerhiy && approvedMaryna ? <span className="text-emerald-400 font-bold">SPECS APPROVED✓</span> : <span className="text-coke-red font-bold">BLOCKED: AWAITING SIGN</span>}</div>
        </div>
        <div className="p-1.5 flex flex-col justify-between bg-coke-black">
          <div className="text-[8px] text-coke-gray">CAD APP IDENT:</div>
          <div className="font-extrabold text-[#ffffff] select-none text-[10px] tracking-tighter leading-snug">
            HUD PACKCRAFT KR-4T
          </div>
          <div className="text-[7px] text-coke-gray text-right">SHEET 1 OF 2</div>
        </div>
      </div>
    </div>
  );
};
