# Daily Stock EOD

## Zentrale Dateien

- Zentrale taegliche Marktdaten fuer Unternehmensseiten: `data/company-market-data.json`
- Datenbasis fuer `kurse-aktien`: `data/quotes/aktien.json`
- Stammdaten bleiben in `data/companies/...`

## Verarbeitung

1. API-Abruf: `scripts/fetch-eod-stock-data.mjs`
2. Matching gegen `data/companies/index.json`: `scripts/process-eod-stock-data.mjs`
3. Ausgabe nur in:
   - `data/company-market-data.json`
   - `data/quotes/aktien.json`

## GitHub Action

- Workflow-Datei: `.github/workflows/update-daily-stock-eod.yml`
- GitHub Secret fuer den API-Key: `MASSIVE_API_KEY`
- Massive wird per Query-Parameter `apiKey=...` an den grouped-daily-aggregates-Endpoint angebunden.
- API-Endpunkt-Konfiguration: `EOD_API_URL` im Workflow
- Quell-/Zieldatei fuer den taeglichen Download: `EOD_SOURCE_FILE` und `EOD_OUTPUT_PATH` im Workflow
