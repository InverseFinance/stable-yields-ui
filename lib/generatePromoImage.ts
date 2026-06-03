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
}

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
  const TOP_H = 64;
  const SPLIT_X = Math.round(W * 0.56);

  // ── Theme-aware palette ──────────────────────────────────────────────────
  const BG      = isDark ? '#0A0C0F'                   : '#F5F7FA';
  const GREEN   = isDark ? '#10D07A'                   : '#0aab61';
  const TEXT    = isDark ? '#EEEEEE'                   : '#111827';
  const MUTED   = isDark ? 'rgba(238,238,238,0.45)'    : 'rgba(17,24,39,0.5)';
  const BORDER  = isDark ? 'rgba(255,255,255,0.08)'    : 'rgba(17,24,39,0.1)';
  const BRACKET = isDark ? 'rgba(255,255,255,0.3)'     : 'rgba(17,24,39,0.25)';
  const GRID    = isDark ? 'rgba(255,255,255,0.04)'    : 'rgba(17,24,39,0.05)';
  const LOGO_PH = isDark ? '#1a1c20'                   : '#E5E7EB';
  const GLOW_A  = isDark ? 'rgba(16,208,122,0.13)'     : 'rgba(10,171,97,0.09)';
  const GLOW_B  = isDark ? 'rgba(16,208,122,0.06)'     : 'rgba(10,171,97,0.04)';

  const font = `"Geist", ui-sans-serif, system-ui, sans-serif`;

  // Load all images concurrently
  const [tableResult, tokenResult, projectResult] = await Promise.allSettled([
    loadImage(tableDataUrl),
    row.tokenImageUrl ? loadImage(row.tokenImageUrl) : Promise.reject(null),
    row.projectImageUrl ? loadImage(row.projectImageUrl) : Promise.reject(null),
  ]);
  const tableImg   = tableResult.status   === 'fulfilled' ? tableResult.value   : null;
  const tokenImg   = tokenResult.status   === 'fulfilled' ? tokenResult.value   : null;
  const projectImg = projectResult.status === 'fulfilled' ? projectResult.value : null;

  const canvas = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  // ── Background: solid fill ───────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ── Background: radial gradient glows ───────────────────────────────────
  // Top-right glow (green, anchored to right panel)
  const g1 = ctx.createRadialGradient(W * 0.87, 0, 0, W * 0.87, 0, W * 0.52);
  g1.addColorStop(0, GLOW_A);
  g1.addColorStop(1, 'rgba(16,208,122,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // Bottom-left secondary glow (depth counterbalance)
  const g2 = ctx.createRadialGradient(W * 0.1, H, 0, W * 0.1, H, W * 0.38);
  g2.addColorStop(0, GLOW_B);
  g2.addColorStop(1, 'rgba(16,208,122,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // ── Background: subtle grid ──────────────────────────────────────────────
  const GRID_SIZE = 40;
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= W; x += GRID_SIZE) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += GRID_SIZE) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  // ── Top bar ──────────────────────────────────────────────────────────────
  const TM = TOP_H / 2;
  const LOGO_R = 17;

  function drawLogo(img: HTMLImageElement | null, cx: number, cy: number, r: number) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (img) {
      ctx.clip();
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    } else {
      ctx.fillStyle = LOGO_PH;
      ctx.fill();
    }
    ctx.restore();
  }

  let lx = 28;
  ctx.textBaseline = 'middle';

  drawLogo(tokenImg, lx + LOGO_R, TM, LOGO_R);
  lx += LOGO_R * 2 + 8;

  ctx.fillStyle = MUTED;
  ctx.font = `500 15px ${font}`;
  ctx.textAlign = 'left';
  ctx.fillText('×', lx, TM);
  lx += ctx.measureText('×').width + 9;

  drawLogo(projectImg, lx + LOGO_R, TM, LOGO_R);
  lx += LOGO_R * 2 + 13;

  ctx.fillStyle = TEXT;
  ctx.font = `bold 17px ${font}`;
  ctx.fillText(row.symbol, lx, TM);
  lx += ctx.measureText(row.symbol).width + 8;

  ctx.fillStyle = MUTED;
  ctx.font = `14px ${font}`;
  ctx.fillText(`· ${row.projectLabel || row.project}`, lx, TM);

  // "● LIVE ON ETHEREUM" + rank badge (top-right)
  const rankText = `STABLE YIELDS RANK  ·  #${rank}`;
  const liveText = 'LIVE ON ETHEREUM';
  ctx.font = `bold 11px ${font}`;
  const rw = ctx.measureText(rankText).width + 22;
  const liveW = ctx.measureText(liveText).width;
  const DOT_R = 4;
  const LIVE_GAP = 18;
  const rxBadge = W - 26 - rw;
  const rxLive = rxBadge - LIVE_GAP - liveW - DOT_R * 2 - 8;

  ctx.beginPath();
  ctx.arc(rxLive + DOT_R, TM, DOT_R, 0, Math.PI * 2);
  ctx.fillStyle = GREEN;
  ctx.fill();

  ctx.fillStyle = MUTED;
  ctx.textAlign = 'left';
  ctx.fillText(liveText, rxLive + DOT_R * 2 + 8, TM);

  roundRect(ctx, rxBadge, TM - 13, rw, 26, 4);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.fillText(rankText, rxBadge + 11, TM);

  // Top bar bottom border
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, TOP_H);
  ctx.lineTo(W, TOP_H);
  ctx.stroke();

  // ── Left panel: table screenshot ─────────────────────────────────────────
  const LP_PAD = 24;
  const lpW = SPLIT_X;
  const lpH = H - TOP_H;

  if (tableImg) {
    const ratio = tableImg.width / tableImg.height;
    let tw = lpW - LP_PAD * 2;
    let th = tw / ratio;
    if (th > lpH - LP_PAD * 2) { th = lpH - LP_PAD * 2; tw = th * ratio; }
    const tx = (lpW - tw) / 2;
    const ty = TOP_H + (lpH - th) / 2;

    // Subtle drop shadow behind the table image
    ctx.save();
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = 'transparent';
    ctx.fillRect(tx, ty, tw, th);
    ctx.restore();

    ctx.drawImage(tableImg, tx, ty, tw, th);

    // Corner brackets
    const BL = 18;
    ctx.strokeStyle = BRACKET;
    ctx.lineWidth = 2;
    const x0 = tx - 7, y0 = ty - 7, x1 = tx + tw + 7, y1 = ty + th + 7;
    ctx.beginPath(); ctx.moveTo(x0, y0 + BL); ctx.lineTo(x0, y0); ctx.lineTo(x0 + BL, y0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1 - BL, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + BL); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y1 - BL); ctx.lineTo(x0, y1); ctx.lineTo(x0 + BL, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1 - BL, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - BL); ctx.stroke();
  }

  // Vertical divider (gradient fade)
  const divGrad = ctx.createLinearGradient(SPLIT_X, TOP_H, SPLIT_X, H);
  divGrad.addColorStop(0,   BORDER);
  divGrad.addColorStop(0.5, isDark ? 'rgba(255,255,255,0.14)' : 'rgba(17,24,39,0.18)');
  divGrad.addColorStop(1,   BORDER);
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SPLIT_X, TOP_H);
  ctx.lineTo(SPLIT_X, H);
  ctx.stroke();

  // ── Right panel ───────────────────────────────────────────────────────────
  const RP_X = SPLIT_X + 52;
  const RP_RIGHT = W - 28;
  let ry = TOP_H + 44;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  ctx.fillStyle = MUTED;
  ctx.font = `12px ${font}`;
  ctx.fillText('— EARN ON STABLECOINS', RP_X, ry);
  ry += 14;

  ctx.fillStyle = TEXT;
  ctx.font = `bold 86px ${font}`;
  ry += 86;
  ctx.fillText('real', RP_X, ry);
  ry += 6;

  ctx.fillStyle = GREEN;
  ctx.font = `italic bold 86px ${font}`;
  ry += 86;
  ctx.fillText('yield.', RP_X, ry);
  ry += 36;

  // Spacer (gradient line)
  const sep1 = ctx.createLinearGradient(RP_X, ry, RP_RIGHT, ry);
  sep1.addColorStop(0, isDark ? 'rgba(255,255,255,0.15)' : 'rgba(17,24,39,0.2)');
  sep1.addColorStop(1, 'rgba(16,208,122,0)');
  ctx.strokeStyle = sep1;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(RP_X, ry); ctx.lineTo(RP_RIGHT, ry); ctx.stroke();
  ry += 28;

  // Stats
  const statColW = (RP_RIGHT - RP_X) / 2;
  ctx.fillStyle = MUTED;
  ctx.font = `11px ${font}`;
  ctx.fillText('APY', RP_X, ry);
  ctx.fillText('TVL', RP_X + statColW, ry);
  ry += 6;

  const apyStr = row.apy ? `${row.apy.toFixed(2)}` : '-';
  ctx.fillStyle = GREEN;
  ctx.font = `bold 50px ${font}`;
  ctx.fillText(apyStr, RP_X, ry + 50);
  if (row.apy) {
    const apyW = ctx.measureText(apyStr).width;
    ctx.font = `bold 26px ${font}`;
    ctx.fillText('%', RP_X + apyW + 3, ry + 50);
  }

  ctx.fillStyle = TEXT;
  ctx.font = `bold 50px ${font}`;
  ctx.fillText(formatTvl(row.tvl), RP_X + statColW, ry + 50);
  ry += 82;

  const avg30Str = row.avg30 ? `${row.avg30.toFixed(2)}%` : '-';
  const avg90Str = row.avg90 ? `${row.avg90.toFixed(2)}%` : '-';
  ctx.fillStyle = MUTED;
  ctx.font = `12px ${font}`;
  ctx.fillText(`30d avg: ${avg30Str}   ·   90d avg: ${avg90Str}`, RP_X, ry);
  ry += 26;

  // Spacer before bullets (gradient line)
  const sep2 = ctx.createLinearGradient(RP_X, ry, RP_RIGHT, ry);
  sep2.addColorStop(0, isDark ? 'rgba(255,255,255,0.15)' : 'rgba(17,24,39,0.2)');
  sep2.addColorStop(1, 'rgba(16,208,122,0)');
  ctx.strokeStyle = sep2;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(RP_X, ry); ctx.lineTo(RP_RIGHT, ry); ctx.stroke();
  ry += 34;

  // Bullet list
  const bullets = [
    'Auto-compounding',
    'Zap-in with USDC or another stable',
    ...(row.isVault ? ['ERC-4626 Tokenized Vault'] : []),
    ...(row.lockup ? [`Lockup: ${row.lockup}`] : ['No lockup']),
    ...(row.underlyingSymbol ? [`Underlying: ${row.underlyingSymbol}`] : []),
  ];
  ctx.fillStyle = MUTED;
  ctx.font = `13px ${font}`;
  for (const bullet of bullets) {
    ctx.fillText(`►  ${bullet}`, RP_X, ry);
    ry += 22;
  }

  // Footer: opportunity link
  const displayLink = row.link ? formatLink(row.link) : 'stableyields.info';
  ctx.fillStyle = MUTED;
  ctx.font = `bold 16px ${font}`;
  ctx.textAlign = 'right';
  ctx.fillText(displayLink, RP_RIGHT, H - 18);

  return canvas.toDataURL('image/png');
}
