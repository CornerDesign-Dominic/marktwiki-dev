# QA-Checks

Lokale Qualitätsprüfungen (ohne externe Abhängigkeiten):

- Datenvalidierung: `node tools/qa/validate-data.js`
- Broken-Link-Check: `node tools/qa/check-links.js`
- Alles zusammen: `node tools/qa/run-checks.js`

Die Skripte geben verständliche Fehler in der Konsole aus und liefern Exit-Code `1`, wenn Fehler gefunden werden.