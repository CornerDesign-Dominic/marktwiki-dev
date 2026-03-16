import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const US_MARKET_HOLIDAYS = [
  "2026-01-01", // New Year's Day
  "2026-01-19", // Martin Luther King Jr. Day
  "2026-02-16", // Presidents Day
  "2026-04-03", // Good Friday
  "2026-05-25", // Memorial Day
  "2026-07-03", // Independence Day observed
  "2026-09-07", // Labor Day
  "2026-11-26", // Thanksgiving
  "2026-12-25" // Christmas
];

function normalizeText(value) {
  return String(value ?? "").trim();
}

function resolveRepoPath(filePath) {
  return path.resolve(repoRoot, normalizeText(filePath));
}

function getDatePartsInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Datum fuer Zeitzone ${timeZone} konnte nicht aufgeloest werden.`);
  }

  return { year, month, day };
}

function createUtcDateFromDateText(dateText) {
  return new Date(`${dateText}T00:00:00Z`);
}

function formatUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

function getUtcWeekday(date) {
  return date.getUTCDay();
}

function shiftDateString(dateText, days) {
  const date = createUtcDateFromDateText(dateText);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDate(date);
}

function isWeekend(dateText) {
  const weekday = getUtcWeekday(createUtcDateFromDateText(dateText));
  return weekday === 0 || weekday === 6;
}

function isUsMarketHoliday(dateText) {
  return US_MARKET_HOLIDAYS.includes(dateText);
}

function findLatestUsTradingDay(dateText) {
  let candidateDate = dateText;

  while (isWeekend(candidateDate) || isUsMarketHoliday(candidateDate)) {
    candidateDate = shiftDateString(candidateDate, -1);
  }

  return candidateDate;
}

function getPreviousUsTradingDate(dateText) {
  const date = createUtcDateFromDateText(dateText);
  const weekday = getUtcWeekday(date);

  if (weekday === 1) {
    return findLatestUsTradingDay(shiftDateString(dateText, -3));
  }

  if (weekday === 0) {
    return findLatestUsTradingDay(shiftDateString(dateText, -2));
  }

  if (weekday === 6) {
    return findLatestUsTradingDay(shiftDateString(dateText, -1));
  }

  return findLatestUsTradingDay(shiftDateString(dateText, -1));
}

function resolveTradingDate() {
  const explicitDate = normalizeText(process.env.EOD_TRADING_DATE);
  if (explicitDate) {
    return {
      value: findLatestUsTradingDay(explicitDate),
      isExplicit: true
    };
  }

  const currentDateParts = getDatePartsInTimeZone(new Date(), "America/New_York");
  const currentDateInNewYork = `${currentDateParts.year}-${currentDateParts.month}-${currentDateParts.day}`;

  return {
    value: getPreviousUsTradingDate(currentDateInNewYork),
    isExplicit: false
  };
}

function buildRequestUrl(tradingDate) {
  const template = normalizeText(process.env.EOD_API_URL);
  const apiKey = normalizeText(process.env.EOD_API_KEY);

  if (!template) {
    throw new Error("EOD_API_URL ist nicht gesetzt.");
  }

  let url = template.replaceAll("{date}", encodeURIComponent(tradingDate));
  url = url.replaceAll("{API_KEY}", encodeURIComponent(apiKey));

  if (url.includes("{API_KEY}")) {
    throw new Error("EOD_API_URL enthaelt weiterhin {API_KEY}; EOD_API_KEY fehlt vermutlich.");
  }

  if (url.includes("{date}")) {
    throw new Error("EOD_API_URL enthaelt weiterhin {date}; die URL-Vorlage ist unvollstaendig.");
  }

  return { url, tradingDate };
}

function ensureEodPayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.results)) {
    throw new Error("Die API-Antwort enthaelt keine gueltige EOD-Results-Liste.");
  }

  return payload;
}

function hasUsableResults(payload) {
  return Array.isArray(payload?.results) && payload.results.length > 0;
}

function redactUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.searchParams.has("apiKey")) {
      parsed.searchParams.set("apiKey", "***");
    }
    return parsed.toString();
  } catch (_) {
    return rawUrl.replace(/(apiKey=)[^&]+/i, "$1***");
  }
}

async function readErrorBody(response) {
  try {
    const contentType = String(response.headers.get("content-type") || "");
    if (contentType.includes("application/json")) {
      return JSON.stringify(await response.json());
    }

    return (await response.text()).slice(0, 500);
  } catch (_) {
    return "";
  }
}

async function writeJsonAtomically(filePath, payload) {
  const directory = path.dirname(filePath);
  const tempPath = `${filePath}.tmp`;
  const content = `${JSON.stringify(payload, null, 2)}\n`;

  await mkdir(directory, { recursive: true });
  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, filePath);
}

async function main() {
  const outputPath = resolveRepoPath(process.env.EOD_OUTPUT_PATH || "data/eod_stocks_latest.json");
  const tradingDateConfig = resolveTradingDate();
  const selectedTradingDate = tradingDateConfig.value;
  const { url } = buildRequestUrl(selectedTradingDate);

  console.log(`Requesting Massive EOD data: ${redactUrl(url)}`);
  console.log("Authentication mode: query parameter apiKey");
  console.log(`Using trading date: ${selectedTradingDate}`);

  if (tradingDateConfig.isExplicit) {
    console.log("Trading date source: EOD_TRADING_DATE (adjusted to previous US trading day if needed)");
  } else {
    console.log("Trading date source: current America/New_York date adjusted to previous US trading day");
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "MarktWiki EOD Stock Data Updater"
    }
  });

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    const baseMessage = `EOD-Daten konnten nicht geladen werden (HTTP ${response.status}) fuer ${selectedTradingDate}.`;
    const errorMessage = `${baseMessage}${errorBody ? ` Antwort: ${errorBody}` : ""}`;

    if (response.status === 401) {
      throw new Error(`${errorMessage} Massive-Authentifizierung ist fehlgeschlagen.`);
    }

    if (response.status === 403) {
      console.warn(`${errorMessage} Massive blockiert Abrufe vor EOD oder fuer ungueltige Handelstage.`);
      return;
    }

    if (response.status === 404) {
      console.warn(`${errorMessage} Wahrscheinlich kein Handelstag oder keine Daten verfuegbar.`);
      return;
    }

    throw new Error(errorMessage);
  }

  const payload = ensureEodPayload(await response.json());

  if (!hasUsableResults(payload)) {
    console.warn(`Massive lieferte fuer ${selectedTradingDate} keine Results. Workflow wird ohne Fehler beendet.`);
    return;
  }

  const jsonOutput = `${JSON.stringify(payload, null, 2)}\n`;
  let existingContent = null;

  try {
    existingContent = await readFile(outputPath, "utf8");
  } catch (error) {
    if (!error || error.code !== "ENOENT") {
      throw error;
    }
  }

  if (existingContent === jsonOutput) {
    console.log(`Keine Aenderung erforderlich. Stand der Massive-Daten: ${selectedTradingDate}`);
    return;
  }

  await writeJsonAtomically(outputPath, payload);

  console.log(JSON.stringify({
    tradingDate: selectedTradingDate,
    outputPath: path.relative(repoRoot, outputPath).replace(/\\/g, "/"),
    resultsCount: Array.isArray(payload.results) ? payload.results.length : 0
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
