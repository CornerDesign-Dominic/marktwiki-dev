import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function normalizeText(value) {
  return String(value ?? "").trim();
}

function resolveRepoPath(filePath) {
  return path.resolve(repoRoot, normalizeText(filePath));
}

function formatDateParts(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date).reduce((accumulator, part) => {
    accumulator[part.type] = part.value;
    return accumulator;
  }, {});
}

function getLatestTradingDateCandidate() {
  const date = new Date();

  for (let attempts = 0; attempts < 7; attempts += 1) {
    const parts = formatDateParts(date);
    if (parts.weekday !== "Sat" && parts.weekday !== "Sun") {
      return `${parts.year}-${parts.month}-${parts.day}`;
    }

    date.setUTCDate(date.getUTCDate() - 1);
  }

  return new Date().toISOString().slice(0, 10);
}

function resolveTradingDate() {
  const explicitDate = normalizeText(process.env.EOD_TRADING_DATE);
  if (explicitDate) {
    return {
      value: explicitDate,
      isExplicit: true
    };
  }

  return {
    value: getLatestTradingDateCandidate(),
    isExplicit: false
  };
}

function shiftDateString(dateText, days) {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
  const attemptedDates = [tradingDateConfig.value];
  if (!tradingDateConfig.isExplicit) {
    for (let offset = 1; offset <= 4; offset += 1) {
      attemptedDates.push(shiftDateString(tradingDateConfig.value, -offset));
    }
  }

  let payload = null;
  let selectedTradingDate = "";
  let lastError = null;

  for (const attemptedDate of attemptedDates) {
    const { url } = buildRequestUrl(attemptedDate);
    console.log(`Requesting Massive EOD data: ${redactUrl(url)}`);
    console.log("Authentication mode: query parameter apiKey");

    const response = await fetch(url, {
      headers: {
        "user-agent": "MarktWiki EOD Stock Data Updater"
      }
    });

    if (response.ok) {
      payload = ensureEodPayload(await response.json());
      selectedTradingDate = attemptedDate;
      break;
    }

    const errorBody = await readErrorBody(response);
    const baseMessage = `EOD-Daten konnten nicht geladen werden (HTTP ${response.status}) fuer ${attemptedDate}.`;
    lastError = `${baseMessage}${errorBody ? ` Antwort: ${errorBody}` : ""}`;

    if (response.status === 401 || response.status === 403) {
      throw new Error(`${lastError} Massive-Authentifizierung ist fehlgeschlagen.`);
    }

    if (response.status === 404 && !tradingDateConfig.isExplicit) {
      console.warn(`${baseMessage} Fallback auf vorherigen Handelstag wird versucht.`);
      continue;
    }

    throw new Error(lastError);
  }

  if (!payload) {
    throw new Error(lastError || "Massive-EOD-Daten konnten fuer keinen der geprueften Handelstage geladen werden.");
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
