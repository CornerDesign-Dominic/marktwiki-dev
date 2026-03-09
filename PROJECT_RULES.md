# MarktWiki Projektregeln

---

# 1 Projektziel

## 1.1 Grundidee

MarktWiki ist ein statisches Wirtschaftswiki.

Ziel:

- wirtschaftliche Themen verständlich erklären
- strukturiertes Wissen zu Wirtschaft, Unternehmen und Finanzen bereitstellen
- praktische Werkzeuge anbieten
- später Vergleichsseiten integrieren
- langfristig Affiliate Monetarisierung ermöglichen

## 1.2 Projektanforderungen

Die Seite soll langfristig:

- leicht wartbar
- leicht erweiterbar
- statisch betreibbar
- klar strukturiert
- inhaltlich konsistent

bleiben.

Der **Kern des Projekts ist das Wiki**.

Werkzeuge und Vergleichsseiten sind Ergänzungen, aber nicht der Fokus.

---

# 2 Technologie Regeln

## 2.1 Architektur

Die Seite muss vollständig statisch bleiben.

Erlaubt:

- HTML
- CSS
- Vanilla JavaScript

Nicht erlaubt:

- Backend Server
- Node Server im Livebetrieb
- Datenbank
- Framework-Zwang

## 2.2 Hosting

Die Seite muss **GitHub Pages kompatibel** bleiben.

---

# 3 Designprinzipien

## 3.1 Grundprinzip

Das Design von MarktWiki soll:

- ruhig
- sachlich
- modern
- zeitlos
- professionell

sein.

Die Seite soll wirken wie ein **modernes Wirtschaftslexikon**.

## 3.2 Fokus

Die Seite richtet sich an Nutzer, die Informationen suchen.

Deshalb stehen im Vordergrund:

- Lesbarkeit
- Struktur
- Übersichtlichkeit

Zu vermeiden:

- Blogdesign
- Marketing-Landingpages
- visuelle Überladung

---

# 4 Layout und Typografie

## 4.1 Inhaltsbreite

Die maximale Inhaltsbreite beträgt:

1000px

Dies gilt für:

- Wikiartikel
- Inhaltsseiten
- Hauptcontentbereiche

## 4.2 Textlayout

Zeilenabstand:

1.6

Empfohlene Absatzlänge:

2 bis 4 Sätze

Absatzabstand:

mindestens 1em

## 4.3 Überschriften

H1  
Seitentitel

H2  
Hauptabschnitte:

- Definition
- Erklärung
- Beispiel
- Praxisbezug
- Zusammenfassung

H3  
optionale Unterpunkte

Regel:

Überschriften müssen klar sichtbar sein, dürfen aber **nicht überdimensioniert wirken**.

## 4.4 Abstände

Empfohlene Abstände:

zwischen Überschrift und Text  
16px

zwischen Abschnitten  
32px

zwischen größeren Inhaltsblöcken  
48px

---

# 5 Farbpalette

Die Farbpalette ist fest definiert.

Hintergrund  
#0f172a

Sekundärer Hintergrund  
#111827

Contentkarten  
#1f2937

Textfarbe  
#ffffff

Sekundärer Text  
#cbd5e1

Akzentfarbe  
#38bdf8

Linkfarbe  
#7dd3fc

Hoverfarbe  
#0ea5e9

Borderfarbe  
#334155

Neue Farben dürfen **nicht ohne triftigen Grund eingeführt werden**.

---

# 6 UI Elemente

## 6.1 Karten

Karten werden verwendet für:

- Kategorien
- Themenlisten
- Navigationselemente
- verwandte Themen

Kartendesign:

Hintergrund  
#1f2937

Border  
1px solid #334155

Radius  
8px

Padding  
24px

Wikiartikel selbst sollen hauptsächlich aus **Fließtext** bestehen.

## 6.2 Infoboxen

Infoboxen sind optional.

Sie können genutzt werden für:

- Merksätze
- Praxishinweise
- kurze Definitionen
- Abgrenzungen

Infobox Design:

Hintergrund  
#111827

Border  
1px solid #334155

Radius  
8px

Padding  
16px bis 20px

Infoboxen sollen **sparsam eingesetzt werden**.

---

# 7 Bilder

Bilder sind optional.

Wenn Bilder verwendet werden:

- müssen sie inhaltlich sinnvoll sein
- dürfen das Layout nicht dominieren
- sollen die Breite des Contentbereichs nicht überschreiten

Bilder liegen im Ordner:

/assets/img

---

# 8 Wiki Struktur

## 8.1 Hierarchie

Das Wiki folgt einer festen Struktur:

Hauptkategorie  
Unterkategorie  
Thema

Beispiele für Hauptkategorien:

- Buchführung
- Rechnungswesen
- BWL
- VWL
- Logistik
- Recht & Steuern
- Personal
- Finanzierung
- Kapitalmarkt

---

# 9 Standard für Wiki-Themenseiten

## 9.1 Ziel

Themenseiten sind der Kern des Projekts.

Sie müssen:

- einheitlich
- klar strukturiert
- gut lesbar

sein.

## 9.2 Grundlayout

Eine Themenseite besteht aus:

1 Seitenkopf  
2 Hauptartikel  
3 optionale Infoboxen  
4 verwandte Inhalte

Monetarisierung spielt auf Themenseiten vorerst keine Rolle.

---

## 9.3 Seitenkopf

Der Seitenkopf enthält:

- Titel des Themas
- kurze Einleitung
- optional Kategorie / Unterkategorie

Regeln:

- kein großer Hero-Bereich
- keine Marketingoptik
- kompakte Darstellung

---

## 9.4 Hauptartikel

Der Hauptartikel folgt immer dieser Struktur:

1 Titel  
2 Einleitung  
3 Definition  
4 Erklärung  
5 Beispiel  
6 Praxisbezug  
7 Zusammenfassung  

Die Reihenfolge ist verpflichtend.

Der Artikel soll hauptsächlich aus **Fließtext** bestehen.

---

## 9.5 Verwandte Inhalte

Am Ende der Seite können erscheinen:

- verwandte Themen
- Glossarbegriffe
- passende Werkzeuge

Ziel:

Stärkung der internen Navigation.

---

# 10 Inhaltsverwaltung

## 10.1 Wikiartikel (neu)

Neue Wikiartikel werden als eigene HTML-Dateien im Ordner

/wiki

angelegt.

Beispiel:

- /wiki/inventur.html
- /wiki/bilanz.html
- /wiki/deckungsbeitrag.html

Als Startpunkt dient die Vorlage:

- /wiki/_template.html

## 10.2 JSON-Dateien

Die JSON-Dateien bleiben fuer bestehende Datenstrukturen nutzbar:

- /data/themen.json
- /data/begriffe.json

Sie sind fuer neue Wikiartikel jedoch nicht mehr zwingend erforderlich.
---

# 11 Werkzeuge

Werkzeuge liegen im Ordner:

/tools

Beispiele:

- ROI Rechner
- Zinseszins Rechner

Tools laufen ausschließlich im Browser.

---

# 12 SEO Regeln

Jede Seite muss enthalten:

- title
- meta description

Optional später:

- Open Graph Tags
- strukturierte Daten

---

# 13 Nicht erwünscht

Folgendes soll vermieden werden:

- komplexe Frameworks
- Backend Server
- unnötige JavaScript Libraries
- komplizierte Buildprozesse
- unnötige Designänderungen

Das Projekt soll bewusst **leichtgewichtig und verständlich aufgebaut bleiben**.