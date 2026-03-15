# MarktWiki Projektregeln

## Zweck der Datei

Diese Datei enthaelt nur projektweite Regeln. Alles, was speziell Schreibstil, Artikelaufbau, Slugs, Wiki-Ablage oder redaktionelle Inhalte betrifft, steht in `ARTICLE_RULES.md`.

## 1. Projektverstaendnis

- MarktWiki ist ein statisches Gesamtprojekt mit mehreren Bereichen: Wiki, Maerkte, Kurse, Detailseiten, Tools, Daten- und QA-Skripten.
- Das Wiki ist wichtig, aber nicht mehr die einzige oder automatisch massgebliche Referenz fuer neue Arbeiten.
- Neue Dokumentation und neue Umsetzungen muessen den tatsaechlichen aktuellen Projektstand abbilden, nicht einen frueheren Wiki-zentrierten Zustand.

## 2. Technische Leitplanken

- Die produktive Seite bleibt vollstaendig statisch.
- Erlaubt sind HTML, CSS, Vanilla JavaScript und statische JSON-Daten.
- Build-Zwang, Laufzeit-Backend, Datenbank oder Framework-Migrationen sind ohne klaren Projektentscheid nicht gewuenscht.
- Hosting muss mit einem statischen Deployment, insbesondere GitHub Pages, vereinbar bleiben.

## 3. Strukturprinzipien

- Bestehende Verzeichnislogik beibehalten:
  - Root-Ebene fuer zentrale Bereichsseiten
  - `wiki/` fuer dateibasierte Wiki-Seiten
  - `pages/` fuer datengetriebene Detailseiten
  - `tools/` fuer Rechner und QA-Helfer
  - `data/` fuer statische Datenquellen
  - `scripts/` fuer Datenaufbereitung
  - `docs/` fuer technische Zusatzdokumentation
- Neue Inhalte oder Seiten sollen an den passendsten bestehenden Bereich andocken, statt neue Parallelstrukturen einzufuehren.
- Aeltere Reststrukturen duerfen vorhanden bleiben, sollen aber nicht ungeprueft als neuer Standard kopiert werden.

## 4. Referenzhierarchie fuer neue Arbeiten

- Zuerst aktuelle Root-Seiten, `pages/`-Detailseiten, `assets/js/layout.js`, `assets/css/style.css`, `assets/js/main.js` und `assets/js/markets.js` pruefen.
- Bestehende neuere Karten-, Listen-, Filter-, Detail- und Navigationsmuster haben Vorrang vor aelteren Einzelmustern im Wiki.
- Wiki-spezifische Muster gelten nur dort als Referenz, wo es wirklich um Wiki- oder Artikelseiten geht.
- Vor Wiederverwendung alter Templates immer pruefen, ob es im Projekt bereits eine modernere, konsistentere Loesung gibt.

## 5. UI- und UX-Konsistenz

- Neue Seiten sollen sich in Navigation, Abstandssystem, Kartenoptik, Typografie und Interaktionslogik in das bestehende Projekt einfuegen.
- Header, Footer, Suchlogik, Theme-Umschaltung und Hauptnavigation werden zentral ueber `assets/js/layout.js` gesteuert und nicht seitenweise neu erfunden.
- Gemeinsame Komponenten und Klassen aus `assets/css/style.css` sollen bevorzugt wiederverwendet werden.
- Inhaltsverzeichnisse werden wie bei den bestehenden Wiki-Artikelseiten und Detailseiten links an den Hauptcontent angehaengt; sie duerfen nicht innerhalb der Content-Spalte liegen und die nutzbare Content-Breite nicht verkleinern.
- Karten, Listen und Detailbereiche sollen sich an den aktuell genutzten Mustern orientieren, zum Beispiel:
  - `category-link-card` und `article-card-list` fuer Wiki-Uebersichten
  - `topic-card` fuer einfache Einstiegs- oder Tool-Karten
  - `stock-card`, `market-list-card`, `quote-overview-card` fuer datengetriebene Listen
  - `company-detail-*`, `market-detail-*`, `currency-detail-*` fuer aktuelle Detailseiten
- Veraltete oder isolierte Einzelmuster nicht zum neuen Standard erklaeren, nur weil sie zuerst existierten.

## 6. Inhalts- und Datenprinzipien

- Bestehende statische Datenquellen nur erweitern oder umbauen, wenn die reale Seitenlogik sie weiterhin nutzt.
- Bei datengetriebenen Seiten muessen Struktur, Benennung und Felder an die vorhandene Implementierung anschliessen.
- Neue Dokumentation soll klar zwischen aktiv genutzten Pfaden und Legacy-/Uebergangspfaden unterscheiden.

## 7. Dokumentation und Aenderungen

- `README.md` beschreibt das Gesamtprojekt und verweist auf die relevanten Regeldateien.
- `PROJECT_RULES.md` regelt das Projekt allgemein.
- `ARTICLE_RULES.md` ist die einzige zentrale Regelquelle fuer Wiki- und Artikelinhalte.
- Fuer dateibasierte Wiki-Fachartikel unter `wiki/` ist die in `ARTICLE_RULES.md` definierte Card-Struktur verbindlich; `wiki/_template.html` und `wiki/inventar.html` bilden dafuer die operative Referenz.
- `CONTENT_RULES.md` und `KONVENTIONEN.md` bleiben nur als schlanke Verweise bestehen, solange externe oder alte Links auf sie zeigen koennten.
- `CHANGELOG.md` bleibt die Historie; bestehende Eintraege nicht rueckwirkend umformulieren.

## 8. Nicht gewuenscht

- Neue konkurrierende Regeldateien ohne klaren Mehrwert
- Dokumentation, die nur das Wiki beschreibt und andere aktive Projektbereiche ausblendet
- Neue Umsetzungen, die sich blind an veralteten Wiki-Mustern orientieren
- Unnoetige Designabweichungen, wenn es bereits ein aktuelles Projektmuster gibt
