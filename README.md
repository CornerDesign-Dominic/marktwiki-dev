# MarktWiki

MarktWiki ist ein statisches Webprojekt fuer Wirtschafts-, Markt- und Finanzinhalte. Das Repository enthaelt nicht nur das Wiki, sondern auch mehrere aktuell gepflegte Markt-, Kurs-, Detail- und Tool-Bereiche auf Basis von HTML, CSS, Vanilla JavaScript und statischen JSON-Daten.

## Projektbereiche

- `index.html`: Startseite des Gesamtprojekts
- `wiki/`: dateibasierte Wiki-Struktur mit Kategorien, Unterkategorien und Fachartikeln
- `maerkte.html`, `aktien.html`, `indizes.html`, `wechselkurse.html`, `rohstoffe.html`, `krypto.html`, `etfs.html`: aktuelle Marktbereiche auf Root-Ebene
- `kurse.html` plus `kurse-*.html`: eigener Kursbereich mit kompakten Uebersichten
- `pages/`: aktuelle Detailseiten fuer Unternehmen, Waehrungen und weitere Marktobjekte
- `tools/`: statische Rechner und lokale QA-Skripte
- `data/`: Inhalts-, Markt- und Stammdaten
- `scripts/`: Datenaufbereitung und Aktualisierung statischer Quellen
- `docs/`: technische Zusatzdokumentation fuer einzelne Daten- oder Prozessbereiche

## Wichtige Strukturhinweise

- Das Wiki ist ein Teil des Projekts, aber nicht mehr die einzige Referenz fuer neue Arbeiten.
- Fuer aktuelle Navigations-, Layout- und Bereichslogik sind vor allem `layout.js`, `style.css`, die Root-Seiten sowie die datengetriebenen Listen- und Detailseiten unter `pages/` relevant.
- Aeltere JSON-basierte Themenpfade wie `themen.html`, `pages/thema.html` und `data/themen.json` existieren weiterhin, bilden aber nicht allein den aktuellen Standard fuer neue Seiten oder neue Dokumentationsregeln.

## Welche Regeln bei Aenderungen gelten

- `PROJECT_RULES.md`: projektweite technische, strukturelle und UI-/UX-Leitplanken
- `ARTICLE_RULES.md`: verbindliche Regeln fuer Wiki- und Artikelinhalte, inklusive Ablage, Slugs, Abschnittslogik und interne Verlinkung
- `CHANGELOG.md`: Historie des Projekts; bestehende Eintraege nicht umschreiben, neue relevante Aenderungen oben ergaenzen

## Wichtige Referenzen im aktuellen Projekt

- Globale Navigation, Header/Footer, Suche und Theme-Logik: `layout.js`
- Gemeinsame Styles, Karten, Listen, Detail-Layouts und Artikel-TOC: `style.css`
- Datengetriebene Themen- und Unternehmenslogik: `main.js`
- Marktlisten und Marktdetailseiten: `markets.js`
- Wiki-Referenzartikel und Artikeltemplate: `wiki/inventar.html`, `wiki/_template.html`

## Daten und QA

- Unternehmens- und Marktdaten liegen unter `data/companies/`, `data/markets/`, `data/quotes/`, `data/exchange-rates.json` und `data/company-market-data.json`.
- QA-Skripte liegen unter `tools/qa/`.
- Zusatzdoku fuer den taeglichen Aktien-EOD-Prozess liegt in `docs/daily-stock-eod.md`.
