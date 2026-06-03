export interface PromoRowData {
  symbol: string;
  project: string;
  projectLabel: string;
  apy: number;
  avg30: number;
  avg90: number;
  tvl: number;
  tokenImageUrl: string;   // pre-fetched data URL
  projectImageUrl: string; // pre-fetched data URL
  link: string;
  underlyingStable: string;
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
): Promise<string> {
  const SCALE = 2;
  const W = 1400;
  const H = 788; // ~16:9
  const TOP_H = 64;
  const SPLIT_X = Math.round(W * 0.56);

  // Always dark for social sharing
  const BG = '#0A0C0F';
  const GREEN = '#10D07A';
  const WHITE = '#EEEEEE';
  const MUTED = 'rgba(238,238,238,0.45)';
  const BORDER = 'rgba(255,255,255,0.08)';
  const BRACKET = 'rgba(255,255,255,0.28)';

  const font = `"Geist", ui-sans-serif, system-ui, sans-serif`;

  // Load all images concurrently; failures handled gracefully
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

  // ── Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ── Top bar ─────────────────────────────────────────────────────────────
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
      ctx.fillStyle = '#1a1c20';
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

  ctx.fillStyle = WHITE;
  ctx.font = `bold 17px ${font}`;
  ctx.fillText(row.symbol, lx, TM);
  lx += ctx.measureText(row.symbol).width + 8;

  ctx.fillStyle = MUTED;
  ctx.font = `14px ${font}`;
  ctx.fillText(`· ${row.projectLabel || row.project}`, lx, TM);

  // Rank badge (top-right)
  const rankText = `STABLE YIELDS RANK  ·  #${rank}`;
  ctx.font = `bold 11px ${font}`;
  const rw = ctx.measureText(rankText).width + 22;
  const rxBadge = W - 26 - rw;
  const ryBadge = TM - 13;
  roundRect(ctx, rxBadge, ryBadge, rw, 26, 4);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.textAlign = 'left';
  ctx.fillText(rankText, rxBadge + 11, TM);

  // Top bar bottom border
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, TOP_H);
  ctx.lineTo(W, TOP_H);
  ctx.stroke();

  // ── Left panel: table screenshot ────────────────────────────────────────
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

  // Vertical divider
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SPLIT_X, TOP_H);
  ctx.lineTo(SPLIT_X, H);
  ctx.stroke();

  // ── Right panel ──────────────────────────────────────────────────────────
  const RP_X = SPLIT_X + 52;
  const RP_RIGHT = W - 28; // right edge for this panel
  let ry = TOP_H + 44;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // "— EARN ON STABLECOINS"
  ctx.fillStyle = MUTED;
  ctx.font = `12px ${font}`;
  ctx.fillText('— EARN ON STABLECOINS', RP_X, ry);
  ry += 14;

  // "real"
  ctx.fillStyle = WHITE;
  ctx.font = `bold 86px ${font}`;
  ry += 86;
  ctx.fillText('real', RP_X, ry);
  ry += 6;

  // "yield."
  ctx.fillStyle = GREEN;
  ctx.font = `italic bold 86px ${font}`;
  ry += 86;
  ctx.fillText('yield.', RP_X, ry);
  ry += 36;

  // Horizontal spacer between hero text and stats
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(RP_X, ry);
  ctx.lineTo(RP_RIGHT, ry);
  ctx.stroke();
  ry += 28;

  // Stats — APY and TVL side by side
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

  ctx.fillStyle = WHITE;
  ctx.font = `bold 50px ${font}`;
  ctx.fillText(formatTvl(row.tvl), RP_X + statColW, ry + 50);
  ry += 62;

  // 30d / 90d averages (small, below stats)
  const avg30Str = row.avg30 ? `${row.avg30.toFixed(2)}%` : '-';
  const avg90Str = row.avg90 ? `${row.avg90.toFixed(2)}%` : '-';
  ctx.fillStyle = MUTED;
  ctx.font = `12px ${font}`;
  ctx.fillText(`30d avg: ${avg30Str}   ·   90d avg: ${avg90Str}`, RP_X, ry);
  ry += 26;

  // Horizontal spacer before bullets
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(RP_X, ry);
  ctx.lineTo(RP_RIGHT, ry);
  ctx.stroke();
  ry += 20;

  // Bullet list
  const bullets = [
    'auto-compounding',
    'Zap-in with USDC or another stable',
    ...(row.underlyingStable ? [`Underlying: ${row.underlyingStable}`] : []),
  ];
  ctx.fillStyle = MUTED;
  ctx.font = `13px ${font}`;
  for (const bullet of bullets) {
    ctx.fillText(`►  ${bullet}`, RP_X, ry);
    ry += 22;
  }

  // Footer: opportunity link (bottom-right)
  const displayLink = row.link ? formatLink(row.link) : 'stableyields.info';
  ctx.fillStyle = MUTED;
  ctx.font = `13px ${font}`;
  ctx.textAlign = 'right';
  ctx.fillText(displayLink, RP_RIGHT, H - 18);

  return canvas.toDataURL('image/png');
}
