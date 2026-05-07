/**
 * Build the Aeolistings audit PDF.
 *  1. Read report.html
 *  2. Inline the wordmark as base64
 *  3. Inject three hand-built SVG charts
 *  4. Render to PDF via system Chrome (puppeteer-core)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ---- brand tokens (mirror global.css) ----
const C = {
  bg: '#FAF8F1',
  bg2: '#F4F1E8',
  bg3: '#EFECE2',
  fg: '#1A1A1A',
  muted: '#6B6B6B',
  dim: '#9A9A9A',
  hairline: '#E5E1D6',
  hairline2: '#D8D3C5',
  accent: '#8B2F2F',
};

// ===========================================================
// 1. RADAR CHART  — 4 companies × 7 dimensions
// ===========================================================
function radarChart() {
  const W = 560, H = 360;
  const cx = W / 2, cy = H / 2 + 6;
  const R = 130;
  const dims = [
    'Local positioning',
    'Service depth',
    'Service area clarity',
    'FAQ / answers',
    'Trust & proof',
    'AEO readiness',
    'Findability',
  ];
  // scores 1-5
  const data = {
    'Eco Roofing':    [2, 3, 2, 2, 3, 2, 2],
    'Weather-Tite':   [4, 4, 5, 3, 5, 3, 5],
    'AZ Roofing Works':[4, 4, 3, 3, 4, 3, 4],
    'Johnson Roofing':[4, 4, 4, 2, 4, 3, 4],
  };
  const colors = {
    'Eco Roofing':    C.accent,
    'Weather-Tite':   C.fg,
    'AZ Roofing Works': C.muted,
    'Johnson Roofing': C.dim,
  };
  const fillOpacity = {
    'Eco Roofing': 0.18,
    'Weather-Tite': 0.06,
    'AZ Roofing Works': 0.04,
    'Johnson Roofing': 0.03,
  };

  const angle = i => (-Math.PI / 2) + (i / dims.length) * Math.PI * 2;
  const point = (i, v) => {
    const r = (v / 5) * R;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };

  // grid rings
  let grid = '';
  for (let v = 1; v <= 5; v++) {
    const pts = dims.map((_, i) => point(i, v).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="${C.hairline}" stroke-width="0.6"/>`;
  }
  // axes + labels
  let axes = '';
  let labels = '';
  dims.forEach((d, i) => {
    const [x, y] = point(i, 5);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.hairline2}" stroke-width="0.5"/>`;
    // label position
    const [lx, ly] = (() => {
      const r = R + 18;
      return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
    })();
    // anchor based on quadrant
    const ax = Math.cos(angle(i));
    const anchor = ax > 0.3 ? 'start' : ax < -0.3 ? 'end' : 'middle';
    labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" font-weight="500" fill="${C.fg}" letter-spacing="0.04em">${d}</text>`;
  });

  // polygons (draw competitors first so eco sits on top)
  const order = ['Johnson Roofing', 'AZ Roofing Works', 'Weather-Tite', 'Eco Roofing'];
  let polys = '';
  for (const name of order) {
    const pts = data[name].map((v, i) => point(i, v).join(',')).join(' ');
    const isEco = name === 'Eco Roofing';
    polys += `<polygon points="${pts}" fill="${colors[name]}" fill-opacity="${fillOpacity[name]}" stroke="${colors[name]}" stroke-width="${isEco ? 1.6 : 1}"/>`;
    // dots on eco only
    if (isEco) {
      data[name].forEach((v, i) => {
        const [x, y] = point(i, v);
        polys += `<circle cx="${x}" cy="${y}" r="2.2" fill="${colors[name]}"/>`;
      });
    }
  }

  // ring labels (1, 3, 5)
  let ringLabels = '';
  for (const v of [1, 3, 5]) {
    ringLabels += `<text x="${cx + 4}" y="${cy - (v / 5) * R - 2}" font-family="Instrument Sans, sans-serif" font-size="7" fill="${C.dim}">${v}</text>`;
  }

  return `
<svg viewBox="0 0 ${W} ${H}" width="100%" height="135" xmlns="http://www.w3.org/2000/svg">
  ${grid}
  ${axes}
  ${ringLabels}
  ${polys}
  ${labels}
</svg>`;
}

// ===========================================================
// 2. DIVERGING BAR — strengths vs gaps
// ===========================================================
function divergingChart() {
  const items = [
    // [label, weight 1-10, side ('+' strength | '-' gap)]
    ['Eco / energy-efficient differentiator', 9, '+'],
    ['25+ years tenure',                     7, '+'],
    ['Named owner (Eric Perry)',             5, '+'],
    ['HomeAdvisor Top Rated',                4, '+'],
    ['ARCA & Roofing Institute',             4, '+'],
    ['Wide service-area list',               3, '+'],
    ['FAQ answers not citation-worthy',      9, '-'],
    ['Broken Mesa city page (500)',          9, '-'],
    ['Brand-led title (no city anchor)',     8, '-'],
    ['Eco angle buried in blog only',        8, '-'],
    ['No warranty terms on main pages',      7, '-'],
    ['No financing / pricing signals',       6, '-'],
    ['Sitemap.xml broken',                   5, '-'],
    ['No LocalBusiness / FAQPage schema',    5, '-'],
  ];

  const rowH = 17;
  const padTop = 18, padBot = 18;
  const W = 720;
  const H = padTop + padBot + items.length * rowH;
  const cx = W / 2;
  const maxBar = 240;

  // zero axis label area
  let axis = `
    <line x1="${cx}" y1="${padTop - 4}" x2="${cx}" y2="${H - padBot + 4}" stroke="${C.fg}" stroke-width="0.8"/>
    <text x="${cx - 6}" y="${padTop - 7}" text-anchor="end" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.fg}">GAPS ◀</text>
    <text x="${cx + 6}" y="${padTop - 7}" text-anchor="start" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.accent}">▶ STRENGTHS</text>
  `;

  let bars = '';
  items.forEach((it, i) => {
    const [label, weight, side] = it;
    const y = padTop + i * rowH + rowH / 2;
    const barW = (weight / 10) * maxBar;
    if (side === '+') {
      // strength: bar to the right, oxblood
      bars += `
        <rect x="${cx + 1}" y="${y - 6}" width="${barW}" height="12" fill="${C.accent}" rx="1"/>
        <text x="${cx + barW + 8}" y="${y}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" fill="${C.fg}">${escapeXML(label)}</text>
      `;
    } else {
      // gap: bar to the left, ink
      bars += `
        <rect x="${cx - 1 - barW}" y="${y - 6}" width="${barW}" height="12" fill="${C.fg}" rx="1"/>
        <text x="${cx - barW - 8}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" fill="${C.fg}">${escapeXML(label)}</text>
      `;
    }
  });

  return `
<svg viewBox="0 0 ${W} ${H}" width="100%" height="${Math.round(H * 0.78)}" xmlns="http://www.w3.org/2000/svg">
  ${axis}
  ${bars}
</svg>`;
}

// ===========================================================
// 3. TIMELINE — 90-day rollout
// ===========================================================
function timelineChart() {
  // rows: [label, startDay, endDay, color, phase]
  const rows = [
    ['Fix Mesa city page + sitemap',          0,  7,  C.accent, 'p1'],
    ['Title + H1 + East Valley anchor',       3,  10, C.accent, 'p1'],
    ['Surface ROC, BBB, reviews badge',       5,  14, C.accent, 'p1'],
    ['Add warranty terms sitewide',           7,  20, C.accent, 'p1'],
    ['Rewrite FAQ — citation-worthy answers', 10, 30, C.accent, 'p1'],

    ['Eco / cool-roof hub page',              25, 55, C.fg,     'p2'],
    ['5–6 East Valley city pages',            30, 75, C.fg,     'p2'],
    ['Process + pricing on service pages',    30, 60, C.fg,     'p2'],
    ['Named-expert About page (Eric Perry)',  35, 55, C.fg,     'p2'],
    ['Add financing (Enhancify / Hearth)',    40, 65, C.fg,     'p2'],
    ['Embed reviews on service pages',        45, 70, C.fg,     'p2'],

    ['Schema rollout (LocalBusiness, FAQ)',   15, 95, C.dim,    'p3'],
    ['Internal linking sweep',                25, 95, C.dim,    'p3'],
    ['Project gallery + location captions',   60, 100,C.dim,    'p3'],

    ['SMS / text contact channel',            70, 95, C.hairline2, 'p4'],
    ['Real-estate roof certification page',   75, 100,C.hairline2, 'p4'],
    ['Quarterly cost-trends post',            80, 100,C.hairline2, 'p4'],
  ];

  const padTop = 28, padBot = 28, padLeft = 230, padRight = 30;
  const rowH = 18;
  const W = 760;
  const dayMax = 105;
  const H = padTop + padBot + rows.length * rowH;
  const chartW = W - padLeft - padRight;
  const dayX = d => padLeft + (d / dayMax) * chartW;

  // gridlines every 15 days
  let grid = '';
  for (let d = 0; d <= 105; d += 15) {
    const x = dayX(d);
    grid += `<line x1="${x}" y1="${padTop - 6}" x2="${x}" y2="${H - padBot + 4}" stroke="${C.hairline}" stroke-width="0.5"/>`;
    grid += `<text x="${x}" y="${padTop - 10}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" font-weight="500" letter-spacing="0.1em" fill="${C.muted}">D${d}</text>`;
  }
  // milestone bands at 30 / 60 / 90
  let bands = '';
  const milestones = [
    [30, '30-DAY · QUICK WINS'],
    [60, '60-DAY · BUILDING'],
    [90, '90-DAY · COMPOUND'],
  ];
  milestones.forEach(([d, lbl]) => {
    const x = dayX(d);
    bands += `<line x1="${x}" y1="${padTop - 12}" x2="${x}" y2="${H - padBot + 12}" stroke="${C.accent}" stroke-width="0.7" stroke-dasharray="3,3" opacity="0.6"/>`;
    bands += `<text x="${x}" y="${H - padBot + 22}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="7" letter-spacing="0.14em" font-weight="600" fill="${C.accent}">${lbl}</text>`;
  });

  // bars + labels
  let bars = '';
  rows.forEach((r, i) => {
    const [label, s, e, color] = r;
    const y = padTop + i * rowH + rowH / 2;
    const x1 = dayX(s);
    const x2 = dayX(e);
    bars += `<text x="${padLeft - 12}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="8.6" fill="${C.fg}">${escapeXML(label)}</text>`;
    bars += `<rect x="${x1}" y="${y - 5}" width="${x2 - x1}" height="10" fill="${color}" rx="1.5" opacity="${color === C.hairline2 ? 0.85 : 1}"/>`;
    // small left tick
    bars += `<line x1="${x1}" y1="${y - 7}" x2="${x1}" y2="${y + 7}" stroke="${color}" stroke-width="0.8"/>`;
  });

  // phase grouping ribbon on far left
  const groups = [
    ['Highest priority',  C.accent,    0, 5],
    ['Near-term growth',  C.fg,        5, 11],
    ['Foundational',      C.dim,       11, 14],
    ['Optional polish',   C.hairline2, 14, 17],
  ];
  let groupRibbon = '';
  groups.forEach(([name, color, s, e]) => {
    const y1 = padTop + s * rowH;
    const y2 = padTop + e * rowH;
    groupRibbon += `<rect x="6" y="${y1}" width="3" height="${y2 - y1 - 2}" fill="${color}" opacity="${color === C.hairline2 ? 0.85 : 1}"/>`;
    groupRibbon += `<text x="14" y="${y1 + 9}" font-family="Instrument Sans, sans-serif" font-size="7" letter-spacing="0.14em" font-weight="600" fill="${color}" text-transform="uppercase">${escapeXML(name.toUpperCase())}</text>`;
  });

  return `
<svg viewBox="0 0 ${W} ${H + 8}" width="100%" height="${Math.round((H + 8) * 0.7)}" xmlns="http://www.w3.org/2000/svg">
  ${grid}
  ${bands}
  ${groupRibbon}
  ${bars}
</svg>`;
}

// ===========================================================
// REVIEWS COMPARISON CHART — for GBP supplement
// ===========================================================
function reviewsAcrossPlatforms() {
  // [platform, count-display, normalized-bar-units, isGoogle, note]
  const rows = [
    ['Google',      '5',     5,   true,  'The platform Google\'s Local Pack actually weights'],
    ['Yelp',        '31',    31,  false, 'Trust asset · doesn\'t lift Local Pack rankings'],
    ['HomeAdvisor', '100s',  120, false, 'Years of history · drives HomeAdvisor leads, not Maps'],
    ['BBB',         'A+',    20,  false, 'Accredited 2020 · trust signal, not ranking signal'],
    ['Facebook',    '—',     2,   false, 'Largely inactive'],
    ['Nextdoor',    'Some',  4,   false, 'Local recommendations, hyperlocal trust'],
  ];

  const W = 720, padTop = 30, padBot = 16, padLeft = 100, padRight = 50;
  const rowH = 26;
  const H = padTop + padBot + rows.length * rowH;
  const chartW = W - padLeft - padRight;
  const maxBar = 130;
  const xUnit = chartW / maxBar;

  let bars = '';
  rows.forEach((r, i) => {
    const [platform, label, units, isGoogle, note] = r;
    const y = padTop + i * rowH + rowH / 2;
    const barW = Math.min(units, maxBar) * xUnit;
    const color = isGoogle ? C.accent : C.dim;
    bars += `<text x="${padLeft - 12}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Serif, serif" font-size="13" fill="${C.fg}">${platform}</text>`;
    bars += `<rect x="${padLeft}" y="${y - 7}" width="${barW}" height="14" fill="${color}" rx="1.5" opacity="${isGoogle ? 1 : 0.85}"/>`;
    // count label after bar
    bars += `<text x="${padLeft + barW + 8}" y="${y - 1}" dominant-baseline="middle" font-family="Instrument Serif, serif" font-size="13" font-weight="${isGoogle ? '600' : '400'}" fill="${color}">${label}</text>`;
    // note below bar
    bars += `<text x="${padLeft + barW + 8}" y="${y + 9}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" fill="${C.fg_muted || '#6B6B6B'}">${escapeXML(note)}</text>`;
  });

  // Title above
  let title = `
    <text x="${padLeft - 12}" y="14" text-anchor="end" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.muted}">PLATFORM</text>
    <text x="${padLeft + 4}" y="14" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.muted}">REVIEW VOLUME</text>
  `;

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:230px;" xmlns="http://www.w3.org/2000/svg">${title}${bars}</svg>`;
}

function escapeXML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ===========================================================
// COMPACT variants for the one-pager
// ===========================================================
function radarChartCompact() {
  // smaller R, smaller font, compressed height for the one-pager
  const W = 540, H = 280;
  const cx = W / 2, cy = H / 2 + 4;
  const R = 100;
  const dims = ['Local positioning', 'Service depth', 'Service area', 'FAQ / answers', 'Trust & proof', 'AEO readiness', 'Findability'];
  const data = {
    'Eco':    [2, 3, 2, 2, 3, 2, 2],
    'WT':     [4, 4, 5, 3, 5, 3, 5],
    'AZRW':   [4, 4, 3, 3, 4, 3, 4],
    'JR':     [4, 4, 4, 2, 4, 3, 4],
  };
  const colors = { Eco: C.accent, WT: C.fg, AZRW: C.muted, JR: C.dim };
  const fillOpacity = { Eco: 0.18, WT: 0.06, AZRW: 0.04, JR: 0.03 };
  const angle = i => (-Math.PI / 2) + (i / dims.length) * Math.PI * 2;
  const point = (i, v) => { const r = (v / 5) * R; return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]; };

  let grid = '';
  for (let v = 1; v <= 5; v++) {
    const pts = dims.map((_, i) => point(i, v).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="${C.hairline}" stroke-width="0.5"/>`;
  }
  let axes = '', labels = '';
  dims.forEach((d, i) => {
    const [x, y] = point(i, 5);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.hairline2}" stroke-width="0.4"/>`;
    const r = R + 14;
    const lx = cx + r * Math.cos(angle(i));
    const ly = cy + r * Math.sin(angle(i));
    const ax = Math.cos(angle(i));
    const anchor = ax > 0.3 ? 'start' : ax < -0.3 ? 'end' : 'middle';
    labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" font-weight="500" fill="${C.fg}">${d}</text>`;
  });

  const order = ['JR', 'AZRW', 'WT', 'Eco'];
  let polys = '';
  for (const name of order) {
    const pts = data[name].map((v, i) => point(i, v).join(',')).join(' ');
    const isEco = name === 'Eco';
    polys += `<polygon points="${pts}" fill="${colors[name]}" fill-opacity="${fillOpacity[name]}" stroke="${colors[name]}" stroke-width="${isEco ? 1.4 : 0.9}"/>`;
    if (isEco) {
      data[name].forEach((v, i) => {
        const [x, y] = point(i, v);
        polys += `<circle cx="${x}" cy="${y}" r="1.8" fill="${colors[name]}"/>`;
      });
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:185px;" xmlns="http://www.w3.org/2000/svg">${grid}${axes}${polys}${labels}</svg>`;
}

function timelineChartCompact() {
  // Collapsed to 9 representative rows so it fits on the one-pager
  const rows = [
    ['Fix Mesa city page + sitemap',         0,  10, C.accent, 'p1'],
    ['Title + H1 + warranty + ROC/BBB',      5,  20, C.accent, 'p1'],
    ['Rewrite FAQ — citation-worthy',        10, 30, C.accent, 'p1'],
    ['Eco / cool-roof hub page',             25, 55, C.fg,     'p2'],
    ['5–6 East Valley city pages',           30, 75, C.fg,     'p2'],
    ['Process + pricing on service pages',   30, 60, C.fg,     'p2'],
    ['Add financing + named-expert page',    40, 65, C.fg,     'p2'],
    ['Schema + internal linking + NAP',      15, 95, C.dim,    'p3'],
    ['Project gallery + extras',             60, 100,C.hairline2, 'p4'],
  ];

  const padTop = 20, padBot = 22, padLeft = 195, padRight = 18;
  const rowH = 16;
  const W = 720;
  const dayMax = 105;
  const H = padTop + padBot + rows.length * rowH;
  const chartW = W - padLeft - padRight;
  const dayX = d => padLeft + (d / dayMax) * chartW;

  let grid = '';
  for (let d = 0; d <= 105; d += 15) {
    const x = dayX(d);
    grid += `<line x1="${x}" y1="${padTop - 4}" x2="${x}" y2="${H - padBot + 2}" stroke="${C.hairline}" stroke-width="0.4"/>`;
    grid += `<text x="${x}" y="${padTop - 7}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="6.5" font-weight="500" letter-spacing="0.08em" fill="${C.muted}">D${d}</text>`;
  }
  let bands = '';
  const milestones = [[30, '30D'], [60, '60D'], [90, '90D']];
  milestones.forEach(([d, lbl]) => {
    const x = dayX(d);
    bands += `<line x1="${x}" y1="${padTop - 8}" x2="${x}" y2="${H - padBot + 8}" stroke="${C.accent}" stroke-width="0.5" stroke-dasharray="2.5,2.5" opacity="0.6"/>`;
    bands += `<text x="${x}" y="${H - padBot + 16}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="6.5" letter-spacing="0.14em" font-weight="600" fill="${C.accent}">${lbl}</text>`;
  });

  let bars = '';
  rows.forEach((r, i) => {
    const [label, s, e, color] = r;
    const y = padTop + i * rowH + rowH / 2;
    const x1 = dayX(s);
    const x2 = dayX(e);
    bars += `<text x="${padLeft - 10}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" fill="${C.fg}">${escapeXML(label)}</text>`;
    bars += `<rect x="${x1}" y="${y - 4}" width="${x2 - x1}" height="8" fill="${color}" rx="1.2" opacity="${color === C.hairline2 ? 0.85 : 1}"/>`;
    bars += `<line x1="${x1}" y1="${y - 6}" x2="${x1}" y2="${y + 6}" stroke="${color}" stroke-width="0.7"/>`;
  });

  // Phase ribbon
  const groups = [
    [C.accent, 0, 3], [C.fg, 3, 7], [C.dim, 7, 8], [C.hairline2, 8, 9],
  ];
  let groupRibbon = '';
  groups.forEach(([color, s, e]) => {
    const y1 = padTop + s * rowH;
    const y2 = padTop + e * rowH;
    groupRibbon += `<rect x="6" y="${y1}" width="2.5" height="${y2 - y1 - 1}" fill="${color}" opacity="${color === C.hairline2 ? 0.85 : 1}"/>`;
  });

  return `<svg viewBox="0 0 ${W} ${H + 4}" width="100%" style="display:block;height:200px;" xmlns="http://www.w3.org/2000/svg">${grid}${bands}${groupRibbon}${bars}</svg>`;
}

// ===========================================================
// CRUZ DEVELOPMENT — chart variants
// ===========================================================
function radarChartCruz() {
  const W = 560, H = 360;
  const cx = W / 2, cy = H / 2 + 6;
  const R = 130;
  const dims = [
    'Local positioning',
    'Service depth',
    'Service area clarity',
    'FAQ / answers',
    'Trust & proof',
    'AEO readiness',
    'Findability',
  ];
  const data = {
    'Cruz Development':  [2, 3, 1, 2, 1, 1, 2],
    'Mariano & Co.':     [4, 4, 4, 3, 5, 4, 4],
    'Forte Homes':       [4, 4, 3, 2, 5, 3, 4],
    'Rodeo Construction':[3, 4, 4, 4, 4, 4, 4],
  };
  const colors = {
    'Cruz Development':  C.accent,
    'Mariano & Co.':     C.fg,
    'Forte Homes':       C.muted,
    'Rodeo Construction': C.dim,
  };
  const fillOpacity = {
    'Cruz Development': 0.18,
    'Mariano & Co.': 0.06,
    'Forte Homes': 0.04,
    'Rodeo Construction': 0.03,
  };
  const angle = i => (-Math.PI / 2) + (i / dims.length) * Math.PI * 2;
  const point = (i, v) => { const r = (v / 5) * R; return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]; };
  let grid = '';
  for (let v = 1; v <= 5; v++) {
    const pts = dims.map((_, i) => point(i, v).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="${C.hairline}" stroke-width="0.6"/>`;
  }
  let axes = '', labels = '';
  dims.forEach((d, i) => {
    const [x, y] = point(i, 5);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.hairline2}" stroke-width="0.5"/>`;
    const r = R + 18;
    const lx = cx + r * Math.cos(angle(i));
    const ly = cy + r * Math.sin(angle(i));
    const ax = Math.cos(angle(i));
    const anchor = ax > 0.3 ? 'start' : ax < -0.3 ? 'end' : 'middle';
    labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" font-weight="500" fill="${C.fg}" letter-spacing="0.04em">${d}</text>`;
  });
  const order = ['Rodeo Construction', 'Forte Homes', 'Mariano & Co.', 'Cruz Development'];
  let polys = '';
  for (const name of order) {
    const pts = data[name].map((v, i) => point(i, v).join(',')).join(' ');
    const isTarget = name === 'Cruz Development';
    polys += `<polygon points="${pts}" fill="${colors[name]}" fill-opacity="${fillOpacity[name]}" stroke="${colors[name]}" stroke-width="${isTarget ? 1.6 : 1}"/>`;
    if (isTarget) {
      data[name].forEach((v, i) => {
        const [x, y] = point(i, v);
        polys += `<circle cx="${x}" cy="${y}" r="2.2" fill="${colors[name]}"/>`;
      });
    }
  }
  let ringLabels = '';
  for (const v of [1, 3, 5]) {
    ringLabels += `<text x="${cx + 4}" y="${cy - (v / 5) * R - 2}" font-family="Instrument Sans, sans-serif" font-size="7" fill="${C.dim}">${v}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="135" xmlns="http://www.w3.org/2000/svg">${grid}${axes}${ringLabels}${polys}${labels}</svg>`;
}

function radarChartCruzCompact() {
  const W = 540, H = 280;
  const cx = W / 2, cy = H / 2 + 4;
  const R = 100;
  const dims = ['Local positioning', 'Service depth', 'Service area', 'FAQ / answers', 'Trust & proof', 'AEO readiness', 'Findability'];
  const data = {
    Cruz: [2, 3, 1, 2, 1, 1, 2],
    Mar:  [4, 4, 4, 3, 5, 4, 4],
    For:  [4, 4, 3, 2, 5, 3, 4],
    Rod:  [3, 4, 4, 4, 4, 4, 4],
  };
  const colors = { Cruz: C.accent, Mar: C.fg, For: C.muted, Rod: C.dim };
  const fillOpacity = { Cruz: 0.18, Mar: 0.06, For: 0.04, Rod: 0.03 };
  const angle = i => (-Math.PI / 2) + (i / dims.length) * Math.PI * 2;
  const point = (i, v) => { const r = (v / 5) * R; return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]; };
  let grid = '';
  for (let v = 1; v <= 5; v++) {
    const pts = dims.map((_, i) => point(i, v).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="${C.hairline}" stroke-width="0.5"/>`;
  }
  let axes = '', labels = '';
  dims.forEach((d, i) => {
    const [x, y] = point(i, 5);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.hairline2}" stroke-width="0.4"/>`;
    const r = R + 14;
    const lx = cx + r * Math.cos(angle(i));
    const ly = cy + r * Math.sin(angle(i));
    const ax = Math.cos(angle(i));
    const anchor = ax > 0.3 ? 'start' : ax < -0.3 ? 'end' : 'middle';
    labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" font-weight="500" fill="${C.fg}">${d}</text>`;
  });
  const order = ['Rod', 'For', 'Mar', 'Cruz'];
  let polys = '';
  for (const name of order) {
    const pts = data[name].map((v, i) => point(i, v).join(',')).join(' ');
    const isTarget = name === 'Cruz';
    polys += `<polygon points="${pts}" fill="${colors[name]}" fill-opacity="${fillOpacity[name]}" stroke="${colors[name]}" stroke-width="${isTarget ? 1.4 : 0.9}"/>`;
    if (isTarget) {
      data[name].forEach((v, i) => {
        const [x, y] = point(i, v);
        polys += `<circle cx="${x}" cy="${y}" r="1.8" fill="${colors[name]}"/>`;
      });
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:185px;" xmlns="http://www.w3.org/2000/svg">${grid}${axes}${polys}${labels}</svg>`;
}

function divergingChartCruz() {
  const items = [
    ['"All in House" / no-middleman position',     7, '+'],
    ['Founder named (Matthew Gallego)',            6, '+'],
    ['Brad Leavitt podcast appearance',            6, '+'],
    ['Named team of 6 with bios',                  5, '+'],
    ['Custom + spec + remodel + roofing mix',      5, '+'],
    ['9 AZ-relevant blog posts',                   4, '+'],
    ['Houzz profile established',                  3, '+'],
    ['Placeholder testimonials still live',        10,'-'],
    ['Mesa city page title says "Chandler"',       9, '-'],
    ['No ROC #, no address, no BBB displayed',     9, '-'],
    ['Glendale H3 also says "Chandler"',           8, '-'],
    ['619 (San Diego) phone — no AZ number',       7, '-'],
    ['Placeholder portfolio cards on homepage',    7, '-'],
    ['No cost content (highest AEO miss)',         8, '-'],
    ['Southwest identity not in site copy',        7, '-'],
    ['No manufacturer certs on roofing page',      6, '-'],
    ['"Ashpalt" misspelled on roofing page',       4, '-'],
  ];
  const rowH = 17;
  const padTop = 18, padBot = 18;
  const W = 720;
  const H = padTop + padBot + items.length * rowH;
  const cx = W / 2;
  const maxBar = 240;
  let axis = `
    <line x1="${cx}" y1="${padTop - 4}" x2="${cx}" y2="${H - padBot + 4}" stroke="${C.fg}" stroke-width="0.8"/>
    <text x="${cx - 6}" y="${padTop - 7}" text-anchor="end" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.fg}">GAPS ◀</text>
    <text x="${cx + 6}" y="${padTop - 7}" text-anchor="start" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.accent}">▶ STRENGTHS</text>
  `;
  let bars = '';
  items.forEach((it, i) => {
    const [label, weight, side] = it;
    const y = padTop + i * rowH + rowH / 2;
    const barW = (weight / 10) * maxBar;
    if (side === '+') {
      bars += `<rect x="${cx + 1}" y="${y - 6}" width="${barW}" height="12" fill="${C.accent}" rx="1"/>`;
      bars += `<text x="${cx + barW + 8}" y="${y}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" fill="${C.fg}">${escapeXML(label)}</text>`;
    } else {
      bars += `<rect x="${cx - 1 - barW}" y="${y - 6}" width="${barW}" height="12" fill="${C.fg}" rx="1"/>`;
      bars += `<text x="${cx - barW - 8}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" fill="${C.fg}">${escapeXML(label)}</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${Math.round(H * 0.78)}" xmlns="http://www.w3.org/2000/svg">${axis}${bars}</svg>`;
}

function timelineChartCruz() {
  const rows = [
    ['Replace placeholder testimonials',       0,  10, C.accent, 'p1'],
    ['Fix Mesa/Glendale city-page title bugs', 0,  7,  C.accent, 'p1'],
    ['Publish ROC#, address, bonded/insured',  3,  14, C.accent, 'p1'],
    ['Replace placeholder portfolio cards',    5,  18, C.accent, 'p1'],
    ['Resolve 619 phone trust gap',            7,  20, C.accent, 'p1'],
    ['NAP audit + GBP optimization',           10, 30, C.accent, 'p1'],

    ['Cost pillar pages (Chandler/Mesa/Glendale/AZ)', 25, 65, C.fg, 'p2'],
    ['Modern Southwestern style page',         30, 55, C.fg,     'p2'],
    ['Real case-study buildout (8–12 projects)',30, 80, C.fg,    'p2'],
    ['City-page rebuild — neighborhoods + ZIPs',35, 75, C.fg,    'p2'],
    ['Author bylines + podcast embed',         40, 60, C.fg,     'p2'],
    ['Reviews program (Google + Houzz)',       30, 90, C.fg,     'p2'],

    ['Schema rollout (LocalBusiness, FAQ, Org)',15, 95, C.dim,    'p3'],
    ['HBACA / NAHB membership pursuit',         25, 80, C.dim,    'p3'],
    ['Manufacturer certs for roofing arm',      45, 95, C.dim,    'p3'],

    ['Architect partnership content (AIA)',     70, 100, C.hairline2, 'p4'],
    ['Sustainability / desert-climate page',    75, 100, C.hairline2, 'p4'],
    ['Best of Houzz 2027 push',                 80, 100, C.hairline2, 'p4'],
  ];
  const padTop = 28, padBot = 28, padLeft = 230, padRight = 30;
  const rowH = 18;
  const W = 760;
  const dayMax = 105;
  const H = padTop + padBot + rows.length * rowH;
  const chartW = W - padLeft - padRight;
  const dayX = d => padLeft + (d / dayMax) * chartW;
  let grid = '';
  for (let d = 0; d <= 105; d += 15) {
    const x = dayX(d);
    grid += `<line x1="${x}" y1="${padTop - 6}" x2="${x}" y2="${H - padBot + 4}" stroke="${C.hairline}" stroke-width="0.5"/>`;
    grid += `<text x="${x}" y="${padTop - 10}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" font-weight="500" letter-spacing="0.1em" fill="${C.muted}">D${d}</text>`;
  }
  let bands = '';
  const milestones = [[30, '30-DAY · QUICK WINS'],[60, '60-DAY · BUILDING'],[90, '90-DAY · COMPOUND']];
  milestones.forEach(([d, lbl]) => {
    const x = dayX(d);
    bands += `<line x1="${x}" y1="${padTop - 12}" x2="${x}" y2="${H - padBot + 12}" stroke="${C.accent}" stroke-width="0.7" stroke-dasharray="3,3" opacity="0.6"/>`;
    bands += `<text x="${x}" y="${H - padBot + 22}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="7" letter-spacing="0.14em" font-weight="600" fill="${C.accent}">${lbl}</text>`;
  });
  let bars = '';
  rows.forEach((r, i) => {
    const [label, s, e, color] = r;
    const y = padTop + i * rowH + rowH / 2;
    const x1 = dayX(s);
    const x2 = dayX(e);
    bars += `<text x="${padLeft - 12}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="8.6" fill="${C.fg}">${escapeXML(label)}</text>`;
    bars += `<rect x="${x1}" y="${y - 5}" width="${x2 - x1}" height="10" fill="${color}" rx="1.5" opacity="${color === C.hairline2 ? 0.85 : 1}"/>`;
    bars += `<line x1="${x1}" y1="${y - 7}" x2="${x1}" y2="${y + 7}" stroke="${color}" stroke-width="0.8"/>`;
  });
  const groups = [['Highest priority', C.accent, 0, 6],['Near-term growth', C.fg, 6, 12],['Foundational', C.dim, 12, 15],['Optional polish', C.hairline2, 15, 18]];
  let groupRibbon = '';
  groups.forEach(([name, color, s, e]) => {
    const y1 = padTop + s * rowH;
    const y2 = padTop + e * rowH;
    groupRibbon += `<rect x="6" y="${y1}" width="3" height="${y2 - y1 - 2}" fill="${color}" opacity="${color === C.hairline2 ? 0.85 : 1}"/>`;
    groupRibbon += `<text x="14" y="${y1 + 9}" font-family="Instrument Sans, sans-serif" font-size="7" letter-spacing="0.14em" font-weight="600" fill="${color}">${escapeXML(name.toUpperCase())}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H + 8}" width="100%" height="${Math.round((H + 8) * 0.7)}" xmlns="http://www.w3.org/2000/svg">${grid}${bands}${groupRibbon}${bars}</svg>`;
}

function timelineChartCruzCompact() {
  const rows = [
    ['Replace placeholder content',           0,  12, C.accent, 'p1'],
    ['Fix city-page template bugs',           0,  10, C.accent, 'p1'],
    ['Publish ROC#, address, BBB',            5,  18, C.accent, 'p1'],
    ['NAP + GBP optimization',                10, 30, C.accent, 'p1'],
    ['Cost pillar pages × 4',                 25, 65, C.fg,     'p2'],
    ['Real case-study buildout',              30, 80, C.fg,     'p2'],
    ['City-page rebuild + Southwest page',    35, 75, C.fg,     'p2'],
    ['Reviews program (Google + Houzz)',      30, 90, C.fg,     'p2'],
    ['Schema + HBACA + manufacturer certs',   25, 95, C.dim,    'p3'],
  ];
  const padTop = 20, padBot = 22, padLeft = 195, padRight = 18;
  const rowH = 16;
  const W = 720;
  const dayMax = 105;
  const H = padTop + padBot + rows.length * rowH;
  const chartW = W - padLeft - padRight;
  const dayX = d => padLeft + (d / dayMax) * chartW;
  let grid = '';
  for (let d = 0; d <= 105; d += 15) {
    const x = dayX(d);
    grid += `<line x1="${x}" y1="${padTop - 4}" x2="${x}" y2="${H - padBot + 2}" stroke="${C.hairline}" stroke-width="0.4"/>`;
    grid += `<text x="${x}" y="${padTop - 7}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="6.5" font-weight="500" letter-spacing="0.08em" fill="${C.muted}">D${d}</text>`;
  }
  let bands = '';
  [[30,'30D'],[60,'60D'],[90,'90D']].forEach(([d, lbl]) => {
    const x = dayX(d);
    bands += `<line x1="${x}" y1="${padTop - 8}" x2="${x}" y2="${H - padBot + 8}" stroke="${C.accent}" stroke-width="0.5" stroke-dasharray="2.5,2.5" opacity="0.6"/>`;
    bands += `<text x="${x}" y="${H - padBot + 16}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="6.5" letter-spacing="0.14em" font-weight="600" fill="${C.accent}">${lbl}</text>`;
  });
  let bars = '';
  rows.forEach((r, i) => {
    const [label, s, e, color] = r;
    const y = padTop + i * rowH + rowH / 2;
    const x1 = dayX(s);
    const x2 = dayX(e);
    bars += `<text x="${padLeft - 10}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" fill="${C.fg}">${escapeXML(label)}</text>`;
    bars += `<rect x="${x1}" y="${y - 4}" width="${x2 - x1}" height="8" fill="${color}" rx="1.2"/>`;
    bars += `<line x1="${x1}" y1="${y - 6}" x2="${x1}" y2="${y + 6}" stroke="${color}" stroke-width="0.7"/>`;
  });
  const groups = [[C.accent, 0, 4],[C.fg, 4, 8],[C.dim, 8, 9]];
  let groupRibbon = '';
  groups.forEach(([color, s, e]) => {
    const y1 = padTop + s * rowH;
    const y2 = padTop + e * rowH;
    groupRibbon += `<rect x="6" y="${y1}" width="2.5" height="${y2 - y1 - 1}" fill="${color}"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${H + 4}" width="100%" style="display:block;height:200px;" xmlns="http://www.w3.org/2000/svg">${grid}${bands}${groupRibbon}${bars}</svg>`;
}

// Cruz GBP supplement: trust-stack scorecard chart (replaces reviews-across-platforms)
function trustStackCruz() {
  // Each row: [signal, cruz_present, mariano, forte, rodeo]
  const rows = [
    ['ROC# displayed',          false, true,  true,  true],
    ['Address on site',         false, true,  true,  true],
    ['In-state phone',          false, true,  true,  false],
    ['BBB / NAHB / HBACA',      false, false, true,  false],
    ['Houzz Best Of badge',     false, true,  false, false],
    ['Press logos',             false, false, true,  false],
    ['Real testimonials',       false, true,  false, false],
    ['Portfolio depth',         false, true,  true,  false],
    ['Service-page FAQs',       true,  false, false, true],
    ['Sustainability page',     false, false, false, true],
    ['Cost / pricing content',  false, true,  false, true],
    ['Manufacturer certs',      false, false, false, false],
  ];
  const W = 720;
  const padTop = 28, padBot = 12, padLeft = 200, padRight = 24;
  const rowH = 18;
  const H = padTop + padBot + rows.length * rowH;
  const cols = 4;
  const colSpan = (W - padLeft - padRight) / cols;
  const colHeaders = ['Cruz Dev.', 'Mariano & Co.', 'Forte Homes', 'Rodeo Const.'];
  const colColors = [C.accent, C.fg, C.muted, C.dim];

  let header = '';
  colHeaders.forEach((h, i) => {
    const x = padLeft + colSpan * i + colSpan / 2;
    header += `<text x="${x}" y="${padTop - 10}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.12em" font-weight="600" fill="${colColors[i]}">${h.toUpperCase()}</text>`;
  });
  header += `<line x1="${padLeft}" y1="${padTop - 4}" x2="${W - padRight}" y2="${padTop - 4}" stroke="${C.fg}" stroke-width="0.7"/>`;

  let body = '';
  rows.forEach((r, i) => {
    const [label, ...vals] = r;
    const y = padTop + i * rowH + rowH / 2;
    body += `<text x="${padLeft - 10}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="8.5" fill="${C.fg}">${escapeXML(label)}</text>`;
    vals.forEach((v, ci) => {
      const x = padLeft + colSpan * ci + colSpan / 2;
      if (v) {
        body += `<rect x="${x - 8}" y="${y - 5}" width="16" height="10" fill="${colColors[ci]}" rx="1.5" opacity="${ci === 0 ? 1 : 0.85}"/>`;
        body += `<text x="${x}" y="${y + 0.5}" text-anchor="middle" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="7" font-weight="600" fill="${C.bg}">YES</text>`;
      } else {
        body += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" fill="${C.dim}">—</text>`;
      }
    });
    body += `<line x1="${padLeft - 4}" y1="${y + rowH/2 - 2}" x2="${W - padRight}" y2="${y + rowH/2 - 2}" stroke="${C.hairline}" stroke-width="0.4" stroke-dasharray="2,2"/>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:280px;" xmlns="http://www.w3.org/2000/svg">${header}${body}</svg>`;
}

// ===========================================================
// STAG ELECTRIC — chart variants
// ===========================================================
function radarChartStag() {
  const W = 560, H = 360;
  const cx = W / 2, cy = H / 2 + 6;
  const R = 130;
  const dims = [
    'Local positioning',
    'Service depth',
    'Service area clarity',
    'FAQ / answers',
    'Trust & proof',
    'AEO readiness',
    'Findability',
  ];
  const data = {
    'Stag Electric':       [2, 2, 1, 1, 3, 1, 2],
    'Castle Electrical':   [4, 5, 5, 4, 5, 4, 5],
    'Turn It On Electric': [4, 4, 3, 4, 5, 4, 5],
    'Just Right Electric': [3, 4, 4, 3, 4, 4, 4],
  };
  const colors = {
    'Stag Electric':        C.accent,
    'Castle Electrical':    C.fg,
    'Turn It On Electric':  C.muted,
    'Just Right Electric':  C.dim,
  };
  const fillOpacity = {
    'Stag Electric': 0.18,
    'Castle Electrical': 0.06,
    'Turn It On Electric': 0.04,
    'Just Right Electric': 0.03,
  };
  const angle = i => (-Math.PI / 2) + (i / dims.length) * Math.PI * 2;
  const point = (i, v) => { const r = (v / 5) * R; return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]; };
  let grid = '';
  for (let v = 1; v <= 5; v++) {
    const pts = dims.map((_, i) => point(i, v).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="${C.hairline}" stroke-width="0.6"/>`;
  }
  let axes = '', labels = '';
  dims.forEach((d, i) => {
    const [x, y] = point(i, 5);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.hairline2}" stroke-width="0.5"/>`;
    const r = R + 18;
    const lx = cx + r * Math.cos(angle(i));
    const ly = cy + r * Math.sin(angle(i));
    const ax = Math.cos(angle(i));
    const anchor = ax > 0.3 ? 'start' : ax < -0.3 ? 'end' : 'middle';
    labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" font-weight="500" fill="${C.fg}" letter-spacing="0.04em">${d}</text>`;
  });
  const order = ['Just Right Electric', 'Turn It On Electric', 'Castle Electrical', 'Stag Electric'];
  let polys = '';
  for (const name of order) {
    const pts = data[name].map((v, i) => point(i, v).join(',')).join(' ');
    const isTarget = name === 'Stag Electric';
    polys += `<polygon points="${pts}" fill="${colors[name]}" fill-opacity="${fillOpacity[name]}" stroke="${colors[name]}" stroke-width="${isTarget ? 1.6 : 1}"/>`;
    if (isTarget) {
      data[name].forEach((v, i) => {
        const [x, y] = point(i, v);
        polys += `<circle cx="${x}" cy="${y}" r="2.2" fill="${colors[name]}"/>`;
      });
    }
  }
  let ringLabels = '';
  for (const v of [1, 3, 5]) {
    ringLabels += `<text x="${cx + 4}" y="${cy - (v / 5) * R - 2}" font-family="Instrument Sans, sans-serif" font-size="7" fill="${C.dim}">${v}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="135" xmlns="http://www.w3.org/2000/svg">${grid}${axes}${ringLabels}${polys}${labels}</svg>`;
}

function radarChartStagCompact() {
  const W = 540, H = 280;
  const cx = W / 2, cy = H / 2 + 4;
  const R = 100;
  const dims = ['Local positioning', 'Service depth', 'Service area', 'FAQ / answers', 'Trust & proof', 'AEO readiness', 'Findability'];
  const data = {
    Stag: [2, 2, 1, 1, 3, 1, 2],
    Cas:  [4, 5, 5, 4, 5, 4, 5],
    Tur:  [4, 4, 3, 4, 5, 4, 5],
    JRE:  [3, 4, 4, 3, 4, 4, 4],
  };
  const colors = { Stag: C.accent, Cas: C.fg, Tur: C.muted, JRE: C.dim };
  const fillOpacity = { Stag: 0.18, Cas: 0.06, Tur: 0.04, JRE: 0.03 };
  const angle = i => (-Math.PI / 2) + (i / dims.length) * Math.PI * 2;
  const point = (i, v) => { const r = (v / 5) * R; return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]; };
  let grid = '';
  for (let v = 1; v <= 5; v++) {
    const pts = dims.map((_, i) => point(i, v).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="${C.hairline}" stroke-width="0.5"/>`;
  }
  let axes = '', labels = '';
  dims.forEach((d, i) => {
    const [x, y] = point(i, 5);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.hairline2}" stroke-width="0.4"/>`;
    const r = R + 14;
    const lx = cx + r * Math.cos(angle(i));
    const ly = cy + r * Math.sin(angle(i));
    const ax = Math.cos(angle(i));
    const anchor = ax > 0.3 ? 'start' : ax < -0.3 ? 'end' : 'middle';
    labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" font-weight="500" fill="${C.fg}">${d}</text>`;
  });
  const order = ['JRE', 'Tur', 'Cas', 'Stag'];
  let polys = '';
  for (const name of order) {
    const pts = data[name].map((v, i) => point(i, v).join(',')).join(' ');
    const isTarget = name === 'Stag';
    polys += `<polygon points="${pts}" fill="${colors[name]}" fill-opacity="${fillOpacity[name]}" stroke="${colors[name]}" stroke-width="${isTarget ? 1.4 : 0.9}"/>`;
    if (isTarget) {
      data[name].forEach((v, i) => {
        const [x, y] = point(i, v);
        polys += `<circle cx="${x}" cy="${y}" r="1.8" fill="${colors[name]}"/>`;
      });
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:185px;" xmlns="http://www.w3.org/2000/svg">${grid}${axes}${polys}${labels}</svg>`;
}

function divergingChartStag() {
  const items = [
    ['Real ROC numbers (343438, 322448)',         7, '+'],
    ['BBB Accredited (Jan 2024)',                  6, '+'],
    ['BuildZoom score 95 (top 22% of AZ)',         6, '+'],
    ['HomeAdvisor 5.0★ over 6 verified reviews',   6, '+'],
    ['Real testimonials (Brandon named)',          5, '+'],
    ['Owner-led + named tech',                     5, '+'],
    ['Single-page site — no service pages',        9, '-'],
    ['EV charger work not merchandised',           9, '-'],
    ['No FAQ content / FAQPage schema',            8, '-'],
    ['No LocalBusiness / Service schema',          7, '-'],
    ['ROC# not displayed in indexed copy',         7, '-'],
    ['No city pages (Mesa / Gilbert / Chandler)',  7, '-'],
    ['No cost / process / permit content',         8, '-'],
    ['No manufacturer certs (Tesla / Qmerit)',     6, '-'],
    ['No blog / no AEO content footprint',         6, '-'],
    ['Years-in-business ambiguous (15 vs 7)',      4, '-'],
    ['No press / association badges',              5, '-'],
  ];
  const rowH = 17;
  const padTop = 18, padBot = 18;
  const W = 720;
  const H = padTop + padBot + items.length * rowH;
  const cx = W / 2;
  const maxBar = 240;
  let axis = `
    <line x1="${cx}" y1="${padTop - 4}" x2="${cx}" y2="${H - padBot + 4}" stroke="${C.fg}" stroke-width="0.8"/>
    <text x="${cx - 6}" y="${padTop - 7}" text-anchor="end" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.fg}">GAPS ◀</text>
    <text x="${cx + 6}" y="${padTop - 7}" text-anchor="start" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.accent}">▶ STRENGTHS</text>
  `;
  let bars = '';
  items.forEach((it, i) => {
    const [label, weight, side] = it;
    const y = padTop + i * rowH + rowH / 2;
    const barW = (weight / 10) * maxBar;
    if (side === '+') {
      bars += `<rect x="${cx + 1}" y="${y - 6}" width="${barW}" height="12" fill="${C.accent}" rx="1"/>`;
      bars += `<text x="${cx + barW + 8}" y="${y}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" fill="${C.fg}">${escapeXML(label)}</text>`;
    } else {
      bars += `<rect x="${cx - 1 - barW}" y="${y - 6}" width="${barW}" height="12" fill="${C.fg}" rx="1"/>`;
      bars += `<text x="${cx - barW - 8}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="9" fill="${C.fg}">${escapeXML(label)}</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${Math.round(H * 0.78)}" xmlns="http://www.w3.org/2000/svg">${axis}${bars}</svg>`;
}

function timelineChartStag() {
  const rows = [
    ['Display ROC# 343438 in footer sitewide',    0,  7,  C.accent, 'p1'],
    ['Build 5–7 page site as scoped',             0,  30, C.accent, 'p1'],
    ['Dedicated EV Charger service page',         5,  20, C.accent, 'p1'],
    ['Dedicated panel-upgrade page',              5,  20, C.accent, 'p1'],
    ['GBP claim/rebuild + Q&A seeding',           7,  21, C.accent, 'p1'],
    ['Move HomeAdvisor reviewers to Google',      14, 30, C.accent, 'p1'],

    ['LocalBusiness + Service + FAQPage schema',  20, 45, C.fg,     'p2'],
    ['Cost / permit / troubleshooting blog x9',   25, 80, C.fg,     'p2'],
    ['City pages (Mesa, Gilbert, Chandler, Tempe)',30, 70, C.fg,    'p2'],
    ['Reposition homepage on panel + EV + troubleshoot',25, 50, C.fg, 'p2'],
    ['Photo program (GBP + Instagram)',           20, 90, C.fg,     'p2'],
    ['Owner-response sweep on existing reviews',  10, 25, C.fg,     'p2'],

    ['Pursue Qmerit certification',               20, 90, C.dim,    'p3'],
    ['Pursue Tesla Certified Installer',          30, 95, C.dim,    'p3'],
    ['IEC of Arizona membership',                 30, 90, C.dim,    'p3'],
    ['Review velocity ramp (target 25+ Google)',  30, 100,C.dim,    'p3'],

    ['Spanish-language attribute + service page', 70, 100,C.hairline2, 'p4'],
    ['Older-Mesa-homes electrical safety page',   70, 100,C.hairline2, 'p4'],
    ['TikTok claim + basic profile',              60, 90, C.hairline2, 'p4'],
  ];
  const padTop = 28, padBot = 28, padLeft = 230, padRight = 30;
  const rowH = 18;
  const W = 760;
  const dayMax = 105;
  const H = padTop + padBot + rows.length * rowH;
  const chartW = W - padLeft - padRight;
  const dayX = d => padLeft + (d / dayMax) * chartW;
  let grid = '';
  for (let d = 0; d <= 105; d += 15) {
    const x = dayX(d);
    grid += `<line x1="${x}" y1="${padTop - 6}" x2="${x}" y2="${H - padBot + 4}" stroke="${C.hairline}" stroke-width="0.5"/>`;
    grid += `<text x="${x}" y="${padTop - 10}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" font-weight="500" letter-spacing="0.1em" fill="${C.muted}">D${d}</text>`;
  }
  let bands = '';
  [[30,'30-DAY · QUICK WINS'],[60,'60-DAY · BUILDING'],[90,'90-DAY · COMPOUND']].forEach(([d, lbl]) => {
    const x = dayX(d);
    bands += `<line x1="${x}" y1="${padTop - 12}" x2="${x}" y2="${H - padBot + 12}" stroke="${C.accent}" stroke-width="0.7" stroke-dasharray="3,3" opacity="0.6"/>`;
    bands += `<text x="${x}" y="${H - padBot + 22}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="7" letter-spacing="0.14em" font-weight="600" fill="${C.accent}">${lbl}</text>`;
  });
  let bars = '';
  rows.forEach((r, i) => {
    const [label, s, e, color] = r;
    const y = padTop + i * rowH + rowH / 2;
    const x1 = dayX(s);
    const x2 = dayX(e);
    bars += `<text x="${padLeft - 12}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="8.6" fill="${C.fg}">${escapeXML(label)}</text>`;
    bars += `<rect x="${x1}" y="${y - 5}" width="${x2 - x1}" height="10" fill="${color}" rx="1.5" opacity="${color === C.hairline2 ? 0.85 : 1}"/>`;
    bars += `<line x1="${x1}" y1="${y - 7}" x2="${x1}" y2="${y + 7}" stroke="${color}" stroke-width="0.8"/>`;
  });
  const groups = [['Highest priority', C.accent, 0, 6],['Near-term growth', C.fg, 6, 12],['Foundational', C.dim, 12, 16],['Optional polish', C.hairline2, 16, 19]];
  let groupRibbon = '';
  groups.forEach(([name, color, s, e]) => {
    const y1 = padTop + s * rowH;
    const y2 = padTop + e * rowH;
    groupRibbon += `<rect x="6" y="${y1}" width="3" height="${y2 - y1 - 2}" fill="${color}" opacity="${color === C.hairline2 ? 0.85 : 1}"/>`;
    groupRibbon += `<text x="14" y="${y1 + 9}" font-family="Instrument Sans, sans-serif" font-size="7" letter-spacing="0.14em" font-weight="600" fill="${color}">${escapeXML(name.toUpperCase())}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H + 8}" width="100%" height="${Math.round((H + 8) * 0.7)}" xmlns="http://www.w3.org/2000/svg">${grid}${bands}${groupRibbon}${bars}</svg>`;
}

function timelineChartStagCompact() {
  const rows = [
    ['Build 5-7 page site as scoped',             0,  30, C.accent, 'p1'],
    ['Display ROC# in footer sitewide',           0,  10, C.accent, 'p1'],
    ['Dedicated EV + panel pages',                5,  25, C.accent, 'p1'],
    ['GBP rebuild + review-velocity wire-up',     7,  30, C.accent, 'p1'],
    ['Schema rollout (LocalBusiness, FAQ)',       20, 60, C.fg,     'p2'],
    ['Cost/permit/troubleshooting blog x9',       25, 80, C.fg,     'p2'],
    ['City pages (Mesa, Gilbert, Chandler)',      30, 75, C.fg,     'p2'],
    ['Photo program + owner-response sweep',      20, 90, C.fg,     'p2'],
    ['Qmerit + Tesla Certified + IEC pursuit',    25, 95, C.dim,    'p3'],
  ];
  const padTop = 20, padBot = 22, padLeft = 195, padRight = 18;
  const rowH = 16;
  const W = 720;
  const dayMax = 105;
  const H = padTop + padBot + rows.length * rowH;
  const chartW = W - padLeft - padRight;
  const dayX = d => padLeft + (d / dayMax) * chartW;
  let grid = '';
  for (let d = 0; d <= 105; d += 15) {
    const x = dayX(d);
    grid += `<line x1="${x}" y1="${padTop - 4}" x2="${x}" y2="${H - padBot + 2}" stroke="${C.hairline}" stroke-width="0.4"/>`;
    grid += `<text x="${x}" y="${padTop - 7}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="6.5" font-weight="500" letter-spacing="0.08em" fill="${C.muted}">D${d}</text>`;
  }
  let bands = '';
  [[30,'30D'],[60,'60D'],[90,'90D']].forEach(([d, lbl]) => {
    const x = dayX(d);
    bands += `<line x1="${x}" y1="${padTop - 8}" x2="${x}" y2="${H - padBot + 8}" stroke="${C.accent}" stroke-width="0.5" stroke-dasharray="2.5,2.5" opacity="0.6"/>`;
    bands += `<text x="${x}" y="${H - padBot + 16}" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="6.5" letter-spacing="0.14em" font-weight="600" fill="${C.accent}">${lbl}</text>`;
  });
  let bars = '';
  rows.forEach((r, i) => {
    const [label, s, e, color] = r;
    const y = padTop + i * rowH + rowH / 2;
    const x1 = dayX(s);
    const x2 = dayX(e);
    bars += `<text x="${padLeft - 10}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" fill="${C.fg}">${escapeXML(label)}</text>`;
    bars += `<rect x="${x1}" y="${y - 4}" width="${x2 - x1}" height="8" fill="${color}" rx="1.2"/>`;
    bars += `<line x1="${x1}" y1="${y - 6}" x2="${x1}" y2="${y + 6}" stroke="${color}" stroke-width="0.7"/>`;
  });
  const groups = [[C.accent, 0, 4],[C.fg, 4, 8],[C.dim, 8, 9]];
  let groupRibbon = '';
  groups.forEach(([color, s, e]) => {
    const y1 = padTop + s * rowH;
    const y2 = padTop + e * rowH;
    groupRibbon += `<rect x="6" y="${y1}" width="2.5" height="${y2 - y1 - 1}" fill="${color}"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${H + 4}" width="100%" style="display:block;height:200px;" xmlns="http://www.w3.org/2000/svg">${grid}${bands}${groupRibbon}${bars}</svg>`;
}

function reviewsAcrossPlatformsStag() {
  const rows = [
    ['Google',      '~few',  6,   true,  'Primary signal — needs ramp to 25+'],
    ['HomeAdvisor', '6 ★5.0',6,   false, 'Best existing source; reviewers should cross-post to Google'],
    ['BBB',         'Accred.',8,  false, 'Accredited Jan 2024, "Not Rated" — needs review volume'],
    ['Yelp',        'Few',   3,   false, 'Page exists, low volume'],
    ['BuildZoom',   '95',    18,  false, 'Top 22% of AZ contractors — score, not reviews'],
    ['Facebook',    'Page',  2,   false, 'Page claimed, low engagement'],
    ['Instagram',   '@stag', 2,   false, 'Handle claimed'],
  ];
  const W = 720, padTop = 30, padBot = 16, padLeft = 100, padRight = 50;
  const rowH = 26;
  const H = padTop + padBot + rows.length * rowH;
  const chartW = W - padLeft - padRight;
  const maxBar = 30;
  const xUnit = chartW / maxBar;
  let bars = '';
  rows.forEach((r, i) => {
    const [platform, label, units, isGoogle, note] = r;
    const y = padTop + i * rowH + rowH / 2;
    const barW = Math.min(units, maxBar) * xUnit;
    const color = isGoogle ? C.accent : C.dim;
    bars += `<text x="${padLeft - 12}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="Instrument Serif, serif" font-size="13" fill="${C.fg}">${platform}</text>`;
    bars += `<rect x="${padLeft}" y="${y - 7}" width="${barW}" height="14" fill="${color}" rx="1.5" opacity="${isGoogle ? 1 : 0.85}"/>`;
    bars += `<text x="${padLeft + barW + 8}" y="${y - 1}" dominant-baseline="middle" font-family="Instrument Serif, serif" font-size="13" font-weight="${isGoogle ? '600' : '400'}" fill="${color}">${escapeXML(label)}</text>`;
    bars += `<text x="${padLeft + barW + 8}" y="${y + 9}" dominant-baseline="middle" font-family="Instrument Sans, sans-serif" font-size="7.5" fill="${C.muted}">${escapeXML(note)}</text>`;
  });
  let title = `
    <text x="${padLeft - 12}" y="14" text-anchor="end" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.muted}">PLATFORM</text>
    <text x="${padLeft + 4}" y="14" font-family="Instrument Sans, sans-serif" font-size="7.5" letter-spacing="0.14em" font-weight="600" fill="${C.muted}">REVIEW / SIGNAL VOLUME</text>
  `;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:240px;" xmlns="http://www.w3.org/2000/svg">${title}${bars}</svg>`;
}

// ===========================================================
// Build
// ===========================================================
const wordmarkPath = path.join(root, 'brand-exports', 'aeolistings-wordmark-paper.png');
const wordmarkB64 = fs.readFileSync(wordmarkPath).toString('base64');
const wordmarkData = `data:image/png;base64,${wordmarkB64}`;

// ---- build full report HTML ----
let html = fs.readFileSync(path.join(__dirname, 'report.html'), 'utf8');
// swap the relative wordmark img for inline base64 so the PDF doesn't depend on file paths
html = html.replace(
  /src="aeolistings-wordmark-paper\.png"/,
  `src="${wordmarkData}"`,
);
html = html.replace('RADAR_PLACEHOLDER', radarChart());
html = html.replace('DIVERGING_PLACEHOLDER', divergingChart());
html = html.replace('TIMELINE_PLACEHOLDER', timelineChart());

const outHtml = path.join(__dirname, 'report.built.html');
fs.writeFileSync(outHtml, html);
console.log('Wrote built HTML →', outHtml);

// ---- build one-pager HTML (if onepager.html exists) ----
const onepagerSrc = path.join(__dirname, 'onepager.html');
let onepagerBuilt = null;
if (fs.existsSync(onepagerSrc)) {
  let one = fs.readFileSync(onepagerSrc, 'utf8');
  one = one.replace(
    /src="aeolistings-wordmark-paper\.png"/,
    `src="${wordmarkData}"`,
  );
  one = one.replace('RADAR_PLACEHOLDER', radarChartCompact());
  one = one.replace('TIMELINE_PLACEHOLDER', timelineChartCompact());
  onepagerBuilt = path.join(__dirname, 'onepager.built.html');
  fs.writeFileSync(onepagerBuilt, one);
  console.log('Wrote one-pager HTML →', onepagerBuilt);
}

// ---- build GBP supplement HTML (if gbp-supplement.html exists) ----
const gbpSrc = path.join(__dirname, 'gbp-supplement.html');
let gbpBuilt = null;
if (fs.existsSync(gbpSrc)) {
  let g = fs.readFileSync(gbpSrc, 'utf8');
  g = g.replace(
    /src="aeolistings-wordmark-paper\.png"/,
    `src="${wordmarkData}"`,
  );
  g = g.replace('REVIEWS_PLACEHOLDER', reviewsAcrossPlatforms());
  gbpBuilt = path.join(__dirname, 'gbp-supplement.built.html');
  fs.writeFileSync(gbpBuilt, g);
  console.log('Wrote GBP supplement HTML →', gbpBuilt);
}

// ---- build Cruz Development HTML files ----
const cruzReportSrc = path.join(__dirname, 'cruz-report.html');
let cruzReportBuilt = null;
if (fs.existsSync(cruzReportSrc)) {
  let c = fs.readFileSync(cruzReportSrc, 'utf8');
  c = c.replace(/src="aeolistings-wordmark-paper\.png"/, `src="${wordmarkData}"`);
  c = c.replace('RADAR_PLACEHOLDER', radarChartCruz());
  c = c.replace('DIVERGING_PLACEHOLDER', divergingChartCruz());
  c = c.replace('TIMELINE_PLACEHOLDER', timelineChartCruz());
  cruzReportBuilt = path.join(__dirname, 'cruz-report.built.html');
  fs.writeFileSync(cruzReportBuilt, c);
  console.log('Wrote Cruz report HTML →', cruzReportBuilt);
}

const cruzOnePagerSrc = path.join(__dirname, 'cruz-onepager.html');
let cruzOnePagerBuilt = null;
if (fs.existsSync(cruzOnePagerSrc)) {
  let c = fs.readFileSync(cruzOnePagerSrc, 'utf8');
  c = c.replace(/src="aeolistings-wordmark-paper\.png"/, `src="${wordmarkData}"`);
  c = c.replace('RADAR_PLACEHOLDER', radarChartCruzCompact());
  c = c.replace('TIMELINE_PLACEHOLDER', timelineChartCruzCompact());
  cruzOnePagerBuilt = path.join(__dirname, 'cruz-onepager.built.html');
  fs.writeFileSync(cruzOnePagerBuilt, c);
  console.log('Wrote Cruz one-pager HTML →', cruzOnePagerBuilt);
}

const cruzGbpSrc = path.join(__dirname, 'cruz-gbp-supplement.html');
let cruzGbpBuilt = null;
if (fs.existsSync(cruzGbpSrc)) {
  let c = fs.readFileSync(cruzGbpSrc, 'utf8');
  c = c.replace(/src="aeolistings-wordmark-paper\.png"/, `src="${wordmarkData}"`);
  c = c.replace('REVIEWS_PLACEHOLDER', trustStackCruz());
  cruzGbpBuilt = path.join(__dirname, 'cruz-gbp-supplement.built.html');
  fs.writeFileSync(cruzGbpBuilt, c);
  console.log('Wrote Cruz GBP supplement HTML →', cruzGbpBuilt);
}

// ---- build Stag Electric HTML files ----
const stagReportSrc = path.join(__dirname, 'stag-report.html');
let stagReportBuilt = null;
if (fs.existsSync(stagReportSrc)) {
  let s = fs.readFileSync(stagReportSrc, 'utf8');
  s = s.replace(/src="aeolistings-wordmark-paper\.png"/, `src="${wordmarkData}"`);
  s = s.replace('RADAR_PLACEHOLDER', radarChartStag());
  s = s.replace('DIVERGING_PLACEHOLDER', divergingChartStag());
  s = s.replace('TIMELINE_PLACEHOLDER', timelineChartStag());
  stagReportBuilt = path.join(__dirname, 'stag-report.built.html');
  fs.writeFileSync(stagReportBuilt, s);
  console.log('Wrote Stag report HTML →', stagReportBuilt);
}

const stagOnePagerSrc = path.join(__dirname, 'stag-onepager.html');
let stagOnePagerBuilt = null;
if (fs.existsSync(stagOnePagerSrc)) {
  let s = fs.readFileSync(stagOnePagerSrc, 'utf8');
  s = s.replace(/src="aeolistings-wordmark-paper\.png"/, `src="${wordmarkData}"`);
  s = s.replace('RADAR_PLACEHOLDER', radarChartStagCompact());
  s = s.replace('TIMELINE_PLACEHOLDER', timelineChartStagCompact());
  stagOnePagerBuilt = path.join(__dirname, 'stag-onepager.built.html');
  fs.writeFileSync(stagOnePagerBuilt, s);
  console.log('Wrote Stag one-pager HTML →', stagOnePagerBuilt);
}

const stagGbpSrc = path.join(__dirname, 'stag-gbp-supplement.html');
let stagGbpBuilt = null;
if (fs.existsSync(stagGbpSrc)) {
  let s = fs.readFileSync(stagGbpSrc, 'utf8');
  s = s.replace(/src="aeolistings-wordmark-paper\.png"/, `src="${wordmarkData}"`);
  s = s.replace('REVIEWS_PLACEHOLDER', reviewsAcrossPlatformsStag());
  stagGbpBuilt = path.join(__dirname, 'stag-gbp-supplement.built.html');
  fs.writeFileSync(stagGbpBuilt, s);
  console.log('Wrote Stag GBP supplement HTML →', stagGbpBuilt);
}

// ---- render PDFs ----
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!fs.existsSync(chromePath)) {
  console.error('Chrome not found at', chromePath);
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox'],
});
try {
  // Full report
  const page = await browser.newPage();
  await page.goto('file://' + outHtml, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const outPdf = path.join(__dirname, 'Aeolistings-Audit-EcoRoofing.pdf');
  await page.pdf({
    path: outPdf,
    format: 'Letter',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log('Wrote PDF →', outPdf);

  // One-pager
  if (onepagerBuilt) {
    const page2 = await browser.newPage();
    await page2.goto('file://' + onepagerBuilt, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    const outPdf2 = path.join(__dirname, 'Aeolistings-Audit-EcoRoofing-OnePager.pdf');
    await page2.pdf({
      path: outPdf2,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    console.log('Wrote PDF →', outPdf2);
  }

  // GBP supplement
  if (gbpBuilt) {
    const page3 = await browser.newPage();
    await page3.goto('file://' + gbpBuilt, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    const outPdf3 = path.join(__dirname, 'Aeolistings-Audit-EcoRoofing-GBP.pdf');
    await page3.pdf({
      path: outPdf3,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    console.log('Wrote PDF →', outPdf3);
  }

  // Cruz Development + Stag Electric PDFs
  for (const [src, name] of [
    [cruzReportBuilt,  'Aeolistings-Audit-CruzDevelopment.pdf'],
    [cruzOnePagerBuilt,'Aeolistings-Audit-CruzDevelopment-OnePager.pdf'],
    [cruzGbpBuilt,     'Aeolistings-Audit-CruzDevelopment-GBP.pdf'],
    [stagReportBuilt,  'Aeolistings-Audit-StagElectric.pdf'],
    [stagOnePagerBuilt,'Aeolistings-Audit-StagElectric-OnePager.pdf'],
    [stagGbpBuilt,     'Aeolistings-Audit-StagElectric-GBP.pdf'],
  ]) {
    if (!src) continue;
    const p = await browser.newPage();
    await p.goto('file://' + src, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    const outPdf = path.join(__dirname, name);
    await p.pdf({
      path: outPdf,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    console.log('Wrote PDF →', outPdf);
  }
} finally {
  await browser.close();
}
