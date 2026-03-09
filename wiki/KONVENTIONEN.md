# Wiki-Konventionen

## 1. Ablage

Neue Artikel koennen direkt unter `/wiki/` als eigenstaendige HTML-Dateien angelegt werden.

Beispiele:

- `/wiki/inventur.html`
- `/wiki/bilanz.html`
- `/wiki/deckungsbeitrag.html`

Artikel liegen direkt im Ordner `/wiki/`; Kategorie-Unterordner werden nicht genutzt.

## 2. Dateinamen und Slugs

- Dateiname = URL-Slug
- nur Kleinbuchstaben
- Woerter mit Bindestrich trennen
- keine Leerzeichen, Umlaute oder Sonderzeichen in Dateinamen

## 3. Interne Links

- Von Uebersichtsseiten zu Artikeln mit relativen Links
- Von Artikeln zur Wiki-Uebersicht: `./index.html`
- Interne Verlinkung relativ, z. B. `./anleihe.html` oder `./abschreibung.html`

## 4. Feste Artikelstruktur

Jeder neue Artikel muss diese Reihenfolge enthalten:

1. Titel
2. Einleitung
3. Definition
4. Erklaerung
5. Beispiel
6. Praxisbezug
7. Zusammenfassung

## 5. Vorlage fuer neue Artikel

1. Aus `/wiki/_template.html` kopieren
2. Als neue Datei unter `/wiki/` speichern
3. Dateinamen als finalen Slug setzen
4. Relevante Uebersichtsseite verlinken

## 6. Hinweis zu JSON-Daten

Bestehende JSON-Daten bleiben vorerst bestehen und koennen fuer bestehende Logik weiter genutzt werden.
Neue Wikiartikel muessen jedoch nicht mehr zwingend in `/data/themen.json` angelegt werden.

