import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ECB_DAILY_RATES_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "data", "exchange-rates.json");

function extractAttributes(tagText) {
  const attributes = {};
  const attributePattern = /([A-Za-z_:][\w:.-]*)=(["'])(.*?)\2/g;
  let match = attributePattern.exec(tagText);

  while (match) {
    attributes[match[1]] = match[3];
    match = attributePattern.exec(tagText);
  }

  return attributes;
}

function parseEcbXml(xmlText) {
  if (typeof xmlText !== "string" || !xmlText.trim()) {
    throw new Error("ECB-Antwort ist leer oder ungueltig.");
  }

  const timeMatch = xmlText.match(/<Cube\b[^>]*\btime=(["'])(\d{4}-\d{2}-\d{2})\1[^>]*>/i);
  if (!timeMatch) {
    throw new Error("ECB-Datum konnte in der XML-Antwort nicht gefunden werden.");
  }

  const updatedAt = timeMatch[2];
  const rates = {};
  const ratePattern = /<Cube\b[^>]*\bcurrency=(["'])([A-Z]{3})\1[^>]*\brate=(["'])([^"']+)\3[^>]*\/?>/g;
  let match = ratePattern.exec(xmlText);

  while (match) {
    const attributes = extractAttributes(match[0]);
    const currency = String(attributes.currency || "").toUpperCase();
    const rate = Number.parseFloat(String(attributes.rate || ""));

    if (!currency) {
      match = ratePattern.exec(xmlText);
      continue;
    }

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`ECB-Kurs fuer ${currency} ist ungueltig.`);
    }

    rates[currency] = rate;
    match = ratePattern.exec(xmlText);
  }

  if (!Object.keys(rates).length) {
    throw new Error("In der ECB-XML wurden keine Wechselkurse gefunden.");
  }

  if (!rates.USD) {
    throw new Error("ECB-Daten enthalten keinen USD-Kurs; das Frontend benoetigt USD als Anker.");
  }

  const gbpRate = rates.GBP;
  if (Number.isFinite(gbpRate) && gbpRate > 0) {
    // Bestehende Unternehmensdaten nutzen GBp/GBX fuer UK-Pence-Notierungen.
    rates.GBX = Number.parseFloat((gbpRate * 100).toFixed(6));
  }

  return {
    base: "EUR",
    updatedAt,
    source: "ECB",
    rates: Object.fromEntries(Object.entries(rates).sort(([left], [right]) => left.localeCompare(right)))
  };
}

async function fetchEcbXml() {
  const response = await fetch(ECB_DAILY_RATES_URL, {
    headers: {
      "user-agent": "MarktWiki ECB Exchange Rate Updater"
    }
  });

  if (!response.ok) {
    throw new Error(`ECB-Daten konnten nicht geladen werden (HTTP ${response.status}).`);
  }

  return response.text();
}

async function writeJsonAtomically(filePath, content) {
  const targetDirectory = path.dirname(filePath);
  const tempPath = `${filePath}.tmp`;

  await mkdir(targetDirectory, { recursive: true });
  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, filePath);
}

async function main() {
  let xmlText;
  let payload;

  try {
    xmlText = await fetchEcbXml();
    payload = parseEcbXml(xmlText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`ECB-Wechselkurse konnten nicht verarbeitet werden: ${message}`);
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
    console.log(`Keine Aenderung erforderlich. Stand der ECB-Daten: ${payload.updatedAt}`);
    return;
  }

  await writeJsonAtomically(outputPath, jsonOutput);
  console.log(`Wechselkurse aktualisiert. Stand der ECB-Daten: ${payload.updatedAt}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
