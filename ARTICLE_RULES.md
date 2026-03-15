# MarktWiki Artikelregeln

## Zweck der Datei

Diese Datei ist die zentrale Regelquelle fuer Wiki- und Artikelinhalte. Sie fasst die bisherigen Inhalte aus `ARTICLE_RULES.md`, `CONTENT_RULES.md` und `KONVENTIONEN.md` zusammen.

## 1. Geltungsbereich

- Gilt fuer neue und ueberarbeitete Fachartikel im Wiki sowie fuer redaktionelle Artikelinhalte in vergleichbaren Projektbereichen.
- Gilt nicht fuer rein technische Seiten, Rechtstexte, Tool-Formulare oder datengetriebene Markt-/Unternehmenslisten ohne klassischen Artikelcharakter.

## 2. Ziel und Zielgruppe

- Artikel sollen wirtschaftliche Themen neutral, fachlich sauber, verstaendlich und praxisnah erklaeren.
- Zielgruppen sind vor allem Einsteiger, Studierende, Auszubildende, Gruender und allgemein wirtschaftlich interessierte Leser.
- Inhalte muessen ohne grosses Vorwissen nachvollziehbar sein; Fachbegriffe sind erlaubt, aber zu erklaeren.

## 3. Stil und Ton

- sachlich
- ruhig
- neutral
- professionell
- gut verstaendlich

Nicht verwenden:

- Ich-/Wir-/Du-Ansprache
- Werbesprache oder Marketing-Ton
- persoenliche Meinungen
- unerklaerte Fachspruenge
- unnoetige Ausschmueckung

## 4. Inhaltliche Grundsaetze

- Artikel duerfen so lang sein, wie sie es fachlich brauchen.
- Wichtiger als Wortzahl sind Klarheit, fachliche Belastbarkeit und saubere Struktur.
- Realistische Beispiele und klare Praxisbezuege sind erwuenscht, wenn sie das Verstaendnis verbessern.
- Verwandte Begriffe sollen sauber abgegrenzt werden, wenn Verwechslungsgefahr besteht.
- Keine erfundenen Fakten, leeren Platzhalter oder vorgetaeuschten Weiterfuehrungen.

## 5. Verbindliche Standardstruktur

Die Standardreihenfolge fuer Wiki-Fachartikel lautet:

1. Titel
2. Kurzdefinition / Einstieg
3. Definition
4. Erklaerung
5. Einordnung
6. Beispiel
7. Abgrenzung
8. Praxisbezug
9. Zusammenfassung
10. Verwendete Begriffe
11. Aehnliche Themen
12. Verwendete Quellen

## 6. Was ist Pflicht, was optional

In der Regel verpflichtend:

- Kurzdefinition / Einstieg
- Einordnung
- Erklaerung
- Praxisbezug
- Zusammenfassung

Optional bei echtem Mehrwert:

- Definition
- Beispiel
- Abgrenzung
- Verwendete Begriffe
- Aehnliche Themen
- Verwendete Quellen

Wenn ein optionaler Abschnitt fachlich keinen Nutzen bringt, wird er weggelassen statt kuenstlich gefuellt.

## 7. Abschnittsregeln

### Titel

- Nur der Begriff oder das Thema
- kurz, eindeutig und ohne unnoetige Zusaetze

### Kurzdefinition / Einstieg

- 2 bis 4 Saetze
- erklaert Thema, Einordnung und Relevanz

### Definition

- nur verwenden, wenn es eine klare fachliche Definition gibt
- kurz, praezise und fachlich korrekt

### Einordnung

- verortet das Thema in Fachbereich, Zusammenhang und Bedeutung

### Erklaerung

- Hauptteil des Artikels
- erklaert Funktionsweise, Hintergruende, Zusammenhaenge und zentrale Details

### Beispiel

- konkret, realistisch und leicht nachvollziehbar
- bevorzugt nur dann, wenn es das Verstaendnis sichtbar verbessert

### Praxisbezug

- zeigt Relevanz in Unternehmen, Ausbildung, Studium oder beruflicher Anwendung

### Abgrenzung

- klaert Unterschiede zu aehnlichen Begriffen oder typischen Missverstaendnissen

### Zusammenfassung

- kurze Verdichtung der Kernaussagen

### Aehnliche Themen

- nur auf vorhandene, intern passende Seiten verlinken
- keine leeren, toten oder erfundenen Links

### Verwendete Begriffe

- nur anlegen, wenn im Artikel tatsaechlich passende interne Begriffe oder Themen referenziert werden koennen
- nur auf vorhandene interne Seiten verlinken
- keine erfundenen Begriffe oder Platzhalterlisten

### Verwendete Quellen

- nur anlegen, wenn reale Quellen fuer den Artikel vorliegen
- keine Dummy-Quellen, keine Platzhalter und keine erfundenen Angaben
- wenn keine Quellen vorhanden sind, entfaellt die gesamte Quellen-Card

## 8. Struktur- und Layoutstandard fuer Wiki-Artikel

Fuer dateibasierte Wiki-Artikel unter `wiki/` gelten diese technischen Strukturvorgaben:

- Referenzartikel: `wiki/inventar.html`
- Startvorlage: `wiki/_template.html`
- `wiki/inventar.html` ist Referenz fuer Struktur und Layout, aber kein Freibrief, alte Einzelheiten ungeprueft auf andere Projektbereiche zu uebertragen.

Verbindlich fuer den Wiki-Artikelstandard:

- H1 als Seitentitel in Card 1
- Lead direkt unter dem Titel in Card 1
- H2-Abschnitte in der oben definierten Reihenfolge
- verbindliche Card-Struktur:
  - Card 1: Titel + Lead
  - Card 2: Definition + Erklaerung + Einordnung
  - Card 3: Beispiel + Abgrenzung + Praxisbezug
  - Card 4: Zusammenfassung
  - Card 5: Verwendete Begriffe + Aehnliche Themen
  - Card 6: Verwendete Quellen
- technisch ueber `section.card.wiki-article-card` strukturieren
- Cards 5 und 6 sowie einzelne optionale Sektionen nur rendern, wenn dort tatsaechlich Inhalte vorhanden sind
- vorhandene H2-IDs so setzen, dass TOC und Anker sauber funktionieren
- die Struktur muss mit `assets/js/layout.js` und `assets/css/style.css` kompatibel bleiben

## 9. Definition-Box und TOC

Wenn ein Definitionsabschnitt vorhanden ist, soll er mit der bestehenden Definition-Box-Struktur kompatibel bleiben:

```html
<div class="definition-box">
  <p>...</p>
  <button type="button" class="copy-definition" title="Definition kopieren" aria-label="Definition kopieren">Kopieren</button>
</div>
```

- Die Copy-Funktion und automatische Nachruestung werden zentral ueber `assets/js/layout.js` bereitgestellt.
- Die Inhaltsnavigation wird fuer passende Artikel aus den vorhandenen H2-IDs erzeugt.
- Struktur, Klassen und Anker eines Wiki-Artikels muessen deshalb mit `assets/js/layout.js` und `assets/css/style.css` zusammenspielen.

## 10. Ablageort und Dateibenennung

Fuer neue dateibasierte Wiki-Artikel gilt:

- Ablage direkt unter `wiki/`
- keine Unterordner fuer einzelne Kategorien
- Dateiname entspricht dem URL-Slug
- nur Kleinbuchstaben
- Woerter mit Bindestrichen trennen
- keine Leerzeichen, Umlaute oder Sonderzeichen im Dateinamen

Beispiele:

- `wiki/inventur.html`
- `wiki/eigenkapitalquote.html`
- `wiki/schlussbilanzkonto.html`

## 11. Interne Verlinkung

- Von Wiki-Uebersichten und Artikellisten mit relativen Links auf die Artikel verlinken
- Von Artikeln zur Wiki-Uebersicht mit `./index.html` oder zur passenden Kategorie/Unterkategorie verlinken, wenn das der bessere Rueckweg ist
- Innerhalb eines Artikels nur auf real vorhandene, inhaltlich sinnvolle Seiten verlinken
- Verwandte Themen nicht aufblasen; wenige treffende Links sind besser als lange Sammellisten

## 12. Bezug auf aktuelle Projektstandards

- Fuer den Textaufbau eines Wiki-Artikels sind `wiki/inventar.html` und `wiki/_template.html` die massgeblichen Referenzen.
- Fuer allgemeine Projektlogik, Navigation, gemeinsame Karten- und Layoutmuster sind die aktuellen Root-Seiten, `pages/`-Detailseiten sowie `assets/js/layout.js`, `assets/css/style.css`, `assets/js/main.js` und `assets/js/markets.js` wichtiger als aeltere Wiki-Muster.
- Wenn Artikel in andere Projektbereiche eingebettet oder verlinkt werden, muessen Benennung, Rueckwege und Anschluss an die aktuelle Bereichslogik passen.
- Alte JSON-Themenpfade wie `data/themen.json` koennen weiter bestehen, sind aber kein alleiniger Massstab fuer neue dateibasierte Wiki-Artikel.
