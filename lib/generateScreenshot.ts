export interface ScreenshotRow {
  symbol: string;
  project: string;
  apy: number;
  avg30: number;
  avg90: number;
  tvl: number;
}

const TITLE = 'Stable Yields';
const SUBTITLE = 'Earn and compare the best stablecoin yields across major DeFi protocols';
const FOOTER_URL = 'https://www.stableyields.info';

// Resolve a CSS custom property to a computed RGB string by temporarily
// creating a DOM element and reading back getComputedStyle.
function resolveCSSVar(varName: string): string {
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;left:-9999px;opacity:0;color:var(${varName});`;
  document.body.appendChild(el);
  const val = window.getComputedStyle(el).color;
  document.body.removeChild(el);
  return val;
}

function formatPct(v: number | undefined): string {
  return v ? `${v.toFixed(2)}%` : '-';
}

function formatTvl(v: number | undefined): string {
  if (!v) return '-';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
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

interface ColDef { label: string; x: number }

function drawRow(
  ctx: CanvasRenderingContext2D,
  row: ScreenshotRow,
  cols: ColDef[],
  y: number,
  rowH: number,
  colors: { text: string; textMuted: string; success: string; border: string },
  withSeparator = true
) {
  const mid = y + rowH / 2;
  const font = `"Geist", ui-sans-serif, system-ui, sans-serif`;

  // Small circle indicator (mimics the image placeholder)
  ctx.fillStyle = colors.success;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(cols[0].x - 13, mid, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Symbol
  ctx.fillStyle = colors.text;
  ctx.font = `bold 15px ${font}`;
  ctx.textAlign = 'left';
  ctx.fillText(row.symbol, cols[0].x + 2, mid + 5);

  // Project
  ctx.fillStyle = colors.textMuted;
  ctx.font = `15px ${font}`;
  ctx.fillText(row.project, cols[1].x, mid + 5);

  // APY — green
  ctx.fillStyle = colors.success;
  ctx.font = `bold 15px ${font}`;
  ctx.fillText(formatPct(row.apy), cols[2].x, mid + 5);

  // 30d, 90d, TVL
  ctx.fillStyle = colors.text;
  ctx.font = `bold 15px ${font}`;
  ctx.fillText(formatPct(row.avg30), cols[3].x, mid + 5);
  ctx.fillText(formatPct(row.avg90), cols[4].x, mid + 5);
  ctx.fillText(formatTvl(row.tvl), cols[5].x, mid + 5);

  if (withSeparator) {
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cols[0].x - 28, y + rowH);
    ctx.lineTo(cols[5].x + 200, y + rowH);
    ctx.stroke();
  }
}

export function generateYieldScreenshot(
  rowsAbove: ScreenshotRow[],
  rowBelow: ScreenshotRow | null,
  usTreasuryYield: number,
  isDark: boolean
): string {
  // Resolve actual CSS variable values so colors perfectly match the site theme
  const bg       = resolveCSSVar('--background');
  const card     = resolveCSSVar('--card');
  const border   = resolveCSSVar('--border');
  const text     = resolveCSSVar('--primary-foreground');
  const textMuted = resolveCSSVar('--muted-foreground');
  const primary  = resolveCSSVar('--primary');
  const success  = '#10D07A'; // --success is always #10D07A

  // Treasury separator: muted blue (same tint as in the table borderTop)
  const treasuryC = isDark ? 'rgba(93, 143, 186, 0.9)' : 'rgba(59, 130, 246, 0.8)';

  const colors = { text, textMuted, success, border };

  const SCALE = 2;
  const W = 1200;
  const PX = 44;
  const PY = 40;
  const HEADER_H = 108;
  const COL_H = 48;
  const ROW_H = 56;
  const SEP_H = 50;
  const FOOTER_H = 72;
  const CARD_PAD = 18;

  const nBelow = rowBelow ? 1 : 0;
  const tableH = COL_H + ROW_H * rowsAbove.length
    + (usTreasuryYield > 0 ? SEP_H + ROW_H * nBelow : 0);
  const cardH = tableH + CARD_PAD * 2;
  const H = PY + HEADER_H + 20 + cardH + 20 + FOOTER_H + PY;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  const font = `"Geist", ui-sans-serif, system-ui, sans-serif`;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Title (text-primary)
  ctx.fillStyle = primary;
  ctx.font = `bold 42px ${font}`;
  ctx.textAlign = 'left';
  ctx.fillText(TITLE, PX, PY + 46);

  // Subtitle (text-muted-foreground)
  ctx.fillStyle = textMuted;
  ctx.font = `16px ${font}`;
  ctx.fillText(SUBTITLE, PX, PY + 78);

  // Date top-right
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  ctx.fillStyle = textMuted;
  ctx.font = `13px ${font}`;
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - PX, PY + 78);
  ctx.textAlign = 'left';

  // Card (bg-container = bg-card + border)
  const cardX = PX;
  const cardY = PY + HEADER_H;
  const cardW = W - PX * 2;
  ctx.fillStyle = card;
  roundRect(ctx, cardX, cardY, cardW, cardH, 12);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardW, cardH, 12);
  ctx.stroke();

  // Column positions (matches table layout: no Supply column)
  const cols: ColDef[] = [
    { label: 'Stablecoin', x: cardX + CARD_PAD + 22 },
    { label: 'Project',    x: cardX + CARD_PAD + 222 },
    { label: 'APY',        x: cardX + CARD_PAD + 422 },
    { label: '30d Avg.',   x: cardX + CARD_PAD + 546 },
    { label: '90d Avg.',   x: cardX + CARD_PAD + 674 },
    { label: 'TVL',        x: cardX + CARD_PAD + 802 },
  ];

  let y = cardY + CARD_PAD;

  // Column headers (text-muted-foreground, smaller)
  ctx.fillStyle = textMuted;
  ctx.font = `13px ${font}`;
  ctx.textAlign = 'left';
  for (const col of cols) {
    ctx.fillText(col.label, col.x, y + 30);
  }
  y += COL_H;

  // Header underline
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + CARD_PAD, y);
  ctx.lineTo(cardX + cardW - CARD_PAD, y);
  ctx.stroke();

  // Rows above treasury
  for (const row of rowsAbove) {
    drawRow(ctx, row, cols, y, ROW_H, colors);
    y += ROW_H;
  }

  if (usTreasuryYield > 0) {
    // Dashed treasury separator (same style as in futuristic-table: borderTop dashed)
    const sepMid = y + SEP_H / 2;
    ctx.strokeStyle = treasuryC;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(cardX + CARD_PAD, sepMid);
    ctx.lineTo(cardX + cardW - CARD_PAD, sepMid);
    ctx.stroke();
    ctx.setLineDash([]);

    // Treasury label badge (mimics the absolute-positioned span in the table)
    const labelText = `US Treasury Yield: ${usTreasuryYield.toFixed(2)}%`;
    ctx.font = `bold 12px ${font}`;
    const lw = ctx.measureText(labelText).width + 24;
    const lx = cols[0].x - 18;
    const ly = sepMid - 11;
    ctx.fillStyle = card;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    roundRect(ctx, lx, ly, lw, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'left';
    ctx.fillText(labelText, lx + 12, sepMid + 5);
    y += SEP_H;

    // One row below treasury
    if (rowBelow) {
      drawRow(ctx, rowBelow, cols, y, ROW_H, colors, false);
    }
  }

  // Footer separator
  const footerSepY = cardY + cardH + 20;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PX, footerSepY);
  ctx.lineTo(W - PX, footerSepY);
  ctx.stroke();

  // Footer URL
  ctx.fillStyle = textMuted;
  ctx.font = `15px ${font}`;
  ctx.textAlign = 'center';
  ctx.fillText(FOOTER_URL, W / 2, footerSepY + 36);

  return canvas.toDataURL('image/png');
}
