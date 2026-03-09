#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  readJsonFile,
  walkFiles,
  relativeFromRoot,
  resolveInternalTarget,
  targetExists
} = require("./lib");

const rootDir = path.resolve(__dirname, "../..");
const dataDir = path.join(rootDir, "data");

const issues = [];

function addIssue(type, source, target, message) {
  issues.push({ type, source, target, message });
}

function extractAttrValues(html, tagName, attrName) {
  const values = [];
  const tagRegex = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  const attrRegex = new RegExp(`${attrName}\\s*=\\s*([\"'])(.*?)\\1`, "i");

  let tagMatch;
  while ((tagMatch = tagRegex.exec(html)) !== null) {
    const tagText = tagMatch[0];
    const attrMatch = tagText.match(attrRegex);
    if (!attrMatch) {
      continue;
    }
    values.push(attrMatch[2]);
  }

  return values;
}

function checkHtmlFile(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");

  const linkHrefs = extractAttrValues(html, "a", "href");
  const stylesheetHrefs = extractAttrValues(html, "link", "href").filter((href) => href && !/^https?:\/\//i.test(href));
  const scriptSrcs = extractAttrValues(html, "script", "src");

  const checks = [
    ...linkHrefs.map((url) => ({ type: "html-link", url })),
    ...stylesheetHrefs.map((url) => ({ type: "css-link", url })),
    ...scriptSrcs.map((url) => ({ type: "script-link", url }))
  ];

  checks.forEach((item) => {
    const targetPath = resolveInternalTarget(rootDir, htmlPath, item.url);
    if (!targetPath) {
      return;
    }

    if (!targetExists(targetPath)) {
      addIssue(
        item.type,
        relativeFromRoot(rootDir, htmlPath),
        item.url,
        `Interner Verweis zeigt auf kein existierendes Ziel (${relativeFromRoot(rootDir, targetPath)}).`
      );
    }
  });
}

function checkDataGeneratedLinks() {
  const topicsPath = path.join(dataDir, "themen.json");
  const termsPath = path.join(dataDir, "begriffe.json");
  const topicDetailPage = path.join(rootDir, "pages", "thema.html");
  const termDetailPage = path.join(rootDir, "pages", "begriff.html");

  let topics;
  let terms;

  try {
    topics = readJsonFile(topicsPath);
  } catch (error) {
    addIssue("data-link", "data/themen.json", "-", `Kann nicht geprüft werden: ${error.message}`);
    return;
  }

  try {
    terms = readJsonFile(termsPath);
  } catch (error) {
    addIssue("data-link", "data/begriffe.json", "-", `Kann nicht geprüft werden: ${error.message}`);
    return;
  }

  if (!Array.isArray(topics)) {
    addIssue("data-link", "data/themen.json", "-", "Erwartet wird ein Array.");
    return;
  }

  if (!Array.isArray(terms)) {
    addIssue("data-link", "data/begriffe.json", "-", "Erwartet wird ein Array.");
    return;
  }

  topics.forEach((topic, index) => {
    const source = `data/themen.json[${index}]`;

    if (topic && typeof topic === "object" && typeof topic.artikelPfad === "string" && topic.artikelPfad.trim()) {
      const targetPath = path.resolve(rootDir, topic.artikelPfad.replace(/^\.\//, ""));
      if (!targetExists(targetPath)) {
        addIssue("data-link", source, topic.artikelPfad, "artikelPfad verweist auf keine existierende Datei.");
      }
      return;
    }

    if (!targetExists(topicDetailPage)) {
      addIssue("data-link", source, "pages/thema.html", "Fallback-Zielseite pages/thema.html fehlt.");
    }
  });

  terms.forEach((term, index) => {
    const source = `data/begriffe.json[${index}]`;
    if (!targetExists(termDetailPage)) {
      addIssue("data-link", source, "pages/begriff.html", "Zielseite pages/begriff.html fehlt.");
    }
  });
}

function main() {
  const htmlFiles = walkFiles(rootDir, (filePath) => filePath.toLowerCase().endsWith(".html"));
  htmlFiles.forEach(checkHtmlFile);

  checkDataGeneratedLinks();

  if (issues.length === 0) {
    console.log("[OK] Broken-Link-Check: keine internen defekten Verweise gefunden.");
    return;
  }

  issues.forEach((issue) => {
    console.log(`[ERROR] ${issue.type} | ${issue.source} | ${issue.target} | ${issue.message}`);
  });

  console.log("");
  console.log(`Zusammenfassung: ${issues.length} defekte interne Verweise`);
  process.exitCode = 1;
}

main();