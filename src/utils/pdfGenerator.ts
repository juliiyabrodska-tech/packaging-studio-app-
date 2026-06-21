import { jsPDF } from 'jspdf';
import { PackagingSpecs } from '../types';

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
    'Вишня-Кола Класик': 'Cherry-Cola Classic',
    'Шалений Лайм-М\'ята': 'Crazy Lime-Mint',
    'Лісові Ягоди Зеро': 'Forest Berries Zero',
    'Карибський Пряний Апельсин': 'Caribbean Spicy Orange',
    'Дика Малина Без Цукру': 'Wild Raspberry Sugar Free',
    'Яблучний Сайдкруш': 'Apple Sidecrush',
    'Апельсинова Шипучка': 'Orange Fizz',
    'Класичний Квасний Ель': 'Classic Kvass Ale',
    'Кава-Кола Бустер': 'Coffee-Cola Booster',
    'Кавуновий Бум': 'Watermelon Boom',
    'Ананасовий Сплеск': 'Pineapple Splash',
    'Імбирна Кола Крісп': 'Ginger Cola Crisp',
    
    // Notes & Presets descriptions
    'Експериментальна партія під літній фестиваль. Червоно-чорна гама Coca-Cola, матове покриття картонного утримувача.': 
      'Experimental batch for summer festival. Red-black Coca-Cola palette, matte coat on cardboard carrier.',
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
    flavor1,
    flavor2,
    flavor3,
    flavor4,
    reinforcedBottom,
    fingerHoles,
    flavorDividers,
    moistureBarrier,
    tearPerforation,
    notes,
  } = specs;

  // 1. Initialize Portrait A4 Document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed = [230, 28, 36]; // Coca-Cola Red
  const darkGray = [28, 28, 30];
  const borderGray = [180, 180, 180];

  // Helper: Draw standard header frame
  const drawPageBorder = (pageNum: number) => {
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
  
  // Coke Red accent bar on the left of the header
  doc.setFillColor(230, 28, 36);
  doc.rect(12, 12, 3, 16, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TECHNICAL PACKAGING PASSPORT / SPECIFICATION CARD', 18, 19.5);

  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(210, 210, 210);
  doc.text('SYSTEM GENERATED CAD REPORT V0.5 | COCA-COLA STYLE ASSORTMENT', 18, 24.5);

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
    ['Container Size', '4 x 0.5 Liters (Assortment)', 'Standard aluminium canister profile'],
    ['Can Outer Diameter', `${canDiameter} cm (66.3 mm)`, 'Strict tolerance clearance limit'],
    ['Can Shell Height', `${canHeight} cm (168 mm)`, 'Optimal container vertical profile'],
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
      doc.setFillColor(rowIndex % 2 === 0 ? 250 : 242, rowIndex % 2 === 0 ? 250 : 242, rowIndex % 2 === 0 ? 250 : 242);
      doc.rect(12, bgY, 186, 6, 'F');
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
      doc.setFillColor(rowIndex % 2 === 0 ? 250 : 242, rowIndex % 2 === 0 ? 250 : 242, rowIndex % 2 === 0 ? 250 : 242);
      doc.rect(12, bgY, 186, 6, 'F');
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
  doc.text('3. CUSTOM FLAVOR BUNDLING SPECIFICATIONS (4 VARIETIES)', 12, currentY);

  const flavorData = [
    ['Can ID', 'Assortment Flavor Name', 'Tag Label Color Accent'],
    ['Canister A', cleanCyrillic(flavor1) || 'Flavor A Class', 'Coke Red Accent (Dark Red)'],
    ['Canister B', cleanCyrillic(flavor2) || 'Flavor B Bold', 'Electric Lime Tonic (Green)'],
    ['Canister C', cleanCyrillic(flavor3) || 'Flavor C Zero', 'Cosmos Berry Purple (Violet)'],
    ['Canister D', cleanCyrillic(flavor4) || 'Flavor D Tonic', 'Rich Amber Orange (Gold)'],
  ];

  tableY = currentY + 3;
  flavorData.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const bgY = tableY + rowIndex * 5.5;
    
    if (isHeader) {
      doc.setFillColor(84, 14, 17); // Dark Coke red
      doc.rect(12, bgY, 186, 5.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
    } else {
      doc.setFillColor(252, 252, 252);
      doc.rect(12, bgY, 186, 5.5, 'F');
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
  doc.text(`OLEH APPROVAL: APPROVED`, 15, signY + 15);
  doc.text(`SERHIY APPROVAL: APPROVED`, 75, signY + 15);
  doc.text(`MARYNA APPROVAL: APPROVED`, 135, signY + 15);

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
  doc.text(`DEVELOPED UNDER SUPERVISION FOR 4 X 0.5L BEVERAGES VARIETY PACK`, 15, blockY + 11);

  doc.text(`MATERIAL STYLES: ${outerMaterial.toUpperCase()} - ${cleanCyrillic(materialWeight)}`, 15, blockY + 21);
  doc.text(`MANUFACTURE TOLERANCE THICKNESS: ${cleanCyrillic(materialThickness)} (ISO)`, 15, blockY + 26);

  // approvals list inside block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TEAM AGREEMENT STATUS:', 102, blockY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text(`- Oleh: APPROVED`, 102, blockY + 11);
  doc.text(`- Serhiy: APPROVED`, 102, blockY + 20);
  doc.text(`- Maryna: APPROVED`, 102, blockY + 26);

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
    flavor1,
    flavor2,
    flavor3,
    flavor4,
    reinforcedBottom,
    fingerHoles,
    flavorDividers,
    moistureBarrier,
    tearPerforation,
    notes
  } = specs;

  // Header headers - Standard Excel formatting
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  csvContent += 'Parameter;Value;Unit;Packaging Component Description\r\n';

  const rows = [
    ['Project Title', 'PackCraft 3D Studio', '-', 'Technical assembly specification'],
    ['Unique Version ID', 'CAD-MP-4X500L-2026', '-', 'Generative model code'],
    ['Structure Type', packagingType === 'closed_box_2x2' ? 'Closed Box 2x2' : packagingType === 'basket_handle' ? 'Basket Carrier with Handle' : 'Tension Sleeve Wrapper', '-', 'Base engineering profile'],
    ['Beverage Volume', '4 x 0.5', 'Liters (L)', 'Total liquid volume in variety pack'],
    ['Canister Material', containerMaterial === 'aluminium' ? 'Aluminum Can 500ml' : containerMaterial === 'glass' ? 'Glass Bottle' : 'PET Bottle', '-', 'Retail container unit'],
    ['Can Outer Diameter', canDiameter.toString(), 'cm', 'Diameter clearing limit'],
    ['Can Height', canHeight.toString(), 'cm', 'Envelope height of pack'],
    ['Theoretical Box Length (L)', cartonLength.toString(), 'cm', 'X-axis dimension'],
    ['Theoretical Box Width (W)', cartonWidth.toString(), 'cm', 'Y-axis dimension'],
    ['Theoretical Box Height (H)', cartonHeight.toString(), 'cm', 'Z-axis dimension'],
    ['Board Material Grade', outerMaterial === 'pure_kraft' ? 'Moi-Resist Sulfate Kraft' : outerMaterial === 'solid_sulfate' ? 'Premium Pure Cellulose SBB' : outerMaterial === 'recyclable_gd2' ? 'Economy Recycled GD2' : 'Slightly Recycled SUB with Kraft back', '-', 'Outer box stock'],
    ['Board Density (Weight)', materialWeight, 'g/m2', 'Bending resistance density'],
    ['Designed Board Thickness', materialThickness, 'mm', 'Guides crease slot tolerances'],
    ['Primary Printing Method', printingMethod === 'offset' ? 'Litho Offset Printing' : printingMethod === 'flexo' ? 'High Speed Flexography' : 'Digital Latex Printing', '-', 'Ink transfer technology'],
    ['Colors Count', colorsCount.toString(), 'Pantone/CMYK', 'Inks configuration count'],
    ['Finishing Protective Layer', coatingOption === 'matte' ? 'Protective Matte Coating' : coatingOption === 'gloss' ? 'Gloss Coating' : coatingOption === 'uv_selective' ? 'Spot UV Selective' : 'Soft-Touch Silk-Lamination', '-', 'Surface finishing option'],
    ['Assortment Flavor 1 (Red)', flavor1, '-', 'Beverage contents, Canister 1'],
    ['Assortment Flavor 2 (Green)', flavor2, '-', 'Beverage contents, Canister 2'],
    ['Assortment Flavor 3 (Violet)', flavor3, '-', 'Beverage contents, Canister 3'],
    ['Assortment Flavor 4 (Gold)', flavor4, '-', 'Beverage contents, Canister 4'],
    ['Reinforced Double Base', reinforcedBottom ? 'ACTIVE / YES' : 'NO', '-', 'Reinforcement under can cells'],
    ['Finger Carry Holes', fingerHoles ? 'ACTIVE / YES' : 'NO', '-', 'Cutout flaps on top panel'],
    ['Internal Cell Dividers', flavorDividers ? 'ACTIVE / YES' : 'NO', '-', 'Individual partition cardboards'],
    ['Moisture Protective Barrier', moistureBarrier ? 'ACTIVE / YES' : 'NO', '-', 'Hydrophobic barrier coating'],
    ['Easy-Tear Perforations', tearPerforation ? 'ACTIVE / YES' : 'NO', '-', 'Zig-zag tearing opening line'],
    ['Oleh Approval Sign', specs.approvedOleh ? 'YES / SIGNED' : 'PENDING', '-', 'Technical BOM director Sign-off'],
    ['Serhiy Approval Sign', specs.approvedSerhiy ? 'YES / SIGNED' : 'PENDING', '-', 'Finance officer Sign-off'],
    ['Maryna Approval Sign', specs.approvedMaryna ? 'YES / SIGNED' : 'PENDING', '-', 'Creative marketing director Sign-off'],
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
