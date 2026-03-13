import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
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

function resolveTradingDate() {
  const explicitDate = normalizeText(process.env.EOD_TRADING_DATE);
  if (explicitDate) {
    return {
      value: explicitDate,
      isExplicit: true
    };
  }

  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return {
    value: date.toISOString().slice(0, 10),
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
  const attemptedDates = [tradingDateConfig.value];

  if (!tradingDateConfig.isExplicit) {
    for (let offset = 1; offset <= 4; offset += 1) {
      attemptedDates.push(shiftDateString(tradingDateConfig.value, -offset));
    }
  }

  let payload = null;
  let selectedTradingDate = "";
  let lastErrorMessage = "";

  for (const attemptedDate of attemptedDates) {
    const { url } = buildRequestUrl(attemptedDate);
    console.log(`Requesting Massive EOD data: ${redactUrl(url)}`);
    console.log("Authentication mode: query parameter apiKey");
    console.log(`Trying trading date: ${attemptedDate}`);

    const response = await fetch(url, {
      headers: {
        "user-agent": "MarktWiki EOD Stock Data Updater"
      }
    });

    if (response.ok) {
      const nextPayload = ensureEodPayload(await response.json());
      if (hasUsableResults(nextPayload)) {
        payload = nextPayload;
        selectedTradingDate = attemptedDate;
        break;
      }

      lastErrorMessage = `Massive lieferte fuer ${attemptedDate} keine verwertbaren Results.`;
      console.warn(lastErrorMessage);
      if (tradingDateConfig.isExplicit) {
        throw new Error(lastErrorMessage);
      }
      continue;
    }

    const errorBody = await readErrorBody(response);
    const baseMessage = `EOD-Daten konnten nicht geladen werden (HTTP ${response.status}) fuer ${attemptedDate}.`;
    lastErrorMessage = `${baseMessage}${errorBody ? ` Antwort: ${errorBody}` : ""}`;

    if (response.status === 401) {
      throw new Error(`${lastErrorMessage} Massive-Authentifizierung ist fehlgeschlagen.`);
    }

    if (response.status === 403) {
      console.warn(`${lastErrorMessage} Massive blockiert Abrufe vor EOD oder fuer ungueltige Handelstage.`);
      if (tradingDateConfig.isExplicit) {
        throw new Error(lastErrorMessage);
      }
      continue;
    }

    if (response.status === 404) {
      console.warn(`${lastErrorMessage} Wahrscheinlich kein Handelstag oder keine Daten verfuegbar.`);
      if (tradingDateConfig.isExplicit) {
        throw new Error(lastErrorMessage);
      }
      continue;
    }

    throw new Error(lastErrorMessage);
  }

  if (!payload) {
    throw new Error(lastErrorMessage || "Massive-EOD-Daten konnten fuer keinen der geprueften Handelstage geladen werden.");
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
