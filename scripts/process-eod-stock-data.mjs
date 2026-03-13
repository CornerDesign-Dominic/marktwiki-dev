import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");
const companiesDir = path.join(dataDir, "companies");
const quotesDir = path.join(dataDir, "quotes");

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeSymbol(value) {
  return normalizeText(value).toUpperCase();
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

async function readJson(filePath) {
  const text = (await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/, "");
  return JSON.parse(text);
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function resolveInputFile(argumentValue) {
  if (normalizeText(argumentValue)) {
    return path.resolve(repoRoot, argumentValue);
  }

  const entries = await fs.readdir(dataDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile() && /^eod_stocks_.*\.json$/i.test(entry.name))
    .map((entry) => path.join(dataDir, entry.name));

  if (!candidates.length) {
    throw new Error("Keine eingecheckte EOD-Datei im data-Ordner gefunden.");
  }

  const stats = await Promise.all(candidates.map(async (candidate) => ({
    filePath: candidate,
    stat: await fs.stat(candidate)
  })));

  stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs || a.filePath.localeCompare(b.filePath));
  return stats[0].filePath;
}

function formatTradeDate(timestamp) {
  const numericTimestamp = toNumber(timestamp);
  if (numericTimestamp === null) {
    return "";
  }

  const date = new Date(numericTimestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function deriveChange(closeValue, openValue) {
  const close = toNumber(closeValue);
  const open = toNumber(openValue);
  if (close === null || open === null) {
    return { change: null, changePct: null };
  }

  const change = close - open;
  const changePct = open !== 0 ? (change / open) * 100 : null;
  return { change, changePct };
}

function buildCompanyMap(companyIndex) {
  const companyMap = new Map();

  for (const entry of Array.isArray(companyIndex) ? companyIndex : []) {
    const symbol = normalizeSymbol(entry?.symbol);
    if (!symbol || companyMap.has(symbol)) {
      continue;
    }

    companyMap.set(symbol, {
      symbol,
      file: normalizeText(entry?.file) || `${symbol}.json`,
      companyName: normalizeText(entry?.companyName) || symbol,
      currency: normalizeText(entry?.currency).toUpperCase(),
      exchange: normalizeText(entry?.exchange),
      exchangeFullName: normalizeText(entry?.exchangeFullName),
      marketCap: toNumber(entry?.marketCap)
    });
  }

  return companyMap;
}

async function main() {
  const inputFile = await resolveInputFile(process.argv[2]);
  const eodPayload = await readJson(inputFile);
  const companiesIndex = await readJson(path.join(companiesDir, "index.json"));
  const companyMap = buildCompanyMap(companiesIndex);

  const results = Array.isArray(eodPayload?.results) ? eodPayload.results : [];
  const skipped = {
    missingSymbol: 0,
    invalidRecord: 0,
    noMasterData: 0
  };

  const matchedItems = [];
  const sourceFileName = path.basename(inputFile);

  for (const record of results) {
    const symbol = normalizeSymbol(record?.T);
    if (!symbol) {
      skipped.missingSymbol += 1;
      continue;
    }

    const company = companyMap.get(symbol);
    if (!company) {
      skipped.noMasterData += 1;
      continue;
    }

    const open = toNumber(record?.o);
    const close = toNumber(record?.c);
    const high = toNumber(record?.h);
    const low = toNumber(record?.l);
    const volume = toNumber(record?.v);
    const vwap = toNumber(record?.vw);
    const tradesCount = toNumber(record?.n);
    const tradeTimestamp = toNumber(record?.t);

    if (open === null && close === null && high === null && low === null && volume === null && tradeTimestamp === null) {
      skipped.invalidRecord += 1;
      continue;
    }

    const { change, changePct } = deriveChange(close, open);
    const tradeDate = formatTradeDate(tradeTimestamp);

    matchedItems.push({
      symbol,
      companyName: company.companyName,
      companyFile: company.file,
      sourceFile: sourceFileName,
      currency: company.currency,
      exchange: company.exchange,
      exchangeFullName: company.exchangeFullName,
      marketCap: company.marketCap,
      open,
      close,
      high,
      low,
      volume,
      vwap,
      tradesCount,
      tradeTimestamp,
      tradeDate,
      change,
      changePct
    });
  }

  matchedItems.sort((a, b) => {
    const marketCapDiff = (b.marketCap ?? -1) - (a.marketCap ?? -1);
    if (marketCapDiff !== 0) {
      return marketCapDiff;
    }
    return a.companyName.localeCompare(b.companyName, "de");
  });

  const generatedAt = new Date().toISOString();
  const updatedAt = matchedItems[0]?.tradeDate || formatTradeDate(Date.now());

  const companyMarketPayload = {
    generatedAt,
    updatedAt,
    source: {
      file: sourceFileName,
      adjusted: eodPayload?.adjusted === true,
      queryCount: toNumber(eodPayload?.queryCount),
      resultsCount: toNumber(eodPayload?.resultsCount)
    },
    matchedCount: matchedItems.length,
    skipped,
    items: matchedItems
  };

  const quotesPayload = {
    updatedAt,
    source: `Gematchte EOD-Datei ${sourceFileName}`,
    itemCount: matchedItems.length,
    items: matchedItems.map((item) => ({
      name: item.companyName,
      symbol: item.symbol,
      market: item.exchangeFullName || item.exchange,
      currency: item.currency,
      open: item.open,
      close: item.close,
      high: item.high,
      low: item.low,
      volume: item.volume,
      tradeDate: item.tradeDate,
      tradeTimestamp: item.tradeTimestamp,
      change: item.change,
      changePct: item.changePct
    }))
  };

  await writeJson(path.join(dataDir, "company-market-data.json"), companyMarketPayload);
  await writeJson(path.join(quotesDir, "aktien.json"), quotesPayload);

  const summary = {
    inputFile: sourceFileName,
    matchedCount: matchedItems.length,
    skipped,
    outputFiles: [
      "data/company-market-data.json",
      "data/quotes/aktien.json"
    ]
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
