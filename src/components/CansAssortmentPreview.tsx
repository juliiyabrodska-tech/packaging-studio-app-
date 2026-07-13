import React, { useState } from 'react';
import { PackagingSpecs } from '../types';
import { getIndustry, UnitShape } from '../config/industries';
import { Rotate3d, Sun, Eye, Sliders, Sparkles, Activity } from 'lucide-react';

interface PreviewProps {
  specs: PackagingSpecs;
}

type RenderEnvironment = 'blueprint' | 'studio' | 'production';

// Per-unit accent palette (A–D). Full literal class strings so Tailwind's JIT
// scanner can see them.
interface Accent {
  grad: string;
  border: string;
  text: string;
  labelBorder: string;
}
const ACCENTS: Accent[] = [
  { grad: 'from-red-950 via-[#E61C24] to-red-950', border: 'border-red-500/20', text: 'text-coke-red', labelBorder: 'border-red-500/30' },
  { grad: 'from-emerald-950 via-emerald-600 to-emerald-950', border: 'border-emerald-500/20', text: 'text-emerald-400', labelBorder: 'border-emerald-500/30' },
  { grad: 'from-purple-950 via-purple-600 to-purple-950', border: 'border-purple-500/20', text: 'text-purple-400', labelBorder: 'border-purple-500/30' },
  { grad: 'from-amber-950 via-amber-600 to-amber-950', border: 'border-amber-500/20', text: 'text-amber-500', labelBorder: 'border-amber-500/30' },
];

// Body geometry per archetype (height + rounding), plus which top cap and
// whether a rounded base foot is drawn.
const SHAPE_CFG: Record<UnitShape, { body: string; top: 'lid' | 'cap' | 'jarlid' | 'flap' | 'crimp'; bottom: boolean }> = {
  can: { body: 'w-16 h-36 rounded-lg', top: 'lid', bottom: true },
  bottle: { body: 'w-16 h-32 rounded-lg rounded-t-2xl', top: 'cap', bottom: true },
  jar: { body: 'w-[68px] h-24 rounded-md', top: 'jarlid', bottom: false },
  box: { body: 'w-16 h-32 rounded-sm', top: 'flap', bottom: false },
  pouch: { body: 'w-16 h-36 rounded-b-3xl rounded-t-lg', top: 'crimp', bottom: false },
};

const GlossHighlights: React.FC<{ gloss: number }> = ({ gloss }) => (
  <>
    <div className="absolute left-1.5 top-0 bottom-0 w-2.5 bg-white/20 blur-[1px] pointer-events-none rounded-l" style={{ opacity: gloss / 100 }} />
    <div className="absolute right-3 top-0 bottom-0 w-1 bg-white/10 blur-[1.5px] pointer-events-none" style={{ opacity: gloss / 120 }} />
  </>
);

const TopCap: React.FC<{ kind: string }> = ({ kind }) => {
  switch (kind) {
    case 'lid':
      return (
        <div className="absolute -top-1.5 left-1 right-1 h-2.5 bg-zinc-400 rounded-t-full border border-zinc-200 flex items-center justify-center z-20">
          <div className="w-4 h-1 bg-zinc-600 rounded-full" />
        </div>
      );
    case 'cap':
      return (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <div className="w-4 h-2 bg-zinc-300 rounded-t-md border border-zinc-400" />
          <div className="w-5 h-2 bg-gradient-to-b from-zinc-500 to-zinc-700 border-x border-zinc-600" />
        </div>
      );
    case 'jarlid':
      return <div className="absolute -top-2 left-0 right-0 h-3 bg-zinc-300 rounded-t-md border border-zinc-400 z-20" />;
    case 'flap':
      return <div className="absolute top-0 left-0 right-0 h-3 bg-black/25 border-b border-white/25 z-20" />;
    case 'crimp':
      return <div className="absolute -top-1 left-0 right-0 h-2 bg-zinc-500/60 border-y border-dashed border-white/40 z-20" />;
    default:
      return null;
  }
};

interface UnitCardProps {
  shape: UnitShape;
  accent: Accent;
  name: string;
  index: number;
  gloss: number;
  showWireframe: boolean;
  productNoun: string;
  unitTag: string;
  artwork?: string;
}

const UnitCard: React.FC<UnitCardProps> = ({ shape, accent, name, index, gloss, showWireframe, productNoun, unitTag, artwork }) => {
  const cfg = SHAPE_CFG[shape];
  const fallback = `${productNoun} ${index + 1}`;
  const hasArt = !!artwork;
  return (
    <div className="flex flex-col items-center group">
      <div className="relative flex items-end justify-center h-[150px]">
        <div
          className={`relative ${cfg.body} ${hasArt ? '' : `bg-gradient-to-r ${accent.grad}`} p-1.5 flex flex-col justify-between shadow-lg transition-all duration-200 ${
            showWireframe ? 'border-2 border-dashed border-emerald-500' : `border ${accent.border}`
          }`}
          style={hasArt ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.45)), url(${artwork})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          <GlossHighlights gloss={gloss} />
          <TopCap kind={cfg.top} />

          <div className="text-[7.5px] font-mono text-zinc-300 font-bold tracking-tight uppercase leading-none mt-1 relative z-10">
            {productNoun} {String(index + 1).padStart(2, '0')}
          </div>
          <div className="flex-1 flex items-center justify-center py-1 relative z-10">
            <div className={`rotate-90 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded border ${accent.labelBorder} whitespace-nowrap font-mono max-w-[90px] truncate text-center font-extrabold tracking-wide`}>
              {name || fallback}
            </div>
          </div>
          <div className="bg-black/50 text-white text-[7px] font-mono py-0.5 rounded text-center font-bold tracking-wider relative z-10">
            {unitTag}
          </div>

          {cfg.bottom && <div className="absolute -bottom-1 left-1.5 right-1.5 h-1.5 bg-zinc-500 rounded-b-full" />}
        </div>
      </div>
      <span className={`text-[9px] font-mono ${accent.text} mt-2.5 font-bold text-center truncate w-full`}>{name || fallback}</span>
    </div>
  );
};

export const CansAssortmentPreview: React.FC<PreviewProps> = ({ specs }) => {
  const {
    flavor1,
    flavor2,
    flavor3,
    flavor4,
    canDiameter,
    canHeight,
    packagingType,
    outerMaterial,
  } = specs;

  const industry = getIndustry(specs.industry);
  const productNoun = industry.productNoun;
  const shape = industry.unitShape;
  const volumeLabel = industry.volumeLabel;
  const unitTag = volumeLabel !== '—' ? volumeLabel : productNoun.toUpperCase();
  const names = [flavor1, flavor2, flavor3, flavor4];
  const artwork = specs.artworkUrl || undefined;

  // Multi-state configuration for ultimate Upwork portfolio impact
  const [rotation, setRotation] = useState<number>(-5);
  const [tilt, setTilt] = useState<number>(6);
  const [gloss, setGloss] = useState<number>(75);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [env, setEnv] = useState<RenderEnvironment>('blueprint');

  // Interactive helper to calculate colors based on selected style
  const getGridStyle = () => {
    switch (env) {
      case 'studio':
        return 'bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950';
      case 'production':
        return 'bg-[#050B14] relative after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_center,rgba(29,78,216,0.15),transparent_70%)]';
      default: // blueprint
        return 'blueprint-grid';
    }
  };

  const resetControls = () => {
    setRotation(-5);
    setTilt(6);
    setGloss(75);
    setShowWireframe(false);
    setEnv('blueprint');
  };

  return (
    <div className="w-full h-full bg-[#0d0d0f] rounded-lg border border-coke-border overflow-hidden flex flex-col justify-between">

      {/* Viewport header */}
      <div className="h-10 bg-coke-black border-b border-coke-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono tracking-widest text-white font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-coke-red" />
            <span>INTELLIGENT 3D PORTFOLIO PREVIEW / CAD SIMULATOR</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[9px] bg-zinc-900 border border-zinc-805 text-zinc-400 font-mono px-1.5 py-0.5 rounded uppercase">{env} MODE</span>
          <span className="text-[10px] font-mono text-coke-gray hidden sm:inline">4 × {volumeLabel} {productNoun.toUpperCase()}S</span>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-coke-black/90 border-b border-coke-border/80 p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs font-mono select-none">

        {/* Rotation & Tilt */}
        <div className="sm:col-span-5 space-y-2 border-r border-coke-border/40 pr-0.5 sm:pr-3">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1"><Rotate3d className="w-3.5 h-3.5 text-coke-red" /> 3D ROTATION & PERSPECTIVE</span>
            <span className="text-white font-bold">YAW {rotation}° / PIT {tilt}°</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] text-zinc-500">
                <span>YAW: Horizontal</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full accent-coke-red h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] text-zinc-500">
                <span>PITCH: Vertical</span>
              </div>
              <input
                type="range"
                min="-15"
                max="25"
                value={tilt}
                onChange={(e) => setTilt(parseInt(e.target.value))}
                className="w-full accent-coke-red h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Lighting & Wireframe toggles */}
        <div className="sm:col-span-4 space-y-2 border-r border-coke-border/40 px-0 sm:px-2">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-yellow-500" /> GLOSS & REFLECTION</span>
            <span className="text-white font-bold">{gloss}%</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="100"
              value={gloss}
              onChange={(e) => setGloss(parseInt(e.target.value))}
              className="flex-1 accent-coke-red h-1 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <button
              onClick={() => setShowWireframe(!showWireframe)}
              className={`px-2 py-1 rounded text-[9px] border font-bold flex items-center gap-1 transition-all cursor-pointer ${
                showWireframe
                  ? 'bg-coke-red/25 border-coke-red text-white'
                  : 'bg-zinc-900 border-zinc-800 text-coke-gray hover:text-white'
              }`}
              title="Apply technical CAD measurements wireframe on units"
            >
              <Eye className="w-3 h-3" />
              <span>GRID</span>
            </button>
          </div>
        </div>

        {/* Environment presets switch */}
        <div className="sm:col-span-3 space-y-2 flex flex-col justify-between pl-0 sm:pl-2">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> STAGE CONTEXT</span>
          <div className="flex gap-1">
            {(['blueprint', 'studio', 'production'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setEnv(mode)}
                className={`flex-1 py-1 text-[8px] font-bold rounded border uppercase cursor-pointer transition-all ${
                  env === mode
                    ? 'bg-zinc-800 border-zinc-700 text-white font-extrabold'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {mode === 'blueprint' ? 'GRID' : mode === 'studio' ? 'STUDIO' : 'PROD'}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Main viewport visual area */}
      <div className={`flex-1 flex flex-col items-center justify-center p-4 transition-colors duration-300 ${getGridStyle()}`}>

        {/* Outer simulation box representation */}
        <div
          className="relative w-full max-w-lg p-6 bg-coke-black/95 rounded-xl border border-coke-border/90 backdrop-blur-md shadow-2xl flex flex-col items-center transition-all duration-300"
          style={{
            transform: `perspective(1000px) rotateY(${rotation}deg) rotateX(${tilt}deg)`,
            transformStyle: 'preserve-3d',
            boxShadow: showWireframe
              ? '0 25px 50px -12px rgba(230, 28, 36, 0.15)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}
        >

          <div className="absolute top-2.5 left-3 font-mono text-[8px] text-coke-red font-semibold tracking-wider flex items-center gap-1">
            <Sliders className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>[ 3D PORTRAYAL ENGINE V0.5 • PREMIUM CO-BRANDING RENDER ]</span>
          </div>

          {/* Data-driven retail-unit assortment (shape adapts to industry) */}
          <div className="relative w-full grid grid-cols-4 gap-3 py-6 mt-3 z-10" style={{ transform: 'translateZ(15px)' }}>
            {names.map((name, i) => (
              <UnitCard
                key={i}
                shape={shape}
                accent={ACCENTS[i]}
                name={name}
                index={i}
                gloss={gloss}
                showWireframe={showWireframe}
                productNoun={productNoun}
                unitTag={unitTag}
                artwork={artwork}
              />
            ))}
          </div>

          {/* Outer packaging sleeve cutaway line */}
          <div
            className={`absolute left-4 right-4 bottom-14 top-14 bg-white/5 border rounded-lg pointer-events-none flex flex-col justify-between p-2.5 transition-all duration-300 ${
              showWireframe ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(230,28,36,0.3)]' : 'border-white/20'
            }`}
            style={{ transform: 'translateZ(25px)' }}
          >
            <div className="flex justify-between text-[7px] font-mono text-white/50 bg-[#0d0d0f]/90 px-1 py-0.5 rounded scale-90 -translate-y-1">
              <span>{`MAT: ${outerMaterial.toUpperCase()}`}</span>
              <span>{`TYPE: ${packagingType.toUpperCase()}`}</span>
            </div>

            {showWireframe && (
              <div className="text-[6.5px] font-mono text-red-400 absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 pointer-events-none leading-none gap-0.5">
                <div>// DIELINE COLLISION BOUNDARY</div>
                <div className="font-bold border border-red-500/50 px-1 py-0.5 mt-1 bg-black">
                  L:{(canDiameter * 2).toFixed(1)}cm x W:{(canDiameter * 2).toFixed(1)}cm x H:{canHeight}cm
                </div>
              </div>
            )}

            <div className="border-t border-dashed border-white/30 text-[8px] font-mono text-white/70 text-center uppercase py-0.5 tracking-wider bg-black/80 rounded">
              {packagingType === 'closed_box_2x2' ? 'CLOSED BOX' : packagingType === 'basket_handle' ? 'CARRIER WITH HANDLE' : 'SLEEVE WRAP'} • {canDiameter}x{canHeight} CM BUNDLE
            </div>
          </div>

          {/* Overlay CAD Measurements when wireframe is active */}
          {showWireframe && (
            <div className="absolute inset-0 border border-emerald-500/50 pointer-events-none rounded-xl">
              <div className="absolute top-1 right-2 font-mono text-[7px] text-emerald-400">FPS: 60.00 / RENDERING: OK</div>
              <div className="absolute bottom-2 left-3 font-mono text-[7px] text-emerald-400">GRID PRECISION: 2mm TOLERANCE</div>
              {/* Fake crosshair design highlights */}
              <div className="absolute left-1/2 top-4 w-12 h-px bg-emerald-500/45 -translate-x-1/2"></div>
              <div className="absolute left-1/2 bottom-4 w-12 h-px bg-emerald-500/45 -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-4 h-12 w-px bg-emerald-500/45 -translate-y-1/2"></div>
              <div className="absolute top-1/2 right-4 h-12 w-px bg-emerald-500/45 -translate-y-1/2"></div>
            </div>
          )}

          <div className="text-center text-[10px] text-zinc-400 font-mono mt-4 leading-normal select-none">
            This interactive 3D simulation depicts the precise layout of <span className="text-coke-red font-bold">4 × {volumeLabel}</span> {productNoun.toLowerCase()}s inside the selected packaging architecture:{' '}
            <span className="text-white font-semibold underline underline-offset-2 decoration-coke-red">
              {packagingType === 'closed_box_2x2' ? 'Closed Box 2x2' : packagingType === 'basket_handle' ? 'Carrier with Handle' : 'Tight Sleeve Wrap'}
            </span>.
          </div>

        </div>

      </div>

      {/* Technical legend info bar */}
      <div className="h-16 bg-coke-black border-t border-coke-border p-3 grid grid-cols-12 text-[9px] font-mono text-white select-none shrink-0 gap-2 items-center">
        <div className="col-span-5 border-r border-coke-border/40 pr-2">
          <span className="text-coke-gray">TOTAL BUNDLE CONTENT:</span>
          <div className="text-xs font-extrabold text-coke-red tracking-tight">4 × {volumeLabel} ({productNoun.toUpperCase()} BUNDLE)</div>
        </div>
        <div className="col-span-4 border-r border-coke-border/40 px-1 text-center">
          <button
            onClick={resetControls}
            className="px-2 py-1 text-[8.5px] bg-zinc-900 border border-zinc-805 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded cursor-pointer transition-all"
            title="Reset 3D camera and shader parameters"
          >
            RESET CAMERA
          </button>
        </div>
        <div className="col-span-3 text-right">
          <span className="text-coke-gray">PACK CONFIGURATION:</span>
          <div className="text-xs font-extrabold text-[#fff] tracking-tight">4-UNIT VARIETY PACK</div>
        </div>
      </div>

    </div>
  );
};
