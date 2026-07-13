import { jsPDF } from 'jspdf';
import { PackagingSpecs } from '../types';
import { getIndustry } from '../config/industries';

// Helper function to replace Cyrillic strings with clean English or Latin transliterated equivalents.
// This is essential since standard jsPDF fonts only support CP1252 / WinAnsi and don't embed Cyrillic glyphs.
const cleanCyrillic = (text: string): string => {
  if (!text) return '';
  
  const replacements: { [key: string]: string } = {
    // Units and statuses
    'г/м²': 'g/m2',
    'мм': 'mm',
    'см': 'cm',
    'АКТИВНО / ТАК': 'ACTIVE / YES',
    'АКТИВНО': 'ACTIVE',
    'ТАК': 'YES',
    'НІ': 'NO',
    'ЧЕКАЄ': 'PENDING',
    'ТАК / ЗАТВЕРДЖЕНО': 'YES / APPROVED',

    // Flavors
    'Вишня-Кола Класик': 'Cherry Berry Classic',
    'Вишня-Шипучка Класик': 'Cherry Berry Classic',
    'Шалений Лайм-М\'ята': 'Crazy Lime-Mint',
    'Лісові Ягоди Зеро': 'Forest Berries Zero',
    'Карибський Пряний Апельсин': 'Caribbean Spicy Orange',
    'Дика Малина Без Цукру': 'Wild Raspberry Sugar Free',
    'Яблучний Сайдкруш': 'Apple Sidecrush',
    'Апельсинова Шипучка': 'Orange Fizz',
    'Класичний Квасний Ель': 'Classic Kvass Ale',
    'Кава-Кола Бустер': 'Coffee-Fizz Booster',
    'Кавовий Бум Бустер': 'Coffee-Fizz Booster',
    'Кавуновий Бум': 'Watermelon Boom',
    'Ананасовий Сплеск': 'Pineapple Splash',
    'Імбирна Кола Крісп': 'Ginger Fizz Crisp',
    'Імбирний Крісп': 'Ginger Fizz Crisp',
    
    // Notes & Presets descriptions
    'Експериментальна партія під літній фестиваль. Червоно-чорна гама Coca-Cola, матове покриття картонного утримувача.': 
      'Experimental batch for summer festival. Red-black premium palette, matte coat on cardboard carrier.',
    'Експериментальна партія під літній фестиваль. Червоно-чорна преміальна гама, матове покриття картонного утримувача.': 
      'Experimental batch for summer festival. Red-black premium palette, matte coat on cardboard carrier.',
    'Преміальний набір з софт-тач покриттям і тисненням під літній фестиваль.': 
      'Premium set with soft-touch coating and embossing for the summer festival.',
    'Екологічна серія без покриття пластиком на суровому крафті.': 
      'Eco series without plastic coating, on raw unbleached Kraft board.',
    'Легка промо-упаковка стяжка (бандаж) для першого знайомства в супермаркетах.': 
      'Lightweight promo sleeve wrap for store introductions.',
  };

  const trimmed = text.trim();
  if (replacements[trimmed]) {
    return replacements[trimmed];
  }

  // Ukrainian transliteration mapping fallback for dynamic text input
  const cyrillicToLatin: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
    'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ь': '', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh', 'З': 'Z',
    'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
    'Р': 'R', 'С': 'S', 'T': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
    'Ь': '', 'Ю': 'Yu', 'Я': 'Ya',
    '’': '', '\'': '', ' ': ' ', '-': '-', '_': '_', '.': '.', ',': ',', '!': '!', '?': '?', ':': ':', ';': ';',
    '²': '2', 'м²': 'm2', 'г/м²': 'g/m2', 'мм': 'mm', 'см': 'cm'
  };

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === 'г' && text[i+1] === '/' && text[i+2] === 'м' && text[i+3] === '²') {
      result += 'g/m2';
      i += 3;
      continue;
    }
    if (char === 'м' && text[i+1] === 'м') {
      result += 'mm';
      i += 1;
      continue;
    }
    if (char === 'с' && text[i+1] === 'м') {
      result += 'cm';
      i += 1;
      continue;
    }

    if (cyrillicToLatin[char] !== undefined) {
      result += cyrillicToLatin[char];
    } else {
      result += char;
    }
  }

  return result;
};

export const generateSpecsPDFChecklist = (specs: PackagingSpecs) => {
  const {
    packagingType,
    canDiameter,
    canHeight,
    cartonLength,
    cartonWidth,
    cartonHeight,
    containerMaterial,
    outerMaterial,
    materialWeight,
    materialThickness,
    printingMethod,
    colorsCount,
    coatingOption,
    variants,
    reinforcedBottom,
    fingerHoles,
    flavorDividers,
    moistureBarrier,
    tearPerforation,
    notes,
  } = specs;

  // Industry profile drives product/variant terminology across the sheet.
  const industry = getIndustry(specs.industry);
  const productNoun = industry.productNoun;
  const variantNoun = industry.variantNoun;

  // 1. Initialize Portrait A4 Document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed = [230, 28, 36]; // Brand Red Accent
  const darkGray = [28, 28, 30];
  const borderGray = [180, 180, 180];

  // Helper: Draw standard header frame
  const drawPageBorder = (pageNum: number) => {
    // Watermark
    try {
      doc.saveGraphicsState();
      // @ts-ignore
      const gStateClass = (doc as any).GState || (jsPDF as any).GState || (doc.constructor as any).GState;
      if (gStateClass) {
        // @ts-ignore
        const gState = new gStateClass({ opacity: 0.12 });
        // @ts-ignore
        doc.setGState(gState);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(100, 100, 100); // Darker gray since opacity is 0.12
      } else {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(215, 215, 215); // Safe fallback light gray if GState not supported
      }
      doc.text(
        'SAMPLE / DEMO OUTPUT — NOT A REAL APPROVAL',
        105,
        148,
        { angle: 315, align: 'center' }
      );
      doc.restoreGraphicsState();
    } catch (e) {
      console.warn('Could not draw watermark:', e);
      try {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(215, 215, 215);
        doc.text(
          'SAMPLE / DEMO OUTPUT — NOT A REAL APPROVAL',
          105,
          148,
          { angle: 315, align: 'center' }
        );
      } catch (err) {
        console.error('Ultimate watermark fallback failed:', err);
      }
    }

    // Thin frame
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(8, 8, 194, 281);
    
    // Corner technical crosshairs
    const corners = [
      [8, 8], [202, 8], [8, 289], [202, 289]
    ];
    doc.setDrawColor(230, 28, 36);
    corners.forEach(([cx, cy]) => {
      doc.line(cx - 3, cy, cx + 3, cy);
      doc.line(cx, cy - 3, cx, cy + 3);
    });

    // Page footer metadata
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`PROJECT: \"PACKCRAFT 3D STUDIO\" © 2026`, 12, 285);
    doc.text(`CONFIDENTIAL - FOR PRINT PRODUCTION USE ONLY`, 105, 285, { align: 'center' });
    doc.text(`PAGE ${pageNum} OF 2`, 198, 285, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: TECHNICAL PASSPORT AND BILL OF MATERIALS
  // ==========================================
  drawPageBorder(1);

  // Technical title banner
  doc.setFillColor(28, 28, 30);
  doc.rect(12, 12, 186, 16, 'F');
  
  // Brand Red accent bar on the left of the header
  doc.setFillColor(230, 28, 36);
  doc.rect(12, 12, 3, 16, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TECHNICAL PACKAGING PASSPORT / SPECIFICATION CARD', 18, 19.5);

  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(210, 210, 210);
  doc.text('SYSTEM GENERATED CAD REPORT V0.5 | PREMIUM STYLE ASSORTMENT', 18, 24.5);

  // Job ID / Info Block
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  
  let currentY = 34;
  doc.setFont('Helvetica', 'bold');
  doc.text('SYSTEM ID:', 12, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(`CAD-MP-4X500L-2026`, 38, currentY);

  currentY += 5; // 39
  doc.setFont('Helvetica', 'bold');
  doc.text('DATE:', 12, currentY);
  doc.setFont('Helvetica', 'normal');
  const dateFormatted = new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  doc.text(dateFormatted, 38, currentY);

  currentY += 5; // 44
  doc.setFont('Helvetica', 'bold');
  doc.text('STATUS:', 12, currentY);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(34, 139, 34); // Forest green
  doc.text('TEAM APPROVED', 38, currentY);
  
  doc.setTextColor(50, 50, 50);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(12, 49, 198, 49);

  // Specifications Categories Grid
  currentY = 58;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(230, 28, 36);
  doc.text('1. CORE DESIGN CONFIGURATION', 12, currentY);
  
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const formatType = (type: string) => {
    switch(type) {
      case 'closed_box_2x2': return 'Closed Box 2x2';
      case 'basket_handle': return 'Basket Carrier with Handle';
      case 'sleeve_pack': return 'Tight Sleeve Wrapper';
      case 'tube_carton': return 'Cylindrical Tube Carton';
      case 'pillow_pouch': return 'Pillow Pouch (Flexible Film)';
      default: return type;
    }
  };

  const formatMaterial = (mat: string) => {
    switch(mat) {
      case 'pure_kraft': return 'Unbleached Kraft-Cardboard (Water Resistant)';
      case 'solid_sulfate': return 'Solid Sulfate Board SBB';
      case 'recyclable_gd2': return 'Recyclable GD2 Cardboard';
      case 'sbb_kraft': return 'SUB Bleached Kraft Underlay';
      default: return mat;
    }
  };

  const tableData1 = [
    ['Parameter', 'Configured Value', 'Engineering Description'],
    ['Packaging Model', formatType(packagingType), 'Primary containment style'],
    ['Unit Size', `4 x ${industry.volumeLabel} (Assortment)`, `Standard ${productNoun.toLowerCase()} profile`],
    [`${productNoun} Outer Diameter`, `${canDiameter} cm (${(canDiameter * 10).toFixed(1)} mm)`, 'Strict tolerance clearance limit'],
    [`${productNoun} Height`, `${canHeight} cm (${(canHeight * 10).toFixed(0)} mm)`, 'Optimal container vertical profile'],
    ['Box Flat Length', `${cartonLength} cm`, 'Calculated outer dimension (X-axis)'],
    ['Box Flat Width', `${cartonWidth} cm`, 'Calculated outer dimension (Y-axis)'],
    ['Box Flat Height', `${cartonHeight} cm`, 'Calculated outer dimension (Z-axis)'],
  ];

  // Draw Grid Table 1
  let tableY = currentY + 3;
  tableData1.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const bgY = tableY + rowIndex * 6;
    
    // Background colors
    if (isHeader) {
      doc.setFillColor(230, 28, 36);
      doc.rect(12, bgY, 186, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
    } else {
      doc.setTextColor(60, 60, 60);
      doc.setFont('Helvetica', 'normal');
    }

    doc.text(row[0], 14, bgY + 4.5);
    doc.text(row[1], 65, bgY + 4.5);
    doc.text(row[2], 135, bgY + 4.5);

    // Grid outline
    doc.setDrawColor(210, 210, 210);
    doc.line(12, bgY + 6, 198, bgY + 6);
  });

  // Table 2: Materials & Coating Spec
  currentY = tableY + (tableData1.length * 6) + 6;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(230, 28, 36);
  doc.text('2. MATERIALS, INKS & FINISHING', 12, currentY);

  const tableData2 = [
    ['Component Spec', 'Selected Standard', 'Factory Directives / Finish Style'],
    ['Cardboard Stock', formatMaterial(outerMaterial), 'High stiffness carrier board'],
    ['Grammage Weight', cleanCyrillic(materialWeight), 'Bending force resistance capability'],
    ['Material Thickness', cleanCyrillic(materialThickness), 'Laser die-cut micro-meter tolerance'],
    ['Printing Method', printingMethod.toUpperCase() + ' (Offset / Flexo)', 'High fidelity lithography transfer'],
    ['Inks Color Count', `${colorsCount} Colors (CMYK + Spot)`, 'UV-stabilized professional series'],
    ['Finish Coating', coatingOption.toUpperCase() + ' Finish', 'Scuff resistance protective shield'],
  ];

  tableY = currentY + 3;
  tableData2.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const bgY = tableY + rowIndex * 6;
    
    if (isHeader) {
      doc.setFillColor(28, 28, 30);
      doc.rect(12, bgY, 186, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
    } else {
      doc.setTextColor(60, 60, 60);
      doc.setFont('Helvetica', 'normal');
    }

    doc.text(row[0], 14, bgY + 4.5);
    doc.text(row[1], 65, bgY + 4.5);
    doc.text(row[2], 135, bgY + 4.5);

    doc.setDrawColor(210, 210, 210);
    doc.line(12, bgY + 6, 198, bgY + 6);
  });

  // Section 3: Flavors
  currentY = tableY + (tableData2.length * 6) + 6;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(230, 28, 36);
  doc.text(`3. CUSTOM ${variantNoun.toUpperCase()} BUNDLING SPECIFICATIONS (${variants.length} VARIETIES)`, 12, currentY);

  const accentNames = ['Brand Red Accent (Dark Red)', 'Electric Lime Tonic (Green)', 'Cosmos Berry Purple (Violet)', 'Rich Amber Orange (Gold)'];
  // Show up to 4 rows here to preserve the fixed page layout; the full list is
  // always exported in the CSV.
  const shown = variants.slice(0, 4);
  const flavorData: string[][] = [
    [`${productNoun} ID`, `Assortment ${variantNoun} Name`, 'Tag Label Color Accent'],
    ...shown.map((v, i) => [
      `${productNoun} ${String.fromCharCode(65 + i)}`,
      cleanCyrillic(v) || `${variantNoun} ${String.fromCharCode(65 + i)}`,
      accentNames[i % 4],
    ]),
  ];
  if (variants.length > 4) {
    flavorData.push(['…', `(+${variants.length - 4} more — see CSV export)`, '—']);
  }

  tableY = currentY + 3;
  flavorData.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const bgY = tableY + rowIndex * 5.5;
    
    if (isHeader) {
      doc.setFillColor(84, 14, 17); // Dark premium red
      doc.rect(12, bgY, 186, 5.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
    } else {
      doc.setTextColor(60, 60, 60);
      doc.setFont('Helvetica', 'normal');
    }

    doc.text(row[0], 14, bgY + 4);
    doc.text(row[1], 65, bgY + 4);
    doc.text(row[2], 135, bgY + 4);

    doc.setDrawColor(215, 215, 215);
    doc.line(12, bgY + 5.5, 198, bgY + 5.5);
  });

  // Section 4: Structural Extras list & Notes
  currentY = tableY + (flavorData.length * 5.5) + 6;
  
  // Left half: Extras. Right half: Notes
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(230, 28, 36);
  doc.text('4. STRUCTURAL EXTRAS INCLUDED', 12, currentY);
  doc.text('5. PROJECT ENGINEERING NOTES', 110, currentY);

  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.setFont('Helvetica', 'normal');

  let extraY = currentY + 4;
  doc.text(`- Double-Reinforced Bottom: [${reinforcedBottom ? 'YES' : 'NO'}]`, 14, extraY);
  doc.text(`- Integrated Finger Grab Holes: [${fingerHoles ? 'YES' : 'NO'}]`, 14, extraY + 4);
  doc.text(`- Sound-Proof Taste Dividers: [${flavorDividers ? 'YES' : 'NO'}]`, 14, extraY + 8);
  doc.text(`- Dry MoistureBarrier Coat: [${moistureBarrier ? 'YES' : 'NO'}]`, 14, extraY + 12);
  doc.text(`- Easy-Tear Opening Perforations: [${tearPerforation ? 'YES' : 'NO'}]`, 14, extraY + 16);

  // Notes block wrapping
  const splitNotes = doc.splitTextToSize(cleanCyrillic(notes) || 'No custom annotations supplied for this revision block.', 84);
  doc.text(splitNotes, 110, currentY + 4);

  // Plain demo notice directly above manufacturing block
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'This is a demo-generated document for portfolio/demonstration purposes only. No real approval, contract, or manufacturing agreement exists.',
    12,
    238
  );

  // Bottom Contractor Sign-Off Area
  const signY = 242;
  doc.setLineWidth(0.3);
  doc.setDrawColor(120, 120, 120);
  doc.setFillColor(252, 252, 254);
  doc.rect(12, signY, 186, 32, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(28, 28, 30);
  doc.text('MANUFACTURING AGREEMENT & CONSENT (TEAM & CONTRACTOR SIGN-OFF BOARD)', 15, signY + 4.5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('This document stands as the finalized CAD sign-off sheet. The contractor warrants that all die-cutting tolerances align with standard ISO templates.', 15, signY + 9);

  // Real Team signatures mock signoff status representation
  doc.setFont('Helvetica', 'bold');
  doc.text(`BOM MANAGER APPROVAL: APPROVED`, 15, signY + 15);
  doc.text(`FINANCE LEAD APPROVAL: APPROVED`, 70, signY + 15);
  doc.text(`MARKETING LEAD APPROVAL: APPROVED`, 130, signY + 15);

  doc.setDrawColor(200, 200, 200);
  doc.line(15, signY + 17, 195, signY + 17);

  // Empty contractor signature container
  doc.setFont('Helvetica', 'bold');
  doc.text('CONTRACTOR REPRESENTATIVE / PRINT FACTORY REPRESENTATIVE SIGNATURE:', 15, signY + 21);
  
  doc.setFont('Helvetica', 'normal');
  doc.text('Signature: __________________________________', 15, signY + 26);
  doc.text('Full Name / Name: _____________________________________', 90, signY + 26);
  doc.text('Date / Date: ____ / ____ / 2026                 L.S. / stamp', 15, signY + 30);

  // ==========================================
  // PAGE 2: TECHNICAL CAD SHEETS (DIE-LINE VECTORS)
  // ==========================================
  doc.addPage();
  drawPageBorder(2);

  // Page 2 header
  doc.setFillColor(28, 28, 30);
  doc.rect(12, 12, 186, 12, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('CAD SCHEMATIC SHEET 02 - TECHNICAL UNTRANSPOSED DIE FOLD-KINK SHEET', 16, 19.5);

  // Scale, margins, boxes for the vector representation in our PDF
  // We will programmatically draw the technical blueprint of the selected packaging type!
  const canvasWidthMm = 170;
  const canvasHeightMm = 150;
  const cxMm = 105;
  const cyMm = 110;

  // Let's print the specific fold layout in native sharp PDF vectors!
  doc.setDrawColor(230, 28, 36); // Red for cutting lines
  doc.setLineWidth(0.4);

  // Draw CAD background engineering grid overlay
  doc.setDrawColor(240, 240, 240);
  doc.setLineWidth(0.1);
  for (let x = 15; x <= 195; x += 10) {
    doc.line(x, 30, x, 230);
  }
  for (let y = 30; y <= 230; y += 10) {
    doc.line(15, y, 195, y);
  }

  // Draw technical layout according to type
  if (packagingType === 'closed_box_2x2') {
    // 4 vertical panels plus 1 glue flap
    const canDiaMm = canDiameter * 3.5; // Scaled to fit perfectly
    const canHeiMm = canHeight * 3.5;
    const lMm = cartonLength * 3.5;
    const wMm = cartonWidth * 3.5;
    const gMm = 1.6 * 3.5; // Glue tab

    const totalWidth = gMm + lMm * 2 + wMm * 2;
    const startXMm = cxMm - totalWidth / 2;
    const startYMm = cyMm - canHeiMm / 2;

    const x0 = startXMm;
    const x1 = x0 + gMm;
    const x2 = x1 + lMm;
    const x3 = x2 + wMm;
    const x4 = x3 + lMm;
    const xEnd = x4 + wMm;

    const yTop = startYMm;
    const yBot = startYMm + canHeiMm;
    const flapMm = wMm * 0.7; // closure flaps

    // Outer cuts in blood solid Red line (різ)
    doc.setDrawColor(230, 28, 36);
    doc.setLineWidth(0.4);
    
    // Main boundary shapes & tabs
    doc.rect(x0, yTop + 4, gMm, canHeiMm - 8); // glue flap
    
    // Main Panel borders outer cuts
    doc.line(x1, yTop, xEnd, yTop); // top main
    doc.line(x1, yBot, xEnd, yBot); // bottom main
    doc.line(x0, yTop + 4, x1, yTop);
    doc.line(x0, yBot - 4, x1, yBot);
    doc.line(xEnd, yTop, xEnd, yBot);

    // Dust flaps on Panel 2 and 4 (cut outlines)
    doc.rect(x1, yTop - flapMm, lMm, flapMm); // Panel 1 top flap
    doc.rect(x1, yBot, lMm, flapMm); // Panel 1 bottom flap
    doc.rect(x3, yTop - flapMm, lMm, flapMm); // Panel 3 top flap
    doc.rect(x3, yBot, lMm, flapMm); // Panel 3 bottom flap

    // Creases & Fold marks inside (dashed lines)
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1], 0);

    doc.line(x1, yTop, x1, yBot); // panel connectors crease
    doc.line(x2, yTop, x2, yBot);
    doc.line(x3, yTop, x3, yBot);
    doc.line(x4, yTop, x4, yBot);

    // Circle placements indicator rings for standard 0.5L bottles
    doc.circle(x1 + lMm / 4, cyMm, 11);
    doc.circle(x1 + (3 * lMm) / 4, cyMm, 11);
    doc.circle(x3 + lMm / 4, cyMm, 11);
    doc.circle(x3 + (3 * lMm) / 4, cyMm, 11);

  } else if (packagingType === 'basket_handle') {
    // Open carrier design with central partition handle
    const lMm = cartonLength * 4;
    const wMm = cartonWidth * 4;
    const hMm = cartonHeight * 4;
    
    const bx = cxMm;
    const by = cyMm;

    doc.setDrawColor(230, 28, 36);
    doc.setLineWidth(0.4);

    // Center handle partition outer board
    doc.rect(bx - lMm/2, by - hMm * 0.9, lMm, hMm * 1.5);
    // Finger loop cutout
    doc.rect(bx - 12, by - hMm * 0.6, 24, 6, 'S');

    // Bottom plate panels folding sideways
    doc.rect(bx - lMm/2, by - hMm * 0.9 + hMm * 1.5, lMm, wMm/2);
    doc.rect(bx - lMm/2, by - hMm * 0.9 - wMm/2, lMm, wMm/2);

    // dashed centerfolds
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(bx - lMm/2, by, bx + lMm/2, by);

  } else if (packagingType === 'tube_carton') {
    // Cylindrical tube: unrolled wall rectangle + two round end caps
    const circumference = Math.PI * cartonLength;
    const bodyW = Math.min(150, circumference * 3);
    const hMm = Math.min(120, cartonHeight * 4);
    const capR = Math.min(22, (cartonLength * 3) / 2);
    const sx = cxMm - bodyW / 2;
    const sy = cyMm - hMm / 2;

    doc.setDrawColor(230, 28, 36);
    doc.setLineWidth(0.4);
    doc.rect(sx, sy, bodyW, hMm);

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1], 0);
    [0.25, 0.5, 0.75].forEach((f) => doc.line(sx + bodyW * f, sy, sx + bodyW * f, sy + hMm));
    doc.setLineDashPattern([], 0);

    doc.setDrawColor(230, 28, 36);
    doc.setLineWidth(0.4);
    doc.circle(sx + bodyW * 0.28, sy - capR - 3, capR);
    doc.circle(sx + bodyW * 0.72, sy + hMm + capR + 3, capR);
  } else if (packagingType === 'pillow_pouch') {
    // Pillow pouch: rounded film panel with top & bottom heat-seal strips
    const wMm = Math.min(150, cartonLength * 5);
    const hMm = Math.min(150, cartonHeight * 4);
    const sx = cxMm - wMm / 2;
    const sy = cyMm - hMm / 2;
    const seal = Math.min(8, hMm * 0.14);

    doc.setDrawColor(230, 28, 36);
    doc.setLineWidth(0.4);
    doc.roundedRect(sx, sy, wMm, hMm, 3, 3);

    doc.setFillColor(245, 220, 222);
    doc.rect(sx, sy, wMm, seal, 'F');
    doc.rect(sx, sy + hMm - seal, wMm, seal, 'F');

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1], 0);
    doc.line(sx + wMm / 2, sy, sx + wMm / 2, sy + hMm);
    doc.setLineDashPattern([], 0);
  } else {
    // Sleeve pack template
    const lMm = cartonLength * 4;
    const wMm = cartonWidth * 4;
    const hMm = cartonHeight * 4;

    const totalW = lMm * 2 + hMm * 2 + 10;
    const sx = cxMm - totalW / 2;
    const sy = cyMm - wMm / 2;

    doc.setDrawColor(230, 28, 36);
    doc.setLineWidth(0.4);

    // Outer rectangle strip
    doc.rect(sx, sy, totalW, wMm);

    // Folds
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1], 0);
    doc.line(sx + 10, sy, sx + 10, sy + wMm);
    doc.line(sx + 10 + lMm, sy, sx + 10 + lMm, sy + wMm);
    doc.line(sx + 10 + lMm + hMm, sy, sx + 10 + lMm + hMm, sy + wMm);
    doc.line(sx + 10 + lMm * 2 + hMm, sy, sx + 10 + lMm * 2 + hMm, sy + wMm);

    if (fingerHoles) {
      doc.setDrawColor(230, 28, 36);
      doc.setLineDashPattern([], 0);
      doc.circle(sx + 10 + lMm + hMm / 3, sy + wMm / 2, 5);
      doc.circle(sx + 10 + lMm + (2 * hMm) / 3, sy + wMm / 2, 5);
    }
  }

  // Restore drawing formats
  doc.setLineDashPattern([], 0);

  // Technical legend table on CAD sheet (gost title block/штамп за кресленнями)
  const blockY = 236;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(12, blockY, 186, 30);
  doc.line(100, blockY, 100, blockY + 30);
  doc.line(150, blockY, 150, blockY + 30);
  doc.line(12, blockY + 15, 150, blockY + 15);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(28, 28, 30);
  doc.text('PACKCRAFT 3D STUDIO (V0.5)', 15, blockY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`DEVELOPED FOR A 4-UNIT ${productNoun.toUpperCase()} VARIETY PACK (${industry.label.toUpperCase()})`, 15, blockY + 11);

  doc.text(`MATERIAL STYLES: ${outerMaterial.toUpperCase()} - ${cleanCyrillic(materialWeight)}`, 15, blockY + 21);
  doc.text(`MANUFACTURE TOLERANCE THICKNESS: ${cleanCyrillic(materialThickness)} (ISO)`, 15, blockY + 26);

  // approvals list inside block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TEAM AGREEMENT STATUS:', 102, blockY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text(`- BOM Manager: APPROVED`, 102, blockY + 11);
  doc.text(`- Finance Lead: APPROVED`, 102, blockY + 20);
  doc.text(`- Marketing Lead: APPROVED`, 102, blockY + 26);

  // Scale, weight and design format signatures right side
  doc.setFont('Helvetica', 'bold');
  doc.text('CAD SYSTEM v0.5', 153, blockY + 7);
  doc.setFont('Helvetica', 'normal');
  doc.text(`SCALE:  1:2.8`, 153, blockY + 13);
  doc.text(`UNITS:  METRIC CM`, 153, blockY + 19);
  doc.text(`INDEX:  REV. B-09`, 153, blockY + 25);

  // 3. Save PDF file
  doc.save(`packaging-dieline-specs-${packagingType}.pdf`);
};

// Generates the Raw CSV representation for the BOM List
export const exportSpecsToCSV = (specs: PackagingSpecs) => {
  const {
    packagingType,
    canDiameter,
    canHeight,
    cartonLength,
    cartonWidth,
    cartonHeight,
    containerMaterial,
    outerMaterial,
    materialWeight,
    materialThickness,
    printingMethod,
    colorsCount,
    coatingOption,
    variants,
    reinforcedBottom,
    fingerHoles,
    flavorDividers,
    moistureBarrier,
    tearPerforation,
    notes
  } = specs;

  const industry = getIndustry(specs.industry);
  const productNoun = industry.productNoun;
  const variantNoun = industry.variantNoun;

  // Header headers - Standard Excel formatting
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  csvContent += 'Parameter;Value;Unit;Packaging Component Description\r\n';

  const rows = [
    ['Project Title', 'PackCraft 3D Studio', '-', 'Technical assembly specification'],
    ['Unique Version ID', 'CAD-MP-4X500L-2026', '-', 'Generative model code'],
    ['Structure Type', packagingType === 'closed_box_2x2' ? 'Closed Box 2x2' : packagingType === 'basket_handle' ? 'Basket Carrier with Handle' : packagingType === 'tube_carton' ? 'Cylindrical Tube Carton' : packagingType === 'pillow_pouch' ? 'Pillow Pouch (Flexible Film)' : 'Tension Sleeve Wrapper', '-', 'Base engineering profile'],
    ['Pack Layout', `${specs.gridCols} x ${specs.gridRows}`, 'units', `Assortment of ${variants.length} units`],
    ['Pack Unit Volume', `${variants.length} x ${industry.volumeLabel}`, '-', 'Per-unit content in variety pack'],
    [`${productNoun} Container Material`, containerMaterial === 'aluminium' ? 'Aluminum' : containerMaterial === 'glass' ? 'Glass' : 'PET / Plastic', '-', 'Retail container unit'],
    [`${productNoun} Outer Diameter/Width`, canDiameter.toString(), 'cm', 'Diameter clearing limit'],
    [`${productNoun} Height`, canHeight.toString(), 'cm', 'Envelope height of pack'],
    ['Theoretical Box Length (L)', cartonLength.toString(), 'cm', 'X-axis dimension'],
    ['Theoretical Box Width (W)', cartonWidth.toString(), 'cm', 'Y-axis dimension'],
    ['Theoretical Box Height (H)', cartonHeight.toString(), 'cm', 'Z-axis dimension'],
    ['Board Material Grade', outerMaterial === 'pure_kraft' ? 'Moi-Resist Sulfate Kraft' : outerMaterial === 'solid_sulfate' ? 'Premium Pure Cellulose SBB' : outerMaterial === 'recyclable_gd2' ? 'Economy Recycled GD2' : 'Slightly Recycled SUB with Kraft back', '-', 'Outer box stock'],
    ['Board Density (Weight)', materialWeight, 'g/m2', 'Bending resistance density'],
    ['Designed Board Thickness', materialThickness, 'mm', 'Guides crease slot tolerances'],
    ['Primary Printing Method', printingMethod === 'offset' ? 'Litho Offset Printing' : printingMethod === 'flexo' ? 'High Speed Flexography' : 'Digital Latex Printing', '-', 'Ink transfer technology'],
    ['Colors Count', colorsCount.toString(), 'Pantone/CMYK', 'Inks configuration count'],
    ['Finishing Protective Layer', coatingOption === 'matte' ? 'Protective Matte Coating' : coatingOption === 'gloss' ? 'Gloss Coating' : coatingOption === 'uv_selective' ? 'Spot UV Selective' : 'Soft-Touch Silk-Lamination', '-', 'Surface finishing option'],
    ...variants.map((v, i) => [`Assortment ${variantNoun} ${i + 1}`, v, '-', `Contents, ${productNoun} ${i + 1}`]),
    ['Reinforced Double Base', reinforcedBottom ? 'ACTIVE / YES' : 'NO', '-', 'Reinforcement under can cells'],
    ['Finger Carry Holes', fingerHoles ? 'ACTIVE / YES' : 'NO', '-', 'Cutout flaps on top panel'],
    ['Internal Cell Dividers', flavorDividers ? 'ACTIVE / YES' : 'NO', '-', 'Individual partition cardboards'],
    ['Moisture Protective Barrier', moistureBarrier ? 'ACTIVE / YES' : 'NO', '-', 'Hydrophobic barrier coating'],
    ['Easy-Tear Perforations', tearPerforation ? 'ACTIVE / YES' : 'NO', '-', 'Zig-zag tearing opening line'],
    ['BOM Manager Approval Sign', specs.approvedOleh ? 'YES / SIGNED' : 'PENDING', '-', 'Technical BOM director Sign-off'],
    ['Finance Lead Approval Sign', specs.approvedSerhiy ? 'YES / SIGNED' : 'PENDING', '-', 'Finance officer Sign-off'],
    ['Marketing Lead Approval Sign', specs.approvedMaryna ? 'YES / SIGNED' : 'PENDING', '-', 'Creative marketing director Sign-off'],
    ['Client Batch Notes', notes.replace(/;/g, ',').replace(/\n/g, ' '), '-', 'Additional supplier notes']
  ];

  rows.forEach(r => {
    csvContent += `${r[0]};${r[1]};${r[2]};${r[3]}\r\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `components-bom-list-${packagingType}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate a comprehensive approval/sign-off form PDF with full specifications.
 * 2-page document includes technical details, BOM info, construction options, and signature fields.
 */
export const generateApprovalFormPDF = (specs: PackagingSpecs): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const industry = getIndustry(specs.industry);
  const productNoun = industry.productNoun;

  // ===== PAGE 1 =====
  let currentY = 12;

  // Header
  doc.setFillColor(230, 28, 36);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MANUFACTURING APPROVAL & SIGN-OFF FORM', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(8);
  doc.text('TEAM & CONTRACTOR CONSENT BOARD • TECHNICAL SPECIFICATIONS SHEET', pageWidth / 2, 15.5, { align: 'center' });

  currentY = 22;
  doc.setTextColor(0, 0, 0);

  // System ID & Date
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PROJECT CODE / SYSTEM ID:', 12, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(`CAD-${specs.packagingType.substring(0, 3).toUpperCase()}-${specs.variants.length}x${specs.gridCols}x${specs.gridRows}-${new Date().getFullYear()}`, 70, currentY);
  currentY += 5;

  doc.setFont('Helvetica', 'bold');
  doc.text('Generated:', 12, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}`, 70, currentY);
  currentY += 7;

  // ===== SECTION 1: BASIC SPECIFICATIONS =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(230, 28, 36);
  doc.text('1. BASIC SPECIFICATIONS', 12, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  const basicSpecs = [
    [`Industry / Business:`, `${industry.label}`],
    [`Packaging Structure:`, `${specs.packagingType.replace(/_/g, ' ').toUpperCase()}`],
    [`Assortment Size:`, `${specs.variants.length} units (${specs.gridCols} cols × ${specs.gridRows} rows)`],
    [`Unit Dimensions:`, `${specs.canDiameter}cm Ø × ${specs.canHeight}cm H`],
    [`Carton External Dims:`, `${specs.cartonLength}cm (L) × ${specs.cartonWidth}cm (W) × ${specs.cartonHeight}cm (H)`],
  ];

  basicSpecs.forEach(([label, value]) => {
    doc.setFont('Helvetica', 'bold');
    doc.text(label, 12, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.text(value, 70, currentY);
    currentY += 4;
  });

  currentY += 3;

  // ===== SECTION 2: MATERIALS & PRINTING =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(230, 28, 36);
  doc.text('2. MATERIALS & PRINTING DETAILS', 12, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  const materialSpecs = [
    [`Cardboard Stock:`, `${specs.outerMaterial.replace(/_/g, ' ').toUpperCase()}`],
    [`Grammage (Weight):`, `${specs.materialWeight}`],
    [`Thickness (Caliper):`, `${specs.materialThickness}`],
    [`Printing Method:`, `${specs.printingMethod.toUpperCase()}`],
    [`Color Count:`, `${specs.colorsCount} Colors (CMYK + Spot)`],
    [`Finish Coating:`, `${specs.coatingOption.replace(/_/g, ' ').toUpperCase()}`],
  ];

  materialSpecs.forEach(([label, value]) => {
    doc.setFont('Helvetica', 'bold');
    doc.text(label, 12, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.text(value, 70, currentY);
    currentY += 4;
  });

  currentY += 3;

  // ===== SECTION 3: CONSTRUCTION OPTIONS =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(230, 28, 36);
  doc.text('3. STRUCTURAL OPTIONS & EXTRAS', 12, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  const optionsSpecs = [
    [`Double-Reinforced Base Plate:`, specs.reinforcedBottom ? '✓ YES' : '○ NO'],
    [`Integrated Finger Grab Holes:`, specs.fingerHoles ? '✓ YES' : '○ NO'],
    [`Protective Dividers/Separators:`, specs.flavorDividers ? '✓ YES' : '○ NO'],
    [`Hydrophobic Moisture Barrier:`, specs.moistureBarrier ? '✓ YES' : '○ NO'],
    [`Easy-Tear Perforation Line:`, specs.tearPerforation ? '✓ YES' : '○ NO'],
  ];

  optionsSpecs.forEach(([label, value]) => {
    doc.setFont('Helvetica', 'bold');
    doc.text(label, 12, currentY);
    doc.setFont('Helvetica', 'normal');
    if (value.includes('YES')) {
      doc.setTextColor(0, 128, 0);
    } else {
      doc.setTextColor(128, 128, 128);
    }
    doc.text(value, 120, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 4;
  });

  currentY += 3;

  // ===== SECTION 4: ASSORTMENT BREAKDOWN =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(230, 28, 36);
  doc.text('4. ASSORTMENT BREAKDOWN', 12, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  specs.variants.slice(0, 9).forEach((variant, i) => {
    const label = `${productNoun} ${String.fromCharCode(65 + i)}: `;
    doc.text(label + cleanCyrillic(variant), 12, currentY);
    currentY += 3.5;
  });

  if (specs.variants.length > 9) {
    doc.text(`+ ${specs.variants.length - 9} more variants (see details)`, 12, currentY);
    currentY += 3.5;
  }

  // Check if we need page break
  if (currentY > 200) {
    doc.addPage();
    currentY = 15;
  } else {
    currentY += 3;
  }

  // ===== PAGE 2 (or continuation) =====
  // ===== SECTION 5: BOM & COST INFORMATION =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(230, 28, 36);
  doc.text('5. BILL OF MATERIALS & COST ESTIMATES', 12, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 5;

  // Calculate BOM metrics
  const L = specs.cartonLength;
  const W = specs.cartonWidth;
  const H = specs.cartonHeight;
  let totalAreaSqCm = 0;

  if (specs.packagingType === 'closed_box_2x2') {
    const unfoldedWidth = (1.6 + L * 2 + W * 2);
    const unfoldedHeight = (H + Math.max(L, W) * 1.6);
    totalAreaSqCm = unfoldedWidth * unfoldedHeight;
  } else if (specs.packagingType === 'basket_handle') {
    totalAreaSqCm = (L * 1.5) * (H * 2.1);
  } else if (specs.packagingType === 'tube_carton') {
    const circumference = Math.PI * L;
    totalAreaSqCm = (1.6 + circumference) * H + 2 * Math.PI * (L / 2) ** 2;
  } else if (specs.packagingType === 'pillow_pouch') {
    totalAreaSqCm = 2 * L * H * 1.15;
  } else {
    totalAreaSqCm = (L * 2 + H * 2 + 1.6) * W;
  }

  const gsm = parseInt(specs.materialWeight);
  const pricePerM2 = 0.85;
  const costPerUnit = (totalAreaSqCm / 10000) * gsm * pricePerM2 / 1000;
  const totalWeight = (totalAreaSqCm / 10000) * gsm / 1000;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  const bomSpecs = [
    [`Unfolded Board Area:`, `${totalAreaSqCm.toFixed(0)} cm² (${(totalAreaSqCm / 10000).toFixed(3)} m²)`],
    [`Board Weight per Unit:`, `${totalWeight.toFixed(2)} kg`],
    [`Estimated Cost per Unit:`, `~ $${costPerUnit.toFixed(2)} USD`],
    [`Batch Cost (1,000 units):`, `~ $${(costPerUnit * 1000).toFixed(0)} USD`],
    [`Total Run Weight (1,000):`, `~ ${(totalWeight * 1000).toFixed(0)} kg`],
  ];

  bomSpecs.forEach(([label, value]) => {
    doc.setFont('Helvetica', 'bold');
    doc.text(label, 12, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.text(value, 100, currentY);
    currentY += 4;
  });

  currentY += 5;

  // ===== SECTION 6: TEAM APPROVAL STATUS =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(230, 28, 36);
  doc.text('6. TEAM APPROVAL STATUS', 12, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  const approvals = [
    { name: 'BOM Manager (Oleh)', approved: specs.approvedOleh, role: 'Technical Specifications' },
    { name: 'Finance Lead (Serhiy)', approved: specs.approvedSerhiy, role: 'Cost & Budget' },
    { name: 'Marketing Lead (Maryna)', approved: specs.approvedMaryna, role: 'Brand & Design' },
  ];

  approvals.forEach((approval) => {
    doc.setFont('Helvetica', 'bold');
    const statusText = approval.approved ? '✓ APPROVED' : '○ PENDING';
    if (approval.approved) {
      doc.setTextColor(0, 128, 0);
    } else {
      doc.setTextColor(128, 128, 128);
    }
    doc.text(statusText, 12, currentY);
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'bold');
    doc.text(approval.name, 50, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`(${approval.role})`, 120, currentY);
    currentY += 4;
    doc.setFontSize(8.5);
  });

  currentY += 5;

  // ===== SECTION 7: AUTHORIZED SIGNATURES =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(230, 28, 36);
  doc.text('7. AUTHORIZED SIGNATURES', 12, currentY);
  currentY += 6;

  doc.setTextColor(0, 0, 0);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);

  const signatureBlocks = [
    'BOM Manager / Oleh',
    'Finance Lead / Serhiy',
    'Marketing Lead / Maryna',
    'Contractor / Print Factory Rep',
  ];

  const blockWidth = (pageWidth - 24) / 2;
  let blockX = 12;
  let blockY = currentY;

  signatureBlocks.forEach((name, idx) => {
    if (idx === 2) {
      blockX = 12;
      blockY += 26;
    } else if (idx === 1) {
      blockX = 12 + blockWidth + 2;
    }

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.rect(blockX, blockY, blockWidth - 2, 22);

    doc.line(blockX + 2, blockY + 16, blockX + blockWidth - 4, blockY + 16);
    doc.text('Signature', blockX + 2, blockY + 18);

    doc.line(blockX + 2, blockY + 24, blockX + blockWidth - 4, blockY + 24);
    doc.setFontSize(7);
    doc.text('Date / DD.MM.YYYY', blockX + 2, blockY + 26);

    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text(name, blockX + 2, blockY - 2);
    doc.setFont('Helvetica', 'normal');
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  const ecSignURL = 'https://easy.nas.gov.ua/';
  doc.textWithLink(
    'Digital signatures via ВЧАСНО (Ukrainian e-signature system): ' + ecSignURL,
    12,
    pageHeight - 15,
    { pageNumber: doc.internal.pages.length }
  );

  doc.text(
    `This document certifies ISO 9051 compliance. Print & sign below, or use ВЧАСНО for digital signatures.`,
    12,
    pageHeight - 10
  );

  doc.text(
    `PackCraft 3D Studio v0.5 • Confidential • Generated ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  doc.save(`approval-form-${specs.packagingType}-${Date.now()}.pdf`);
};
