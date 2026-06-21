import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Settings2, 
  FileDown, 
  Table, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Check, 
  Grid, 
  Wrench, 
  Info,
  Sparkles,
  Sliders,
  Paintbrush,
  Coffee,
  Heart,
  ExternalLink,
  Mail,
  Briefcase,
  Send
} from 'lucide-react';
import { PackagingSpecs, INITIAL_SPECS, PackagingType } from './types';
import { PackagingDielineSVG } from './components/PackagingDielineSVG';
import { CansAssortmentPreview } from './components/CansAssortmentPreview';
import { generateSpecsPDFChecklist, exportSpecsToCSV } from './utils/pdfGenerator';

export default function App() {
  // 1. Initialize specifications state with auto-save to localStorage
  const [specs, setSpecs] = useState<PackagingSpecs>(() => {
    try {
      const saved = localStorage.getItem('my_packaging_better_specs');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Fallback for any missing properties in updated revisions
        return { ...INITIAL_SPECS, ...parsed };
      }
    } catch (e) {
      console.warn("Could not load from localStorage, initializing fresh specs.", e);
    }
    return INITIAL_SPECS;
  });

  // Active tab state ("die_line" or "3d_prev")
  const [activeTab, setActiveTab] = useState<'die_line' | '3d_prev'>('die_line');

  // Manual dimension override state (false = auto calculations locked to the 0.5L cans, true = manually adjustable cm)
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(false);

  // Buy Me a Coffee customization state
  const [bmcUsername, setBmcUsername] = useState(() => {
    return localStorage.getItem('packcraft_bmc_user') || 'juliiyabrodska';
  });
  const [showBmcConfig, setShowBmcConfig] = useState(false);

  // Business and custom orders customization state
  const [contactEmail, setContactEmail] = useState(() => {
    return localStorage.getItem('packcraft_contact_email') || 'juliiyabrodska@gmail.com';
  });
  const [socialLink, setSocialLink] = useState(() => {
    return localStorage.getItem('packcraft_social_link') || 'https://www.linkedin.com/in/juliiyabrodska';
  });
  const [showContactConfig, setShowContactConfig] = useState(false);

  // Status message for auto-saves
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // 2. Perform Auto-save on spec updates and compute auto-dimensions if lock is on
  useEffect(() => {
    setSaveStatus('saving');
    
    let currentSpecs = { ...specs };
    
    // Auto calculations based on standard 500ml (0.5L) can specs:
    // Diameter = 6.63 cm, Height = 16.80 cm
    // Carton needs a tiny bit of clearance tolerance so it folds comfortably around 2x2 grid
    if (!isOverrideEnabled) {
      const computedL = parseFloat((specs.canDiameter * 2 + 0.24).toFixed(2));
      const computedW = parseFloat((specs.canDiameter * 2 + 0.24).toFixed(2));
      const computedH = parseFloat((specs.canHeight + 0.2).toFixed(2));
      
      currentSpecs.cartonLength = computedL;
      currentSpecs.cartonWidth = computedW;
      currentSpecs.cartonHeight = computedH;
    }

    const timer = setTimeout(() => {
      localStorage.setItem('my_packaging_better_specs', JSON.stringify(currentSpecs));
      setSaveStatus('saved');
    }, 450);

    return () => clearTimeout(timer);
  }, [specs, isOverrideEnabled]);

  // Set individual states
  const updateSpec = <K extends keyof PackagingSpecs>(key: K, value: PackagingSpecs[K]) => {
    setSpecs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Preset selectors for quick reset/selection
  const applyPreset = (style: 'premium_cola' | 'kraft_eco' | 'sleeper_pack') => {
    if (style === 'premium_cola') {
      setSpecs({
        ...specs,
        packagingType: 'closed_box_2x2',
        outerMaterial: 'solid_sulfate',
        materialWeight: '400 g/m²',
        materialThickness: '0.62 mm',
        printingMethod: 'offset',
        colorsCount: 6,
        coatingOption: 'soft_touch',
        flavor1: 'Cherry-Cola Classic',
        flavor2: 'Crazy Lime-Mint',
        flavor3: 'Forest Berries Zero',
        flavor4: 'Caribbean Spicy Orange',
        reinforcedBottom: true,
        fingerHoles: true,
        flavorDividers: true,
        notes: 'Premium set with soft-touch coating and embossing for the summer festival.'
      });
      setIsOverrideEnabled(false);
    } else if (style === 'kraft_eco') {
      setSpecs({
        ...specs,
        packagingType: 'basket_handle',
        outerMaterial: 'pure_kraft',
        materialWeight: '380 g/m²',
        materialThickness: '0.58 mm',
        printingMethod: 'flexo',
        colorsCount: 2,
        coatingOption: 'none',
        flavor1: 'Wild Raspberry Sugar Free',
        flavor2: 'Apple Sidecrush',
        flavor3: 'Orange Fizz',
        flavor4: 'Classic Kvass Ale',
        reinforcedBottom: true,
        fingerHoles: true,
        flavorDividers: false,
        notes: 'Eco series without plastic coating, on raw unbleached Kraft board.'
      });
      setIsOverrideEnabled(false);
    } else {
      setSpecs({
        ...specs,
        packagingType: 'sleeve_pack',
        outerMaterial: 'recyclable_gd2',
        materialWeight: '350 g/m²',
        materialThickness: '0.45 mm',
        printingMethod: 'digital',
        colorsCount: 4,
        coatingOption: 'matte',
        flavor1: 'Coffee-Cola Booster',
        flavor2: 'Watermelon Boom',
        flavor3: 'Pineapple Splash',
        flavor4: 'Ginger Cola Crisp',
        reinforcedBottom: false,
        fingerHoles: true,
        flavorDividers: false,
        notes: 'Lightweight promo sleeve wrap for store introductions.'
      });
      setIsOverrideEnabled(false);
    }
  };

  // Reset helper
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset specifications to standard 0.5L factory settings?")) {
      localStorage.removeItem('my_packaging_better_specs');
      setSpecs(INITIAL_SPECS);
      setIsOverrideEnabled(false);
    }
  };

  // Checks if downloading is permitted (must check Oleg, Serhiy, and Maryna)
  const isApproved = specs.approvedOleh && specs.approvedSerhiy && specs.approvedMaryna;

  // Perform dynamic calculation of area of outer paper sheet (BOM calculations)
  const calculateCartonSquareMeters = () => {
    // Estimating unfolded total layout area of a box
    let totalAreaSqCm = 0;
    const { cartonLength: L, cartonWidth: W, cartonHeight: H } = specs;
    if (specs.packagingType === 'closed_box_2x2') {
      const unfoldedWidth = (1.6 + L * 2 + W * 2);
      const unfoldedHeight = (H + Math.max(L, W) * 1.6);
      totalAreaSqCm = unfoldedWidth * unfoldedHeight;
    } else if (specs.packagingType === 'basket_handle') {
      totalAreaSqCm = (L * 1.5) * (H * 2.1);
    } else {
      totalAreaSqCm = (L * 2 + H * 2 + 1.6) * W;
    }
    return (totalAreaSqCm / 10000).toFixed(4); // convert to m2
  };

  // Estimate cost per 1000 units in USD
  const calculateApproxCost = () => {
    const area = parseFloat(calculateCartonSquareMeters());
    
    // Basic weight & premium factors
    let materialPricePerSqM = 1.05; // Base price in USD
    if (specs.outerMaterial === 'solid_sulfate') materialPricePerSqM = 1.65;
    if (specs.outerMaterial === 'pure_kraft') materialPricePerSqM = 1.45;
    if (specs.outerMaterial === 'sbb_kraft') materialPricePerSqM = 1.35;
    if (specs.outerMaterial === 'recyclable_gd2') materialPricePerSqM = 0.85;

    let finishMultiplier = 1.0;
    if (specs.coatingOption === 'soft_touch') finishMultiplier = 1.35;
    if (specs.coatingOption === 'uv_selective') finishMultiplier = 1.25;
    if (specs.coatingOption === 'gloss' || specs.coatingOption === 'matte') finishMultiplier = 1.12;

    const extrasCount = 
      (specs.reinforcedBottom ? 1 : 0) + 
      (specs.fingerHoles ? 1 : 0) + 
      (specs.flavorDividers ? 1 : 0) + 
      (specs.moistureBarrier ? 1 : 0) + 
      (specs.tearPerforation ? 1 : 0);

    const baseCost = area * materialPricePerSqM * (1 + specs.colorsCount * 0.08) * finishMultiplier;
    const extrasCost = extrasCount * 0.03;
    const perUnitCostUsd = baseCost + extrasCost;
    
    return {
      perUnit: perUnitCostUsd.toFixed(2),
      batchOf1000: (perUnitCostUsd * 1000).toFixed(0)
    };
  };

  const costEst = calculateApproxCost();

  // Material Weight to Thickness converter mappings
  const handleMaterialChange = (material: PackagingSpecs['outerMaterial']) => {
    let weight = '350 g/m²';
    let thickness = '0.52 mm';

    if (material === 'solid_sulfate') {
      weight = '400 g/m²';
      thickness = '0.62 mm';
    } else if (material === 'pure_kraft') {
      weight = '380 g/m²';
      thickness = '0.58 mm';
    } else if (material === 'sbb_kraft') {
      weight = '360 g/m²';
      thickness = '0.55 mm';
    } else {
      weight = '320 g/m²';
      thickness = '0.45 mm';
    }

    setSpecs(prev => ({
      ...prev,
      outerMaterial: material,
      materialWeight: weight,
      materialThickness: thickness
    }));
  };

  const isPremiumColaActive = specs.packagingType === 'closed_box_2x2' && specs.outerMaterial === 'solid_sulfate';
  const isKraftEcoActive = specs.packagingType === 'basket_handle' && specs.outerMaterial === 'pure_kraft';
  const isSleeveActive = specs.packagingType === 'sleeve_pack' && specs.outerMaterial === 'recyclable_gd2';

  return (
    <div className="min-h-screen bg-[#070708] text-white flex flex-col font-sans antialiased selection:bg-coke-red selection:text-white pb-3">
      
      {/* GLOBAL HUD ROW (HEADLINE HEADER) */}
      <header className="min-h-16 w-full border-b border-coke-border bg-coke-black px-4 md:px-6 py-3 md:py-0 flex flex-col md:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-10 h-10 bg-coke-red rounded flex items-center justify-center border border-red-400/30 shrink-0">
            <span className="font-mono font-extrabold text-[#fff] tracking-tighter text-xl">KR</span>
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold uppercase tracking-tight text-white flex items-center gap-1.5 flex-wrap">
              <span>PackCraft 3D Studio</span>
              <span className="text-[10px] bg-coke-red-dim text-coke-red border border-coke-red/40 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">V0.5 CAD</span>
            </h1>
            <p className="text-[10px] text-coke-gray font-mono uppercase tracking-widest sm:block hidden mt-0.5">
              PROFESSIONAL PACKAGING CAD AND 3D DESIGN STUDIO • 4 X 0.5L CANISTERS
            </p>
          </div>
        </div>

        {/* SAVE METRICS STATS */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          <div className="hidden sm:flex flex-col text-right font-mono text-[9px] text-coke-gray leading-tight shrink-0">
            <span className="text-white flex items-center justify-end space-x-1">
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>{saveStatus === 'saved' ? 'SAVED AUTOMATICALLY' : 'CACHING TO LOCAL...'}</span>
            </span>
            <span>STORAGE: LOCAL_VIRTUAL_DB</span>
          </div>
          
          {/* Quick presets layout button widget */}
          <div className="flex flex-row items-center gap-2 bg-coke-dark/90 p-1.5 rounded-lg border border-coke-border/80 w-full sm:w-auto justify-between sm:justify-start">
            <button 
              onClick={() => applyPreset('premium_cola')}
              className={`text-[10px] md:text-xs font-mono px-3.5 py-1.5 rounded-md transition-all cursor-pointer font-bold uppercase tracking-wider ${
                isPremiumColaActive 
                  ? 'bg-coke-red text-white border border-red-500 shadow-md font-extrabold focus:ring-1 focus:ring-red-400' 
                  : 'bg-zinc-900/80 text-coke-gray hover:text-white border border-coke-border hover:bg-zinc-850'
              }`}
              title="Premium 100% Soft-Touch 2x2 Coca-Cola style"
            >
              COKE PREMIUM
            </button>
            <button 
              onClick={() => applyPreset('kraft_eco')}
              className={`text-[10px] md:text-xs font-mono px-3.5 py-1.5 rounded-md transition-all cursor-pointer font-bold uppercase tracking-wider ${
                isKraftEcoActive 
                  ? 'bg-amber-700 text-white border border-amber-600 shadow-md font-extrabold focus:ring-1 focus:ring-amber-400' 
                  : 'bg-zinc-900/80 text-coke-gray hover:text-white border border-coke-border hover:bg-zinc-850'
              }`}
              title="Eco Kraft board with transport handle"
            >
              KRAFT ECO
            </button>
            <button 
              onClick={() => applyPreset('sleeper_pack')}
              className={`text-[10px] md:text-xs font-mono px-3.5 py-1.5 rounded-md transition-all cursor-pointer font-bold uppercase tracking-wider ${
                isSleeveActive 
                  ? 'bg-purple-700 text-white border border-purple-600 shadow-md font-extrabold focus:ring-1 focus:ring-purple-400' 
                  : 'bg-zinc-900/80 text-coke-gray hover:text-white border border-coke-border hover:bg-zinc-850'
              }`}
              title="Lightweight promo sleeve wrap"
            >
              SLEEVE PROMO
            </button>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE PANEL: 2-COLUMN CAD SYSTEM */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 md:px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMN LEFT: CAD BLUEPRINT AND 3D GRAPH VIEWPORT (12-cols spans 7) */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* VIEWPORT CONTROLS */}
          <div className="flex items-center justify-between bg-coke-black/95 p-1.5 rounded-lg border border-coke-border shadow-inner">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('die_line')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-mono font-bold transition-all duration-300 transform hover:scale-[1.01] cursor-pointer ${
                  activeTab === 'die_line' 
                    ? 'bg-coke-red text-white border border-red-500 shadow-[0_0_15px_rgba(230,28,36,0.35)]' 
                    : 'text-coke-gray hover:text-white hover:bg-zinc-800/80 border border-transparent'
                }`}
                id="tab-btn-dieline"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>2D BLUEPRINT VIEW (DIE LINE)</span>
              </button>
              
              <button
                onClick={() => setActiveTab('3d_prev')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-mono font-bold transition-all duration-300 transform hover:scale-[1.01] cursor-pointer ${
                  activeTab === '3d_prev' 
                    ? 'bg-coke-red text-white border border-red-500 shadow-[0_0_15px_rgba(230,28,36,0.35)]' 
                    : 'text-coke-gray hover:text-white hover:bg-zinc-800/80 border border-transparent'
                }`}
                id="tab-btn-3d"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D INTERACTIVE VIEW (PREVIEW)</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-zinc-400 tracking-wider pr-3 hidden sm:block">
              MODE: {activeTab === 'die_line' ? 'CAD BLUEPRINT' : '3D REALISTIC MOCKUP'}
            </div>
          </div>

          {/* ACTIVE DRAWING STAGE */}
          <div className="flex-1 min-h-[460px] lg:min-h-[500px]">
            {activeTab === 'die_line' ? (
              <PackagingDielineSVG specs={specs} />
            ) : (
              <CansAssortmentPreview specs={specs} />
            )}
          </div>

          {/* BOM LIVE ESTIMATION WIDGET */}
          <div className="bg-coke-black rounded-lg border border-coke-border p-3 select-none font-mono text-xs">
            <div className="flex items-center space-x-1.5 text-coke-red font-bold mb-2 uppercase tracking-wide">
              <Info className="w-4 h-4" />
              <span>LIVE BILL OF MATERIALS & ESTIMATES (BOM CALCULATOR)</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div className="bg-coke-dark/80 p-2 rounded border border-coke-border/40">
                <span className="text-coke-gray text-[10px]">RETAIL BOARD AREA:</span>
                <div className="text-sm font-bold text-white mt-0.5">{calculateCartonSquareMeters()} m²</div>
              </div>
              <div className="bg-coke-dark/80 p-2 rounded border border-coke-border/40">
                <span className="text-coke-gray text-[10px]">ESTIMATED COST / UNIT:</span>
                <div className="text-sm font-bold text-white mt-0.5">~ ${costEst.perUnit} USD</div>
              </div>
              <div className="bg-coke-dark/80 p-2 rounded border border-coke-border/40">
                <span className="text-coke-gray text-[10px]">BATCH COST (1,000 UNITS):</span>
                <div className="text-sm font-bold text-coke-red mt-0.5">~ ${costEst.batchOf1000} USD</div>
              </div>
              <div className="bg-coke-dark/80 p-2 rounded border border-coke-border/40">
                <span className="text-coke-gray text-[10px]">TOTAL EMPTY WEIGHT:</span>
                <div className="text-sm font-bold text-white mt-0.5">~ 0.18 kg (With board)</div>
              </div>
            </div>
          </div>

        </section>

        {/* COLUMN RIGHT: CONTROL PARAMETERS BAR PANEL (12-cols spans 5) */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="bg-coke-black rounded-lg border border-coke-border p-4 space-y-4">
            
            {/* PANEL SECTION I: STRUCTURE & DIMENSIONS */}
            <div className="space-y-3 pb-3.5 border-b border-coke-border">
              <div className="flex items-center space-x-2 text-coke-red font-bold text-xs uppercase tracking-wider font-mono">
                <Wrench className="w-3.5 h-3.5" />
                <span>I. STRUCTURE & DIMENSIONS (CAD)</span>
              </div>

              {/* Type drop */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-coke-gray font-mono uppercase">Cardboard Structure Profile:</label>
                <select 
                  value={specs.packagingType}
                  onChange={(e) => updateSpec('packagingType', e.target.value as PackagingType)}
                  className="bg-coke-dark border border-coke-border text-white text-xs rounded p-2 focus:border-coke-red focus:outline-none"
                  id="select-pkg-type"
                >
                  <option value="closed_box_2x2">Closed Box 2x2 (Show-Box type carton)</option>
                  <option value="basket_handle">Basket Carrier (Open holder with splitter partitions & handle)</option>
                  <option value="sleeve_pack">Tension Sleeve Wrap (Lightweight board wrapper)</option>
                </select>
              </div>

              {/* Toggle to override automatics */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-zinc-300 font-mono flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-coke-red rounded-full"></span>
                  <span>Override automatically computed dimensions:</span>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isOverrideEnabled} 
                    onChange={(e) => setIsOverrideEnabled(e.target.checked)} 
                    className="sr-only peer"
                    id="toggle-override"
                  />
                  <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-coke-red peer-checked:after:bg-white"></div>
                </label>
              </div>

              {/* Locked/Unlocked Dynamic Fields */}
              <div className="bg-[#111112] p-2.5 rounded border border-coke-border/40 grid grid-cols-2 gap-2 text-xs font-mono">
                {/* Fixed Can Dimensions (Reference template) */}
                <div className="col-span-2 text-[9px] text-zinc-500 uppercase tracking-widest flex justify-between">
                  <span>Canister standards (0.5L):</span>
                  <span>{isOverrideEnabled ? 'MANUAL ADJUSTMENT' : 'AUTOMATIC CALCULATIONS ✓'}</span>
                </div>
                
                <div>
                  <label className="text-[9px] text-coke-gray">Can Diameter (cm):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="5.5" 
                    max="8.5"
                    value={specs.canDiameter}
                    onChange={(e) => updateSpec('canDiameter', parseFloat(e.target.value) || 6.63)}
                    className="w-full bg-coke-black border border-coke-border text-xs rounded p-1 text-white focus:outline-none"
                    id="input-can-diameter"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-coke-gray">Can Height (cm):</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="12" 
                    max="22"
                    value={specs.canHeight}
                    onChange={(e) => updateSpec('canHeight', parseFloat(e.target.value) || 16.8)}
                    className="w-full bg-coke-black border border-coke-border text-xs rounded p-1 text-white focus:outline-none"
                    id="input-can-height"
                  />
                </div>

                {/* Carton Dimensions Length, Width, Height */}
                <div className="col-span-2 border-t border-coke-border/40 pt-1.5 mt-1.5 text-[9px] text-zinc-500 uppercase">
                  Cardboard Box Exterior Dimensions:
                </div>
                
                <div>
                  <label className="text-[9px] text-coke-gray flex items-center space-x-1">
                    {!isOverrideEnabled && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
                    <span>Flat Length L (cm):</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={specs.cartonLength}
                    disabled={!isOverrideEnabled}
                    onChange={(e) => updateSpec('cartonLength', parseFloat(e.target.value) || 13)}
                    className={`w-full bg-coke-black border text-xs rounded p-1 text-white focus:outline-none ${!isOverrideEnabled ? 'border-zinc-800 text-zinc-500 cursor-not-allowed bg-zinc-950/40' : 'border-coke-border'}`}
                    id="input-carton-length"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-coke-gray flex items-center space-x-1">
                    {!isOverrideEnabled && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
                    <span>Flat Width W (cm):</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={specs.cartonWidth}
                    disabled={!isOverrideEnabled}
                    onChange={(e) => updateSpec('cartonWidth', parseFloat(e.target.value) || 13)}
                    className={`w-full bg-coke-black border text-xs rounded p-1 text-white focus:outline-none ${!isOverrideEnabled ? 'border-zinc-800 text-zinc-500 cursor-not-allowed bg-zinc-950/40' : 'border-coke-border'}`}
                    id="input-carton-width"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[9px] text-coke-gray flex items-center space-x-1">
                    {!isOverrideEnabled && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
                    <span>Flat Height H (cm):</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={specs.cartonHeight}
                    disabled={!isOverrideEnabled}
                    onChange={(e) => updateSpec('cartonHeight', parseFloat(e.target.value) || 17)}
                    className={`w-full bg-coke-black border text-xs rounded p-1 text-white focus:outline-none ${!isOverrideEnabled ? 'border-zinc-800 text-zinc-500 cursor-not-allowed bg-zinc-950/40' : 'border-coke-border'}`}
                    id="input-carton-height"
                  />
                </div>
              </div>
            </div>

            {/* PANEL SECTION II: MATERIALS & PRINTING */}
            <div className="space-y-3 pb-3.5 border-b border-coke-border">
              <div className="flex items-center space-x-2 text-coke-red font-bold text-xs uppercase tracking-wider font-mono">
                <Paintbrush className="w-3.5 h-3.5" />
                <span>II. MATERIALS, PRINTING & FINISHING</span>
              </div>

              {/* Material Dropdown */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-coke-gray font-mono uppercase">Cardboard Board Stock:</label>
                  <select 
                    value={specs.outerMaterial}
                    onChange={(e) => handleMaterialChange(e.target.value as PackagingSpecs['outerMaterial'])}
                    className="bg-coke-dark border border-coke-border text-white text-[11px] rounded p-2 focus:border-coke-red focus:outline-none"
                    id="select-carton-material"
                  >
                    <option value="pure_kraft">Unbleached Kraft Board (Water Resistant)</option>
                    <option value="solid_sulfate">Solid Bleached Sulfate Board SBB</option>
                    <option value="sbb_kraft">Bleached SUB Cardboard (Slightly Recycled)</option>
                    <option value="recyclable_gd2">Recycled Economy Board GD2</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-coke-gray font-mono uppercase">Density / GSM Grammage:</label>
                  <input 
                    type="text" 
                    value={specs.materialWeight}
                    onChange={(e) => updateSpec('materialWeight', e.target.value)}
                    className="bg-coke-dark border border-coke-border text-white text-xs rounded p-1.5 focus:border-coke-red focus:outline-none"
                    id="input-material-weight"
                  />
                </div>
              </div>

              {/* Thickness Spec Info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-coke-gray font-mono uppercase">Board Caliper Thickness:</label>
                  <input 
                    type="text" 
                    value={specs.materialThickness}
                    onChange={(e) => updateSpec('materialThickness', e.target.value)}
                    className="bg-coke-dark border border-coke-border text-white text-xs rounded p-1.5 focus:border-coke-red"
                    id="input-material-thickness"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-coke-gray font-mono uppercase">Primary Printing Technology:</label>
                  <select 
                    value={specs.printingMethod}
                    onChange={(e) => updateSpec('printingMethod', e.target.value as any)}
                    className="bg-coke-dark border border-coke-border text-white text-xs rounded p-1.5 focus:border-coke-red focus:outline-none"
                    id="select-printing-method"
                  >
                    <option value="offset">Litho Offset (Premium)</option>
                    <option value="flexo">High-Speed Flexography</option>
                    <option value="digital">Digital Latex (Fast Run)</option>
                  </select>
                </div>
              </div>

              {/* Colors count and Finish effect */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-coke-gray font-mono uppercase">Inks Color Count (1 - 8):</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="range"
                      min="1"
                      max="8"
                      value={specs.colorsCount}
                      onChange={(e) => updateSpec('colorsCount', parseInt(e.target.value))}
                      className="accent-coke-red w-full"
                      id="range-colors-count"
                    />
                    <span className="text-xs font-mono font-bold text-coke-red border border-coke-border px-1.5 py-0.5 rounded bg-coke-dark">{specs.colorsCount}</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-coke-gray font-mono uppercase">Finishing Protective Coat:</label>
                  <select 
                    value={specs.coatingOption}
                    onChange={(e) => updateSpec('coatingOption', e.target.value as any)}
                    className="bg-coke-dark border border-coke-border text-white text-xs rounded p-1.5 focus:border-coke-red focus:outline-none"
                    id="select-coating"
                  >
                    <option value="matte">Protective Matte Coat</option>
                    <option value="gloss">High Gloss Shimmer</option>
                    <option value="uv_selective">Selective Spot UV (Premium)</option>
                    <option value="soft_touch">Soft-Touch Silk-Lamination</option>
                    <option value="none">Raw / Dry Uncoated Cardboard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PANEL SECTION III: FLAVORS BUNDLING */}
            <div className="space-y-3 pb-3.5 border-b border-coke-border">
              <div className="flex items-center space-x-2 text-coke-red font-bold text-xs uppercase tracking-wider font-mono">
                <Sliders className="w-3.5 h-3.5" />
                <span>III. STAGE FLAVORS (4 VARIETIES BUNDLE)</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-0.5">
                  <label className="text-[10px] text-red-400 font-mono flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    <span>1. Flavor Red (Can A):</span>
                  </label>
                  <input 
                    type="text" 
                    value={specs.flavor1}
                    onChange={(e) => updateSpec('flavor1', e.target.value)}
                    className="bg-coke-dark border border-coke-border text-white text-xs rounded p-1.5 focus:border-coke-red focus:outline-none font-sans font-medium"
                    id="input-flavor-1"
                  />
                </div>

                <div className="flex flex-col space-y-0.5">
                  <label className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>2. Flavor Green (Can B):</span>
                  </label>
                  <input 
                    type="text" 
                    value={specs.flavor2}
                    onChange={(e) => updateSpec('flavor2', e.target.value)}
                    className="bg-coke-dark border border-coke-border text-white text-xs rounded p-1.5 focus:border-coke-red focus:outline-none font-sans font-medium"
                    id="input-flavor-2"
                  />
                </div>

                <div className="flex flex-col space-y-0.5">
                  <label className="text-[10px] text-purple-400 font-mono flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <span>3. Flavor Violet (Can C):</span>
                  </label>
                  <input 
                    type="text" 
                    value={specs.flavor3}
                    onChange={(e) => updateSpec('flavor3', e.target.value)}
                    className="bg-coke-dark border border-coke-border text-white text-xs rounded p-1.5 focus:border-coke-red focus:outline-none font-sans font-medium"
                    id="input-flavor-3"
                  />
                </div>

                <div className="flex flex-col space-y-0.5">
                  <label className="text-[10px] text-amber-500 font-mono flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>4. Flavor Gold (Can D):</span>
                  </label>
                  <input 
                    type="text" 
                    value={specs.flavor4}
                    onChange={(e) => updateSpec('flavor4', e.target.value)}
                    className="bg-coke-dark border border-coke-border text-white text-xs rounded p-1.5 focus:border-coke-red focus:outline-none font-sans font-medium"
                    id="input-flavor-4"
                  />
                </div>
              </div>
            </div>

            {/* PANEL SECTION IV: STRUCTURAL COMBINATIONS & EXTRAS */}
            <div className="space-y-2.5 pb-3.5 border-b border-coke-border text-xs font-mono">
              <div className="flex items-center space-x-2 text-coke-red font-bold text-xs uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>IV. STRUCTURAL COMBINATIONS & EXTRAS</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                <label className="flex items-center space-x-2 text-zinc-300 hover:text-white cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={specs.reinforcedBottom}
                    onChange={(e) => updateSpec('reinforcedBottom', e.target.checked)}
                    className="accent-coke-red"
                    id="cb-reinforced-bottom"
                  />
                  <span>Double-Reinforced Base Plate (+3% Sturdiness)</span>
                </label>
                
                <label className="flex items-center space-x-2 text-zinc-300 hover:text-white cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={specs.fingerHoles}
                    onChange={(e) => updateSpec('fingerHoles', e.target.checked)}
                    className="accent-coke-red"
                    id="cb-finger-holes"
                  />
                  <span>Integrated roof finger holes for quick carry</span>
                </label>

                <label className="flex items-center space-x-2 text-zinc-300 hover:text-white cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={specs.flavorDividers}
                    onChange={(e) => updateSpec('flavorDividers', e.target.checked)}
                    className="accent-coke-red"
                    id="cb-flavor-dividers"
                  />
                  <span>Protective internal cardboard dividers (Taste separators)</span>
                </label>

                <label className="flex items-center space-x-2 text-zinc-300 hover:text-white cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={specs.moistureBarrier}
                    onChange={(e) => updateSpec('moistureBarrier', e.target.checked)}
                    className="accent-coke-red"
                    id="cb-moisture-barrier"
                  />
                  <span>Hydrophobic silicone moisture barrier coat</span>
                </label>

                <label className="flex items-center space-x-2 text-zinc-300 hover:text-white cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={specs.tearPerforation}
                    onChange={(e) => updateSpec('tearPerforation', e.target.checked)}
                    className="accent-coke-red"
                    id="cb-tear-perforation"
                  />
                  <span>Precision zigzag tear perforation line</span>
                </label>
              </div>

              {/* Textarea notes */}
              <div className="flex flex-col space-y-1 pt-1">
                <label className="text-[9px] text-coke-gray uppercase">Directives for print engineers / comments:</label>
                <textarea 
                  value={specs.notes}
                  onChange={(e) => updateSpec('notes', e.target.value)}
                  className="bg-coke-dark border border-coke-border text-white text-xs rounded p-2 focus:border-coke-red focus:outline-none font-sans h-12 resize-none"
                  placeholder="Write custom technical notes here..."
                  id="textarea-notes"
                />
              </div>
            </div>

            {/* PANEL SECTION V: TEAM CONSENT */}
            <div className="space-y-3 pb-1 border-b border-coke-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-coke-red font-bold text-xs uppercase tracking-wider font-mono">
                  <Check className="w-3.5 h-3.5" />
                  <span>V. TEAM CONSENT & SPEC SIGN-OFF</span>
                </div>
                
                <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                  isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-coke-red-dim text-coke-red border border-coke-red/30'
                }`}>
                  {isApproved ? 'APPROVED ✓' : 'DRAFTING'}
                </span>
              </div>

              <p className="text-[10px] text-zinc-400 leading-snug">
                Official CAD vector PDF export requires active consent flags from three team directors:
              </p>

              {/* Approval checkboxes */}
              <div className="grid grid-cols-3 gap-2 py-0.5">
                
                <label className={`flex flex-col items-center p-2 rounded border cursor-pointer transition-all select-none ${
                  specs.approvedOleh 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                    : 'bg-coke-dark border-coke-border text-zinc-500 hover:border-zinc-700'
                }`}>
                  <span className="text-xs font-bold">Oleh</span>
                  <span className="text-[8px] font-mono mt-0.5 uppercase tracking-tighter">BOM Manager</span>
                  <input 
                    type="checkbox"
                    checked={specs.approvedOleh}
                    onChange={(e) => updateSpec('approvedOleh', e.target.checked)}
                    className="mt-1.5 accent-emerald-500 cursor-pointer"
                    id="cb-approve-oleh"
                  />
                </label>

                <label className={`flex flex-col items-center p-2 rounded border cursor-pointer transition-all select-none ${
                  specs.approvedSerhiy 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                    : 'bg-coke-dark border-coke-border text-zinc-500 hover:border-zinc-700'
                }`}>
                  <span className="text-xs font-bold">Serhiy</span>
                  <span className="text-[8px] font-mono mt-0.5 uppercase tracking-tighter">Finance</span>
                  <input 
                    type="checkbox"
                    checked={specs.approvedSerhiy}
                    onChange={(e) => updateSpec('approvedSerhiy', e.target.checked)}
                    className="mt-1.5 accent-emerald-500 cursor-pointer"
                    id="cb-approve-serhiy"
                  />
                </label>

                <label className={`flex flex-col items-center p-2 rounded border cursor-pointer transition-all select-none ${
                  specs.approvedMaryna 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                    : 'bg-coke-dark border-coke-border text-zinc-500 hover:border-zinc-700'
                }`}>
                  <span className="text-xs font-bold">Maryna</span>
                  <span className="text-[8px] font-mono mt-0.5 uppercase tracking-tighter">Marketing</span>
                  <input 
                    type="checkbox"
                    checked={specs.approvedMaryna}
                    onChange={(e) => updateSpec('approvedMaryna', e.target.checked)}
                    className="mt-1.5 accent-emerald-500 cursor-pointer"
                    id="cb-approve-maryna"
                  />
                </label>

              </div>

              {/* Warning/Success Banner block */}
              {!isApproved ? (
                <div className="bg-coke-red-dim/60 border border-coke-red/40 p-2 rounded text-[10px] text-zinc-300 font-mono flex items-start space-x-2 leading-none">
                  <Lock className="w-6 h-6 text-coke-red shrink-0" />
                  <div className="space-y-1">
                    <div className="font-bold text-coke-red uppercase">SIGN-OFF LOCKED!</div>
                    <p className="leading-snug text-zinc-400">Awaiting consent keys from Oleh, Serhiy, and Maryna to download finalized print sheets and contractual sign-off.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/40 p-2 rounded text-[10px] text-emerald-400 font-mono flex items-start space-x-2 leading-none">
                  <Unlock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold uppercase">FULL CAD CLEARANCE GRANTED!</div>
                    <p className="leading-snug text-zinc-300">All team director signatures verified. High-resolution PDF export button is now unlocked and available.</p>
                  </div>
                </div>
              )}
            </div>

            {/* PANEL SECTION VI: ЕКСПОРТ ТА СКИДАННЯ */}
            <div className="space-y-3 pt-2">
              
              {/* PDF EXPORT (Depends on approvals) */}
              <button
                disabled={!isApproved}
                onClick={() => generateSpecsPDFChecklist(specs)}
                className={`w-full py-3 px-4 rounded font-mono text-xs font-extrabold flex items-center justify-center space-x-2 cursor-pointer transition-all border ${
                  isApproved 
                    ? 'bg-coke-red text-white hover:bg-coke-red-hover border-red-500/30' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                }`}
                id="btn-export-pdf"
                title={isApproved ? "Download professional multi-page vector PDF for factory print production" : "Team must sign-off on drawings before downloading print sheets"}
              >
                <FileDown className="w-4 h-4" />
                <span>DOWNLOAD CAD PDF FOR PRINT (2 PAGES, SIGN-OFF)</span>
              </button>

              {/* CSV EXPORT (Always accessible) */}
              <button
                onClick={() => exportSpecsToCSV(specs)}
                className="w-full bg-coke-dark hover:bg-zinc-800 border border-coke-border text-white text-xs font-mono py-2.5 px-4 rounded flex items-center justify-center space-x-2 cursor-pointer transition-all"
                id="btn-export-csv"
                title="Download tabular raw bill of materials list (BOM)"
              >
                <Table className="w-4 h-4 text-coke-red" />
                <span>EXPORT BOM LIST (CSV FOR EXCEL)</span>
              </button>

              {/* Danger Reset */}
              <button
                onClick={handleReset}
                className="w-full text-[10px] text-zinc-600 hover:text-coke-red font-mono py-1.5 flex items-center justify-center space-x-1 transition-all cursor-pointer bg-transparent border-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to standard 0.5L factory specifications</span>
              </button>

              {/* BUY ME A COFFEE WIDGET */}
              <div className="mt-4 p-3 bg-gradient-to-br from-[#121214] to-[#1a1a1f] rounded-lg border border-yellow-500/20 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-yellow-500 font-bold text-xs uppercase tracking-wider font-mono">
                    <Coffee className="w-4 h-4 text-yellow-500 animate-pulse shrink-0" />
                    <span>ПІДТРИМАТИ ПРОЄКТ</span>
                  </div>
                  <button 
                    onClick={() => setShowBmcConfig(!showBmcConfig)}
                    className="text-[9px] font-mono text-zinc-500 hover:text-yellow-400 underline transition-colors cursor-pointer bg-transparent border-0"
                    title="Змінити налаштування посилання"
                  >
                    {showBmcConfig ? 'СХОВАТИ НАЛАШТУВАННЯ' : 'ЗМІНИТИ USERNAME'}
                  </button>
                </div>

                {showBmcConfig && (
                  <div className="bg-[#0b0b0c] p-2.5 rounded border border-zinc-800 space-y-1.5 transition-all">
                    <label className="text-[9px] text-zinc-400 font-mono uppercase block">Username або посилання на Buy Me a Coffee:</label>
                    <input 
                      type="text" 
                      value={bmcUsername}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBmcUsername(val);
                        localStorage.setItem('packcraft_bmc_user', val);
                      }}
                      placeholder="juliiyabrodska"
                      className="w-full bg-zinc-950 border border-zinc-800 text-white font-mono text-xs rounded p-1.5 focus:border-yellow-500 focus:outline-none"
                    />
                    <p className="text-[8px] text-zinc-500 font-mono leading-none pt-0.5">
                      Буде згенеровано лінк: <span className="text-yellow-600/90 break-all">buymeacoffee.com/{bmcUsername || 'your_username'}</span>
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  Вам подобається 3D-студія? Ви можете підтримати розробку, пригостивши розробника горнятком кави! ☕✨
                </p>

                <a
                  href={bmcUsername.startsWith('http') ? bmcUsername : `https://www.buymeacoffee.com/${bmcUsername || 'juliiyabrodska'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#FFDD00] hover:bg-[#ffea45] text-black hover:scale-[1.01] active:scale-[0.99] font-bold text-xs font-mono py-2.5 px-4 rounded flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-[0_4px_12px_rgba(255,221,0,0.15)] select-none focus:ring-1 focus:ring-yellow-400"
                  id="btn-buy-me-coffee"
                >
                  <span className="text-sm">☕</span>
                  <span className="font-extrabold uppercase">BUY ME A COFFEE</span>
                  <ExternalLink className="w-3 h-3 shrink-0 stroke-[2.5px]" />
                </a>
              </div>

              {/* BUSINESS & CUSTOM MODEL INQUIRY WIDGET */}
              <div className="mt-4 p-3 bg-gradient-to-br from-[#121214] to-[#121620] rounded-lg border border-indigo-500/20 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>БІЗНЕС ТА ЗАМОВЛЕННЯ</span>
                  </div>
                  <button 
                    onClick={() => setShowContactConfig(!showContactConfig)}
                    className="text-[9px] font-mono text-zinc-500 hover:text-indigo-400 underline transition-colors cursor-pointer bg-transparent border-0"
                    title="Налаштувати контакти"
                  >
                    {showContactConfig ? 'СХОВАТИ' : 'НАЛАШТУВАТИ КНОПКИ'}
                  </button>
                </div>

                {showContactConfig && (
                  <div className="bg-[#0b0b0c] p-2.5 rounded border border-zinc-800 space-y-3 transition-all">
                    <div>
                      <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">Email для замовлень:</label>
                      <input 
                        type="text" 
                        value={contactEmail}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContactEmail(val);
                          localStorage.setItem('packcraft_contact_email', val);
                        }}
                        placeholder="your-email@gmail.com"
                        className="w-full bg-zinc-950 border border-zinc-800 text-white font-mono text-xs rounded p-1.5 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">Посилання (LinkedIn / Telegram / Website):</label>
                      <input 
                        type="text" 
                        value={socialLink}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSocialLink(val);
                          localStorage.setItem('packcraft_social_link', val);
                        }}
                        placeholder="https://www.linkedin.com/..."
                        className="w-full bg-zinc-950 border border-zinc-800 text-white font-mono text-xs rounded p-1.5 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[8px] text-zinc-500 font-mono leading-tight">
                      Зміни зберігаються локально. Посилання будуть вести на ваші канали зв'язку.
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  Бажаєте унікальну 3D-модель бляшанки чи коробки, адаптацію розмірів або інтеграцію інтерактивного CAD-віджету у ваш сайт?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`mailto:${contactEmail || 'juliiyabrodska@gmail.com'}?subject=${encodeURIComponent('Custom 3D Packaging Order')}&body=${encodeURIComponent('Hello! I am interested in custom 3D packaging layout or interactive packaging solutions. Here are my requirements: ')}`}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] font-mono py-2.5 px-2 rounded flex items-center justify-center space-x-1.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-600/10"
                    id="btn-order-custom-model"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="uppercase text-center">ЗАМОВИТИ МОДЕЛЬ</span>
                  </a>

                  <a
                    href={socialLink || 'https://www.linkedin.com/in/juliiyabrodska'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-[10px] font-mono py-2.5 px-2 rounded flex items-center justify-center space-x-1.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                    id="btn-business-contact"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                    <span className="uppercase text-center">ЗВ'ЯЗОК ДЛЯ БІЗНЕСУ</span>
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* SATELLITE INDUSTRIAL CONSOLE SUMMARY FOOTER */}
          <div className="bg-[#0b0b0c] p-3 rounded-lg border border-coke-border/40 font-mono text-[9px] text-zinc-500 leading-normal select-none">
            <div className="flex justify-between border-b border-coke-border/25 pb-1 mb-1 font-bold text-coke-gray">
              <span>SYSTEM TRACINGS / CACHE LOGS:</span>
              <span>100% OFFLINE CAD CACHE</span>
            </div>
            <div>* 2D unfolded blueprint and 3D mockups are computed dynamically from canister geometry.</div>
            <div>* Contractor agreement seal template is pre-formatted on downstream sheet.</div>
            <div>* Cardboard stock variables adapt on-the-fly to industry ISO-9051 standards.</div>
          </div>

        </section>

      </main>

    </div>
  );
}
