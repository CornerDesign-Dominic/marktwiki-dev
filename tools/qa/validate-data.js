#!/usr/bin/env node
"use strict";

const path = require("path");
const { readJsonFile, relativeFromRoot } = require("./lib");

const rootDir = path.resolve(__dirname, "../..");
const dataDir = path.join(rootDir, "data");

const issues = {
  errors: [],
  warnings: []
};

function addIssue(level, code, location, message) {
  issues[level].push({ code, location, message });
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateJsonFile(fileName) {
  const fullPath = path.join(dataDir, fileName);
  try {
    return readJsonFile(fullPath);
  } catch (error) {
    addIssue("errors", "json-invalid", `data/${fileName}`, `Ungültiges JSON: ${error.message}`);
    return null;
  }
}

function validateTopics(topics, categoryTitles, termLabels) {
  if (!Array.isArray(topics)) {
    addIssue("errors", "wrong-type", "data/themen.json", "Erwartet wird ein Array.");
    return { topicIds: new Set(), topicSlugs: new Set() };
  }

  const topicIds = new Set();
  const topicSlugs = new Set();

  topics.forEach((topic, index) => {
    const location = `data/themen.json[${index}]`;

    if (!topic || typeof topic !== "object") {
      addIssue("errors", "wrong-type", location, "Datensatz muss ein Objekt sein.");
      return;
    }

    const requiredFields = ["id", "titel", "kategorie", "unterkategorie", "beschreibung", "inhalt"];
    requiredFields.forEach((field) => {
      if (!(field in topic)) {
        addIssue("errors", "missing-field", location, `Pflichtfeld fehlt: ${field}`);
      }
    });

    if (!isNonEmptyString(topic.id)) {
      addIssue("errors", "empty-id", location, "Feld id fehlt oder ist leer.");
    } else {
      if (topicIds.has(topic.id)) {
        addIssue("errors", "duplicate-id", location, `Doppelte Themen-ID: ${topic.id}`);
      }
      topicIds.add(topic.id);
    }

    if (!isNonEmptyString(topic.titel)) {
      addIssue("errors", "empty-title", location, "Feld titel fehlt oder ist leer.");
    }

    if (!isNonEmptyString(topic.kategorie)) {
      addIssue("errors", "empty-category", location, "Feld kategorie fehlt oder ist leer.");
    } else if (categoryTitles.size > 0 && !categoryTitles.has(topic.kategorie)) {
      addIssue("warnings", "unknown-category", location, `Kategorie nicht in kategorien.json gefunden: ${topic.kategorie}`);
    }

    if (!isNonEmptyString(topic.unterkategorie)) {
      addIssue("errors", "empty-subcategory", location, "Feld unterkategorie fehlt oder ist leer.");
    }

    if (!isNonEmptyString(topic.beschreibung)) {
      addIssue("errors", "empty-description", location, "Feld beschreibung fehlt oder ist leer.");
    }

    if (topic.slug !== undefined) {
      if (!isNonEmptyString(topic.slug)) {
        addIssue("errors", "empty-slug", location, "Feld slug ist vorhanden, aber leer.");
      } else {
        if (topicSlugs.has(topic.slug)) {
          addIssue("errors", "duplicate-slug", location, `Doppelter Themen-Slug: ${topic.slug}`);
        }
        topicSlugs.add(topic.slug);
      }
    }

    if (!topic.inhalt || typeof topic.inhalt !== "object") {
      addIssue("errors", "missing-content", location, "Feld inhalt fehlt oder ist kein Objekt.");
    } else {
      if (!isNonEmptyString(topic.inhalt.einleitung)) {
        addIssue("errors", "missing-intro", location, "Feld inhalt.einleitung fehlt oder ist leer.");
      }

      if (!Array.isArray(topic.inhalt.abschnitte) || topic.inhalt.abschnitte.length === 0) {
        addIssue("errors", "missing-sections", location, "Feld inhalt.abschnitte fehlt oder ist leer.");
      } else {
        topic.inhalt.abschnitte.forEach((section, sectionIndex) => {
          const sectionLocation = `${location}.inhalt.abschnitte[${sectionIndex}]`;
          if (!section || typeof section !== "object") {
            addIssue("errors", "wrong-type", sectionLocation, "Abschnitt muss ein Objekt sein.");
            return;
          }
          if (!isNonEmptyString(section.titel)) {
            addIssue("errors", "empty-section-title", sectionLocation, "Abschnittstitel fehlt oder ist leer.");
          }
          if (!isNonEmptyString(section.text)) {
            addIssue("errors", "empty-section-text", sectionLocation, "Abschnittstext fehlt oder ist leer.");
          }
        });
      }
    }

    if (topic.artikelPfad !== undefined && !isNonEmptyString(topic.artikelPfad)) {
      addIssue("errors", "empty-article-path", location, "Feld artikelPfad ist vorhanden, aber leer.");
    }

    if (topic.verwandteBegriffe !== undefined) {
      if (!Array.isArray(topic.verwandteBegriffe)) {
        addIssue("errors", "wrong-type", location, "Feld verwandteBegriffe muss ein Array sein.");
      } else {
        topic.verwandteBegriffe.forEach((label, labelIndex) => {
          const refLocation = `${location}.verwandteBegriffe[${labelIndex}]`;
          if (!isNonEmptyString(label)) {
            addIssue("errors", "empty-reference", refLocation, "Verwandter Begriff ist leer.");
            return;
          }
          if (!termLabels.has(label)) {
            addIssue("errors", "invalid-reference", refLocation, `Verweis auf unbekannten Begriff: ${label}`);
          }
        });
      }
    }
  });

  return { topicIds, topicSlugs };
}

function validateTerms(terms, topicIds) {
  if (!Array.isArray(terms)) {
    addIssue("errors", "wrong-type", "data/begriffe.json", "Erwartet wird ein Array.");
    return { termSlugs: new Set(), termLabels: new Set() };
  }

  const termSlugs = new Set();
  const termLabels = new Set();

  terms.forEach((term, index) => {
    const location = `data/begriffe.json[${index}]`;

    if (!term || typeof term !== "object") {
      addIssue("errors", "wrong-type", location, "Datensatz muss ein Objekt sein.");
      return;
    }

    ["begriff", "slug", "definition"].forEach((field) => {
      if (!(field in term)) {
        addIssue("errors", "missing-field", location, `Pflichtfeld fehlt: ${field}`);
      }
    });

    if (!isNonEmptyString(term.begriff)) {
      addIssue("errors", "empty-title", location, "Feld begriff fehlt oder ist leer.");
    } else {
      termLabels.add(term.begriff);
    }

    if (!isNonEmptyString(term.slug)) {
      addIssue("errors", "empty-slug", location, "Feld slug fehlt oder ist leer.");
    } else {
      if (termSlugs.has(term.slug)) {
        addIssue("errors", "duplicate-slug", location, `Doppelter Begriffs-Slug: ${term.slug}`);
      }
      termSlugs.add(term.slug);
    }

    if (!isNonEmptyString(term.definition)) {
      addIssue("errors", "empty-definition", location, "Feld definition fehlt oder ist leer.");
    }

    if (term.verwendetIn !== undefined) {
      if (!Array.isArray(term.verwendetIn)) {
        addIssue("errors", "wrong-type", location, "Feld verwendetIn muss ein Array sein.");
      } else {
        term.verwendetIn.forEach((topicId, topicIndex) => {
          const refLocation = `${location}.verwendetIn[${topicIndex}]`;
          if (!isNonEmptyString(topicId)) {
            addIssue("errors", "empty-reference", refLocation, "Themenreferenz ist leer.");
            return;
          }
          if (topicIds.size > 0 && !topicIds.has(topicId)) {
            addIssue("errors", "invalid-reference", refLocation, `Verweis auf unbekanntes Thema: ${topicId}`);
          }
        });
      }
    }
  });

  return { termSlugs, termLabels };
}

function printIssues() {
  const all = [...issues.errors.map((x) => ({ ...x, level: "ERROR" })), ...issues.warnings.map((x) => ({ ...x, level: "WARN" }))];

  if (all.length === 0) {
    console.log("[OK] Datenvalidierung: keine Probleme gefunden.");
    return;
  }

  all.forEach((item) => {
    console.log(`[${item.level}] ${item.code} | ${item.location} | ${item.message}`);
  });

  console.log("");
  console.log(`Zusammenfassung: ${issues.errors.length} Fehler, ${issues.warnings.length} Warnungen`);
}

function main() {
  const topics = validateJsonFile("themen.json");
  const terms = validateJsonFile("begriffe.json");
  const categories = validateJsonFile("kategorien.json");

  const categoryTitles = new Set(
    Array.isArray(categories)
      ? categories
          .map((entry) => (entry && typeof entry === "object" ? entry.titel : ""))
          .filter((x) => isNonEmptyString(x))
      : []
  );

  const termLabels = new Set(
    Array.isArray(terms)
      ? terms
          .map((entry) => (entry && typeof entry === "object" ? entry.begriff : ""))
          .filter((x) => isNonEmptyString(x))
      : []
  );

  const { topicIds } = validateTopics(topics, categoryTitles, termLabels);
  validateTerms(terms, topicIds);

  printIssues();

  if (issues.errors.length > 0) {
    process.exitCode = 1;
  }
}

main();