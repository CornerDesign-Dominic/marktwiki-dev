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

function resolveTradingDate() {
  const explicitDate = normalizeText(process.env.EOD_TRADING_DATE);
  if (explicitDate) {
    return explicitDate;
  }

  return new Date().toISOString().slice(0, 10);
}

function buildRequestUrl() {
  const template = normalizeText(process.env.EOD_API_URL);
  const apiKey = normalizeText(process.env.EOD_API_KEY);
  const tradingDate = resolveTradingDate();

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

function buildRequestHeaders() {
  const headers = {
    "user-agent": "MarktWiki EOD Stock Data Updater"
  };

  const authHeaderName = normalizeText(process.env.EOD_API_AUTH_HEADER);
  const authHeaderValue = normalizeText(process.env.EOD_API_AUTH_VALUE);

  if (authHeaderName && authHeaderValue) {
    headers[authHeaderName] = authHeaderValue;
  }

  return headers;
}

function ensureEodPayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.results)) {
    throw new Error("Die API-Antwort enthaelt keine gueltige EOD-Results-Liste.");
  }

  return payload;
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
  const { url, tradingDate } = buildRequestUrl();

  const response = await fetch(url, {
    headers: buildRequestHeaders()
  });

  if (!response.ok) {
    throw new Error(`EOD-Daten konnten nicht geladen werden (HTTP ${response.status}).`);
  }

  const payload = ensureEodPayload(await response.json());
  await writeJsonAtomically(outputPath, payload);

  console.log(JSON.stringify({
    tradingDate,
    outputPath: path.relative(repoRoot, outputPath).replace(/\\/g, "/"),
    resultsCount: Array.isArray(payload.results) ? payload.results.length : 0
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
