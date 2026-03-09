# MarktWiki Artikelregeln

## Ziel

MarktWiki-Artikel sind neutral, sachlich, verständlich, fachlich sauber und praxisorientiert.
Sie nutzen keine persönliche Sprache, keine Ich-/Wir-/Du-Form und keine unnötige Ausschmückung.
Sie verzichten sowohl auf künstliche Kürze als auch auf inhaltliche Verwässerung.

## Grundprinzip

Artikel dürfen so lang sein, wie sie es fachlich brauchen.
Sie bleiben dabei klar, auf den Punkt und gut verständlich.

## Standardstruktur

1. Titel
2. Kurzdefinition / Einstieg
3. Definition (nur wenn sinnvoll / vorhanden)
4. Einordnung
5. Erklärung
6. Beispiel (optional)
7. Praxisbezug
8. Abgrenzung (optional)
9. Zusammenfassung
10. Ähnliche Themen (optional)

## Pflicht in der Regel

- Kurzdefinition / Einstieg
- Einordnung
- Erklärung
- Praxisbezug
- Zusammenfassung

## Optional nur bei echtem Mehrwert

- Definition
- Beispiel
- Abgrenzung
- Ähnliche Themen

## Abschnittsbeschreibungen

### Titel
Nur das Thema oder der Begriff.

### Kurzdefinition / Einstieg
2 bis 4 Sätze zu Thema, Einordnung und Relevanz.

### Definition
Nur verwenden, wenn es eine klare fachliche Definition gibt.

### Einordnung
Einordnung in Fachbereich, Zusammenhang und Bedeutung.

### Erklärung
Hauptteil des Artikels, fachlich belastbar und verständlich.

### Beispiel
Nur aufnehmen, wenn es das Verständnis konkret verbessert.

### Praxisbezug
Konkrete Relevanz im Unternehmens-, Lern- oder Arbeitskontext.

### Abgrenzung
Unterschiede zu ähnlichen Begriffen oder typische Missverständnisse.

### Zusammenfassung
Kurze, präzise Verdichtung der Kernaussagen.

### Ähnliche Themen
Am Ende des Artikels nur manuelle interne Links auf passende, vorhandene Inhalte.
Keine leeren oder erfundenen Links.

## Stil

- ruhig
- neutral
- für jeden verständlich
- fachlich belastbar

## Verbindlicher Referenzstandard

Der Artikel `wiki/inventar.html` ist der verbindliche Referenzartikel fuer Struktur und Layout von MarktWiki-Artikeln.

Wichtig:

- `wiki/inventar.html` dient als Standardvorlage und darf bei Vereinheitlichungen nicht als Zielartikel umgebaut werden.
- Neue und bestehende Fachartikel im Ordner `wiki/` muessen sich an diesem Referenzstandard orientieren.

## Verbindliche Abschnittsreihenfolge

Die Reihenfolge ist verbindlich:

1. Titel (H1)
2. Lead / Einleitung
3. Definition
4. Einordnung
5. Erklaerung
6. Beispiel
7. Praxisbezug
8. Abgrenzung
9. Zusammenfassung
10. Aehnliche Themen

## Verbindliche Blockstruktur

Die Abschnitte sind in vier Artikelbloecke zu gruppieren:

- Block 1 (`article-block article-block-foundation`):
  Lead, Definition, Einordnung, Erklaerung
- Block 2 (`article-block article-block-application`):
  Beispiel, Praxisbezug, Abgrenzung
- Block 3 (`article-block article-block-summary`):
  Zusammenfassung
- Block 4 (`article-block article-block-related`):
  Aehnliche Themen

## Definition-Box und Copy-Funktion

Im Abschnitt `Definition` ist folgende Struktur verpflichtend:

```html
<div class="definition-box">
  <p>...</p>
  <button type="button" class="copy-definition" title="Definition kopieren" aria-label="Definition kopieren">Kopieren</button>
</div>
```

Die technische Copy-Funktion wird ueber die globale Artikellogik in `layout.js` bereitgestellt.

## Inhaltsnavigation (TOC)

Wiki-Artikel nutzen eine linke Inhaltsnavigation auf Basis der vorhandenen H2-Anker-IDs.

- Die TOC wird automatisch aus den H2-Abschnitten erzeugt.
- Die TOC erscheint nur bei ausreichend langen Artikeln.
- Positionierung und Sticky-Verhalten werden zentral ueber `style.css` und `layout.js` gesteuert.

## Template-Pflicht

`wiki/_template.html` muss denselben strukturellen Standard abbilden:

- identische Abschnittsreihenfolge
- identische Blockstruktur
- Definition-Box mit Copy-Button-Markup
- gleiche Klassenstruktur wie die Referenzimplementierung
