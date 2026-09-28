// Rewrites lib/ethena-points.ts from https://app.ethena.fi/opportunities.
// That page builds its multipliers in the browser and has no API behind it, so reading them needs a real browser.
// Usage: npm run refresh-ethena-points   (CHROME_PATH overrides the Chrome binary)
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.CDP_PORT || 9351);
const PAGE_URL = 'https://app.ethena.fi/opportunities';
const TARGET_FILE = new URL('../lib/ethena-points.ts', import.meta.url).pathname;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Rows of one category tab, as "PROTOCOL Asset • Asset" and its multiplier, walking every page
const readCategory = category => `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rowsWithMultiplier = () => [...document.querySelectorAll('tbody tr')]
    .filter(row => [...row.querySelectorAll('td')].some(c => /^[\\d.]+x$/.test(c.innerText.trim())));
  const firstLabel = () => document.querySelector('tbody tr td')?.innerText.trim() || '';
  const waitForRows = async previousLabel => {
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      if (rowsWithMultiplier().length && firstLabel() !== previousLabel) return true;
    }
    return false;
  };

  const tab = [...document.querySelectorAll('button, [role="tab"]')].find(b => b.innerText.trim() === ${JSON.stringify(category)});
  if (!tab) return { error: 'category not found' };
  const beforeSwitch = firstLabel();
  tab.click();
  if (!await waitForRows(beforeSwitch)) return { error: 'no rows after opening ' + ${JSON.stringify(category)} };

  const rows = [];
  const readPage = () => {
    for (const row of rowsWithMultiplier()) {
      const cells = [...row.querySelectorAll('td')].map(c => c.innerText.replace(/\\s+/g, ' ').trim());
      const multiplier = cells.find(c => /^[\\d.]+x$/.test(c));
      if (cells[0] && multiplier) rows.push({ label: cells[0], multiplier: parseFloat(multiplier) });
    }
  };
  readPage();

  // the list is paginated, walk the numbered pages
  const lastPage = Math.max(1, ...[...document.querySelectorAll('button')]
    .map(b => parseInt(b.innerText.trim(), 10))
    .filter(n => Number.isInteger(n) && n < 50));
  for (let page = 2; page <= lastPage; page++) {
    const button = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === String(page));
    if (!button) break;
    const previousLabel = firstLabel();
    button.click();
    if (!await waitForRows(previousLabel)) break;
    readPage();
  }
  return { rows, pages: lastPage };
})()`;

// "INVERSE YEARN VAULT sUSDe • DOLA" -> { project: 'inverse yearn vault', coins: ['susde', 'dola'] }
// The coins are the last word before each bullet, everything before the first of them is the venue.
const parseLabel = label => {
  const parts = label.split('•').map(part => part.trim()).filter(Boolean);
  const words = parts[0].split(' ');
  const firstCoin = words.pop();
  return {
    project: words.join(' ').toLowerCase(),
    coins: [firstCoin, ...parts.slice(1)].map(coin => coin.toLowerCase()).sort(),
  };
};

const toCoinsKey = coins => coins.join('+');

const toEntries = rows => {
  const markets = new Map();
  const pools = new Map();
  for (const { label, multiplier, isPool } of rows) {
    if (!multiplier) continue;
    const { project, coins } = parseLabel(label);
    const coinsKey = toCoinsKey(coins);
    if (!coinsKey) continue;
    if (project) markets.set(`${project}:${coinsKey}`, { multiplier, label });
    // only the pools tab lists LP tokens, a money market pairs a collateral with its debt
    if (isPool && coins.length > 1 && !pools.has(coinsKey)) pools.set(coinsKey, { multiplier, label });
  }
  return { markets, pools };
};

const toRecord = entries => [...entries]
  .map(([key, { multiplier, label }]) => `  '${key}': ${multiplier}, // ${label}`)
  .join('\n');

const profile = mkdtempSync(join(tmpdir(), 'ethena-points-'));
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--window-size=1400,1000', 'about:blank',
], { stdio: 'ignore' });

try {
  let target;
  for (let i = 0; i < 300 && !target; i++) {
    await sleep(200);
    target = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      .then(res => res.json())
      .then(targets => targets.find(t => t.type === 'page'))
      .catch(() => undefined);
  }
  if (!target) throw new Error(`Chrome did not answer on port ${PORT}, is it installed at ${CHROME}?`);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) => new Promise(resolve => {
    const messageId = ++id;
    pending.set(messageId, resolve);
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
  const evaluate = async expression => {
    const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    return res.result?.result?.value;
  };

  await send('Page.enable');
  await send('Page.navigate', { url: PAGE_URL });
  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    if (await evaluate(`[...document.querySelectorAll('tbody tr td')].some(c => /^[\\d.]+x$/.test(c.innerText.trim()))`)) break;
  }
  // the table only reacts to the category tabs once it has hydrated
  await sleep(3000);

  const pools = await evaluate(readCategory('Liquidity Pools'));
  const markets = await evaluate(readCategory('Money Markets'));
  ws.close();
  if (pools?.error || markets?.error) throw new Error(`Categories not found on the page: ${pools?.error || markets?.error}`);

  const entries = toEntries([
    ...(pools.rows || []).map(row => ({ ...row, isPool: true })),
    ...(markets.rows || []),
  ]);
  const { markets: marketEntries, pools: poolEntries } = entries;
  if (!poolEntries.size || !marketEntries.size) throw new Error('No multipliers read, the page layout probably changed');

  const today = new Date().toISOString().split('T')[0];
  writeFileSync(TARGET_FILE, `// Ethena sats multipliers, read from ${PAGE_URL} on ${today}.
// The page holds them in its client bundle with no API behind it, so they live here
// and are refreshed with \`npm run refresh-ethena-points\`.

// Venues, keyed by the venue and the collateral symbols, all lowercased
const MARKET_MULTIPLIERS: Record<string, number> = {
${toRecord(marketEntries)}
};

// Liquidity pools, keyed by their coin symbols, for an LP token wherever it is held
const POOL_MULTIPLIERS: Record<string, number> = {
${toRecord(poolEntries)}
};

// our project names, where they differ from Ethena's
const PROJECT_ALIASES: Record<string, string> = {
  firm: 'inverse',
};

// Sats per dollar of collateral, undefined when the collateral earns none
export function getEthenaMultiplier(project: string, coinSymbols: string[]): number | undefined {
  const coinsKey = coinSymbols.map(symbol => symbol.toLowerCase()).sort().join('+');
  const projectKey = project.toLowerCase();
  return MARKET_MULTIPLIERS[\`\${PROJECT_ALIASES[projectKey] || projectKey}:\${coinsKey}\`]
    // an LP earns the points of its pool, whichever venue holds the LP token
    ?? POOL_MULTIPLIERS[coinsKey];
}
`);
  console.log(`Wrote ${poolEntries.size} pools (${pools.pages} pages) and ${marketEntries.size} money markets (${markets.pages} pages) to lib/ethena-points.ts`);
  console.log([...poolEntries].map(([key, { multiplier }]) => `  pool   ${key} ${multiplier}x`).join('\n'));
  console.log([...marketEntries].map(([key, { multiplier }]) => `  market ${key} ${multiplier}x`).join('\n'));
} finally {
  chrome.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch {}
}
