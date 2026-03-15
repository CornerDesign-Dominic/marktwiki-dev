# MarktWiki

MarktWiki ist ein statisches Webprojekt fuer Wirtschafts-, Markt- und Finanzinhalte. Das Repository enthaelt nicht nur das Wiki, sondern auch mehrere aktuell gepflegte Markt-, Kurs-, Detail- und Tool-Bereiche auf Basis von HTML, CSS, Vanilla JavaScript und statischen JSON-Daten.

## Projektbereiche

- `index.html`: Startseite des Gesamtprojekts
- `wiki/`: dateibasierte Wiki-Struktur mit Kategorien, Unterkategorien und Fachartikeln
- `content/wiki/`: Markdown-Quellen fuer neue Wiki-Artikel im einfachen Autorenformat
- `maerkte.html`, `aktien.html`, `indizes.html`, `wechselkurse.html`, `rohstoffe.html`, `krypto.html`, `etfs.html`: aktuelle Marktbereiche auf Root-Ebene
- `kurse.html` plus `kurse-*.html`: eigener Kursbereich mit kompakten Uebersichten
- `pages/`: aktuelle Detailseiten fuer Unternehmen, Waehrungen und weitere Marktobjekte
- `tools/`: statische Rechner und lokale QA-Skripte
- `data/`: Inhalts-, Markt- und Stammdaten
- `scripts/`: Datenaufbereitung und Aktualisierung statischer Quellen
- `docs/`: technische Zusatzdokumentation fuer einzelne Daten- oder Prozessbereiche

## Wichtige Strukturhinweise

- Das Wiki ist ein Teil des Projekts, aber nicht mehr die einzige Referenz fuer neue Arbeiten.
- Fuer aktuelle Navigations-, Layout- und Bereichslogik sind vor allem `assets/js/layout.js`, `assets/css/style.css`, die Root-Seiten sowie die datengetriebenen Listen- und Detailseiten unter `pages/` relevant.
- Aeltere JSON-basierte Themenpfade wie `themen.html`, `pages/thema.html` und `data/themen.json` existieren weiterhin, bilden aber nicht allein den aktuellen Standard fuer neue Seiten oder neue Dokumentationsregeln.

## Welche Regeln bei Aenderungen gelten

- `PROJECT_RULES.md`: projektweite technische, strukturelle und UI-/UX-Leitplanken
- `ARTICLE_RULES.md`: verbindliche Regeln fuer Wiki- und Artikelinhalte, inklusive Ablage, Slugs, Abschnittslogik und interne Verlinkung
- `CHANGELOG.md`: Historie des Projekts; bestehende Eintraege nicht umschreiben, neue relevante Aenderungen oben ergaenzen

## Wichtige Referenzen im aktuellen Projekt

- Globale Navigation, Header/Footer, Suche und Theme-Logik: `assets/js/layout.js`
- Gemeinsame Styles, Karten, Listen, Detail-Layouts und Artikel-TOC: `assets/css/style.css`
- Datengetriebene Themen- und Unternehmenslogik: `assets/js/main.js`
- Marktlisten und Marktdetailseiten: `assets/js/markets.js`
- Wiki-Referenzartikel und Artikeltemplate: `wiki/inventar.html`, `wiki/_template.html`
- Markdown-basierter Wiki-Build: `scripts/build-wiki.js`, `data/wiki-structure.json`, `.github/workflows/build-wiki.yml`

## Daten und QA

- Unternehmens- und Marktdaten liegen unter `data/companies/`, `data/markets/`, `data/quotes/`, `data/exchange-rates.json` und `data/company-market-data.json`.
- Markdown-Wiki-Artikel werden aus `content/wiki/*.md` in fertige Seiten unter `wiki/` sowie in `data/wiki-structure.json` ueberfuehrt.
- QA-Skripte liegen unter `tools/qa/`.
- Zusatzdoku fuer den taeglichen Aktien-EOD-Prozess liegt in `docs/daily-stock-eod.md`.

## Wiki-Autoren-Workflow

Neue Wiki-Artikel werden nicht mehr direkt als HTML angelegt, sondern als einfache Markdown-Dateien unter `content/wiki/`.

Bevorzugtes Autorenformat:

```md
Titel: Inventar
Slug: inventar
Kategorie: Rechnungswesen
Unterkategorie: Laufende Buchfuehrung
Kurzbeschreibung: Inventar als strukturierte Bestandsaufnahme eines Unternehmens.

Lead: Das Inventar ist eine detaillierte Aufstellung aller Vermoegenswerte und Schulden eines Unternehmens.

Definition: Inventar ist die vollstaendige Aufstellung aller Vermoegensgegenstaende und Schulden eines Unternehmens zu einem bestimmten Zeitpunkt.

Erklaerung: Das Inventar entsteht aus der Inventur und bildet eine Grundlage fuer die Bilanz.

Einordnung: Inventar gehoert zum Rechnungswesen und ist Teil des Jahresabschlusses.

Beispiel: Ein Handelsunternehmen listet zum Jahresende Warenbestaende, Forderungen und Verbindlichkeiten auf.

Praxisbezug: Unternehmen nutzen Inventare zur Dokumentation, Kontrolle und Vorbereitung des Abschlusses.

Abgrenzung: Das Inventar ist ausfuehrlicher als die Bilanz und zeigt Einzelwerte statt Verdichtungen.

Zusammenfassung: Das Inventar dokumentiert detailliert Vermoegen und Schulden und bildet eine wichtige Grundlage fuer die Bilanz.

Verwendete Begriffe:
- Inventur
- Bilanz
- Jahresabschluss

Aehnliche Themen:
- inventur
- bilanz

Quellen:
- HGB §240
```

Autoren muessen dabei kein HTML schreiben, keine Sections bauen und keine internen Links manuell setzen. Der Generator uebernimmt:

- das Befuellen des bestehenden Artikel-Templates
- die Card-Struktur des Wiki-Artikels
- H2-IDs fuer TOC und Navigation
- interne Listen fuer Verwendete Begriffe und Aehnliche Themen
- die Ableitung der Wiki-Struktur aus Kategorie, Unterkategorie, Titel, Slug und Kurzbeschreibung

Der bereits vorhandene Frontmatter-Workflow bleibt als kompatibler Fallback weiter unterstuetzt.

Ablauf:

- Artikel als `content/wiki/<slug>.md` schreiben
- Datei ins Repository pushen
- GitHub Actions startet automatisch den Wiki-Build
- `scripts/build-wiki.js` erzeugt daraus `wiki/<slug>.html` und `data/wiki-structure.json`
- die bestehende Website kann danach wie gewohnt gebaut und deployed werden

Bestehende HTML-Artikel bleiben gueltig. Der Generator ueberschreibt nur Seiten, die bereits zuvor von `scripts/build-wiki.js` erzeugt wurden.
