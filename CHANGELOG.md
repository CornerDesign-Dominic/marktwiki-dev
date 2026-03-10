# MarktWiki Changelog

## Version 0.45

- Aktienseite um eine eigene lokale Unternehmenssuche erweitert (unabhaengig von der globalen Header-Suche).
- Kombinierbare Filter fuer Land, Waehrung und Sektor eingefuehrt; Optionen werden dynamisch aus `data/companies/index.json` erzeugt.
- Leerzustand und Ergebniszaehler fuer gefilterte Unternehmenskarten auf `aktien.html` ergaenzt.

---
## Version 0.44

- Aktienseite auf dynamisches Rendering aus `data/companies/index.json` umgestellt (vollstaendig klickbare, kompakte Unternehmenskarten).
- Neue Unternehmens-Detailseite `pages/unternehmen.html` mit robustem Laden per `symbol`, Lade-/Fehlerzustand und gruppierter Datendarstellung eingefuehrt.
- Neue statische Unternehmensdatenstruktur unter `data/companies/` inklusive `AAPL.json`, `TEST1.json` und unvollstaendigem `TEST2.json` fuer Robustheitstests angelegt.
- `main.js` und `style.css` behutsam fuer Stocks-Uebersicht und Unternehmensdetail erweitert (responsive, bestehender Stil beibehalten).

---
## Version 0.43

- `inventar.html` als Referenzartikel fuer Struktur und Layout definiert.
- Artikelstruktur auf alle Wiki-Fachartikel vereinheitlicht.
- Definition-Box mit Copy-Funktion als Standardstruktur in Artikeln verankert.
- Inhaltsnavigation (TOC) als Artikelstandard ueber die globale Artikellogik gefestigt.
- Artikeltemplate (`wiki/_template.html`) an den Referenzstandard angepasst.

---

## Version 0.42

- TOC links mit dezentem Rahmen als Navigationseinheit praezisiert.
- Definition-Box horizontal an die Artikelspalte angepasst.
- Artikellayout weiter verfeinert.

---

## Version 0.41

- Sticky Inhaltsnavigation (TOC) fuer laengere Artikel ergaenzt.
- Automatische Abschnittsnavigation links neben Artikeln umgesetzt.
- Definition-Box mit Copy-Funktion eingefuehrt.
- Artikelnavigation verbessert.

---

## Version 0.40

- Lead-Abstand unter Artikeltiteln leicht erhoeht.
- Typografischer Unterschied zwischen H2 und Fliesstext reduziert.
- Absatzabstaende innerhalb von Artikeln kompakter gesetzt.
- Blockstruktur und Linienhierarchie unveraendert beibehalten.

---

## Version 0.39

- Vertikale Abstaende an Artikel-Trennlinien symmetrisch ausgerichtet.
- Normale Section-Linien und Block-Linien klarer hierarchisiert.
- Blockwechsel durch staerkere Trennlinien deutlicher hervorgehoben.

---

## Version 0.38

- Abstaende um Trennlinien in Artikelabschnitten symmetrisch ausgerichtet.
- Vertikale Section-Abstaende kompakter gesetzt.
- Linienstaerke unveraendert beibehalten.

---

## Version 0.37

- Abstaende innerhalb von Artikelbloecken reduziert.
- Blockabstaende kompakter gestaltet.
- Trennlinien symmetrisch zwischen Abschnitten ausgerichtet.

---


## Version 0.36

- Blockstruktur im Artikel visuell geschaerft.
- Geringere Abstaende innerhalb von Bloecken umgesetzt.
- Deutlich staerkere Trennlinien zwischen Bloecken eingefuehrt.

---
## Version 0.35

- Blocklogik in `inventar.html` ueber Abstands- und Linienhierarchie geschaerft.
- Zusammengehoerige Abschnitte innerhalb von Bloecken enger gefasst.
- Neue Bloecke durch staerkere Trennung klarer erkennbar gemacht.

---
## Version 0.34

- Blockdarstellung in `inventar.html` gestalterisch entschaerft.
- Gruppierung staerker ueber Abstaende und Hierarchie statt ueber harte Innenboxen geloest.
- Wiki-Charakter und Lesefluss im Artikel verbessert.

---
## Version 0.33

- Artikel-Blöcke horizontal ausgerichtet, um doppelte Einrückung zu vermeiden.

---
## Version 0.32

- Oberen Einstiegsbereich von `wiki/inventar.html` visuell verfeinert.
- Lead und Grundlagenblock rhythmischer und leichter gestaltet.
- Ersten Inhaltsblock gegenueber den unteren Bloecken gezielt differenziert.

---
## Version 0.31

- Artikeldarstellung in `wiki/inventar.html` um klar erkennbare Inhaltsblöcke erweitert.
- Logisch zusammengehörige Abschnitte in vier Blockgruppen strukturiert (Grundlagen, Anwendung, Verdichtung, Weiterführend).
- Interne Abstände innerhalb der Blöcke reduziert und zwischen Blöcken deutlich erhöht.
- Blöcke visuell dezent getrennt, um die Übersichtlichkeit innerhalb der bestehenden Haupt-Card zu verbessern.

---
## Version 0.30

- Offene Konsistenzluecken beim Artikelstandard geschlossen und Dateistand vollstaendig abgeglichen.
- `wiki/_template.html` auf denselben strukturellen Stand wie die modernisierten Artikel gebracht (`wiki-article-header`, Lead, einheitliche Sections und Anker-IDs).
- Alle vorhandenen Wiki-Artikel auf konsistenten Backlink-Text, Section-Struktur und `link-list` fuer "Aehnliche Themen" vereinheitlicht.
- Artikelbezogene CSS-Regeln auf wirksame Selektoren abgestimmt (`.wiki-article-header`, `.wiki-article .link-list`) ohne Sonderbreite.

---
## Version 0.29

- Verbindlichen MarktWiki-Artikelstandard in `ARTICLE_RULES.md` konsistent dokumentiert.
- `wiki/_template.html` vollständig auf den aktuellen Artikelstandard umgestellt.
- Bestehende Wiki-Artikel strukturell an den Standard angepasst.
- Backlink auf "? Zurück zur Artikelübersicht" vereinheitlicht.
- Artikelstruktur, Section-Trennung, Lead und Anker-IDs konsistent umgesetzt.

---
## Version 0.28

- Alle vorhandenen Wiki-Artikel an den aktuellen MarktWiki-Standard angepasst.
- Struktur und Abschnittslogik vereinheitlicht.
- Backlink, Typografie und Section-Trennung konsistent umgesetzt.
- Abschnittsanker in Artikeln ergänzt und vereinheitlicht.

---
## Version 0.27

- Reduzierte Sonderbreite fuer Wiki-Artikel zurueckgenommen; Lesbarkeitsverbesserung erfolgt nun ueber innere Struktur und Typografie.

---
## Version 0.26

- Lesbarkeit der Wiki-Artikel verbessert (feste Artikelbreite, typografische Optimierung, Abschnittsanker hinzugefügt).

---
## Version 0.25

- Darstellung der Wiki-Artikel verbessert (Section-Trennung, Lead-Hervorhebung, feste Artikelbreite, Backlink angepasst).

---
## Version 0.24

- Bestehende Wiki-Artikel an den neuen Artikelstandard angepasst.
- Struktur, Einstiege und Abschnittslogik vereinheitlicht.
- Praxisbezug und Einordnung in vorhandenen Artikeln ueberarbeitet.

---
## Version 0.23

- Neuer verbindlicher Artikelstandard für MarktWiki definiert.
- `ARTICLE_RULES.md` als verbindliche Redaktionsgrundlage für Wiki-Artikel angelegt.
- Neues Artikel-Template unter `wiki/_template.html` erstellt.

---
## Version 0.22

- Suchfeld im Header horizontal exakt zentriert und Header-Layout stabilisiert.

---
## Version 0.21

- Glossar/Begriffe-System vollständig aus dem Projekt entfernt, inklusive Navigation, Datenstruktur und verwaister Logik.
- Entfernt: `begriffe.html`, `pages/begriff.html`, `data/begriffe.json` sowie alle zugehörigen Links in `sitemap.xml`.
- Header-Navigation auf die drei Hauptpunkte konsolidiert: Wiki, Aktien, Werkzeuge; globale Suche auf Themenquellen reduziert.
- JS/CSS/QA bereinigt: Glossar-Renderpfade und Begriff-Detaillogik aus `main.js` entfernt, Begriffe aus `layout.js`-Suchindex entfernt, Glossar-Styles und QA-Checks für Begriffsdaten entfernt.

---
## Version 0.20

- Kontrollierter Projekt-Cleanup auf Basis des reduzierten MVP-Stands: offensichtliche Altlasten und veraltete Planungsreste entfernt (`_tmp_diff_preview.txt`, `wiki/STRUKTURPLAN.md`, `wiki/markt_wiki_kategorien.md`).
- Datenkonsistenz in `data/themen.json` bereinigt: alle verbleibenden Themen enthalten wieder valide, nicht-leere `inhalt.abschnitte`, passend zur bestehenden Validierungslogik.
- `style.css` von klar ungenutzten Legacy-Regeln bereinigt (`.wiki-list`, `.category-card`, `.category-card p`) ohne visuelle Aenderung der aktiven Seiten.

---
## Version 0.19

- Redundanten Hinweistext unter den optionalen ROI-Feldern Umsatz/Kosten entfernt, da die Feldinteraktion (deaktiviertes Gegenfeld mit "wird automatisch berechnet") das Verhalten bereits ausreichend erklärt.
- Bestehende Umsatz/Kosten-Logik und Platzhalter-/Auto-Hinweis im deaktivierten Feld unverändert beibehalten.
- Formularbereich dadurch visuell ruhiger und kompakter gehalten, ohne Layout- oder Designänderung außerhalb des ROI-Rechners.

---
## Version 0.18

- Wiki-Hauptkategorie-Uebersicht (`wiki/index.html`) optisch auf den kompakten internen Seitenkopf umgestellt (Ruecklink + H1), analog zur reduzierten Kopfstruktur der Unterkategorie-Seiten.
- Grosse Intro-/Hero-Card auf der Hauptkategorie-Uebersicht vollstaendig entfernt, damit der Inhalt ohne zusaetzlichen Einleitungsblock weiter oben beginnt.
- Abschnittsstruktur unterhalb des Kopfbereichs beibehalten und funktionale Kategorie-Links unveraendert gelassen.

---
## Version 0.17

- ROI-Rechner auf fachï¿½bliche Benennung umgestellt: Haupttitel jetzt "Return-on-Investment-Rechner (ROI)".
- Ergebnisï¿½bersicht bereinigt: qualitative Kennzahl "Einordnung" vollstï¿½ndig entfernt, Ausgabe bleibt bei neutralen, berechneten Kennzahlen.
- UX fï¿½r optionale Felder Umsatz/Kosten vereinfacht: bei Eingabe in einem Feld wird das andere sichtbar deaktiviert und als "wird automatisch berechnet" gefï¿½hrt; Konsistenzregel Gewinn + Kosten = Umsatz bleibt bei Doppelangabe strikt mit Fehlermeldung.

---
## Version 0.16

- Wiki als Test-/MVP-Bestand auf exakt 2 Hauptkategorien, 4 Unterkategorien und 8 Artikel reduziert.
- Alle nicht benoetigten Kategorie-, Unterkategorie- und Artikelseiten unter `/wiki` entfernt und verbleibende Wiki-Navigation entsprechend bereinigt.
- Referenzen und Datenquellen auf den reduzierten Bestand konsolidiert (`wiki/index.html`, `data/kategorien.json`, `data/themen.json`, `data/begriffe.json`, `sitemap.xml`), damit keine verwaisten Links/Eintraege verbleiben.

---
## Version 0.15

- Hauptkategorie-Cards auf der Wiki-Uebersicht entschlackt: interne CTA-/Meta-Elemente entfernt, Fokus auf Titel und kurzen Beschreibungstext bei unveraenderter voller Klickflaeche.
- Unterkategorie-Seiten (`kategorie-*.html`) strukturell an die Hauptkategorie-Darstellung angeglichen: kompakter Seitenkopf, einspaltige Vollbreiten-Card-Links ohne interne Buttons.
- Artikel-Card-Listen buendig ausgerichtet: Einrueckung fuer `link-list article-card-list` gezielt entfernt, damit Artikel-Cards mit dem Inhaltsraster starten.

---
## Version 0.14

- ROI-Rechner fachlich korrigiert: optionale Felder Umsatz/Kosten werden nun konsistent behandelt (fehlender Wert wird aus Gewinn hergeleitet; bei drei angegebenen Werten wird Gewinn + Kosten = Umsatz strikt geprÃ¼ft).
- Bei widersprÃ¼chlichen Angaben zu Gewinn, Umsatz und Kosten wird die Berechnung abgebrochen und eine klare Fehlermeldung im UI ausgegeben, ohne stille Korrektur.
- Formular- und ErklÃ¤rungstexte prÃ¤zisiert (Pflichtfelder klar markiert, Regeln fÃ¼r optionale Felder transparent erklÃ¤rt) sowie Ergebnisdarstellung um automatisch hergeleitete Werte gekennzeichnet.

---
## Version 0.13

- ROI-Rechner in Struktur und UX auf das Muster des Spar- und Zinsrechners angehoben: klar gegliederte Eingabegruppen, Berechnen-Button, getrennte Ergebnis- und Visualisierungsboxen.
- Ergebnisbereich erweitert um ROI in Prozent, Gewinn/Investition absolut, Einordnung der Kapitalrendite sowie optionale Zusatzkennzahlen aus Umsatz und Kosten (Marge, Kostenquote, Vergleich Gewinn vs. Umsatz-Kosten).
- Neue visuelle ROI-Auswertung ohne externe Libraries ergÃ¤nzt (vergleichende Balkendarstellung fÃ¼r Investition und Gewinn/Verlust) sowie erlÃ¤uternder Informationsbereich mit sachlichen InfoblÃ¶cken unterhalb der Ergebnisse.

---
## Version 0.12

- Interne Seitenkoepfe auf den drei Wiki-Ebenen (Hauptkategorie, Unterkategorie, Artikel-Uebersicht) entschlackt: grosse Intro-Card entfernt, stattdessen kompakter Kopfbereich mit Ruecklink/Pfad und klarer Ueberschrift.
- Erklaerende Einleitungstexte im Kopfbereich entfernt, damit der eigentliche Listen-/Card-Inhalt frueher beginnt und weniger vertikaler Leerraum entsteht.
- Abstaende fuer den neuen kompakten Kopfbereich in style.css vereinheitlicht, ohne die bestehende MarktWiki-Designsprache zu veraendern.

---
## Version 0.11

- Wiki-Hauptkategorien auf eine dauerhaft einspaltige Vollbreiten-Darstellung umgestellt, damit die Auswahl klarer und konsistenter untereinander erfassbar bleibt.
- Unterkategorien visuell an die Hauptkategorie-Logik angenaehert (einspaltig, ruhige Vollbreiten-Cards, konsistente Abstaende und Hierarchie).
- Artikel-Listen in allen Unterkategorie-Seiten auf kompakte Card-Links umgestellt (platzsparend, scanbar, klar klickbar statt Bullet-Liste).

---
## Version 0.10

- Hover-Tooltip im Jahresdiagramm auf sofortige Einblendung umgestellt (direkt beim Ãœberfahren der Balken ohne merkliche VerzÃ¶gerung) und auf Pointer-Events fÃ¼r stabile Reaktion angepasst.
- Tooltip sprachlich vereinfacht und nutzerfreundlich strukturiert: Jahr, Startkapital + Einzahlungen, Zinsen und Gesamtbetrag in kompakter Reihenfolge.
- Tooltip optisch beruhigt und lesbarer gestaltet (eigene Kartenoptik im MarktWiki-Stil, klare Typografie, bessere Positionierung mit Kantenlogik ohne Abschneiden im Viewport).

---
## Version 0.9

- Jahresdiagramm des Spar- und Zinsrechners auf laufzeitadaptive Skalierung ohne Horizontal-Scroll umgestellt (Balkenbreite und AbstÃ¤nde passen sich automatisch an).
- Achsenbeschriftung bei langen Laufzeiten reduziert (dynamischer Label-Schritt je nach Dichte), bei kurzen Laufzeiten weiterhin vollstÃ¤ndig und gut lesbar.
- Diagramm bleibt innerhalb des Containers responsiv kompakt; Endwert bleibt Ã¼ber die ruhige Summenzeile klar hervorgehoben.

---

## Version 0.8

- UI/UX des Spar- und Zinsrechners als klarer Finanzrechner strukturiert: drei saubere Eingabegruppen (Grunddaten, Sparen, Verzinsung), konsistente FeldgrÃ¶ÃŸen und kompakter Aktionen-Bereich.
- Ergebnisfluss geschÃ¤rft: vor Klick auf "Berechnen" keinerlei Ergebnisdarstellung; nach EingabeÃ¤nderungen erneute Berechnung per Klick erforderlich.
- Ergebnisdarstellung konsolidiert: ruhige KennzahlenÃ¼bersicht, lesbarer Verteilbalken und entschlacktes Jahresdiagramm mit kompakter Endwert-Summenzeile statt permanenter Summen je Balken.

---
## Version 0.7

- Ergebnisfreigabe im Spar- und Zinsrechner beibehalten: Ergebnisse bleiben bis zum ersten Klick auf "Berechnen" ausgeblendet; danach werden Ã„nderungen direkt mit aktualisierten Werten dargestellt.
- Diagramm-Summenzeile sprachlich vereinfacht (klarer Endwerttext mit korrekter Jahr/Jahren-Form).
- Bestehende Gruppenstruktur (Grunddaten, Sparen, Verzinsung) und aufgerÃ¤umtes Layout konsolidiert.

---

## Version 0.6

- Ergebnisanzeige des Spar- und Zinsrechners auf expliziten Klick umgestellt: Ausgabe, Verteilbalken und Jahresdiagramm bleiben bis "Berechnen" vollstÃ¤ndig ausgeblendet.
- Eingabemaske im bestehenden Design weiter bereinigt (klare Gruppierung, einheitliche FeldgrÃ¶ÃŸen, eigener Aktionen-Bereich mit Berechnen-Button).
- Jahresdiagramm entschlackt: keine dauerhaften Summen Ã¼ber jedem Balken mehr, stattdessen kompakte Endwert-Zeile und Detailwerte per Tooltip.

---

## Version 0.5

- Eingabebereich des Spar- und Zinsrechners strukturiert und optisch vereinheitlicht (klare Gruppierung, einheitliche FeldgrÃ¶ÃŸen, bessere Lesbarkeit).
- Berechnungslogik fachlich auf Monatsbasis vereinheitlicht und fÃ¼r alle Kombinationen aus Spar- und Verzinsungsintervall nachvollziehbar korrigiert.
- Unterhalb des Verteilbalkens ein gestapeltes Jahres-Balkendiagramm ergÃ¤nzt (Startkapital + Einzahlungen vs. Zinsen pro Jahr).

---

## Version 0.4

- Zinseszins-Rechner zu einem Spar- und Zinsrechner erweitert (Startkapital, Sparrate, Verzinsungs- und Sparintervall, Laufzeit).
- Berechnung auf Prozent-Eingaben umgestellt (z. B. 30 = 30 %, 0,5 = 0,5 %) inklusive robuster Validierung fÃ¼r negative und unvollstÃ¤ndige Eingaben.
- Ergebnisdarstellung ergÃ¤nzt um Gesamtbetrag, Sparbetrag und Zinsbetrag sowie eine proportionale Balkenvisualisierung der Anteile.

---

## Version 0.3

- Auf Basis von wiki/STRUKTURPLAN.md wurden fuer alle definierten Themen eigenstaendige Wiki-Artikel als HTML-Dateien im Ordner /wiki erstellt.
- Alle neuen Artikel folgen der verpflichtenden MarktWiki-Abschnittsstruktur (Titel, Einleitung, Definition, Erklaerung, Beispiel, Praxisbezug, Zusammenfassung).

---

## Version 0.2

- Neue Wiki-Artikelstruktur eingefuehrt.
- Neue Artikel werden als eigene HTML-Dateien im Ordner /wiki erstellt.
- Artikelvorlage unter /wiki/_template.html bereitgestellt.
- Inhaltsverwaltung in PROJECT_RULES.md auf die neue Struktur angepasst.
- Betrifft: Wiki-Inhaltsstruktur, Redaktionsworkflow, SEO/Wartbarkeit.

---

## Version 0.1

Projektstart

- Grundstruktur erstellt
- Startseite erstellt
- Themenstruktur erstellt
- 10 Beispielthemen hinzugefÃ¼gt
- Glossar erstellt
- 5 Beispielbegriffe hinzugefÃ¼gt
- Werkzeuge-Seite erstellt
- Zinseszins Rechner erstellt
- ROI Rechner erstellt
- Footer erweitert
- Suchfeld im Header ergÃ¤nzt

---

Regeln fÃ¼r zukÃ¼nftige EintrÃ¤ge:

Neue Ã„nderungen mÃ¼ssen IMMER oben ergÃ¤nzt werden.

Format:

## Version X.X

Datum optional

- Ã„nderung 1
- Ã„nderung 2
- Ã„nderung 3




































