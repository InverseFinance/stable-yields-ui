// Daily par yield curve rates published by the US Treasury, one CSV per month with the latest day first
const TREASURY_RATES_CSV = 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/all';
// FRED republishes the same 1-month rate about a day later, oldest day first
const FRED_1MONTH_CSV = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS1MO';
const REQUEST_TIMEOUT_MS = 10_000;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url} responded with ${res.status}`);
  return res.text();
}

// Values of a CSV column in row order, skipping days without a rate (e.g. holidays)
function getCsvColumnValues(csv: string, column: string): number[] {
  const [header, ...rows] = csv.trim().split('\n');
  const index = header.split(',').map(label => label.replace(/"/g, '').trim()).indexOf(column);
  if (index < 0) throw new Error(`Column ${column} not found`);
  return rows.map(row => Number(row.split(',')[index])).filter(value => Number.isFinite(value) && value > 0);
}

const toMonthKey = (date: Date) => `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

async function fetchTreasury1MonthYield(): Promise<number | undefined> {
  const now = new Date();
  // the current month has no rates until its first business day
  const months = [now, new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))].map(toMonthKey);
  for (const month of months) {
    const csv = await fetchText(`${TREASURY_RATES_CSV}/${month}?type=daily_treasury_yield_curve&field_tdr_date_value_month=${month}&page&_format=csv`);
    const [latest] = getCsvColumnValues(csv, '1 Mo');
    if (latest) return latest;
  }
}

async function fetchFred1MonthYield(): Promise<number | undefined> {
  const since = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const values = getCsvColumnValues(await fetchText(`${FRED_1MONTH_CSV}&cosd=${since}`), 'DGS1MO');
  return values[values.length - 1];
}

// Latest 1-month US Treasury bill yield in %, 0 when unavailable
export async function fetchUsTreasuryYield(): Promise<number> {
  // both are requested at once so a slow Treasury response doesn't delay the fallback
  const results = await Promise.allSettled([fetchTreasury1MonthYield(), fetchFred1MonthYield()]);
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) return result.value;
  }
  console.error('Failed to fetch the US Treasury yield:', results.map(r => r.status === 'rejected' ? r.reason : 'no rate'));
  return 0;
}
