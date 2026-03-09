# MarktWiki Changelog

## Version 0.10

- Hover-Tooltip im Jahresdiagramm auf sofortige Einblendung umgestellt (direkt beim Überfahren der Balken ohne merkliche Verzögerung) und auf Pointer-Events für stabile Reaktion angepasst.
- Tooltip sprachlich vereinfacht und nutzerfreundlich strukturiert: Jahr, Startkapital + Einzahlungen, Zinsen und Gesamtbetrag in kompakter Reihenfolge.
- Tooltip optisch beruhigt und lesbarer gestaltet (eigene Kartenoptik im MarktWiki-Stil, klare Typografie, bessere Positionierung mit Kantenlogik ohne Abschneiden im Viewport).

---
## Version 0.9

- Jahresdiagramm des Spar- und Zinsrechners auf laufzeitadaptive Skalierung ohne Horizontal-Scroll umgestellt (Balkenbreite und Abstände passen sich automatisch an).
- Achsenbeschriftung bei langen Laufzeiten reduziert (dynamischer Label-Schritt je nach Dichte), bei kurzen Laufzeiten weiterhin vollständig und gut lesbar.
- Diagramm bleibt innerhalb des Containers responsiv kompakt; Endwert bleibt über die ruhige Summenzeile klar hervorgehoben.

---

## Version 0.8

- UI/UX des Spar- und Zinsrechners als klarer Finanzrechner strukturiert: drei saubere Eingabegruppen (Grunddaten, Sparen, Verzinsung), konsistente Feldgrößen und kompakter Aktionen-Bereich.
- Ergebnisfluss geschärft: vor Klick auf "Berechnen" keinerlei Ergebnisdarstellung; nach Eingabeänderungen erneute Berechnung per Klick erforderlich.
- Ergebnisdarstellung konsolidiert: ruhige Kennzahlenübersicht, lesbarer Verteilbalken und entschlacktes Jahresdiagramm mit kompakter Endwert-Summenzeile statt permanenter Summen je Balken.

---
## Version 0.7

- Ergebnisfreigabe im Spar- und Zinsrechner beibehalten: Ergebnisse bleiben bis zum ersten Klick auf "Berechnen" ausgeblendet; danach werden Änderungen direkt mit aktualisierten Werten dargestellt.
- Diagramm-Summenzeile sprachlich vereinfacht (klarer Endwerttext mit korrekter Jahr/Jahren-Form).
- Bestehende Gruppenstruktur (Grunddaten, Sparen, Verzinsung) und aufgeräumtes Layout konsolidiert.

---

## Version 0.6

- Ergebnisanzeige des Spar- und Zinsrechners auf expliziten Klick umgestellt: Ausgabe, Verteilbalken und Jahresdiagramm bleiben bis "Berechnen" vollständig ausgeblendet.
- Eingabemaske im bestehenden Design weiter bereinigt (klare Gruppierung, einheitliche Feldgrößen, eigener Aktionen-Bereich mit Berechnen-Button).
- Jahresdiagramm entschlackt: keine dauerhaften Summen über jedem Balken mehr, stattdessen kompakte Endwert-Zeile und Detailwerte per Tooltip.

---

## Version 0.5

- Eingabebereich des Spar- und Zinsrechners strukturiert und optisch vereinheitlicht (klare Gruppierung, einheitliche Feldgrößen, bessere Lesbarkeit).
- Berechnungslogik fachlich auf Monatsbasis vereinheitlicht und für alle Kombinationen aus Spar- und Verzinsungsintervall nachvollziehbar korrigiert.
- Unterhalb des Verteilbalkens ein gestapeltes Jahres-Balkendiagramm ergänzt (Startkapital + Einzahlungen vs. Zinsen pro Jahr).

---

## Version 0.4

- Zinseszins-Rechner zu einem Spar- und Zinsrechner erweitert (Startkapital, Sparrate, Verzinsungs- und Sparintervall, Laufzeit).
- Berechnung auf Prozent-Eingaben umgestellt (z. B. 30 = 30 %, 0,5 = 0,5 %) inklusive robuster Validierung für negative und unvollständige Eingaben.
- Ergebnisdarstellung ergänzt um Gesamtbetrag, Sparbetrag und Zinsbetrag sowie eine proportionale Balkenvisualisierung der Anteile.

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
- 10 Beispielthemen hinzugefügt
- Glossar erstellt
- 5 Beispielbegriffe hinzugefügt
- Werkzeuge-Seite erstellt
- Zinseszins Rechner erstellt
- ROI Rechner erstellt
- Footer erweitert
- Suchfeld im Header ergänzt

---

Regeln für zukünftige Einträge:

Neue Änderungen müssen IMMER oben ergänzt werden.

Format:

## Version X.X

Datum optional

- Änderung 1
- Änderung 2
- Änderung 3





