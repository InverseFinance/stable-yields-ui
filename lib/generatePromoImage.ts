export interface PromoRowData {
  symbol: string;
  project: string;
  projectLabel: string;
  apy: number;
  avg30: number;
  avg90: number;
  tvl: number;
  tokenImageUrl: string;
  projectImageUrl: string;
  link: string;
  underlyingStable: string;
  underlyingSymbol: string;
  isVault?: boolean;
  lockup?: string;
  apyHistory?: { apy: number }[];
}

// ── Lucide-compatible SVG paths (viewBox 0 0 24 24, stroke-based) ──────────
const LUCIDE_PATHS = {
  repeat:  `<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>`,
  zap:     `<path d="M13 2 4 13h7l-1 9 9-11h-7z"/>`,
  archive: `<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>`,
  lock:    `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  check2:  `<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>`,
  layers:  `<path d="M2 20h20"/><path d="M2 15h20"/><path d="M2 10h20"/>`,
  globe:   `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`,
};

function formatTvl(v: number): string {
  if (!v) return '-';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function formatLink(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('img load failed'));
    img.src = src;
  });
}

function makeLucideIcon(paths: string, color: string, size: number): Promise<HTMLImageElement> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
}

function drawSparkline(
  ctx: CanvasRenderingContext2D,
  points: { apy: number }[],
  x: number, y: number, w: number, h: number,
  color: string,
  isDark: boolean,
) {
  const values = points.map(p => p.apy).filter(v => typeof v === 'number' && !isNaN(v) && v >= 0);
  if (values.length < 2) return;
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const toX = (i: number) => x + (i / (values.length - 1)) * w;
  const toY = (v: number) => y + h - ((v - minV) / range) * h * 0.84 - h * 0.08;

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, isDark ? 'rgba(16,208,122,0.22)' : 'rgba(10,171,97,0.18)');
  grad.addColorStop(1, 'rgba(16,208,122,0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  values.forEach((v, i) => { i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)); });
  ctx.lineTo(toX(values.length - 1), y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  values.forEach((v, i) => { i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)); });
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generatePromoImage(
  tableDataUrl: string,
  row: PromoRowData,
  rank: number,
  isDark: boolean,
): Promise<string> {
  const SCALE = 2;
  const W = 1400;
  const H = 788; // ~16:9
  const TOP_H = 56;
  const SPLIT_X = Math.round(W * 0.56);

  // ── Palette ──────────────────────────────────────────────────────────────
  const BG      = isDark ? '#080A0D'                   : '#F3F5F8';
  const GREEN   = isDark ? '#10D07A'                   : '#0aab61';
  const TEXT    = isDark ? '#FFFFFF'                   : '#0F172A';  // full white in dark
  const MUTED   = isDark ? 'rgba(255,255,255,0.42)'    : 'rgba(15,23,42,0.48)';
  const BORDER  = isDark ? 'rgba(255,255,255,0.09)'    : 'rgba(15,23,42,0.1)';
  const CARD_BG = isDark ? 'rgba(255,255,255,0.04)'    : 'rgba(15,23,42,0.04)';
  const BRACKET = isDark ? 'rgba(255,255,255,0.28)'    : 'rgba(15,23,42,0.22)';
  const GRID    = isDark ? 'rgba(255,255,255,0.035)'   : 'rgba(15,23,42,0.045)';
  const GLOW_A  = isDark ? 'rgba(16,208,122,0.12)'     : 'rgba(10,171,97,0.08)';
  const GLOW_B  = isDark ? 'rgba(16,208,122,0.05)'     : 'rgba(10,171,97,0.035)';
  const LOGO_PH = isDark ? '#1a1c20'                   : '#E5E7EB';

  const font = `"Geist", ui-sans-serif, system-ui, sans-serif`;

  // Bullet icon map: bullet.icon → LUCIDE_PATHS key
  const BULLET_ICON_KEY: Record<string, keyof typeof LUCIDE_PATHS> = {
    recycle: 'repeat',
    zap:     'zap',
    vault:   'archive',
    lock:    'lock',
    unlock:  'check2',
    layers:  'layers',
  };

  // Load all images and icons concurrently
  const ICON_PX = 32; // SVG render size (2x for retina canvas)
  const [
    tableResult, tokenResult, projectResult,
    icoRepeat, icoZap, icoArchive, icoLock, icoCheck2, icoLayers, icoGlobe,
  ] = await Promise.allSettled([
    loadImage(tableDataUrl),
    row.tokenImageUrl   ? loadImage(row.tokenImageUrl)   : Promise.reject(null),
    row.projectImageUrl ? loadImage(row.projectImageUrl) : Promise.reject(null),
    makeLucideIcon(LUCIDE_PATHS.repeat,  GREEN, ICON_PX),
    makeLucideIcon(LUCIDE_PATHS.zap,     GREEN, ICON_PX),
    makeLucideIcon(LUCIDE_PATHS.archive, GREEN, ICON_PX),
    makeLucideIcon(LUCIDE_PATHS.lock,    GREEN, ICON_PX),
    makeLucideIcon(LUCIDE_PATHS.check2,  GREEN, ICON_PX),
    makeLucideIcon(LUCIDE_PATHS.layers,  GREEN, ICON_PX),
    makeLucideIcon(LUCIDE_PATHS.globe,   MUTED,  ICON_PX),
  ]);

  const tableImg   = tableResult.status   === 'fulfilled' ? tableResult.value   : null;
  const tokenImg   = tokenResult.status   === 'fulfilled' ? tokenResult.value   : null;
  const projectImg = projectResult.status === 'fulfilled' ? projectResult.value : null;
  const lucideImgs: Record<keyof typeof LUCIDE_PATHS, HTMLImageElement | null> = {
    repeat:  icoRepeat.status  === 'fulfilled' ? icoRepeat.value  : null,
    zap:     icoZap.status     === 'fulfilled' ? icoZap.value     : null,
    archive: icoArchive.status === 'fulfilled' ? icoArchive.value : null,
    lock:    icoLock.status    === 'fulfilled' ? icoLock.value    : null,
    check2:  icoCheck2.status  === 'fulfilled' ? icoCheck2.value  : null,
    layers:  icoLayers.status  === 'fulfilled' ? icoLayers.value  : null,
    globe:   icoGlobe.status   === 'fulfilled' ? icoGlobe.value   : null,
  };

  const canvas = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  // ── Background ───────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const g1 = ctx.createRadialGradient(W * 0.84, H * 0.12, 0, W * 0.84, H * 0.12, W * 0.52);
  g1.addColorStop(0, GLOW_A); g1.addColorStop(1, 'rgba(16,208,122,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

  const g2 = ctx.createRadialGradient(W * 0.1, H * 0.9, 0, W * 0.1, H * 0.9, W * 0.34);
  g2.addColorStop(0, GLOW_B); g2.addColorStop(1, 'rgba(16,208,122,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = GRID; ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  // ── Top bar ──────────────────────────────────────────────────────────────
  const TM = TOP_H / 2;
  const LOGO_R = 15;

  function drawLogo(img: HTMLImageElement | null, cx: number, cy: number, r: number) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (img) { ctx.clip(); ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2); }
    else { ctx.fillStyle = LOGO_PH; ctx.fill(); }
    ctx.restore();
  }

  let lx = 24;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  drawLogo(tokenImg, lx + LOGO_R, TM, LOGO_R);
  lx += LOGO_R * 2 + 7;

  ctx.fillStyle = MUTED;
  ctx.font = `500 13px ${font}`;
  ctx.fillText('×', lx, TM);
  lx += ctx.measureText('×').width + 7;

  drawLogo(projectImg, lx + LOGO_R, TM, LOGO_R);
  lx += LOGO_R * 2 + 10;

  ctx.fillStyle = TEXT;
  ctx.font = `bold 15px ${font}`;
  ctx.fillText(row.symbol, lx, TM);
  lx += ctx.measureText(row.symbol).width + 7;

  ctx.fillStyle = MUTED;
  ctx.font = `13px ${font}`;
  ctx.fillText(`by ${row.projectLabel || row.project}`, lx, TM);

  // Right: ● LIVE ON ETHEREUM
  ctx.font = `bold 11px ${font}`;
  const liveText = 'LIVE ON ETHEREUM';
  const liveW = ctx.measureText(liveText).width;
  const DOT_R = 4;
  const rxLive = W - 26 - liveW - DOT_R * 2 - 8;

  ctx.beginPath();
  ctx.arc(rxLive + DOT_R, TM, DOT_R, 0, Math.PI * 2);
  ctx.fillStyle = GREEN;
  ctx.fill();

  ctx.fillStyle = MUTED;
  ctx.textAlign = 'left';
  ctx.fillText(liveText, rxLive + DOT_R * 2 + 8, TM);

  // Top bar border
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, TOP_H); ctx.lineTo(W, TOP_H); ctx.stroke();

  // ── Left panel: table screenshot ─────────────────────────────────────────
  const LP_PAD = 20;
  const lpW = SPLIT_X;
  const lpH = H - TOP_H;

  if (tableImg) {
    const ratio = tableImg.width / tableImg.height;
    let tw = lpW - LP_PAD * 2;
    let th = tw / ratio;
    if (th > lpH - LP_PAD * 2) { th = lpH - LP_PAD * 2; tw = th * ratio; }
    const tx = (lpW - tw) / 2;
    const ty = TOP_H + (lpH - th) / 2;

    ctx.save();
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 28; ctx.shadowOffsetY = 10;
    ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(tx, ty, tw, th);
    ctx.restore();

    ctx.drawImage(tableImg, tx, ty, tw, th);

    // Corner brackets
    const BL = 16;
    ctx.strokeStyle = BRACKET; ctx.lineWidth = 2;
    const x0 = tx - 6, y0 = ty - 6, x1 = tx + tw + 6, y1 = ty + th + 6;
    ([
      [x0, y0 + BL, x0, y0, x0 + BL, y0], [x1 - BL, y0, x1, y0, x1, y0 + BL],
      [x0, y1 - BL, x0, y1, x0 + BL, y1], [x1 - BL, y1, x1, y1, x1, y1 - BL],
    ] as [number,number,number,number,number,number][]).forEach(([ax,ay,bx,by,cx2,cy2]) => {
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, cy2); ctx.stroke();
    });
  }

  // Vertical divider (gradient)
  const divGrad = ctx.createLinearGradient(SPLIT_X, TOP_H, SPLIT_X, H);
  divGrad.addColorStop(0, 'rgba(16,208,122,0)');
  divGrad.addColorStop(0.25, isDark ? 'rgba(255,255,255,0.13)' : 'rgba(15,23,42,0.15)');
  divGrad.addColorStop(0.75, isDark ? 'rgba(255,255,255,0.13)' : 'rgba(15,23,42,0.15)');
  divGrad.addColorStop(1, 'rgba(16,208,122,0)');
  ctx.strokeStyle = divGrad; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(SPLIT_X, TOP_H); ctx.lineTo(SPLIT_X, H); ctx.stroke();

  // ── Right panel ───────────────────────────────────────────────────────────
  const RP_X = SPLIT_X + 44;
  const RP_RIGHT = W - 24;
  const RP_W = RP_RIGHT - RP_X;
  let ry = TOP_H + 36;

  function drawSep(y: number) {
    const sg = ctx.createLinearGradient(RP_X, y, RP_RIGHT, y);
    sg.addColorStop(0, isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.22)');
    sg.addColorStop(0.6, isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)');
    sg.addColorStop(1, 'rgba(16,208,122,0)');
    ctx.strokeStyle = sg; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(RP_X, y); ctx.lineTo(RP_RIGHT, y); ctx.stroke();
  }

  ctx.textAlign = 'left';

  // Token logo inline with symbol
  const HEADER_LOGO_R = 26;
  const symbolBaseline = ry + 62;
  drawLogo(tokenImg, RP_X + HEADER_LOGO_R, symbolBaseline - 22, HEADER_LOGO_R);

  // Token symbol (large)
  ctx.fillStyle = TEXT;
  ctx.font = `bold 62px ${font}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(row.symbol, RP_X + HEADER_LOGO_R * 2 + 14, symbolBaseline);
  ry += 72;

  // RANKS #N (green)
  ctx.fillStyle = GREEN;
  ctx.font = `bold 44px ${font}`;
  ctx.fillText(`RANKS  #${rank}`, RP_X, ry + 44);
  ry += 56;

  // Extra gap before "on STABLE YIELDS"
  ry += 20;
  ctx.fillStyle = MUTED;
  ctx.font = `13px ${font}`;
  ctx.fillText('on stableyields.info', RP_X, ry);
  ry += 26;

  drawSep(ry);
  ry += 28;

  // ── APY card: value (left) + 90d sparkline (right) ───────────────────────
  const APY_CARD_H = 100;
  const apyCardDivX = Math.round(RP_X + RP_W / 2);

  roundRect(ctx, RP_X, ry, RP_W, APY_CARD_H, 12);
  ctx.fillStyle = CARD_BG; ctx.fill();
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1; ctx.stroke();

  // APY label + value — centered in left half
  const apyCenterX = Math.round(RP_X + RP_W / 4);
  const apyBlockH = 62;
  const apyTopY = ry + (APY_CARD_H - apyBlockH) / 2;

  ctx.textAlign = 'center';
  ctx.fillStyle = TEXT;
  ctx.font = `bold 18px ${font}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('APY', apyCenterX, apyTopY + 13);

  ctx.fillStyle = GREEN;
  ctx.font = `bold 50px ${font}`;
  ctx.fillText(row.apy ? `${row.apy.toFixed(2)}%` : '-', apyCenterX, apyTopY + 62);

  // Card vertical divider
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(apyCardDivX, ry + 12); ctx.lineTo(apyCardDivX, ry + APY_CARD_H - 12);
  ctx.stroke();

  // Sparkline — right half
  const sparkPad = 14;
  const sparkX = apyCardDivX + sparkPad;
  const sparkY = ry + sparkPad;
  const sparkW = RP_RIGHT - apyCardDivX - sparkPad * 2;
  const sparkH = APY_CARD_H - sparkPad * 2;

  ctx.fillStyle = MUTED;
  ctx.font = `9px ${font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('90d APY', sparkX, sparkY - 2);

  if (row.apyHistory && row.apyHistory.length > 1) {
    drawSparkline(ctx, row.apyHistory, sparkX, sparkY + 10, sparkW, sparkH - 10, GREEN, isDark);
  } else {
    ctx.fillStyle = MUTED;
    ctx.font = `11px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const rightCX = Math.round(apyCardDivX + (RP_RIGHT - apyCardDivX) / 2);
    ctx.fillText(`30d: ${row.avg30 ? row.avg30.toFixed(2) + '%' : '-'}`, rightCX, ry + APY_CARD_H / 2 - 8);
    ctx.fillText(`90d: ${row.avg90 ? row.avg90.toFixed(2) + '%' : '-'}`, rightCX, ry + APY_CARD_H / 2 + 8);
  }

  ry += APY_CARD_H + 16;

  drawSep(ry);
  ry += 22;

  // ── Info card: TVL (left) + list items (right) ────────────────────────────
  const bullets: { icon: string; text: string }[] = [
    { icon: 'recycle', text: 'Auto-compounding' },
    { icon: 'zap',     text: 'Zap-in with USDC or stablecoin' },
    ...(row.isVault ? [{ icon: 'vault',  text: 'ERC-4626 Tokenized Vault' }] : []),
    ...(row.lockup
      ? [{ icon: 'lock',   text: `Lockup: ${row.lockup}` }]
      : [{ icon: 'unlock', text: 'No lockup' }]),
    ...(row.underlyingSymbol ? [{ icon: 'layers', text: `Underlying: ${row.underlyingSymbol}` }] : []),
  ];

  const CARD_PAD_Y = 20;
  const LINE_H = 28;
  const cardH = Math.max(CARD_PAD_Y * 2 + 74, CARD_PAD_Y * 2 + bullets.length * LINE_H + 4);
  // Divider at the horizontal midpoint of the card
  const cardDivX = Math.round(RP_X + RP_W / 2);

  roundRect(ctx, RP_X, ry, RP_W, cardH, 12);
  ctx.fillStyle = CARD_BG; ctx.fill();
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1; ctx.stroke();

  // TVL label + value — centered in the left half
  const tvlCenterX = Math.round(RP_X + RP_W / 4);
  // Vertically center the two-line TVL block inside the card
  const tvlBlockH = 62; // approx: label baseline (13) to value baseline (62) + descenders
  const tvlTopY = ry + (cardH - tvlBlockH) / 2;

  ctx.textAlign = 'center';
  ctx.fillStyle = TEXT;
  ctx.font = `bold 18px ${font}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('TVL', tvlCenterX, tvlTopY + 13);

  ctx.fillStyle = GREEN;
  ctx.font = `bold 50px ${font}`;
  ctx.fillText(formatTvl(row.tvl), tvlCenterX, tvlTopY + 62);

  // Card vertical divider
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardDivX, ry + 12); ctx.lineTo(cardDivX, ry + cardH - 12);
  ctx.stroke();

  // Bullet list — Lucide icons (no badge, green stroke only)
  // Vertically center list items within the card
  const listX = cardDivX + 16;
  const listContentH = bullets.length * LINE_H;
  let listY = ry + (cardH - listContentH) / 2 + LINE_H / 2;
  const ICON_DRAW = 16;

  for (const bullet of bullets) {
    const iconKey = BULLET_ICON_KEY[bullet.icon] ?? 'repeat';
    const iconImg = lucideImgs[iconKey];
    const iconTop = Math.round(listY - ICON_DRAW / 2);
    if (iconImg) {
      ctx.drawImage(iconImg, listX, iconTop, ICON_DRAW, ICON_DRAW);
    }

    ctx.fillStyle = MUTED;
    ctx.font = `13px ${font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(bullet.text, listX + ICON_DRAW + 8, listY);
    listY += LINE_H;
  }

  // Footer: globe icon + opportunity link
  const displayLink = row.link ? formatLink(row.link) : 'stableyields.info';
  const FOOTER_ICON = 14;
  const footerY = H - 16;

  ctx.fillStyle = MUTED;
  ctx.textBaseline = 'alphabetic';

  // Disclaimer — bottom left
  ctx.font = `10px ${font}`;
  ctx.textAlign = 'left';
  ctx.fillText('APY variable. Past performance not indicative of future results.', LP_PAD, footerY);

  // Globe + link — bottom right
  ctx.font = `bold 14px ${font}`;
  ctx.textAlign = 'right';
  const linkW = ctx.measureText(displayLink).width;
  if (lucideImgs.globe) {
    ctx.drawImage(
      lucideImgs.globe,
      RP_RIGHT - linkW - 8 - FOOTER_ICON,
      footerY - 11,
      FOOTER_ICON, FOOTER_ICON,
    );
  }
  ctx.fillText(displayLink, RP_RIGHT, footerY);

  return canvas.toDataURL('image/png');
}
