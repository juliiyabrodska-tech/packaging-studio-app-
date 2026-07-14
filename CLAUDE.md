# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development**
```bash
npm run dev          # Start Vite dev server on http://localhost:3000 (port 3000, host 0.0.0.0)
npm run build        # Production build to dist/
npm run preview      # Preview the production build locally
npm run clean        # Remove dist/ and server.js
npm run lint         # TypeScript type-check (tsc --noEmit; no errors = clean)
```

All scripts work on Windows PowerShell and Bash. The project uses ES modules and Vite 6.

## Architecture Overview

### Three-Layer Abstraction

**1. Industry Profiles** (`src/config/industries.ts`)
- 6 profiles: beverage, cosmetics, food, ecommerce, pharma, generic
- Each profile **re-labels terminology** (product noun: "Can"/"Jar"/"Item", variant noun: "Flavor"/"Shade"/"Dosage") without changing geometry
- Re-labeling happens globally via `getIndustry(specs.industry)` and is applied throughout the UI
- When user switches industries, the assortment is re-seeded from the industry's `defaultVariants`
- Unit shape (`can`, `bottle`, `jar`, `box`, `pouch`) determines what silhouette the 3D preview renders

**2. Packaging Archetypes** (5 types in `src/types.ts: PackagingType`)
- `closed_box_2x2`: Folded carton with 4 panels (classic packaging)
- `basket_handle`: Open tray with handle and divider partitions
- `sleeve_pack`: Wrapped sleeve around a rigid insert
- `tube_carton`: Unrolled cylindrical wall + two round end caps
- `pillow_pouch`: Flexible film panel with heat-seal strips

Each archetype has:
- **Die-line geometry** in `src/components/PackagingDielineSVG.tsx` (parametric SVG rendering)
- **BOM area formula** in `src/App.tsx` (computed from L, W, H for cost estimation)
- **PDF page-2 vector drawing** in `src/utils/pdfGenerator.ts` (jsPDF geometry)

**3. Dynamic Assortment Model** (replacing fixed flavor1-4)
- `variants: string[]` array in `PackagingSpecs`; length always equals `gridCols * gridRows`
- **Grid layouts** (5 options): 1×2 (2 units), 1×3 (3 units), 2×2 (4 units), 2×3 (6 units), 3×3 (9 units)
- When user changes grid layout, `buildVariants()` utility intelligently resizes the array:
  - Preserves already-edited variant names
  - Fills new slots from industry `defaultVariants`
  - Falls back to generic `${variantNoun} ${index+1}` labels
- **Carton dimensions auto-scale** from grid:
  - `L = canDiameter * gridCols + 0.24`
  - `W = canDiameter * gridRows + 0.24`
  - `H = canHeight + 0.2`
  - **Important**: Auto-dimension effect in `useEffect` now writes computed values **back to state** (not just localStorage), so the 2D blueprint, 3D preview, and BOM all update live

### State Management

**Single source of truth**: `specs: PackagingSpecs` (React state in `App.tsx`)
- **Persisted to localStorage** as `my_packaging_better_specs` (JSON stringified)
- **Separate white-label state**: `brandName`, `brandInitials`, `brandAccent`, `brandTagline`, `hideSupport` (localStorage key: each field prefixed with `packcraft_`)
- **Backwards compatibility**: On app init, old `flavor1..4` fields are automatically migrated to `variants[]` in the localStorage migration logic

**Why two state objects?**
- Design specs (carton dims, materials, variants) and branding (logo, tagline) evolve independently
- White-label allows re-branding without touching the spec

### Key Components

**`src/App.tsx` (main state holder, ~1350 lines)**
- Central `PackagingSpecs` state and `setSpecs()` updates
- Handlers: `updateSpec()`, `updateVariant()`, `handleGridChange()`, `handleIndustryChange()`, `handleArtworkUpload()`
- Auto-dimension effect that computes L/W/H from grid + unit dims and writes back to state
- 5 control panels (I-V): Structure, Materials, Variants (with grid selector), Options, Sign-off
- White-label config panel (expandable, hidden if `hideSupport` is true)
- Packaging artwork upload widget
- Approval modal dialog with team sign-off checkboxes (Oleh, Serhiy, Maryna)
- Removed: donation section ("Buy Me a Coffee") as it's not applicable in Ukraine

**`src/components/CansAssortmentPreview.tsx` (3D preview, ~400 lines)**
- Renders interactive canvas showing the units in a grid
- Grid adapts to `gridCols × gridRows`; canvas renders `cols` columns of units
- Each unit is a UnitCard component colored by accent (red, green, violet, gold, cycling)
- Artwork (if provided) applies as CSS `backgroundImage` texture on each card
- Dynamic gap calculation: `gap: ${Math.max(1.5, 2.5 - cols * 0.3)}rem` (more gap for fewer columns to prevent overlapping)
- Added `transition-all duration-300` on grid container for smooth layout changes
- Added `animate-in fade-in duration-500` on each unit card for entrance animation
- Labels include dynamic count (e.g., "4 × 0.5 L CANS"), pack config (e.g., "2×2 — 4-UNIT PACK")
- Three 3D unit silhouettes: Box, Cylinder, Sphere (mapped to industry.unitShape)

**`src/components/PackagingDielineSVG.tsx` (2D die-line, ~620 lines)**
- Parametric SVG that adapts to `packagingType`
- Each archetype has its own rendering branch with proper geometry
- All include dimension labels, fold-line markups, and unit-footprint grid showing where units sit
- Color scheme: black background (#1c1c1e), white grid lines, red cut lines, blue fold lines

**`src/utils/pdfGenerator.ts` (PDF export, ~1130 lines)**
- Generates a 2-page PDF using jsPDF
- **Page 1**: BOM specs table + customer build info + sign-off status
  - Dynamic BOM includes structure type, material, dimensions, cost estimate
  - Variant table (capped at 4 rows + "+N more" note for large assortments)
- **Page 2**: Parametric die-line SVG (reused from PackagingDielineSVG component)
- **CSV export**: Row-by-row bill of materials with all variants iterated (no cap)
- **Approval Form PDF**: `generateApprovalFormPDF()` with 7 sections:
  1. Basic specifications (packaging type, dimensions, industry)
  2. Materials & printing (stock, grammage, thickness, method, colors, coating)
  3. Structural options (reinforced base, finger holes, dividers, moisture barrier, tear line)
  4. Assortment breakdown (all unit variants)
  5. Bill of materials & costs (area, weight, per-unit cost, batch cost)
  6. Team approval status (Oleh, Serhiy, Maryna)
  7. Authorized signatures with date fields
- All terminology dynamically sourced from `getIndustry()` so different industries export different labels

### Design System

**Colors** (defined in `src/index.css` with Tailwind @theme)
- `coke-black`: #0d0d0d (darkest background)
- `coke-dark`: #141414 (panel bg)
- `coke-card`: #1c1c1e (component bg)
- `coke-border`: #2c2c2e (divider lines)
- `coke-red`: #E61C24 (brand accent, buttons, alerts)
- `coke-gray`: #8e8e93 (secondary text, muted labels)

**Fonts** (Google Fonts)
- `Plus Jakarta Sans`: UI text (headings, body)
- `JetBrains Mono`: Technical labels, dimensions, serial numbers

**Custom Classes**
- `.blueprint-grid`: Micro-grid background (red-tinted lines at 20px and 100px intervals)
- `.coke-glow-ring`: Glow effect on focus/hover (red gradient halo)
- `.blink-dot`: Slow blink animation (status indicators)
- `.approval-board`: 3-column grid for sign-off signatures (used in PDF)

### Data Model (`src/types.ts`)

```typescript
interface PackagingSpecs {
  industry: IndustryId;                           // beverage | cosmetics | food | ecommerce | pharma | generic
  packagingType: PackagingType;                   // closed_box_2x2 | basket_handle | sleeve_pack | tube_carton | pillow_pouch
  canDiameter: number;                            // cm
  canHeight: number;                              // cm
  cartonLength: number;                           // cm (X-axis, scales with gridCols)
  cartonWidth: number;                            // cm (Y-axis, scales with gridRows)
  cartonHeight: number;                           // cm (Z-axis, fixed offset from canHeight)
  containerMaterial: 'aluminium' | 'glass' | 'pet';
  outerMaterial: 'sbb_kraft' | 'solid_sulfate' | 'recyclable_gd2' | 'pure_kraft';
  materialWeight: string;                         // e.g., "380 g/m²"
  materialThickness: string;                      // e.g., "0.58 mm"
  printingMethod: 'offset' | 'flexo' | 'digital';
  colorsCount: number;                            // 1-8 (inks)
  coatingOption: 'matte' | 'gloss' | 'uv_selective' | 'soft_touch' | 'none';

  // Dynamic assortment (length always = gridCols * gridRows)
  variants: string[];
  gridCols: number;
  gridRows: number;

  // Optional features
  reinforcedBottom: boolean;
  fingerHoles: boolean;
  flavorDividers: boolean;
  moistureBarrier: boolean;
  tearPerforation: boolean;

  // Sign-off (gates PDF export when requireSignoff=true)
  requireSignoff: boolean;
  approvedOleh: boolean;
  approvedSerhiy: boolean;
  approvedMaryna: boolean;

  // White-label + artwork
  artworkUrl: string;                             // data URL of uploaded image
  notes: string;                                  // Custom directives for print engineers
}
```

### Backwards Compatibility

**Old specs migration**: If localStorage contains `flavor1`, `flavor2`, `flavor3`, `flavor4` (string fields), they are automatically converted to a `variants: [flavor1, flavor2, flavor3, flavor4]` array on app init. Default `gridCols=2, gridRows=2` ensures the old 4-unit pack is preserved.

**Why this matters**: Users with saved specs will not lose their custom flavor names when the codebase is updated.

### PDF & Export Logic

**PDF Generation** (`pdfGenerator.ts`)
- All terminology is dynamically sourced from the active `IndustryProfile`
- Product noun (e.g., "Can" vs. "Jar") is used in BOM row headers
- Variant noun (e.g., "Flavor" vs. "Dosage") labels the assortment table
- Die-line page 2 adapts to the selected `packagingType` — different architectures are drawn with different geometry
- Cost estimate is computed from: `totalAreaSqCm * GSM * pricePerM2 / 1000`

**localStorage quota handling**
- Artwork data URLs (images converted to base64) can exceed localStorage capacity (~5–10MB per domain, depending on browser)
- All `localStorage.setItem()` calls are wrapped in `try-catch` with a `console.warn()` fallback (does not throw, gracefully degrades)

### Common Workflows

**Adding a new industry**
1. Add a new `IndustryProfile` entry to `INDUSTRIES[]` in `src/config/industries.ts`
2. Specify: `id`, `label`, `tagline`, `productNoun`, `volumeLabel`, `variantNoun`, `defaultVariants`, `unitShape`
3. The entire UI auto-adapts — no component changes needed

**Adding a new packaging archetype**
1. Add the type to `PackagingType` union in `src/types.ts`
2. Add a new conditional branch in `PackagingDielineSVG.tsx` to render its die-line geometry
3. Add a BOM area formula branch in `App.tsx` (auto-dimension effect)
4. Add PDF page-2 geometry branch in `pdfGenerator.ts`
5. Update `pkgLabel()` helper in `CansAssortmentPreview.tsx` to name it in the 3D preview

**Handling localStorage quota errors**
- Do not throw on quota exceeded; always wrap in try-catch and log a warning
- The app continues to function (spec is not persisted, but the session state is live and can be exported via PDF/CSV)

**Debugging the 3D preview**
- Use browser DevTools (F12) → Elements to inspect the canvas and card components
- Check `specs.artworkUrl` in the console to verify artwork loaded as a data URL
- If units don't render, check that `industry.unitShape` is one of: `can`, `bottle`, `jar`, `box`, `pouch`

## Git Workflow

**Branch naming**: Feature branches use `feat/` prefix (e.g., `feat/whitelabel-artwork-packcount`)

**Commit messages**: Lead with `feat:`, `fix:`, `refactor:`, `chore:` and include a one-line summary. Example:
```
feat: add cylindrical tube carton and pillow pouch archetypes

Two new packaging structures with their own parametric die-lines…
```

**PR strategy**: Prefer one bundled PR per feature set over many small PRs (less review overhead, cleaner history). Use `git merge --squash` when merging to `main`.

## Deployment

**GitHub Pages**: The app is hosted at https://juliiyabrodska-tech.github.io/packaging-studio-app-/

**GitHub Actions Workflow**: `.github/workflows/deploy.yml` automatically builds and deploys to GitHub Pages when pushing to `main`.

**Configuration Required**: Ensure GitHub repository Settings → Pages → Source is set to "GitHub Actions" (not "Deploy from a branch").

The dist/ folder is gitignored (correct for build artifacts), and the workflow uploads it to GitHub Pages automatically.

## Session-Specific Decisions

- **Do not add the donation section** ("Buy Me a Coffee", "CONFIGURE LINK") — not applicable in Ukraine.
- **Grid spacing fix**: Use responsive gap calculation `Math.max(1.5, 2.5 - cols * 0.3)rem` to prevent overlapping units when switching layouts.
- **URL validation**: Wrap all external URL storage (e.g., LinkedIn contact link) in try-catch with URL constructor validation; only save if valid or empty (resets to default).
- **Contact links**: Use actual functional channels (mailto, LinkedIn) not external donation platforms.
- **PDF Layout Improvements**: All die-line drawings have bounds checking to prevent large black fields; automatic page breaks prevent text overlapping on page 1.

## Notes for Future Work

- **Performance**: If 3D canvas lags with large artwork, consider lazy-loading images or compressing before upload.
- **Localization**: The UI currently hard-codes English labels; adding i18n would require extracting all strings to a message catalog.
- **Testing**: No test suite exists yet; adding Jest + React Testing Library would improve refactoring safety.
- **Admin panel**: Currently no user account system; multi-user save/load would require a backend.

---

## Business Context: Lead Magnet + Revenue Stream Strategy

### Positioning (Yulia's No-Code Automation Services)

This app serves **dual purposes**:
1. **Lead Magnet**: Free tool for SMB/Enterprise to design packaging instantly
2. **Upsell Bridge**: "Love the design automation? We can automate your entire CRM / supply chain / customer communication" → sell full n8n + Claude AI automation services ($5-15k per project)

### Client Success Journey

```
Cold LinkedIn outreach → "Free packaging design tool" 
  → User tries app (sees 2D die-line + 3D preview + PDF export + cost in 30 sec)
    → Realizes manual design takes weeks; automation saves 20+ hours
      → Books call: "Can you automate my [CRM sync / supplier quoting / order workflow]?"
        → Closes automation contract using n8n + Claude + HubSpot
```

### Why This Works as Lead Magnet

- **Instant Gratification**: No signup, no login. Design + export PDF in 30 seconds
- **Pain Made Visible**: Grid layout shows assortment complexity → leads to: "Imagine if this auto-updated my supplier database"
- **Professional Output**: Users get polished PDF die-line + BOM → positions Yulia as premium, not cheap
- **White-Label Ready**: Can be re-branded for agencies or suppliers (future revenue stream)

### Integration Points (For Automation Services)

**Scenario 1: Auto-Quote Workflow**
```
User designs packaging → Clicks "Send to Supplier"
  → n8n webhook receives spec JSON
    → Queries supplier pricing API based on material/qty
      → Auto-generates RFQ email → sends via Zapier
        → Logs quote in HubSpot deal → sends notification to approver
```

**Scenario 2: AI Cost Optimization** (Claude + Gemini)
```
User finalizes design → Clicks "AI Optimization Tips"
  → Gemini analyzes spec JSON → suggests: "Reduce height 2cm → save 15% material"
    → User clicks "Apply" → carton auto-resizes → cost updates instantly
      → Approval email sent with optimized spec + savings breakdown
```

**Scenario 3: Multi-Approver Workflow**
```
Designer creates packaging spec
  → Clicks "Request Sign-Off" → email sent to 3 approvers
    → Each approver reviews PDF, checks approval box
      → Once all approve → n8n triggers: PO auto-generation → supplier email sent
        → Order tracked in HubSpot → team notified on Telegram
```

**Current Status**: MVP is standalone. Ready to add webhook triggers and API endpoints for automation.

---

## API & Integration Hooks (Ready for n8n/Zapier)

### Export Formats (For Automation Workflows)

**JSON Spec** (ready to POST to n8n)
```
User clicks "Export for Automation"
  → Returns: { industry, packagingType, variants[], dimensions, materials, cost, ... }
  → n8n receives JSON → parses supplier requirements → sends RFQ → logs in CRM
```

**PDF Export** (ready to email/archive)
```
Already implemented in frontend
  → 2-page PDF: Page 1 = BOM + approvals, Page 2 = die-line
  → Ready to send via email (Zapier) or archive in SharePoint
```

**CSV Bill of Materials** (ready to split by supplier)
```
Already implemented
  → Variant-by-variant material costs
  → n8n can parse CSV → group by supplier → auto-send quote requests
```

### Webhook Trigger Points (To Implement)

```
POST /api/webhook/on-export → triggers n8n: supplier quote + HubSpot sync
POST /api/webhook/on-approve → triggers: auto-generate PO → send to supplier
POST /api/webhook/on-artwork-upload → triggers: brand check (Gemini) + team notify
```

### Gemini Integration (For AI Features)

`@google/genai` is already in dependencies.

**Use Case: Auto-Optimization Button**
```
export async function getOptimizationSuggestions(specs: PackagingSpecs) {
  const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = `Analyze this packaging spec and suggest cost reductions:
  ${JSON.stringify(specs)}
  
  Output: JSON with { suggestions: [ { area, idea, savingsPercent } ] }`;
  
  return await model.generateContent(prompt);
}
```

Then add button in UI: "💡 Get AI Optimization Tips" → displays suggestions inline.

---

## LinkedIn Content Ideas (To Drive Lead Magnet)

**Post 1: Packaging Design Speed**
"Packaging design used to take our team 3 weeks. Now it's 3 minutes. Try the free tool → https://[app-link]"

**Post 2: Automation Opportunity**
"If packaging design can be instant, imagine what we can do with your CRM, supply chain, customer communication. That's what automation looks like."

**Post 3: Integration Demo**
Show 2D die-line → 3D preview → PDF export in 15-second video. Message: "This design tool connects to n8n, Claude AI, HubSpot to automate your entire packaging workflow."

**Post 4: Industry Proof**
Case study format: "Craft brewery was manually designing labels, updating supplier orders, tracking inventory. Now? All automated. Zero manual work."
